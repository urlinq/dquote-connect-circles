
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Share, Link as LinkIcon } from 'lucide-react';
import PostCard from '@/components/Posts/PostCard';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio?: string;
  profilePicUrl?: string;
  isVerified: boolean;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  likeCount: number;
  socialLinks?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
}

interface Post {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  text: string;
  imageUrl?: string;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, userProfile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = !username || username === currentUserProfile?.username;

  useEffect(() => {
    if (isOwnProfile && currentUserProfile) {
      const profileData: UserProfile = {
        uid: currentUserProfile.uid,
        username: currentUserProfile.username,
        displayName: currentUserProfile.displayName,
        bio: currentUserProfile.bio,
        profilePicUrl: currentUserProfile.profilePicUrl,
        isVerified: currentUserProfile.isVerified,
        isPrivate: currentUserProfile.isPrivate,
        followerCount: currentUserProfile.followerCount || 0,
        followingCount: currentUserProfile.followingCount || 0,
        postCount: currentUserProfile.postCount || 0,
        likeCount: currentUserProfile.likeCount || 0,
        socialLinks: currentUserProfile.socialLinks,
      };
      setProfile(profileData);
      fetchUserPosts(currentUserProfile.uid);
    } else if (username) {
      fetchUserProfile(username);
    }
  }, [username, currentUserProfile, isOwnProfile]);

  const fetchUserProfile = async (username: string) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        const profileData: UserProfile = {
          uid: userData.uid,
          username: userData.username,
          displayName: userData.displayName,
          bio: userData.bio,
          profilePicUrl: userData.profilePicUrl,
          isVerified: userData.isVerified || false,
          isPrivate: userData.isPrivate || false,
          followerCount: userData.followerCount || 0,
          followingCount: userData.followingCount || 0,
          postCount: userData.postCount || 0,
          likeCount: userData.likeCount || 0,
          socialLinks: userData.socialLinks,
        };
        setProfile(profileData);
        fetchUserPosts(userData.uid);
        checkFollowStatus(userData.uid);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId: string) => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const postsSnapshot = await getDocs(postsQuery);
      const fetchedPosts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Post[];

      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const checkFollowStatus = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      const followQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', currentUser.uid),
        where('followingId', '==', userId)
      );
      const followSnapshot = await getDocs(followQuery);
      setIsFollowing(!followSnapshot.empty);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/profile/${profile?.username}`;
    if (navigator.share) {
      navigator.share({
        title: `${profile?.displayName} (@${profile?.username}) - DQUOTE`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Profile link copied to clipboard!' });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">User not found</h2>
            <p className="text-gray-600 dark:text-gray-300">The profile you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-10">
          <h1 className="text-lg font-semibold">{profile.displayName}</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share size={18} />
            </Button>
            {isOwnProfile && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                <Settings size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.profilePicUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} />
                <AvatarFallback className="text-2xl">{profile.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-xl font-bold">{profile.displayName}</h2>
                  {profile.isVerified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      ✓
                    </Badge>
                  )}
                </div>
                <p className="text-gray-500 mb-2">@{profile.username}</p>
                
                {profile.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{profile.bio}</p>
                )}

                {profile.socialLinks && (
                  <div className="flex items-center space-x-4 mb-3">
                    {profile.socialLinks.website && (
                      <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center">
                        <LinkIcon size={16} className="mr-1" />
                        Website
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-6 text-sm">
                  <span><strong>{profile.followerCount}</strong> followers</span>
                  <span><strong>{profile.followingCount}</strong> following</span>
                  <span><strong>{profile.postCount}</strong> posts</span>
                  <span><strong>{profile.likeCount}</strong> likes</span>
                </div>
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <div className="mt-4">
                <Button className="w-full">
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Posts</h3>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-300">No posts yet.</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

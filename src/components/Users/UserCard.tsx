
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, deleteDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface UserCardProps {
  user: {
    uid: string;
    username: string;
    displayName: string;
    profilePicUrl?: string;
    isVerified: boolean;
    followerCount: number;
    bio?: string;
  };
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [currentUser, user.uid]);

  const checkFollowStatus = async () => {
    if (!currentUser) return;
    
    try {
      const followQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', currentUser.uid),
        where('followingId', '==', user.uid)
      );
      const followSnapshot = await getDocs(followQuery);
      setIsFollowing(!followSnapshot.empty);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || loading) return;
    
    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const followQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', currentUser.uid),
          where('followingId', '==', user.uid)
        );
        const followSnapshot = await getDocs(followQuery);
        if (!followSnapshot.empty) {
          await deleteDoc(followSnapshot.docs[0].ref);
        }
        setIsFollowing(false);
        toast({ title: 'Unfollowed', description: `You unfollowed @${user.username}` });
      } else {
        // Follow
        await setDoc(doc(collection(db, 'follows')), {
          followerId: currentUser.uid,
          followingId: user.uid,
          createdAt: new Date()
        });
        setIsFollowing(true);
        toast({ title: 'Following', description: `You are now following @${user.username}` });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({ title: 'Error', description: 'Failed to update follow status', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 flex-1 cursor-pointer"
            onClick={() => navigate(`/profile/${user.username}`)}
          >
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.profilePicUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
              <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-1">
                <p className="font-semibold">{user.displayName}</p>
                {user.isVerified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    ✓
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm">@{user.username}</p>
              {user.bio && (
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{user.bio}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">{user.followerCount} followers</p>
            </div>
          </div>
          
          {currentUser?.uid !== user.uid && (
            <Button
              variant={isFollowing ? "secondary" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={loading}
              className="ml-4"
            >
              {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;

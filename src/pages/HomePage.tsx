
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/Posts/PostCard';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const HomePage = () => {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    fetchFollowing();
  }, [user]);

  useEffect(() => {
    if (following.length >= 0) {
      fetchHomeFeed();
    }
  }, [following]);

  const fetchFollowing = async () => {
    if (!user) return;
    
    try {
      const followingQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', user.uid)
      );
      const followingSnapshot = await getDocs(followingQuery);
      const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);
      setFollowing(followingIds);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const fetchHomeFeed = async () => {
    try {
      let postsQuery;
      
      if (following.length > 0) {
        // Get posts from users we follow (limit to 10 for Firestore 'in' constraint)
        const followingChunk = following.slice(0, 10);
        postsQuery = query(
          collection(db, 'posts'),
          where('userId', 'in', followingChunk),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      } else {
        // If not following anyone, show popular posts
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('likeCount', 'desc'),
          limit(10)
        );
      }

      const postsSnapshot = await getDocs(postsQuery);
      const fetchedPosts = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          username: data.username,
          displayName: data.displayName,
          text: data.text,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt?.toDate() || new Date(),
          likeCount: data.likeCount || 0,
          commentCount: data.commentCount || 0,
          isLiked: data.isLiked || false,
        } as Post;
      });

      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching home feed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 py-4 mb-4">
          <h1 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400">DQUOTE</h1>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to DQUOTE!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {following.length === 0 
                  ? "Start following users to see their posts in your feed, or explore the discover page to find interesting content."
                  : "No posts yet from users you follow. Check out the explore page to discover new content!"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

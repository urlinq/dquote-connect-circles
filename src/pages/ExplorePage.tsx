
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PostCard from '@/components/Posts/PostCard';
import UserCard from '@/components/Users/UserCard';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
}

interface User {
  uid: string;
  username: string;
  displayName: string;
  profilePicUrl?: string;
  isVerified: boolean;
  followerCount: number;
}

const ExplorePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchPublicPosts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const fetchPublicPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('isPublic', '==', true),
        orderBy('likeCount', 'desc'),
        limit(20)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      const fetchedPosts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Post[];

      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setSearchLoading(true);
    try {
      // Search users
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '>=', searchTerm.toLowerCase()),
        where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        limit(10)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const searchedUsers = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];

      // Search posts
      const postsQuery = query(
        collection(db, 'posts'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      const allPosts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Post[];

      // Filter posts that contain search term
      const filteredPosts = allPosts.filter(post => 
        post.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setUsers(searchedUsers);
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 py-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search users and posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {searchTerm.trim() ? (
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-4 mt-4">
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : users.length > 0 ? (
                users.map(user => (
                  <UserCard key={user.uid} user={user} />
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No users found</p>
              )}
            </TabsContent>
            
            <TabsContent value="posts" className="space-y-4 mt-4">
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No posts found</p>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Discover</h2>
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;

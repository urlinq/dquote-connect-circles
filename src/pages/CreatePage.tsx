
import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, increment, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

const CreatePage = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const checkRateLimit = async () => {
    if (!user) return false;
    
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    const recentPostsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid),
      where('createdAt', '>', oneMinuteAgo),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const recentPosts = await getDocs(recentPostsQuery);
    return recentPosts.empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      toast({ title: 'Error', description: 'Please enter some text', variant: 'destructive' });
      return;
    }

    if (!user || !userProfile) return;

    setLoading(true);

    try {
      // Check rate limit
      const canPost = await checkRateLimit();
      if (!canPost) {
        toast({ 
          title: 'Too fast!', 
          description: 'You can only post once per minute', 
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      // Create post
      const postData = {
        userId: user.uid,
        username: userProfile.username,
        displayName: userProfile.displayName,
        text: text.trim(),
        imageUrl: imageUrl.trim() || null,
        createdAt: new Date(),
        likeCount: 0,
        commentCount: 0,
        isPublic: !userProfile.isPrivate
      };

      await addDoc(collection(db, 'posts'), postData);

      // Update user post count
      await updateDoc(doc(db, 'users', user.uid), {
        postCount: increment(1)
      });

      toast({ title: 'Posted!', description: 'Your post has been shared' });
      setText('');
      setImageUrl('');
      navigate('/home');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-10">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-lg font-semibold">Create Post</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={userProfile?.profilePicUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.username}`} />
                <AvatarFallback>{userProfile?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{userProfile?.displayName}</p>
                <p className="text-gray-500 text-sm">@{userProfile?.username}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-32 border-none resize-none text-lg placeholder:text-gray-400"
                maxLength={2000}
              />
              
              <div className="text-right text-sm text-gray-500">
                {text.length}/2000
              </div>

              <Input
                type="url"
                placeholder="Image URL (optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="border-gray-200 dark:border-gray-700"
              />

              {imageUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-auto max-h-64 object-cover"
                    onError={() => setImageUrl('')}
                  />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || !text.trim()} 
                className="w-full flex items-center space-x-2"
              >
                <Send size={18} />
                <span>{loading ? 'Creating...' : 'Create Post'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePage;

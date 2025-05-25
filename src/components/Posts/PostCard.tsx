
import React, { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { doc, updateDoc, increment, collection, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PostCardProps {
  post: {
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
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      const likeRef = collection(db, 'likes');
      const likeQuery = query(likeRef, where('postId', '==', post.id), where('userId', '==', user.uid));
      const likeSnapshot = await getDocs(likeQuery);

      if (liked) {
        // Unlike
        if (!likeSnapshot.empty) {
          await deleteDoc(likeSnapshot.docs[0].ref);
        }
        await updateDoc(doc(db, 'posts', post.id), {
          likeCount: increment(-1)
        });
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Like
        await addDoc(likeRef, {
          postId: post.id,
          userId: user.uid,
          createdAt: new Date()
        });
        await updateDoc(doc(db, 'posts', post.id), {
          likeCount: increment(1)
        });
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({ title: 'Error', description: 'Failed to update like', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      await navigator.share({
        title: `Post by @${post.username}`,
        text: post.text,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied!', description: 'Post link copied to clipboard' });
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} />
              <AvatarFallback>{post.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-1">
                <p className="font-semibold text-sm">{post.displayName}</p>
              </div>
              <p className="text-gray-500 text-xs">@{post.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500 text-xs">
            <span>{formatDate(post.createdAt)}</span>
            <Button variant="ghost" size="sm" className="p-1">
              <MoreHorizontal size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{post.text}</p>
          {post.imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt="Post content" 
                className="w-full h-auto max-h-96 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center space-x-1 ${liked ? 'text-red-500' : 'text-gray-500'}`}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-sm">{likeCount}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
              <MessageCircle size={18} />
              <span className="text-sm">{post.commentCount}</span>
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-gray-500">
            <Share size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;

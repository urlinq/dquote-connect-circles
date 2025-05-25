
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromProfilePic?: string;
  postId?: string;
  postText?: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('toUserId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const fetchedNotifications = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Notification[];

      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
          <h1 className="text-2xl font-bold text-center">Notifications</h1>
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No notifications yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                When people interact with your posts, you'll see notifications here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={!notification.read ? 'border-blue-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={notification.fromProfilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.fromUsername}`} />
                      <AvatarFallback>{notification.fromDisplayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{notification.fromDisplayName}</span>
                        <span className="text-gray-500 text-sm">@{notification.fromUsername}</span>
                        {notification.type === 'like' && <Badge variant="secondary">❤️</Badge>}
                        {notification.type === 'comment' && <Badge variant="secondary">💬</Badge>}
                        {notification.type === 'follow' && <Badge variant="secondary">👤</Badge>}
                        {notification.type === 'mention' && <Badge variant="secondary">@</Badge>}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">{notification.message}</p>
                      {notification.postText && (
                        <p className="text-gray-500 text-sm mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          "{notification.postText.substring(0, 100)}..."
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-2">
                        {notification.createdAt?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

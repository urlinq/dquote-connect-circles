
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Users, FileText, Shield, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { toast } from '@/hooks/use-toast';

interface VerificationRequest {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  profilePicUrl?: string;
}

interface UserStat {
  totalUsers: number;
  totalPosts: number;
  totalLikes: number;
  verifiedUsers: number;
}

const AdminPage = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [stats, setStats] = useState<UserStat>({ totalUsers: 0, totalPosts: 0, totalLikes: 0, verifiedUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (!userProfile?.isAdmin) {
      navigate('/home');
      return;
    }
    
    fetchVerificationRequests();
    fetchStats();
  }, [userProfile, navigate]);

  const fetchVerificationRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, 'verificationRequests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as VerificationRequest[];

      setVerificationRequests(requests);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      
      // Get verified users
      const verifiedQuery = query(collection(db, 'users'), where('isVerified', '==', true));
      const verifiedSnapshot = await getDocs(verifiedQuery);
      const verifiedUsers = verifiedSnapshot.size;

      // Get total posts
      const postsSnapshot = await getDocs(collection(db, 'posts'));
      const totalPosts = postsSnapshot.size;

      // Calculate total likes (sum of likeCount from all posts)
      let totalLikes = 0;
      postsSnapshot.docs.forEach(doc => {
        totalLikes += doc.data().likeCount || 0;
      });

      setStats({ totalUsers, totalPosts, totalLikes, verifiedUsers });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationDecision = async (requestId: string, decision: 'approved' | 'rejected', userId?: string) => {
    try {
      // Update verification request
      await updateDoc(doc(db, 'verificationRequests', requestId), {
        status: decision,
        reviewedAt: new Date(),
        reviewedBy: user?.uid
      });

      if (decision === 'approved' && userId) {
        // Update user verification status
        await updateDoc(doc(db, 'users', userId), {
          isVerified: true
        });
      }

      // Remove from local state
      setVerificationRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast({ 
        title: `Verification ${decision}`, 
        description: `Request has been ${decision}` 
      });
    } catch (error) {
      console.error('Error updating verification request:', error);
      toast({ title: 'Error', description: 'Failed to update verification request', variant: 'destructive' });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!userProfile?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6 sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-10">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verification">
              Verification Requests
              {verificationRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {verificationRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPosts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                  <span className="h-4 w-4 text-muted-foreground">❤️</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLikes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle>Pending Verification Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {verificationRequests.length === 0 ? (
                  <p className="text-center text-gray-600 dark:text-gray-300 py-8">
                    No pending verification requests
                  </p>
                ) : (
                  <div className="space-y-4">
                    {verificationRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={request.profilePicUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.username}`} />
                              <AvatarFallback>{request.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold">{request.displayName}</h3>
                                <span className="text-gray-500">@{request.username}</span>
                              </div>
                              
                              <p className="text-gray-700 dark:text-gray-300 mb-3">{request.bio}</p>
                              
                              {request.socialLinks && (
                                <div className="space-y-1 mb-3">
                                  {request.socialLinks.website && (
                                    <p className="text-sm text-blue-500">🌐 {request.socialLinks.website}</p>
                                  )}
                                  {request.socialLinks.twitter && (
                                    <p className="text-sm text-blue-500">🐦 {request.socialLinks.twitter}</p>
                                  )}
                                  {request.socialLinks.github && (
                                    <p className="text-sm text-blue-500">⚡ {request.socialLinks.github}</p>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-xs text-gray-400 mb-3">
                                Requested on {request.createdAt?.toLocaleDateString()}
                              </p>
                              
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleVerificationDecision(request.id, 'approved', request.userId)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle size={16} className="mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleVerificationDecision(request.id, 'rejected')}
                                >
                                  <XCircle size={16} className="mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600 dark:text-gray-300 py-8">
                  User management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;

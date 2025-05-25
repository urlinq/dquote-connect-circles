
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Moon, Sun, Shield, FileText, HelpCircle, LogOut, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isPrivate, setIsPrivate] = useState(userProfile?.isPrivate || false);
  const [loading, setLoading] = useState(false);

  const handlePrivacyToggle = async (checked: boolean) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isPrivate: checked
      });
      setIsPrivate(checked);
      toast({ 
        title: 'Privacy settings updated', 
        description: checked ? 'Your profile is now private' : 'Your profile is now public' 
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({ title: 'Error', description: 'Failed to update privacy settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: 'Password reset email sent', description: 'Check your email for reset instructions' });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast({ title: 'Error', description: 'Failed to send password reset email', variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({ title: 'Error', description: 'Failed to sign out', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6 sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-10">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>

        {/* Account Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield size={20} />
              <span>Account</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Private Account</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Only followers can see your posts and profile
                </p>
              </div>
              <Switch
                checked={isPrivate}
                onCheckedChange={handlePrivacyToggle}
                disabled={loading}
              />
            </div>
            
            <Button variant="outline" onClick={handlePasswordReset} className="w-full justify-start">
              <Lock size={18} className="mr-2" />
              Reset Password
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Toggle between light and dark themes
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/verification')} className="w-full justify-start">
              <Shield size={18} className="mr-2" />
              Request Verification
            </Button>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText size={20} />
              <span>Legal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" onClick={() => navigate('/terms')} className="w-full justify-start">
              <FileText size={18} className="mr-2" />
              Terms of Service
            </Button>
            <Button variant="outline" onClick={() => navigate('/privacy')} className="w-full justify-start">
              <Shield size={18} className="mr-2" />
              Privacy Policy
            </Button>
          </CardContent>
        </Card>

        {/* Admin Access */}
        {userProfile?.isAdmin && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate('/admin')} className="w-full justify-start">
                <Shield size={18} className="mr-2" />
                Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Card>
          <CardContent className="p-4">
            <Button variant="destructive" onClick={handleSignOut} className="w-full justify-start">
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;

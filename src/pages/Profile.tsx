import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/database.types';
import { User, Camera, LogOut, Mail, Key, Phone, MapPin } from 'lucide-react';
import ImageCropper from '../components/ImageCropper';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const getProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setAvatarUrl(data.avatar_url);
        setResetEmail(data.email);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setUpdating(true);
      const fileExt = 'jpg';
      const filePath = `${user!.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (profile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...profile,
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user!.id);

        if (error) throw error;
        setAvatarUrl(publicUrl);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
      setShowCropper(false);
      setSelectedImage(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setUpdating(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) throw error;
      setResetMessage('Password reset instructions sent to your email');
      setTimeout(() => {
        setShowPasswordReset(false);
        setResetMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setResetMessage('Failed to send reset instructions');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Profile Header with Sign Out */}
            <div className="flex justify-end mb-8">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>

            {/* Centered Profile Photo Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-full h-full p-6 text-gray-300" />
                  )}
                </div>
                {isEditing && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer"
                  >
                    <Camera className="h-5 w-5 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">{profile?.display_name}</h2>
              <p className="text-gray-500 text-center">@{profile?.username}</p>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                {isEditing ? 'Cancel editing' : 'Edit profile'}
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              {isEditing ? (
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="display_name"
                      value={profile?.display_name || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, display_name: e.target.value} : null)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={profile?.username || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, username: e.target.value} : null)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={profile?.phone || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      value={profile?.address || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, address: e.target.value} : null)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <dl className="divide-y divide-gray-200">
                      <div className="py-3 flex justify-between items-center">
                        <dt className="flex items-center text-sm font-medium text-gray-500">
                          <Mail className="h-5 w-5 mr-2" />
                          Email
                        </dt>
                        <dd className="text-sm text-gray-900">{profile?.email}</dd>
                      </div>
                      <div className="py-3 flex justify-between items-center">
                        <dt className="flex items-center text-sm font-medium text-gray-500">
                          <Phone className="h-5 w-5 mr-2" />
                          Phone
                        </dt>
                        <dd className="text-sm text-gray-900">{profile?.phone || 'Not set'}</dd>
                      </div>
                      <div className="py-3 flex justify-between items-center">
                        <dt className="flex items-center text-sm font-medium text-gray-500">
                          <MapPin className="h-5 w-5 mr-2" />
                          Address
                        </dt>
                        <dd className="text-sm text-gray-900">{profile?.address || 'Not set'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Key className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Password Settings</span>
                </div>
                <button
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Change Password
                </button>
              </div>

              {showPasswordReset && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      We'll send password reset instructions to your email address.
                    </p>
                    {resetMessage && (
                      <div className={`text-sm ${
                        resetMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {resetMessage}
                      </div>
                    )}
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reset Instructions
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordReset(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCropper && selectedImage && (
        <ImageCropper
          imageUrl={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setSelectedImage(null);
          }}
        />
      )}
    </div>
  );
}
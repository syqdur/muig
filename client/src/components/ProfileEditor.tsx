import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { Camera, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';

interface ProfileEditorProps {
  onClose: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ onClose }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [spotifyLink, setSpotifyLink] = useState(userProfile?.externalLinks?.spotify || '');
  const [instagramLink, setInstagramLink] = useState(userProfile?.externalLinks?.instagram || '');
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser || !userProfile) return null;

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `users/${currentUser.uid}/profile.${file.name.split('.').pop()}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      // Update user profile
      await updateUserProfile({ photoURL });
    } catch (error) {
      setError('Failed to upload photo');
      console.error('Photo upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!userProfile.photoURL) return;
    
    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    try {
      setUploading(true);
      
      // Delete from storage
      const storageRef = ref(storage, userProfile.photoURL);
      await deleteObject(storageRef);
      
      // Update user profile to remove photo URL
      await updateUserProfile({ photoURL: null });
    } catch (error) {
      setError('Failed to delete photo');
      console.error('Photo delete error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      const updates: any = {};
      
      // Add display name to updates if it has changed
      if (displayName.trim() && displayName.trim() !== userProfile?.displayName) {
        updates.displayName = displayName.trim();
      }
      
      if (bio.trim()) {
        updates.bio = bio.trim();
      }
      
      if (spotifyLink.trim() || instagramLink.trim()) {
        updates.externalLinks = {};
        if (spotifyLink.trim()) {
          updates.externalLinks.spotify = spotifyLink.trim();
        }
        if (instagramLink.trim()) {
          updates.externalLinks.instagram = instagramLink.trim();
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await updateUserProfile(updates);
      }
      
      onClose();
    } catch (error) {
      setError('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Profile Picture */}
          <div className="text-center">
            <div className="relative inline-block">
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-200 dark:border-gray-600"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mx-auto border-4 border-gray-200 dark:border-gray-600">
                  <Camera className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Camera className="w-4 h-4 inline mr-1" />
                Upload
              </button>
              
              {userProfile.photoURL && (
                <button
                  onClick={handleDeletePhoto}
                  disabled={uploading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dein Anzeigename"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {displayName.length}/50 Zeichen
            </p>
          </div>

          {/* Email (read-only with visibility toggle) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <button
                type="button"
                onClick={() => setShowEmail(!showEmail)}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showEmail ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    Verstecken
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    Anzeigen
                  </>
                )}
              </button>
            </div>
            <input
              type={showEmail ? "email" : "password"}
              value={showEmail ? userProfile.email : "••••••••••••••••"}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {bio.length}/500 characters
            </p>
          </div>

          {/* External Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Spotify Profile
            </label>
            <input
              type="url"
              value={spotifyLink}
              onChange={(e) => setSpotifyLink(e.target.value)}
              placeholder="https://open.spotify.com/user/..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instagram Profile
            </label>
            <input
              type="url"
              value={instagramLink}
              onChange={(e) => setInstagramLink(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
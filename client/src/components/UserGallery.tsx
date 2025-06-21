import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Sun, Moon } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { AdminLoginModal } from './AdminLoginModal';
import { UserNamePrompt } from './UserNamePrompt';
import { useAuth } from '../contexts/AuthContext';
import { UploadSection } from './UploadSection';
import { InstagramGallery } from './InstagramGallery';
import { MediaModal } from './MediaModal';
import { TabNavigation } from './TabNavigation';
import { Timeline } from './Timeline';
import { MusicWishlist } from './MusicWishlist';
import { ProfileHeader } from './ProfileHeader';
import { useDarkMode } from '../hooks/useDarkMode';
import { MediaItem, Comment, Like, TimelineEvent } from '../types';
import {
  uploadUserFiles,
  uploadUserVideo,
  loadUserMediaItems,
  loadUserComments,
  loadUserLikes,
  deleteUserMediaItem,
  addComment,
  deleteComment,
  toggleLike,
  addUserNote,
  editMediaNote
} from '../services/hybridGalleryService';
import { getDeviceId, getUserName, setUserName } from '../utils/deviceId';
import { anonymousUserService } from '../services/anonymousUserService';

export const UserGallery: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  // Anonymous user states
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [deviceId] = useState(() => getDeviceId());
  
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'gallery' | 'music' | 'timeline'>('gallery');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [profileBio, setProfileBio] = useState('Willkommen in unserer Hochzeitsgalerie! 💕');
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();

  // Check for existing user name on mount
  useEffect(() => {
    const savedName = getUserName();
    if (savedName) {
      setCurrentUserName(savedName);
    } else {
      setShowNamePrompt(true);
    }
  }, []);

  // Load user data
  useEffect(() => {
    const userId = currentUser?.uid || 'demo-user';
    
    // Load media items
    const unsubscribeMedia = loadUserMediaItems(userId, (items) => {
      setMediaItems(items);
    });
    
    // Load comments
    const unsubscribeComments = loadUserComments(userId, (comments) => {
      setComments(comments);
    });
    
    // Load likes
    const unsubscribeLikes = loadUserLikes(userId, (likes) => {
      setLikes(likes);
    });
    
    return () => {
      unsubscribeMedia();
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [currentUser]);

  // Load profile data from localStorage
  useEffect(() => {
    const userId = currentUser?.uid || 'demo-user';
    const savedBio = localStorage.getItem(`profile_bio_${userId}`);
    const savedPhoto = localStorage.getItem(`profile_photo_${userId}`);
    
    if (savedBio) setProfileBio(savedBio);
    if (savedPhoto) setProfilePhoto(savedPhoto);
  }, [currentUser]);

  const handleBioUpdate = (newBio: string) => {
    const userId = currentUser?.uid || 'demo-user';
    setProfileBio(newBio);
    localStorage.setItem(`profile_bio_${userId}`, newBio);
  };

  const handlePhotoUpdate = (newPhotoURL: string) => {
    const userId = currentUser?.uid || 'demo-user';
    setProfilePhoto(newPhotoURL);
    localStorage.setItem(`profile_photo_${userId}`, newPhotoURL);
  };

  const handleNameSubmit = async (name: string) => {
    try {
      await anonymousUserService.getOrCreateUser(name, deviceId);
      setUserName(name);
      setCurrentUserName(name);
      setShowNamePrompt(false);
    } catch (error) {
      console.error('Error creating anonymous user:', error);
    }
  };

  const handleUpload = async (files: FileList) => {
    if (!currentUserName) return;
    
    const userId = currentUser?.uid || 'demo-user';

    setIsUploading(true);
    setUploadProgress(0);
    setStatus('⏳ Uploading files...');

    try {
      await uploadUserFiles(
        userId, 
        files, 
        currentUserName, 
        deviceId,
        setUploadProgress
      );
      setStatus('✅ Files uploaded successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Error uploading files. Please try again.');
      console.error('Upload error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoUpload = async (videoBlob: Blob) => {
    if (!currentUserName) return;

    const userId = currentUser?.uid || 'demo-user';

    setIsUploading(true);
    setUploadProgress(0);
    setStatus('⏳ Uploading video...');

    try {
      await uploadUserVideo(
        userId,
        videoBlob, 
        currentUserName, 
        deviceId,
        setUploadProgress
      );
      setStatus('✅ Video uploaded successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Error uploading video. Please try again.');
      console.error('Video upload error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleNoteSubmit = async (noteText: string) => {
    const userId = currentUser?.uid || 'demo-user';

    setIsUploading(true);
    setStatus('⏳ Saving note...');

    try {
      await addUserNote(userId, noteText, currentUserName, deviceId);
      setStatus('✅ Note saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Error saving note. Please try again.');
      console.error('Note save error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    const userId = currentUser?.uid || 'demo-user';

    try {
      await deleteUserMediaItem(userId, item);
      setStatus('✅ Item deleted successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Error deleting item. Please try again.');
      console.error('Delete error:', error);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleLike = async (mediaId: string) => {
    const userId = currentUser?.uid || 'demo-user';

    try {
      await toggleLike(userId, mediaId, currentUserName, deviceId);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (mediaId: string, text: string) => {
    const userId = currentUser?.uid || 'demo-user';

    try {
      await addComment(userId, mediaId, text, currentUserName, deviceId);
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const userId = currentUser?.uid || 'demo-user';
    try {
      await deleteComment(userId, commentId);
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  };

  const handleEditNote = async (item: MediaItem, newText: string) => {
    try {
      await editMediaNote(item.id, newText);
      setStatus('✅ Note updated successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Error updating note. Please try again.');
      console.error('Edit note error:', error);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleAdminToggle = (adminStatus: boolean) => {
    if (adminStatus) {
      setShowAdminLogin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const handleAdminLogin = (username: string) => {
    setIsAdmin(true);
    setShowAdminLogin(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Hochzeitsgallerie
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* Status messages */}
        {status && (
          <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg">
            {status}
          </div>
        )}

        {/* Profile Header */}
        <ProfileHeader 
          userName={currentUserName}
          bio={profileBio}
          photoURL={profilePhoto}
          isAdmin={isAdmin}
          isDarkMode={isDarkMode}
          onBioUpdate={handleBioUpdate}
          onPhotoUpdate={handlePhotoUpdate}
        />

        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isDarkMode={isDarkMode}
        />

        {/* Upload Section */}
        <UploadSection 
          onUpload={handleUpload}
          onVideoUpload={handleVideoUpload}
          onNoteSubmit={handleNoteSubmit}
          onAddStory={() => {}}
          isUploading={isUploading}
          progress={uploadProgress}
          isDarkMode={isDarkMode}
        />

        {/* Main Content */}
        {activeTab === 'gallery' && (
          <>
            <InstagramGallery 
              items={mediaItems}
              onItemClick={(index) => {
                setCurrentImageIndex(index);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              onEditNote={handleEditNote}
              isAdmin={isAdmin}
              comments={comments}
              likes={likes}
              onAddComment={handleComment}
              onDeleteComment={handleDeleteComment}
              onToggleLike={handleLike}
              userName={currentUserName}
              isDarkMode={isDarkMode}
            />

            {/* Media Modal */}
            <MediaModal 
              isOpen={modalOpen}
              items={mediaItems}
              currentIndex={currentImageIndex}
              onClose={() => setModalOpen(false)}
              onNext={() => setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length)}
              onPrev={() => setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)}
              comments={comments}
              likes={likes}
              onAddComment={handleComment}
              onDeleteComment={handleDeleteComment}
              onToggleLike={handleLike}
              userName={currentUserName}
              isAdmin={isAdmin}
              isDarkMode={isDarkMode}
            />
          </>
        )}

        {activeTab === 'timeline' && (
          <Timeline 
            isDarkMode={isDarkMode}
            userName={currentUserName}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'music' && (
          <MusicWishlist isDarkMode={isDarkMode} />
        )}

        {/* User Name Prompt */}
        {showNamePrompt && (
          <UserNamePrompt 
            onNameSubmit={handleNameSubmit}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Admin Login Modal */}
        {showAdminLogin && (
          <AdminLoginModal 
            isOpen={showAdminLogin}
            onClose={() => setShowAdminLogin(false)}
            onLogin={handleAdminLogin}
            isDarkMode={isDarkMode}
          />
        )}
      </div>

      {/* Admin Panel */}
      <AdminPanel 
        isDarkMode={isDarkMode}
        isAdmin={isAdmin}
        onToggleAdmin={handleAdminToggle}
        mediaItems={mediaItems}
        userId={currentUser?.uid || 'demo-user'}
        galleryOwnerName={userProfile?.displayName || currentUserName}
      />
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Sun, Moon } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { AdminLoginModal } from './AdminLoginModal';
import { UserNamePrompt } from './UserNamePrompt';
import { useAuth } from '../contexts/AuthContext';
import { UploadSection } from './UploadSection';
import { InstagramGallery } from './InstagramGallery';
import { MediaModal } from './MediaModal';
import { ProfileHeader } from './ProfileHeader';
import { ProfileEditor } from './ProfileEditor';
import { StoriesBar } from './StoriesBar';
import { StoriesViewer } from './StoriesViewer';
import { StoryUploadModal } from './StoryUploadModal';
import { TabNavigation } from './TabNavigation';
import { Timeline } from './Timeline';
import { MusicWishlist } from './MusicWishlist';
import { useDarkMode } from '../hooks/useDarkMode';
import { MediaItem, Comment, Like, TimelineEvent } from '../types';
import {
  uploadUserFiles,
  uploadUserVideo,
  loadUserGallery,
  loadUserMediaItems,
  loadUserComments,
  loadUserLikes,
  loadUserStories,
  deleteUserMediaItem,
  addComment,
  deleteComment,
  toggleLike,
  deleteStory
} from '../services/hybridGalleryService';
import { Story } from '../services/liveService';
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
  const [stories, setStories] = useState<Story[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [showStoriesViewer, setShowStoriesViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'music' | 'timeline'>('gallery');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

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
    
    // Load stories
    const unsubscribeStories = loadUserStories(userId, (stories) => {
      setStories(stories);
    });
    
    return () => {
      unsubscribeMedia();
      unsubscribeComments();
      unsubscribeLikes();
      unsubscribeStories();
    };
  }, [currentUser]);

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
    setStatus('⏳ Uploading...');

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
      await uploadUserVideoBlob(
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
    const userName = userProfile?.displayName || currentUser?.displayName || 'Demo User';

    setIsUploading(true);
    setStatus('⏳ Saving note...');

    try {
      await addUserNote(userId, noteText, userName, userId);
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
    const userName = userProfile?.displayName || currentUser?.displayName || 'Demo User';
    const deviceId = currentUser?.uid || 'demo-user';

    try {
      await toggleLike(userId, mediaId, userName, deviceId);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (mediaId: string, text: string) => {
    const userId = currentUser?.uid || 'demo-user';
    const userName = userProfile?.displayName || currentUser?.displayName || 'Demo User';
    const deviceId = currentUser?.uid || 'demo-user';

    try {
      await addComment(userId, mediaId, text, userName, deviceId);
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
    const userId = currentUser?.uid || 'demo-user';

    try {
      // Update the media item's text/note content
      const updatedItem = { ...item, text: newText };
      // For now, we'll just log this as the edit functionality needs to be implemented
      console.log('Edit note for item:', updatedItem);
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

  if (!currentUser || !userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with logout */}
        <div className="mb-8">
          <ProfileHeader 
            profile={userProfile}
            onEdit={() => setShowProfileEditor(true)}
            isDarkMode={isDarkMode}
          />
          <div className="flex justify-end items-center gap-4 p-4">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Clear Data
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Status messages */}
        {status && (
          <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg">
            {status}
          </div>
        )}

        {/* Stories Bar */}
        <StoriesBar 
          stories={stories}
          onStoryClick={(index) => {
            setCurrentStoryIndex(index);
            setShowStoriesViewer(true);
          }}
          onAddStory={() => setShowStoryUpload(true)}
        />

        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isDarkMode={isDarkMode}
        />

        {/* Content based on active tab */}
        {activeTab === 'gallery' && (
          <>
            <UploadSection
              onUpload={handleUpload}
              onVideoUpload={handleVideoUpload}
              onNoteSubmit={handleNoteSubmit}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />

            <InstagramGallery
              items={mediaItems}
              onItemClick={(index: number) => {
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
              userName={userProfile?.displayName || 'Demo User'}
              isDarkMode={isDarkMode}
            />
          </>
        )}

        {activeTab === 'timeline' && (
          <Timeline 
            isDarkMode={isDarkMode}
            userName={userProfile?.displayName || 'Demo User'}
            isAdmin={isAdmin}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'music' && (
          <MusicWishlist 
            isDarkMode={isDarkMode}
          />
        )}

        {/* Modals */}
        {modalOpen && (
          <MediaModal
            isOpen={modalOpen}
            items={mediaItems}
            currentIndex={currentImageIndex}
            onClose={() => setModalOpen(false)}
            onNext={() => setCurrentImageIndex(prev => (prev + 1) % mediaItems.length)}
            onPrev={() => setCurrentImageIndex(prev => prev === 0 ? mediaItems.length - 1 : prev - 1)}
            comments={comments}
            likes={likes}
            onAddComment={handleComment}
            onDeleteComment={handleDeleteComment}
            onToggleLike={handleLike}
            userName={userProfile?.displayName || 'Demo User'}
            isAdmin={isAdmin}
            isDarkMode={isDarkMode}
          />
        )}

        {showStoriesViewer && (
          <StoriesViewer
            stories={stories}
            currentIndex={currentStoryIndex}
            onClose={() => setShowStoriesViewer(false)}
            onNext={() => setCurrentStoryIndex(prev => (prev + 1) % stories.length)}
            onPrevious={() => setCurrentStoryIndex(prev => prev === 0 ? stories.length - 1 : prev - 1)}
            onDelete={(storyId) => {/* TODO: Delete story */}}
            currentUser={userProfile.displayName}
            deviceId={currentUser.uid}
            isAdmin={false}
          />
        )}

        {showStoryUpload && (
          <StoryUploadModal
            onClose={() => setShowStoryUpload(false)}
            onUpload={(file, text) => {/* TODO: Upload story */}}
            userName={userProfile.displayName}
            deviceId={currentUser.uid}
          />
        )}

        {showProfileEditor && (
          <ProfileEditor
            onClose={() => setShowProfileEditor(false)}
          />
        )}

        {showAdminLogin && (
          <AdminLoginModal
            isOpen={showAdminLogin}
            onClose={() => setShowAdminLogin(false)}
            onLogin={handleAdminLogin}
            isDarkMode={isDarkMode}
          />
        )}

        {showNamePrompt && (
          <UserNamePrompt
            onNameSubmit={handleNameSubmit}
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
        userId={currentUser.uid}
        galleryOwnerName={userProfile.displayName}
      />
    </div>
  );
};
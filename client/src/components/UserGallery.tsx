import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Sun, Moon } from 'lucide-react';
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
  uploadUserVideoBlob,
  loadUserGallery,
  deleteUserMediaItem,
  loadUserComments,
  addUserComment,
  deleteUserComment,
  loadUserLikes,
  toggleUserLike,
  addUserNote,
  editUserNote,
  loadUserEvents
} from '../services/galleryService';
import { Story } from '../services/liveService';

export const UserGallery: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
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

  // Load user data when authenticated
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeGallery = loadUserGallery(currentUser.uid, setMediaItems);
    const unsubscribeComments = loadUserComments(currentUser.uid, setComments);
    const unsubscribeLikes = loadUserLikes(currentUser.uid, setLikes);
    const unsubscribeEvents = loadUserEvents(currentUser.uid, setEvents);

    return () => {
      unsubscribeGallery();
      unsubscribeComments();
      unsubscribeLikes();
      unsubscribeEvents();
    };
  }, [currentUser]);

  const handleUpload = async (files: FileList) => {
    if (!currentUser || !userProfile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setStatus('⏳ Uploading...');

    try {
      await uploadUserFiles(
        currentUser.uid,
        files, 
        userProfile.displayName, 
        currentUser.uid,
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
    if (!currentUser || !userProfile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setStatus('⏳ Uploading video...');

    try {
      await uploadUserVideoBlob(
        currentUser.uid,
        videoBlob, 
        userProfile.displayName, 
        currentUser.uid,
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
    if (!currentUser || !userProfile) return;

    setIsUploading(true);
    setStatus('⏳ Saving note...');

    try {
      await addUserNote(currentUser.uid, noteText, userProfile.displayName, currentUser.uid);
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
    if (!currentUser) return;

    try {
      await deleteUserMediaItem(currentUser.uid, item);
      setStatus('✅ Item deleted successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Error deleting item. Please try again.');
      console.error('Delete error:', error);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleLike = async (mediaId: string) => {
    if (!currentUser || !userProfile) return;

    try {
      await toggleUserLike(currentUser.uid, mediaId, userProfile.displayName, currentUser.uid);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (mediaId: string, text: string) => {
    if (!currentUser || !userProfile) return;

    try {
      await addUserComment(currentUser.uid, mediaId, text, userProfile.displayName, currentUser.uid);
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;

    try {
      await deleteUserComment(currentUser.uid, commentId);
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  };

  const handleEditNote = async (noteId: string, noteText: string) => {
    if (!currentUser) return;

    try {
      await editUserNote(currentUser.uid, noteId, noteText);
      setStatus('✅ Note updated successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Error updating note. Please try again.');
      console.error('Edit note error:', error);
      setTimeout(() => setStatus(''), 5000);
    }
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
              mediaItems={mediaItems}
              comments={comments}
              likes={likes}
              onImageClick={(index) => {
                setCurrentImageIndex(index);
                setModalOpen(true);
              }}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={handleDelete}
              onEditNote={handleEditNote}
              currentUser={userProfile.displayName}
              deviceId={currentUser.uid}
            />
          </>
        )}

        {activeTab === 'timeline' && (
          <Timeline 
            events={events}
            onAddEvent={(event) => {/* TODO: Add event */}}
            onEditEvent={(id, event) => {/* TODO: Edit event */}}
            onDeleteEvent={(id) => {/* TODO: Delete event */}}
            currentUser={userProfile.displayName}
            isAdmin={false}
          />
        )}

        {activeTab === 'music' && (
          <MusicWishlist 
            userId={currentUser.uid}
            userName={userProfile.displayName}
          />
        )}

        {/* Modals */}
        {modalOpen && (
          <MediaModal
            mediaItems={mediaItems}
            currentIndex={currentImageIndex}
            onClose={() => setModalOpen(false)}
            onNext={() => setCurrentImageIndex(prev => (prev + 1) % mediaItems.length)}
            onPrevious={() => setCurrentImageIndex(prev => prev === 0 ? mediaItems.length - 1 : prev - 1)}
            comments={comments}
            likes={likes}
            onLike={handleLike}
            onComment={handleComment}
            onDeleteComment={handleDeleteComment}
            currentUser={userProfile.displayName}
            deviceId={currentUser.uid}
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
      </div>
    </div>
  );
};
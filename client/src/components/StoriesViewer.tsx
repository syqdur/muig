import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2, Eye } from 'lucide-react';

// Use the existing Story type from the gallery service
interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  userName: string;
  createdAt: string;
  views: string[];
}

interface StoriesViewerProps {
  isOpen: boolean;
  stories: Story[];
  initialStoryIndex: number;
  currentUser: string;
  onClose: () => void;
  onStoryViewed: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
  isAdmin: boolean;
  isDarkMode: boolean;
}

export const StoriesViewer: React.FC<StoriesViewerProps> = ({
  isOpen,
  stories,
  initialStoryIndex,
  currentUser,
  onClose,
  onStoryViewed,
  onDeleteStory,
  isAdmin,
  isDarkMode
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentStory = stories[currentIndex];
  const STORY_DURATION = 5000; // 5 seconds per story

  // Check if current user can delete this story
  const canDeleteStory = currentStory && (isAdmin || currentStory.userName === currentUser);
  
  console.log(`🔍 Delete permissions check:`, {
    currentUser,
    storyUser: currentStory?.userName,
    isAdmin,
    canDeleteStory,
    currentStory: currentStory?.id
  });

  useEffect(() => {
    if (!isOpen || !currentStory) return;

    // Mark story as viewed (use setTimeout to avoid setState during render)
    setTimeout(() => {
      onStoryViewed(currentStory.id);
    }, 0);
    setIsLoading(true);
    setProgress(0);

    // Preload media
    if (currentStory.mediaType === 'image') {
      const img = new Image();
      img.onload = () => setIsLoading(false);
      img.onerror = () => setIsLoading(false);
      img.src = currentStory.mediaUrl;
    } else {
      // For videos, we'll set loading to false immediately
      // In a real app, you'd want to wait for video to be ready
      setIsLoading(false);
    }
  }, [currentIndex, currentStory, isOpen, onStoryViewed]);

  useEffect(() => {
    if (!isOpen || isPaused || isLoading) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (STORY_DURATION / 100));
        
        if (newProgress >= 100) {
          // Move to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
          } else {
            onClose();
          }
          return 0;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, isLoading, currentIndex, stories.length, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ': // Spacebar
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentIndex, stories.length]);

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleDeleteStory = () => {
    if (!currentStory || !canDeleteStory) return;

    const storyType = currentStory.mediaType === 'video' ? 'Video-Story' : 'Foto-Story';
    const userName = currentStory.userName;
    const isOwnStory = userName === currentUser;
    
    let confirmMessage;
    if (isAdmin && !isOwnStory) {
      confirmMessage = `🗑️ Admin-Löschung\n\n${storyType} von "${userName}" wirklich löschen?\n\n⚠️ Diese Aktion kann nicht rückgängig gemacht werden.`;
    } else {
      confirmMessage = `🗑️ Story löschen\n\nDeine ${storyType} wirklich löschen?\n\n⚠️ Diese Aktion kann nicht rückgängig gemacht werden.`;
    }

    if (window.confirm(confirmMessage)) {
      console.log(`🗑️ Deleting story: ${currentStory.id} by ${userName}`);
      onDeleteStory(currentStory.id);
      
      // Smart navigation after deletion
      if (stories.length > 1) {
        if (currentIndex < stories.length - 1) {
          // Stay at current index, next story will shift into this position
          console.log(`📍 Staying at index ${currentIndex}, next story will appear here`);
        } else {
          // Go to previous story if this was the last one
          const newIndex = currentIndex - 1;
          console.log(`📍 Moving to previous story at index ${newIndex}`);
          setCurrentIndex(newIndex);
        }
      } else {
        // Close viewer if this was the only story
        console.log(`📍 No more stories, closing viewer`);
        onClose();
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    return `vor ${Math.floor(diffInHours / 24)}d`;
  };

  const getAvatarUrl = (username: string) => {
    const weddingAvatars = [
      'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    ];
    
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return weddingAvatars[Math.abs(hash) % weddingAvatars.length];
  };

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img 
              src={getAvatarUrl(currentStory.userName)}
              alt={currentStory.userName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-white font-semibold text-sm">
              {currentStory.userName}
              {currentStory.userName === currentUser && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">
                  Du
                </span>
              )}
            </span>
            <div className="text-white/70 text-xs">
              {formatTimeAgo(currentStory.createdAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDeleteStory && (
            <button
              onClick={handleDeleteStory}
              className="p-2 rounded-full bg-red-600/90 text-white hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-lg border border-red-400/30"
              title={isAdmin ? `Story von ${currentStory.userName} löschen` : "Deine Story löschen"}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={togglePause}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200 hover:scale-110 shadow-lg border border-white/20"
            title={isPaused ? "Abspielen" : "Pausieren"}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200 hover:scale-110 shadow-lg border border-white/20"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {currentStory.mediaType === 'image' ? (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
            style={{ opacity: isLoading ? 0 : 1 }}
          />
        ) : (
          <video
            src={currentStory.mediaUrl}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            playsInline
            style={{ opacity: isLoading ? 0 : 1 }}
          />
        )}

        {/* Enhanced Navigation Areas - Always visible */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 transition-all duration-200 hover:scale-110"
          disabled={currentIndex === 0}
        >
          {currentIndex > 0 && (
            <div className="bg-black/70 backdrop-blur-sm rounded-full p-3 border border-white/20 shadow-lg">
              <ChevronLeft className="w-6 h-6 text-white" />
            </div>
          )}
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 transition-all duration-200 hover:scale-110"
        >
          <div className="bg-black/70 backdrop-blur-sm rounded-full p-3 border border-white/20 shadow-lg">
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* Tap to pause/play (center area) */}
        <button
          onClick={togglePause}
          className="absolute inset-0 w-1/3 h-full left-1/3"
          style={{ background: 'transparent' }}
        />
      </div>

      {/* Story info */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between text-white text-sm">
            <span>
              {currentIndex + 1} von {stories.length}
            </span>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>
                {currentStory.views?.length || 0} Aufrufe
              </span>
            </div>
          </div>
          
          {/* Enhanced controls hint */}
          <div className="text-white/60 text-xs mt-2 text-center space-y-1">
            <div>← → Navigieren • Leertaste Pause • Esc Schließen</div>
            {canDeleteStory && (
              <div className="text-red-300">
                {isAdmin && currentStory.userName !== currentUser 
                  ? `🛡️ Admin: Story von ${currentStory.userName} löschbar`
                  : '🗑️ Deine Story - löschbar'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
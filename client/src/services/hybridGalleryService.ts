// Hybrid service that falls back to local storage if Firebase fails
import { MediaItem, Comment, Like, TimelineEvent } from '../types/index';
import { Story } from './liveService';

// Try Firebase first, fallback to localStorage
let useFirebase = true;

// Local storage keys - now user-specific
const getStorageKey = (userId: string, type: string) => `gallery_${userId}_${type}`;

const STORAGE_KEYS = {
  MEDIA: (userId: string) => getStorageKey(userId, 'media'),
  COMMENTS: (userId: string) => getStorageKey(userId, 'comments'), 
  LIKES: (userId: string) => getStorageKey(userId, 'likes'),
  TIMELINE: (userId: string) => getStorageKey(userId, 'timeline'),
  STORIES: (userId: string) => getStorageKey(userId, 'stories')
};

// Local storage helpers
const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Media Management
export const uploadUserFiles = async (
  userId: string,
  files: FileList, 
  userName: string, 
  deviceId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  // For now, create local URLs and store metadata
  const mediaItems = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA(userId));
  let uploaded = 0;
  
  for (const file of Array.from(files)) {
    const id = generateId();
    const base64 = await fileToBase64(file);
    
    const mediaItem: MediaItem = {
      id,
      name: file.name,
      url: base64,
      uploadedBy: userName,
      uploadedAt: new Date().toISOString(),
      deviceId,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      userId,
      createdAt: new Date().toISOString(),
      firebaseId: `local-${id}`,
      fileName: file.name
    };
    
    mediaItems.push(mediaItem);
    uploaded++;
    onProgress((uploaded / files.length) * 100);
  }
  
  saveToStorage(STORAGE_KEYS.MEDIA(userId), mediaItems);
  
  // Trigger storage event for real-time updates
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.MEDIA(userId),
    newValue: JSON.stringify(mediaItems)
  }));
};

export const uploadUserVideo = async (
  userId: string,
  videoBlob: Blob, 
  userName: string, 
  deviceId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  const mediaItems = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA(userId));
  const id = generateId();
  
  // Convert blob to base64 for persistent storage
  const base64 = await blobToBase64(videoBlob);
  
  const mediaItem: MediaItem = {
    id,
    name: 'Recorded Video',
    url: base64,
    uploadedBy: userName,
    uploadedAt: new Date().toISOString(),
    deviceId,
    type: 'video',
    userId,
    createdAt: new Date().toISOString(),
    firebaseId: `local-${id}`,
    fileName: `recorded-video-${id}.webm`
  };
  
  mediaItems.push(mediaItem);
  saveToStorage(STORAGE_KEYS.MEDIA(userId), mediaItems);
  onProgress(100);
  
  // Trigger storage event
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.MEDIA(userId),
    newValue: JSON.stringify(mediaItems)
  }));
};

export const addUserNote = async (
  userId: string,
  noteText: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  const mediaItems = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA(userId));
  const id = generateId();
  
  const mediaItem: MediaItem = {
    id,
    name: 'Note',
    url: '',
    uploadedBy: userName,
    uploadedAt: new Date().toISOString(),
    deviceId,
    type: 'note',
    noteText,
    text: noteText,
    userId,
    createdAt: new Date().toISOString()
  };
  
  mediaItems.push(mediaItem);
  saveToStorage(STORAGE_KEYS.MEDIA(userId), mediaItems);
  
  // Trigger storage event
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.MEDIA(userId),
    newValue: JSON.stringify(mediaItems)
  }));
};

// Gallery loading with real-time updates
export const loadUserMediaItems = (userId: string, callback: (items: MediaItem[]) => void) => {
  const loadData = () => {
    const items = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA(userId));
    // Sort by upload date, newest first
    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    callback(items);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.MEDIA(userId)) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const loadUserGallery = (userId: string, callback: (items: MediaItem[]) => void) => {
  return loadUserMediaItems(userId, callback);
};

export const deleteUserMediaItem = async (userId: string, item: MediaItem): Promise<void> => {
  const mediaItems = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA(userId));
  const filteredItems = mediaItems.filter(media => media.id !== item.id);
  saveToStorage(STORAGE_KEYS.MEDIA(userId), filteredItems);
  
  // Trigger storage event
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.MEDIA(userId),
    newValue: JSON.stringify(filteredItems)
  }));
};

// Comments Management
export const loadUserComments = (userId: string, callback: (comments: Comment[]) => void) => {
  const loadData = () => {
    const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS(userId));
    callback(comments);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.COMMENTS(userId)) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const loadMediaComments = (userId: string, mediaId: string, callback: (comments: Comment[]) => void) => {
  const loadData = () => {
    const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS(userId));
    const mediaComments = comments.filter(comment => comment.mediaId === mediaId);
    callback(mediaComments);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.COMMENTS(userId)) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const addComment = async (
  userId: string,
  mediaId: string,
  text: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS(userId));
  const id = generateId();
  
  const comment: Comment = {
    id,
    mediaId,
    text,
    userName,
    deviceId,
    createdAt: new Date().toISOString()
  };
  
  comments.push(comment);
  saveToStorage(STORAGE_KEYS.COMMENTS(userId), comments);
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.COMMENTS(userId),
    newValue: JSON.stringify(comments)
  }));
};

export const deleteComment = async (userId: string, commentId: string): Promise<void> => {
  const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS(userId));
  const filteredComments = comments.filter(comment => comment.id !== commentId);
  saveToStorage(STORAGE_KEYS.COMMENTS(userId), filteredComments);
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.COMMENTS(userId),
    newValue: JSON.stringify(filteredComments)
  }));
};

// Likes Management
export const loadUserLikes = (userId: string, callback: (likes: Like[]) => void) => {
  const loadData = () => {
    const likes = getFromStorage<Like>(STORAGE_KEYS.LIKES(userId));
    callback(likes);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.LIKES(userId)) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const loadMediaLikes = (userId: string, mediaId: string, callback: (likes: Like[]) => void) => {
  const loadData = () => {
    const likes = getFromStorage<Like>(STORAGE_KEYS.LIKES(userId));
    const mediaLikes = likes.filter(like => like.mediaId === mediaId);
    callback(mediaLikes);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.LIKES(userId)) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const toggleLike = async (userId: string, mediaId: string, userName: string, deviceId: string): Promise<void> => {
  const likes = getFromStorage<Like>(STORAGE_KEYS.LIKES(userId));
  const existingLike = likes.find(like => like.mediaId === mediaId && like.deviceId === deviceId);
  
  if (existingLike) {
    // Remove like
    const filteredLikes = likes.filter(like => like.id !== existingLike.id);
    saveToStorage(STORAGE_KEYS.LIKES(userId), filteredLikes);
  } else {
    // Add like
    const id = generateId();
    const like: Like = {
      id,
      mediaId,
      userName,
      deviceId,
      createdAt: new Date().toISOString()
    };
    likes.push(like);
    saveToStorage(STORAGE_KEYS.LIKES(userId), likes);
  }
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.LIKES(userId),
    newValue: JSON.stringify(likes)
  }));
};

// Timeline Events with Media Upload
export const uploadTimelineEvent = async (
  userId: string,
  eventData: {
    title: string;
    description: string;
    date: string;
    location?: string;
    type: string;
    customEventName?: string;
    createdBy: string;
  },
  files: FileList,
  onProgress: (progress: number) => void
): Promise<void> => {
  const timelineEvents = getFromStorage<TimelineEvent>(STORAGE_KEYS.TIMELINE(userId));
  const id = generateId();
  
  const mediaUrls: string[] = [];
  const mediaTypes: string[] = [];
  const mediaFileNames: string[] = [];
  
  // Process files
  if (files.length > 0) {
    let uploaded = 0;
    
    for (const file of Array.from(files)) {
      const base64 = await fileToBase64(file);
      mediaUrls.push(base64);
      mediaTypes.push(file.type.startsWith('video/') ? 'video' : 'image');
      mediaFileNames.push(file.name);
      
      uploaded++;
      onProgress((uploaded / files.length) * 50);
    }
  }
  
  // Create timeline event
  const timelineEvent: TimelineEvent = {
    id,
    userId,
    title: eventData.title,
    description: eventData.description,
    date: eventData.date,
    location: eventData.location,
    type: eventData.type as TimelineEvent['type'],
    customEventName: eventData.customEventName,
    createdBy: eventData.createdBy,
    mediaUrls,
    mediaTypes,
    mediaFileNames,
    createdAt: new Date().toISOString()
  };
  
  timelineEvents.push(timelineEvent);
  saveToStorage(STORAGE_KEYS.TIMELINE(userId), timelineEvents);
  onProgress(100);
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.TIMELINE(userId),
    newValue: JSON.stringify(timelineEvents)
  }));
};

export const loadUserTimeline = (userId: string, callback: (events: TimelineEvent[]) => void) => {
  const loadData = () => {
    const events = getFromStorage<TimelineEvent>(STORAGE_KEYS.TIMELINE(userId));
    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(events);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.TIMELINE(userId)) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const deleteTimelineEvent = async (userId: string, eventId: string): Promise<void> => {
  const events = getFromStorage<TimelineEvent>(STORAGE_KEYS.TIMELINE(userId));
  const filteredEvents = events.filter(event => event.id !== eventId);
  saveToStorage(STORAGE_KEYS.TIMELINE(userId), filteredEvents);
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.TIMELINE(userId),
    newValue: JSON.stringify(filteredEvents)
  }));
};

// Stories Management
export const loadUserStories = (userId: string, callback: (stories: Story[]) => void) => {
  const loadData = () => {
    const stories = getFromStorage<Story>(STORAGE_KEYS.STORIES(userId));
    // Filter out expired stories (older than 24 hours)
    const now = new Date();
    const validStories = stories.filter(story => {
      const storyDate = new Date(story.createdAt);
      const hoursDiff = (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 24;
    });
    
    // Update storage with valid stories only
    if (validStories.length !== stories.length) {
      saveToStorage(STORAGE_KEYS.STORIES(userId), validStories);
    }
    
    callback(validStories);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.STORIES(userId)) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const deleteStory = async (storyId: string): Promise<void> => {
  try {
    // For now, we'll need to check all user stories since we don't have the userId here
    // This is a simplified implementation
    const allKeys = Object.keys(localStorage).filter(key => key.includes('gallery_') && key.includes('_stories'));
    
    for (const key of allKeys) {
      const stories = getFromStorage<Story>(key);
      const filteredStories = stories.filter(story => story.id !== storyId);
      
      if (filteredStories.length !== stories.length) {
        saveToStorage(key, filteredStories);
        
        window.dispatchEvent(new StorageEvent('storage', {
          key,
          newValue: JSON.stringify(filteredStories)
        }));
        break;
      }
    }
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

// Story upload function
export const uploadUserStory = async (userId: string, file: File, userName: string, deviceId: string): Promise<void> => {
  try {
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const mediaUrl = await fileToBase64(file);
    
    const story: Story = {
      id: generateId(),
      userName,
      mediaUrl,
      mediaType,
      createdAt: new Date().toISOString(),
      views: [],
      fileName: file.name
    };

    const stories = getFromStorage<Story>(STORAGE_KEYS.STORIES(userId));
    stories.push(story);
    saveToStorage(STORAGE_KEYS.STORIES(userId), stories);
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.STORIES(userId),
      newValue: JSON.stringify(stories)
    }));
    
    console.log('Story uploaded successfully:', story.id);
  } catch (error) {
    console.error('Error uploading story:', error);
    throw error;
  }
};

// Mark story as viewed
export const markStoryAsViewed = async (storyId: string, userId: string): Promise<void> => {
  try {
    const stories = getFromStorage<Story>(STORAGE_KEYS.STORIES(userId));
    const story = stories.find(s => s.id === storyId);
    
    if (story && !story.views.includes(userId)) {
      story.views.push(userId);
      saveToStorage(STORAGE_KEYS.STORIES(userId), stories);
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.STORIES(userId),
        newValue: JSON.stringify(stories)
      }));
    }
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    throw error;
  }
};
// Hybrid service that falls back to local storage if Firebase fails
import { MediaItem, Comment, Like, TimelineEvent } from '../types/index';

// Try Firebase first, fallback to localStorage
let useFirebase = true;

// Local storage keys - now user-specific
const getStorageKey = (userId: string, type: string) => `gallery_${userId}_${type}`;

const STORAGE_KEYS = {
  MEDIA: (userId: string) => getStorageKey(userId, 'media'),
  COMMENTS: (userId: string) => getStorageKey(userId, 'comments'), 
  LIKES: (userId: string) => getStorageKey(userId, 'likes'),
  TIMELINE: (userId: string) => getStorageKey(userId, 'timeline')
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
    const url = URL.createObjectURL(file);
    
    const mediaItem: MediaItem = {
      id,
      name: file.name,
      url,
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

export const uploadUserVideoBlob = async (
  userId: string,
  videoBlob: Blob, 
  userName: string, 
  deviceId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  const mediaItems = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA);
  const id = generateId();
  const url = URL.createObjectURL(videoBlob);
  
  const mediaItem: MediaItem = {
    id,
    name: 'Recorded Video',
    url,
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
  saveToStorage(STORAGE_KEYS.MEDIA, mediaItems);
  onProgress(100);
  
  // Trigger storage event
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.MEDIA,
    newValue: JSON.stringify(mediaItems)
  }));
};

export const addUserNote = async (
  userId: string,
  noteText: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  const mediaItems = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA);
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
  saveToStorage(STORAGE_KEYS.MEDIA, mediaItems);
  
  // Trigger storage event
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.MEDIA,
    newValue: JSON.stringify(mediaItems)
  }));
};

// Gallery loading with real-time updates
export const loadUserGallery = (userId: string, callback: (items: MediaItem[]) => void) => {
  const loadData = () => {
    const mediaItems = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA);
    const userItems = mediaItems.filter(item => item.userId === userId);
    callback(userItems);
  };
  
  // Initial load
  loadData();
  
  // Listen for storage changes
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.MEDIA) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const deleteUserMediaItem = async (userId: string, item: MediaItem): Promise<void> => {
  const mediaItems = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA);
  const filteredItems = mediaItems.filter(media => media.id !== item.id);
  saveToStorage(STORAGE_KEYS.MEDIA, filteredItems);
  
  // Revoke object URL to free memory
  if (item.url.startsWith('blob:')) {
    URL.revokeObjectURL(item.url);
  }
  
  // Trigger storage event
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.MEDIA,
    newValue: JSON.stringify(filteredItems)
  }));
};

// Comments Management
export const loadMediaComments = (mediaId: string, callback: (comments: Comment[]) => void) => {
  const loadData = () => {
    const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
    const mediaComments = comments.filter(comment => comment.mediaId === mediaId);
    callback(mediaComments);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.COMMENTS) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const addComment = async (
  mediaId: string,
  text: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
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
  saveToStorage(STORAGE_KEYS.COMMENTS, comments);
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.COMMENTS,
    newValue: JSON.stringify(comments)
  }));
};

export const deleteComment = async (commentId: string): Promise<void> => {
  const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
  const filteredComments = comments.filter(comment => comment.id !== commentId);
  saveToStorage(STORAGE_KEYS.COMMENTS, filteredComments);
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.COMMENTS,
    newValue: JSON.stringify(filteredComments)
  }));
};

// Likes Management
export const loadMediaLikes = (mediaId: string, callback: (likes: Like[]) => void) => {
  const loadData = () => {
    const likes = getFromStorage<Like>(STORAGE_KEYS.LIKES);
    const mediaLikes = likes.filter(like => like.mediaId === mediaId);
    callback(mediaLikes);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.LIKES) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const toggleLike = async (
  mediaId: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  const likes = getFromStorage<Like>(STORAGE_KEYS.LIKES);
  const existingLike = likes.find(like => like.mediaId === mediaId && like.userName === userName);
  
  if (existingLike) {
    // Remove like
    const filteredLikes = likes.filter(like => like.id !== existingLike.id);
    saveToStorage(STORAGE_KEYS.LIKES, filteredLikes);
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
    saveToStorage(STORAGE_KEYS.LIKES, likes);
  }
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.LIKES,
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
  const timelineEvents = getFromStorage<TimelineEvent>(STORAGE_KEYS.TIMELINE);
  const id = generateId();
  
  const mediaUrls: string[] = [];
  const mediaTypes: string[] = [];
  const mediaFileNames: string[] = [];
  
  // Process files
  if (files.length > 0) {
    let uploaded = 0;
    
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      mediaUrls.push(url);
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
  saveToStorage(STORAGE_KEYS.TIMELINE, timelineEvents);
  onProgress(100);
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.TIMELINE,
    newValue: JSON.stringify(timelineEvents)
  }));
};

export const loadUserTimeline = (userId: string, callback: (events: TimelineEvent[]) => void) => {
  const loadData = () => {
    const events = getFromStorage<TimelineEvent>(STORAGE_KEYS.TIMELINE);
    const userEvents = events.filter(event => event.userId === userId);
    // Sort by date descending
    userEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(userEvents);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.TIMELINE) {
      loadData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const deleteTimelineEvent = async (userId: string, eventId: string): Promise<void> => {
  const events = getFromStorage<TimelineEvent>(STORAGE_KEYS.TIMELINE);
  const eventToDelete = events.find(event => event.id === eventId);
  
  // Revoke object URLs to free memory
  if (eventToDelete && eventToDelete.mediaUrls) {
    eventToDelete.mediaUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }
  
  const filteredEvents = events.filter(event => event.id !== eventId);
  saveToStorage(STORAGE_KEYS.TIMELINE, filteredEvents);
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.TIMELINE,
    newValue: JSON.stringify(filteredEvents)
  }));
};
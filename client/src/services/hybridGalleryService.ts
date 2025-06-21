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
  try {
    // Try database first
    const response = await fetch(`/api/users/${userId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: noteText,
        uploadedBy: userName
      })
    });

    if (!response.ok) {
      throw new Error('Database request failed');
    }

    const note = await response.json();
    console.log('Note created:', note);

  } catch (error) {
    console.error('Database failed, using localStorage:', error);
    
    // Fallback to localStorage
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
  }
};

// Edit note function
export const editMediaNote = async (
  mediaId: string,
  newText: string
): Promise<void> => {
  try {
    // Try database first
    const response = await fetch(`/api/media/${mediaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: newText,
        noteText: newText
      })
    });

    if (!response.ok) {
      throw new Error('Database request failed');
    }

    const updatedItem = await response.json();
    console.log('Note updated:', updatedItem);

    // Trigger a refresh by firing a storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'media_refresh',
      newValue: JSON.stringify(updatedItem)
    }));

  } catch (error) {
    console.error('Database failed for note edit:', error);
    throw error; // Re-throw to show error to user
  }
};

// Gallery loading with real-time updates
export const loadUserMediaItems = (userId: string, callback: (items: MediaItem[]) => void) => {
  const loadData = async () => {
    try {
      // Try to load from database first
      const response = await fetch(`/api/users/${userId}/media`);
      if (response.ok) {
        const dbItems = await response.json();
        // Convert database items to frontend format
        const convertedItems = dbItems.map((item: any) => ({
          ...item,
          id: item.id.toString(), // Convert to string for frontend
          uploadedAt: item.uploadedAt || item.createdAt,
          noteText: item.noteText || item.text
        }));
        convertedItems.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        callback(convertedItems);
        return;
      }
    } catch (error) {
      console.log('Database failed, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const items = getFromStorage<MediaItem>(STORAGE_KEYS.MEDIA(userId));
    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    callback(items);
  };
  
  loadData();
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.MEDIA(userId) || e.key === 'media_refresh') {
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

// Stories Management (placeholder functions)
export const loadUserStories = (userId: string, callback: (stories: any[]) => void) => {
  // Return empty stories for now
  callback([]);
  return () => {};
};

export const deleteStory = async (storyId: string): Promise<void> => {
  // Placeholder implementation
  console.log('Story deleted:', storyId);
};
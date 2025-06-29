import { apiClient } from './apiClient';
import { uploadBytes, ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MediaItem, Comment, Like, TimelineEvent } from '../types/index';

// Convert Firebase user ID to database user ID
const getUserDbId = (firebaseUid: string): number => {
  // Always use the first user for now (could be improved with proper mapping)
  return 1;
};

// Media Management with Firebase Storage + Firestore
export const uploadUserFiles = async (
  userId: string,
  files: FileList, 
  userName: string, 
  deviceId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  let uploaded = 0;
  
  for (const file of Array.from(files)) {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `galleries/${userId}/media/${fileName}`);
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save metadata to Firestore
      const isVideo = file.type.startsWith('video/');
      await addDoc(collection(db, 'media'), {
        userId: userId,
        firebaseId: fileName,
        type: isVideo ? 'video' : 'image',
        url: downloadURL,
        fileName: fileName,
        uploadedBy: userName,
        deviceId: deviceId,
        createdAt: new Date().toISOString()
      });
      
      uploaded++;
      onProgress((uploaded / files.length) * 100);
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      throw error;
    }
  }
};

export const uploadUserVideoBlob = async (
  userId: string,
  videoBlob: Blob, 
  userName: string, 
  deviceId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  const fileName = `${Date.now()}-recorded-video.webm`;
  const storageRef = ref(storage, `galleries/${userId}/media/${fileName}`);
  
  try {
    await uploadBytes(storageRef, videoBlob);
    const downloadURL = await getDownloadURL(storageRef);
    
    await addDoc(collection(db, 'media'), {
      userId: userId,
      firebaseId: fileName,
      type: 'video',
      url: downloadURL,
      fileName: fileName,
      uploadedBy: userName,
      deviceId: deviceId,
      createdAt: new Date().toISOString()
    });
    
    onProgress(100);
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

export const addUserNote = async (
  userId: string,
  noteText: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  await addDoc(collection(db, 'media'), {
    userId: userId,
    type: 'note',
    text: noteText,
    uploadedBy: userName,
    deviceId: deviceId,
    fileName: null,
    url: null,
    createdAt: new Date().toISOString()
  });
};

export const editUserNote = async (
  userId: string,
  noteId: string,
  noteText: string
): Promise<void> => {
  // For now, we'll need to implement update in the API
  console.log('Edit note not yet implemented for database');
};

// Gallery loading with real-time Firebase updates
export const loadUserGallery = (userId: string, callback: (items: MediaItem[]) => void) => {
  const mediaQuery = query(
    collection(db, 'media'), 
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(mediaQuery, (snapshot) => {
    const mediaItems: MediaItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === userId) {
        mediaItems.push({
          id: doc.id,
          ...data
        } as MediaItem);
      }
    });
    callback(mediaItems);
  }, (error) => {
    console.error('Error loading gallery:', error);
    callback([]);
  });
  
  return unsubscribe;
};

export const deleteUserMediaItem = async (userId: string, item: MediaItem): Promise<void> => {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, 'media', item.id));
    
    // Delete from Firebase Storage if it has a file
    if (item.firebaseId && item.type !== 'note') {
      const storageRef = ref(storage, `galleries/${userId}/media/${item.firebaseId}`);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error('Error deleting media item:', error);
    throw error;
  }
};

// Comments
export const loadUserComments = (userId: string, callback: (comments: Comment[]) => void) => {
  const dbUserId = getUserDbId(userId);
  
  const loadData = async () => {
    try {
      const comments = await apiClient.getUserComments(dbUserId);
      callback(comments);
    } catch (error) {
      console.error('Error loading comments:', error);
      callback([]);
    }
  };
  
  loadData();
  const interval = setInterval(loadData, 1000);
  return () => clearInterval(interval);
};

export const addUserComment = async (
  userId: string,
  mediaId: string,
  text: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  const dbUserId = getUserDbId(userId);
  
  await apiClient.createComment(dbUserId, {
    userId: dbUserId,
    mediaId: parseInt(mediaId),
    text: text
  });
};

export const deleteUserComment = async (userId: string, commentId: string): Promise<void> => {
  await apiClient.deleteComment(parseInt(commentId));
};

// Likes
export const loadUserLikes = (userId: string, callback: (likes: Like[]) => void) => {
  const dbUserId = getUserDbId(userId);
  
  const loadData = async () => {
    try {
      const likes = await apiClient.getUserLikes(dbUserId);
      callback(likes);
    } catch (error) {
      console.error('Error loading likes:', error);
      callback([]);
    }
  };
  
  loadData();
  const interval = setInterval(loadData, 1000);
  return () => clearInterval(interval);
};

export const toggleUserLike = async (
  userId: string,
  mediaId: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  const dbUserId = getUserDbId(userId);
  const mediaIdNum = parseInt(mediaId);
  
  try {
    // Try to create like first
    await apiClient.createLike(dbUserId, {
      userId: dbUserId,
      mediaId: mediaIdNum
    });
  } catch (error) {
    // If it fails (likely because like exists), try to delete it
    try {
      await apiClient.deleteLike(mediaIdNum, dbUserId);
    } catch (deleteError) {
      console.error('Error toggling like:', deleteError);
    }
  }
};

// Timeline Events
export const loadUserEvents = (userId: string, callback: (events: TimelineEvent[]) => void) => {
  const dbUserId = getUserDbId(userId);
  
  const loadData = async () => {
    try {
      const events = await apiClient.getUserTimeline(dbUserId);
      callback(events);
    } catch (error) {
      console.error('Error loading timeline events:', error);
      callback([]);
    }
  };
  
  loadData();
  const interval = setInterval(loadData, 1000);
  return () => clearInterval(interval);
};
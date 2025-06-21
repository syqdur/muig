// Firebase-based gallery service for live functionality
import { uploadBytes, ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MediaItem, Comment, Like, TimelineEvent } from '../types/index';

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
        name: file.name,
        fileName: fileName,
        uploadedBy: userName,
        deviceId: deviceId,
        uploadedAt: new Date().toISOString(),
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
      name: 'Recorded Video',
      fileName: fileName,
      uploadedBy: userName,
      deviceId: deviceId,
      uploadedAt: new Date().toISOString(),
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
    noteText: noteText,
    name: 'Note',
    uploadedBy: userName,
    deviceId: deviceId,
    fileName: null,
    url: null,
    uploadedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });
};

// Gallery loading with real-time Firebase updates
export const loadUserGallery = (userId: string, callback: (items: MediaItem[]) => void) => {
  const mediaQuery = query(
    collection(db, 'media'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(mediaQuery, (snapshot) => {
    const mediaItems: MediaItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      mediaItems.push({
        id: doc.id,
        ...data
      } as MediaItem);
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

// Comments Management
export const loadMediaComments = (mediaId: string, callback: (comments: Comment[]) => void) => {
  const commentsQuery = query(
    collection(db, 'comments'),
    where('mediaId', '==', mediaId),
    orderBy('createdAt', 'asc')
  );
  
  const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data
      } as Comment);
    });
    callback(comments);
  });
  
  return unsubscribe;
};

export const addComment = async (
  mediaId: string,
  text: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  await addDoc(collection(db, 'comments'), {
    mediaId,
    text,
    userName,
    deviceId,
    createdAt: new Date().toISOString()
  });
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await deleteDoc(doc(db, 'comments', commentId));
};

// Likes Management
export const loadMediaLikes = (mediaId: string, callback: (likes: Like[]) => void) => {
  const likesQuery = query(
    collection(db, 'likes'),
    where('mediaId', '==', mediaId)
  );
  
  const unsubscribe = onSnapshot(likesQuery, (snapshot) => {
    const likes: Like[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      likes.push({
        id: doc.id,
        ...data
      } as Like);
    });
    callback(likes);
  });
  
  return unsubscribe;
};

export const toggleLike = async (
  mediaId: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  // Check if like exists
  const likesQuery = query(
    collection(db, 'likes'),
    where('mediaId', '==', mediaId),
    where('userName', '==', userName)
  );
  
  const snapshot = await getDocs(likesQuery);
  
  if (snapshot.empty) {
    // Add like
    await addDoc(collection(db, 'likes'), {
      mediaId,
      userName,
      deviceId,
      createdAt: new Date().toISOString()
    });
  } else {
    // Remove like
    snapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  }
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
  const mediaUrls: string[] = [];
  const mediaTypes: string[] = [];
  const mediaFileNames: string[] = [];
  
  // Upload files first
  if (files.length > 0) {
    let uploaded = 0;
    
    for (const file of Array.from(files)) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `galleries/${userId}/timeline/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        mediaUrls.push(downloadURL);
        mediaTypes.push(file.type.startsWith('video/') ? 'video' : 'image');
        mediaFileNames.push(fileName);
        
        uploaded++;
        onProgress((uploaded / files.length) * 50); // First 50% for uploads
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        throw error;
      }
    }
  }
  
  // Create timeline event
  await addDoc(collection(db, 'timeline'), {
    userId,
    ...eventData,
    mediaUrls,
    mediaTypes,
    mediaFileNames,
    createdAt: new Date().toISOString()
  });
  
  onProgress(100);
};

export const loadUserTimeline = (userId: string, callback: (events: TimelineEvent[]) => void) => {
  const timelineQuery = query(
    collection(db, 'timeline'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  
  const unsubscribe = onSnapshot(timelineQuery, (snapshot) => {
    const events: TimelineEvent[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data
      } as TimelineEvent);
    });
    callback(events);
  });
  
  return unsubscribe;
};

export const deleteTimelineEvent = async (userId: string, eventId: string): Promise<void> => {
  try {
    // Get event data first to delete associated files
    const eventDoc = await getDocs(query(collection(db, 'timeline'), where('__name__', '==', eventId)));
    
    if (!eventDoc.empty) {
      const eventData = eventDoc.docs[0].data();
      
      // Delete associated files from storage
      if (eventData.mediaFileNames && eventData.mediaFileNames.length > 0) {
        for (const fileName of eventData.mediaFileNames) {
          try {
            const storageRef = ref(storage, `galleries/${userId}/timeline/${fileName}`);
            await deleteObject(storageRef);
          } catch (error) {
            console.warn(`Failed to delete file ${fileName}:`, error);
          }
        }
      }
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'timeline', eventId));
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    throw error;
  }
};
import { 
  ref, 
  uploadBytes, 
  listAll, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  where,
  getDocs,
  updateDoc,
  Unsubscribe
} from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { MediaItem, Comment, Like, TimelineEvent } from '../types';

// Media Management
export const uploadUserFiles = async (
  userId: string,
  files: FileList, 
  userName: string, 
  deviceId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  let uploaded = 0;
  
  for (const file of Array.from(files)) {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `galleries/${userId}/media/${fileName}`);
    
    await uploadBytes(storageRef, file);
    
    // Add metadata to user's gallery collection
    const isVideo = file.type.startsWith('video/');
    await addDoc(collection(db, 'galleries', userId, 'media'), {
      name: fileName,
      uploadedBy: userName,
      deviceId: deviceId,
      uploadedAt: new Date().toISOString(),
      type: isVideo ? 'video' : 'image'
    });
    
    uploaded++;
    onProgress((uploaded / files.length) * 100);
  }
};

export const uploadUserVideoBlob = async (
  userId: string,
  videoBlob: Blob, 
  userName: string, 
  deviceId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  const fileName = `video-${Date.now()}.webm`;
  const storageRef = ref(storage, `galleries/${userId}/media/${fileName}`);
  
  await uploadBytes(storageRef, videoBlob);
  onProgress(100);
  
  // Add metadata to user's gallery collection
  await addDoc(collection(db, 'galleries', userId, 'media'), {
    name: fileName,
    uploadedBy: userName,
    deviceId: deviceId,
    uploadedAt: new Date().toISOString(),
    type: 'video'
  });
};

export const loadUserGallery = (userId: string, setMediaItems: (items: MediaItem[]) => void): Unsubscribe => {
  const mediaRef = collection(db, 'galleries', userId, 'media');
  const q = query(mediaRef, orderBy('uploadedAt', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    const items: MediaItem[] = [];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      try {
        let url = '';
        if (data.type === 'note') {
          url = ''; // Notes don't have URLs
        } else {
          const storageRef = ref(storage, `galleries/${userId}/media/${data.name}`);
          url = await getDownloadURL(storageRef);
        }
        
        items.push({
          id: docSnap.id,
          ...data,
          url
        } as MediaItem);
      } catch (error) {
        console.error('Error loading media item:', error);
        // Add item as unavailable
        items.push({
          id: docSnap.id,
          ...data,
          url: '',
          isUnavailable: true
        } as MediaItem);
      }
    }
    
    setMediaItems(items);
  });
};

export const deleteUserMediaItem = async (userId: string, item: MediaItem): Promise<void> => {
  // Delete from storage (if not a note)
  if (item.type !== 'note') {
    const storageRef = ref(storage, `galleries/${userId}/media/${item.name}`);
    await deleteObject(storageRef);
  }
  
  // Delete from Firestore
  const docRef = doc(db, 'galleries', userId, 'media', item.id);
  await deleteDoc(docRef);
};

// Comments Management
export const loadUserComments = (userId: string, setComments: (comments: Comment[]) => void): Unsubscribe => {
  const commentsRef = collection(db, 'galleries', userId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[];
    setComments(comments);
  });
};

export const addUserComment = async (
  userId: string,
  mediaId: string, 
  text: string, 
  userName: string, 
  deviceId: string
): Promise<void> => {
  await addDoc(collection(db, 'galleries', userId, 'comments'), {
    mediaId,
    text,
    userName,
    deviceId,
    createdAt: new Date().toISOString()
  });
};

export const deleteUserComment = async (userId: string, commentId: string): Promise<void> => {
  const docRef = doc(db, 'galleries', userId, 'comments', commentId);
  await deleteDoc(docRef);
};

// Likes Management
export const loadUserLikes = (userId: string, setLikes: (likes: Like[]) => void): Unsubscribe => {
  const likesRef = collection(db, 'galleries', userId, 'likes');
  
  return onSnapshot(likesRef, (snapshot) => {
    const likes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Like[];
    setLikes(likes);
  });
};

export const toggleUserLike = async (
  userId: string,
  mediaId: string, 
  userName: string, 
  deviceId: string
): Promise<void> => {
  const likesRef = collection(db, 'galleries', userId, 'likes');
  const q = query(likesRef, where('mediaId', '==', mediaId), where('deviceId', '==', deviceId));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    // Add like
    await addDoc(likesRef, {
      mediaId,
      userName,
      deviceId,
      createdAt: new Date().toISOString()
    });
  } else {
    // Remove like
    querySnapshot.forEach(async (docSnap) => {
      await deleteDoc(docSnap.ref);
    });
  }
};

// Timeline/Events Management
export const loadUserEvents = (userId: string, setEvents: (events: TimelineEvent[]) => void): Unsubscribe => {
  const eventsRef = collection(db, 'galleries', userId, 'events');
  const q = query(eventsRef, orderBy('date', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TimelineEvent[];
    setEvents(events);
  });
};

export const addUserEvent = async (userId: string, event: Omit<TimelineEvent, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'galleries', userId, 'events'), event);
};

export const updateUserEvent = async (userId: string, eventId: string, updates: Partial<TimelineEvent>): Promise<void> => {
  const eventRef = doc(db, 'galleries', userId, 'events', eventId);
  await updateDoc(eventRef, updates);
};

export const deleteUserEvent = async (userId: string, eventId: string): Promise<void> => {
  const eventRef = doc(db, 'galleries', userId, 'events', eventId);
  await deleteDoc(eventRef);
};

// Notes
export const addUserNote = async (
  userId: string,
  noteText: string, 
  userName: string, 
  deviceId: string
): Promise<void> => {
  await addDoc(collection(db, 'galleries', userId, 'media'), {
    noteText,
    uploadedBy: userName,
    deviceId: deviceId,
    uploadedAt: new Date().toISOString(),
    type: 'note',
    name: `note-${Date.now()}`
  });
};

export const editUserNote = async (
  userId: string,
  noteId: string, 
  noteText: string
): Promise<void> => {
  const noteRef = doc(db, 'galleries', userId, 'media', noteId);
  await updateDoc(noteRef, { 
    noteText,
    editedAt: new Date().toISOString()
  });
};
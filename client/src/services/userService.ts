import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { UserProfile } from '../contexts/AuthContext';

export interface UserStats {
  mediaCount: number;
  eventsCount: number;
  storiesCount: number;
  lastLoginAt?: string;
  isActive?: boolean;
}

// Create user profile in Firestore
export const createUserProfile = async (userProfile: UserProfile): Promise<void> => {
  const userRef = doc(db, 'users', userProfile.uid);
  await setDoc(userRef, {
    ...userProfile,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  });
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  
  return null;
};

// Update user profile
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

// Upload profile picture
export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `profile.${fileExtension}`;
  const storageRef = ref(storage, `users/${uid}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  // Update user profile with new photo URL
  await updateUserProfile(uid, { photoURL: downloadURL });
  
  return downloadURL;
};

// Delete profile picture
export const deleteProfilePicture = async (uid: string, photoURL: string): Promise<void> => {
  try {
    // Delete from storage
    const storageRef = ref(storage, photoURL);
    await deleteObject(storageRef);
    
    // Update user profile to remove photo URL
    await updateUserProfile(uid, { photoURL: undefined });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
};

// Get all users (admin only)
export const getAllUsers = async (): Promise<(UserProfile & UserStats)[]> => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const users: (UserProfile & UserStats)[] = [];
  
  for (const doc of snapshot.docs) {
    const userData = doc.data() as UserProfile;
    
    // Get user stats
    const stats = await getUserStats(userData.uid);
    
    users.push({
      ...userData,
      ...stats
    });
  }
  
  return users;
};

// Get user statistics
export const getUserStats = async (uid: string): Promise<UserStats> => {
  try {
    // Count media items
    const mediaRef = collection(db, 'galleries', uid, 'media');
    const mediaSnap = await getDocs(mediaRef);
    
    // Count events
    const eventsRef = collection(db, 'galleries', uid, 'events');
    const eventsSnap = await getDocs(eventsRef);
    
    // Count stories
    const storiesRef = collection(db, 'galleries', uid, 'stories');
    const storiesSnap = await getDocs(storiesRef);
    
    return {
      mediaCount: mediaSnap.size,
      eventsCount: eventsSnap.size,
      storiesCount: storiesSnap.size,
      isActive: true
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      mediaCount: 0,
      eventsCount: 0,
      storiesCount: 0,
      isActive: true
    };
  }
};

// Deactivate user
export const deactivateUser = async (uid: string): Promise<void> => {
  await updateUserProfile(uid, { isActive: false });
};

// Delete user and all their data
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    // Delete user profile
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    
    // Note: In a full implementation, you would also need to:
    // 1. Delete all user's gallery data
    // 2. Delete all user's files from storage
    // 3. Remove user from Firebase Authentication
    // This requires Firebase Admin SDK or Cloud Functions
    
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
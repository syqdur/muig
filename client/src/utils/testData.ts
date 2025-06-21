import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile } from '../services/userService';
import { addUserNote, addUserEvent } from '../services/galleryService';

export const createTestUser = async () => {
  const testEmail = 'testuser@gallery.com';
  const testPassword = 'testpass123';
  const testDisplayName = 'Test User';

  try {
    // Create the user account
    const { user } = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    
    // Update display name
    await updateProfile(user, { displayName: testDisplayName });
    
    // Create user profile
    const userProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: testDisplayName,
      bio: 'This is a test user account to demonstrate the gallery features. Welcome to my personal gallery!',
      externalLinks: {
        spotify: 'https://open.spotify.com/user/testuser',
        instagram: 'https://instagram.com/testuser'
      },
      createdAt: new Date().toISOString()
    };
    
    await createUserProfile(userProfile);
    
    // Add sample notes
    await addUserNote(user.uid, 'Welcome to my gallery! This is my first note.', testDisplayName, user.uid);
    await addUserNote(user.uid, 'Beautiful sunset today 🌅 Sharing some memories here!', testDisplayName, user.uid);
    await addUserNote(user.uid, 'Testing the note feature - it works perfectly!', testDisplayName, user.uid);
    
    // Add sample timeline events
    const events = [
      {
        title: 'Gallery Created',
        date: new Date().toISOString().split('T')[0],
        description: 'Created my personal gallery account',
        type: 'other' as const,
        createdBy: testDisplayName,
        createdAt: new Date().toISOString(),
        location: 'Online'
      },
      {
        title: 'First Vacation',
        date: '2024-06-15',
        description: 'Amazing trip to the mountains with beautiful scenery',
        type: 'first_vacation' as const,
        createdBy: testDisplayName,
        createdAt: new Date().toISOString(),
        location: 'Swiss Alps'
      },
      {
        title: 'Birthday Celebration',
        date: '2024-08-20',
        description: 'Celebrated another year of life with friends and family',
        type: 'anniversary' as const,
        createdBy: testDisplayName,
        createdAt: new Date().toISOString(),
        location: 'Home'
      }
    ];
    
    for (const event of events) {
      await addUserEvent(user.uid, event);
    }
    
    console.log('Test user created successfully!');
    return { user, profile: userProfile };
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      // User already exists, try to sign in
      try {
        const { user } = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('Test user already exists, signed in successfully!');
        return { user, profile: null };
      } catch (signInError) {
        console.error('Error signing in to existing test user:', signInError);
        throw signInError;
      }
    } else {
      console.error('Error creating test user:', error);
      throw error;
    }
  }
};

export const loginAsTestUser = async () => {
  const testEmail = 'testuser@gallery.com';
  const testPassword = 'testpass123';
  
  try {
    const { user } = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('Logged in as test user successfully!');
    return user;
  } catch (error) {
    console.error('Error logging in as test user:', error);
    throw error;
  }
};
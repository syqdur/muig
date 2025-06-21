import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const loginUser = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const registerUser = async (email: string, password: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Admin authentication (simple check for now)
export const isAdminUser = (email: string): boolean => {
  return email === 'admin@gallery.com'; // You can change this to your admin email
};

export const adminLogin = async (username: string, password: string): Promise<boolean> => {
  // Simple admin check - in production, use proper admin roles
  return username === 'admin' && password === 'test123';
};
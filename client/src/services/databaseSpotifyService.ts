import { apiClient } from './apiClient';

// Convert Firebase user ID to database user ID
const getUserDbId = (firebaseUid: string): number => {
  return parseInt(firebaseUid.replace(/[^0-9]/g, '').slice(0, 8)) || 1;
};

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  preview_url: string | null;
}

// Load user's music wishlist from database
export const loadUserMusicWishlist = (userId: string, callback: (tracks: SpotifyTrack[]) => void) => {
  const dbUserId = getUserDbId(userId);
  
  const loadData = async () => {
    try {
      const wishlistItems = await apiClient.getUserMusic(dbUserId);
      
      // Convert database items to SpotifyTrack format
      const tracks: SpotifyTrack[] = wishlistItems.map((item: any) => ({
        id: item.spotifyTrackId,
        name: item.trackName,
        artists: [{ name: item.artistName }],
        album: { 
          name: item.albumName || '', 
          images: item.albumImage ? [{ url: item.albumImage }] : [] 
        },
        preview_url: item.previewUrl
      }));
      
      callback(tracks);
    } catch (error) {
      console.error('Error loading music wishlist:', error);
      callback([]);
    }
  };
  
  loadData();
  const interval = setInterval(loadData, 10000); // Poll every 10 seconds
  return () => clearInterval(interval);
};

// Add track to user's music wishlist
export const addTrackToWishlist = async (
  userId: string,
  track: SpotifyTrack,
  addedBy: string
): Promise<void> => {
  const dbUserId = getUserDbId(userId);
  
  await apiClient.createMusicItem(dbUserId, {
    userId: dbUserId,
    spotifyTrackId: track.id,
    trackName: track.name,
    artistName: track.artists[0]?.name || 'Unknown Artist',
    albumName: track.album?.name || '',
    albumImage: track.album?.images[0]?.url || null,
    previewUrl: track.preview_url,
    addedBy: addedBy
  });
};

// Remove track from user's music wishlist
export const removeTrackFromWishlist = async (trackId: string): Promise<void> => {
  // For now, we need to implement a way to find the database ID by Spotify track ID
  // This could be improved by adding a route to delete by spotifyTrackId
  console.log('Remove track not yet implemented for database');
};

// Get selected playlist (placeholder for now)
export const getSelectedPlaylist = async () => {
  return null;
};

// Save selected playlist (placeholder for now)
export const saveSelectedPlaylist = async (playlistId: string) => {
  console.log('Save selected playlist not yet implemented for database');
};

// Spotify API functions (these remain the same as they interact with Spotify directly)
export const isSpotifyConnected = async (): Promise<boolean> => {
  const token = localStorage.getItem('spotify_access_token');
  return !!token;
};

export const getAuthorizationUrl = async (): Promise<string> => {
  const clientId = '4dbf85a8ca7c43d3b2ddc540194e9387';
  const redirectUri = 'https://kristinundmauro.replit.app/';
  const scopes = 'user-read-private playlist-read-private playlist-modify-public playlist-modify-private';
  
  return `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
};

export const disconnectSpotify = async (): Promise<void> => {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('spotify_access_token');
  if (!token) throw new Error('No access token');
  
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to get user');
  return response.json();
};

export const getUserPlaylists = async () => {
  const token = localStorage.getItem('spotify_access_token');
  if (!token) throw new Error('No access token');
  
  const response = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to get playlists');
  const data = await response.json();
  return data.items || [];
};

export const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
  const token = localStorage.getItem('spotify_access_token');
  if (!token) throw new Error('No access token');
  
  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to search tracks');
  const data = await response.json();
  return data.tracks?.items || [];
};
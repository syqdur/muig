import { 
  User, Gallery, MediaItem, Comment, Like, TimelineEvent, Story,
  InsertUser, InsertGallery, InsertMediaItem, InsertComment, InsertLike, InsertTimelineEvent, InsertStory 
} from '@shared/schema';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.error || 'Unknown error');
  }

  return response.json();
}

// User API
export const userApi = {
  create: (user: InsertUser) => apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
  
  getByUsername: (username: string) => apiRequest<User>(`/users/username/${username}`),
  
  getByEmail: (email: string) => apiRequest<User>(`/users/email/${email}`),
  
  getById: (id: number) => apiRequest<User>(`/users/${id}`),
  
  update: (id: number, updates: Partial<User>) => apiRequest<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
};

// Gallery API
export const galleryApi = {
  create: (gallery: InsertGallery) => apiRequest<Gallery>('/galleries', {
    method: 'POST',
    body: JSON.stringify(gallery),
  }),
  
  getUserGalleries: (userId: number) => apiRequest<Gallery[]>(`/users/${userId}/galleries`),
  
  getById: (id: number) => apiRequest<Gallery>(`/galleries/${id}`),
  
  update: (id: number, updates: Partial<Gallery>) => apiRequest<Gallery>(`/galleries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  
  delete: (id: number) => apiRequest<{ success: boolean }>(`/galleries/${id}`, {
    method: 'DELETE',
  }),
};

// Media API
export const mediaApi = {
  create: (media: InsertMediaItem) => apiRequest<MediaItem>('/media', {
    method: 'POST',
    body: JSON.stringify(media),
  }),
  
  getGalleryMedia: (galleryId: number) => apiRequest<MediaItem[]>(`/galleries/${galleryId}/media`),
  
  getById: (id: number) => apiRequest<MediaItem>(`/media/${id}`),
  
  update: (id: number, updates: Partial<MediaItem>) => apiRequest<MediaItem>(`/media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  
  delete: (id: number) => apiRequest<{ success: boolean }>(`/media/${id}`, {
    method: 'DELETE',
  }),
};

// Comment API
export const commentApi = {
  create: (comment: InsertComment) => apiRequest<Comment>('/comments', {
    method: 'POST',
    body: JSON.stringify(comment),
  }),
  
  getMediaComments: (mediaId: number) => apiRequest<Comment[]>(`/media/${mediaId}/comments`),
  
  delete: (id: number) => apiRequest<{ success: boolean }>(`/comments/${id}`, {
    method: 'DELETE',
  }),
};

// Like API
export const likeApi = {
  create: (like: InsertLike) => apiRequest<Like>('/likes', {
    method: 'POST',
    body: JSON.stringify(like),
  }),
  
  getMediaLikes: (mediaId: number) => apiRequest<Like[]>(`/media/${mediaId}/likes`),
  
  toggle: (mediaId: number, userName: string, deviceId: string) => 
    apiRequest<{ liked: boolean }>(`/media/${mediaId}/toggle-like`, {
      method: 'POST',
      body: JSON.stringify({ userName, deviceId }),
    }),
};

// Timeline API
export const timelineApi = {
  create: (event: InsertTimelineEvent) => apiRequest<TimelineEvent>('/timeline', {
    method: 'POST',
    body: JSON.stringify(event),
  }),
  
  getGalleryEvents: (galleryId: number) => apiRequest<TimelineEvent[]>(`/galleries/${galleryId}/timeline`),
  
  update: (id: number, updates: Partial<TimelineEvent>) => apiRequest<TimelineEvent>(`/timeline/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  
  delete: (id: number) => apiRequest<{ success: boolean }>(`/timeline/${id}`, {
    method: 'DELETE',
  }),
};

// Story API
export const storyApi = {
  create: (story: InsertStory) => apiRequest<Story>('/stories', {
    method: 'POST',
    body: JSON.stringify(story),
  }),
  
  getUserStories: (userId: number) => apiRequest<Story[]>(`/users/${userId}/stories`),
  
  delete: (id: number) => apiRequest<{ success: boolean }>(`/stories/${id}`, {
    method: 'DELETE',
  }),
  
  markViewed: (id: number, viewerId: string) => apiRequest<{ success: boolean }>(`/stories/${id}/view`, {
    method: 'POST',
    body: JSON.stringify({ viewerId }),
  }),
};

export { ApiError };
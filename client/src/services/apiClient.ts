// API client for database operations
const API_BASE = '';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // User operations
  async getUser(id: number) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // User profile operations
  async getUserProfile(userId: number) {
    return this.request(`/users/${userId}/profile`);
  }

  async createUserProfile(userId: number, profileData: any) {
    return this.request(`/users/${userId}/profile`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async updateUserProfile(userId: number, profileData: any) {
    return this.request(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Media operations
  async getUserMedia(userId: number) {
    return this.request(`/users/${userId}/media`);
  }

  async createMediaItem(userId: number, mediaData: any) {
    return this.request(`/users/${userId}/media`, {
      method: 'POST',
      body: JSON.stringify(mediaData),
    });
  }

  async deleteMediaItem(mediaId: number) {
    return this.request(`/media/${mediaId}`, {
      method: 'DELETE',
    });
  }

  // Comments operations
  async getUserComments(userId: number) {
    return this.request(`/users/${userId}/comments`);
  }

  async createComment(userId: number, commentData: any) {
    return this.request(`/users/${userId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async deleteComment(commentId: number) {
    return this.request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Likes operations
  async getUserLikes(userId: number) {
    return this.request(`/users/${userId}/likes`);
  }

  async createLike(userId: number, likeData: any) {
    return this.request(`/users/${userId}/likes`, {
      method: 'POST',
      body: JSON.stringify(likeData),
    });
  }

  async deleteLike(mediaId: number, userId: number) {
    return this.request(`/likes/${mediaId}/${userId}`, {
      method: 'DELETE',
    });
  }

  // Timeline operations
  async getUserTimeline(userId: number) {
    return this.request(`/users/${userId}/timeline`);
  }

  async createTimelineEvent(userId: number, eventData: any) {
    return this.request(`/users/${userId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateTimelineEvent(eventId: number, eventData: any) {
    return this.request(`/timeline/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteTimelineEvent(eventId: number) {
    return this.request(`/timeline/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Stories operations
  async getUserStories(userId: number) {
    return this.request(`/users/${userId}/stories`);
  }

  async createStory(userId: number, storyData: any) {
    return this.request(`/users/${userId}/stories`, {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
  }

  async deleteStory(storyId: number) {
    return this.request(`/stories/${storyId}`, {
      method: 'DELETE',
    });
  }

  // Music operations
  async getUserMusic(userId: number) {
    return this.request(`/users/${userId}/music`);
  }

  async createMusicItem(userId: number, musicData: any) {
    return this.request(`/users/${userId}/music`, {
      method: 'POST',
      body: JSON.stringify(musicData),
    });
  }

  async deleteMusicItem(musicId: number) {
    return this.request(`/music/${musicId}`, {
      method: 'DELETE',
    });
  }

  // Site status operations
  async getSiteStatus() {
    return this.request('/site-status');
  }

  async updateSiteStatus(statusData: any) {
    return this.request('/site-status', {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  }
}

export const apiClient = new ApiClient();
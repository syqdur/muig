import { apiClient } from './apiClient';

export interface AnonymousUser {
  id: number;
  name: string;
  deviceId: string;
  createdAt: string;
}

export interface CreateAnonymousUserData {
  name: string;
  deviceId: string;
}

class AnonymousUserService {
  async getOrCreateUser(name: string, deviceId: string): Promise<AnonymousUser> {
    try {
      // Try to get existing user first
      const existingUser = await this.getUserByDeviceId(deviceId);
      if (existingUser) {
        return existingUser;
      }
    } catch (error) {
      // User doesn't exist, continue to create
    }

    // Create new user
    return this.createUser({ name, deviceId });
  }

  async getUserByDeviceId(deviceId: string): Promise<AnonymousUser> {
    return apiClient.getAnonymousUser(deviceId);
  }

  async createUser(userData: CreateAnonymousUserData): Promise<AnonymousUser> {
    return apiClient.createAnonymousUser(userData);
  }
}

export const anonymousUserService = new AnonymousUserService();
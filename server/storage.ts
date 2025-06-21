import { 
  users, galleries, mediaItems, comments, likes, timelineEvents, stories,
  type User, type InsertUser, type Gallery, type InsertGallery, 
  type MediaItem, type InsertMediaItem, type Comment, type InsertComment,
  type Like, type InsertLike, type TimelineEvent, type InsertTimelineEvent,
  type Story, type InsertStory
} from "@shared/schema";
import { db } from './db';
import { eq } from 'drizzle-orm';

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Gallery management
  createGallery(gallery: InsertGallery): Promise<Gallery>;
  getUserGalleries(userId: number): Promise<Gallery[]>;
  getGallery(id: number): Promise<Gallery | undefined>;
  updateGallery(id: number, updates: Partial<Gallery>): Promise<Gallery | undefined>;
  deleteGallery(id: number): Promise<boolean>;

  // Media items
  createMediaItem(item: InsertMediaItem): Promise<MediaItem>;
  getGalleryMediaItems(galleryId: number): Promise<MediaItem[]>;
  getMediaItem(id: number): Promise<MediaItem | undefined>;
  updateMediaItem(id: number, updates: Partial<MediaItem>): Promise<MediaItem | undefined>;
  deleteMediaItem(id: number): Promise<boolean>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getMediaComments(mediaId: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<boolean>;

  // Likes
  createLike(like: InsertLike): Promise<Like>;
  getMediaLikes(mediaId: number): Promise<Like[]>;
  deleteLike(id: number): Promise<boolean>;
  toggleLike(mediaId: number, userName: string, deviceId: string): Promise<boolean>;

  // Timeline events
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  getGalleryTimelineEvents(galleryId: number): Promise<TimelineEvent[]>;
  updateTimelineEvent(id: number, updates: Partial<TimelineEvent>): Promise<TimelineEvent | undefined>;
  deleteTimelineEvent(id: number): Promise<boolean>;

  // Stories
  createStory(story: InsertStory): Promise<Story>;
  getUserStories(userId: number): Promise<Story[]>;
  deleteStory(id: number): Promise<boolean>;
  markStoryViewed(storyId: number, viewerId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private galleries: Map<number, Gallery>;
  private mediaItems: Map<number, MediaItem>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private timelineEvents: Map<number, TimelineEvent>;
  private stories: Map<number, Story>;
  private currentUserId: number;
  private currentGalleryId: number;
  private currentMediaId: number;
  private currentCommentId: number;
  private currentLikeId: number;
  private currentEventId: number;
  private currentStoryId: number;

  constructor() {
    this.users = new Map();
    this.galleries = new Map();
    this.mediaItems = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.timelineEvents = new Map();
    this.stories = new Map();
    this.currentUserId = 1;
    this.currentGalleryId = 1;
    this.currentMediaId = 1;
    this.currentCommentId = 1;
    this.currentLikeId = 1;
    this.currentEventId = 1;
    this.currentStoryId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      displayName: insertUser.displayName,
      photoURL: insertUser.photoURL ?? null,
      bio: insertUser.bio ?? null,
      externalLinks: insertUser.externalLinks ? {
        spotify: insertUser.externalLinks.spotify as string,
        instagram: insertUser.externalLinks.instagram as string
      } : null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Gallery methods
  async createGallery(insertGallery: InsertGallery): Promise<Gallery> {
    const id = this.currentGalleryId++;
    const gallery: Gallery = {
      id,
      userId: insertGallery.userId,
      name: insertGallery.name,
      description: insertGallery.description ?? null,
      isPrivate: insertGallery.isPrivate ?? true,
      createdAt: new Date()
    };
    this.galleries.set(id, gallery);
    return gallery;
  }

  async getUserGalleries(userId: number): Promise<Gallery[]> {
    return Array.from(this.galleries.values()).filter(gallery => gallery.userId === userId);
  }

  async getGallery(id: number): Promise<Gallery | undefined> {
    return this.galleries.get(id);
  }

  async updateGallery(id: number, updates: Partial<Gallery>): Promise<Gallery | undefined> {
    const gallery = this.galleries.get(id);
    if (!gallery) return undefined;
    
    const updatedGallery = { ...gallery, ...updates };
    this.galleries.set(id, updatedGallery);
    return updatedGallery;
  }

  async deleteGallery(id: number): Promise<boolean> {
    return this.galleries.delete(id);
  }

  // Media item methods
  async createMediaItem(insertItem: InsertMediaItem): Promise<MediaItem> {
    const id = this.currentMediaId++;
    const item: MediaItem = {
      id,
      galleryId: insertItem.galleryId,
      name: insertItem.name,
      url: insertItem.url ?? null,
      type: insertItem.type,
      noteText: insertItem.noteText ?? null,
      uploadedBy: insertItem.uploadedBy,
      deviceId: insertItem.deviceId,
      uploadedAt: new Date(),
      isUnavailable: insertItem.isUnavailable ?? null
    };
    this.mediaItems.set(id, item);
    return item;
  }

  async getGalleryMediaItems(galleryId: number): Promise<MediaItem[]> {
    return Array.from(this.mediaItems.values())
      .filter(item => item.galleryId === galleryId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async getMediaItem(id: number): Promise<MediaItem | undefined> {
    return this.mediaItems.get(id);
  }

  async updateMediaItem(id: number, updates: Partial<MediaItem>): Promise<MediaItem | undefined> {
    const item = this.mediaItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.mediaItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteMediaItem(id: number): Promise<boolean> {
    return this.mediaItems.delete(id);
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getMediaComments(mediaId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.mediaId === mediaId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Like methods
  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.currentLikeId++;
    const like: Like = {
      ...insertLike,
      id,
      createdAt: new Date()
    };
    this.likes.set(id, like);
    return like;
  }

  async getMediaLikes(mediaId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.mediaId === mediaId);
  }

  async deleteLike(id: number): Promise<boolean> {
    return this.likes.delete(id);
  }

  async toggleLike(mediaId: number, userName: string, deviceId: string): Promise<boolean> {
    const existingLike = Array.from(this.likes.values()).find(
      like => like.mediaId === mediaId && like.deviceId === deviceId
    );

    if (existingLike) {
      this.likes.delete(existingLike.id);
      return false; // Removed like
    } else {
      await this.createLike({ mediaId, userName, deviceId });
      return true; // Added like
    }
  }

  // Timeline event methods
  async createTimelineEvent(insertEvent: InsertTimelineEvent): Promise<TimelineEvent> {
    const id = this.currentEventId++;
    const event: TimelineEvent = {
      id,
      galleryId: insertEvent.galleryId,
      title: insertEvent.title,
      customEventName: insertEvent.customEventName ?? null,
      date: insertEvent.date,
      description: insertEvent.description,
      location: insertEvent.location ?? null,
      type: insertEvent.type,
      createdBy: insertEvent.createdBy,
      mediaUrls: insertEvent.mediaUrls ? [...insertEvent.mediaUrls] : null,
      mediaTypes: insertEvent.mediaTypes ? [...insertEvent.mediaTypes] : null,
      mediaFileNames: insertEvent.mediaFileNames ? [...insertEvent.mediaFileNames] : null,
      createdAt: new Date()
    };
    this.timelineEvents.set(id, event);
    return event;
  }

  async getGalleryTimelineEvents(galleryId: number): Promise<TimelineEvent[]> {
    return Array.from(this.timelineEvents.values())
      .filter(event => event.galleryId === galleryId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async updateTimelineEvent(id: number, updates: Partial<TimelineEvent>): Promise<TimelineEvent | undefined> {
    const event = this.timelineEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...updates };
    this.timelineEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteTimelineEvent(id: number): Promise<boolean> {
    return this.timelineEvents.delete(id);
  }

  // Story methods
  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.currentStoryId++;
    const story: Story = {
      id,
      userId: insertStory.userId,
      mediaUrl: insertStory.mediaUrl,
      mediaType: insertStory.mediaType,
      userName: insertStory.userName,
      deviceId: insertStory.deviceId,
      fileName: insertStory.fileName ?? null,
      views: insertStory.views ? [...insertStory.views] : [],
      createdAt: new Date(),
      expiresAt: insertStory.expiresAt
    };
    this.stories.set(id, story);
    return story;
  }

  async getUserStories(userId: number): Promise<Story[]> {
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => story.userId === userId && story.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteStory(id: number): Promise<boolean> {
    return this.stories.delete(id);
  }

  async markStoryViewed(storyId: number, viewerId: string): Promise<boolean> {
    const story = this.stories.get(storyId);
    if (!story) return false;

    const views = story.views || [];
    if (!views.includes(viewerId)) {
      views.push(viewerId);
      const updatedStory = { ...story, views };
      this.stories.set(storyId, updatedStory);
    }
    return true;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async createGallery(insertGallery: InsertGallery): Promise<Gallery> {
    const [gallery] = await db
      .insert(galleries)
      .values(insertGallery)
      .returning();
    return gallery;
  }

  async getUserGalleries(userId: number): Promise<Gallery[]> {
    return await db.select().from(galleries).where(eq(galleries.userId, userId));
  }

  async getGallery(id: number): Promise<Gallery | undefined> {
    const [gallery] = await db.select().from(galleries).where(eq(galleries.id, id));
    return gallery || undefined;
  }

  async updateGallery(id: number, updates: Partial<Gallery>): Promise<Gallery | undefined> {
    const [gallery] = await db
      .update(galleries)
      .set(updates)
      .where(eq(galleries.id, id))
      .returning();
    return gallery || undefined;
  }

  async deleteGallery(id: number): Promise<boolean> {
    const result = await db.delete(galleries).where(eq(galleries.id, id));
    return result.rowCount > 0;
  }

  async createMediaItem(insertItem: InsertMediaItem): Promise<MediaItem> {
    const [item] = await db
      .insert(mediaItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async getGalleryMediaItems(galleryId: number): Promise<MediaItem[]> {
    return await db.select().from(mediaItems).where(eq(mediaItems.galleryId, galleryId));
  }

  async getMediaItem(id: number): Promise<MediaItem | undefined> {
    const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, id));
    return item || undefined;
  }

  async updateMediaItem(id: number, updates: Partial<MediaItem>): Promise<MediaItem | undefined> {
    const [item] = await db
      .update(mediaItems)
      .set(updates)
      .where(eq(mediaItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteMediaItem(id: number): Promise<boolean> {
    const result = await db.delete(mediaItems).where(eq(mediaItems.id, id));
    return result.rowCount > 0;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getMediaComments(mediaId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.mediaId, mediaId));
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return result.rowCount > 0;
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values(insertLike)
      .returning();
    return like;
  }

  async getMediaLikes(mediaId: number): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.mediaId, mediaId));
  }

  async deleteLike(id: number): Promise<boolean> {
    const result = await db.delete(likes).where(eq(likes.id, id));
    return result.rowCount > 0;
  }

  async toggleLike(mediaId: number, userName: string, deviceId: string): Promise<boolean> {
    const existingLikes = await db
      .select()
      .from(likes)
      .where(eq(likes.mediaId, mediaId))
      .where(eq(likes.deviceId, deviceId));

    if (existingLikes.length > 0) {
      await db.delete(likes).where(eq(likes.id, existingLikes[0].id));
      return false;
    } else {
      await db.insert(likes).values({
        mediaId,
        userName,
        deviceId,
      });
      return true;
    }
  }

  async createTimelineEvent(insertEvent: InsertTimelineEvent): Promise<TimelineEvent> {
    const [event] = await db
      .insert(timelineEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getGalleryTimelineEvents(galleryId: number): Promise<TimelineEvent[]> {
    return await db.select().from(timelineEvents).where(eq(timelineEvents.galleryId, galleryId));
  }

  async updateTimelineEvent(id: number, updates: Partial<TimelineEvent>): Promise<TimelineEvent | undefined> {
    const [event] = await db
      .update(timelineEvents)
      .set(updates)
      .where(eq(timelineEvents.id, id))
      .returning();
    return event || undefined;
  }

  async deleteTimelineEvent(id: number): Promise<boolean> {
    const result = await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
    return result.rowCount > 0;
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const [story] = await db
      .insert(stories)
      .values(insertStory)
      .returning();
    return story;
  }

  async getUserStories(userId: number): Promise<Story[]> {
    return await db.select().from(stories).where(eq(stories.userId, userId));
  }

  async deleteStory(id: number): Promise<boolean> {
    const result = await db.delete(stories).where(eq(stories.id, id));
    return result.rowCount > 0;
  }

  async markStoryViewed(storyId: number, viewerId: string): Promise<boolean> {
    const [story] = await db.select().from(stories).where(eq(stories.id, storyId));
    if (!story) return false;

    const currentViews = story.views || [];
    if (!currentViews.includes(viewerId)) {
      const updatedViews = [...currentViews, viewerId];
      await db
        .update(stories)
        .set({ views: updatedViews })
        .where(eq(stories.id, storyId));
    }
    return true;
  }
}

export const storage = new DatabaseStorage();

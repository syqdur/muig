import { users, userProfiles, mediaItems, comments, likes, timelineEvents, stories, musicWishlist, siteStatus, type User, type InsertUser, type UserProfile, type InsertUserProfile, type MediaItem, type InsertMediaItem, type Comment, type InsertComment, type Like, type InsertLike, type TimelineEvent, type InsertTimelineEvent, type Story, type InsertStory, type MusicWishlistItem, type InsertMusicWishlistItem, type SiteStatus, type InsertSiteStatus } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User profiles
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  
  // Media items
  getUserMediaItems(userId: number): Promise<MediaItem[]>;
  createMediaItem(item: InsertMediaItem): Promise<MediaItem>;
  deleteMediaItem(id: number): Promise<void>;
  updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined>;
  
  // Comments
  getMediaComments(mediaId: number): Promise<Comment[]>;
  getUserComments(userId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
  
  // Likes
  getMediaLikes(mediaId: number): Promise<Like[]>;
  getUserLikes(userId: number): Promise<Like[]>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(mediaId: number, userId: number): Promise<void>;
  
  // Timeline events
  getUserTimelineEvents(userId: number): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(id: number, event: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined>;
  deleteTimelineEvent(id: number): Promise<void>;
  
  // Stories
  getUserStories(userId: number): Promise<Story[]>;
  getActiveStories(userId: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  deleteStory(id: number): Promise<void>;
  
  // Music wishlist
  getUserMusicWishlist(userId: number): Promise<MusicWishlistItem[]>;
  createMusicWishlistItem(item: InsertMusicWishlistItem): Promise<MusicWishlistItem>;
  deleteMusicWishlistItem(id: number): Promise<void>;
  
  // Site status
  getSiteStatus(): Promise<SiteStatus | undefined>;
  updateSiteStatus(status: InsertSiteStatus): Promise<SiteStatus>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // User profiles
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile || undefined;
  }

  // Media items
  async getUserMediaItems(userId: number): Promise<MediaItem[]> {
    return await db.select().from(mediaItems).where(eq(mediaItems.userId, userId)).orderBy(desc(mediaItems.createdAt));
  }

  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    const [newItem] = await db
      .insert(mediaItems)
      .values(item)
      .returning();
    return newItem;
  }

  async deleteMediaItem(id: number): Promise<void> {
    await db.delete(mediaItems).where(eq(mediaItems.id, id));
  }

  async updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
    const [updatedItem] = await db
      .update(mediaItems)
      .set(item)
      .where(eq(mediaItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  // Comments
  async getMediaComments(mediaId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.mediaId, mediaId)).orderBy(desc(comments.createdAt));
  }

  async getUserComments(userId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.userId, userId)).orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Likes
  async getMediaLikes(mediaId: number): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.mediaId, mediaId));
  }

  async getUserLikes(userId: number): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.userId, userId));
  }

  async createLike(like: InsertLike): Promise<Like> {
    const [newLike] = await db
      .insert(likes)
      .values(like)
      .returning();
    return newLike;
  }

  async deleteLike(mediaId: number, userId: number): Promise<void> {
    await db.delete(likes).where(and(eq(likes.mediaId, mediaId), eq(likes.userId, userId)));
  }

  // Timeline events
  async getUserTimelineEvents(userId: number): Promise<TimelineEvent[]> {
    return await db.select().from(timelineEvents).where(eq(timelineEvents.userId, userId)).orderBy(desc(timelineEvents.createdAt));
  }

  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const [newEvent] = await db
      .insert(timelineEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async updateTimelineEvent(id: number, event: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const [updatedEvent] = await db
      .update(timelineEvents)
      .set(event)
      .where(eq(timelineEvents.id, id))
      .returning();
    return updatedEvent || undefined;
  }

  async deleteTimelineEvent(id: number): Promise<void> {
    await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
  }

  // Stories
  async getUserStories(userId: number): Promise<Story[]> {
    return await db.select().from(stories).where(eq(stories.userId, userId)).orderBy(desc(stories.createdAt));
  }

  async getActiveStories(userId: number): Promise<Story[]> {
    const now = new Date();
    return await db.select().from(stories)
      .where(eq(stories.userId, userId))
      .orderBy(desc(stories.createdAt));
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [newStory] = await db
      .insert(stories)
      .values(story)
      .returning();
    return newStory;
  }

  async deleteStory(id: number): Promise<void> {
    await db.delete(stories).where(eq(stories.id, id));
  }

  // Music wishlist
  async getUserMusicWishlist(userId: number): Promise<MusicWishlistItem[]> {
    return await db.select().from(musicWishlist).where(eq(musicWishlist.userId, userId)).orderBy(desc(musicWishlist.createdAt));
  }

  async createMusicWishlistItem(item: InsertMusicWishlistItem): Promise<MusicWishlistItem> {
    const [newItem] = await db
      .insert(musicWishlist)
      .values(item)
      .returning();
    return newItem;
  }

  async deleteMusicWishlistItem(id: number): Promise<void> {
    await db.delete(musicWishlist).where(eq(musicWishlist.id, id));
  }

  // Site status
  async getSiteStatus(): Promise<SiteStatus | undefined> {
    const [status] = await db.select().from(siteStatus).orderBy(desc(siteStatus.updatedAt)).limit(1);
    return status || undefined;
  }

  async updateSiteStatus(status: InsertSiteStatus): Promise<SiteStatus> {
    const [updatedStatus] = await db
      .insert(siteStatus)
      .values(status)
      .returning();
    return updatedStatus;
  }
}

export const storage = new DatabaseStorage();
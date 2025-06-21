import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User profiles for extended information
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  photoURL: text("photo_url"),
  externalLinks: jsonb("external_links"), // For Spotify, Instagram etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media items for each user's gallery
export const mediaItems = pgTable("media_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firebaseId: text("firebase_id"), // Reference to Firebase storage
  type: text("type").notNull(), // 'image', 'video', 'note'
  url: text("url"),
  fileName: text("file_name"),
  uploadedBy: text("uploaded_by").notNull(),
  text: text("text"), // For notes
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments on media items
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  mediaId: integer("media_id").notNull().references(() => mediaItems.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Likes on media items
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  mediaId: integer("media_id").notNull().references(() => mediaItems.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Timeline events
export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  customEventName: text("custom_event_name"),
  date: text("date").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  type: text("type").notNull(), // 'first_date', 'engagement', etc.
  createdBy: text("created_by").notNull(),
  mediaUrls: text("media_urls").array(),
  mediaTypes: text("media_types").array(),
  mediaFileNames: text("media_file_names").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stories
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firebaseId: text("firebase_id").unique(),
  type: text("type").notNull(), // 'image', 'video'
  url: text("url").notNull(),
  text: text("text"),
  uploadedBy: text("uploaded_by").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Music wishlist (Spotify integration)
export const musicWishlist = pgTable("music_wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  spotifyTrackId: text("spotify_track_id").notNull(),
  trackName: text("track_name").notNull(),
  artistName: text("artist_name").notNull(),
  albumName: text("album_name"),
  albumImage: text("album_image"),
  previewUrl: text("preview_url"),
  addedBy: text("added_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Site status for admin controls
export const siteStatus = pgTable("site_status", {
  id: serial("id").primaryKey(),
  isUnderConstruction: boolean("is_under_construction").default(false),
  launchDate: timestamp("launch_date"),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  mediaItems: many(mediaItems),
  comments: many(comments),
  likes: many(likes),
  timelineEvents: many(timelineEvents),
  stories: many(stories),
  musicWishlist: many(musicWishlist),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one, many }) => ({
  user: one(users, {
    fields: [mediaItems.userId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields: [comments.mediaId],
    references: [mediaItems.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields: [likes.mediaId],
    references: [mediaItems.id],
  }),
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  user: one(users, {
    fields: [timelineEvents.userId],
    references: [users.id],
  }),
}));

export const storiesRelations = relations(stories, ({ one }) => ({
  user: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
}));

export const musicWishlistRelations = relations(musicWishlist, ({ one }) => ({
  user: one(users, {
    fields: [musicWishlist.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMediaItemSchema = createInsertSchema(mediaItems).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents).omit({
  id: true,
  createdAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

export const insertMusicWishlistSchema = createInsertSchema(musicWishlist).omit({
  id: true,
  createdAt: true,
});

export const insertSiteStatusSchema = createInsertSchema(siteStatus).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type MusicWishlistItem = typeof musicWishlist.$inferSelect;
export type InsertMusicWishlistItem = z.infer<typeof insertMusicWishlistSchema>;
export type SiteStatus = typeof siteStatus.$inferSelect;
export type InsertSiteStatus = z.infer<typeof insertSiteStatusSchema>;

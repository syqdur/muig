import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  photoURL: text("photo_url"),
  bio: text("bio"),
  externalLinks: jsonb("external_links").$type<{
    spotify?: string;
    instagram?: string;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const galleries = pgTable("galleries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mediaItems = pgTable("media_items", {
  id: serial("id").primaryKey(),
  galleryId: integer("gallery_id").notNull().references(() => galleries.id),
  name: text("name").notNull(),
  url: text("url"),
  type: text("type", { enum: ["image", "video", "note"] }).notNull(),
  noteText: text("note_text"),
  uploadedBy: text("uploaded_by").notNull(),
  deviceId: text("device_id").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  isUnavailable: boolean("is_unavailable").default(false),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  mediaId: integer("media_id").notNull().references(() => mediaItems.id),
  text: text("text").notNull(),
  userName: text("user_name").notNull(),
  deviceId: text("device_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  mediaId: integer("media_id").notNull().references(() => mediaItems.id),
  userName: text("user_name").notNull(),
  deviceId: text("device_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  galleryId: integer("gallery_id").notNull().references(() => galleries.id),
  title: text("title").notNull(),
  customEventName: text("custom_event_name"),
  date: text("date").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  type: text("type", { 
    enum: ["first_date", "first_kiss", "first_vacation", "engagement", "moving_together", "anniversary", "custom", "other"] 
  }).notNull(),
  createdBy: text("created_by").notNull(),
  mediaUrls: jsonb("media_urls").$type<string[]>(),
  mediaTypes: jsonb("media_types").$type<string[]>(),
  mediaFileNames: jsonb("media_file_names").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type", { enum: ["image", "video"] }).notNull(),
  userName: text("user_name").notNull(),
  deviceId: text("device_id").notNull(),
  fileName: text("file_name"),
  views: jsonb("views").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertGallerySchema = createInsertSchema(galleries).omit({
  id: true,
  createdAt: true,
});

export const insertMediaItemSchema = createInsertSchema(mediaItems).omit({
  id: true,
  uploadedAt: true,
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Gallery = typeof galleries.$inferSelect;
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;
export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

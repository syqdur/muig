import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertGallerySchema, insertMediaItemSchema, 
  insertCommentSchema, insertLikeSchema, insertTimelineEventSchema, insertStorySchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(parseInt(req.params.id), req.body);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gallery routes
  app.post("/api/galleries", async (req, res) => {
    try {
      const galleryData = insertGallerySchema.parse(req.body);
      const gallery = await storage.createGallery(galleryData);
      res.json(gallery);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/galleries", async (req, res) => {
    try {
      const galleries = await storage.getUserGalleries(parseInt(req.params.userId));
      res.json(galleries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/galleries/:id", async (req, res) => {
    try {
      const gallery = await storage.getGallery(parseInt(req.params.id));
      if (!gallery) return res.status(404).json({ error: "Gallery not found" });
      res.json(gallery);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/galleries/:id", async (req, res) => {
    try {
      const gallery = await storage.updateGallery(parseInt(req.params.id), req.body);
      if (!gallery) return res.status(404).json({ error: "Gallery not found" });
      res.json(gallery);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/galleries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGallery(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: "Gallery not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Media item routes
  app.post("/api/media", async (req, res) => {
    try {
      const mediaData = insertMediaItemSchema.parse(req.body);
      const media = await storage.createMediaItem(mediaData);
      res.json(media);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/galleries/:galleryId/media", async (req, res) => {
    try {
      const media = await storage.getGalleryMediaItems(parseInt(req.params.galleryId));
      res.json(media);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/media/:id", async (req, res) => {
    try {
      const media = await storage.getMediaItem(parseInt(req.params.id));
      if (!media) return res.status(404).json({ error: "Media not found" });
      res.json(media);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/media/:id", async (req, res) => {
    try {
      const media = await storage.updateMediaItem(parseInt(req.params.id), req.body);
      if (!media) return res.status(404).json({ error: "Media not found" });
      res.json(media);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMediaItem(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: "Media not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Comment routes
  app.post("/api/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/media/:mediaId/comments", async (req, res) => {
    try {
      const comments = await storage.getMediaComments(parseInt(req.params.mediaId));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteComment(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: "Comment not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Like routes
  app.post("/api/likes", async (req, res) => {
    try {
      const likeData = insertLikeSchema.parse(req.body);
      const like = await storage.createLike(likeData);
      res.json(like);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/media/:mediaId/likes", async (req, res) => {
    try {
      const likes = await storage.getMediaLikes(parseInt(req.params.mediaId));
      res.json(likes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/media/:mediaId/toggle-like", async (req, res) => {
    try {
      const { userName, deviceId } = req.body;
      const liked = await storage.toggleLike(parseInt(req.params.mediaId), userName, deviceId);
      res.json({ liked });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Timeline event routes
  app.post("/api/timeline", async (req, res) => {
    try {
      const eventData = insertTimelineEventSchema.parse(req.body);
      const event = await storage.createTimelineEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/galleries/:galleryId/timeline", async (req, res) => {
    try {
      const events = await storage.getGalleryTimelineEvents(parseInt(req.params.galleryId));
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/timeline/:id", async (req, res) => {
    try {
      const event = await storage.updateTimelineEvent(parseInt(req.params.id), req.body);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/timeline/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTimelineEvent(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Story routes
  app.post("/api/stories", async (req, res) => {
    try {
      const storyData = insertStorySchema.parse(req.body);
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/stories", async (req, res) => {
    try {
      const stories = await storage.getUserStories(parseInt(req.params.userId));
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStory(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ error: "Story not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stories/:id/view", async (req, res) => {
    try {
      const { viewerId } = req.body;
      const marked = await storage.markStoryViewed(parseInt(req.params.id), viewerId);
      if (!marked) return res.status(404).json({ error: "Story not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

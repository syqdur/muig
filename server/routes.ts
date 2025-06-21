import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertUserProfileSchema, insertMediaItemSchema, insertCommentSchema, insertLikeSchema, insertTimelineEventSchema, insertStorySchema, insertMusicWishlistSchema, insertSiteStatusSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User management routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // User profile routes
  app.get("/api/users/:id/profile", async (req, res) => {
    try {
      const profile = await storage.getUserProfile(parseInt(req.params.id));
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/profile", async (req, res) => {
    try {
      const profileData = insertUserProfileSchema.parse({
        ...req.body,
        userId: parseInt(req.params.id)
      });
      const profile = await storage.createUserProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  app.put("/api/users/:id/profile", async (req, res) => {
    try {
      const profileData = insertUserProfileSchema.partial().parse(req.body);
      const profile = await storage.updateUserProfile(parseInt(req.params.id), profileData);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  // Media items routes
  app.get("/api/users/:id/media", async (req, res) => {
    try {
      const mediaItems = await storage.getUserMediaItems(parseInt(req.params.id));
      res.json(mediaItems);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/media", async (req, res) => {
    try {
      console.log("Media request body:", req.body);
      const mediaData = insertMediaItemSchema.parse({
        ...req.body,
        userId: parseInt(req.params.id)
      });
      console.log("Parsed media data:", mediaData);
      const mediaItem = await storage.createMediaItem(mediaData);
      
      // Broadcast the update to all connected clients
      if (app.locals.broadcast) {
        app.locals.broadcast({
          type: 'MEDIA_CREATED',
          data: mediaItem
        });
      }
      
      res.status(201).json(mediaItem);
    } catch (error) {
      console.error("Media validation error:", error);
      res.status(400).json({ message: "Invalid media data", error: error.message });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      await storage.deleteMediaItem(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comments routes
  app.get("/api/users/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getUserComments(parseInt(req.params.id));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId: parseInt(req.params.id)
      });
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      await storage.deleteComment(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Likes routes
  app.get("/api/users/:id/likes", async (req, res) => {
    try {
      const likes = await storage.getUserLikes(parseInt(req.params.id));
      res.json(likes);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/likes", async (req, res) => {
    try {
      const likeData = insertLikeSchema.parse({
        ...req.body,
        userId: parseInt(req.params.id)
      });
      const like = await storage.createLike(likeData);
      res.status(201).json(like);
    } catch (error) {
      res.status(400).json({ message: "Invalid like data" });
    }
  });

  app.delete("/api/likes/:mediaId/:userId", async (req, res) => {
    try {
      await storage.deleteLike(parseInt(req.params.mediaId), parseInt(req.params.userId));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Timeline events routes
  app.get("/api/users/:id/timeline", async (req, res) => {
    try {
      const events = await storage.getUserTimelineEvents(parseInt(req.params.id));
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/timeline", async (req, res) => {
    try {
      console.log("Timeline request body:", req.body);
      const eventData = insertTimelineEventSchema.parse({
        ...req.body,
        userId: parseInt(req.params.id)
      });
      console.log("Parsed timeline data:", eventData);
      const event = await storage.createTimelineEvent(eventData);
      
      // Broadcast the update to all connected clients
      if (app.locals.broadcast) {
        app.locals.broadcast({
          type: 'TIMELINE_CREATED',
          data: event
        });
      }
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Timeline validation error:", error);
      res.status(400).json({ message: "Invalid event data", error: error.message });
    }
  });

  app.put("/api/timeline/:id", async (req, res) => {
    try {
      const eventData = insertTimelineEventSchema.partial().parse(req.body);
      const event = await storage.updateTimelineEvent(parseInt(req.params.id), eventData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.delete("/api/timeline/:id", async (req, res) => {
    try {
      await storage.deleteTimelineEvent(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stories routes
  app.get("/api/users/:id/stories", async (req, res) => {
    try {
      const stories = await storage.getUserStories(parseInt(req.params.id));
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/stories/active", async (req, res) => {
    try {
      const stories = await storage.getActiveStories(parseInt(req.params.id));
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/stories", async (req, res) => {
    try {
      const storyData = insertStorySchema.parse({
        ...req.body,
        userId: parseInt(req.params.id)
      });
      const story = await storage.createStory(storyData);
      res.status(201).json(story);
    } catch (error) {
      res.status(400).json({ message: "Invalid story data" });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    try {
      await storage.deleteStory(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Music wishlist routes
  app.get("/api/users/:id/music", async (req, res) => {
    try {
      const wishlist = await storage.getUserMusicWishlist(parseInt(req.params.id));
      res.json(wishlist);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/music", async (req, res) => {
    try {
      const musicData = insertMusicWishlistSchema.parse({
        ...req.body,
        userId: parseInt(req.params.id)
      });
      const item = await storage.createMusicWishlistItem(musicData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid music data" });
    }
  });

  app.delete("/api/music/:id", async (req, res) => {
    try {
      await storage.deleteMusicWishlistItem(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Site status routes
  app.get("/api/site-status", async (req, res) => {
    try {
      const status = await storage.getSiteStatus();
      if (!status) {
        // Create default status if none exists
        const defaultStatus = await storage.updateSiteStatus({
          isUnderConstruction: false,
          updatedBy: "System"
        });
        return res.json(defaultStatus);
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/site-status", async (req, res) => {
    try {
      const statusData = insertSiteStatusSchema.parse(req.body);
      const status = await storage.updateSiteStatus(statusData);
      res.json(status);
    } catch (error) {
      res.status(400).json({ message: "Invalid status data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

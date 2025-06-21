import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertUserProfileSchema, insertMediaItemSchema, insertCommentSchema, insertLikeSchema, insertTimelineEventSchema, insertStorySchema, insertMusicWishlistSchema, insertSiteStatusSchema, insertAnonymousUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Anonymous user routes
  app.get("/api/anonymous-users/:deviceId", async (req, res) => {
    try {
      const deviceId = decodeURIComponent(req.params.deviceId);
      console.log("Looking for device ID:", deviceId);
      const user = await storage.getAnonymousUserByDeviceId(deviceId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error getting anonymous user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/anonymous-users", async (req, res) => {
    try {
      console.log("Creating anonymous user with data:", req.body);
      const userData = insertAnonymousUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getAnonymousUserByDeviceId(userData.deviceId);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createAnonymousUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating anonymous user:", error);
      res.status(400).json({ message: "Invalid user data", error: error.message });
    }
  });

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
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // If displayName is being updated, update the users table as well
      if (updates.displayName) {
        await storage.updateUser(userId, { displayName: updates.displayName });
      }
      
      // Update the user profile
      const profileData = insertUserProfileSchema.partial().parse(updates);
      const profile = await storage.updateUserProfile(userId, profileData);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  // Media items routes
  app.get("/api/users/:id/media", async (req, res) => {
    try {
      const userIdParam = req.params.id;
      let userId = 1; // Default user for demo
      
      // If it's not demo-user and is a valid number, use that
      if (userIdParam !== 'demo-user') {
        const parsedId = parseInt(userIdParam);
        if (!isNaN(parsedId)) {
          userId = parsedId;
        }
      }
      
      const mediaItems = await storage.getUserMediaItems(userId);
      res.json(mediaItems);
    } catch (error) {
      console.error("Media fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/media", async (req, res) => {
    try {
      const userIdParam = req.params.id;
      let userId = 1; // Default user for demo
      
      // If it's not demo-user and is a valid number, use that
      if (userIdParam !== 'demo-user') {
        const parsedId = parseInt(userIdParam);
        if (!isNaN(parsedId)) {
          userId = parsedId;
        }
      }
      
      const mediaItems = await storage.getUserMediaItems(userId);
      res.json(mediaItems);
    } catch (error) {
      console.error("Error loading media items:", error);
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
    } catch (error: any) {
      console.error("Media validation error:", error);
      res.status(400).json({ message: "Invalid media data", error: error.message });
    }
  });

  // File upload endpoint for media
  app.post("/api/users/:id/media/upload", (req, res) => {
    const upload = app.locals.upload;
    
    upload.array('files', 10)(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      try {
        const files = req.files as Express.Multer.File[];
        const userId = parseInt(req.params.id);
        const { uploadedBy } = req.body;
        
        const mediaItems = [];
        
        for (const file of files) {
          const mediaData = {
            userId,
            type: file.mimetype.startsWith('video/') ? 'video' as const : 'image' as const,
            url: `/uploads/${file.filename}`,
            fileName: file.filename,
            uploadedBy: uploadedBy || 'Unknown'
          };
          
          const mediaItem = await storage.createMediaItem(mediaData);
          mediaItems.push(mediaItem);
        }
        
        // Broadcast the updates
        if (app.locals.broadcast) {
          mediaItems.forEach(item => {
            app.locals.broadcast({
              type: 'MEDIA_CREATED',
              data: item
            });
          });
        }
        
        res.status(201).json(mediaItems);
      } catch (error) {
        console.error("File upload error:", error);
        res.status(500).json({ message: "Upload failed" });
      }
    });
  });

  // Note creation endpoint
  app.post("/api/users/:id/notes", async (req, res) => {
    try {
      // For demo users, use a fixed user ID
      const userIdParam = req.params.id;
      let userId = 1; // Default user for demo
      
      // If it's not demo-user and is a valid number, use that
      if (userIdParam !== 'demo-user') {
        const parsedId = parseInt(userIdParam);
        if (!isNaN(parsedId)) {
          userId = parsedId;
        }
      }
      
      const { text, uploadedBy } = req.body;
      
      const noteData = {
        userId,
        type: 'note' as const,
        text,
        noteText: text,
        uploadedBy: uploadedBy || 'Unknown'
      };
      
      const note = await storage.createMediaItem(noteData);
      
      // Broadcast the update
      if (app.locals.broadcast) {
        app.locals.broadcast({
          type: 'MEDIA_CREATED',
          data: note
        });
      }
      
      res.status(201).json(note);
    } catch (error) {
      console.error("Note creation error:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put("/api/media/:id", async (req, res) => {
    try {
      const mediaId = req.params.id; // Use full ID as string
      const updateData = req.body;
      
      const updatedItem = await storage.updateMediaItem(mediaId, updateData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Media item not found" });
      }
      
      // Broadcast the update
      if (app.locals.broadcast) {
        app.locals.broadcast({
          type: 'MEDIA_UPDATED',
          data: updatedItem
        });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Media update error:", error);
      res.status(500).json({ message: "Failed to update media item" });
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
    } catch (error: any) {
      console.error("Timeline validation error:", error);
      res.status(400).json({ message: "Invalid event data", error: error.message });
    }
  });

  // File upload endpoint for timeline events
  app.post("/api/users/:id/timeline/upload", (req, res) => {
    const upload = app.locals.upload;
    
    upload.array('files', 10)(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      try {
        const files = req.files as Express.Multer.File[];
        const userId = parseInt(req.params.id);
        const { title, description, date, location, type, createdBy } = req.body;
        
        const mediaUrls = [];
        const mediaTypes = [];
        const mediaFileNames = [];
        
        for (const file of files) {
          mediaUrls.push(`/uploads/${file.filename}`);
          mediaTypes.push(file.mimetype.startsWith('video/') ? 'video' : 'image');
          mediaFileNames.push(file.filename);
        }
        
        const eventData = {
          userId,
          title,
          description,
          date,
          location: location || undefined,
          type,
          createdBy: createdBy || 'Unknown',
          mediaUrls,
          mediaTypes,
          mediaFileNames
        };
        
        const event = await storage.createTimelineEvent(eventData);
        
        // Broadcast the update
        if (app.locals.broadcast) {
          app.locals.broadcast({
            type: 'TIMELINE_CREATED',
            data: event
          });
        }
        
        res.status(201).json(event);
      } catch (error) {
        console.error("Timeline upload error:", error);
        res.status(500).json({ message: "Upload failed" });
      }
    });
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

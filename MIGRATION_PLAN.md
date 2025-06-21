# Multi-User Gallery Migration Plan

## Current State Analysis

### ✅ What's Already Working
- Firebase Firestore & Storage integration
- Spotify API integration (global session)
- Media upload system with comments & likes
- Timeline with events
- Stories functionality
- Admin panel with basic auth
- Dark mode & responsive design
- Real-time updates via Firestore

### 🔧 Current Architecture Issues
- **No real authentication**: Uses device ID + localStorage username
- **No user isolation**: All data is global, stored in shared collections
- **Global Spotify session**: Single token for entire app
- **Admin system**: Basic username/password without proper auth
- **No routing**: URL-based navigation missing

## Implementation Plan

### Phase 1: Authentication Foundation
1. Add Firebase Auth to configuration
2. Create AuthContext for user state management
3. Implement login/register components
4. Add protected route wrapper

### Phase 2: Data Architecture Transformation
1. Restructure Firestore collections for user isolation:
   - `users/{userId}/profile` - user profiles
   - `users/{userId}/spotify` - Spotify tokens per user
   - `galleries/{userId}/media` - user-specific media
   - `galleries/{userId}/comments` - user-specific comments
   - `galleries/{userId}/likes` - user-specific likes
   - `galleries/{userId}/events` - timeline events
   - `galleries/{userId}/stories` - stories

### Phase 3: Service Layer Updates
1. Update all Firebase services to be user-aware
2. Transform Spotify service for per-user tokens
3. Update media upload to user-specific storage paths

### Phase 4: UI Components Migration
1. Transform App.tsx into routing-aware component
2. Create UserGallery component from current App logic
3. Update all components to use authenticated user context
4. Add profile management components

### Phase 5: Admin Panel Enhancement
1. ✅ Implement admin authentication (admin/test123)
2. ✅ Create user management interface
3. ✅ Add user oversight capabilities (no media access)

### Phase 6: Security & Testing
1. Implement Firebase Security Rules
2. Add proper error handling
3. Test multi-user isolation
4. Performance optimization

## Technical Requirements

### New Dependencies
- React Router for routing
- Additional Firebase Auth types

### Environment Variables Needed
- Firebase Auth configuration (already present)
- Spotify Client ID/Secret (already present)

### File Structure Changes
```
src/
├── contexts/
│   └── AuthContext.tsx (NEW)
├── components/
│   ├── auth/ (NEW)
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── UserGallery.tsx (MIGRATED from App.tsx logic)
│   ├── ProfileEditor.tsx (NEW)
│   └── admin/ (ENHANCED)
│       ├── AdminLogin.tsx
│       └── UserManagement.tsx
└── services/
    ├── authService.ts (NEW)
    ├── userService.ts (NEW)
    └── galleryService.ts (REFACTORED from firebaseService.ts)
```

## Data Migration Strategy

### User Data Structure
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  externalLinks?: {
    spotify?: string;
    instagram?: string;
  };
  createdAt: string;
}
```

### Migration Steps
1. Create user profiles for existing device-based users
2. Migrate existing media to user-specific collections
3. Update all existing comments/likes with user associations
4. Preserve existing timeline events and stories

## Security Implementation

### Firebase Security Rules
- Users can only access their own data
- Admin users can read user profiles (not media)
- Proper authentication required for all operations

### Data Isolation
- Complete separation of user galleries
- No cross-user data visibility
- Secure admin oversight without privacy violation
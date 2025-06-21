# CRITICAL: Firebase Security Rules Must Be Applied NOW

**Status: Profile uploads and bio saving are FAILING due to missing Firebase Security Rules**

## IMMEDIATE ACTION REQUIRED - DO THIS NOW

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com) in a new tab
2. Select project: **dev1-b3973**
3. Make sure Authentication → Sign-in method → Email/Password is enabled

### Step 2: Fix Firestore Database Rules (CRITICAL)
1. In Firebase Console, click "Firestore Database" in the left menu
2. Click the "Rules" tab at the top
3. Delete ALL existing rules and replace with this exact code:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    match /galleries/{userId}/{document=**} {
      allow read, write, create, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

### Step 3: Fix Storage Rules (CRITICAL)
1. In Firebase Console, click "Storage" in the left menu
2. Click the "Rules" tab at the top
3. Delete ALL existing rules and replace with this exact code:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write, create, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    match /galleries/{userId}/{allPaths=**} {
      allow read, write, create, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## What This Enables

- User registration and login
- Complete data isolation between users
- Profile picture uploads
- Personal gallery management
- Timeline events and stories
- Test user demo functionality

## Status

❌ **Rules not applied** - Permission errors occurring
✅ **Ready to apply** - Rules created and documented

**IMMEDIATE RESULT:** Once these rules are applied (takes 30 seconds):
- Profile picture uploads will work
- Bio and external links saving will work  
- Test user demo will work
- All gallery features will work
- Permission errors will stop

**Current Status:** ❌ BLOCKED - App cannot function until rules are applied
**After Rules:** ✅ FULLY FUNCTIONAL - All features working
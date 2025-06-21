# FIREBASE QUICK FIX - Copy Paste These Rules

## Step 1: Firestore Database Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Delete everything and paste this EXACTLY:

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

## Step 2: Storage Rules

1. Go to Firebase Console → Storage → Rules
2. Delete everything and paste this EXACTLY:

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

## Result
- Profile uploads will work immediately
- Bio editing will work
- All gallery features enabled
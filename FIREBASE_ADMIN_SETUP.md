# Firebase Admin Setup Instructions

## Step 1: Update Firestore Security Rules

Go to your Firebase Console (https://console.firebase.google.com) > Project "dev1-b3973" > Firestore Database > Rules

Replace the current rules with these temporarily permissive rules for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temporary permissive rules for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Step 2: Update Firebase Storage Rules

Go to Firebase Console > Storage > Rules

Replace with these permissive rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Step 3: After Testing - Secure Rules

Once everything works, replace with these secure rules:

### Firestore Rules (Secure Version):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all users, but only write their own data
    match /users/{userId} {
      allow read: if true;
      allow write, create, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Galleries - users own their galleries
    match /galleries/{userId}/{document=**} {
      allow read, write, create, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Media, comments, likes - authenticated users can interact
    match /{collection}/{document} {
      allow read: if true;
      allow write, create: if request.auth != null;
      allow delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || resource.data.uploadedBy == request.auth.uid);
    }
  }
}
```

### Storage Rules (Secure Version):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Current Issue
The permission errors indicate Firebase rules are blocking access. Apply the temporary permissive rules first to test functionality, then implement secure rules once everything works.
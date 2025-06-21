# Firebase Setup für Live-System

## Problem
Firebase Firestore und Storage haben permission-denied Fehler wegen Sicherheitsregeln.

## Lösung: Temporäre offene Regeln für Entwicklung

### 1. Firestore Security Rules
Gehen Sie zu Firebase Console > Firestore Database > Rules und setzen Sie:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Erlaubt Lesen und Schreiben für alle
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. Storage Security Rules  
Gehen Sie zu Firebase Console > Storage > Rules und setzen Sie:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Erlaubt Lesen und Schreiben für alle
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Alternative: Authentifizierung aktivieren
Falls Sie Authentifizierung bevorzugen:

1. Firebase Console > Authentication > Sign-in method
2. Email/Password aktivieren
3. Rules ändern zu:
```javascript
// Für authentifizierte Benutzer
allow read, write: if request.auth != null;
```

## Status
Nach der Regel-Aktualisierung sollten Media-Uploads und Timeline Events mit Bildern/Videos funktionieren.
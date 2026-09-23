# LVAEP Tutor Portal — Setup Guide

## What's been built

Three-page web app (no install required):

| File | Who uses it |
|---|---|
| `index.html` | Everyone — login page |
| `tutor.html` | Tutors — log sessions, track achievements |
| `admin.html` | Staff — manage tutors/students, generate reports |

---

## Step 1 — Create a Firebase project (free)

1. Go to **console.firebase.google.com** and sign in with a Google account
2. Click **"Add project"** → name it (e.g. `lvaep-tutor-portal`) → Continue
3. Disable Google Analytics (not needed) → **Create project**

### Enable Authentication
1. Left sidebar → **Build → Authentication**
2. Click **Get started**
3. Choose **Email/Password** → Enable it → Save

### Enable Firestore
1. Left sidebar → **Build → Firestore Database**
2. Click **Create database**
3. Choose **"Start in test mode"** (you'll secure it later) → Next → Done

### Get your config
1. Left sidebar → ⚙️ **Project settings** (gear icon)
2. Scroll to **"Your apps"** → click **`</>`** (Web)
3. Register the app (any nickname) → copy the `firebaseConfig` object

---

## Step 2 — Paste your config

Open `js/firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "lvaep-tutor-portal.firebaseapp.com",
  projectId: "lvaep-tutor-portal",
  storageBucket: "lvaep-tutor-portal.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 3 — Create your admin account

1. In Firebase Console → **Authentication** → **Add user**
2. Enter a staff email + password
3. Copy the **User UID** shown after creation
4. Go to **Firestore → Start collection** → ID: `users`
5. Add a document with ID = that UID, fields:
   - `name` (string): Staff member's name
   - `email` (string): Their email
   - `role` (string): `admin`

---

## Step 4 — Host the app

The simplest free option is **Firebase Hosting**:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # choose your project, set public dir to "."
firebase deploy
```

Or drag the folder into **Netlify Drop** (netlify.com/drop) — done in 30 seconds.

---

## Step 5 — Add tutors

1. Sign in to `admin.html` with your admin account
2. Go to **Tutors tab** → click **+ Add Tutor**
3. Enter their name, email, and a temporary password
4. Share the site URL + their login with each tutor

---

## Step 6 — Add students

1. In the admin dashboard → **Students tab** → **+ Add Student**
2. Enter student name and assign to a tutor

---

## How tutors use it

1. Sign in at `index.html`
2. See their student list and year-to-date stats
3. **Log a Session**: pick student, date, hours → submit
4. **Achievements**: select a student → check off goals → save

---

## Generating reports (staff)

1. Sign in to `admin.html`
2. **Monthly Reports tab** → pick fiscal year, tutor (or all), month
3. Click **Generate Report** → review the attendance grid
4. Click **Print / Save PDF** to export (browser → Save as PDF)

---

## Firestore security (before going live)

Replace the default test-mode rules in Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admins can read/write everything
    match /{document=**} {
      allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
    // Tutors can read their own profile and their students
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
    }
    match /students/{sid} {
      allow read: if resource.data.tutorId == request.auth.uid;
    }
    match /sessions/{sid} {
      allow read, write: if resource.data.tutorId == request.auth.uid
        || request.resource.data.tutorId == request.auth.uid;
    }
    match /achievements/{sid} {
      allow read, write: if request.auth != null;
    }
  }
}
```

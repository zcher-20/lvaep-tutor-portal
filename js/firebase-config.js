// ─── PASTE YOUR FIREBASE CONFIG HERE ────────────────────────────────────────
// 1. Go to console.firebase.google.com → create a project
// 2. Add a Web app → copy the firebaseConfig object below
// 3. Enable Authentication → Email/Password
// 4. Enable Firestore Database (start in test mode, then secure later)
// ────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export default firebaseConfig;

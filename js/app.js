// ── Firebase SDK (loaded via CDN in each HTML file) ───────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import firebaseConfig from "./firebase-config.js";

// ── Init ───────────────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Fiscal year helpers ────────────────────────────────────────────────────────
// Fiscal year runs Jul–Jun. FY2027 = Jul 2026 – Jun 2027.
const MONTHS = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];
// calendar month index → fiscal month index (0=Jul … 11=Jun)
const calToFiscal = m => (m >= 6) ? m - 6 : m + 6;

function fiscalYear(date = new Date()) {
  return date.getMonth() >= 6 ? date.getFullYear() + 1 : date.getFullYear();
}

function fiscalMonthLabel(date) {
  return MONTHS[calToFiscal(date.getMonth())];
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

function requireAuth(allowedRoles, redirectTo = "index.html") {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = redirectTo; return; }
      const profile = await getUserProfile(user.uid);
      if (!profile || (allowedRoles && !allowedRoles.includes(profile.role))) {
        await signOut(auth);
        location.href = redirectTo;
        return;
      }
      resolve({ user, profile });
    });
  });
}

// ── Student helpers ────────────────────────────────────────────────────────────
async function getStudentsForTutor(tutorId) {
  const q = query(collection(db, "students"), where("tutorId", "==", tutorId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getAllStudents() {
  const snap = await getDocs(collection(db, "students"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getAllTutors() {
  const q = query(collection(db, "users"), where("role", "==", "tutor"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Session helpers ────────────────────────────────────────────────────────────
async function getSessionsForTutor(tutorId, fy) {
  // FY start = Jul 1 of (fy-1), end = Jun 30 of fy
  const start = new Date(fy - 1, 6, 1);   // Jul 1
  const end   = new Date(fy,     5, 30, 23, 59, 59); // Jun 30
  const q = query(
    collection(db, "sessions"),
    where("tutorId", "==", tutorId),
    where("date", ">=", Timestamp.fromDate(start)),
    where("date", "<=", Timestamp.fromDate(end)),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function logSession({ tutorId, studentId, date, hours }) {
  return addDoc(collection(db, "sessions"), {
    tutorId,
    studentId,
    date: Timestamp.fromDate(new Date(date + "T12:00:00")),
    hours: parseFloat(hours),
    createdAt: Timestamp.now()
  });
}

async function deleteSession(sessionId) {
  return deleteDoc(doc(db, "sessions", sessionId));
}

// ── Achievement helpers ────────────────────────────────────────────────────────
async function getAchievements(studentId) {
  const snap = await getDoc(doc(db, "achievements", studentId));
  return snap.exists() ? snap.data() : {};
}

async function saveAchievements(studentId, data) {
  return setDoc(doc(db, "achievements", studentId), data, { merge: true });
}

// ── Report builder ─────────────────────────────────────────────────────────────
// Returns: { studentId → { monthLabel → { day → hours } } }
function buildReport(sessions, students) {
  const map = {};
  students.forEach(s => { map[s.id] = { _name: s.name }; });

  sessions.forEach(sess => {
    const d = sess.date.toDate();
    const mo = MONTHS[calToFiscal(d.getMonth())];
    const day = d.getDate();
    if (!map[sess.studentId]) map[sess.studentId] = { _name: "Unknown" };
    if (!map[sess.studentId][mo]) map[sess.studentId][mo] = {};
    map[sess.studentId][mo][day] = (map[sess.studentId][mo][day] || 0) + sess.hours;
  });
  return map;
}

// ── Nav user display ───────────────────────────────────────────────────────────
function setNavUser(name) {
  const el = document.getElementById("nav-user");
  if (el) el.textContent = name;
}

// ── Toast notification ─────────────────────────────────────────────────────────
function toast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `alert alert-${type === "error" ? "error" : "success"}`;
  t.style.cssText = "position:fixed;bottom:1.5rem;right:1.5rem;z-index:999;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,.15)";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

export {
  auth, db, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, where, orderBy, Timestamp,
  getUserProfile, requireAuth,
  getStudentsForTutor, getAllStudents, getAllTutors,
  getSessionsForTutor, logSession, deleteSession,
  getAchievements, saveAchievements,
  buildReport,
  fiscalYear, fiscalMonthLabel, MONTHS, calToFiscal,
  setNavUser, toast
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4XKFGU2jJqRIodMWdaq4E_XL4xZmpx2Y",
  authDomain: "batttlbgmifree.firebaseapp.com",
  databaseURL: "https://batttlbgmifree-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "batttlbgmifree",
  storageBucket: "batttlbgmifree.firebasestorage.app",
  messagingSenderId: "90290598140",
  appId: "1:90290598140:web:1d544169168a2db99be779"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };
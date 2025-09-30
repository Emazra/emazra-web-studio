// firebase-config.js
const firebaseConfig = {
  projectId: "emazra-websites"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();
const storage = firebase.storage();

// Authentication
const auth = firebase.auth();
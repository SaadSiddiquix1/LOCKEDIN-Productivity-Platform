// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA07ZFbLFvVyFpvmnDlo8eMWavYWXE3aWE",
    authDomain: "lockedin-d7c07.firebaseapp.com",
    projectId: "lockedin-d7c07",
    storageBucket: "lockedin-d7c07.firebasestorage.app",
    messagingSenderId: "300744723222",
    appId: "1:300744723222:web:66abbf45e7ff0506269e37",
    measurementId: "G-XSQH9LCC7G"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
}

const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();

// Configure Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({
    prompt: 'select_account'
});

console.log("✅ Firebase Auth configured");

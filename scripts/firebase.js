// Firebase configuration - UPDATE WITH YOUR ACTUAL VALUES
const firebaseConfig = {
    apiKey: "AIzaSyD7o1ODQkG20H6yuL6S_MsELFt004N1zM0",
    authDomain: "visitor-log-system.firebaseapp.com",
    databaseURL: "https://visitor-log-system-default-rtdb.firebaseio.com",
    projectId: "visitor-log-system",
    storageBucket: "visitor-log-system.firebasestorage.app",
    messagingSenderId: "156472292600",
    appId: "1:156472292600:web:b0f66f5376dda5bda7370d",
    measurementId: "G-1C01YJ1B8V"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

console.log('🔥 Firebase initialized successfully');
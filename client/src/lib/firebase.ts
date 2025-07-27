// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBx7axnsxE55MKwZBFKOGhzOtFeme8qNoA",
  authDomain: "trms-4f542.firebaseapp.com",
  projectId: "trms-4f542",
  storageBucket: "trms-4f542.firebasestorage.app",
  messagingSenderId: "419302910396",
  appId: "1:419302910396:web:fb29b1e13bb956a4c0e3b9",
  measurementId: "G-R78HR9DLX0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
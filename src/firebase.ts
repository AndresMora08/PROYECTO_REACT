// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // <-- FALTABA ESTO

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQ7TQFMpNzo1dfj4dL46AKhv1Vob-MvpE",
  authDomain: "proyecto-react-f253b.firebaseapp.com",
  projectId: "proyecto-react-f253b",
  storageBucket: "proyecto-react-f253b.firebasestorage.app",
  messagingSenderId: "876795903289",
  appId: "1:876795903289:web:6dc1dbccb50d64b37c7ce8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializar la Autenticación y exportarla para usarla en tus componentes <-- FALTABA ESTO
export const auth = getAuth(app);
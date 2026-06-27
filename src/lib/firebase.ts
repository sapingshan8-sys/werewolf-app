// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFnd_pLT933ICvzJc2xTxBCBl7J-tpABs",
  authDomain: "werewolf-app-92d04.firebaseapp.com",
  projectId: "werewolf-app-92d04",
  storageBucket: "werewolf-app-92d04.firebasestorage.app",
  messagingSenderId: "572604305658",
  appId: "1:572604305658:web:696c8caaac8f817676f943",
  databaseURL: "https://werewolf-app-92d04-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
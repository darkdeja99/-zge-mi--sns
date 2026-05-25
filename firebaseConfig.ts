import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
// @ts-ignore - Firebase'in bilinen bir tip uyuşmazlığı hatasını yoksaymak için
import { getReactNativePersistence } from "firebase/auth";
//import { getAnalytics } from "firebase/analytics";
import { Platform } from "react-native";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add your own Firebase configuration below
const firebaseConfig = {
  apiKey: "AIzaSyDIpP9KfLPo5UAK_GPJM-2g5limux91LFo",
  authDomain: "ozgecmis-sns.firebaseapp.com",
  projectId: "ozgecmis-sns",
  storageBucket: "ozgecmis-sns.firebasestorage.app",
  messagingSenderId: "720559519471",
  appId: "1:720559519471:web:4aea634db54074af1b8d1a",
  measurementId: "G-PYW4PPD35L",
};

const app = initializeApp(firebaseConfig);

// Web ortamı için standart getAuth, Mobil için AsyncStorage kullanıyoruz
export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
//const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

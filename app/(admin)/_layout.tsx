import { Stack, router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import CustomLoader from "../../components/CustomLoader";
import { auth, db } from "../../firebaseConfig";

export default function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        router.replace("/");
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.replace("/(tabs)/home"); // Yetkisizse ana sayfaya yönlendir
        }
      } catch (error) {
        console.error("Admin yetkisi kontrol hatası:", error);
        setIsAdmin(false);
        router.replace("/(tabs)/home");
      }
    });

    return () => unsubscribe();
  }, []);

  if (isAdmin === null) {
    return <CustomLoader fullScreen text="Yetki Kontrol Ediliyor..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0f2027" },
      }}
    />
  );
}

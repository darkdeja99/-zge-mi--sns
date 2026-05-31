import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { router, Tabs, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

// Sadece web'de çalışan ve sekme odaktan çıkınca ekranı DOM'dan temizleyen özel kapsayıcı
function WebUnmountWrapper({ children }: { children: React.ReactNode }) {
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  return isFocused ? <>{children}</> : null;
}

function PushNotificationHandler() {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.actionIdentifier ===
        Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const data = lastNotificationResponse.notification.request.content.data;
      if (data && data.chatId) {
        setTimeout(() => {
          router.push(`/chat/${data.chatId}`);
        }, 100);
      }
    }
  }, [lastNotificationResponse]);

  return null;
}

export default function TabLayout() {
  return (
    <>
      {Platform.OS !== "web" && <PushNotificationHandler />}
      <Tabs
        screenLayout={({ children }) =>
          Platform.OS === "web" ? (
            <WebUnmountWrapper>{children}</WebUnmountWrapper>
          ) : (
            <>{children}</>
          )
        }
        screenOptions={{
          headerShown: false, // Hides the top header
          sceneStyle: { backgroundColor: "#0f2027" }, // Beyaz parlama sorununu kökten çözer
          tabBarActiveTintColor: "#4DA8DA", // The color of the active tab
          tabBarInactiveTintColor: "#888", // The color of inactive tabs
          tabBarStyle: {
            backgroundColor: "#0f2027", // Alt menü arka planı tema ile aynı yapıldı
            borderTopWidth: 1, // İçeriği alt menüden ayırmak için ince çizgi eklendi
            borderTopColor: "rgba(255,255,255,0.05)",
          },
        }}
      >
        {/* Each Tabs.Screen corresponds to a file in the (tabs) folder */}
        <Tabs.Screen
          name="home" // Points to app/(tabs)/home.tsx
          options={{
            title: "Ana Sayfa",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs" // Points to app/(tabs)/jobs.tsx
          options={{
            title: "İlanlar",
            tabBarIcon: ({ color }) => (
              <Ionicons name="briefcase-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved-jobs" // Points to app/(tabs)/saved-jobs.tsx
          options={{
            title: "Kaydedilenler",
            tabBarIcon: ({ color }) => (
              <Ionicons name="bookmark-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Mesajlar",
            tabBarIcon: ({ color }) => (
              <Ionicons name="chatbubbles-outline" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

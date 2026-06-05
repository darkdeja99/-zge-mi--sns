import { Ionicons } from "@expo/vector-icons";
import { Tabs, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { LogBox, Platform } from "react-native";

if (Platform.OS === "web") {
  LogBox.ignoreLogs([
    "props.pointerEvents is deprecated",
    '"shadow*" style props are deprecated',
  ]);
}

// sadece webde çalışan ve sekme odaktan çıkınca ekranı domdan kaldıran bir wrapper component
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

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenLayout={({ children }) =>
          Platform.OS === "web" ? (
            <WebUnmountWrapper>{children}</WebUnmountWrapper>
          ) : (
            <>{children}</>
          )
        }
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "#0f2027" },
          tabBarActiveTintColor: "#4DA8DA",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: {
            backgroundColor: "#0f2027",
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.05)",
          },
        }}
      >
        {/* Sekmeler burada tanımlanacak */}
        <Tabs.Screen
          name="home"
          options={{
            title: "Ana Sayfa",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: "İlanlar",
            tabBarIcon: ({ color }) => (
              <Ionicons name="briefcase-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved-jobs"
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

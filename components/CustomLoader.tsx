import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

interface CustomLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export default function CustomLoader({
  text = "Yükleniyor...",
  fullScreen = false,
}: CustomLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const LoaderContent = (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={styles.iconBackground}>
          <Ionicons name="briefcase" size={32} color="#0f2027" />
        </View>
      </Animated.View>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{LoaderContent}</View>;
  }

  return LoaderContent;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#0f2027",
    justifyContent: "center",
    alignItems: "center",
  },
  container: { alignItems: "center", justifyContent: "center", padding: 20 },
  iconBackground: {
    backgroundColor: "#4DA8DA",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: "0px 0px 10px rgba(77, 168, 218, 0.8)",
      },
      default: {
        shadowColor: "#4DA8DA",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  text: {
    marginTop: 20,
    color: "#4DA8DA",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

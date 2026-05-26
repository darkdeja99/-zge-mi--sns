import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Animasyon değerini tutan referans
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)/home"); // Ana sayfaya yönlendir
    } catch (error: any) {
      triggerShake(); // Hata alındığında sallanma efektini başlat
      Alert.alert("Giriş Hatası", error.message);
    }
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Giriş Yap</Text>
            <Animated.View
              style={[
                styles.formContainer,
                { transform: [{ translateX: shakeAnimation }] },
              ]}
            >
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={focusedInput === "email" ? "#007AFF" : "#555"}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="E-posta"
                  placeholderTextColor="#aaa"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedInput === "password" ? "#007AFF" : "#555"}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
              <Link href="/forgot-password" asChild>
                <TouchableOpacity style={styles.forgotPasswordButton}>
                  <Text style={styles.forgotPasswordText}>
                    Şifremi Unuttum?
                  </Text>
                </TouchableOpacity>
              </Link>
              <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Giriş Yap</Text>
              </TouchableOpacity>
            </Animated.View>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Hesabın yok mu? </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Kayıt Ol</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#0f2027",
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    paddingTop: 80,
    paddingBottom: 50,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    ...Platform.select({
      web: { textShadow: "-1px 1px 10px rgba(0, 0, 0, 0.75)" },
      default: {
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
      },
    }),
  },
  formContainer: {
    width: "100%",
    maxWidth: Math.min(400, width * 0.85),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#000",
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    marginTop: 30,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
  },
  link: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginVertical: 10,
  },
  forgotPasswordText: {
    color: "#fff",
    fontSize: 14,
  },
});

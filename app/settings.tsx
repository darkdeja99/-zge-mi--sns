import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db, storage } from "../firebaseConfig";

export default function Settings() {
  const [password, setPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = () => {
    if (!password) {
      Alert.alert(
        "Hata",
        "Hesabınızı silmek için mevcut şifrenizi girmelisiniz.",
      );
      return;
    }

    const executeDelete = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (user && user.email) {
          const credential = EmailAuthProvider.credential(user.email, password);
          await reauthenticateWithCredential(user, credential);

          const jobsRef = collection(db, "jobs");
          const q = query(jobsRef, where("employerId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const deleteJobPromises = querySnapshot.docs.map((jobDoc) =>
            deleteDoc(doc(db, "jobs", jobDoc.id)),
          );
          await Promise.all(deleteJobPromises);

          if (user.photoURL) {
            const photoRef = ref(storage, `profile_pictures/${user.uid}`);
            await deleteObject(photoRef).catch(() => {});
          }

          try {
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            let userName = user.displayName || "Bilinmiyor";
            let userRole = "user";
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              userName =
                `${data.name || ""} ${data.surname || ""}`.trim() || userName;
              userRole = data.role || "user";
            }
            await addDoc(collection(db, "deleted_users"), {
              originalUserId: user.uid,
              name: userName,
              email: user.email || "Bilinmiyor",
              role: userRole,
              reason: "Kullanıcı kendi hesabını sildi.",
              deletedAt: serverTimestamp(),
              deletedBy: user.uid,
            });
          } catch (logError) {
            console.error("Log kaydı alınamadı:", logError);
          }

          await deleteDoc(doc(db, "users", user.uid));

          await deleteUser(user);

          if (Platform.OS === "web") {
            window.alert("Hesabınız başarıyla silindi.");
            router.dismissAll();
            router.replace("/");
          } else {
            Alert.alert("Başarılı", "Hesabınız başarıyla silindi.", [
              {
                text: "Tamam",
                onPress: () => {
                  router.dismissAll();
                  router.replace("/");
                },
              },
            ]);
          }
        }
      } catch (error: any) {
        let errorMessage = "Hesap silinirken bir hata oluştu.";
        if (
          error.code === "auth/wrong-password" ||
          error.code === "auth/invalid-credential"
        ) {
          errorMessage = "Mevcut şifreniz yanlış.";
        }
        if (Platform.OS === "web") {
          window.alert(errorMessage);
        } else {
          Alert.alert("Hata", errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve profil verileriniz kalıcı olarak silinir.",
      );
      if (confirmed) {
        executeDelete();
      }
    } else {
      Alert.alert(
        "Hesabı Sil",
        "Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve profil verileriniz kalıcı olarak silinir.",
        [
          { text: "İptal", style: "cancel" },
          { text: "Evet, Sil", style: "destructive", onPress: executeDelete },
        ],
      );
    }
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={20}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Ayarlar</Text>

          <View style={styles.menuContainer}>
            <Link href="/account-settings" asChild>
              <TouchableOpacity style={styles.menuButton}>
                <Ionicons
                  name="key-outline"
                  size={22}
                  color="#fff"
                  style={styles.menuIcon}
                />
                <Text style={styles.menuButtonText}>Şifre Değiştir</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.warningContainer}>
            <Ionicons name="warning-outline" size={48} color="#d9534f" />
            <Text style={styles.warningTitle}>Tehlikeli Bölge</Text>
            <Text style={styles.warningText}>
              Hesabınızı sildiğinizde özgeçmişiniz ve profilinize dair tüm
              verileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>
              İşlemi onaylamak için şifrenizi girin:
            </Text>
            <View
              style={[
                styles.inputContainer,
                focusedInput === "password" && styles.inputContainerFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={focusedInput === "password" ? "#d9534f" : "#555"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Mevcut Şifreniz"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 5 }}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Hesabımı Kalıcı Olarak Sil
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#0f2027" },
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 30,
    paddingTop: 80,
    paddingBottom: 50,
  },
  backButton: { position: "absolute", top: 40, left: 20, zIndex: 1 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
    ...Platform.select({
      web: { textShadow: "-1px 1px 10px rgba(0, 0, 0, 0.75)" },
      default: {
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
      },
    }),
  },
  menuContainer: {
    width: "100%",
    maxWidth: Math.min(400, width * 0.85),
    marginBottom: 30,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  menuIcon: { marginRight: 15 },
  menuButtonText: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: "rgba(217, 83, 79, 0.15)",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(217, 83, 79, 0.5)",
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
    maxWidth: Math.min(400, width * 0.85),
  },
  warningTitle: {
    color: "#d9534f",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  warningText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  formContainer: { width: "100%", maxWidth: Math.min(400, width * 0.85) },
  label: { color: "#ccc", fontSize: 14, marginBottom: 10, fontWeight: "600" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputContainerFocused: {
    borderColor: "#d9534f",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: "#000" },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  deleteButton: { backgroundColor: "#d9534f" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

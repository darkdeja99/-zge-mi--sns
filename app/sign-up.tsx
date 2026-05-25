import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRef, useState } from "react";
import {
  Alert,
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
import { auth, db } from "../firebaseConfig";

export default function SignUp() {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return;
    }
    if (name === "" || surname === "" || email === "" || password === "") {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      // Firebase Auth profilini güncelle
      await updateProfile(user, {
        displayName: `${name} ${surname}`,
      });

      let finalBirthDate = "";
      if (birthDay && birthMonth && birthYear) {
        finalBirthDate = `${birthDay}/${birthMonth}/${birthYear}`;
      } else if (birthYear) {
        finalBirthDate = birthYear;
      }
      // Kullanıcı verilerini Firestore'a kaydet
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        surname: surname,
        email: user.email,
        role: "user",
        photoURL: null,
        headline: "",
        location: "",
        gender: gender,
        birthDate: finalBirthDate,
        phoneNumber: "",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Başarılı", "Hesabınız başarıyla oluşturuldu!", [
        { text: "Tamam", onPress: () => router.replace("/sign-in") },
      ]);
    } catch (error: any) {
      Alert.alert("Kayıt Hatası", error.message);
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
            <Text style={styles.title}>Kayıt Ol</Text>
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={focusedInput === "name" ? "#007AFF" : "#555"}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput("name")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Ad"
                  placeholderTextColor="#aaa"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={focusedInput === "surname" ? "#007AFF" : "#555"}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={surname}
                  onChangeText={setSurname}
                  onFocus={() => setFocusedInput("surname")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Soyad"
                  placeholderTextColor="#aaa"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.datePickerContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#555"
                  style={styles.inputIcon}
                />
                <View style={styles.datePickersRow}>
                  <Picker
                    selectedValue={birthDay}
                    onValueChange={(itemValue) => setBirthDay(itemValue)}
                    style={styles.datePicker}
                    dropdownIconColor="#555"
                  >
                    <Picker.Item label="Gün" value="" color="#aaa" />
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                      const dayStr = day.toString().padStart(2, "0");
                      return (
                        <Picker.Item
                          key={dayStr}
                          label={dayStr}
                          value={dayStr}
                        />
                      );
                    })}
                  </Picker>
                  <Picker
                    selectedValue={birthMonth}
                    onValueChange={(itemValue) => setBirthMonth(itemValue)}
                    style={styles.datePicker}
                    dropdownIconColor="#555"
                  >
                    <Picker.Item label="Ay" value="" color="#aaa" />
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => {
                        const monthStr = month.toString().padStart(2, "0");
                        return (
                          <Picker.Item
                            key={monthStr}
                            label={monthStr}
                            value={monthStr}
                          />
                        );
                      },
                    )}
                  </Picker>
                  <Picker
                    selectedValue={birthYear}
                    onValueChange={(itemValue) => setBirthYear(itemValue)}
                    style={styles.datePickerYear}
                    dropdownIconColor="#555"
                  >
                    <Picker.Item label="Yıl" value="" color="#aaa" />
                    {Array.from(
                      { length: 100 },
                      (_, i) => new Date().getFullYear() - i,
                    ).map((year) => {
                      const yearStr = year.toString();
                      return (
                        <Picker.Item
                          key={yearStr}
                          label={yearStr}
                          value={yearStr}
                        />
                      );
                    })}
                  </Picker>
                </View>
              </View>
              <View style={styles.pickerContainer}>
                <Ionicons
                  name="male-female-outline"
                  size={20}
                  color={focusedInput === "gender" ? "#007AFF" : "#555"}
                  style={styles.inputIcon}
                />
                <Picker
                  selectedValue={gender}
                  onValueChange={(itemValue) => setGender(itemValue)}
                  style={styles.picker}
                  onFocus={() => setFocusedInput("gender")}
                  onBlur={() => setFocusedInput(null)}
                >
                  <Picker.Item label="Cinsiyet Seçiniz" value="" color="#aaa" />
                  <Picker.Item label="Kadın" value="Kadın" />
                  <Picker.Item label="Erkek" value="Erkek" />
                  <Picker.Item
                    label="Belirtmek İstemiyorum"
                    value="Belirtmek İstemiyorum"
                  />
                </Picker>
              </View>
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
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
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
                  ref={passwordInputRef}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() =>
                    confirmPasswordInputRef.current?.focus()
                  }
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
              <View style={styles.inputContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={
                    focusedInput === "confirmPassword" ? "#007AFF" : "#555"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={confirmPasswordInputRef}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedInput("confirmPassword")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Şifre Tekrar"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleSignUp}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
              <Link href="/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Giriş Yap</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

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
    maxWidth: 320,
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
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    marginBottom: 15,
    paddingLeft: 15,
  },
  picker: {
    height: 55,
    width: "100%",
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    marginBottom: 15,
    paddingLeft: 15,
  },
  datePickersRow: {
    flex: 1,
    flexDirection: "row",
  },
  datePicker: {
    flex: 1,
    height: 55,
    marginHorizontal: -8,
  },
  datePickerYear: {
    flex: 1.3,
    height: 55,
    marginLeft: -8,
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
});

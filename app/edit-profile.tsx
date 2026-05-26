import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useNavigation } from "expo-router";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { auth, db, storage } from "../firebaseConfig";

const provinces = [
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Ankara",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkari",
  "Hatay",
  "Iğdır",
  "Isparta",
  "İstanbul",
  "İzmir",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kilis",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Şanlıurfa",
  "Şırnak",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
];

export default function EditProfile() {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [initialState, setInitialState] = useState<any>(null);

  const navigation = useNavigation();

  useEffect(() => {
    // Load initial user data
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        let initialVals = {
          name: "",
          surname: "",
          location: "",
          gender: "",
          birthDay: "",
          birthMonth: "",
          birthYear: "",
          phoneNumber: "",
          imageUri: user.photoURL || null,
        };

        // Set image from auth profile
        if (user.photoURL) {
          setImageUri(user.photoURL);
        }

        // Set name/surname from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          initialVals.name = userData.name || "";
          initialVals.surname = userData.surname || "";
          initialVals.location = userData.location || "";
          initialVals.gender = userData.gender || "";

          const loadedBirthDate =
            userData.birthDate || userData.birthYear || "";
          if (loadedBirthDate.includes("/")) {
            const parts = loadedBirthDate.split("/");
            if (parts.length === 3) {
              initialVals.birthDay = parts[0];
              initialVals.birthMonth = parts[1];
              initialVals.birthYear = parts[2];
            }
          } else if (loadedBirthDate.length === 4) {
            initialVals.birthYear = loadedBirthDate;
          }
          initialVals.phoneNumber = userData.phoneNumber || "";
        }

        setName(initialVals.name);
        setSurname(initialVals.surname);
        setLocation(initialVals.location);
        setGender(initialVals.gender);
        setBirthDay(initialVals.birthDay);
        setBirthMonth(initialVals.birthMonth);
        setBirthYear(initialVals.birthYear);
        setPhoneNumber(initialVals.phoneNumber);

        setInitialState(initialVals);
      }
      setLoading(false);
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!initialState) return;

      const hasUnsavedChanges =
        name !== initialState.name ||
        surname !== initialState.surname ||
        location !== initialState.location ||
        gender !== initialState.gender ||
        birthDay !== initialState.birthDay ||
        birthMonth !== initialState.birthMonth ||
        birthYear !== initialState.birthYear ||
        phoneNumber !== initialState.phoneNumber ||
        imageUri !== initialState.imageUri;

      if (!hasUnsavedChanges) {
        return; // Değişiklik yoksa çıkışa izin ver
      }

      // Çıkış işlemini geçici olarak durdur
      e.preventDefault();

      Alert.alert(
        "Kaydedilmemiş Değişiklikler",
        "Yaptığınız değişiklikleri henüz kaydetmediniz. Çıkmak istediğinize emin misiniz?",
        [
          { text: "İptal", style: "cancel", onPress: () => {} },
          {
            text: "Çık",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
  }, [
    navigation,
    initialState,
    name,
    surname,
    location,
    gender,
    birthDay,
    birthMonth,
    birthYear,
    phoneNumber,
    imageUri,
  ]);

  const pickImage = async () => {
    // No permissions needed for web. For mobile, request permissions.
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Üzgünüz, galerinize erişmek için izne ihtiyacımız var!",
        );
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Hata", "Güncelleme yapmak için giriş yapmalısınız.");
      return;
    }

    if (name.trim() === "" || surname.trim() === "") {
      Alert.alert("Hata", "Ad ve soyad boş bırakılamaz.");
      return;
    }

    setSaving(true);
    let newPhotoURL = user.photoURL;

    try {
      // 1. If image was changed, upload it to Storage
      if (imageUri && imageUri !== user.photoURL) {
        const blob: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            resolve(xhr.response);
          };
          xhr.onerror = function (e) {
            console.error("XHR Hatası:", e);
            reject(
              new TypeError("Ağ isteği başarısız oldu (Resim yüklenemedi)"),
            );
          };
          xhr.responseType = "blob";
          xhr.open("GET", imageUri, true);
          xhr.send(null);
        });

        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, blob);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      // 2. Update Firebase Auth profile
      await updateProfile(user, {
        displayName: `${name} ${surname}`,
        photoURL: newPhotoURL,
      });

      let finalBirthDate = "";
      if (birthDay && birthMonth && birthYear) {
        finalBirthDate = `${birthDay}/${birthMonth}/${birthYear}`;
      } else if (birthYear) {
        finalBirthDate = birthYear; // Fallback
      }

      // 3. Update Firestore document
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        name: name,
        surname: surname,
        location: location,
        gender: gender,
        birthDate: finalBirthDate,
        phoneNumber: phoneNumber,
        photoURL: newPhotoURL, // Also save URL to firestore
      });

      // Kaydetme başarılı olduğunda initialState'i güncelliyoruz
      // Bu sayede çıkış yaparken uyarı çıkmasını önlüyoruz.
      setInitialState({
        name,
        surname,
        location,
        gender,
        birthDay,
        birthMonth,
        birthYear,
        phoneNumber,
        imageUri: newPhotoURL,
      });
      setImageUri(newPhotoURL);

      Alert.alert("Başarılı", "Profiliniz başarıyla güncellendi.", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Profil güncelleme hatası: ", error);
      Alert.alert("Hata", "Profil güncellenirken bir sorun oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView
            style={{ flex: 1 }}
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
            <Text style={styles.title}>Profili Düzenle</Text>

            <TouchableOpacity onPress={pickImage}>
              <Image
                source={
                  imageUri
                    ? { uri: imageUri }
                    : require("../assets/default-avatar.png")
                }
                style={styles.avatar}
                contentFit="cover"
                transition={200}
                cachePolicy="disk"
              />
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
            </TouchableOpacity>

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
                  name="call-outline"
                  size={20}
                  color={focusedInput === "phoneNumber" ? "#007AFF" : "#555"}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onFocus={() => setFocusedInput("phoneNumber")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Telefon Numarası"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.pickerContainer}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={focusedInput === "location" ? "#007AFF" : "#555"}
                  style={styles.inputIcon}
                />
                <Picker
                  selectedValue={location}
                  onValueChange={(itemValue) => setLocation(itemValue)}
                  style={styles.picker}
                  onFocus={() => setFocusedInput("location")}
                  onBlur={() => setFocusedInput(null)}
                >
                  <Picker.Item label="Konum Seçiniz" value="" color="#aaa" />
                  {provinces.map((province) => (
                    <Picker.Item
                      key={province}
                      label={province}
                      value={province}
                    />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity
                style={[styles.button, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingBottom: 30,
  },
  backButton: { position: "absolute", top: 40, left: 20, zIndex: 1 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
    marginBottom: 30,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 30,
    right: 5,
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 20,
  },
  formContainer: { width: "100%", maxWidth: Math.min(400, width * 0.85) },
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
  buttonDisabled: {
    backgroundColor: "#5a5a5a",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useNavigation } from "expo-router";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { useEffect, useRef, useState } from "react";
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
import CustomLoader from "../components/CustomLoader";
import CustomModal from "../components/CustomModal";
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
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const isSavedRef = useRef(false);

  const surnameRef = useRef<TextInput>(null);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/sign-in");
        return;
      }

      const loadUserData = async () => {
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

        if (user.photoURL) {
          setImageUri(user.photoURL);
        }

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
      };
      setLoading(false);
      loadUserData();
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (isSavedRef.current) return;
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
        return;
      }

      e.preventDefault();

      if (Platform.OS === "web") {
        const confirmed = window.confirm(
          "Yaptığınız değişiklikleri henüz kaydetmediniz. Çıkmak istediğinize emin misiniz?",
        );
        if (confirmed) {
          navigation.dispatch(e.data.action);
        }
      } else {
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
      }
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
    if (Platform.OS === "web") {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      return;
    }

    const options: any[] = [
      {
        text: "Kameradan Çek",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "İzin Gerekli",
              "Kameranıza erişmek için izne ihtiyacımız var!",
            );
            return;
          }
          let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });
          if (!result.canceled) {
            setImageUri(result.assets[0].uri);
          }
        },
      },
      {
        text: "Galeriden Seç",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });
          if (!result.canceled) {
            setImageUri(result.assets[0].uri);
          }
        },
      },
    ];

    if (imageUri) {
      options.push({
        text: "Fotoğrafı Kaldır",
        style: "destructive",
        onPress: () => setImageUri(null),
      });
    }

    options.push({ text: "İptal", style: "cancel" });

    Alert.alert("Profil Fotoğrafı", "Lütfen bir seçenek belirleyin:", options);
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
      } else if (!imageUri && user.photoURL) {
        newPhotoURL = null;
        try {
          const storageRef = ref(storage, `profile_pictures/${user.uid}`);
          await deleteObject(storageRef);
        } catch (e) {
          console.log("Eski fotoğraf silinemedi veya bulunamadı", e);
        }
      }

      await updateProfile(user, {
        displayName: `${name} ${surname}`,
        photoURL: newPhotoURL,
      });

      let finalBirthDate = "";
      if (birthDay && birthMonth && birthYear) {
        finalBirthDate = `${birthDay}/${birthMonth}/${birthYear}`;
      } else if (birthYear) {
        finalBirthDate = birthYear;
      }

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          name: name,
          surname: surname,
          location: location,
          gender: gender,
          birthDate: finalBirthDate,
          phoneNumber: phoneNumber,
          photoURL: newPhotoURL,
        },
        { merge: true },
      );

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

      isSavedRef.current = true;
      setSuccessModalVisible(true);

      setTimeout(() => {
        setSuccessModalVisible(false);
        router.replace("/profile");
      }, 1500);
    } catch (error: any) {
      console.error("Profil güncelleme hatası: ", error);
      Alert.alert("Hata", "Profil güncellenirken bir sorun oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CustomLoader fullScreen />;
  }

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

          {imageUri && (
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.removePhotoText}>Fotoğrafı Kaldır</Text>
            </TouchableOpacity>
          )}

          <View style={styles.formContainer}>
            <View
              style={[
                styles.inputContainer,
                focusedInput === "name" && styles.inputContainerFocused,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={focusedInput === "name" ? "#4DA8DA" : "#aaa"}
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
                returnKeyType="next"
                onSubmitEditing={() => surnameRef.current?.focus()}
              />
            </View>
            <View
              style={[
                styles.inputContainer,
                focusedInput === "surname" && styles.inputContainerFocused,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={focusedInput === "surname" ? "#4DA8DA" : "#aaa"}
                style={styles.inputIcon}
              />
              <TextInput
                ref={surnameRef}
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
            <View
              style={[
                styles.datePickerContainer,
                focusedInput === "birthDate" && styles.inputContainerFocused,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={focusedInput === "birthDate" ? "#4DA8DA" : "#aaa"}
                style={styles.inputIcon}
              />
              <View style={styles.datePickersRow}>
                <Picker
                  selectedValue={birthDay}
                  onValueChange={(itemValue) => setBirthDay(itemValue)}
                  style={styles.datePicker}
                  onFocus={() => setFocusedInput("birthDate")}
                  onBlur={() => setFocusedInput(null)}
                  dropdownIconColor="#4DA8DA"
                >
                  <Picker.Item label="Gün" value="" color="#aaa" />
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const dayStr = day.toString().padStart(2, "0");
                    return (
                      <Picker.Item
                        key={dayStr}
                        label={dayStr}
                        value={dayStr}
                        color={Platform.OS === "web" ? "#000" : undefined}
                      />
                    );
                  })}
                </Picker>
                <Picker
                  selectedValue={birthMonth}
                  onValueChange={(itemValue) => setBirthMonth(itemValue)}
                  style={styles.datePicker}
                  onFocus={() => setFocusedInput("birthDate")}
                  onBlur={() => setFocusedInput(null)}
                  dropdownIconColor="#4DA8DA"
                >
                  <Picker.Item label="Ay" value="" color="#aaa" />
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const monthStr = month.toString().padStart(2, "0");
                    return (
                      <Picker.Item
                        key={monthStr}
                        label={monthStr}
                        value={monthStr}
                        color={Platform.OS === "web" ? "#000" : undefined}
                      />
                    );
                  })}
                </Picker>
                <Picker
                  selectedValue={birthYear}
                  onValueChange={(itemValue) => setBirthYear(itemValue)}
                  style={styles.datePickerYear}
                  onFocus={() => setFocusedInput("birthDate")}
                  onBlur={() => setFocusedInput(null)}
                  dropdownIconColor="#4DA8DA"
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
                        color={Platform.OS === "web" ? "#000" : undefined}
                      />
                    );
                  })}
                </Picker>
              </View>
            </View>
            <View
              style={[
                styles.pickerContainer,
                focusedInput === "gender" && styles.inputContainerFocused,
              ]}
            >
              <Ionicons
                name="male-female-outline"
                size={20}
                color={focusedInput === "gender" ? "#4DA8DA" : "#aaa"}
                style={styles.inputIcon}
              />
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => setGender(itemValue)}
                style={styles.picker}
                onFocus={() => setFocusedInput("gender")}
                onBlur={() => setFocusedInput(null)}
                dropdownIconColor="#4DA8DA"
              >
                <Picker.Item label="Cinsiyet Seçiniz" value="" color="#aaa" />
                <Picker.Item
                  label="Kadın"
                  value="Kadın"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
                <Picker.Item
                  label="Erkek"
                  value="Erkek"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
                <Picker.Item
                  label="Belirtmek İstemiyorum"
                  value="Belirtmek İstemiyorum"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
              </Picker>
            </View>
            <View
              style={[
                styles.inputContainer,
                focusedInput === "phoneNumber" && styles.inputContainerFocused,
              ]}
            >
              <Ionicons
                name="call-outline"
                size={20}
                color={focusedInput === "phoneNumber" ? "#4DA8DA" : "#aaa"}
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
                returnKeyType="done"
              />
            </View>
            <View
              style={[
                styles.pickerContainer,
                focusedInput === "location" && styles.inputContainerFocused,
              ]}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color={focusedInput === "location" ? "#4DA8DA" : "#aaa"}
                style={styles.inputIcon}
              />
              <Picker
                selectedValue={location}
                onValueChange={(itemValue) => setLocation(itemValue)}
                style={styles.picker}
                onFocus={() => setFocusedInput("location")}
                onBlur={() => setFocusedInput(null)}
                dropdownIconColor="#4DA8DA"
              >
                <Picker.Item label="Konum Seçiniz" value="" color="#aaa" />
                {provinces.map((province) => (
                  <Picker.Item
                    key={province}
                    label={province}
                    value={province}
                    color={Platform.OS === "web" ? "#000" : undefined}
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
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {/* Başarı Modalı */}
      <CustomModal
        visible={successModalVisible}
        title="Başarılı!"
        message="Profiliniz başarıyla güncellendi."
        type="success"
        onClose={() => {
          setSuccessModalVisible(false);
          router.replace("/profile");
        }}
      />
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
    paddingBottom: 120,
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
  removePhotoButton: {
    marginTop: -15,
    marginBottom: 25,
  },
  removePhotoText: {
    color: "#d9534f",
    fontSize: 16,
    fontWeight: "600",
  },
  formContainer: { width: "100%", maxWidth: Math.min(400, width * 0.85) },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputContainerFocused: {
    borderColor: "#4DA8DA",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#fff",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    marginBottom: 15,
    paddingLeft: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  picker: {
    height: 55,
    width: "100%",
    ...Platform.select({ web: { color: "#000" }, default: { color: "#fff" } }),
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    marginBottom: 15,
    paddingLeft: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  datePickersRow: {
    flex: 1,
    flexDirection: "row",
  },
  datePicker: {
    flex: 1,
    height: 55,
    marginHorizontal: -8,
    ...Platform.select({ web: { color: "#000" }, default: { color: "#fff" } }),
  },
  datePickerYear: {
    flex: 1.3,
    height: 55,
    marginLeft: -8,
    ...Platform.select({ web: { color: "#000" }, default: { color: "#fff" } }),
  },
  button: {
    backgroundColor: "#4DA8DA",
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

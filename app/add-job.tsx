import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
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

const WORK_MODELS = ["Uzaktan", "Hibrit", "Ofis"];
const JOB_TYPES = ["Tam Zamanlı", "Yarı Zamanlı", "Staj", "Serbest"];

export default function AddJob() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [workModel, setWorkModel] = useState(WORK_MODELS[0]);
  const [type, setType] = useState(JOB_TYPES[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Form doğrulama (Eksik alan var mı kontrolü)
    if (
      !title.trim() ||
      !company.trim() ||
      !location.trim() ||
      !description.trim()
    ) {
      Alert.alert("Eksik Bilgi", "Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Hata", "Oturum açmanız gerekiyor.");
        return;
      }

      // Firebase Firestore'a veriyi kaydetme işlemi
      await addDoc(collection(db, "jobs"), {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        workModel,
        type,
        description: description.trim(),
        employerId: currentUser.uid, // İlanı kimin verdiğini tutuyoruz
        contactEmail: currentUser.email, // İletişim e-postasını kaydediyoruz
        createdAt: serverTimestamp(), // Sunucu saati ile kayıt anı
      });

      Alert.alert("Başarılı", "İş ilanı başarıyla yayınlandı!");
      router.back(); // Sayfayı kapatıp listeye dön
    } catch (error: any) {
      console.error("İlan eklenirken hata oluştu:", error);
      Alert.alert("Hata", "İlan eklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
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
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Yeni İlan Ver</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>İş Başlığı / Unvan *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Frontend Developer"
                placeholderTextColor="#888"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şirket Adı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Tech A.Ş."
                placeholderTextColor="#888"
                value={company}
                onChangeText={setCompany}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konum *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: İstanbul, Türkiye"
                placeholderTextColor="#888"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Çalışma Modeli</Text>
              <View style={styles.chipsContainer}>
                {WORK_MODELS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      workModel === item && styles.chipSelected,
                    ]}
                    onPress={() => setWorkModel(item)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        workModel === item && styles.chipTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Çalışma Türü</Text>
              <View style={styles.chipsContainer}>
                {JOB_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, type === item && styles.chipSelected]}
                    onPress={() => setType(item)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        type === item && styles.chipTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>İlan Detayları ve Nitelikler *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="İş tanımı, aranan özellikler, yan haklar vb."
                placeholderTextColor="#888"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>İlanı Yayınla</Text>
              )}
            </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 15,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: "rgba(77, 168, 218, 0.2)",
    borderColor: "#4DA8DA",
  },
  chipText: { color: "#aaa", fontSize: 14 },
  chipTextSelected: { color: "#4DA8DA", fontWeight: "bold" },
  saveButton: {
    backgroundColor: "#4DA8DA",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomModal, { ModalType } from "../components/CustomModal";
import { auth, db } from "../firebaseConfig";

const WORK_MODELS = ["Uzaktan", "Hibrit", "Ofis"];
const JOB_TYPES = ["Tam Zamanlı", "Yarı Zamanlı", "Staj", "Serbest"];
const EXPERIENCE_LEVELS = [
  "Öğrenci / Stajyer",
  "Junior (Yeni Başlayan)",
  "Mid-Level (Uzman)",
  "Senior (Kıdemli)",
  "Yönetici",
];

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

const skillSuggestionsMap: Record<string, string[]> = {
  yazılım: [
    "JavaScript",
    "TypeScript",
    "React",
    "React Native",
    "Node.js",
    "Python",
    "Java",
    "SQL",
    "Git",
    "Firebase",
    "C#",
  ],
  developer: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Git",
    "Docker",
    "AWS",
  ],
  geliştirici: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Git",
    "Android Studio",
    "Xcode",
    "Docker",
    "AWS",
    "Flutter",
    "Swift",
    "Kotlin",
  ],
  tasarım: ["Figma", "UI/UX", "Adobe XD", "Photoshop", "Illustrator"],
  designer: ["Figma", "UI/UX", "Adobe XD", "Photoshop", "Illustrator"],
  pazarlama: [
    "SEO",
    "SEM",
    "Google Analytics",
    "İçerik Pazarlaması",
    "Sosyal Medya",
    "E-posta Pazarlaması",
    "Reklam Yönetimi",
    "Pazarlama Stratejisi",
  ],
  marketing: [
    "SEO",
    "SEM",
    "Google Analytics",
    "Content Marketing",
    "Social Media",
    "Email Marketing",
    "Ad Management",
    "Marketing Strategy",
  ],
  satış: [
    "B2B Satış",
    "Müşteri İlişkileri",
    "CRM",
    "Pazarlık",
    "İletişim",
    "Satış Stratejisi",
    "Satış Analitiği",
  ],
  ik: ["İşe Alım", "Performans Yönetimi", "Bordrolama", "Mülakat Teknikleri"],
  "insan kaynakları": [
    "İşe Alım",
    "Performans Yönetimi",
    "Bordrolama",
    "Mülakat Teknikleri",
  ],
  finans: [
    "Finansal Analiz",
    "Raporlama",
    "Excel",
    "Bütçeleme",
    "Risk Yönetimi",
  ],
  muhasebe: ["Finansal Analiz", "Raporlama", "Excel", "Bütçeleme", "Muhasebe"],
  proje: ["Proje Yönetimi", "Agile", "Scrum", "Jira", "Zaman Yönetimi"],
  veri: [
    "Veri Analizi",
    "SQL",
    "Python",
    "Machine Learning",
    "Tableau",
    "Power BI",
  ],
  data: ["Data Analysis", "SQL", "Python", "Machine Learning", "Tableau"],
};

export default function AddJob() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState(EXPERIENCE_LEVELS[1]);
  const [workModel, setWorkModel] = useState(WORK_MODELS[0]);
  const [type, setType] = useState(JOB_TYPES[0]);
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState(
    auth.currentUser?.email || "",
  );
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: ModalType;
    onCloseAction?: () => void;
  }>({ visible: false, title: "", message: "", type: "info" });

  const handleAddSkill = () => {
    if (currentSkill.trim() !== "") {
      const newSkill = currentSkill.trim();
      if (
        !skills.map((s) => s.toLowerCase()).includes(newSkill.toLowerCase())
      ) {
        setSkills([...skills, newSkill]);
      }
      setCurrentSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const getSuggestedSkills = () => {
    let suggestions: string[] = [];
    const lowerTitle = title?.toLowerCase() || "";

    for (const [key, mappedSkills] of Object.entries(skillSuggestionsMap)) {
      if (lowerTitle.includes(key)) {
        suggestions = [...suggestions, ...mappedSkills];
      }
    }

    if (suggestions.length === 0) {
      suggestions = [
        "İletişim",
        "Takım Çalışması",
        "Problem Çözme",
        "Liderlik",
        "Zaman Yönetimi",
      ];
    }

    suggestions = Array.from(new Set(suggestions));
    const currentSkills = skills.map((s) => s.toLowerCase());
    return suggestions.filter(
      (skill) => !currentSkills.includes(skill.toLowerCase()),
    );
  };

  const handleAddSuggestedSkill = (skill: string) => {
    if (!skills.map((s) => s.toLowerCase()).includes(skill.toLowerCase())) {
      setSkills([...skills, skill]);
    }
  };

  const handleSave = async () => {
    // Form doğrulama (Eksik alan var mı kontrolü)
    if (
      !title.trim() ||
      !company.trim() ||
      !location.trim() ||
      !description.trim()
    ) {
      setModalConfig({
        visible: true,
        type: "warning",
        title: "Eksik Bilgi",
        message: "Lütfen tüm zorunlu alanları doldurun.",
      });
      return;
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      setModalConfig({
        visible: true,
        type: "error",
        title: "Geçersiz E-posta",
        message: "Lütfen geçerli bir iletişim e-posta adresi girin.",
      });
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setModalConfig({
          visible: true,
          type: "error",
          title: "Hata",
          message: "Oturum açmanız gerekiyor.",
        });
        return;
      }

      // Firebase Firestore'a veriyi kaydetme işlemi
      await addDoc(collection(db, "jobs"), {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        experience,
        workModel,
        type,
        salaryRange: { min: minSalary.trim(), max: maxSalary.trim() },
        skills,
        description: description.trim(),
        employerId: currentUser.uid, // İlanı kimin verdiğini tutuyoruz
        contactEmail: contactEmail.trim(), // İletişim e-postasını kaydediyoruz
        createdAt: serverTimestamp(), // Sunucu saati ile kayıt anı
      });

      setModalConfig({
        visible: true,
        type: "success",
        title: "Başarılı!",
        message: "İş ilanı başarıyla yayınlandı!",
        onCloseAction: () => router.back(),
      });
    } catch (error: any) {
      console.error("İlan eklenirken hata oluştu:", error);
      setModalConfig({
        visible: true,
        type: "error",
        title: "Hata",
        message: "İlan eklenirken bir sorun oluştu.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1 }}>
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

          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={20}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>İş Başlığı / Unvan *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === "title" && styles.inputFocused,
                ]}
                placeholder="Örn: Frontend Developer"
                placeholderTextColor="#888"
                value={title}
                onChangeText={setTitle}
                onFocus={() => setFocusedInput("title")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şirket Adı *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === "company" && styles.inputFocused,
                ]}
                placeholder="Örn: Tech A.Ş."
                placeholderTextColor="#888"
                value={company}
                onChangeText={setCompany}
                onFocus={() => setFocusedInput("company")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konum *</Text>
              <View
                style={[
                  styles.pickerContainer,
                  focusedInput === "location" && styles.inputFocused,
                ]}
              >
                <Picker
                  selectedValue={location}
                  onValueChange={(itemValue) => setLocation(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#4DA8DA"
                  onFocus={() => setFocusedInput("location")}
                  onBlur={() => setFocusedInput(null)}
                >
                  <Picker.Item
                    label="Şehir Seçiniz"
                    value=""
                    color={
                      Platform.OS === "web"
                        ? "#000"
                        : Platform.OS === "android"
                          ? "#aaa"
                          : undefined
                    }
                  />
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deneyim Seviyesi</Text>
              <View style={styles.chipsContainer}>
                {EXPERIENCE_LEVELS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      experience === item && styles.chipSelected,
                    ]}
                    onPress={() => setExperience(item)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        experience === item && styles.chipTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
              <Text style={styles.label}>Maaş Aralığı (Opsiyonel)</Text>
              <View style={styles.row}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, marginRight: 10 },
                    focusedInput === "minSalary" && styles.inputFocused,
                  ]}
                  placeholder="Min (Örn: 30000)"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={minSalary}
                  onChangeText={setMinSalary}
                  onFocus={() => setFocusedInput("minSalary")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1 },
                    focusedInput === "maxSalary" && styles.inputFocused,
                  ]}
                  placeholder="Max (Örn: 45000)"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={maxSalary}
                  onChangeText={setMaxSalary}
                  onFocus={() => setFocusedInput("maxSalary")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Aranan Yetenekler</Text>
              {skills.length > 0 && (
                <View style={[styles.chipsContainer, { marginBottom: 10 }]}>
                  {skills.map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                      <TouchableOpacity onPress={() => removeSkill(index)}>
                        <Ionicons name="close-circle" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.row}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1 },
                    focusedInput === "currentSkill" && styles.inputFocused,
                  ]}
                  placeholder="Örn: React, Figma, SEO (Yazıp + butonuna basın)"
                  placeholderTextColor="#888"
                  value={currentSkill}
                  onChangeText={setCurrentSkill}
                  onSubmitEditing={handleAddSkill}
                  onFocus={() => setFocusedInput("currentSkill")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  style={styles.addSkillButton}
                  onPress={handleAddSkill}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {getSuggestedSkills().length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>
                    Önerilen Yetenekler:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsScroll}
                  >
                    {getSuggestedSkills().map((skill, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionBadge}
                        onPress={() => handleAddSuggestedSkill(skill)}
                      >
                        <Ionicons name="add" size={14} color="#fff" />
                        <Text style={styles.suggestionText}>{skill}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>İlan Detayları ve Nitelikler *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  focusedInput === "description" && styles.inputFocused,
                ]}
                placeholder="İş tanımı, aranan özellikler, yan haklar vb."
                placeholderTextColor="#888"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                onFocus={() => setFocusedInput("description")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>İletişim E-postası *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === "contactEmail" && styles.inputFocused,
                ]}
                placeholder="Örn: ik@sirket.com"
                placeholderTextColor="#888"
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput("contactEmail")}
                onBlur={() => setFocusedInput(null)}
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
          </KeyboardAwareScrollView>
        </View>
      </SafeAreaView>

      <CustomModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => {
          setModalConfig((prev) => ({ ...prev, visible: false }));
          if (modalConfig.onCloseAction) {
            modalConfig.onCloseAction();
          }
        }}
      />
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
    paddingBottom: 150,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  inputFocused: {
    borderColor: "#4DA8DA",
  },
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  picker: {
    height: 55,
    width: "100%",
    ...Platform.select({ web: { color: "#000" }, default: { color: "#fff" } }),
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
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4DA8DA",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  skillChipText: { color: "#fff", fontSize: 14, marginRight: 6 },
  addSkillButton: {
    backgroundColor: "#4DA8DA",
    padding: 12,
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionsContainer: {
    marginTop: 15,
  },
  suggestionsTitle: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
    fontStyle: "italic",
  },
  suggestionsScroll: {
    paddingVertical: 5,
  },
  suggestionBadge: {
    backgroundColor: "rgba(77, 168, 218, 0.3)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#4DA8DA",
  },
  suggestionText: { color: "#fff", fontSize: 14, marginLeft: 4 },
  saveButton: {
    backgroundColor: "#4DA8DA",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

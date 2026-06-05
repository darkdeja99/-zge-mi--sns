import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router, useNavigation } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import CustomLoader from "../components/CustomLoader";
import CustomModal from "../components/CustomModal";
import { auth, db } from "../firebaseConfig";
import {
  Certificate,
  EducationInfo,
  Experience,
  Language,
  Project,
} from "../types/profile";

const jobTitles = [
  "Ağ Uzmanı",
  "Akademisyen",
  "Avukat",
  "Backend Developer",
  "Bilgisayar Mühendisi",
  "Çevirmen",
  "Data Analyst",
  "Data Scientist",
  "DevOps Mühendisi",
  "Dijital Pazarlama Uzmanı",
  "Doktor",
  "E-ticaret Uzmanı",
  "Eczacı",
  "Elektrik Mühendisi",
  "Elektrik-Elektronik Mühendisi",
  "Elektronik Haberleşme Mühendisi",
  "Endüstri Mühendisi",
  "Finans Analisti",
  "Frontend Developer",
  "Full Stack Developer",
  "Game Developer",
  "Genel Müdür",
  "Görsel İletişim Tasarımcısı",
  "Grafik Tasarımcı",
  "Halkla İlişkiler Uzmanı",
  "Hemşire",
  "İç Mimari",
  "Harita Mühendisi",
  "İletişim Uzmanı",
  "Harita Kadastro Mühendisi",
  "İçerik Üreticisi (Content Creator)",
  "İnsan Kaynakları Uzmanı",
  "İnşaat Mühendisi",
  "İş Analisti",
  "İş Geliştirme Uzmanı",
  "Kalite Kontrol Uzmanı",
  "Kıdemli Yazılım Geliştirici",
  "Makine Mühendisi",
  "Mali Müşavir",
  "Mimar",
  "Mobil Uygulama Geliştirici",
  "Muhasebeci",
  "Müşteri Hizmetleri Temsilcisi",
  "Müşteri Temsilcisi",
  "Operasyon Yöneticisi",
  "Öğrenci",
  "Öğretmen",
  "Pazarlama Uzmanı",
  "Proje Yöneticisi",
  "Satış Temsilcisi",
  "Satış Uzmanı",
  "Siber Güvenlik Uzmanı",
  "Sistem Mühendisi",
  "Sosyal Medya Yöneticisi",
  "Stajyer",
  "UI/UX Tasarımcı",
  "Ürün Yöneticisi (Product Manager)",
  "Veri Analisti",
  "Veri Bilimcisi",
  "Yapay Zeka Mühendisi",
  "Yazılım Geliştirici",
  "Yazılım Mühendisi",
  "Yazılım Test Uzmanı (QA)",
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

const commonLanguages = [
  "Almanca",
  "Arapça",
  "Çince",
  "Farsça",
  "Fransızca",
  "Hintçe",
  "İngilizce",
  "İspanyolca",
  "İtalyanca",
  "Japonca",
  "Korece",
  "Portekizce",
  "Rusça",
];

const commonCertificates = [
  "AWS Certified Solutions Architect",
  "Bilgeİş Eğitim Sertifikası",
  "BTK Akademi Sertifikası",
  "Cisco Certified Network Associate (CCNA)",
  "CompTIA Security+",
  "Google Data Analytics",
  "Google Dijital Atölye",
  "IELTS",
  "İş Sağlığı ve Güvenliği (İSG)",
  "Microsoft Certified: Azure Fundamentals",
  "PMP (Project Management Professional)",
  "Scrum Master Certified (CSM)",
  "TOEFL",
  "Turkcell Geleceği Yazanlar",
  "Udemy Kurs Sertifikası",
  "YDS / YÖKDİL",
];

const universities = [
  "Abant İzzet Baysal Üniversitesi",
  "Abdullah Gül Üniversitesi",
  "Acıbadem Mehmet Ali Aydınlar Üniversitesi",
  "Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi",
  "Adıyaman Üniversitesi",
  "Afyon Kocatepe Üniversitesi",
  "Afyonkarahisar Sağlık Bilimleri Üniversitesi",
  "Ağrı İbrahim Çeçen Üniversitesi",
  "Akdeniz Üniversitesi",
  "Aksaray Üniversitesi",
  "Alanya Alaaddin Keykubat Üniversitesi",
  "Alanya Üniversitesi",
  "Altınbaş Üniversitesi",
  "Amasya Üniversitesi",
  "Anadolu Üniversitesi",
  "Ankara Bilim Üniversitesi",
  "Ankara Hacı Bayram Veli Üniversitesi",
  "Ankara Medipol Üniversitesi",
  "Ankara Sosyal Bilimler Üniversitesi",
  "Ankara Üniversitesi",
  "Ankara Yıldırım Beyazıt Üniversitesi",
  "Antalya Belek Üniversitesi",
  "Antalya Bilim Üniversitesi",
  "Ardahan Üniversitesi",
  "Artvin Çoruh Üniversitesi",
  "Atatürk Üniversitesi",
  "Atılım Üniversitesi",
  "Avrasya Üniversitesi",
  "Aydın Adnan Menderes Üniversitesi",
  "Bahçeşehir Üniversitesi",
  "Balıkesir Üniversitesi",
  "Bandırma Onyedi Eylül Üniversitesi",
  "Bartın Üniversitesi",
  "Başkent Üniversitesi",
  "Batman Üniversitesi",
  "Bayburt Üniversitesi",
  "Beykoz Üniversitesi",
  "Beykent Üniversitesi",
  "Bezmialem Vakıf Üniversitesi",
  "Bilecik Şeyh Edebali Üniversitesi",
  "Bingöl Üniversitesi",
  "Biruni Üniversitesi",
  "Bitlis Eren Üniversitesi",
  "Boğaziçi Üniversitesi",
  "Bozok Üniversitesi",
  "Burdur Mehmet Akif Ersoy Üniversitesi",
  "Bursa Teknik Üniversitesi",
  "Bursa Uludağ Üniversitesi",
  "Çağ Üniversitesi",
  "Çanakkale Onsekiz Mart Üniversitesi",
  "Çankaya Üniversitesi",
  "Çankırı Karatekin Üniversitesi",
  "Çukurova Üniversitesi",
  "Dicle Üniversitesi",
  "Doğuş Üniversitesi",
  "Dokuz Eylül Üniversitesi",
  "Düzce Üniversitesi",
  "Ege Üniversitesi",
  "Erciyes Üniversitesi",
  "Erzincan Binali Yıldırım Üniversitesi",
  "Erzurum Teknik Üniversitesi",
  "Eskişehir Osmangazi Üniversitesi",
  "Eskişehir Teknik Üniversitesi",
  "Fatih Sultan Mehmet Vakıf Üniversitesi",
  "Fenerbahçe Üniversitesi",
  "Fırat Üniversitesi",
  "Galatasaray Üniversitesi",
  "Gazi Üniversitesi",
  "Gaziantep İslam Bilim ve Teknoloji Üniversitesi",
  "Gaziantep Üniversitesi",
  "Gaziosmanpaşa Üniversitesi",
  "Gebze Teknik Üniversitesi",
  "Giresun Üniversitesi",
  "Gümüşhane Üniversitesi",
  "Hacettepe Üniversitesi",
  "Hakkari Üniversitesi",
  "Haliç Üniversitesi",
  "Harran Üniversitesi",
  "Hasan Kalyoncu Üniversitesi",
  "Hatay Mustafa Kemal Üniversitesi",
  "Hitit Üniversitesi",
  "Iğdır Üniversitesi",
  "Isparta Uygulamalı Bilimler Üniversitesi",
  "Işık Üniversitesi",
  "İbn Haldun Üniversitesi",
  "İhsan Doğramacı Bilkent Üniversitesi",
  "İnönü Üniversitesi",
  "İskenderun Teknik Üniversitesi",
  "İstanbul Arel Üniversitesi",
  "İstanbul Atlas Üniversitesi",
  "İstanbul Aydın Üniversitesi",
  "İstanbul Ayvansaray Üniversitesi",
  "İstanbul Beykent Üniversitesi",
  "İstanbul Bilgi Üniversitesi",
  "İstanbul Esenyurt Üniversitesi",
  "İstanbul Galata Üniversitesi",
  "İstanbul Gedik Üniversitesi",
  "İstanbul Gelişim Üniversitesi",
  "İstanbul Kent Üniversitesi",
  "İstanbul Kültür Üniversitesi",
  "İstanbul Medeniyet Üniversitesi",
  "İstanbul Medipol Üniversitesi",
  "İstanbul Okan Üniversitesi",
  "İstanbul Rumeli Üniversitesi",
  "İstanbul Sabahattin Zaim Üniversitesi",
  "İstanbul Sağlık ve Teknoloji Üniversitesi",
  "İstanbul Teknik Üniversitesi",
  "İstanbul Ticaret Üniversitesi",
  "İstanbul Topkapı Üniversitesi",
  "İstanbul Üniversitesi",
  "İstanbul Üniversitesi-Cerrahpaşa",
  "İstanbul Yeni Yüzyıl Üniversitesi",
  "İstanbul 29 Mayıs Üniversitesi",
  "İstinye Üniversitesi",
  "İzmir Bakırçay Üniversitesi",
  "İzmir Demokrasi Üniversitesi",
  "İzmir Ekonomi Üniversitesi",
  "İzmir Katip Çelebi Üniversitesi",
  "İzmir Kavram Meslek Yüksekokulu",
  "İzmir Tınaztepe Üniversitesi",
  "İzmir Yüksek Teknoloji Enstitüsü",
  "Kadir Has Üniversitesi",
  "Kafkas Üniversitesi",
  "Kahramanmaraş İstiklal Üniversitesi",
  "Kahramanmaraş Sütçü İmam Üniversitesi",
  "Kapadokya Üniversitesi",
  "Karabük Üniversitesi",
  "Karadeniz Teknik Üniversitesi",
  "Karamanoğlu Mehmetbey Üniversitesi",
  "Kastamonu Üniversitesi",
  "Kayseri Üniversitesi",
  "Kırıkkale Üniversitesi",
  "Kırklareli Üniversitesi",
  "Kırşehir Ahi Evran Üniversitesi",
  "Kilis 7 Aralık Üniversitesi",
  "Kocaeli Sağlık ve Teknoloji Üniversitesi",
  "Kocaeli Üniversitesi",
  "Koç Üniversitesi",
  "Konya Gıda ve Tarım Üniversitesi",
  "Konya Teknik Üniversitesi",
  "KTO Karatay Üniversitesi",
  "Kütahya Dumlupınar Üniversitesi",
  "Kütahya Sağlık Bilimleri Üniversitesi",
  "Lokman Hekim Üniversitesi",
  "Malatya Turgut Özal Üniversitesi",
  "Maltepe Üniversitesi",
  "Manisa Celal Bayar Üniversitesi",
  "Mardin Artuklu Üniversitesi",
  "Marmara Üniversitesi",
  "MEF Üniversitesi",
  "Mersin Üniversitesi",
  "Mimar Sinan Güzel Sanatlar Üniversitesi",
  "Mudanya Üniversitesi",
  "Muğla Sıtkı Koçman Üniversitesi",
  "Munzur Üniversitesi",
  "Muş Alparslan Üniversitesi",
  "Necmettin Erbakan Üniversitesi",
  "Nevşehir Hacı Bektaş Veli Üniversitesi",
  "Niğde Ömer Halisdemir Üniversitesi",
  "Nuh Naci Yazgan Üniversitesi",
  "Ondokuz Mayıs Üniversitesi",
  "Ordu Üniversitesi",
  "Orta Doğu Teknik Üniversitesi",
  "Osmaniye Korkut Ata Üniversitesi",
  "Ostim Teknik Üniversitesi",
  "Özyeğin Üniversitesi",
  "Pamukkale Üniversitesi",
  "Piri Reis Üniversitesi",
  "Recep Tayyip Erdoğan Üniversitesi",
  "Sabancı Üniversitesi",
  "Sağlık Bilimleri Üniversitesi",
  "Sakarya Uygulamalı Bilimler Üniversitesi",
  "Sakarya Üniversitesi",
  "Samsun Üniversitesi",
  "Sanko Üniversitesi",
  "Selçuk Üniversitesi",
  "Siirt Üniversitesi",
  "Sinop Üniversitesi",
  "Sivas Bilim ve Teknoloji Üniversitesi",
  "Sivas Cumhuriyet Üniversitesi",
  "Süleyman Demirel Üniversitesi",
  "Şırnak Üniversitesi",
  "Tarsus Üniversitesi",
  "TED Üniversitesi",
  "Tekirdağ Namık Kemal Üniversitesi",
  "TOBB Ekonomi ve Teknoloji Üniversitesi",
  "Tokat Gaziosmanpaşa Üniversitesi",
  "Toros Üniversitesi",
  "Trabzon Üniversitesi",
  "Trakya Üniversitesi",
  "Türk-Alman Üniversitesi",
  "Türk-Japon Bilim ve Teknoloji Üniversitesi",
  "Türk Hava Kurumu Üniversitesi",
  "Ufuk Üniversitesi",
  "Uşak Üniversitesi",
  "Üsküdar Üniversitesi",
  "Van Yüzüncü Yıl Üniversitesi",
  "Yalova Üniversitesi",
  "Yaşar Üniversitesi",
  "Yeditepe Üniversitesi",
  "Yüksek İhtisas Üniversitesi",
  "Zonguldak Bülent Ecevit Üniversitesi",
  "Doğu Akdeniz Üniversitesi (KKTC)",
  "Girne Amerikan Üniversitesi (KKTC)",
  "Girne Üniversitesi (KKTC)",
  "Kıbrıs Amerikan Üniversitesi (KKTC)",
  "Kıbrıs İlim Üniversitesi (KKTC)",
  "Kıbrıs Sağlık ve Toplum Bilimleri Üniversitesi (KKTC)",
  "Kıbrıs Sosyal Bilimler Üniversitesi (KKTC)",
  "Kıbrıs Uluslararası Üniversitesi (KKTC)",
  "Lefke Avrupa Üniversitesi (KKTC)",
  "Uluslararası Final Üniversitesi (KKTC)",
  "Yakın Doğu Üniversitesi (KKTC)",
  "Arkın Yaratıcı Sanatlar ve Tasarım Üniversitesi (KKTC)",
];

const universityDepartments = [
  "Acil Yardım ve Afet Yönetimi",
  "Adli Bilişim Mühendisliği",
  "Ağız ve Diş Sağlığı",
  "Anestezi",
  "Antrenörlük Eğitimi",
  "Aşçılık",
  "Bankacılık ve Finans",
  "Beslenme ve Diyetetik",
  "Bilgisayar Mühendisliği",
  "Bilgisayar Programcılığı",
  "Bilişim Sistemleri Mühendisliği",
  "Biyoloji",
  "Biyomedikal Mühendisliği",
  "Biyomühendislik",
  "Çocuk Gelişimi",
  "Denizcilik İşletmeleri Yönetimi",
  "Diş Hekimliği",
  "Ebelik",
  "Eczacılık",
  "Elektrik-Elektronik Mühendisliği",
  "Elektronik Haberleşme Mühendisliği",
  "Emlak Mühendisliği",
  "Endüstri Mühendisliği",
  "Endüstriyel Tasarım",
  "Felsefe",
  "Finans ve Bankacılık",
  "Fizyoterapi ve Rehabilitasyon",
  "Gastronomi ve Mutfak Sanatları",
  "Gazetecilik",
  "Gemi Makineleri İşletme Mühendisliği",
  "Görsel İletişim Tasarımı",
  "Grafik Tasarımı",
  "Halkla İlişkiler ve Reklamcılık",
  "Harita Mühendisliği",
  "Havacılık Yönetimi",
  "Hemşirelik",
  "Hukuk",
  "İç Mimarlık",
  "İç Mimarlık ve Çevre Tasarımı",
  "İktisat",
  "İlahiyat",
  "İletişim Tasarımı ve Yönetimi",
  "İlk ve Acil Yardım",
  "İlköğretim Matematik Öğretmenliği",
  "İngiliz Dili ve Edebiyatı",
  "İngilizce Öğretmenliği",
  "İnsan Kaynakları Yönetimi",
  "İnşaat Mühendisliği",
  "İş Sağlığı ve Güvenliği",
  "İşletme",
  "İşletme Mühendisliği",
  "Kimya",
  "Kimya Mühendisliği",
  "Lojistik Yönetimi",
  "Makine Mühendisliği",
  "Maliye",
  "Matematik",
  "Mekatronik Mühendisliği",
  "Metalurji ve Malzeme Mühendisliği",
  "Mimarlık",
  "Moda Tasarımı",
  "Moleküler Biyoloji ve Genetik",
  "Mütercim-Tercümanlık",
  "Odyoloji",
  "Okul Öncesi Öğretmenliği",
  "Özel Eğitim Öğretmenliği",
  "Pazarlama",
  "Psikoloji",
  "Radyo, Televizyon ve Sinema",
  "Rehberlik ve Psikolojik Danışmanlık (PDR)",
  "Reklamcılık",
  "Sağlık Yönetimi",
  "Sınıf Öğretmenliği",
  "Siyaset Bilimi ve Kamu Yönetimi",
  "Sosyoloji",
  "Tarih",
  "Tıp",
  "Turizm İşletmeciliği",
  "Türk Dili ve Edebiyatı",
  "Uçak Mühendisliği",
  "Uluslararası İlişkiler",
  "Uluslararası Ticaret ve Lojistik",
  "Veteriner",
  "Yazılım Mühendisliği",
  "Yönetim Bilişim Sistemleri",
  "Ziraat Mühendisliği",
];

const years = Array.from({ length: 60 }, (_, i) =>
  (new Date().getFullYear() - i).toString(),
);

const formatGPA = (text: string) => {
  let formatted = text.replace(/[^0-9.]/g, "");
  const parts = formatted.split(".");
  if (parts.length > 2) {
    formatted = parts[0] + "." + parts.slice(1).join("");
  }
  return formatted;
};

const formatYear = (text: string) => {
  return text.replace(/[^0-9]/g, "").slice(0, 4);
};
const sanitizeForComparison = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForComparison);
  }
  if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        const val = obj[key];
        if (val !== undefined && val !== null && val !== "") {
          if (Array.isArray(val) && val.length === 0) {
            return;
          }
          newObj[key] = sanitizeForComparison(val);
        }
      });
    return newObj;
  }
  return obj;
};

export default function MyResume() {
  const [user, setUser] = useState<any>(null);
  const [headline, setHeadline] = useState("");
  const [selectedHeadline, setSelectedHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<any[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentSkillLevel, setCurrentSkillLevel] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [currentLanguageLevel, setCurrentLanguageLevel] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState("");
  const [selectedUniPicker, setSelectedUniPicker] = useState("");
  const [selectedUniFieldPicker, setSelectedUniFieldPicker] = useState("");
  const [currentCertificateName, setCurrentCertificateName] = useState("");
  const [currentCertificateIssuer, setCurrentCertificateIssuer] = useState("");
  const [currentCertificateYear, setCurrentCertificateYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [highSchool, setHighSchool] = useState<EducationInfo>({
    school: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    gpa: "",
  });
  const [university, setUniversity] = useState<EducationInfo>({
    school: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    gpa: "",
  });
  const [languages, setLanguages] = useState<Language[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [initialState, setInitialState] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const isSavedRef = useRef(false);

  const steps = [
    "Temel Bilgiler",
    "Eğitim Bilgileri",
    "İş Deneyimi",
    "Yetenekler ve Diller",
    "Sertifikalar ve Projeler",
  ];

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUser(null);
        if (Platform.OS !== "web") {
          Alert.alert("Hata", "Devam etmek için lütfen giriş yapın.");
        }
        router.replace("/sign-in");
        return;
      }

      setUser(user);
      const loadData = async () => {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);

          const userData = userSnap.exists() ? userSnap.data() : {};

          const initialVals = {
            headline: userData.headline || "",
            summary: userData.summary || "",
            skills: userData.skills || [],
            experiences: userData.experiences || [],
            highSchool: userData.highSchool || {
              school: "",
              fieldOfStudy: "",
              startDate: "",
              endDate: "",
              gpa: "",
            },
            university: userData.university || {
              school: "",
              fieldOfStudy: "",
              startDate: "",
              endDate: "",
              gpa: "",
            },
            languages: userData.languages || [],
            certificates: userData.certificates || [],
            projects: userData.projects || [],
          };

          const fetchedHeadline = initialVals.headline;
          if (fetchedHeadline) {
            if (jobTitles.includes(fetchedHeadline)) {
              setSelectedHeadline(fetchedHeadline);
            } else {
              setSelectedHeadline("Diğer");
            }
          }

          if (
            !userData.highSchool &&
            !userData.university &&
            userData.educations &&
            userData.educations.length > 0
          ) {
            initialVals.university = {
              school: userData.educations[0].school || "",
              fieldOfStudy:
                userData.educations[0].fieldOfStudy ||
                userData.educations[0].degree ||
                "",
              startDate: userData.educations[0].startDate || "",
              endDate: userData.educations[0].endDate || "",
              gpa: "",
            };
            if (userData.educations.length > 1) {
              initialVals.highSchool = {
                school: userData.educations[1].school || "",
                fieldOfStudy:
                  userData.educations[1].fieldOfStudy ||
                  userData.educations[1].degree ||
                  "",
                startDate: userData.educations[1].startDate || "",
                endDate: userData.educations[1].endDate || "",
                gpa: "",
              };
            }
          }

          if (initialVals.university.school) {
            if (universities.includes(initialVals.university.school)) {
              setSelectedUniPicker(initialVals.university.school);
            } else {
              setSelectedUniPicker("Diğer");
            }
          }

          if (initialVals.university.fieldOfStudy) {
            if (
              universityDepartments.includes(
                initialVals.university.fieldOfStudy,
              )
            ) {
              setSelectedUniFieldPicker(initialVals.university.fieldOfStudy);
            } else {
              setSelectedUniFieldPicker("Diğer");
            }
          }

          setHeadline(initialVals.headline);
          setSummary(initialVals.summary);
          setSkills(initialVals.skills);
          setExperiences(initialVals.experiences);
          setHighSchool(initialVals.highSchool);
          setUniversity(initialVals.university);
          setLanguages(initialVals.languages);
          setCertificates(initialVals.certificates);
          setProjects(initialVals.projects);
          setInitialState(initialVals);
        } catch (error) {
          console.error("Veri yükleme hatası: ", error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (isSavedRef.current) return;
      if (!initialState) return;

      const currentState = {
        headline,
        summary,
        skills,
        experiences,
        highSchool,
        university,
        languages,
        certificates,
        projects,
      };

      const hasUnsavedChanges =
        JSON.stringify(sanitizeForComparison(initialState)) !==
        JSON.stringify(sanitizeForComparison(currentState));

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

    return unsubscribe;
  }, [
    navigation,
    initialState,
    headline,
    summary,
    skills,
    experiences,
    highSchool,
    university,
    languages,
    certificates,
    projects,
  ]);

  // zorunlu alan kontrolü için fonksiyon
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        if (!selectedHeadline) return false;
        if (selectedHeadline === "Diğer" && !headline.trim()) return false;
        return true;
      case 1:
        return true;
      case 2:
        return experiences.every(
          (exp) => exp.title.trim() !== "" && exp.company.trim() !== "",
        );
      case 3:
        return true;
      case 4:
        return projects.every((proj) => proj.name.trim() !== "");
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string,
  ) => {
    const newExperiences = [...experiences];
    newExperiences[index][field] = value;
    setExperiences(newExperiences);
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      { title: "", company: "", startDate: "", endDate: "", description: "" },
    ]);
  };

  const removeExperience = (index: number) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Bu iş deneyimini silmek istediğinize emin misiniz?",
      );
      if (confirmed) {
        const newExperiences = experiences.filter((_, i) => i !== index);
        setExperiences(newExperiences);
      }
    } else {
      Alert.alert(
        "Emin misiniz?",
        "Bu iş deneyimini silmek istediğinize emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Sil",
            style: "destructive",
            onPress: () => {
              const newExperiences = experiences.filter((_, i) => i !== index);
              setExperiences(newExperiences);
            },
          },
        ],
      );
    }
  };

  const handleAddLanguage = () => {
    const langToAdd =
      selectedLanguage === "Diğer" ? currentLanguage : selectedLanguage;
    if (langToAdd.trim() !== "" && currentLanguageLevel !== "") {
      setLanguages([
        ...languages,
        { language: langToAdd.trim(), level: currentLanguageLevel },
      ]);
      setSelectedLanguage("");
      setCurrentLanguage("");
      setCurrentLanguageLevel("");
    } else {
      Alert.alert("Eksik Bilgi", "Lütfen bir dil ve seviye seçin.");
    }
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleAddCertificate = () => {
    const certToAdd =
      selectedCertificate === "Diğer"
        ? currentCertificateName
        : selectedCertificate;
    if (certToAdd.trim() !== "") {
      setCertificates([
        ...certificates,
        {
          name: certToAdd.trim(),
          issuer: currentCertificateIssuer.trim(),
          year: currentCertificateYear.trim(),
        },
      ]);
      setSelectedCertificate("");
      setCurrentCertificateName("");
      setCurrentCertificateIssuer("");
      setCurrentCertificateYear("");
    } else {
      Alert.alert("Eksik Bilgi", "Lütfen bir sertifika/kurs seçin veya yazın.");
    }
  };

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  const handleProjectChange = (
    index: number,
    field: keyof Project,
    value: string,
  ) => {
    const newProjects = [...projects];
    newProjects[index][field] = value;
    setProjects(newProjects);
  };

  const addProject = () => {
    setProjects([...projects, { name: "", link: "", description: "" }]);
  };

  const removeProject = (index: number) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Bu projeyi silmek istediğinize emin misiniz?",
      );
      if (confirmed) {
        const newProjects = projects.filter((_, i) => i !== index);
        setProjects(newProjects);
      }
    } else {
      Alert.alert(
        "Emin misiniz?",
        "Bu projeyi silmek istediğinize emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Sil",
            style: "destructive",
            onPress: () => {
              const newProjects = projects.filter((_, i) => i !== index);
              setProjects(newProjects);
            },
          },
        ],
      );
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Hata", "Kaydetmek için giriş yapmalısınız.");
      return;
    }

    setSaving(true);
    const userDocRef = doc(db, "users", user.uid);

    try {
      const sortByDateDesc = (a: any, b: any) => {
        const dateA = (a.endDate || a.startDate || "").trim();
        const dateB = (b.endDate || b.startDate || "").trim();
        const aIsCurrent =
          dateA.toLowerCase().includes("devam") || dateA === "";
        const bIsCurrent =
          dateB.toLowerCase().includes("devam") || dateB === "";

        if (aIsCurrent && !bIsCurrent) return -1;
        if (!aIsCurrent && bIsCurrent) return 1;
        return dateB.localeCompare(dateA);
      };

      const sortedExperiences = [...experiences].sort(sortByDateDesc);

      setExperiences(sortedExperiences);

      const dataToSave: any = {
        headline: headline,
        summary: summary,
        skills: skills,
        experiences: sortedExperiences,
        highSchool: highSchool,
        university: university,
        languages: languages,
        certificates: certificates,
        projects: projects,
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, dataToSave, { merge: true });
      setInitialState({
        headline,
        summary,
        skills,
        experiences: sortedExperiences,
        highSchool,
        university,
        languages,
        certificates,
        projects,
      });

      isSavedRef.current = true;
      setSuccessModalVisible(true);

      setTimeout(() => {
        setSuccessModalVisible(false);
        router.replace("/profile");
      }, 1500);
    } catch (error) {
      console.error("Özgeçmiş kaydetme hatası: ", error);
      Alert.alert("Hata", "Özgeçmiş kaydedilirken bir sorun oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const getSuggestedSkills = () => {
    let suggestions: string[] = [];
    const lowerHeadline = headline?.toLowerCase() || "";

    for (const [key, mappedSkills] of Object.entries(skillSuggestionsMap)) {
      if (lowerHeadline.includes(key)) {
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
    const currentSkills = skills.map((s: any) =>
      (typeof s === "string" ? s : s.name).toLowerCase(),
    );
    return suggestions.filter(
      (skill) => !currentSkills.includes(skill.toLowerCase()),
    );
  };

  const handleAddSuggestedSkill = (skillName: string) => {
    const currentSkills = skills.map((s: any) =>
      (typeof s === "string" ? s : s.name).toLowerCase(),
    );
    if (!currentSkills.includes(skillName.toLowerCase())) {
      setCurrentSkill(skillName);
      setFocusedInput("currentSkillLevel");
    }
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() !== "" && currentSkillLevel !== "") {
      const newSkill = currentSkill.trim();
      const currentSkills = skills.map((s: any) =>
        (typeof s === "string" ? s : s.name).toLowerCase(),
      );
      if (!currentSkills.includes(newSkill.toLowerCase())) {
        setSkills([...skills, { name: newSkill, level: currentSkillLevel }]);
      }
      setCurrentSkill("");
      setCurrentSkillLevel("");
    } else {
      Alert.alert(
        "Eksik Bilgi",
        "Lütfen bir yetenek yazın ve seviyesini seçin.",
      );
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleHeadlineChange = (val: string) => {
    setSelectedHeadline(val);
    if (val !== "Diğer" && val !== "") {
      setHeadline(val);
    } else if (val === "") {
      setHeadline("");
    }
  };

  if (loading) {
    return <CustomLoader fullScreen text="Özgeçmiş Yükleniyor..." />;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Text style={styles.stepTitle}>Ünvan</Text>
            <View
              style={[
                styles.pickerContainer,
                focusedInput === "headlinePicker" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={focusedInput === "headlinePicker" ? "#4DA8DA" : "#aaa"}
                style={styles.inputIcon}
              />
              <Picker
                selectedValue={selectedHeadline}
                onValueChange={handleHeadlineChange}
                onFocus={() => setFocusedInput("headlinePicker")}
                onBlur={() => setFocusedInput(null)}
                style={styles.picker}
                dropdownIconColor="#4DA8DA"
              >
                <Picker.Item label="Ünvan Seçiniz" value="" color="#aaa" />
                {jobTitles.map((title) => (
                  <Picker.Item
                    key={title}
                    label={title}
                    value={title}
                    color={Platform.OS === "web" ? "#000" : undefined}
                  />
                ))}
                <Picker.Item
                  label="Diğer (Kendim Yazmak İstiyorum)"
                  value="Diğer"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
              </Picker>
            </View>

            {selectedHeadline === "Diğer" && (
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "headline" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={focusedInput === "headline" ? "#4DA8DA" : "#aaa"}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={headline}
                  onChangeText={setHeadline}
                  onFocus={() => setFocusedInput("headline")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Kendi ünvanınızı buraya yazın..."
                  placeholderTextColor="#aaa"
                />
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.stepTitle}>Hakkında</Text>
            <View
              style={[
                styles.inputContainer,
                styles.textAreaContainer,
                focusedInput === "summary" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={focusedInput === "summary" ? "#4DA8DA" : "#aaa"}
                style={[styles.inputIcon, { marginTop: 15 }]}
              />
              <TextInput
                value={summary}
                onChangeText={setSummary}
                onFocus={() => setFocusedInput("summary")}
                onBlur={() => setFocusedInput(null)}
                style={[styles.input, styles.textArea]}
                placeholder="Kendinizden kısaca bahsedin..."
                placeholderTextColor="#aaa"
                multiline
                numberOfLines={4}
              />
            </View>
          </>
        );

      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Lise</Text>
            <View style={styles.experienceContainer}>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "hs_school" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={focusedInput === "hs_school" ? "#4DA8DA" : "#aaa"}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={highSchool.school}
                  onChangeText={(val) =>
                    setHighSchool({ ...highSchool, school: val })
                  }
                  onFocus={() => setFocusedInput("hs_school")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Lise Adı"
                  placeholderTextColor="#aaa"
                />
              </View>
              <View
                style={[
                  styles.pickerContainer,
                  focusedInput === "hs_field" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="library-outline"
                  size={20}
                  color={focusedInput === "hs_field" ? "#4DA8DA" : "#aaa"}
                  style={styles.inputIcon}
                />
                <Picker
                  selectedValue={highSchool.fieldOfStudy}
                  onValueChange={(val) =>
                    setHighSchool({ ...highSchool, fieldOfStudy: val })
                  }
                  onFocus={() => setFocusedInput("hs_field")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.picker}
                  dropdownIconColor="#4DA8DA"
                >
                  <Picker.Item label="Bölüm Seçiniz" value="" color="#aaa" />
                  <Picker.Item
                    label="Sözel"
                    value="Sözel"
                    color={Platform.OS === "web" ? "#000" : undefined}
                  />
                  <Picker.Item
                    label="Eşit Ağırlık"
                    value="Eşit Ağırlık"
                    color={Platform.OS === "web" ? "#000" : undefined}
                  />
                  <Picker.Item
                    label="Sayısal"
                    value="Sayısal"
                    color={Platform.OS === "web" ? "#000" : undefined}
                  />
                </Picker>
              </View>
              <View
                style={[
                  styles.pickerContainer,
                  focusedInput === "hs_dates" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={focusedInput === "hs_dates" ? "#4DA8DA" : "#aaa"}
                  style={styles.inputIcon}
                />
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <Picker
                    selectedValue={highSchool.startDate}
                    onValueChange={(val) =>
                      setHighSchool({ ...highSchool, startDate: val })
                    }
                    onFocus={() => setFocusedInput("hs_dates")}
                    onBlur={() => setFocusedInput(null)}
                    style={[styles.picker, { flex: 1, marginHorizontal: -10 }]}
                    dropdownIconColor="#4DA8DA"
                  >
                    <Picker.Item label="Başlangıç" value="" color="#aaa" />
                    {years.map((year) => (
                      <Picker.Item
                        key={year}
                        label={year}
                        value={year}
                        color={Platform.OS === "web" ? "#000" : undefined}
                      />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={highSchool.endDate}
                    onValueChange={(val) =>
                      setHighSchool({ ...highSchool, endDate: val })
                    }
                    onFocus={() => setFocusedInput("hs_dates")}
                    onBlur={() => setFocusedInput(null)}
                    style={[styles.picker, { flex: 1, marginHorizontal: -10 }]}
                    dropdownIconColor="#4DA8DA"
                  >
                    <Picker.Item label="Bitiş" value="" color="#aaa" />
                    <Picker.Item
                      label="Devam Ediyor"
                      value="Devam Ediyor"
                      color={Platform.OS === "web" ? "#000" : undefined}
                    />
                    {years.map((year) => (
                      <Picker.Item
                        key={year}
                        label={year}
                        value={year}
                        color={Platform.OS === "web" ? "#000" : undefined}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "hs_gpa" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="stats-chart-outline"
                  size={20}
                  color={focusedInput === "hs_gpa" ? "#4DA8DA" : "#aaa"}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={highSchool.gpa}
                  onChangeText={(val) =>
                    setHighSchool({ ...highSchool, gpa: formatGPA(val) })
                  }
                  onFocus={() => setFocusedInput("hs_gpa")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Mezuniyet Ortalaması (örn: 85)"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.stepTitle}>Üniversite</Text>
            <View style={styles.experienceContainer}>
              <View
                style={[
                  styles.pickerContainer,
                  focusedInput === "uni_school_picker" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={
                    focusedInput === "uni_school_picker" ? "#4DA8DA" : "#aaa"
                  }
                  style={styles.inputIcon}
                />
                <Picker
                  selectedValue={selectedUniPicker}
                  onValueChange={(val) => {
                    setSelectedUniPicker(val);
                    if (val !== "Diğer") {
                      setUniversity({ ...university, school: val });
                    } else {
                      setUniversity({ ...university, school: "" });
                    }
                  }}
                  onFocus={() => setFocusedInput("uni_school_picker")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.picker}
                  dropdownIconColor="#4DA8DA"
                >
                  <Picker.Item
                    label="Üniversite Seçiniz"
                    value=""
                    color="#aaa"
                  />
                  {universities.map((uni) => (
                    <Picker.Item
                      key={uni}
                      label={uni}
                      value={uni}
                      color={Platform.OS === "web" ? "#000" : undefined}
                    />
                  ))}
                  <Picker.Item
                    label="Diğer"
                    value="Diğer"
                    color={Platform.OS === "web" ? "#000" : undefined}
                  />
                </Picker>
              </View>
              {selectedUniPicker === "Diğer" && (
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "uni_school_custom" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={
                      focusedInput === "uni_school_custom" ? "#4DA8DA" : "#aaa"
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={university.school}
                    onChangeText={(val) =>
                      setUniversity({ ...university, school: val })
                    }
                    onFocus={() => setFocusedInput("uni_school_custom")}
                    onBlur={() => setFocusedInput(null)}
                    style={styles.input}
                    placeholder="Kendi üniversitenizi yazın..."
                    placeholderTextColor="#aaa"
                  />
                </View>
              )}
              <View
                style={[
                  styles.pickerContainer,
                  focusedInput === "uni_field_picker" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="library-outline"
                  size={20}
                  color={
                    focusedInput === "uni_field_picker" ? "#4DA8DA" : "#aaa"
                  }
                  style={styles.inputIcon}
                />
                <Picker
                  selectedValue={selectedUniFieldPicker}
                  onValueChange={(val) => {
                    setSelectedUniFieldPicker(val);
                    if (val !== "Diğer") {
                      setUniversity({ ...university, fieldOfStudy: val });
                    } else {
                      setUniversity({ ...university, fieldOfStudy: "" });
                    }
                  }}
                  onFocus={() => setFocusedInput("uni_field_picker")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.picker}
                  dropdownIconColor="#4DA8DA"
                >
                  <Picker.Item label="Bölüm Seçiniz" value="" color="#aaa" />
                  {universityDepartments.map((dept) => (
                    <Picker.Item
                      key={dept}
                      label={dept}
                      value={dept}
                      color={Platform.OS === "web" ? "#000" : undefined}
                    />
                  ))}
                  <Picker.Item
                    label="Diğer"
                    value="Diğer"
                    color={Platform.OS === "web" ? "#000" : undefined}
                  />
                </Picker>
              </View>
              {selectedUniFieldPicker === "Diğer" && (
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "uni_field_custom" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={
                      focusedInput === "uni_field_custom" ? "#4DA8DA" : "#aaa"
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={university.fieldOfStudy}
                    onChangeText={(val) =>
                      setUniversity({ ...university, fieldOfStudy: val })
                    }
                    onFocus={() => setFocusedInput("uni_field_custom")}
                    onBlur={() => setFocusedInput(null)}
                    style={styles.input}
                    placeholder="Kendi bölümünüzü yazın..."
                    placeholderTextColor="#aaa"
                  />
                </View>
              )}
              <View
                style={[
                  styles.pickerContainer,
                  focusedInput === "uni_dates" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={focusedInput === "uni_dates" ? "#4DA8DA" : "#aaa"}
                  style={styles.inputIcon}
                />
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <Picker
                    selectedValue={university.startDate}
                    onValueChange={(val) =>
                      setUniversity({ ...university, startDate: val })
                    }
                    onFocus={() => setFocusedInput("uni_dates")}
                    onBlur={() => setFocusedInput(null)}
                    style={[styles.picker, { flex: 1, marginHorizontal: -10 }]}
                    dropdownIconColor="#4DA8DA"
                  >
                    <Picker.Item label="Başlangıç" value="" color="#aaa" />
                    {years.map((year) => (
                      <Picker.Item
                        key={year}
                        label={year}
                        value={year}
                        color={Platform.OS === "web" ? "#000" : undefined}
                      />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={university.endDate}
                    onValueChange={(val) =>
                      setUniversity({ ...university, endDate: val })
                    }
                    onFocus={() => setFocusedInput("uni_dates")}
                    onBlur={() => setFocusedInput(null)}
                    style={[styles.picker, { flex: 1, marginHorizontal: -10 }]}
                    dropdownIconColor="#4DA8DA"
                  >
                    <Picker.Item label="Bitiş" value="" color="#aaa" />
                    <Picker.Item
                      label="Devam Ediyor"
                      value="Devam Ediyor"
                      color={Platform.OS === "web" ? "#000" : undefined}
                    />
                    {years.map((year) => (
                      <Picker.Item
                        key={year}
                        label={year}
                        value={year}
                        color={Platform.OS === "web" ? "#000" : undefined}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "uni_gpa" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="stats-chart-outline"
                  size={20}
                  color={focusedInput === "uni_gpa" ? "#4DA8DA" : "#aaa"}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={university.gpa}
                  onChangeText={(val) =>
                    setUniversity({ ...university, gpa: formatGPA(val) })
                  }
                  onFocus={() => setFocusedInput("uni_gpa")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Mezuniyet Ortalaması (örn: 3.50)"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>İş Deneyimi</Text>
            {experiences.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="briefcase-outline" size={32} color="#aaa" />
                <Text style={styles.emptyStateText}>
                  Henüz iş deneyimi eklenmedi.
                </Text>
              </View>
            ) : (
              experiences.map((exp, index) => (
                <View key={index} style={styles.experienceContainer}>
                  <View
                    style={[
                      styles.pickerContainer,
                      focusedInput === `exp_title_picker_${index}` &&
                        styles.inputFocused,
                    ]}
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={20}
                      color={
                        focusedInput === `exp_title_picker_${index}`
                          ? "#4DA8DA"
                          : "#aaa"
                      }
                      style={styles.inputIcon}
                    />
                    <Picker
                      selectedValue={
                        jobTitles.includes(exp.title)
                          ? exp.title
                          : exp.title !== ""
                            ? "Diğer"
                            : ""
                      }
                      onValueChange={(val) => {
                        if (val === "Diğer") {
                          handleExperienceChange(index, "title", " ");
                        } else {
                          handleExperienceChange(index, "title", val);
                        }
                      }}
                      onFocus={() =>
                        setFocusedInput(`exp_title_picker_${index}`)
                      }
                      onBlur={() => setFocusedInput(null)}
                      style={styles.picker}
                      dropdownIconColor="#4DA8DA"
                    >
                      <Picker.Item
                        label="Pozisyon Seçiniz"
                        value=""
                        color="#aaa"
                      />
                      {jobTitles.map((title) => (
                        <Picker.Item
                          key={title}
                          label={title}
                          value={title}
                          color={Platform.OS === "web" ? "#000" : undefined}
                        />
                      ))}
                      <Picker.Item
                        label="Diğer"
                        value="Diğer"
                        color={Platform.OS === "web" ? "#000" : undefined}
                      />
                    </Picker>
                  </View>
                  {!jobTitles.includes(exp.title) && exp.title !== "" && (
                    <View
                      style={[
                        styles.inputContainer,
                        focusedInput === `exp_title_custom_${index}` &&
                          styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color={
                          focusedInput === `exp_title_custom_${index}`
                            ? "#4DA8DA"
                            : "#aaa"
                        }
                        style={styles.inputIcon}
                      />
                      <TextInput
                        value={exp.title.trim()}
                        onChangeText={(val) =>
                          handleExperienceChange(
                            index,
                            "title",
                            val === "" ? " " : val,
                          )
                        }
                        onFocus={() =>
                          setFocusedInput(`exp_title_custom_${index}`)
                        }
                        onBlur={() => setFocusedInput(null)}
                        style={styles.input}
                        placeholder="Kendi pozisyonunuzu yazın..."
                        placeholderTextColor="#aaa"
                      />
                    </View>
                  )}
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === `exp_company_${index}` &&
                        styles.inputFocused,
                    ]}
                  >
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color={
                        focusedInput === `exp_company_${index}`
                          ? "#4DA8DA"
                          : "#aaa"
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={exp.company}
                      onChangeText={(val) =>
                        handleExperienceChange(index, "company", val)
                      }
                      onFocus={() => setFocusedInput(`exp_company_${index}`)}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                      placeholder="Şirket"
                    />
                  </View>
                  <View
                    style={[
                      styles.pickerContainer,
                      focusedInput === `exp_dates_${index}` &&
                        styles.inputFocused,
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={
                        focusedInput === `exp_dates_${index}`
                          ? "#4DA8DA"
                          : "#aaa"
                      }
                      style={styles.inputIcon}
                    />
                    <View style={{ flex: 1, flexDirection: "row" }}>
                      <Picker
                        selectedValue={exp.startDate}
                        onValueChange={(val) =>
                          handleExperienceChange(index, "startDate", val)
                        }
                        onFocus={() => setFocusedInput(`exp_dates_${index}`)}
                        onBlur={() => setFocusedInput(null)}
                        style={[
                          styles.picker,
                          { flex: 1, marginHorizontal: -10 },
                        ]}
                        dropdownIconColor="#4DA8DA"
                      >
                        <Picker.Item label="Başlangıç" value="" color="#aaa" />
                        {years.map((year) => (
                          <Picker.Item
                            key={year}
                            label={year}
                            value={year}
                            color={Platform.OS === "web" ? "#000" : undefined}
                          />
                        ))}
                      </Picker>
                      <Picker
                        selectedValue={exp.endDate}
                        onValueChange={(val) =>
                          handleExperienceChange(index, "endDate", val)
                        }
                        onFocus={() => setFocusedInput(`exp_dates_${index}`)}
                        onBlur={() => setFocusedInput(null)}
                        style={[
                          styles.picker,
                          { flex: 1, marginHorizontal: -10 },
                        ]}
                        dropdownIconColor="#4DA8DA"
                      >
                        <Picker.Item label="Bitiş" value="" color="#aaa" />
                        <Picker.Item
                          label="Devam Ediyor"
                          value="Devam Ediyor"
                          color={Platform.OS === "web" ? "#000" : undefined}
                        />
                        {years.map((year) => (
                          <Picker.Item
                            key={year}
                            label={year}
                            value={year}
                            color={Platform.OS === "web" ? "#000" : undefined}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.textAreaContainer,
                      focusedInput === `exp_desc_${index}` &&
                        styles.inputFocused,
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={
                        focusedInput === `exp_desc_${index}`
                          ? "#4DA8DA"
                          : "#aaa"
                      }
                      style={[styles.inputIcon, { marginTop: 15 }]}
                    />
                    <TextInput
                      value={exp.description}
                      onChangeText={(val) =>
                        handleExperienceChange(index, "description", val)
                      }
                      onFocus={() => setFocusedInput(`exp_desc_${index}`)}
                      onBlur={() => setFocusedInput(null)}
                      style={[styles.input, styles.textArea]}
                      placeholder="Açıklama"
                      multiline
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeExperience(index)}
                  >
                    <Text style={styles.removeButtonText}>Deneyimi Sil</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity style={styles.addButton} onPress={addExperience}>
              <Text style={styles.addButtonText}>+ Deneyim Ekle</Text>
            </TouchableOpacity>
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Yetenekler</Text>
            {skills.length > 0 && (
              <View style={styles.chipsContainer}>
                {skills.map((skill: any, index) => {
                  const skillName =
                    typeof skill === "string" ? skill : skill.name;
                  const skillLevel =
                    typeof skill === "string" ? "" : ` (${skill.level})`;
                  return (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>
                        {skillName}
                        {skillLevel}
                      </Text>
                      <TouchableOpacity onPress={() => removeSkill(index)}>
                        <Ionicons name="close-circle" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
            <View
              style={[
                styles.inputContainer,
                focusedInput === "currentSkill" && styles.inputFocused,
                { marginBottom: 15 },
              ]}
            >
              <Ionicons
                name="star-outline"
                size={20}
                color={focusedInput === "currentSkill" ? "#4DA8DA" : "#aaa"}
                style={styles.inputIcon}
              />
              <TextInput
                value={currentSkill}
                onChangeText={setCurrentSkill}
                onFocus={() => setFocusedInput("currentSkill")}
                onBlur={() => setFocusedInput(null)}
                style={styles.input}
                placeholder="Yetenek adını yazın..."
                placeholderTextColor="#aaa"
                returnKeyType="next"
                onSubmitEditing={() => setFocusedInput("currentSkillLevel")}
              />
            </View>

            <View
              style={[
                styles.pickerContainer,
                focusedInput === "currentSkillLevel" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="bar-chart-outline"
                size={20}
                color={
                  focusedInput === "currentSkillLevel" ? "#4DA8DA" : "#aaa"
                }
                style={styles.inputIcon}
              />
              <Picker
                selectedValue={currentSkillLevel}
                onValueChange={setCurrentSkillLevel}
                onFocus={() => setFocusedInput("currentSkillLevel")}
                onBlur={() => setFocusedInput(null)}
                style={styles.picker}
                dropdownIconColor="#4DA8DA"
              >
                <Picker.Item label="Seviye Seçiniz" value="" color="#aaa" />
                <Picker.Item
                  label="Başlangıç"
                  value="Başlangıç"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
                <Picker.Item
                  label="Temel"
                  value="Temel"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
                <Picker.Item
                  label="Orta"
                  value="Orta"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
                <Picker.Item
                  label="İleri"
                  value="İleri"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
                <Picker.Item
                  label="Uzman"
                  value="Uzman"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
              </Picker>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}>
              <Text style={styles.addButtonText}>+ Yetenek Ekle</Text>
            </TouchableOpacity>

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

            <View style={styles.divider} />
            <Text style={styles.stepTitle}>Yabancı Diller</Text>
            {languages.length > 0 && (
              <View style={styles.chipsContainer}>
                {languages.map((lang, index) => (
                  <View key={index} style={styles.chip}>
                    <Text
                      style={styles.chipText}
                    >{`${lang.language} (${lang.level})`}</Text>
                    <TouchableOpacity onPress={() => removeLanguage(index)}>
                      <Ionicons name="close-circle" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <View
              style={[
                styles.pickerContainer,
                focusedInput === "selectedLanguage" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="language-outline"
                size={20}
                color={focusedInput === "selectedLanguage" ? "#4DA8DA" : "#aaa"}
                style={styles.inputIcon}
              />
              <Picker
                selectedValue={selectedLanguage}
                onValueChange={setSelectedLanguage}
                onFocus={() => setFocusedInput("selectedLanguage")}
                onBlur={() => setFocusedInput(null)}
                style={styles.picker}
                dropdownIconColor="#4DA8DA"
              >
                <Picker.Item label="Dil Seçiniz" value="" color="#aaa" />
                {commonLanguages.map((lang) => (
                  <Picker.Item
                    key={lang}
                    label={lang}
                    value={lang}
                    color={Platform.OS === "web" ? "#000" : undefined}
                  />
                ))}
                <Picker.Item
                  label="Diğer"
                  value="Diğer"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
              </Picker>
            </View>
            {selectedLanguage === "Diğer" && (
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "currentLanguage" && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={
                    focusedInput === "currentLanguage" ? "#4DA8DA" : "#aaa"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  value={currentLanguage}
                  onChangeText={setCurrentLanguage}
                  onFocus={() => setFocusedInput("currentLanguage")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Kendi dilinizi yazın..."
                  placeholderTextColor="#aaa"
                />
              </View>
            )}
            <View
              style={[
                styles.pickerContainer,
                focusedInput === "currentLanguageLevel" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="bar-chart-outline"
                size={20}
                color={
                  focusedInput === "currentLanguageLevel" ? "#4DA8DA" : "#aaa"
                }
                style={styles.inputIcon}
              />
              <Picker
                selectedValue={currentLanguageLevel}
                onValueChange={setCurrentLanguageLevel}
                onFocus={() => setFocusedInput("currentLanguageLevel")}
                onBlur={() => setFocusedInput(null)}
                style={styles.picker}
                dropdownIconColor="#4DA8DA"
              >
                <Picker.Item label="Seviye Seçiniz" value="" color="#aaa" />
                <Picker.Item
                  label="Başlangıç (A1-A2)"
                  value="Başlangıç (A1-A2)"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
                <Picker.Item
                  label="Orta (B1-B2)"
                  value="Orta (B1-B2)"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
                <Picker.Item
                  label="İleri (C1-C2)"
                  value="İleri (C1-C2)"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
                <Picker.Item
                  label="Anadil"
                  value="Anadil"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
              </Picker>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddLanguage}
            >
              <Text style={styles.addButtonText}>+ Dil Ekle</Text>
            </TouchableOpacity>
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>Sertifikalar ve Kurslar</Text>
            {certificates.length > 0 && (
              <View style={{ marginBottom: 15 }}>
                {certificates.map((cert, index) => (
                  <View key={index} style={styles.experienceContainer}>
                    <View style={styles.languageHeader}>
                      <Ionicons name="ribbon" size={20} color="#FFD700" />
                      <Text style={styles.languageTitle}>{cert.name}</Text>
                    </View>
                    {cert.issuer ? (
                      <Text style={{ color: "#ddd", marginBottom: 4 }}>
                        Kurum: {cert.issuer}
                      </Text>
                    ) : null}
                    {cert.year ? (
                      <Text style={{ color: "#aaa", fontSize: 14 }}>
                        Yıl: {cert.year}
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeCertificate(index)}
                    >
                      <Text style={styles.removeButtonText}>
                        Sertifikayı Sil
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View
              style={[
                styles.pickerContainer,
                focusedInput === "selectedCertificate" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="ribbon-outline"
                size={20}
                color={
                  focusedInput === "selectedCertificate" ? "#4DA8DA" : "#aaa"
                }
                style={styles.inputIcon}
              />
              <Picker
                selectedValue={selectedCertificate}
                onValueChange={setSelectedCertificate}
                onFocus={() => setFocusedInput("selectedCertificate")}
                onBlur={() => setFocusedInput(null)}
                style={styles.picker}
                dropdownIconColor="#4DA8DA"
              >
                <Picker.Item
                  label="Sertifika/Kurs Seçiniz"
                  value=""
                  color="#aaa"
                />
                {commonCertificates.map((cert) => (
                  <Picker.Item
                    key={cert}
                    label={cert}
                    value={cert}
                    color={Platform.OS === "web" ? "#000" : undefined}
                  />
                ))}
                <Picker.Item
                  label="Diğer"
                  value="Diğer"
                  color={Platform.OS === "web" ? "#000" : undefined}
                />
              </Picker>
            </View>

            {selectedCertificate === "Diğer" && (
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "currentCertificateName" &&
                    styles.inputFocused,
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={
                    focusedInput === "currentCertificateName"
                      ? "#4DA8DA"
                      : "#aaa"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  value={currentCertificateName}
                  onChangeText={setCurrentCertificateName}
                  onFocus={() => setFocusedInput("currentCertificateName")}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  placeholder="Kendi sertifikanızı yazın..."
                  placeholderTextColor="#aaa"
                />
              </View>
            )}

            <View
              style={[
                styles.inputContainer,
                focusedInput === "currentCertificateIssuer" &&
                  styles.inputFocused,
              ]}
            >
              <Ionicons
                name="business-outline"
                size={20}
                color={
                  focusedInput === "currentCertificateIssuer"
                    ? "#4DA8DA"
                    : "#aaa"
                }
                style={styles.inputIcon}
              />
              <TextInput
                value={currentCertificateIssuer}
                onChangeText={setCurrentCertificateIssuer}
                onFocus={() => setFocusedInput("currentCertificateIssuer")}
                onBlur={() => setFocusedInput(null)}
                style={styles.input}
                placeholder="Veren Kurum (örn: Udemy, Google)"
                placeholderTextColor="#aaa"
              />
            </View>

            <View
              style={[
                styles.pickerContainer,
                focusedInput === "currentCertificateYear" &&
                  styles.inputFocused,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={
                  focusedInput === "currentCertificateYear" ? "#4DA8DA" : "#aaa"
                }
                style={styles.inputIcon}
              />
              <Picker
                selectedValue={currentCertificateYear}
                onValueChange={(val) => setCurrentCertificateYear(val)}
                onFocus={() => setFocusedInput("currentCertificateYear")}
                onBlur={() => setFocusedInput(null)}
                style={styles.picker}
                dropdownIconColor="#4DA8DA"
              >
                <Picker.Item label="Yıl Seçiniz" value="" color="#aaa" />
                {years.map((year) => (
                  <Picker.Item
                    key={year}
                    label={year}
                    value={year}
                    color={Platform.OS === "web" ? "#000" : undefined}
                  />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCertificate}
            >
              <Text style={styles.addButtonText}>+ Sertifika Ekle</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.stepTitle}>Projeler</Text>
            {projects.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="folder-outline" size={32} color="#aaa" />
                <Text style={styles.emptyStateText}>
                  Henüz proje eklenmedi.
                </Text>
              </View>
            ) : (
              projects.map((project, index) => (
                <View key={index} style={styles.experienceContainer}>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === `proj_name_${index}` &&
                        styles.inputFocused,
                    ]}
                  >
                    <Ionicons
                      name="folder-outline"
                      size={20}
                      color={
                        focusedInput === `proj_name_${index}`
                          ? "#4DA8DA"
                          : "#aaa"
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={project.name}
                      onChangeText={(val) =>
                        handleProjectChange(index, "name", val)
                      }
                      onFocus={() => setFocusedInput(`proj_name_${index}`)}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                      placeholder="Proje Adı"
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === `proj_link_${index}` &&
                        styles.inputFocused,
                    ]}
                  >
                    <Ionicons
                      name="link-outline"
                      size={20}
                      color={
                        focusedInput === `proj_link_${index}`
                          ? "#4DA8DA"
                          : "#aaa"
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={project.link}
                      onChangeText={(val) =>
                        handleProjectChange(index, "link", val)
                      }
                      onFocus={() => setFocusedInput(`proj_link_${index}`)}
                      onBlur={() => setFocusedInput(null)}
                      style={styles.input}
                      placeholder="Proje Linki (opsiyonel)"
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.textAreaContainer,
                      focusedInput === `proj_desc_${index}` &&
                        styles.inputFocused,
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={
                        focusedInput === `proj_desc_${index}`
                          ? "#4DA8DA"
                          : "#aaa"
                      }
                      style={[styles.inputIcon, { marginTop: 15 }]}
                    />
                    <TextInput
                      value={project.description}
                      onChangeText={(val) =>
                        handleProjectChange(index, "description", val)
                      }
                      onFocus={() => setFocusedInput(`proj_desc_${index}`)}
                      onBlur={() => setFocusedInput(null)}
                      style={[styles.input, styles.textArea]}
                      placeholder="Proje Açıklaması"
                      multiline
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeProject(index)}
                  >
                    <Text style={styles.removeButtonText}>Projeyi Sil</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity style={styles.addButton} onPress={addProject}>
              <Text style={styles.addButtonText}>+ Proje Ekle</Text>
            </TouchableOpacity>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Özgeçmişi Düzenle</Text>
          </View>

          {/* İlerleme Göstergesi */}
          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressBar,
                  currentStep >= index ? styles.progressBarActive : {},
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepIndicatorText}>
            Adım {currentStep + 1} / {steps.length}: {steps[currentStep]}
          </Text>

          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={20}
          >
            <View style={styles.formContainer}>{renderStepContent()}</View>
          </KeyboardAwareScrollView>

          <View style={styles.wizardNavigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, currentStep === 0 && { opacity: 0 }]}
              onPress={handlePrev}
              disabled={currentStep === 0}
            >
              <Text style={styles.navButtonText}>Geri</Text>
            </TouchableOpacity>

            {currentStep < steps.length - 1 ? (
              <TouchableOpacity
                style={[
                  styles.navButton,
                  styles.nextButton,
                  !isStepValid() && styles.buttonDisabled,
                ]}
                onPress={handleNext}
                disabled={!isStepValid()}
              >
                <Text style={styles.navButtonText}>İleri</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.navButton,
                  styles.saveButton,
                  (!isStepValid() || saving) && styles.buttonDisabled,
                ]}
                onPress={handleSave}
                disabled={!isStepValid() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.navButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Başarı Modalı */}
      <CustomModal
        visible={successModalVisible}
        title="Başarılı!"
        message="Özgeçmişiniz başarıyla kaydedildi."
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 20,
    zIndex: 1,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 5,
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 5,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  progressBarActive: { backgroundColor: "#4DA8DA" },
  stepIndicatorText: {
    color: "#4DA8DA",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 150,
  },
  formContainer: { width: "100%", maxWidth: Math.min(450, width * 0.9) },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputFocused: {
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
  suggestionsContainer: {
    marginBottom: 20,
    marginTop: -10,
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
  suggestionText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  textAreaContainer: {
    alignItems: "flex-start",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingVertical: 15,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4DA8DA",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipText: {
    color: "#fff",
    fontSize: 14,
    marginRight: 6,
  },
  addSkillButton: {
    padding: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    width: "100%",
    marginVertical: 20,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderStyle: "dashed",
  },
  emptyStateText: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 10,
    fontStyle: "italic",
  },
  experienceContainer: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "rgba(0, 122, 255, 0.2)",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: { color: "#fff", fontSize: 16 },
  removeButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 5,
  },
  removeButtonText: { color: "#fff", fontSize: 14 },
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  languageTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    marginBottom: 20,
    paddingLeft: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  picker: {
    flex: 1,
    height: 55,
    width: "100%",
    ...Platform.select({ web: { color: "#000" }, default: { color: "#fff" } }),
  },
  wizardNavigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    minWidth: 100,
    alignItems: "center",
  },
  nextButton: { backgroundColor: "#4DA8DA" },
  saveButton: { backgroundColor: "#28a745" },
  buttonDisabled: { opacity: 0.7 },
  navButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

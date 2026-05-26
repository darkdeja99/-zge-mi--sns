import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    arrayRemove,
    arrayUnion,
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

interface JobDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  type?: string;
  workModel?: string;
  description?: string;
  employerId: string;
  contactEmail?: string;
  createdAt?: any;
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [employerEmailFallback, setEmployerEmailFallback] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "jobs", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const jobData = { id: docSnap.id, ...docSnap.data() } as JobDetails;
          setJob(jobData);

          // Eğer ilanda e-posta yoksa (eski eklenen ilanlar), users koleksiyonundan çekmeyi dene
          if (!jobData.contactEmail && jobData.employerId) {
            const userRef = doc(db, "users", jobData.employerId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().email) {
              setEmployerEmailFallback(userSnap.data().email);
            }
          }
        } else {
          Alert.alert("Hata", "İlan bulunamadı veya silinmiş.");
          router.back();
        }
      } catch (error) {
        console.error("İlan detayı çekilirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (!auth.currentUser || !id) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const savedJobs = docSnap.data().savedJobs || [];
        setIsSaved(savedJobs.includes(id as string));
      }
    });
    return () => unsub();
  }, [id]);

  const handleApply = async () => {
    const targetEmail = job?.contactEmail || employerEmailFallback;

    if (!targetEmail) {
      Alert.alert(
        "Bilgi",
        "İlan sahibinin iletişim e-posta adresi bulunamadı.",
      );
      return;
    }

    const subject = `${job?.title} İlanı Başvurusu`;
    const body = `Merhaba,\n\n"${job?.company}" şirketindeki "${job?.title}" pozisyonu için iletişime geçiyorum.\n\n[Buraya ön yazınızı ve kendinizden bahseden bilgileri ekleyebilirsiniz.]\n\nİyi çalışmalar.`;
    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);

        Alert.alert(
          "Yönlendirildi",
          "E-posta uygulamanız açıldı. Lütfen başvurunuzu e-posta üzerinden göndermeyi unutmayın!",
        );

        // E-posta penceresi başarıyla açıldığında başvuruyu veritabanına kaydet
        if (auth.currentUser && id) {
          try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, { appliedJobs: arrayUnion(id) });
          } catch (err) {
            console.error("Başvuru durumu kaydedilemedi:", err);
          }
        }
      } else {
        Alert.alert(
          "Hata",
          "Cihazınızda e-posta gönderimi için bir uygulama bulunamadı.",
        );
      }
    } catch (error) {
      console.error("Mail uygulaması açılırken hata:", error);
    }
  };

  const toggleSaveJob = async () => {
    if (!auth.currentUser || !id) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    try {
      await updateDoc(userRef, {
        savedJobs: isSaved
          ? arrayRemove(id as string)
          : arrayUnion(id as string),
      });
    } catch (error) {
      console.error("İlan kaydedilirken hata:", error);
      Alert.alert("Hata", "İlan durumu güncellenemedi.");
    }
  };

  if (loading) {
    return (
      <View style={styles.background}>
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.container,
              { justifyContent: "center", alignItems: "center" },
            ]}
          >
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!job) return null;

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveHeaderButton}
            onPress={toggleSaveJob}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isSaved ? "#4DA8DA" : "white"}
            />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <View style={styles.companyLogoContainer}>
              <Text style={styles.companyLogoText}>
                {job.company ? job.company.charAt(0).toUpperCase() : "İ"}
              </Text>
            </View>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.company}>{job.company}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#ccc" />
              <Text style={styles.locationText}>{job.location}</Text>
              <Text style={styles.timeText}>
                {" "}
                • {formatTimeAgo(job.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            {job.workModel && (
              <View style={styles.badge}>
                <Ionicons name="laptop-outline" size={14} color="#4DA8DA" />
                <Text style={styles.badgeText}>{job.workModel}</Text>
              </View>
            )}
            {job.type && (
              <View style={styles.badge}>
                <Ionicons name="briefcase-outline" size={14} color="#4DA8DA" />
                <Text style={styles.badgeText}>{job.type}</Text>
              </View>
            )}
          </View>

          <View style={styles.descriptionSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="document-text" size={20} color="#4DA8DA" />
              <Text style={styles.sectionTitle}>İlan Detayları</Text>
            </View>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Ionicons
              name="paper-plane-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.applyButtonText}>Hemen Başvur</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#0f2027" },
  safeArea: { flex: 1 },
  container: { flexGrow: 1, padding: 20, paddingTop: 60, paddingBottom: 20 },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 5,
  },
  saveHeaderButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
    padding: 5,
  },
  headerSection: {
    marginTop: 20,
    marginBottom: 25,
    alignItems: "center",
  },
  companyLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(77, 168, 218, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#4DA8DA",
  },
  companyLogoText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4DA8DA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  company: {
    fontSize: 18,
    color: "#4DA8DA",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  locationText: { color: "#ccc", fontSize: 14, marginLeft: 4 },
  timeText: { color: "#888", fontSize: 14 },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 25,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(77, 168, 218, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 168, 218, 0.3)",
  },
  badgeText: {
    color: "#4DA8DA",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  descriptionSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  descriptionText: { color: "#ddd", fontSize: 15, lineHeight: 24 },
  footer: {
    padding: 20,
    backgroundColor: "#0f2027",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  applyButton: {
    flexDirection: "row",
    backgroundColor: "#4DA8DA",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

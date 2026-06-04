import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomLoader from "../../components/CustomLoader";
import { auth, db } from "../../firebaseConfig";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

interface JobDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  type?: string;
  workModel?: string;
  experience?: string;
  salaryRange?: { min: string; max: string };
  skills?: string[];
  description?: string;
  employerId: string;
  contactEmail?: string;
  createdAt?: any;
  applicants?: string[];
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);
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
    let unsub: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && id) {
        const userRef = doc(db, "users", user.uid);
        unsub = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const savedJobs = docSnap.data().savedJobs || [];
              const appliedJobs = docSnap.data().appliedJobs || [];
              setIsSaved(savedJobs.includes(id as string));
              setIsApplied(appliedJobs.includes(id as string));
            }
          },
          (error) => {
            if (error.code !== "permission-denied") {
              console.error("Kullanıcı verisi dinlenirken hata:", error);
            }
          },
        );
      } else {
        if (unsub) unsub();
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsub) unsub();
    };
  }, [id]);

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!job || !auth.currentUser || job.employerId !== auth.currentUser.uid)
        return;
      if (!job.applicants || job.applicants.length === 0) {
        setApplicantsList([]);
        return;
      }

      try {
        const fetchedApplicants = await Promise.all(
          job.applicants.map(async (applicantId) => {
            const userSnap = await getDoc(doc(db, "users", applicantId));
            if (userSnap.exists()) {
              return { id: userSnap.id, ...userSnap.data() };
            }
            return null;
          }),
        );
        setApplicantsList(fetchedApplicants.filter(Boolean));
      } catch (error) {
        console.error("Başvuranlar çekilirken hata:", error);
      }
    };
    fetchApplicants();
  }, [job]);

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
          const currentUserUid = auth.currentUser.uid;
          try {
            const userRef = doc(db, "users", currentUserUid);
            const jobRef = doc(db, "jobs", id as string);
            await Promise.all([
              setDoc(userRef, { appliedJobs: arrayUnion(id) }, { merge: true }),
              setDoc(
                jobRef,
                {
                  applicants: arrayUnion(currentUserUid),
                },
                { merge: true },
              ),
            ]);
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

  const handleWithdraw = async () => {
    if (!auth.currentUser || !id) return;

    const currentUserUid = auth.currentUser.uid;

    const executeWithdraw = async () => {
      const userRef = doc(db, "users", currentUserUid);
      const jobRef = doc(db, "jobs", id as string);
      try {
        await Promise.all([
          setDoc(userRef, { appliedJobs: arrayRemove(id) }, { merge: true }),
          setDoc(
            jobRef,
            { applicants: arrayRemove(currentUserUid) },
            { merge: true },
          ),
        ]);
        if (Platform.OS === "web") {
          window.alert("Başvurunuz başarıyla geri çekildi.");
        } else {
          Alert.alert("Başarılı", "Başvurunuz başarıyla geri çekildi.");
        }
      } catch (err) {
        console.error("Başvuru geri çekilirken hata:", err);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Başvurunuzu geri çekmek istediğinize emin misiniz?",
      );
      if (confirmed) executeWithdraw();
    } else {
      Alert.alert(
        "Emin misiniz?",
        "Başvurunuzu geri çekmek istediğinize emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          { text: "Geri Çek", style: "destructive", onPress: executeWithdraw },
        ],
      );
    }
  };

  const handleStartChat = async () => {
    if (!auth.currentUser || !job || !job.employerId) return;

    const currentUserId = auth.currentUser.uid;
    const targetUserId = job.employerId;

    try {
      const chatsRef = collection(db, "chats");
      // Mevcut kullanıcının dahil olduğu sohbetleri ara
      const q = query(
        chatsRef,
        where("participants", "array-contains", currentUserId),
      );
      const querySnapshot = await getDocs(q);

      let existingChatId = null;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Bulunan sohbetin katılımcıları arasında işveren de var mı?
        if (data.participants.includes(targetUserId)) {
          existingChatId = docSnap.id;
        }
      });

      if (existingChatId) {
        router.push(`/chat/${existingChatId}`);
      } else {
        const newChatRef = await addDoc(chatsRef, {
          participants: [currentUserId, targetUserId],
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: currentUserId,
          lastMessageRead: true,
        });
        router.push(`/chat/${newChatRef.id}`);
      }
    } catch (error) {
      console.error("Sohbet başlatılırken hata:", error);
      Alert.alert("Hata", "Sohbet başlatılamadı.");
    }
  };

  const toggleSaveJob = async () => {
    if (!auth.currentUser || !id) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    try {
      await setDoc(
        userRef,
        {
          savedJobs: isSaved
            ? arrayRemove(id as string)
            : arrayUnion(id as string),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("İlan kaydedilirken hata:", error);
      Alert.alert("Hata", "İlan durumu güncellenemedi.");
    }
  };

  if (loading) {
    return <CustomLoader fullScreen text="İlan Detayları Yükleniyor..." />;
  }

  if (!job) return null;

  const isEmployer = auth.currentUser?.uid === job.employerId;

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
            {job.experience && (
              <View style={styles.badge}>
                <Ionicons name="star-outline" size={14} color="#4DA8DA" />
                <Text style={styles.badgeText}>{job.experience}</Text>
              </View>
            )}
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
            {job.salaryRange &&
              (job.salaryRange.min || job.salaryRange.max) && (
                <View style={styles.badge}>
                  <Ionicons name="cash-outline" size={14} color="#4DA8DA" />
                  <Text style={styles.badgeText}>
                    {job.salaryRange.min ? `${job.salaryRange.min} ₺` : ""}
                    {job.salaryRange.min && job.salaryRange.max ? " - " : ""}
                    {job.salaryRange.max ? `${job.salaryRange.max} ₺` : ""}
                  </Text>
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

          {job.skills && job.skills.length > 0 && (
            <View style={[styles.descriptionSection, { marginTop: 15 }]}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="construct-outline" size={20} color="#4DA8DA" />
                <Text style={styles.sectionTitle}>Aranan Yetenekler</Text>
              </View>
              <View style={styles.skillsContainer}>
                {job.skills.map((skill, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.skillChip}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/jobs",
                        params: { search: skill },
                      })
                    }
                  >
                    <Text style={styles.skillChipText}>{skill}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {isEmployer && applicantsList.length > 0 && (
            <View style={[styles.descriptionSection, { marginTop: 15 }]}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="people" size={20} color="#4DA8DA" />
                <Text style={styles.sectionTitle}>
                  Başvuranlar ({applicantsList.length})
                </Text>
              </View>
              {applicantsList.map((applicant) => (
                <TouchableOpacity
                  key={applicant.id}
                  style={styles.applicantCard}
                  onPress={() => router.push(`/${applicant.id}`)}
                >
                  <View style={styles.applicantAvatarContainer}>
                    {applicant.photoURL ? (
                      <Image
                        source={{ uri: applicant.photoURL }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                      />
                    ) : (
                      <Text style={styles.applicantAvatarText}>
                        {applicant.name
                          ? applicant.name.charAt(0).toUpperCase()
                          : "K"}
                      </Text>
                    )}
                  </View>
                  <View style={styles.applicantInfo}>
                    <Text
                      style={styles.applicantName}
                    >{`${applicant.name || ""} ${applicant.surname || ""}`}</Text>
                    {applicant.headline && (
                      <Text style={styles.applicantHeadline} numberOfLines={1}>
                        {applicant.headline}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#aaa" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {!isEmployer && (
          <View style={styles.footer}>
            <View style={styles.footerInner}>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={handleStartChat}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={20}
                  color="#4DA8DA"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.messageButtonText}>Mesaj Gönder</Text>
              </TouchableOpacity>

              {isApplied ? (
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: "#d9534f" }]}
                  onPress={handleWithdraw}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.applyButtonText}>Geri Çek</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApply}
                >
                  <Ionicons
                    name="paper-plane-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.applyButtonText}>Başvur</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#0f2027" },
  safeArea: { flex: 1 },
  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignSelf: "center",
    width: "100%",
    maxWidth: 800,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  saveHeaderButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 5,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  companyLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  companyLogoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
  },
  company: {
    fontSize: 18,
    color: "#4DA8DA",
    fontWeight: "600",
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: "#ccc",
    marginLeft: 4,
  },
  timeText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(77, 168, 218, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 168, 218, 0.3)",
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 6,
  },
  descriptionSection: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    borderRadius: 15,
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
  descriptionText: {
    fontSize: 15,
    color: "#ddd",
    lineHeight: 24,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  skillChip: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skillChipText: {
    color: "#fff",
    fontSize: 14,
  },
  applicantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  applicantAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  applicantAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  applicantHeadline: {
    color: "#aaa",
    fontSize: 13,
  },
  footer: {
    padding: 20,
    backgroundColor: "#0f2027",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  footerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 800,
    gap: 15,
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    backgroundColor: "rgba(77, 168, 218, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4DA8DA",
  },
  messageButtonText: {
    color: "#4DA8DA",
    fontSize: 16,
    fontWeight: "bold",
  },
  applyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    backgroundColor: "#4DA8DA",
    borderRadius: 12,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

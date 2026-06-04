import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomLoader from "../../components/CustomLoader";
import CustomModal from "../../components/CustomModal";
import { auth, db } from "../../firebaseConfig";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

interface AdminJobData {
  id: string;
  title: string;
  company: string;
  location: string;
  type?: string;
  workModel?: string;
  employerId: string;
  createdAt?: any;
}

export default function ManageJobs() {
  const [jobs, setJobs] = useState<AdminJobData[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<AdminJobData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsList: AdminJobData[] = [];
        snapshot.forEach((doc) => {
          jobsList.push({ id: doc.id, ...doc.data() } as AdminJobData);
        });
        setJobs(jobsList);
        setFilteredJobs(jobsList);
        setLoading(false);
      },
      (error) => {
        console.error("İlanlar çekilirken hata:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredJobs(jobs);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(lowerQuery) ||
          j.company?.toLowerCase().includes(lowerQuery),
      );
      setFilteredJobs(filtered);
    }
  }, [searchQuery, jobs]);

  const openDeleteModal = (jobId: string, jobTitle: string) => {
    setJobToDelete({ id: jobId, title: jobTitle });
    setDeleteReason("");
    setDeleteModalVisible(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    if (deleteReason.trim() === "") {
      if (Platform.OS === "web") {
        window.alert("Hata: Lütfen bir silme nedeni belirtin.");
      } else {
        Alert.alert("Hata", "Lütfen bir silme nedeni belirtin.");
      }
      return;
    }

    try {
      const jobData = jobs.find((j) => j.id === jobToDelete.id);

      //  log tablosu kayıt
      await addDoc(collection(db, "deleted_jobs"), {
        originalJobId: jobToDelete.id,
        title: jobToDelete.title,
        employerId: jobData?.employerId || "Bilinmiyor",
        company: jobData?.company || "Bilinmiyor",
        reason: deleteReason,
        deletedAt: serverTimestamp(),
        deletedBy: auth.currentUser?.displayName
          ? `${auth.currentUser.displayName} (${auth.currentUser.uid})`
          : auth.currentUser?.uid || "Bilinmiyor",
      });

      await deleteDoc(doc(db, "jobs", jobToDelete.id));
      if (Platform.OS === "web") {
        window.alert("Başarılı: İlan silindi.");
      } else {
        Alert.alert("Başarılı", "İlan silindi.");
      }
      setDeleteModalVisible(false);
      setJobToDelete(null);
    } catch (error) {
      console.error("İlan silinirken hata:", error);
      if (Platform.OS === "web") {
        window.alert("Hata: İlan silinemedi.");
      } else {
        Alert.alert("Hata", "İlan silinemedi.");
      }
    }
  };

  const renderJobItem = ({ item }: { item: AdminJobData }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobInfo}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.jobCompany} numberOfLines={1}>
          {item.company}
        </Text>
        <View style={styles.detailsRow}>
          <Ionicons name="location-outline" size={14} color="#ccc" />
          <Text style={styles.detailText}>{item.location}</Text>
          <Text style={styles.timeText}>
            {" "}
            • {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/job-details/${item.id}`)}
        >
          <Ionicons name="eye-outline" size={20} color="#4DA8DA" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openDeleteModal(item.id, item.title)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>İlan Yönetimi</Text>
          <View style={{ width: 34 }} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="İlan başlığı veya şirket ara..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearIcon}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={{ marginTop: 50 }}>
            <CustomLoader text="İlanlar Yükleniyor..." />
          </View>
        ) : (
          <FlatList
            data={filteredJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderJobItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>İlan bulunamadı.</Text>
            }
          />
        )}
      </SafeAreaView>

      {/* İlan Silme Modalı */}
      <CustomModal
        visible={deleteModalVisible}
        title="İlanı Sil"
        message={`"${jobToDelete?.title}" başlıklı ilanı silmek üzeresiniz. Lütfen silme nedenini belirtin:`}
        type="error"
        buttonText="Sil"
        onClose={confirmDeleteJob}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <TextInput
          style={styles.modalInput}
          placeholder="Silme nedeni (Spam, kural ihlali vb.)"
          placeholderTextColor="#999"
          value={deleteReason}
          onChangeText={setDeleteReason}
          multiline
        />
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#0f2027" },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: { padding: 5 },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 10, fontSize: 15 },
  clearIcon: { marginLeft: 10, padding: 5 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  jobInfo: { flex: 1 },
  jobTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  jobCompany: { fontSize: 14, color: "#4DA8DA", marginBottom: 8 },
  detailsRow: { flexDirection: "row", alignItems: "center" },
  detailText: { fontSize: 13, color: "#ccc", marginLeft: 4 },
  timeText: { fontSize: 12, color: "#888", fontStyle: "italic" },
  actionsContainer: { flexDirection: "row", gap: 10, marginLeft: 10 },
  actionButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 16,
    marginTop: 40,
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },
});

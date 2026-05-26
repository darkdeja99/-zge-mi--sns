import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type?: string;
  workModel?: string;
  description?: string;
  employerId: string;
  createdAt?: any;
}

// React.memo sayesinde listeye dokunulmadığı sürece item'lar tekrar render edilmez
const JobCardItem = memo(
  ({
    item,
    isSaved,
    isApplied,
    isEmployer,
    onToggleSave,
    onDelete,
  }: {
    item: Job;
    isSaved: boolean;
    isApplied: boolean;
    isEmployer: boolean;
    onToggleSave: (id: string, isSaved: boolean) => void;
    onDelete: (id: string) => void;
  }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => {
        router.push(`/job-details/${item.id}`);
      }}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.jobCompany} numberOfLines={1}>
            {item.company}
          </Text>
        </View>
        <View style={[styles.iconContainer, { flexDirection: "row", gap: 15 }]}>
          <TouchableOpacity
            onPress={() => onToggleSave(item.id, isSaved)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isSaved ? "#4DA8DA" : "#aaa"}
            />
          </TouchableOpacity>

          {isEmployer && (
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={22} color="#ff4d4d" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.jobDetailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color="#ccc" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        {item.workModel ? (
          <View style={styles.detailItem}>
            <Ionicons name="laptop-outline" size={14} color="#ccc" />
            <Text style={styles.detailText}>{item.workModel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.jobFooter}>
        <View style={styles.tagsContainer}>
          {isApplied && (
            <View
              style={[
                styles.tagBadge,
                {
                  backgroundColor: "rgba(76, 175, 80, 0.2)",
                  borderColor: "#4CAF50",
                  marginRight: 5,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: "#4CAF50", fontWeight: "bold" },
                ]}
              >
                Başvuruldu
              </Text>
            </View>
          )}

          {item.type ? (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.type}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  ),
);

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "applied">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(10);

  useEffect(() => {
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setSavedJobIds(docSnap.data().savedJobs || []);
          setAppliedJobIds(docSnap.data().appliedJobs || []);
        }
      });
      return () => unsubUser();
    }
  }, []);

  useEffect(() => {
    const jobsRef = collection(db, "jobs");
    // İlanları tarihe göre en yeniden en eskiye doğru sırala
    const q = query(jobsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsList: Job[] = [];
        snapshot.forEach((doc) => {
          jobsList.push({ id: doc.id, ...doc.data() } as Job);
        });
        setJobs(jobsList);
        setLoading(false);
      },
      (error) => {
        console.error("İş ilanlarını çekerken hata:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredJobs = useMemo(() => {
    // Önce seçili sekmeye (Tüm İlanlar veya Başvurularım) göre filtrele
    let baseJobs =
      activeTab === "applied"
        ? jobs.filter((j) => appliedJobIds.includes(j.id))
        : jobs;

    if (searchQuery.trim() === "") {
      return baseJobs;
    } else {
      const queryStr = searchQuery.toLowerCase();
      const filtered = baseJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(queryStr) ||
          job.company.toLowerCase().includes(queryStr) ||
          job.location.toLowerCase().includes(queryStr) ||
          (job.type && job.type.toLowerCase().includes(queryStr)) ||
          (job.workModel && job.workModel.toLowerCase().includes(queryStr)),
      );
      return filtered;
    }
  }, [searchQuery, jobs, activeTab, appliedJobIds]);

  // Filtreler (Arama veya Sekme) değiştiğinde gösterilecek eleman sayısını sıfırla
  useEffect(() => {
    setDisplayedCount(10);
  }, [searchQuery, activeTab]);

  const handleLoadMore = () => {
    if (displayedCount < filteredJobs.length) {
      setDisplayedCount((prevCount) => prevCount + 10);
    }
  };

  const paginatedJobs = useMemo(() => {
    return filteredJobs.slice(0, displayedCount);
  }, [filteredJobs, displayedCount]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleDeleteJob = useCallback((jobId: string) => {
    const executeDelete = async () => {
      try {
        await deleteDoc(doc(db, "jobs", jobId));
      } catch (error) {
        console.error("İlan silinirken hata:", error);
        if (Platform.OS === "web") {
          window.alert("Hata: İlan silinemedi.");
        } else {
          Alert.alert("Hata", "İlan silinemedi.");
        }
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Bu ilanı silmek istediğinize emin misiniz?",
      );
      if (confirmed) {
        executeDelete();
      }
    } else {
      Alert.alert("İlanı Sil", "Bu ilanı silmek istediğinize emin misiniz?", [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: executeDelete },
      ]);
    }
  }, []);

  const toggleSaveJob = useCallback(async (jobId: string, isSaved: boolean) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    try {
      await updateDoc(userRef, {
        savedJobs: isSaved ? arrayRemove(jobId) : arrayUnion(jobId),
      });
    } catch (error) {
      console.error("İlan kaydedilirken hata:", error);
    }
  }, []);

  const renderJobItem = useCallback(
    ({ item }: { item: Job }) => {
      const isSaved = savedJobIds.includes(item.id);
      const isApplied = appliedJobIds.includes(item.id);
      const isEmployer = auth.currentUser?.uid === item.employerId;

      return (
        <JobCardItem
          item={item}
          isSaved={isSaved}
          isApplied={isApplied}
          isEmployer={isEmployer}
          onToggleSave={toggleSaveJob}
          onDelete={handleDeleteJob}
        />
      );
    },
    [savedJobIds, appliedJobIds, toggleSaveJob, handleDeleteJob],
  );

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
        <View style={styles.header}>
          <Text style={styles.title}>İş İlanları</Text>
          <TouchableOpacity
            style={styles.addJobButton}
            onPress={() => router.push("/add-job")}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addJobText}>İlan Ver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "all" && styles.activeTab]}
            onPress={() => setActiveTab("all")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.activeTabText,
              ]}
            >
              Tüm İlanlar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "applied" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("applied")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "applied" && styles.activeTabText,
              ]}
            >
              Başvurularım
            </Text>
          </TouchableOpacity>
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
            placeholder="İlan adı, şirket veya konum ara..."
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

        <FlatList
          data={paginatedJobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          getItemLayout={(_, index) => ({
            length: 140, // Ortalama ilan kartı yüksekliği
            offset: 140 * index,
            index,
          })}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={["#fff", "#4DA8DA"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color="#aaa" />
              <Text style={styles.emptyText}>İlan bulunamadı.</Text>
              <Text style={styles.emptySubText}>
                Farklı bir arama yapmayı deneyin.
              </Text>
            </View>
          }
          ListFooterComponent={
            displayedCount < filteredJobs.length ? (
              <ActivityIndicator
                size="small"
                color="#4DA8DA"
                style={{ marginVertical: 20 }}
              />
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#0f2027" },
  safeArea: { flex: 1 },
  header: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  addJobButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(77, 168, 218, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4DA8DA",
  },
  addJobText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: { backgroundColor: "#4DA8DA" },
  tabText: { color: "#aaa", fontWeight: "600", fontSize: 14 },
  activeTabText: { color: "#fff" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 10,
    fontSize: 15,
  },
  clearIcon: { marginLeft: 10, padding: 5 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: { color: "#aaa", fontSize: 18, marginTop: 20, textAlign: "center" },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  jobCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  jobTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 15,
    color: "#4DA8DA",
    fontWeight: "600",
  },
  iconContainer: {
    padding: 2,
  },
  jobDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    color: "#ccc",
    fontSize: 13,
    marginLeft: 4,
  },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  tagsContainer: { flexDirection: "row" },
  tagBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  tagText: { color: "#ddd", fontSize: 12 },
  timeText: { color: "#888", fontSize: 12, fontStyle: "italic" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: { color: "#ddd", fontSize: 18, marginTop: 15, fontWeight: "600" },
  emptySubText: { color: "#aaa", fontSize: 14, marginTop: 5 },
});

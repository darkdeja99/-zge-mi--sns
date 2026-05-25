import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  arrayRemove,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from "firebase/firestore";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";
import { Job } from "./jobs";

// Firestore Timestamp'i okunabilir zamana çeviren yardımcı fonksiyon
const formatTimeAgo = (timestamp: any) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Az önce";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  return `${Math.floor(diffInSeconds / 86400)} gün önce`;
};

// React.memo sayesinde listeye dokunulmadığı sürece item'lar tekrar render edilmez
const SavedJobCardItem = memo(
  ({
    item,
    onToggleSave,
  }: {
    item: Job;
    onToggleSave: (id: string) => void;
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
        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={() => onToggleSave(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="bookmark" size={22} color="#4DA8DA" />
          </TouchableOpacity>
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

export default function SavedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
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
        }
      });
      return () => unsubUser();
    }
  }, []);

  useEffect(() => {
    const jobsRef = collection(db, "jobs");
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
    // Yalnızca kullanıcının kaydettiği (savedJobIds içerisinde bulunan) ilanları filtrele
    let filtered = jobs.filter((job) => savedJobIds.includes(job.id));

    if (searchQuery.trim() !== "") {
      const queryStr = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(queryStr) ||
          job.company.toLowerCase().includes(queryStr) ||
          job.location.toLowerCase().includes(queryStr) ||
          (job.type && job.type.toLowerCase().includes(queryStr)) ||
          (job.workModel && job.workModel.toLowerCase().includes(queryStr)),
      );
    }
    return filtered;
  }, [searchQuery, jobs, savedJobIds]);

  // Arama metni değiştiğinde gösterilecek eleman sayısını ilk sayfaya (10) sıfırla
  useEffect(() => {
    setDisplayedCount(10);
  }, [searchQuery]);

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

  const toggleSaveJob = useCallback(async (jobId: string) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    try {
      await updateDoc(userRef, {
        savedJobs: arrayRemove(jobId),
      });
    } catch (error) {
      console.error("İlan kaydedilirken hata:", error);
    }
  }, []);

  const renderJobItem = useCallback(
    ({ item }: { item: Job }) => (
      <SavedJobCardItem item={item} onToggleSave={toggleSaveJob} />
    ),
    [toggleSaveJob],
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
          <Text style={styles.title}>Kaydedilenler</Text>
        </View>

        {savedJobIds.length > 0 && (
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Kaydedilenler arasında ara..."
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
        )}

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
              <Ionicons name="bookmark-outline" size={64} color="#aaa" />
              <Text style={styles.emptyText}>Kaydedilmiş ilan yok.</Text>
              <Text style={styles.emptySubText}>
                İlgilendiğiniz ilanları kaydederek buradan ulaşabilirsiniz.
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
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#fff" },
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
  searchInput: { flex: 1, color: "#fff", paddingVertical: 10, fontSize: 15 },
  clearIcon: { marginLeft: 10, padding: 5 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
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
  jobTitleContainer: { flex: 1, paddingRight: 10 },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  jobCompany: { fontSize: 15, color: "#4DA8DA", fontWeight: "600" },
  iconContainer: { padding: 2 },
  jobDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 15,
  },
  detailItem: { flexDirection: "row", alignItems: "center" },
  detailText: { color: "#ccc", fontSize: 13, marginLeft: 4 },
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
  emptySubText: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
});

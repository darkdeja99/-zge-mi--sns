import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

interface LogData {
  id: string;
  type: "user" | "job";
  originalId: string;
  primaryText: string;
  secondaryText: string;
  reason: string;
  deletedAt: any;
  deletedBy: string;
}

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

export default function Logs() {
  const [userLogs, setUserLogs] = useState<LogData[]>([]);
  const [jobLogs, setJobLogs] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "user" | "job">("all");

  useEffect(() => {
    let usersLoaded = false;
    let jobsLoaded = false;

    const checkLoading = () => {
      if (usersLoaded && jobsLoaded) setLoading(false);
    };

    const qUsers = query(
      collection(db, "deleted_users"),
      orderBy("deletedAt", "desc"),
    );
    const unsubUsers = onSnapshot(
      qUsers,
      (snapshot) => {
        const logs: LogData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          logs.push({
            id: doc.id,
            type: "user",
            originalId: data.originalUserId,
            primaryText: data.name,
            secondaryText: data.email,
            reason: data.reason,
            deletedAt: data.deletedAt,
            deletedBy: data.deletedBy,
          });
        });
        setUserLogs(logs);
        usersLoaded = true;
        checkLoading();
      },
      (error) => {
        console.error("Kullanıcı logları çekilirken hata:", error);
        usersLoaded = true;
        checkLoading();
      },
    );

    const qJobs = query(
      collection(db, "deleted_jobs"),
      orderBy("deletedAt", "desc"),
    );
    const unsubJobs = onSnapshot(
      qJobs,
      (snapshot) => {
        const logs: LogData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          logs.push({
            id: doc.id,
            type: "job",
            originalId: data.originalJobId,
            primaryText: data.title,
            secondaryText: data.company,
            reason: data.reason,
            deletedAt: data.deletedAt,
            deletedBy: data.deletedBy,
          });
        });
        setJobLogs(logs);
        jobsLoaded = true;
        checkLoading();
      },
      (error) => {
        console.error("İlan logları çekilirken hata:", error);
        jobsLoaded = true;
        checkLoading();
      },
    );

    return () => {
      unsubUsers();
      unsubJobs();
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const combined = [...userLogs, ...jobLogs];
    // Birleştirilmiş diziyi tarihe göre sırala
    combined.sort((a, b) => {
      const timeA = a.deletedAt?.toMillis ? a.deletedAt.toMillis() : 0;
      const timeB = b.deletedAt?.toMillis ? b.deletedAt.toMillis() : 0;
      return timeB - timeA;
    });

    if (activeTab === "all") return combined;
    return combined.filter((log) => log.type === activeTab);
  }, [userLogs, jobLogs, activeTab]);

  const renderLogItem = ({ item }: { item: LogData }) => {
    const isUser = item.type === "user";
    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View
            style={[styles.badge, isUser ? styles.badgeUser : styles.badgeJob]}
          >
            <Ionicons
              name={isUser ? "person" : "briefcase"}
              size={14}
              color="#fff"
            />
            <Text style={styles.badgeText}>
              {isUser ? "Kullanıcı" : "İlan"}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTimeAgo(item.deletedAt)}</Text>
        </View>

        <Text style={styles.primaryText}>{item.primaryText}</Text>
        <Text style={styles.secondaryText}>{item.secondaryText}</Text>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Silme Nedeni:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        <Text style={styles.adminIdText}>
          İşlemi yapan admin ID: {item.deletedBy}
        </Text>
      </View>
    );
  };

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
          <Text style={styles.title}>Log Kayıtları</Text>
          <View style={{ width: 34 }} />
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
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "user" && styles.activeTab]}
            onPress={() => setActiveTab("user")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "user" && styles.activeTabText,
              ]}
            >
              Kullanıcılar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "job" && styles.activeTab]}
            onPress={() => setActiveTab("job")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "job" && styles.activeTabText,
              ]}
            >
              İlanlar
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4DA8DA"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={filteredLogs}
            keyExtractor={(item) => item.id + item.type}
            renderItem={renderLogItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="archive-outline" size={48} color="#aaa" />
                <Text style={styles.emptyText}>Kayıtlı log bulunamadı.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: { backgroundColor: "#4DA8DA" },
  tabText: { color: "#aaa", fontWeight: "600", fontSize: 13 },
  activeTabText: { color: "#fff" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  logCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeUser: { backgroundColor: "#ff9800" },
  badgeJob: { backgroundColor: "#28a745" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold", marginLeft: 4 },
  timeText: { fontSize: 12, color: "#888", fontStyle: "italic" },
  primaryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  secondaryText: { fontSize: 14, color: "#ccc", marginBottom: 10 },
  reasonContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonLabel: {
    fontSize: 13,
    color: "#aaa",
    marginBottom: 4,
    fontWeight: "bold",
  },
  reasonText: { fontSize: 14, color: "#fff", lineHeight: 20 },
  adminIdText: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
    textAlign: "right",
  },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#aaa", fontSize: 16, marginTop: 10 },
});

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { collection, getCountFromServer } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        try {
          const usersSnapshot = await getCountFromServer(
            collection(db, "users"),
          );
          setUserCount(usersSnapshot.data().count);

          const jobsSnapshot = await getCountFromServer(collection(db, "jobs"));
          setJobCount(jobsSnapshot.data().count);
        } catch (error) {
          console.error("İstatistikleri çekerken hata oluştu:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }, []),
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
          <Text style={styles.title}>Yönetici Paneli</Text>
          {/* Başlığı ortalamak için boşluk */}
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#4DA8DA"
              style={{ marginTop: 50 }}
            />
          ) : (
            <>
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={32} color="#4DA8DA" />
                  <Text style={styles.statNumber}>
                    {userCount !== null ? userCount : "-"}
                  </Text>
                  <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="briefcase" size={32} color="#28a745" />
                  <Text style={styles.statNumber}>
                    {jobCount !== null ? jobCount : "-"}
                  </Text>
                  <Text style={styles.statLabel}>Aktif İlanlar</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Yönetim Menüsü</Text>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => router.push("/(admin)/manage-users")}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="people-outline" size={24} color="#fff" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Kullanıcı Yönetimi</Text>
                  <Text style={styles.menuSubTitle}>
                    Kullanıcıları görüntüle, ara veya sil
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#555" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => router.push("/(admin)/manage-jobs")}
              >
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: "rgba(40, 167, 69, 0.2)" },
                  ]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={24}
                    color="#28a745"
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>İlan Yönetimi</Text>
                  <Text style={styles.menuSubTitle}>
                    İş ilanlarını denetle ve yönet
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#555" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => router.push("/(admin)/logs")}
              >
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: "rgba(255, 193, 7, 0.2)" },
                  ]}
                >
                  <Ionicons name="archive-outline" size={24} color="#ffc107" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Log Kayıtları</Text>
                  <Text style={styles.menuSubTitle}>
                    Silinen içerikleri ve nedenlerini görüntüle
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#555" />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
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
  title: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  container: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 10,
  },
  statLabel: {
    fontSize: 14,
    color: "#aaa",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    marginLeft: 5,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(77, 168, 218, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  menuSubTitle: {
    fontSize: 13,
    color: "#aaa",
  },
});

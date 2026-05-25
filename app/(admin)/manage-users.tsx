import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";

interface AdminUserData {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  photoURL?: string;
  createdAt?: any;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersList: AdminUserData[] = [];
        snapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() } as AdminUserData);
        });
        setUsers(usersList);
        setFilteredUsers(usersList);
        setLoading(false);
      },
      (error) => {
        console.error("Kullanıcılar çekilirken hata:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(lowerQuery) ||
          u.surname?.toLowerCase().includes(lowerQuery) ||
          u.email?.toLowerCase().includes(lowerQuery),
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const openDeleteModal = (userId: string, userName: string) => {
    if (auth.currentUser?.uid === userId) {
      Alert.alert("Hata", "Kendi hesabınızı silemezsiniz.");
      return;
    }
    setUserToDelete({ id: userId, name: userName });
    setDeleteReason("");
    setDeleteModalVisible(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    if (deleteReason.trim() === "") {
      Alert.alert("Hata", "Lütfen bir silme nedeni belirtin.");
      return;
    }

    try {
      const userData = users.find((u) => u.id === userToDelete.id);

      // Önce log tablosuna kaydediyoruz
      await addDoc(collection(db, "deleted_users"), {
        originalUserId: userToDelete.id,
        name: userToDelete.name,
        email: userData?.email || "Bilinmiyor",
        role: userData?.role || "user",
        reason: deleteReason,
        deletedAt: serverTimestamp(),
        deletedBy: auth.currentUser?.uid || "Bilinmiyor",
      });

      await deleteDoc(doc(db, "users", userToDelete.id));
      Alert.alert("Başarılı", "Kullanıcı profili silindi.");
      setDeleteModalVisible(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Kullanıcı silinirken hata:", error);
      Alert.alert("Hata", "Kullanıcı silinemedi.");
    }
  };

  const renderUserItem = ({ item }: { item: AdminUserData }) => (
    <View style={styles.userCard}>
      <Image
        source={
          item.photoURL
            ? { uri: item.photoURL }
            : require("../../assets/default-avatar.png")
        }
        style={styles.avatar}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.name} {item.surname}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {item.email}
        </Text>
        <View style={styles.roleContainer}>
          <Text
            style={[
              styles.roleText,
              item.role === "admin" && styles.adminRoleText,
            ]}
          >
            {item.role === "admin" ? "Admin" : "Kullanıcı"}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/${item.id}`)}
        >
          <Ionicons name="eye-outline" size={20} color="#4DA8DA" />
        </TouchableOpacity>

        {auth.currentUser?.uid !== item.id && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              openDeleteModal(item.id, `${item.name} ${item.surname}`)
            }
          >
            <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
          </TouchableOpacity>
        )}
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
          <Text style={styles.title}>Kullanıcı Yönetimi</Text>
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
            placeholder="İsim veya e-posta ara..."
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
          <ActivityIndicator
            size="large"
            color="#4DA8DA"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>
            }
          />
        )}
      </SafeAreaView>

      {/* Kullanıcı Silme Modalı */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kullanıcıyı Sil</Text>
            <Text style={styles.modalText}>
              "{userToDelete?.name}" isimli kullanıcının profilini silmek
              üzeresiniz. Lütfen silme nedenini belirtin:
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Silme nedeni (Spam, kural ihlali vb.)"
              placeholderTextColor="#999"
              value={deleteReason}
              onChangeText={setDeleteReason}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteUser}
              >
                <Text style={styles.modalButtonText}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: { fontSize: 13, color: "#aaa", marginBottom: 6 },
  roleContainer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleText: { fontSize: 11, color: "#ddd", fontWeight: "600" },
  adminRoleText: { color: "#ff9800" },
  actionsContainer: { flexDirection: "row", gap: 10 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#162b35",
    borderRadius: 15,
    width: "100%",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 168, 218, 0.4)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  modalText: { fontSize: 14, color: "#ccc", marginBottom: 15, lineHeight: 20 },
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
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  cancelButton: { backgroundColor: "rgba(255, 255, 255, 0.1)" },
  deleteButton: { backgroundColor: "#ff4d4d" },
  modalButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});

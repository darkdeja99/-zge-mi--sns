import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { memo, useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomLoader from "../../components/CustomLoader";
import { auth, db } from "../../firebaseConfig";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  lastMessageSenderId?: string;
  lastMessageRead?: boolean;
}

const ChatItem = memo(
  ({ chat, currentUserId }: { chat: Chat; currentUserId: string }) => {
    const [otherUser, setOtherUser] = useState<any>(null);
    const otherUserId = chat.participants.find((id) => id !== currentUserId);

    useEffect(() => {
      if (!otherUserId) return;
      const fetchUser = async () => {
        const userSnap = await getDoc(doc(db, "users", otherUserId));
        if (userSnap.exists()) {
          setOtherUser(userSnap.data());
        }
      };
      fetchUser();
    }, [otherUserId]);

    const isMyMessage = chat.lastMessageSenderId === currentUserId;
    const isUnread = !isMyMessage && chat.lastMessageRead === false;

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => router.push(`/chat/${chat.id}`)}
      >
        <View style={styles.avatarContainer}>
          {otherUser?.photoURL ? (
            <Image source={{ uri: otherUser.photoURL }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={50} color="#ccc" />
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUser
                ? `${otherUser.name} ${otherUser.surname}`
                : "Yükleniyor..."}
            </Text>
            <Text style={styles.timeText}>
              {chat.lastMessageTime ? formatTimeAgo(chat.lastMessageTime) : ""}
            </Text>
          </View>
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}
          >
            {isMyMessage && chat.lastMessage && (
              <Ionicons
                name={
                  chat.lastMessageRead
                    ? "checkmark-done-outline"
                    : "checkmark-outline"
                }
                size={16}
                color={chat.lastMessageRead ? "#4DA8DA" : "#999"}
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              style={[styles.lastMessage, isUnread && styles.unreadMessageText]}
              numberOfLines={1}
            >
              {chat.lastMessage || "Henüz mesaj yok."}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

export default function MessagesScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeChats: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const chatsRef = collection(db, "chats");
        const q = query(
          chatsRef,
          where("participants", "array-contains", user.uid),
          orderBy("lastMessageTime", "desc"),
        );

        unsubscribeChats = onSnapshot(
          q,
          (snapshot) => {
            const chatsList: Chat[] = [];
            snapshot.forEach((doc) => {
              chatsList.push({ id: doc.id, ...doc.data() } as Chat);
            });
            setChats(chatsList);
            setLoading(false);
          },
          (error) => {
            if (error.code !== "permission-denied") {
              console.error("Sohbetler dinlenirken hata:", error);
            }
            setLoading(false);
          },
        );
      } else {
        if (unsubscribeChats) unsubscribeChats();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeChats) unsubscribeChats();
    };
  }, []);

  if (loading) {
    return <CustomLoader fullScreen text="Sohbetler Yükleniyor..." />;
  }

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Mesajlar</Text>
        </View>

        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatItem chat={item} currentUserId={auth.currentUser?.uid || ""} />
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#aaa" />
              <Text style={styles.emptyText}>Henüz bir sohbetiniz yok.</Text>
              <Text style={styles.emptySubText}>
                İlan detaylarından işverenlere mesaj göndererek sohbete
                başlayabilirsiniz.
              </Text>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  listContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  avatarContainer: { marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  chatInfo: { flex: 1, justifyContent: "center" },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    paddingRight: 10,
  },
  timeText: { color: "#aaa", fontSize: 12 },
  lastMessage: { color: "#ccc", fontSize: 14, flex: 1 },
  unreadMessageText: { color: "#fff", fontWeight: "bold" },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4DA8DA",
    marginLeft: 8,
  },
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

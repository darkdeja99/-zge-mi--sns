import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = auth.currentUser?.uid;

  // Sohbet bilgilerini ve karşı tarafın profilini çek
  useEffect(() => {
    if (!id || !currentUserId) return;
    const fetchChatDetails = async () => {
      const chatDoc = await getDoc(doc(db, "chats", id));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        const otherId = data.participants.find(
          (p: string) => p !== currentUserId,
        );
        if (otherId) {
          const userDoc = await getDoc(doc(db, "users", otherId));
          if (userDoc.exists()) {
            setOtherUser({ id: otherId, ...userDoc.data() });
          }
        }
      }
    };
    fetchChatDetails();
  }, [id, currentUserId]);

  // Mesajları gerçek zamanlı dinle
  useEffect(() => {
    if (!id) return;

    const messagesRef = collection(db, "chats", id, "messages");
    // En yeni mesaj en altta (inverted list) görünmesi için "desc" kullanıyoruz
    const q = query(messagesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleSend = async () => {
    if (!inputText.trim() || !id || !currentUserId) return;

    const textToSend = inputText.trim();
    setInputText(""); // UI'ı anında temizle

    try {
      // Mesajı alt koleksiyona ekle
      await addDoc(collection(db, "chats", id, "messages"), {
        text: textToSend,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
      });

      // Ana sohbet belgesindeki lastMessage bilgisini güncelle
      await updateDoc(doc(db, "chats", id), {
        lastMessage: textToSend,
        lastMessageTime: serverTimestamp(),
      });
    } catch (error) {
      console.error("Mesaj gönderilirken hata:", error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUserId;

    // Optimistic UI için createdAt henüz yoksa saati gizle
    const timeString = item.createdAt
      ? item.createdAt
          .toDate()
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "...";

    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.messageWrapperMe : styles.messageWrapperOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextMe : styles.messageTextOther,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMe ? styles.messageTimeMe : styles.messageTimeOther,
            ]}
          >
            {timeString}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerProfile}
              onPress={() => otherUser && router.push(`/${otherUser.id}`)}
            >
              {otherUser?.photoURL ? (
                <Image
                  source={{ uri: otherUser.photoURL }}
                  style={styles.headerAvatar}
                />
              ) : (
                <Ionicons name="person-circle-outline" size={40} color="#ccc" />
              )}
              <Text style={styles.headerName}>
                {otherUser
                  ? `${otherUser.name} ${otherUser.surname}`
                  : "Yükleniyor..."}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Messages List */}
          {loading ? (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <ActivityIndicator size="large" color="#4DA8DA" />
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              inverted // En alttan başlayıp yukarı doğru sıralanmasını sağlar
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor="#aaa"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color="#fff"
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  backButton: { marginRight: 15 },
  headerProfile: { flexDirection: "row", alignItems: "center", flex: 1 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  messagesList: { padding: 15 },
  messageWrapper: { flexDirection: "row", marginBottom: 15 },
  messageWrapperMe: { justifyContent: "flex-end" },
  messageWrapperOther: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  messageBubbleMe: { backgroundColor: "#4DA8DA", borderBottomRightRadius: 4 },
  messageBubbleOther: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextMe: { color: "#fff" },
  messageTextOther: { color: "#eee" },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  messageTimeMe: { color: "rgba(255,255,255,0.7)" },
  messageTimeOther: { color: "#aaa" },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    paddingHorizontal: 15,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4DA8DA",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { auth, db } from "../firebaseConfig";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

const monthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const formatDateHeader = (d: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (targetDate.getTime() === today.getTime()) return "Bugün";
  if (targetDate.getTime() === yesterday.getTime()) return "Dün";

  let yearStr =
    d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : "";
  return `${d.getDate()} ${monthNames[d.getMonth()]}${yearStr}`;
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = auth.currentUser?.uid;

  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = () => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

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

  useEffect(() => {
    if (!id) return;

    const messagesRef = collection(db, "chats", id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(msgs);
        setLoading(false);
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error("Mesajlar dinlenirken hata:", error);
        }
      },
    );

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!id || !currentUserId) return;
    const chatRef = doc(db, "chats", id);
    const unsubscribe = onSnapshot(
      chatRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (
            data.lastMessageSenderId !== currentUserId &&
            data.lastMessageRead === false
          ) {
            updateDoc(chatRef, { lastMessageRead: true });
          }
        }
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error("Sohbet durumu dinlenirken hata:", error);
        }
      },
    );
    return () => unsubscribe();
  }, [id, currentUserId]);

  const deleteMessage = async (messageId: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, "chats", id, "messages", messageId));
    } catch (error) {
      console.error("Mesaj silinirken hata:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Hata", "Mesaj silinemedi.");
      }
    }
  };

  const handleLongPress = async (item: Message, isMe: boolean) => {
    if (Platform.OS === "web") {
      const action = window.prompt(
        `İşlem seçin:\n1 - Kopyala${isMe ? "\n2 - Sil" : ""}`,
        "1",
      );
      if (action === "1") {
        await Clipboard.setStringAsync(item.text);
        showToast();
      } else if (action === "2" && isMe) {
        const confirm = window.confirm(
          "Mesajı silmek istediğinize emin misiniz?",
        );
        if (confirm) deleteMessage(item.id);
      }
    } else {
      const options: any[] = [
        {
          text: "Kopyala",
          onPress: async () => {
            await Clipboard.setStringAsync(item.text);
            showToast();
          },
        },
      ];

      if (isMe) {
        options.push({
          text: "Sil",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Mesajı Sil",
              "Bu mesajı silmek istediğinize emin misiniz?",
              [
                { text: "İptal", style: "cancel" },
                {
                  text: "Sil",
                  style: "destructive",
                  onPress: () => deleteMessage(item.id),
                },
              ],
            );
          },
        });
      }

      options.push({ text: "İptal", style: "cancel" });
      Alert.alert("Mesaj Seçenekleri", undefined, options);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !id || !currentUserId) return;

    const textToSend = inputText.trim();
    setInputText("");

    try {
      await addDoc(collection(db, "chats", id, "messages"), {
        text: textToSend,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "chats", id), {
        lastMessage: textToSend,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: currentUserId,
        lastMessageRead: false,
      });

      if (otherUser && otherUser.pushToken) {
        const messagePayload = {
          to: otherUser.pushToken,
          sound: "default",
          title: "Yeni Mesaj!",
          body: textToSend,
          data: { chatId: id },
        };
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagePayload),
        });
      }
    } catch (error) {
      console.error("Mesaj gönderilirken hata:", error);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === currentUserId;

    let timeString = "...";
    let showDateHeader = false;
    let dateHeaderText = "";

    if (item.createdAt) {
      const currentMsgDate = item.createdAt.toDate();
      const hours = currentMsgDate.getHours().toString().padStart(2, "0");
      const minutes = currentMsgDate.getMinutes().toString().padStart(2, "0");
      timeString = `${hours}:${minutes}`;

      const olderMsg = messages[index + 1];
      if (!olderMsg || !olderMsg.createdAt) {
        showDateHeader = true;
      } else {
        const olderMsgDate = olderMsg.createdAt.toDate();
        const isSameDay =
          currentMsgDate.getFullYear() === olderMsgDate.getFullYear() &&
          currentMsgDate.getMonth() === olderMsgDate.getMonth() &&
          currentMsgDate.getDate() === olderMsgDate.getDate();

        showDateHeader = !isSameDay;
      }

      if (showDateHeader) {
        dateHeaderText = formatDateHeader(currentMsgDate);
      }
    }

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeaderText}>{dateHeaderText}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageWrapper,
            isMe ? styles.messageWrapperMe : styles.messageWrapperOther,
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => handleLongPress(item, isMe)}
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
          </TouchableOpacity>
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
              inverted
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

        {toastVisible && (
          <Animated.View
            style={[styles.toastContainer, { opacity: toastAnim }]}
          >
            <Ionicons
              name="copy-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.toastText}>Mesaj kopyalandı!</Text>
          </Animated.View>
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
  dateHeaderContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  dateHeaderText: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    color: "#ddd",
    fontSize: 12,
    fontWeight: "bold",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
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
  toastContainer: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1000,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

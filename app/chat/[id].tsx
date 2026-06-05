import { Ionicons } from "@expo/vector-icons";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomLoader from "../../components/CustomLoader";
import { auth, db, storage } from "../../firebaseConfig";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  imageUrl?: string;
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messageLimit, setMessageLimit] = useState(20);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  // sohbet bilgilerini ve karşı tarafın profilini çek
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

  // mesajları gerçek zamanlı dinle
  useEffect(() => {
    if (!id) return;

    const messagesRef = collection(db, "chats", id, "messages");
    // en yeni mesaj en altta (inverted list) görünmesi için "desc" kullanıyoruz
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
  }, [id, messageLimit]);

  const handleSend = async () => {
    if (!inputText.trim() || !id || !currentUserId) return;

    const textToSend = inputText.trim();
    setInputText(""); // UI ı anında temizle

    try {
      // mesajı alt koleksiyona ekle
      await addDoc(collection(db, "chats", id, "messages"), {
        text: textToSend,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
      });

      // ana sohbet belgesindeki lastMessage bilgisini güncelle
      await updateDoc(doc(db, "chats", id), {
        lastMessage: textToSend,
        lastMessageTime: serverTimestamp(),
      });
    } catch (error) {
      console.error("Mesaj gönderilirken hata:", error);
    }
  };

  const handlePickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImageAndSendMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Resim seçilirken hata:", error);
    }
  };

  const uploadImageAndSendMessage = async (uri: string) => {
    if (!id || !currentUserId) return;
    setUploadingImage(true);
    try {
      const blob: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = (e) =>
          reject(new TypeError("Ağ isteği başarısız oldu (Resim yüklenemedi)"));
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      const fileName = `chat_images/${id}/${Date.now()}_${currentUserId}.jpg`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, "chats", id, "messages"), {
        text: "📷 Fotoğraf",
        imageUrl: downloadUrl,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "chats", id), {
        lastMessage: "📷 Fotoğraf",
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: currentUserId,
        lastMessageRead: false,
      });
    } catch (error) {
      console.error("Resim yüklenirken hata:", error);
      Alert.alert("Hata", "Resim gönderilirken bir sorun oluştu.");
    } finally {
      setUploadingImage(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUserId;

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
          {item.imageUrl ? (
            <TouchableOpacity
              onPress={() => setSelectedImage(item.imageUrl as string)}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.messageImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          ) : null}
          {(!item.imageUrl || item.text !== "📷 Fotoğraf") && (
            <Text
              style={[
                styles.messageText,
                isMe ? styles.messageTextMe : styles.messageTextOther,
              ]}
            >
              {item.text}
            </Text>
          )}
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
              <CustomLoader text="Mesajlar Yükleniyor..." />
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              inverted
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (messages.length >= messageLimit) {
                  setMessageLimit((prev) => prev + 20);
                }
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                messages.length >= messageLimit ? (
                  <ActivityIndicator
                    size="small"
                    color="#4DA8DA"
                    style={{ marginVertical: 10 }}
                  />
                ) : null
              }
            />
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handlePickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#4DA8DA" />
              ) : (
                <Ionicons name="image-outline" size={26} color="#aaa" />
              )}
            </TouchableOpacity>
            <TextInput
              style={[styles.textInput, isFocused && styles.textInputFocused]}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor="#aaa"
              value={inputText}
              onChangeText={setInputText}
              multiline
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
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

      {/* Resim Tam Ekran Modalı */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <ReactNativeZoomableView
              maxZoom={3}
              minZoom={1}
              zoomStep={0.5}
              initialZoom={1}
              bindToBorders={true}
              style={{ width: "100%", height: "100%" }}
            >
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                contentFit="contain"
              />
            </ReactNativeZoomableView>
          )}
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
    borderWidth: 1,
    borderColor: "transparent",
  },
  textInputFocused: {
    borderColor: "#4DA8DA",
  },
  attachButton: {
    padding: 8,
    marginRight: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
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
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  closeModalButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 2,
    padding: 10,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";

interface UserData {
  id: string;
  name: string;
  surname: string;
  photoURL?: string;
  location?: string;
  headline?: string;
  birthDate?: string;
  skills?: string[];
  createdAt?: any;
  updatedAt?: any;
}

const calculateAge = (birthDateString: string | undefined) => {
  if (!birthDateString) return null;
  const parts = birthDateString.split("/");

  // Gün/Ay/Yıl formatı için yaş hesabı
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS'de aylar 0'dan başlar
    const year = parseInt(parts[2], 10);
    const birthDate = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  // Eğer önceki sürümdeki gibi sadece "Yıl" (örneğin 1995) verisi geldiyse
  if (parts.length === 1 && birthDateString.length === 4) {
    const year = parseInt(birthDateString, 10);
    const today = new Date();
    return today.getFullYear() - year;
  }
  return null;
};

// React.memo sayesinde listeye dokunulmadığı sürece item'lar tekrar render edilmez
const UserCardItem = memo(({ item }: { item: UserData }) => (
  <Link href={`/${item.id}`} asChild>
    <TouchableOpacity style={styles.userCard}>
      <View style={styles.avatarContainer}>
        <Image
          source={
            item.photoURL
              ? { uri: item.photoURL }
              : require("../../assets/default-avatar.png")
          }
          style={styles.avatar}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
      </View>
      <View style={styles.userInfo}>
        <Text
          style={styles.userName}
          numberOfLines={1}
        >{`${item.name} ${item.surname}`}</Text>
        {item.headline ? (
          <Text style={styles.userHeadline} numberOfLines={1}>
            {item.headline}
          </Text>
        ) : null}
        {item.location ? (
          <Text style={styles.userLocation} numberOfLines={1}>
            <Ionicons name="location-outline" size={14} color="#ccc" />{" "}
            {item.location}
          </Text>
        ) : null}
        {item.skills && item.skills.length > 0 ? (
          <Text style={styles.userSkills} numberOfLines={1}>
            Yetenekler: {item.skills.join(", ")}
          </Text>
        ) : null}
      </View>
      <View style={styles.viewProfileButton}>
        <Text style={styles.viewProfileText}>Profili Gör</Text>
      </View>
    </TouchableOpacity>
  </Link>
));

export default function Home() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [selectedSkillFilters, setSelectedSkillFilters] = useState<string[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        router.replace("/");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Mevcut kullanıcı dışındaki tüm kullanıcıları anlık olarak dinle
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("__name__", "!=", currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const usersList: UserData[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() } as UserData);
        });

        // Kullanıcıları en yeni eklenen/güncellenenden eskiye doğru sırala
        usersList.sort((a, b) => {
          const timeA = a.createdAt?.seconds || a.updatedAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || b.updatedAt?.seconds || 0;
          return timeB - timeA;
        });

        setUsers(usersList);
        setLoading(false);
      },
      (error) => {
        // Çıkış yaparken token silindiği için anlık yetki hatası vermesi normaldir, bunu yoksay
        if (error.code !== "permission-denied") {
          console.error("Kullanıcıları dinlerken hata: ", error);
        }
        setLoading(false);
      },
    );

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [currentUser]);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Metin araması (isim, konum, ünvan, yetenek)
    if (searchQuery !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((user) => {
        const fullName = `${user.name} ${user.surname}`.toLowerCase();
        const location = (user.location || "").toLowerCase();
        const headline = (user.headline || "").toLowerCase();
        const hasSkillMatch = user.skills?.some((skill) =>
          skill.toLowerCase().includes(query),
        );

        if (searchType === "skills") {
          return hasSkillMatch;
        } else if (searchType === "location") {
          return location.includes(query);
        } else if (searchType === "name") {
          return fullName.includes(query);
        } else if (searchType === "headline") {
          return headline.includes(query);
        } else {
          return (
            fullName.includes(query) ||
            location.includes(query) ||
            headline.includes(query) ||
            hasSkillMatch
          );
        }
      });
    }

    // Yetenek çipleri ile filtreleme (Çoklu Seçim)
    if (selectedSkillFilters.length > 0) {
      filtered = filtered.filter((user) => {
        if (!user.skills || user.skills.length === 0) return false;
        // Kullanıcının, seçilen çip yeteneklerinden HEPSİNE sahip olup olmadığını kontrol et
        return selectedSkillFilters.every((selectedSkill) =>
          user.skills!.some(
            (userSkill) =>
              userSkill.toLowerCase() === selectedSkill.toLowerCase(),
          ),
        );
      });
    }

    // Yaş aralığı araması
    if (minAge !== "" || maxAge !== "") {
      const min = minAge !== "" ? parseInt(minAge, 10) : 0;
      const max = maxAge !== "" ? parseInt(maxAge, 10) : 150; // Varsayılan max yaş 150 ayarladık

      filtered = filtered.filter((user) => {
        const age = calculateAge(user.birthDate);
        if (age === null) return false; // Kullanıcının doğum tarihi verisi yoksa yaş filtresine takılmaz
        return age >= min && age <= max;
      });
    }

    return filtered;
  }, [searchQuery, minAge, maxAge, users, searchType, selectedSkillFilters]);

  // Filtreler değiştiğinde gösterilecek eleman sayısını ilk sayfaya (10) sıfırla
  useEffect(() => {
    setDisplayedCount(10);
  }, [searchQuery, minAge, maxAge, searchType, selectedSkillFilters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // onSnapshot zaten gerçek zamanlı güncellemeler sağladığı için,
    // burada sadece kullanıcı deneyimi için yenileme göstergesini
    // kısa bir süre gösterip kapatıyoruz.
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleLoadMore = () => {
    if (displayedCount < filteredUsers.length) {
      setDisplayedCount((prevCount) => prevCount + 10);
    }
  };

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(0, displayedCount);
  }, [filteredUsers, displayedCount]);

  // Kayıtlı olan tüm kullanıcılardan benzersiz yetenekleri çıkart ve sırala
  const availableSkills = Array.from(
    new Set(users.flatMap((user) => user.skills || [])),
  ).sort();

  const renderUserItem = useCallback(
    ({ item }: { item: UserData }) => <UserCardItem item={item} />,
    [],
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
          <Text style={styles.title}>Ana Sayfa</Text>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            {currentUser?.photoURL ? (
              <Image
                source={{ uri: currentUser.photoURL }}
                style={styles.headerAvatar}
                contentFit="cover"
                transition={200}
                cachePolicy="disk"
              />
            ) : (
              <Ionicons name="person-circle-outline" size={36} color="white" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={isSearchFocused ? "#4DA8DA" : "#999"}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="İsim, unvan, konum veya yetenek ara..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  Keyboard.dismiss();
                }}
                style={styles.clearIcon}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.pickerContainer}>
            <Ionicons
              name="filter-outline"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <Picker
              selectedValue={searchType}
              onValueChange={(itemValue) => setSearchType(itemValue)}
              style={styles.picker}
              dropdownIconColor="#999"
            >
              <Picker.Item
                label="Her Yerde Ara"
                value="all"
                color={Platform.OS === "android" ? "#aaa" : undefined}
              />
              <Picker.Item
                label="Sadece İsimlerde"
                value="name"
                color={Platform.OS === "android" ? "#aaa" : undefined}
              />
              <Picker.Item
                label="Sadece Unvanlarda"
                value="headline"
                color={Platform.OS === "android" ? "#aaa" : undefined}
              />
              <Picker.Item
                label="Sadece Konumlarda"
                value="location"
                color={Platform.OS === "android" ? "#aaa" : undefined}
              />
              <Picker.Item
                label="Sadece Yeteneklerde"
                value="skills"
                color={Platform.OS === "android" ? "#aaa" : undefined}
              />
            </Picker>
          </View>
          <View style={styles.ageFilterContainer}>
            <TextInput
              style={styles.ageInput}
              placeholder="Min Yaş"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={minAge}
              onChangeText={setMinAge}
            />
            <Text style={styles.ageFilterSeparator}>-</Text>
            <TextInput
              style={styles.ageInput}
              placeholder="Max Yaş"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={maxAge}
              onChangeText={setMaxAge}
            />
          </View>

          {/* YETENEK ÇİPLERİ (Yatay Scroll) */}
          {availableSkills.length > 0 && (
            <View style={styles.filterChipsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {availableSkills.map((skill) => {
                  const isSelected = selectedSkillFilters.includes(skill);
                  return (
                    <TouchableOpacity
                      key={skill}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipSelected,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedSkillFilters(
                            selectedSkillFilters.filter((s) => s !== skill),
                          );
                        } else {
                          setSelectedSkillFilters([
                            ...selectedSkillFilters,
                            skill,
                          ]);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextSelected,
                        ]}
                      >
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
        <FlatList
          data={paginatedUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          updateCellsBatchingPeriod={50} // Scroll yaparken hücrelerin oluşturulma gecikmesi
          getItemLayout={(_, index) => ({
            length: 110, // userCard yüksekliği ortalama 110px'dir (Yükseklik hesabı atlanarak büyük bir performans sağlanır)
            offset: 110 * index,
            index,
          })}
          removeClippedSubviews={true}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={["#fff", "#4DA8DA"]}
            />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color="#aaa"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>
                Görüntülenecek başka kullanıcı bulunamadı.
              </Text>
            </View>
          }
          ListFooterComponent={
            displayedCount < filteredUsers.length ? (
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
  container: { flex: 1, alignItems: "center", padding: 20 },
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
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 10,
    fontSize: 16,
  },
  clearIcon: {
    marginLeft: 10,
    padding: 5,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 15,
  },
  picker: {
    flex: 1,
    color: "#fff",
    height: Platform.OS === "ios" ? 45 : 55,
  },
  ageFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-between",
  },
  ageInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
  },
  ageFilterSeparator: {
    color: "#999",
    marginHorizontal: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
  filterChipsContainer: {
    marginTop: 15,
    marginHorizontal: -20, // Kenarlara kadar taşması için
    paddingLeft: 20,
  },
  filterChip: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipSelected: {
    backgroundColor: "rgba(77, 168, 218, 0.4)",
    borderColor: "#4DA8DA",
  },
  filterChipText: { color: "#ccc", fontSize: 14 },
  filterChipTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  userCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
    borderRadius: 30,
    backgroundColor: "#fff",
    ...Platform.select({
      web: { boxShadow: "0px 4px 5px rgba(0, 0, 0, 0.3)" },
      default: {
        elevation: 8, // Android için gölge
        shadowColor: "#000", // iOS için gölge
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
    }),
  },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  userInfo: { flex: 1, justifyContent: "center" },
  userName: { color: "#fff", fontSize: 18, fontWeight: "600" },
  userHeadline: {
    color: "#4DA8DA",
    fontSize: 14,
    marginTop: 4,
    fontStyle: "italic",
  },
  userLocation: { color: "#ccc", fontSize: 14, marginTop: 4 },
  userSkills: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyText: { color: "#aaa", textAlign: "center", fontSize: 16 },
  viewProfileButton: {
    backgroundColor: "rgba(77, 168, 218, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  viewProfileText: {
    color: "#4DA8DA",
    fontSize: 12,
    fontWeight: "bold",
  },
});

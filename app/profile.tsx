import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomLoader from "../components/CustomLoader";
import ReadMoreText from "../components/ReadMoreText";
import { auth, db } from "../firebaseConfig";
import { Experience, UserProfileData } from "../types/profile";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    resume: true,
  });

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{
    title: string;
    subtitle?: string;
    date?: string;
    description?: string;
    type: string;
  } | null>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const openExperienceModal = (exp: Experience) => {
    setSelectedDetail({
      title: exp.title,
      subtitle: exp.company,
      date: `${exp.startDate} - ${exp.endDate}`,
      description:
        exp.description || "Bu deneyim için detaylı açıklama eklenmemiş.",
      type: "experience",
    });
    setDetailModalVisible(true);
  };

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });

    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const firestoreUnsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as UserProfileData);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error("Firestore profile snapshot error:", error);
        }
        setUserProfile(null);
        setLoading(false);
      },
    );

    return () => firestoreUnsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    const executeSignOut = async () => {
      try {
        await signOut(auth);

        if (Platform.OS === "web") {
          window.alert("Tekrar görüşmek üzere!");
          router.dismissAll();
          router.replace("/");
        } else {
          Alert.alert("Çıkış Yapıldı", "Tekrar görüşmek üzere!", [
            {
              text: "Tamam",
              onPress: () => {
                router.dismissAll();
                router.replace("/");
              },
            },
          ]);
        }
      } catch (error: any) {
        if (Platform.OS === "web") {
          window.alert("Çıkış Hatası: " + error.message);
        } else {
          Alert.alert("Çıkış Hatası", error.message);
        }
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Çıkış yapmak istediğininze emin misiniz?",
      );
      if (confirmed) {
        executeSignOut();
      }
    } else {
      Alert.alert("Çıkış Yap", "Çıkış yapmak istediğinize emin misiniz?", [
        { text: "İptal", style: "cancel" },
        { text: "Çıkış Yap", style: "destructive", onPress: executeSignOut },
      ]);
    }
  };

  if (loading) {
    return <CustomLoader fullScreen text="Profil Yükleniyor..." />;
  }

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Profilim</Text>
          {user ? (
            <>
              {/* 1. Profil Bilgilerim Bloğu */}
              <View style={styles.profileInfoContainer}>
                <View
                  style={[
                    styles.sectionHeaderContainer,
                    !expandedSections.profile && {
                      borderBottomWidth: 0,
                      paddingBottom: 0,
                      marginBottom: 0,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      left: 5,
                      padding: 5,
                      zIndex: 1,
                    }}
                    onPress={() => toggleSection("profile")}
                  >
                    <Ionicons
                      name={
                        expandedSections.profile ? "chevron-up" : "chevron-down"
                      }
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleSection("profile")}
                  >
                    <Text style={styles.sectionHeaderText}>
                      Profil Bilgilerim
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editIcon}
                    onPress={() => router.push("/edit-profile")}
                  >
                    <Ionicons name="pencil" size={18} color="#4DA8DA" />
                  </TouchableOpacity>
                </View>
                {expandedSections.profile && (
                  <>
                    <Image
                      source={
                        userProfile?.photoURL
                          ? { uri: userProfile.photoURL }
                          : require("../assets/default-avatar.png")
                      }
                      style={styles.avatar}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="disk"
                    />
                    <Text style={styles.name}>
                      {userProfile
                        ? `${userProfile.name} ${userProfile.surname}`
                        : user.displayName || "Kullanıcı Adı"}
                    </Text>

                    {userProfile?.birthDate ? (
                      <Text style={styles.profileDetail}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#ddd"
                        />{" "}
                        {userProfile.birthDate}
                      </Text>
                    ) : null}

                    {userProfile?.gender ? (
                      <Text style={styles.profileDetail}>
                        {userProfile.gender}
                      </Text>
                    ) : null}

                    {userProfile?.location ? (
                      <TouchableOpacity
                        onPress={() => {
                          const query = encodeURIComponent(
                            userProfile.location!,
                          );
                          const url = Platform.select({
                            ios: `maps:0,0?q=${query}`,
                            android: `geo:0,0?q=${query}`,
                            default: `https://www.google.com/maps/search/?api=1&query=${query}`,
                          });
                          Linking.openURL(url as string);
                        }}
                      >
                        <Text style={[styles.location, styles.interactiveText]}>
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color="#4DA8DA"
                          />{" "}
                          {userProfile.location}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {userProfile?.phoneNumber ? (
                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(`tel:${userProfile.phoneNumber}`)
                        }
                      >
                        <Text
                          style={[styles.profileDetail, styles.interactiveText]}
                        >
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color="#4DA8DA"
                          />{" "}
                          {userProfile.phoneNumber}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(
                          `mailto:${userProfile?.email || user.email}`,
                        )
                      }
                    >
                      <Text style={[styles.email, styles.interactiveText]}>
                        <Ionicons
                          name="mail-outline"
                          size={16}
                          color="#4DA8DA"
                        />{" "}
                        {userProfile?.email || user.email}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* 2. Özgeçmiş Bilgilerim Bloğu */}
              <View style={styles.profileInfoContainer}>
                <View
                  style={[
                    styles.sectionHeaderContainer,
                    !expandedSections.resume && {
                      borderBottomWidth: 0,
                      paddingBottom: 0,
                      marginBottom: 0,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      left: 5,
                      padding: 5,
                      zIndex: 1,
                    }}
                    onPress={() => toggleSection("resume")}
                  >
                    <Ionicons
                      name={
                        expandedSections.resume ? "chevron-up" : "chevron-down"
                      }
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleSection("resume")}
                  >
                    <Text style={styles.sectionHeaderText}>
                      Özgeçmiş Bilgilerim
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editIcon}
                    onPress={() => router.push("/my-resume")}
                  >
                    <Ionicons name="pencil" size={18} color="#4DA8DA" />
                  </TouchableOpacity>
                </View>

                {expandedSections.resume && (
                  <>
                    {userProfile?.headline ? (
                      <Text style={styles.headline}>
                        {userProfile.headline}
                      </Text>
                    ) : (
                      <Text style={styles.profileDetail}>
                        Henüz bir ünvan eklemediniz. Düzenlemek için kalem
                        ikonuna tıklayabilirsiniz.
                      </Text>
                    )}

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Eğitim Bilgileri</Text>
                      {!userProfile?.highSchool?.school &&
                      !userProfile?.university?.school &&
                      (!userProfile?.educations ||
                        userProfile.educations.length === 0) ? (
                        <Text style={styles.sectionContent}>
                          Eğitim bilgisi eklenmemiş.
                        </Text>
                      ) : (
                        <>
                          {userProfile?.highSchool?.school ? (
                            <View style={styles.experienceCard}>
                              <View style={styles.languageHeader}>
                                <Ionicons
                                  name="school"
                                  size={18}
                                  color="#4DA8DA"
                                />
                                <Text style={styles.languageTitle}>Lise</Text>
                              </View>
                              <Text style={styles.experienceTitle}>
                                {userProfile.highSchool.school}
                              </Text>
                              {userProfile.highSchool.fieldOfStudy ? (
                                <Text style={styles.experienceCompany}>
                                  Bölüm: {userProfile.highSchool.fieldOfStudy}
                                </Text>
                              ) : null}
                              {userProfile.highSchool.startDate ||
                              userProfile.highSchool.endDate ? (
                                <Text style={styles.experienceDates}>
                                  {`${userProfile.highSchool.startDate || ""} - ${userProfile.highSchool.endDate || ""}`}
                                </Text>
                              ) : null}
                              {userProfile.highSchool.gpa ? (
                                <Text style={styles.experienceDescription}>
                                  Mezuniyet Ortalaması:{" "}
                                  {userProfile.highSchool.gpa}
                                </Text>
                              ) : null}
                            </View>
                          ) : null}

                          {userProfile?.university?.school ? (
                            <View style={styles.experienceCard}>
                              <View style={styles.languageHeader}>
                                <Ionicons
                                  name="school"
                                  size={18}
                                  color="#4DA8DA"
                                />
                                <Text style={styles.languageTitle}>
                                  Üniversite
                                </Text>
                              </View>
                              <Text style={styles.experienceTitle}>
                                {userProfile.university.school}
                              </Text>
                              {userProfile.university.fieldOfStudy ? (
                                <Text style={styles.experienceCompany}>
                                  Bölüm: {userProfile.university.fieldOfStudy}
                                </Text>
                              ) : null}
                              {userProfile.university.startDate ||
                              userProfile.university.endDate ? (
                                <Text style={styles.experienceDates}>
                                  {`${userProfile.university.startDate || ""} - ${userProfile.university.endDate || ""}`}
                                </Text>
                              ) : null}
                              {userProfile.university.gpa ? (
                                <Text style={styles.experienceDescription}>
                                  Mezuniyet Ortalaması:{" "}
                                  {userProfile.university.gpa}
                                </Text>
                              ) : null}
                            </View>
                          ) : null}

                          {!userProfile?.highSchool?.school &&
                          !userProfile?.university?.school &&
                          Array.isArray(userProfile?.educations) &&
                          userProfile.educations.length > 0
                            ? userProfile.educations.map((edu, index) => (
                                <View key={index} style={styles.experienceCard}>
                                  <Text style={styles.experienceTitle}>
                                    {edu.school}
                                  </Text>
                                  <Text style={styles.experienceCompany}>
                                    {edu.degree} - {edu.fieldOfStudy}
                                  </Text>
                                  <Text style={styles.experienceDates}>
                                    {`${edu.startDate} - ${edu.endDate}`}
                                  </Text>
                                </View>
                              ))
                            : null}
                        </>
                      )}
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Yabancı Diller</Text>
                      {userProfile?.languages &&
                      userProfile.languages.length > 0 ? (
                        userProfile.languages.map((lang, index) => (
                          <View key={index} style={styles.experienceCard}>
                            <View style={styles.languageHeader}>
                              <Ionicons
                                name="earth"
                                size={18}
                                color="#4DA8DA"
                              />
                              <Text style={styles.languageTitle}>
                                {lang.language}
                              </Text>
                            </View>
                            <Text style={styles.experienceDescription}>
                              Seviye: {lang.level}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.sectionContent}>
                          Yabancı dil eklenmemiş.
                        </Text>
                      )}
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        Sertifikalar ve Kurslar
                      </Text>
                      {userProfile?.certificates &&
                      userProfile.certificates.length > 0 ? (
                        userProfile.certificates.map((cert, index) => (
                          <View key={index} style={styles.experienceCard}>
                            <View style={styles.languageHeader}>
                              <Ionicons
                                name="ribbon"
                                size={18}
                                color="#FFD700"
                              />
                              <Text style={styles.languageTitle}>
                                {cert.name}
                              </Text>
                            </View>
                            <Text style={styles.experienceCompany}>
                              {cert.issuer}
                            </Text>
                            <Text style={styles.experienceDates}>
                              {cert.year}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.sectionContent}>
                          Sertifika eklenmemiş.
                        </Text>
                      )}
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Yetenekler</Text>
                      <View style={styles.skillsContainer}>
                        {userProfile?.skills &&
                        userProfile.skills.length > 0 ? (
                          userProfile.skills.map((skill: any, index) => {
                            const isObj = typeof skill === "object";
                            const skillName = isObj ? skill.name : skill;
                            const skillLevel = isObj ? skill.level : "Orta";

                            let levelPercent = "60%";
                            if (skillLevel === "Başlangıç")
                              levelPercent = "20%";
                            else if (skillLevel === "Temel")
                              levelPercent = "40%";
                            else if (skillLevel === "İleri")
                              levelPercent = "80%";
                            else if (skillLevel === "Uzman")
                              levelPercent = "100%";

                            return (
                              <View
                                key={index}
                                style={styles.skillProgressContainer}
                              >
                                <View style={styles.skillProgressHeader}>
                                  <Text style={styles.skillProgressName}>
                                    {skillName}
                                  </Text>
                                  <Text style={styles.skillProgressLevel}>
                                    {skillLevel}
                                  </Text>
                                </View>
                                <View style={styles.skillProgressBarBackground}>
                                  <View
                                    style={[
                                      styles.skillProgressBarFill,
                                      { width: levelPercent as any },
                                    ]}
                                  />
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <Text style={styles.sectionContent}>
                            Yetenek eklenmemiş.
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Projeler</Text>
                      {userProfile?.projects &&
                      userProfile.projects.length > 0 ? (
                        userProfile.projects.map((proj, index) => (
                          <View key={index} style={styles.experienceCard}>
                            <View style={styles.languageHeader}>
                              <Ionicons
                                name="folder"
                                size={18}
                                color="#4DA8DA"
                              />
                              <Text style={styles.languageTitle}>
                                {proj.name}
                              </Text>
                            </View>
                            {proj.link ? (
                              <Text style={styles.experienceCompany}>
                                {proj.link}
                              </Text>
                            ) : null}
                            {proj.description ? (
                              <ReadMoreText
                                text={proj.description}
                                style={styles.experienceDescription}
                              />
                            ) : null}
                          </View>
                        ))
                      ) : (
                        <Text style={styles.sectionContent}>
                          Proje eklenmemiş.
                        </Text>
                      )}
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>İş Deneyimi</Text>
                      {userProfile?.experiences &&
                      userProfile.experiences.length > 0 ? (
                        userProfile.experiences.map((exp, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.experienceCard}
                            onPress={() => openExperienceModal(exp)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.experienceTitle}>
                              {exp.title}
                            </Text>
                            <Text style={styles.experienceCompany}>
                              {exp.company}
                            </Text>
                            <Text
                              style={styles.experienceDates}
                            >{`${exp.startDate} - ${exp.endDate}`}</Text>
                            {exp.description ? (
                              <ReadMoreText
                                text={exp.description}
                                style={styles.experienceDescription}
                              />
                            ) : null}
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.sectionContent}>
                          İş deneyimi eklenmemiş.
                        </Text>
                      )}
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Hakkında</Text>
                      {userProfile?.summary ? (
                        <ReadMoreText text={userProfile.summary} />
                      ) : (
                        <Text style={styles.sectionContent}>
                          Bilgi eklenmemiş.
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </View>

              {/* 3. İşlemler / Butonlar Bloğu */}
              <View style={styles.profileInfoContainer}>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionHeaderText}>İşlemler</Text>
                </View>
                <Link href="/edit-profile" asChild>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Profili Düzenle</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/my-resume" asChild>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Özgeçmişi Düzenle</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/settings" asChild>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Ayarlar</Text>
                  </TouchableOpacity>
                </Link>
                <TouchableOpacity
                  style={[styles.button, styles.signOutButton]}
                  onPress={handleSignOut}
                >
                  <Text style={styles.buttonText}>Çıkış Yap</Text>
                </TouchableOpacity>
                {userProfile?.role === "admin" && (
                  <TouchableOpacity
                    style={[styles.button, styles.adminButton]}
                    onPress={() => router.push("/(admin)/dashboard")}
                  >
                    <Text style={styles.buttonText}>Admin Paneli</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={styles.profileInfoContainer}>
              <Text style={styles.name}>Giriş yapmadınız.</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace("/sign-in")}
              >
                <Text style={styles.buttonText}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Detay Modalı */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDetail?.title}</Text>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {selectedDetail?.subtitle && (
                <Text style={styles.modalSubtitle}>
                  {selectedDetail.subtitle}
                </Text>
              )}
              {selectedDetail?.date && (
                <Text style={styles.modalDate}>{selectedDetail.date}</Text>
              )}
              <Text style={styles.modalDescription}>
                {selectedDetail?.description}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#0f2027",
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    paddingTop: 80,
    paddingBottom: 50,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    ...Platform.select({
      web: { textShadow: "-1px 1px 10px rgba(0, 0, 0, 0.75)" },
      default: {
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
      },
    }),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfoContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    maxWidth: Math.min(450, width * 0.9),
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  sectionHeaderContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    paddingBottom: 10,
    marginBottom: 15,
    position: "relative",
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  editIcon: {
    position: "absolute",
    right: 5,
    padding: 5,
  },
  headline: {
    fontSize: 16,
    color: "#ccc",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
  },
  location: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 8,
  },
  interactiveText: {
    color: "#4DA8DA",
  },
  email: {
    fontSize: 16,
    color: "#ddd",
    marginBottom: 10,
    textAlign: "center",
  },
  section: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  sectionContent: { fontSize: 16, color: "#ddd" },
  readMoreText: {
    color: "#4DA8DA",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  skillsContainer: {
    flexDirection: "column",
    gap: 15,
    marginTop: 10,
  },
  skillProgressContainer: {
    width: "100%",
  },
  skillProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: "center",
  },
  skillProgressName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  skillProgressLevel: {
    color: "#4DA8DA",
    fontSize: 13,
    fontWeight: "bold",
  },
  skillProgressBarBackground: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  skillProgressBarFill: {
    height: "100%",
    backgroundColor: "#4DA8DA",
    borderRadius: 3,
  },
  experienceCard: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
  },
  experienceTitle: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  experienceCompany: { fontSize: 15, color: "#ccc", fontStyle: "italic" },
  experienceDates: { fontSize: 14, color: "#aaa", marginVertical: 4 },
  experienceDescription: { fontSize: 14, color: "#ddd", marginTop: 4 },
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  signOutButton: {
    backgroundColor: "#d9534f",
  },
  adminButton: {
    backgroundColor: "#ff9800",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    maxHeight: "80%",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 168, 218, 0.4)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    paddingRight: 10,
  },
  modalCloseButton: {
    padding: 2,
  },
  modalScroll: {
    marginTop: 5,
  },
  modalSubtitle: {
    fontSize: 18,
    color: "#4DA8DA",
    fontWeight: "600",
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 15,
    fontStyle: "italic",
  },
  modalDescription: {
    fontSize: 16,
    color: "#ddd",
    lineHeight: 24,
  },
});

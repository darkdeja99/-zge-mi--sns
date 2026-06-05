import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomLoader from "../components/CustomLoader";
import ReadMoreText from "../components/ReadMoreText";
import { db } from "../firebaseConfig";
import { Experience, ResumeData, UserProfileData } from "../types/profile";

// uygulamanın kök adresi
const APP_BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL || "https://ozgecmis-sns.web.app";

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userJobs, setUserJobs] = useState<any[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{
    title: string;
    subtitle?: string;
    date?: string;
    description?: string;
    type: string;
  } | null>(null);

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
    const fetchUserJobs = async () => {
      if (!id) return;
      setJobsError(null);
      try {
        const q = query(
          collection(db, "jobs"),
          where("employerId", "==", id as string),
        );
        const querySnapshot = await getDocs(q);
        const jobsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserJobs(jobsList);
      } catch (error) {
        console.error("Kullanıcının ilanları çekilirken hata:", error);
        setJobsError("İlanlar yüklenirken bir sorun oluştu.");
      }
    };

    fetchUserJobs();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const userDocRef = doc(db, "users", id as string);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setProfile(data as UserProfileData);

          const hasResumeData =
            data.summary !== undefined ||
            data.skills !== undefined ||
            data.experiences !== undefined ||
            data.educations !== undefined ||
            data.highSchool !== undefined ||
            data.university !== undefined ||
            data.languages !== undefined ||
            data.certificates !== undefined ||
            data.projects !== undefined;

          if (hasResumeData) {
            setResume(data as ResumeData);
          }
        }
      } catch (error) {
        console.error("Kullanıcı verilerini çekerken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${profile?.name} ${profile?.surname} adlı kullanıcının Özgeçmiş-SNS profiline göz at!\nProfil Linki: ${APP_BASE_URL}/${id as string}`,
      });
    } catch (error: any) {
      Alert.alert("Paylaşım Hatası", error.message);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Roboto', sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.5; background-color: #fff; }
              .container { max-width: 800px; margin: 0 auto; padding: 40px; }
              .header { display: flex; align-items: center; gap: 25px; border-bottom: 3px solid #4DA8DA; padding-bottom: 20px; margin-bottom: 30px; }
              .header-info { flex: 1; }
              .header-avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #4DA8DA; }
              .name { font-size: 36px; font-weight: 700; color: #2c3e50; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }
              .headline { font-size: 18px; font-weight: 400; color: #4DA8DA; margin: 0 0 15px 0; }
              .contact-info { display: flex; flex-wrap: wrap; gap: 15px; font-size: 13px; color: #555; }
              .contact-item { display: flex; align-items: center; gap: 5px; }
              .section { margin-bottom: 25px; }
              .section-title { font-size: 18px; font-weight: 700; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
              .item { margin-bottom: 15px; page-break-inside: avoid; }
              .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
              .item-title { font-weight: 700; font-size: 16px; color: #333; }
              .item-date { font-size: 13px; color: #888; font-style: italic; }
              .item-subtitle { font-size: 14px; font-weight: 700; color: #4DA8DA; margin-bottom: 5px; }
              .item-desc { font-size: 13px; color: #555; margin: 0; text-align: justify; }
              .skills-container { display: flex; flex-wrap: wrap; gap: 8px; }
              .skill-badge { background-color: #f0f4f8; color: #2c3e50; border: 1px solid #4DA8DA; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; }
              .grid-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              a { color: #4DA8DA; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                ${profile?.photoURL ? `<img src="${profile.photoURL}" class="header-avatar" />` : ""}
                <div class="header-info">
                  <h1 class="name">${profile?.name} ${profile?.surname}</h1>
                  ${profile?.headline ? `<p class="headline">${profile.headline}</p>` : ""}
                  <div class="contact-info">
                    ${profile?.email ? `<span class="contact-item">✉ ${profile.email}</span>` : ""}
                    ${profile?.phoneNumber ? `<span class="contact-item">☏ ${profile.phoneNumber}</span>` : ""}
                    ${profile?.location ? `<span class="contact-item">📍 ${profile.location}</span>` : ""}
                  </div>
                </div>
              </div>

              ${
                resume?.summary
                  ? `<div class="section">
                      <h2 class="section-title">Hakkında</h2>
                      <p class="item-desc">${resume.summary}</p>
                    </div>`
                  : ""
              }

              ${
                resume?.experiences && resume.experiences.length > 0
                  ? `<div class="section">
                      <h2 class="section-title">İş Deneyimi</h2>
                      ${resume.experiences
                        .map(
                          (exp) => `
                        <div class="item">
                          <div class="item-header">
                            <div class="item-title">${exp.title}</div>
                            <div class="item-date">${exp.startDate || ""} - ${exp.endDate || ""}</div>
                          </div>
                          <div class="item-subtitle">${exp.company}</div>
                          ${exp.description ? `<p class="item-desc">${exp.description}</p>` : ""}
                        </div>`,
                        )
                        .join("")}
                    </div>`
                  : ""
              }

              ${
                resume?.university?.school ||
                resume?.highSchool?.school ||
                (resume?.educations && resume.educations.length > 0)
                  ? `<div class="section">
                      <h2 class="section-title">Eğitim Bilgileri</h2>
                      ${
                        resume?.university?.school
                          ? `
                        <div class="item">
                          <div class="item-header">
                            <div class="item-title">${resume.university.school}</div>
                            <div class="item-date">${resume.university.startDate || ""} - ${resume.university.endDate || ""}</div>
                          </div>
                          <div class="item-subtitle">Üniversite | ${resume.university.fieldOfStudy || ""}</div>
                          ${resume.university.gpa ? `<p class="item-desc">Mezuniyet Ortalaması: ${resume.university.gpa}</p>` : ""}
                        </div>
                      `
                          : ""
                      }
                      ${
                        resume?.highSchool?.school
                          ? `
                        <div class="item">
                          <div class="item-header">
                            <div class="item-title">${resume.highSchool.school}</div>
                            <div class="item-date">${resume.highSchool.startDate || ""} - ${resume.highSchool.endDate || ""}</div>
                          </div>
                          <div class="item-subtitle">Lise | ${resume.highSchool.fieldOfStudy || ""}</div>
                          ${resume.highSchool.gpa ? `<p class="item-desc">Mezuniyet Ortalaması: ${resume.highSchool.gpa}</p>` : ""}
                        </div>
                      `
                          : ""
                      }
                      ${
                        !resume?.university?.school &&
                        !resume?.highSchool?.school &&
                        resume?.educations &&
                        resume.educations.length > 0
                          ? resume.educations
                              .map(
                                (edu) => `
                        <div class="item">
                          <div class="item-header">
                            <div class="item-title">${edu.school}</div>
                            <div class="item-date">${edu.startDate || ""} - ${edu.endDate || ""}</div>
                          </div>
                          <div class="item-subtitle">${edu.degree || ""} ${edu.fieldOfStudy || ""}</div>
                        </div>
                      `,
                              )
                              .join("")
                          : ""
                      }
                    </div>`
                  : ""
              }

              <div class="grid-section">
                ${
                  resume?.skills && resume.skills.length > 0
                    ? `<div class="section">
                        <h2 class="section-title">Yetenekler</h2>
                        <div class="skills-container">
                          ${resume.skills
                            .map((skill: any) => {
                              const isObj = typeof skill === "object";
                              const skillName = isObj ? skill.name : skill;
                              const skillLevel =
                                isObj && skill.level ? ` (${skill.level})` : "";
                              return `<span class="skill-badge">${skillName}${skillLevel}</span>`;
                            })
                            .join("")}
                        </div>
                      </div>`
                    : ""
                }

                ${
                  resume?.languages && resume.languages.length > 0
                    ? `<div class="section">
                        <h2 class="section-title">Yabancı Diller</h2>
                        ${resume.languages
                          .map(
                            (lang) => `
                          <div class="item" style="margin-bottom: 8px;">
                            <div class="item-title" style="font-size: 14px;">${lang.language} <span style="font-weight:normal; color:#666; font-size:13px;">- ${lang.level}</span></div>
                          </div>
                        `,
                          )
                          .join("")}
                      </div>`
                    : ""
                }
              </div>

              ${
                resume?.certificates && resume.certificates.length > 0
                  ? `<div class="section">
                      <h2 class="section-title">Sertifikalar ve Kurslar</h2>
                      ${resume.certificates
                        .map(
                          (cert) => `
                        <div class="item" style="margin-bottom: 10px;">
                          <div class="item-header">
                            <div class="item-title" style="font-size: 14px;">${cert.name}</div>
                            <div class="item-date">${cert.year || ""}</div>
                          </div>
                          <div class="item-desc">${cert.issuer}</div>
                        </div>
                      `,
                        )
                        .join("")}
                    </div>`
                  : ""
              }

              ${
                resume?.projects && resume.projects.length > 0
                  ? `<div class="section">
                      <h2 class="section-title">Projeler</h2>
                      ${resume.projects
                        .map(
                          (proj) => `
                        <div class="item">
                          <div class="item-title">${proj.name} ${proj.link ? `<a href="${proj.link}" style="font-size:12px; font-weight:normal;">(Bağlantıya Git)</a>` : ""}</div>
                          ${proj.description ? `<p class="item-desc">${proj.description}</p>` : ""}
                        </div>
                      `,
                        )
                        .join("")}
                    </div>`
                  : ""
              }
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Kişinin ad ve soyadına göre dosya adı oluştur (Boşlukları alt tire ile değiştir)
      const fileName =
        profile?.name && profile?.surname
          ? `${profile.name}_${profile.surname}_CV`.replace(/\s+/g, "_")
          : "Ozgecmis";

      // TypeScript'in yanıltıcı hatasını atlamak için as any kullanıyoruz
      const cacheDir = (FileSystem as any).cacheDirectory;
      const newUri = `${cacheDir}${fileName}.pdf`;

      // Oluşturulan rastgele isimli PDF'i yeni ismine taşıyoruz
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      await Sharing.shareAsync(newUri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: `${fileName}.pdf Dosyasını Paylaş`,
      });
    } catch (error: any) {
      Alert.alert("PDF Hatası", "Özgeçmiş PDF olarak oluşturulamadı.");
    }
  };

  if (loading) {
    return <CustomLoader fullScreen text="Kullanıcı Profili Yükleniyor..." />;
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: "center" }]}>
          <Text style={styles.name}>Kullanıcı bulunamadı.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPDF}>
          <Ionicons name="document-text-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color="white" />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.container}>
          {(userJobs.length > 0 || jobsError) && (
            <View style={styles.jobsSection}>
              <Text style={styles.sectionTitle}>Verdiği İş İlanları</Text>
              {jobsError ? (
                <Text style={styles.errorText}>{jobsError}</Text>
              ) : (
                userJobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    style={styles.jobCard}
                    onPress={() => router.push(`/job-details/${job.id}`)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobTitle} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <Text style={styles.jobCompany} numberOfLines={1}>
                        {job.company}
                      </Text>
                    </View>
                    <Text style={styles.jobLocation}>{job.location}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#aaa"
                      style={{ marginLeft: 5 }}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <Image
            source={
              profile.photoURL
                ? { uri: profile.photoURL }
                : require("../assets/default-avatar.png")
            }
            style={styles.avatar}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
          />
          <Text
            style={styles.name}
          >{`${profile.name} ${profile.surname}`}</Text>

          {profile.birthDate ? (
            <Text style={styles.profileDetail}>
              <Ionicons name="calendar-outline" size={16} color="#ddd" />{" "}
              {profile.birthDate}
            </Text>
          ) : null}

          {profile.gender ? (
            <Text style={styles.profileDetail}>{profile.gender}</Text>
          ) : null}

          {profile.phoneNumber ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${profile.phoneNumber}`)}
            >
              <Text style={[styles.profileDetail, styles.interactiveText]}>
                <Ionicons name="call-outline" size={16} color="#4DA8DA" />{" "}
                {profile.phoneNumber}
              </Text>
            </TouchableOpacity>
          ) : null}

          {profile.email ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`mailto:${profile.email}`)}
            >
              <Text style={[styles.profileDetail, styles.interactiveText]}>
                <Ionicons name="mail-outline" size={16} color="#4DA8DA" />{" "}
                {profile.email}
              </Text>
            </TouchableOpacity>
          ) : null}

          {profile.location ? (
            <TouchableOpacity
              onPress={() => {
                const query = encodeURIComponent(profile.location!);
                const url = Platform.select({
                  ios: `maps:0,0?q=${query}`,
                  android: `geo:0,0?q=${query}`,
                  default: `https://www.google.com/maps/search/?api=1&query=${query}`,
                });
                Linking.openURL(url as string);
              }}
            >
              <Text style={[styles.location, styles.interactiveText]}>
                <Ionicons name="location-outline" size={16} color="#4DA8DA" />{" "}
                {profile.location}
              </Text>
            </TouchableOpacity>
          ) : null}

          {profile.headline ? (
            <Text style={styles.headline}>{profile.headline}</Text>
          ) : null}

          {resume ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Eğitim Bilgileri</Text>
                {!resume.highSchool?.school &&
                !resume.university?.school &&
                (!resume.educations || resume.educations.length === 0) ? (
                  <Text style={styles.sectionContent}>
                    Eğitim bilgisi eklenmemiş.
                  </Text>
                ) : (
                  <>
                    {resume.highSchool?.school ? (
                      <View style={styles.experienceCard}>
                        <View style={styles.languageHeader}>
                          <Ionicons name="school" size={18} color="#4DA8DA" />
                          <Text style={styles.languageTitle}>Lise</Text>
                        </View>
                        <Text style={styles.experienceTitle}>
                          {resume.highSchool.school}
                        </Text>
                        {resume.highSchool.fieldOfStudy ? (
                          <Text style={styles.experienceCompany}>
                            Bölüm: {resume.highSchool.fieldOfStudy}
                          </Text>
                        ) : null}
                        {resume.highSchool.startDate ||
                        resume.highSchool.endDate ? (
                          <Text style={styles.experienceDates}>
                            {`${resume.highSchool.startDate || ""} - ${resume.highSchool.endDate || ""}`}
                          </Text>
                        ) : null}
                        {resume.highSchool.gpa ? (
                          <Text style={styles.experienceDescription}>
                            Mezuniyet Ortalaması: {resume.highSchool.gpa}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}

                    {resume.university?.school ? (
                      <View style={styles.experienceCard}>
                        <View style={styles.languageHeader}>
                          <Ionicons name="school" size={18} color="#4DA8DA" />
                          <Text style={styles.languageTitle}>Üniversite</Text>
                        </View>
                        <Text style={styles.experienceTitle}>
                          {resume.university.school}
                        </Text>
                        {resume.university.fieldOfStudy ? (
                          <Text style={styles.experienceCompany}>
                            Bölüm: {resume.university.fieldOfStudy}
                          </Text>
                        ) : null}
                        {resume.university.startDate ||
                        resume.university.endDate ? (
                          <Text style={styles.experienceDates}>
                            {`${resume.university.startDate || ""} - ${resume.university.endDate || ""}`}
                          </Text>
                        ) : null}
                        {resume.university.gpa ? (
                          <Text style={styles.experienceDescription}>
                            Mezuniyet Ortalaması: {resume.university.gpa}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}

                    {!resume.highSchool?.school &&
                    !resume.university?.school &&
                    Array.isArray(resume?.educations) &&
                    resume.educations.length > 0
                      ? resume.educations.map((edu, index) => (
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
                {resume.languages && resume.languages.length > 0 ? (
                  resume.languages.map((lang, index) => (
                    <View key={index} style={styles.experienceCard}>
                      <View style={styles.languageHeader}>
                        <Ionicons name="earth" size={18} color="#4DA8DA" />
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
                <Text style={styles.sectionTitle}>Sertifikalar ve Kurslar</Text>
                {resume.certificates && resume.certificates.length > 0 ? (
                  resume.certificates.map((cert, index) => (
                    <View key={index} style={styles.experienceCard}>
                      <View style={styles.languageHeader}>
                        <Ionicons name="ribbon" size={18} color="#FFD700" />
                        <Text style={styles.languageTitle}>{cert.name}</Text>
                      </View>
                      <Text style={styles.experienceCompany}>
                        {cert.issuer}
                      </Text>
                      <Text style={styles.experienceDates}>{cert.year}</Text>
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
                  {resume.skills && resume.skills.length > 0 ? (
                    resume.skills.map((skill: any, index) => {
                      const skillName =
                        typeof skill === "object" ? skill.name : skill;
                      const skillLevel =
                        typeof skill === "object" && skill.level
                          ? ` - ${skill.level}`
                          : "";
                      return (
                        <View key={index} style={styles.skillBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#fff"
                          />
                          <Text style={[styles.skillText, { marginLeft: 4 }]}>
                            {skillName}
                            {skillLevel}
                          </Text>
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
                {resume.projects && resume.projects.length > 0 ? (
                  resume.projects.map((proj, index) => (
                    <View key={index} style={styles.experienceCard}>
                      <View style={styles.languageHeader}>
                        <Ionicons name="folder" size={18} color="#4DA8DA" />
                        <Text style={styles.languageTitle}>{proj.name}</Text>
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
                  <Text style={styles.sectionContent}>Proje eklenmemiş.</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>İş Deneyimi</Text>
                {resume.experiences && resume.experiences.length > 0 ? (
                  resume.experiences.map((exp, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.experienceCard}
                      onPress={() => openExperienceModal(exp)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.experienceTitle}>{exp.title}</Text>
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
                {resume.summary ? (
                  <ReadMoreText text={resume.summary} />
                ) : (
                  <Text style={styles.sectionContent}>Bilgi eklenmemiş.</Text>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.sectionContent}>
              Bu kullanıcı henüz bir özgeçmiş oluşturmamış.
            </Text>
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

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#0f2027" },
  safeArea: { flex: 1 },
  container: { alignItems: "center", padding: 20, paddingTop: 60 },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 5,
  },
  pdfButton: {
    position: "absolute",
    top: 40,
    right: 65,
    zIndex: 1,
    padding: 5,
  },
  shareButton: {
    position: "absolute",
    top: 40,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 20 },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  headline: {
    fontSize: 18,
    color: "#ccc",
    fontStyle: "italic",
    marginBottom: 10,
    marginTop: -15,
    textAlign: "center",
  },
  location: {
    fontSize: 16,
    color: "#ddd",
    marginBottom: 20,
    textAlign: "center",
  },
  profileDetail: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 10,
  },
  interactiveText: {
    color: "#4DA8DA",
  },
  section: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
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
  skillsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skillBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  skillText: { color: "#fff", fontSize: 14 },
  experienceCard: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
  },
  experienceTitle: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  experienceCompany: { fontSize: 15, color: "#ccc", fontStyle: "italic" },
  experienceDates: { fontSize: 14, color: "#aaa", marginVertical: 4 },
  experienceDescription: { fontSize: 14, color: "#ddd" },
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
  jobsSection: {
    marginTop: 25,
    paddingHorizontal: 20,
    width: "100%",
  },
  jobCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  jobCompany: {
    fontSize: 14,
    color: "#4DA8DA",
    marginTop: 4,
  },
  jobLocation: {
    fontSize: 12,
    color: "#aaa",
    marginLeft: 10,
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
  errorText: {
    color: "#ff4d4d",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 5,
  },
});

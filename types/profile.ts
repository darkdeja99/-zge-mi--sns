export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface EducationInfo {
  school: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa: string;
  degree?: string; // Eski özgeçmiş verilerindeki uyumluluk için eklendi
}

export interface Language {
  language: string;
  level: string;
}

export interface Certificate {
  name: string;
  issuer: string;
  year: string;
}

export interface Project {
  name: string;
  link?: string;
  description: string;
}

export interface UserProfileData {
  name: string;
  surname: string;
  email?: string;
  photoURL?: string;
  headline?: string;
  location?: string;
  gender?: string;
  birthDate?: string;
  phoneNumber?: string;
  summary?: string;
  skills?: string[];
  experiences?: Experience[];
  educations?: EducationInfo[];
  highSchool?: EducationInfo;
  university?: EducationInfo;
  languages?: Language[];
  certificates?: Certificate[];
  projects?: Project[];
  role?: string;
}

export interface ResumeData {
  summary?: string;
  skills?: string[];
  experiences?: Experience[];
  educations?: EducationInfo[];
  highSchool?: EducationInfo;
  university?: EducationInfo;
  languages?: Language[];
  certificates?: Certificate[];
  projects?: Project[];
}

export type ApplicationStatus = 'Saved' | 'Applied' | 'Interview' | 'Rejected' | 'Offer' | 'Expired';

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface ParsedResume {
  skills: string[];
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    graduationYear: string;
  }[];
}

export interface JobMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendation: string;
}

export interface JobDTO {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  source: string;
  jobUrl: string;
  companyUrl: string | null;
  datePosted: Date | null;
  scrapedAt: Date;
  createdAt: Date;
  matchScore?: number | null;
  matchDetails?: JobMatchResult | null;
}

export interface ApplicationDTO {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  job: JobDTO;
}

export interface ScreeningAnswerDTO {
  id: string;
  applicationId: string;
  question: string;
  answer: string;
  createdAt: Date;
}

export interface DashboardStats {
  jobsScraped: number;
  jobsMatched: number;
  applicationsSent: number;
  interviewRate: number;
  offerRate: number;
  statusCounts: {
    Saved: number;
    Applied: number;
    Interview: number;
    Rejected: number;
    Offer: number;
    Expired: number;
  };
}

export interface AutoFillProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl?: string;
  yearsOfExperience: number;
  desiredSalary?: string;
  noticePeriod?: string;
}

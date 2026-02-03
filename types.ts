
export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface LinkItem {
  id: string;
  title: string;
  url: string;
}

export interface ImageItem {
  id: string;
  url: string; // Base64 string
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
  isCompleted: boolean;
  priority?: PriorityLevel;
  deadline?: string;
  link?: string; // Legacy support
  links?: LinkItem[]; // New multiple links support
  images?: ImageItem[]; // Image attachments
  note?: string; // Markdown note content
}

export interface Subject {
  id: string;
  title: string;
  color: string; // Tailwind color class prefix (e.g., 'blue')
  topics: Topic[];
}

export interface Exam {
  id: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  ayahs: number;
}

export interface QuranNote {
  id: string; // Will match the Surah number (e.g., "1", "114")
  content: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  content: string;
  updatedAt: string;
}

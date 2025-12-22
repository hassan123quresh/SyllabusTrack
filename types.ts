
export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface Topic {
  id: string;
  name: string;
  isCompleted: boolean;
  priority?: PriorityLevel;
  deadline?: string;
  link?: string;
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

export interface Resource {
  id: string; // This will match the subjectId
  content: string; // HTML string
  updatedAt: string;
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

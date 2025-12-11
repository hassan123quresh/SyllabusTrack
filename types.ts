
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

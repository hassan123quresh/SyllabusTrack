
import { Subject, Exam } from './types';

// Helper to get a future date
const getFutureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Helper to construct exam dates for current/next year
const getExamDate = (month: number, day: number) => {
  const now = new Date();
  let year = now.getFullYear();
  // If the month has already passed this year, assume it's for next year
  // Month is 0-indexed (0 = Jan, 11 = Dec)
  if (now.getMonth() > month || (now.getMonth() === month && now.getDate() > day)) {
     year += 1;
  }
  // Construct date string YYYY-MM-DD
  const date = new Date(year, month, day);
  // Handle timezone offset to ensure string is correct
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset*60*1000));
  return adjustedDate.toISOString().split('T')[0];
};

export const INITIAL_EXAMS: Exam[] = [
  { id: 'ex-1', subject: 'Introduction to OOP', date: getExamDate(11, 15), time: '1:00 PM - 4:00 PM' },
  { id: 'ex-2', subject: 'Microeconomics', date: getExamDate(11, 17), time: '1:00 PM - 4:00 PM' },
  { id: 'ex-3', subject: 'Financial Accounting', date: getExamDate(11, 20), time: '1:00 PM - 4:00 PM' },
  { id: 'ex-4', subject: 'Civics & Community Engagement', date: getExamDate(11, 26), time: '1:00 PM - 4:00 PM' },
  { id: 'ex-5', subject: 'Pakistan Studies', date: getExamDate(11, 29), time: '9:00 AM - 12:00 PM' },
  { id: 'ex-6', subject: 'Business Maths-II', date: getExamDate(0, 2), time: '9:00 AM - 12:00 PM' },
];

export const INITIAL_SYLLABUS: Subject[] = [
  {
    id: 'accounting',
    title: 'Financial Accounting',
    color: '#3b82f6', // blue-500
    topics: [
      { id: 'acc-1', name: 'Income statement', isCompleted: false, priority: 'High', deadline: getFutureDate(2) },
      { id: 'acc-2', name: 'Balance sheet', isCompleted: false, priority: 'High', deadline: getFutureDate(5) },
      { id: 'acc-3', name: 'Socie', isCompleted: false, priority: 'Medium' },
      { id: 'acc-4', name: 'Cash flow statement', isCompleted: false, priority: 'Medium' },
      { id: 'acc-5', name: 'Ratios', isCompleted: false, priority: 'Low' },
      { id: 'acc-6', name: 'Partnerships', isCompleted: false, priority: 'Low' },
    ],
  },
  {
    id: 'oop',
    title: 'Introduction to OOP',
    color: '#8b5cf6', // violet-500
    topics: [
      { id: 'oop-1', name: 'Aggregation', isCompleted: false, priority: 'Medium' },
      { id: 'oop-2', name: 'Composition', isCompleted: false, priority: 'Medium' },
      { id: 'oop-3', name: 'Association', isCompleted: false, priority: 'Low' },
      { id: 'oop-4', name: 'Operator overloading', isCompleted: false, priority: 'High', deadline: getFutureDate(3) },
      { id: 'oop-5', name: 'File handling (CSV, txt)', isCompleted: false, priority: 'High', deadline: getFutureDate(7) },
      { id: 'oop-6', name: 'Exception handling', isCompleted: false, priority: 'Medium' },
      { id: 'oop-7', name: 'Abstraction handling', isCompleted: false, priority: 'Medium' },
      { id: 'oop-8', name: 'UML (complete)', isCompleted: false, priority: 'Low' },
    ],
  },
  {
    id: 'maths',
    title: 'Business Maths-II',
    color: '#ef4444', // red-500
    topics: [
      { id: 'math-1', name: 'Integration', isCompleted: false, priority: 'High', deadline: getFutureDate(10) },
      { id: 'math-2', name: 'Derivative', isCompleted: false, priority: 'High', deadline: getFutureDate(12) },
      { id: 'math-3', name: 'Simplex method', isCompleted: false, priority: 'Low' },
    ],
  },
  {
    id: 'micro',
    title: 'Microeconomics',
    color: '#f59e0b', // amber-500
    topics: [
      { id: 'micro-1', name: 'Chapter 21', isCompleted: false, priority: 'Medium' },
    ],
  },
  {
    id: 'civics',
    title: 'Civics & Community Engagement',
    color: '#10b981', // emerald-500
    topics: [
      { id: 'civics-1', name: 'Chapter 10', isCompleted: false, priority: 'Low' },
    ],
  },
  {
    id: 'pak-study',
    title: 'Pakistan Studies',
    color: '#14b8a6', // teal-500
    topics: [
      { id: 'pak-1', name: 'Chapter 12', isCompleted: false, priority: 'Low' },
    ],
  },
];

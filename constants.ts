
import { Subject, Exam, Surah } from './types';

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
  { id: 'ex-1', subject: 'Business Finance', date: getExamDate(11, 15), time: '1:00 PM - 4:00 PM' },
  { id: 'ex-2', subject: 'Data Analysis II', date: getExamDate(11, 17), time: '1:00 PM - 4:00 PM' },
  { id: 'ex-3', subject: 'Intro to DB Systems', date: getExamDate(11, 20), time: '1:00 PM - 4:00 PM' },
  { id: 'ex-4', subject: 'Ideology of Pakistan', date: getExamDate(11, 26), time: '1:00 PM - 4:00 PM' },
  { id: 'ex-5', subject: 'Environmental Science', date: getExamDate(11, 29), time: '9:00 AM - 12:00 PM' },
];

export const INITIAL_SYLLABUS: Subject[] = [
  {
    id: 'bus-fin',
    title: 'Business Finance',
    color: '#3b82f6', // blue-500
    topics: [
      { id: 'bf-1', name: 'Time Value of Money', isCompleted: false, priority: 'High', deadline: getFutureDate(3) },
      { id: 'bf-2', name: 'Risk and Return', isCompleted: false, priority: 'Medium' },
      { id: 'bf-3', name: 'Bond Valuation', isCompleted: false, priority: 'Medium' },
      { id: 'bf-4', name: 'Stock Valuation', isCompleted: false, priority: 'Low' },
    ],
  },
  {
    id: 'crit-think',
    title: 'Critical Thinking',
    color: '#8b5cf6', // violet-500
    topics: [
      { id: 'ct-1', name: 'Analysis of Arguments', isCompleted: false, priority: 'Medium', deadline: getFutureDate(5) },
      { id: 'ct-2', name: 'Deductive Reasoning', isCompleted: false, priority: 'Medium' },
      { id: 'ct-3', name: 'Inductive Reasoning', isCompleted: false, priority: 'Low' },
      { id: 'ct-4', name: 'Fallacies', isCompleted: false, priority: 'High' },
    ],
  },
  {
    id: 'data-anl-2',
    title: 'Data Analysis for Business II',
    color: '#10b981', // emerald-500
    topics: [
      { id: 'da2-1', name: 'Multiple Regression', isCompleted: false, priority: 'High', deadline: getFutureDate(7) },
      { id: 'da2-2', name: 'Hypothesis Testing', isCompleted: false, priority: 'High' },
      { id: 'da2-3', name: 'ANOVA', isCompleted: false, priority: 'Medium' },
    ],
  },
  {
    id: 'data-anl-lab',
    title: 'Data Analysis for Business II - Lab',
    color: '#14b8a6', // teal-500
    topics: [
      { id: 'dal-1', name: 'SPSS Regression Lab', isCompleted: false, priority: 'Medium' },
      { id: 'dal-2', name: 'Excel Data Tools', isCompleted: false, priority: 'Low' },
    ],
  },
  {
    id: 'env-sci',
    title: 'Environmental Science and Sustainability for Business',
    color: '#84cc16', // lime-500
    topics: [
      { id: 'env-1', name: 'Ecosystems & Business', isCompleted: false, priority: 'Low' },
      { id: 'env-2', name: 'Corporate Sustainability', isCompleted: false, priority: 'Medium' },
      { id: 'env-3', name: 'Climate Change Impact', isCompleted: false, priority: 'High' },
    ],
  },
  {
    id: 'ideology',
    title: 'Ideology and Constitution of Pakistan',
    color: '#f59e0b', // amber-500
    topics: [
      { id: 'ideo-1', name: 'Two Nation Theory', isCompleted: false, priority: 'Low' },
      { id: 'ideo-2', name: 'Constitution of 1973', isCompleted: false, priority: 'High' },
      { id: 'ideo-3', name: 'Political History', isCompleted: false, priority: 'Medium' },
    ],
  },
  {
    id: 'db-sys',
    title: 'Introduction to Database Systems',
    color: '#f43f5e', // rose-500
    topics: [
      { id: 'db-1', name: 'ER Diagrams', isCompleted: false, priority: 'High', deadline: getFutureDate(4) },
      { id: 'db-2', name: 'Relational Model', isCompleted: false, priority: 'High' },
      { id: 'db-3', name: 'Normalization', isCompleted: false, priority: 'Medium' },
      { id: 'db-4', name: 'SQL Basics', isCompleted: false, priority: 'Medium' },
    ],
  },
  {
    id: 'db-sys-lab',
    title: 'Introduction to Database Systems - Lab',
    color: '#ec4899', // pink-500
    topics: [
      { id: 'dbl-1', name: 'Lab 01: Environment Setup', isCompleted: false, priority: 'Low' },
      { id: 'dbl-2', name: 'Lab 02: Basic Queries', isCompleted: false, priority: 'Medium' },
    ],
  },
  {
    id: 'sirat',
    title: 'Understanding Sirat-Un-Nabi (PBUH)',
    color: '#6366f1', // indigo-500
    topics: [
      { id: 'sir-1', name: 'Life in Makkah', isCompleted: false, priority: 'Medium' },
      { id: 'sir-2', name: 'Migration to Madinah', isCompleted: false, priority: 'Medium' },
      { id: 'sir-3', name: 'Key Battles', isCompleted: false, priority: 'Low' },
    ],
  },
];

export const SURAH_LIST: Surah[] = [
  { number: 1, name: "Al-Fatiha", englishName: "The Opening", ayahs: 7 },
  { number: 2, name: "Al-Baqarah", englishName: "The Cow", ayahs: 286 },
  { number: 3, name: "Al-Imran", englishName: "The Family of Imran", ayahs: 200 },
  { number: 4, name: "An-Nisa", englishName: "The Women", ayahs: 176 },
  { number: 5, name: "Al-Ma'idah", englishName: "The Table Spread", ayahs: 120 },
  { number: 6, name: "Al-An'am", englishName: "The Cattle", ayahs: 165 },
  { number: 7, name: "Al-A'raf", englishName: "The Heights", ayahs: 206 },
  { number: 8, name: "Al-Anfal", englishName: "The Spoils of War", ayahs: 75 },
  { number: 9, name: "At-Tawbah", englishName: "The Repentance", ayahs: 129 },
  { number: 10, name: "Yunus", englishName: "Jonah", ayahs: 109 },
  { number: 11, name: "Hud", englishName: "Hud", ayahs: 123 },
  { number: 12, name: "Yusuf", englishName: "Joseph", ayahs: 111 },
  { number: 13, name: "Ar-Ra'd", englishName: "The Thunder", ayahs: 43 },
  { number: 14, name: "Ibrahim", englishName: "Abraham", ayahs: 52 },
  { number: 15, name: "Al-Hijr", englishName: "The Rocky Tract", ayahs: 99 },
  { number: 16, name: "An-Nahl", englishName: "The Bee", ayahs: 128 },
  { number: 17, name: "Al-Isra", englishName: "The Night Journey", ayahs: 111 },
  { number: 18, name: "Al-Kahf", englishName: "The Cave", ayahs: 110 },
  { number: 19, name: "Maryam", englishName: "Mary", ayahs: 98 },
  { number: 20, name: "Ta-Ha", englishName: "Ta-Ha", ayahs: 135 },
  { number: 21, name: "Al-Anbiya", englishName: "The Prophets", ayahs: 112 },
  { number: 22, name: "Al-Hajj", englishName: "The Pilgrimage", ayahs: 78 },
  { number: 23, name: "Al-Mu'minun", englishName: "The Believers", ayahs: 118 },
  { number: 24, name: "An-Nur", englishName: "The Light", ayahs: 64 },
  { number: 25, name: "Al-Furqan", englishName: "The Criterion", ayahs: 77 },
  { number: 26, name: "Ash-Shu'ara", englishName: "The Poets", ayahs: 227 },
  { number: 27, name: "An-Naml", englishName: "The Ant", ayahs: 93 },
  { number: 28, name: "Al-Qasas", englishName: "The Narration", ayahs: 88 },
  { number: 29, name: "Al-Ankabut", englishName: "The Spider", ayahs: 69 },
  { number: 30, name: "Ar-Rum", englishName: "The Romans", ayahs: 60 },
  { number: 31, name: "Luqman", englishName: "Luqman", ayahs: 34 },
  { number: 32, name: "As-Sajdah", englishName: "The Prostration", ayahs: 30 },
  { number: 33, name: "Al-Ahzab", englishName: "The Combined Forces", ayahs: 73 },
  { number: 34, name: "Saba", englishName: "Sheba", ayahs: 54 },
  { number: 35, name: "Fatir", englishName: "Originator", ayahs: 45 },
  { number: 36, name: "Ya-Sin", englishName: "Ya Sin", ayahs: 83 },
  { number: 37, name: "As-Saffat", englishName: "Those Who Set The Ranks", ayahs: 182 },
  { number: 38, name: "Sad", englishName: "The Letter Sad", ayahs: 88 },
  { number: 39, name: "Az-Zumar", englishName: "The Troops", ayahs: 75 },
  { number: 40, name: "Ghafir", englishName: "The Forgiver", ayahs: 85 },
  { number: 41, name: "Fussilat", englishName: "Explained in Detail", ayahs: 54 },
  { number: 42, name: "Ash-Shura", englishName: "The Consultation", ayahs: 53 },
  { number: 43, name: "Az-Zukhruf", englishName: "The Ornaments of Gold", ayahs: 89 },
  { number: 44, name: "Ad-Dukhan", englishName: "The Smoke", ayahs: 59 },
  { number: 45, name: "Al-Jathiyah", englishName: "The Crouching", ayahs: 37 },
  { number: 46, name: "Al-Ahqaf", englishName: "The Wind-Curved Sandhills", ayahs: 35 },
  { number: 47, name: "Muhammad", englishName: "Muhammad", ayahs: 38 },
  { number: 48, name: "Al-Fath", englishName: "The Victory", ayahs: 29 },
  { number: 49, name: "Al-Hujurat", englishName: "The Rooms", ayahs: 18 },
  { number: 50, name: "Qaf", englishName: "The Letter Qaf", ayahs: 45 },
  { number: 51, name: "Ad-Dhariyat", englishName: "The Winnowing Winds", ayahs: 60 },
  { number: 52, name: "At-Tur", englishName: "The Mount", ayahs: 49 },
  { number: 53, name: "An-Najm", englishName: "The Star", ayahs: 62 },
  { number: 54, name: "Al-Qamar", englishName: "The Moon", ayahs: 55 },
  { number: 55, name: "Ar-Rahman", englishName: "The Beneficent", ayahs: 78 },
  { number: 56, name: "Al-Waqi'ah", englishName: "The Inevitable", ayahs: 96 },
  { number: 57, name: "Al-Hadid", englishName: "The Iron", ayahs: 29 },
  { number: 58, name: "Al-Mujadila", englishName: "The Pleading Woman", ayahs: 22 },
  { number: 59, name: "Al-Hashr", englishName: "The Exile", ayahs: 24 },
  { number: 60, name: "Al-Mumtahanah", englishName: "She That Is To Be Examined", ayahs: 13 },
  { number: 61, name: "As-Saff", englishName: "The Ranks", ayahs: 14 },
  { number: 62, name: "Al-Jumu'ah", englishName: "The Congregation, Friday", ayahs: 11 },
  { number: 63, name: "Al-Munafiqun", englishName: "The Hypocrites", ayahs: 11 },
  { number: 64, name: "At-Taghabun", englishName: "The Mutual Disillusion", ayahs: 18 },
  { number: 65, name: "At-Talaq", englishName: "The Divorce", ayahs: 12 },
  { number: 66, name: "At-Tahrim", englishName: "The Prohibition", ayahs: 12 },
  { number: 67, name: "Al-Mulk", englishName: "The Sovereignty", ayahs: 30 },
  { number: 68, name: "Al-Qalam", englishName: "The Pen", ayahs: 52 },
  { number: 69, name: "Al-Haqqah", englishName: "The Reality", ayahs: 52 },
  { number: 70, name: "Al-Ma'arij", englishName: "The Ascending Stairways", ayahs: 44 },
  { number: 71, name: "Nuh", englishName: "Noah", ayahs: 28 },
  { number: 72, name: "Al-Jinn", englishName: "The Jinn", ayahs: 28 },
  { number: 73, name: "Al-Muzzammil", englishName: "The Enshrouded One", ayahs: 20 },
  { number: 74, name: "Al-Muddaththir", englishName: "The Cloaked One", ayahs: 56 },
  { number: 75, name: "Al-Qiyamah", englishName: "The Resurrection", ayahs: 40 },
  { number: 76, name: "Al-Insan", englishName: "The Man", ayahs: 31 },
  { number: 77, name: "Al-Mursalat", englishName: "The Emissaries", ayahs: 50 },
  { number: 78, name: "An-Naba", englishName: "The Tidings", ayahs: 40 },
  { number: 79, name: "An-Nazi'at", englishName: "Those Who Drag Forth", ayahs: 46 },
  { number: 80, name: "Abasa", englishName: "He Frowned", ayahs: 42 },
  { number: 81, name: "At-Takwir", englishName: "The Overthrowing", ayahs: 29 },
  { number: 82, name: "Al-Infitar", englishName: "The Cleaving", ayahs: 19 },
  { number: 83, name: "Al-Mutaffifin", englishName: "The Defrauding", ayahs: 36 },
  { number: 84, name: "Al-Inshiqaq", englishName: "The Sundering", ayahs: 25 },
  { number: 85, name: "Al-Buruj", englishName: "The Mansions of the Stars", ayahs: 22 },
  { number: 86, name: "At-Tariq", englishName: "The Morning Star", ayahs: 17 },
  { number: 87, name: "Al-A'la", englishName: "The Most High", ayahs: 19 },
  { number: 88, name: "Al-Ghashiyah", englishName: "The Overwhelming", ayahs: 26 },
  { number: 89, name: "Al-Fajr", englishName: "The Dawn", ayahs: 30 },
  { number: 90, name: "Al-Balad", englishName: "The City", ayahs: 20 },
  { number: 91, name: "Ash-Shams", englishName: "The Sun", ayahs: 15 },
  { number: 92, name: "Al-Lail", englishName: "The Night", ayahs: 21 },
  { number: 93, name: "Ad-Duha", englishName: "The Morning Hours", ayahs: 11 },
  { number: 94, name: "Ash-Sharh", englishName: "The Relief", ayahs: 8 },
  { number: 95, name: "At-Tin", englishName: "The Fig", ayahs: 8 },
  { number: 96, name: "Al-Alaq", englishName: "The Clot", ayahs: 19 },
  { number: 97, name: "Al-Qadr", englishName: "The Power", ayahs: 5 },
  { number: 98, name: "Al-Bayyinah", englishName: "The Clear Proof", ayahs: 8 },
  { number: 99, name: "Az-Zalzalah", englishName: "The Earthquake", ayahs: 8 },
  { number: 100, name: "Al-Adiyat", englishName: "The Courser", ayahs: 11 },
  { number: 101, name: "Al-Qari'ah", englishName: "The Calamity", ayahs: 11 },
  { number: 102, name: "At-Takathur", englishName: "The Rivalry in World Increase", ayahs: 8 },
  { number: 103, name: "Al-Asr", englishName: "The Declining Day", ayahs: 3 },
  { number: 104, name: "Al-Humazah", englishName: "The Traducer", ayahs: 9 },
  { number: 105, name: "Al-Fil", englishName: "The Elephant", ayahs: 5 },
  { number: 106, name: "Quraish", englishName: "Quraish", ayahs: 4 },
  { number: 107, name: "Al-Ma'un", englishName: "The Small Kindnesses", ayahs: 7 },
  { number: 108, name: "Al-Kawthar", englishName: "The Abundance", ayahs: 3 },
  { number: 109, name: "Al-Kafirun", englishName: "The Disbelievers", ayahs: 6 },
  { number: 110, name: "An-Nasr", englishName: "The Divine Support", ayahs: 3 },
  { number: 111, name: "Al-Masad", englishName: "The Palm Fiber", ayahs: 5 },
  { number: 112, name: "Al-Ikhlas", englishName: "The Sincerity", ayahs: 4 },
  { number: 113, name: "Al-Falaq", englishName: "The Daybreak", ayahs: 5 },
  { number: 114, name: "An-Nas", englishName: "Mankind", ayahs: 6 }
];

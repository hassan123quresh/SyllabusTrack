
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { Subject, Exam, QuranNote, Topic, Resource } from '../types';
import { INITIAL_SYLLABUS, INITIAL_EXAMS } from '../constants';

// Helper to recursively clean data for Firestore
// 1. Removes undefined keys from objects (Firestore doesn't accept undefined)
// 2. Removes null AND undefined items from arrays (Prevent sparse arrays)
// 3. Converts Dates to strings
const cleanData = (data: any): any => {
  if (data === undefined) return undefined;
  if (data === null) return null;
  
  if (data instanceof Date) return data.toISOString();

  if (Array.isArray(data)) {
    return data
      .map(item => cleanData(item))
      .filter(item => item !== undefined && item !== null);
  } 
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      const cleaned = cleanData(value);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result;
  }

  return data;
};

export const dbService = {
  // --- Subjects ---
  subscribeToSubjects: (cb: (data: Subject[]) => void, onError?: (error: any) => void) => {
    return onSnapshot(collection(db, 'subjects'), (snapshot) => {
      const subjects = snapshot.docs.map(doc => {
         const data = doc.data() as Subject;
         
         // CRITICAL FIX: Ensure the internal ID matches the Document ID.
         data.id = doc.id; 

         // Defensive: Ensure topics is array
         if (!data.topics || !Array.isArray(data.topics)) {
            data.topics = [];
         } else {
            // Auto-Repair: Fix topics that might be missing IDs from older versions of the app
            data.topics = data.topics.map((t: any) => {
               if (!t || typeof t !== 'object') return null;
               
               // If it's a legacy topic without an ID, generate one to make it editable
               if (!t.id) {
                 t.id = `repaired-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
               }
               return t;
            }).filter(t => t !== null) as Topic[];
         }
         return data;
      });
      cb(subjects);
    }, (error) => {
      console.error("Error connecting to Subjects collection:", error);
      if (onError) onError(error);
    });
  },
  
  addSubject: async (subject: Subject) => {
    try {
      const cleanedSubject = cleanData(subject);
      if (!cleanedSubject) throw new Error("Invalid subject data");
      await setDoc(doc(db, 'subjects', subject.id), cleanedSubject);
    } catch (e) {
      console.error("Error adding subject", e);
      throw e;
    }
  },
  
  deleteSubject: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (e) {
      console.error("Error deleting subject", e);
      throw e;
    }
  },

  updateSubjectTopics: async (subjectId: string, topics: Topic[]) => {
    try {
      const subjectRef = doc(db, 'subjects', subjectId);
      const cleanedTopics = cleanData(topics);
      // Double check specifically for topics array
      if (!Array.isArray(cleanedTopics)) {
        throw new Error("Topics must be an array");
      }
      await updateDoc(subjectRef, { topics: cleanedTopics });
    } catch (e) {
      console.error("Error updating topics", e);
      throw e;
    }
  },

  seedDatabase: async () => {
    try {
      const batch = writeBatch(db);
      
      INITIAL_SYLLABUS.forEach(subject => {
          const ref = doc(db, 'subjects', subject.id);
          const cleaned = cleanData(subject);
          if (cleaned) batch.set(ref, cleaned);
      });
      
      INITIAL_EXAMS.forEach(exam => {
          const ref = doc(db, 'exams', exam.id);
          const cleaned = cleanData(exam);
          if (cleaned) batch.set(ref, cleaned);
      });

      await batch.commit();
    } catch (e) {
      console.error("Error seeding database", e);
      throw e;
    }
  },

  clearAllData: async () => {
    try {
      const collections = ['subjects', 'exams', 'resources'];
      
      for (const col of collections) {
         const snapshot = await getDocs(collection(db, col));
         if (snapshot.empty) continue;

         const batch = writeBatch(db);
         snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
         });
         await batch.commit();
      }
      console.log("Database cleared successfully");
    } catch (e) {
      console.error("Error clearing database", e);
      throw e;
    }
  },

  // --- Exams ---
  subscribeToExams: (cb: (data: Exam[]) => void, onError?: (error: any) => void) => {
    return onSnapshot(collection(db, 'exams'), (snapshot) => {
        const exams = snapshot.docs.map(doc => {
          const data = doc.data() as Exam;
          data.id = doc.id;
          return data;
        });
        cb(exams);
    }, (error) => {
      console.error("Error connecting to Exams collection:", error);
      if (onError) onError(error);
    });
  },
  
  addExam: async (exam: Exam) => {
    await setDoc(doc(db, 'exams', exam.id), cleanData(exam));
  },
  
  deleteExam: async (id: string) => {
    try {
        await deleteDoc(doc(db, 'exams', id));
    } catch (e) {
        console.error("Error deleting exam", e);
        throw e;
    }
  },

  // --- Quran Notes ---
  subscribeToQuranNotes: (cb: (data: Record<string, QuranNote>) => void, onError?: (error: any) => void) => {
     return onSnapshot(collection(db, 'quran_notes'), (snapshot) => {
        const notes: Record<string, QuranNote> = {};
        snapshot.docs.forEach(doc => {
            notes[doc.id] = doc.data() as QuranNote;
        });
        cb(notes);
     }, (error) => {
       console.error("Error connecting to Quran Notes:", error);
       if (onError) onError(error);
     });
  },

  saveQuranNote: async (note: QuranNote) => {
    await setDoc(doc(db, 'quran_notes', note.id), cleanData(note));
  },

  // --- Resources ---
  getResource: async (subjectId: string) => {
    try {
      const docRef = doc(db, 'resources', subjectId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Resource;
      }
      return null;
    } catch (e) {
      console.error("Error fetching resource", e);
      throw e;
    }
  },

  saveResource: async (resource: Resource) => {
    try {
      await setDoc(doc(db, 'resources', resource.id), cleanData(resource));
    } catch (e) {
      console.error("Error saving resource", e);
      throw e;
    }
  }
};

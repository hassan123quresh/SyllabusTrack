import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { Subject, Exam, Resource, QuranNote, Topic } from '../types';
import { INITIAL_SYLLABUS, INITIAL_EXAMS } from '../constants';

// Firestore rejects undefined values. This helper removes them recursively.
const cleanData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  } else if (data !== null && typeof data === 'object') {
    return Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = cleanData(value);
      }
      return acc;
    }, {} as any);
  }
  return data;
};

export const dbService = {
  // --- Subjects ---
  subscribeToSubjects: (cb: (data: Subject[]) => void, onError?: (error: any) => void) => {
    return onSnapshot(collection(db, 'subjects'), (snapshot) => {
      const subjects = snapshot.docs.map(doc => doc.data() as Subject);
      cb(subjects);
    }, (error) => {
      console.error("Error connecting to Subjects collection:", error);
      if (onError) onError(error);
    });
  },
  
  addSubject: async (subject: Subject) => {
    await setDoc(doc(db, 'subjects', subject.id), cleanData(subject));
  },
  
  deleteSubject: async (id: string) => {
    await deleteDoc(doc(db, 'subjects', id));
  },

  updateSubjectTopics: async (subjectId: string, topics: Topic[]) => {
    const subjectRef = doc(db, 'subjects', subjectId);
    await updateDoc(subjectRef, { topics: cleanData(topics) });
  },

  seedDatabase: async () => {
      const batch = writeBatch(db);
      
      INITIAL_SYLLABUS.forEach(subject => {
          const ref = doc(db, 'subjects', subject.id);
          batch.set(ref, cleanData(subject));
      });
      
      INITIAL_EXAMS.forEach(exam => {
          const ref = doc(db, 'exams', exam.id);
          batch.set(ref, cleanData(exam));
      });

      await batch.commit();
  },

  // --- Exams ---
  subscribeToExams: (cb: (data: Exam[]) => void, onError?: (error: any) => void) => {
    return onSnapshot(collection(db, 'exams'), (snapshot) => {
        const exams = snapshot.docs.map(doc => doc.data() as Exam);
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
    await deleteDoc(doc(db, 'exams', id));
  },

  // --- Resources ---
  getResource: async (id: string): Promise<Resource | null> => {
    try {
      const docRef = doc(db, 'resources', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as Resource) : null;
    } catch (error) {
      console.error("Error fetching resource:", error);
      return null;
    }
  },

  saveResource: async (resource: Resource) => {
    await setDoc(doc(db, 'resources', resource.id), cleanData(resource));
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
  }
};
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

// User types
export interface BaseUser {
  id: string;
  firstName: string;
  surname: string;
  middleName?: string;
  email: string;
  phone: string;
  role: "staff" | "resource_person" | "trainee";
  isVerified: boolean;
  createdAt: Timestamp;
}

export interface Trainee extends BaseUser {
  role: "trainee";
  tagNumber: string;
  dateOfBirth: string;
  gender: "male" | "female";
  state: string;
  lga: string;
  sponsorId?: string;
  batchId?: string;
  roomNumber?: string;
  roomBlock?: string;
  verificationMethod: "email" | "phone";
}

export interface Staff extends BaseUser {
  role: "staff";
  department?: string;
  position?: string;
}

export interface ResourcePerson extends BaseUser {
  role: "resource_person";
  specialization?: string;
  experience?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  batchId?: string;
  createdAt: Timestamp;
}

export interface Batch {
  id: string;
  name: string;
  year: number;
  isActive: boolean;
  description?: string;
  createdAt: Timestamp;
}

// Collections
const USERS_COLLECTION = "users";
const TRAINEES_COLLECTION = "trainees";
const STAFF_COLLECTION = "staff";
const RESOURCE_PERSONS_COLLECTION = "resource_persons";
const SPONSORS_COLLECTION = "sponsors";
const BATCHES_COLLECTION = "batches";

// Generic CRUD operations
export const createDocument = async <T>(collectionName: string, data: Omit<T, 'id'>) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getDocument = async <T>(collectionName: string, id: string): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

export const getAllDocuments = async <T>(collectionName: string): Promise<T[]> => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
};

export const updateDocument = async <T>(collectionName: string, id: string, data: Partial<T>) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
};

export const deleteDocument = async (collectionName: string, id: string) => {
  await deleteDoc(doc(db, collectionName, id));
};

export const queryDocuments = async <T>(
  collectionName: string, 
  field: string, 
  operator: any, 
  value: any
): Promise<T[]> => {
  const q = query(collection(db, collectionName), where(field, operator, value));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
};

// User-specific functions
export const createUser = async (userData: Omit<BaseUser, 'id' | 'createdAt'>) => {
  return await createDocument(USERS_COLLECTION, userData);
};

export const getUsers = async (): Promise<BaseUser[]> => {
  return await getAllDocuments<BaseUser>(USERS_COLLECTION);
};

export const getUserByEmail = async (email: string): Promise<BaseUser | null> => {
  const users = await queryDocuments<BaseUser>(USERS_COLLECTION, "email", "==", email);
  return users.length > 0 ? users[0] : null;
};

// Trainee-specific functions
export const createTrainee = async (traineeData: Omit<Trainee, 'id' | 'createdAt'>) => {
  return await createDocument(TRAINEES_COLLECTION, traineeData);
};

export const getTrainees = async (): Promise<Trainee[]> => {
  return await getAllDocuments<Trainee>(TRAINEES_COLLECTION);
};

export const getTraineesByBatch = async (batchId: string): Promise<Trainee[]> => {
  return await queryDocuments<Trainee>(TRAINEES_COLLECTION, "batchId", "==", batchId);
};

// Sponsor functions
export const createSponsor = async (sponsorData: Omit<Sponsor, 'id' | 'createdAt'>) => {
  return await createDocument(SPONSORS_COLLECTION, sponsorData);
};

export const getSponsors = async (): Promise<Sponsor[]> => {
  return await getAllDocuments<Sponsor>(SPONSORS_COLLECTION);
};

export const getActiveSponsors = async (): Promise<Sponsor[]> => {
  return await queryDocuments<Sponsor>(SPONSORS_COLLECTION, "isActive", "==", true);
};

// Batch functions
export const createBatch = async (batchData: Omit<Batch, 'id' | 'createdAt'>) => {
  return await createDocument(BATCHES_COLLECTION, batchData);
};

export const getBatches = async (): Promise<Batch[]> => {
  return await getAllDocuments<Batch>(BATCHES_COLLECTION);
};

export const getActiveBatches = async (): Promise<Batch[]> => {
  return await queryDocuments<Batch>(BATCHES_COLLECTION, "isActive", "==", true);
};

// Staff functions
export const createStaff = async (staffData: Omit<Staff, 'id' | 'createdAt'>) => {
  return await createDocument(STAFF_COLLECTION, staffData);
};

export const getStaff = async (): Promise<Staff[]> => {
  return await getAllDocuments<Staff>(STAFF_COLLECTION);
};

// Resource Person functions
export const createResourcePerson = async (rpData: Omit<ResourcePerson, 'id' | 'createdAt'>) => {
  return await createDocument(RESOURCE_PERSONS_COLLECTION, rpData);
};

export const getResourcePersons = async (): Promise<ResourcePerson[]> => {
  return await getAllDocuments<ResourcePerson>(RESOURCE_PERSONS_COLLECTION);
};

// File upload function
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

// Generate unique tag number
export const generateTagNumber = async (): Promise<string> => {
  const trainees = await getTrainees();
  const currentYear = new Date().getFullYear();
  const existingTags = trainees.map(t => t.tagNumber);
  
  let tagNumber: string;
  let counter = 1;
  
  do {
    tagNumber = `TRN${currentYear}${counter.toString().padStart(4, '0')}`;
    counter++;
  } while (existingTags.includes(tagNumber));
  
  return tagNumber;
};

// Room allocation function
export const allocateRoom = async (gender: "male" | "female"): Promise<{ roomNumber: string; roomBlock: string } | null> => {
  const trainees = await getTrainees();
  const occupiedRooms = trainees
    .filter(t => t.roomNumber && t.roomBlock)
    .map(t => `${t.roomBlock}-${t.roomNumber}`);
  
  // Simple room allocation logic
  const blocks = gender === "male" ? ["A", "B"] : ["C", "D"];
  const roomsPerBlock = 50;
  
  for (const block of blocks) {
    for (let room = 1; room <= roomsPerBlock; room++) {
      const roomKey = `${block}-${room.toString().padStart(3, '0')}`;
      if (!occupiedRooms.includes(roomKey)) {
        return {
          roomBlock: block,
          roomNumber: room.toString().padStart(3, '0')
        };
      }
    }
  }
  
  return null; // No available rooms
};
import { UserProfile, Task, ChatMessage, StrategicPlan } from "../types";

const DB_NAME = 'FocusFlowDB';
const DB_VERSION = 1;
const STORES = {
  PROFILE: 'profile',
  TASKS: 'tasks',
  CHAT: 'chat',
  PLAN: 'plan'
};

// Singleton promise to ensure DB is open
let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", (event.target as any).error);
      reject((event.target as any).error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      // We use a single key 'current' for singleton stores like profile/plan
      if (!db.objectStoreNames.contains(STORES.PROFILE)) {
        db.createObjectStore(STORES.PROFILE);
      }
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        db.createObjectStore(STORES.TASKS);
      }
      if (!db.objectStoreNames.contains(STORES.CHAT)) {
        db.createObjectStore(STORES.CHAT);
      }
      if (!db.objectStoreNames.contains(STORES.PLAN)) {
        db.createObjectStore(STORES.PLAN);
      }
    };
  });

  return dbPromise;
};

// Generic Helpers
const getFromStore = async <T>(storeName: string, key: string = 'current'): Promise<T | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

const saveToStore = async <T>(storeName: string, data: T, key: string = 'current'): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data, key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Public API ---

export const getProfile = async (): Promise<UserProfile | null> => {
  return getFromStore<UserProfile>(STORES.PROFILE);
};

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  return saveToStore(STORES.PROFILE, profile);
};

export const getTasks = async (): Promise<Task[]> => {
  const tasks = await getFromStore<Task[]>(STORES.TASKS);
  return tasks || [];
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  return saveToStore(STORES.TASKS, tasks);
};

export const getChatHistory = async (): Promise<ChatMessage[]> => {
  const chat = await getFromStore<ChatMessage[]>(STORES.CHAT);
  return chat || [];
};

export const saveChatHistory = async (history: ChatMessage[]): Promise<void> => {
  return saveToStore(STORES.CHAT, history);
};

export const getStrategicPlan = async (): Promise<StrategicPlan | null> => {
  return getFromStore<StrategicPlan>(STORES.PLAN);
};

export const saveStrategicPlan = async (plan: StrategicPlan): Promise<void> => {
  return saveToStore(STORES.PLAN, plan);
};

export const clearData = async (): Promise<void> => {
  const db = await openDB();
  const stores = Object.values(STORES);
  
  const promises = stores.map(storeName => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });

  await Promise.all(promises);
};

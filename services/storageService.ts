import { SavedProject } from "../types";

const DB_NAME = 'TempoDB';
const STORE_NAME = 'projects';
const VERSION = 1;

/**
 * Initializes the IndexedDB database.
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    
    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const storageService = {
  /**
   * Retrieves all saved projects from IndexedDB.
   */
  async getAllProjects(): Promise<SavedProject[]> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get projects from DB", error);
      return [];
    }
  },

  /**
   * Saves or updates a project in IndexedDB.
   */
  async saveProject(project: SavedProject): Promise<void> {
    try {
      // Ensure updatedAt is set
      const projectWithTimestamp = {
        ...project,
        updatedAt: new Date().toISOString()
      };

      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(projectWithTimestamp);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to save project to DB", error);
    }
  },

  /**
   * Deletes a project by ID from IndexedDB.
   */
  async deleteProject(id: string): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to delete project from DB", error);
    }
  }
};
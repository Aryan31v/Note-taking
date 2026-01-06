import { get, set, createStore } from 'idb-keyval';
import { AppState } from '../types';

const DB_KEY = 'cortex_state';

// Create a dedicated store for images to keep the main state light
const imageStore = createStore('cortex_images_db', 'images');

// Save state to IndexedDB
export const saveStateToDB = async (state: AppState) => {
  try {
    await set(DB_KEY, state);
  } catch (error) {
    console.error('Failed to save state to IndexedDB:', error);
  }
};

// Load state from IndexedDB with fallback/migration from localStorage
export const loadStateFromDB = async (): Promise<AppState | null> => {
  try {
    // 1. Try to get data from IndexedDB
    const dbState = await get<AppState>(DB_KEY);
    
    if (dbState) {
      return dbState;
    }

    // 2. If DB is empty, check localStorage (Migration Path)
    const localState = localStorage.getItem(DB_KEY);
    if (localState) {
      console.log('Migrating data from localStorage to IndexedDB...');
      try {
        const parsed = JSON.parse(localState);
        // Save to DB immediately
        await set(DB_KEY, parsed);
        // Optional: Clear localStorage after successful migration
        // localStorage.removeItem(DB_KEY); 
        return parsed;
      } catch (e) {
        console.error('Failed to parse localStorage data', e);
      }
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  
  return null;
};

// --- Image Storage Utilities ---

export const saveImageToDB = async (id: string, blob: Blob): Promise<void> => {
  try {
    await set(id, blob, imageStore);
  } catch (error) {
    console.error('Failed to save image:', error);
    throw error;
  }
};

export const loadImageFromDB = async (id: string): Promise<Blob | undefined> => {
  try {
    return await get(id, imageStore);
  } catch (error) {
    console.error('Failed to load image:', error);
    return undefined;
  }
};
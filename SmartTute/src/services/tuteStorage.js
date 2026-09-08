import { defaultTutes } from '../data/defaultTutes.js';

const TUTES_STORAGE_KEY = 'smarttute_tutes_v1';
const API_BASE = '/api/tutes';

/**
 * Retrieves all stored Tutes directly from MongoDB Atlas API.
 */
export async function getTutesAsync() {
  try {
    const res = await fetch(API_BASE);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem(TUTES_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('[SmartTute API] Failed to fetch tutes from backend, using cached local data.', err);
  }
  return getTutes();
}

/**
 * Synchronous local retrieval from cache or empty fallback.
 */
export function getTutes() {
  if (typeof window === 'undefined') return defaultTutes;

  try {
    const raw = localStorage.getItem(TUTES_STORAGE_KEY);
    if (!raw) return defaultTutes;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultTutes;
  } catch (error) {
    console.warn('[SmartTute Storage] Failed to parse local tutes cache:', error);
    return defaultTutes;
  }
}

/**
 * Retrieves a single Tute by ID from local cache or API.
 */
export function getTuteById(id) {
  const tutes = getTutes();
  return tutes.find(t => t.id === id) || null;
}

/**
 * Async fetch single tute from MongoDB Atlas.
 */
export async function getTuteByIdAsync(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn(`[SmartTute API] Failed to fetch tute ${id} from MongoDB:`, err);
  }
  return getTuteById(id);
}

/**
 * Saves a Tute to MongoDB Atlas and updates local cache.
 */
export function saveTute(tute) {
  saveTuteAsync(tute);
  
  if (typeof window !== 'undefined') {
    try {
      const tutes = getTutes();
      const existingIndex = tutes.findIndex(t => t.id === tute.id);
      const now = new Date().toISOString();
      let updatedList;

      if (existingIndex >= 0) {
        updatedList = [...tutes];
        updatedList[existingIndex] = { ...tutes[existingIndex], ...tute, updatedAt: now };
      } else {
        const newTute = { status: 'draft', ...tute, id: tute.id || `tute_${Date.now()}`, createdAt: tute.createdAt || now, updatedAt: now };
        updatedList = [newTute, ...tutes];
      }
      localStorage.setItem(TUTES_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.error('[SmartTute Cache] Save error:', err);
    }
  }
  return true;
}

/**
 * Async save to MongoDB Atlas server.
 */
export async function saveTuteAsync(tute) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tute)
    });
    if (res.ok) {
      const saved = await res.json();
      return saved;
    }
  } catch (err) {
    console.error('[SmartTute API] Error saving tute to MongoDB Atlas:', err);
  }
  return null;
}

/**
 * Duplicates a Tute.
 */
export function duplicateTute(id) {
  const original = getTuteById(id);
  if (!original) return null;

  const now = new Date().toISOString();
  const copy = {
    ...JSON.parse(JSON.stringify(original)),
    id: `tute_${Date.now()}`,
    title: `${original.title} (Copy)`,
    createdAt: now,
    updatedAt: now
  };

  saveTute(copy);
  return copy;
}

/**
 * Deletes a Tute by ID from MongoDB Atlas & local cache.
 */
export function deleteTute(id) {
  deleteTuteAsync(id);

  if (typeof window !== 'undefined') {
    try {
      const tutes = getTutes();
      const filtered = tutes.filter(t => t.id !== id);
      localStorage.setItem(TUTES_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('[SmartTute Storage] Error deleting Tute:', error);
      return false;
    }
  }
  return true;
}

/**
 * Async delete from MongoDB Atlas.
 */
export async function deleteTuteAsync(id) {
  try {
    await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error(`[SmartTute API] Error deleting tute ${id}:`, err);
  }
}

import { defaultStudent } from '../data/defaultStudent.js';

const STORAGE_KEY = 'smarttute_student_v1';

/**
 * Retrieves the current student record from localStorage.
 * Safely handles missing or corrupted local data by returning standard default structures.
 */
export function getStudent() {
  if (typeof window === 'undefined') return { ...defaultStudent };

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { ...defaultStudent };

    const parsed = JSON.parse(data);

    // Defensive structure validation & merging
    return {
      ...defaultStudent,
      ...parsed,
      avatar: {
        ...defaultStudent.avatar,
        ...(parsed.avatar || {})
      },
      stats: {
        ...defaultStudent.stats,
        ...(parsed.stats || {})
      }
    };
  } catch (error) {
    console.warn('[SmartTute Storage] Failed to parse local student data. Recovering defaults.', error);
    return { ...defaultStudent };
  }
}

/**
 * Persists complete student object to localStorage.
 */
export function saveStudent(student) {
  if (typeof window === 'undefined') return false;

  try {
    const payload = JSON.stringify(student);
    localStorage.setItem(STORAGE_KEY, payload);
    return true;
  } catch (error) {
    console.error('[SmartTute Storage] Failed to save student data:', error);
    return false;
  }
}

/**
 * Partially updates and saves existing student record.
 */
export function updateStudent(partialData) {
  const current = getStudent();
  const updated = {
    ...current,
    ...partialData,
    avatar: partialData.avatar ? { ...current.avatar, ...partialData.avatar } : current.avatar,
    stats: partialData.stats ? { ...current.stats, ...partialData.stats } : current.stats
  };

  saveStudent(updated);
  return updated;
}

/**
 * Clears local student data for development reset or session restart.
 */
export function clearStudent() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[SmartTute Storage] Failed to clear student data:', error);
  }
}

/**
 * Checks whether initial onboarding setup is completed.
 */
export function isSetupCompleted() {
  const student = getStudent();
  return Boolean(student.isSetupComplete && student.name.trim().length > 0);
}

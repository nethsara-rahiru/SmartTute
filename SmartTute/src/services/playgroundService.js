const PLAYGROUNDS_STORAGE_KEY = 'smarttute_playgrounds';
const API_BASE = '/api/playgrounds';

/**
 * Generates a 5-character uppercase join code avoiding confusing characters (0, O, 1, I, L)
 */
export function generateJoinCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates a safe random percentage position for stage rendering (x: 10%-85%, y: 20%-75%)
 */
export function generateRandomPosition(existingParticipants = []) {
  let attempts = 0;
  let bestPos = { x: 50, y: 50 };

  while (attempts < 30) {
    const x = Math.floor(Math.random() * 75) + 10;
    const y = Math.floor(Math.random() * 55) + 20;

    const tooClose = existingParticipants.some(p => {
      const dx = Math.abs(p.position.x - x);
      const dy = Math.abs(p.position.y - y);
      return dx < 12 && dy < 16;
    });

    if (!tooClose) {
      return { x, y };
    }
    bestPos = { x, y };
    attempts++;
  }

  return bestPos;
}

/**
 * Local cache getters & fallback writers
 */
export function getPlaygroundsLocal() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PLAYGROUNDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[Playground Service] Failed reading local playgrounds cache:', err);
    return [];
  }
}

export function savePlaygroundLocal(playground) {
  if (typeof window === 'undefined') return;
  try {
    const list = getPlaygroundsLocal();
    const idx = list.findIndex(p => p.id === playground.id);
    let updated;
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = playground;
    } else {
      updated = [playground, ...list];
    }
    localStorage.setItem(PLAYGROUNDS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[Playground Service] Failed writing local playground cache:', err);
  }
}

/**
 * Async API endpoints with local fallback
 */
export async function getPlaygrounds() {
  try {
    const res = await fetch(API_BASE);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(PLAYGROUNDS_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[Playground Service] Fetching from API failed, using local cache:', err);
  }
  return getPlaygroundsLocal();
}

export async function getPlayground(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (res.ok) {
      const data = await res.json();
      savePlaygroundLocal(data);
      return data;
    }
  } catch (err) {
    console.warn(`[Playground Service] Fetching playground ${id} failed:`, err);
  }
  const local = getPlaygroundsLocal();
  return local.find(p => p.id === id) || null;
}

export async function getPlaygroundByCode(code) {
  const upper = code.toUpperCase();
  try {
    const res = await fetch(`${API_BASE}/code/${upper}`);
    if (res.ok) {
      const data = await res.json();
      savePlaygroundLocal(data);
      return data;
    }
  } catch (err) {
    console.warn(`[Playground Service] Fetching by code ${upper} failed:`, err);
  }
  const local = getPlaygroundsLocal();
  return local.find(p => p.joinCode === upper) || null;
}

export async function createPlayground(name) {
  const now = new Date().toISOString();
  const newPg = {
    id: `pg_${Date.now()}`,
    name: name || 'Untitled Playground',
    joinCode: generateJoinCode(),
    status: 'waiting',
    createdAt: now,
    updatedAt: now,
    participants: []
  };

  savePlaygroundLocal(newPg);

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPg)
    });
    if (res.ok) {
      const saved = await res.json();
      savePlaygroundLocal(saved);
      return saved;
    }
  } catch (err) {
    console.error('[Playground Service] Failed saving created playground to API:', err);
  }

  return newPg;
}

export async function savePlayground(playground) {
  playground.updatedAt = new Date().toISOString();
  savePlaygroundLocal(playground);

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playground)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[Playground Service] Failed saving playground:', err);
  }

  return playground;
}

export async function joinPlayground(code, studentProfile) {
  const pg = await getPlaygroundByCode(code);
  if (!pg) return { success: false, error: 'Playground not found with this join code.' };

  const existingParticipant = pg.participants.find(p => p.participantId === studentProfile.id);
  
  if (existingParticipant) {
    // Update avatar/name if changed
    existingParticipant.name = studentProfile.name || studentProfile.fullName || 'Student';
    if (studentProfile.avatar) {
      existingParticipant.avatar = studentProfile.avatar;
    }
  } else {
    // Add new participant with collision-free position
    const pos = generateRandomPosition(pg.participants);
    const newParticipant = {
      participantId: studentProfile.id || `st_${Date.now()}`,
      name: studentProfile.name || studentProfile.fullName || 'Student',
      avatar: studentProfile.avatar || {},
      position: pos,
      animation: 'spawn'
    };
    pg.participants.push(newParticipant);
  }

  const updated = await savePlayground(pg);
  return { success: true, playground: updated };
}

export async function updateParticipant(playgroundId, participantId, updates) {
  const pg = await getPlayground(playgroundId);
  if (!pg) return null;

  const idx = pg.participants.findIndex(p => p.participantId === participantId);
  if (idx >= 0) {
    pg.participants[idx] = {
      ...pg.participants[idx],
      ...updates
    };
    return await savePlayground(pg);
  }
  return pg;
}

export async function startPlayground(id) {
  const pg = await getPlayground(id);
  if (!pg) return null;

  pg.status = 'started';
  return await savePlayground(pg);
}

export async function deletePlayground(id) {
  if (typeof window !== 'undefined') {
    const list = getPlaygroundsLocal().filter(p => p.id !== id);
    localStorage.setItem(PLAYGROUNDS_STORAGE_KEY, JSON.stringify(list));
  }

  try {
    await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('[Playground Service] Failed deleting playground:', err);
  }
}

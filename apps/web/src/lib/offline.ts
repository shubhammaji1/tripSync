type Snapshot = { id: string; iv: number[]; ciphertext: number[]; savedAt: string };
const contextKey = 'tripsync_offline_context';
const databaseName = 'tripsync-private-offline-v1';
let contextReady: Promise<void> = Promise.resolve();

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('snapshots', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function setOfflineUser(userId: string | null) {
  contextReady = contextReady.catch(() => undefined).then(() => updateOfflineUser(userId));
  return contextReady;
}

async function updateOfflineUser(userId: string | null) {
  const previous = JSON.parse(sessionStorage.getItem(contextKey) || 'null');
  if (!userId || previous?.userId !== userId) {
    sessionStorage.removeItem(contextKey);
    const db = await database();
    await new Promise<void>((resolve, reject) => { const tx = db.transaction('snapshots', 'readwrite'); tx.objectStore('snapshots').clear(); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
    for (const key of Object.keys(localStorage)) if (key.startsWith('tripsync_')) localStorage.removeItem(key);
  }
  if (userId && previous?.userId !== userId) {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const raw = Array.from(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
    sessionStorage.setItem(contextKey, JSON.stringify({ userId, key: raw }));
  }
}

export async function saveOfflineTrip(path: string, trip: any) {
  await contextReady;
  const context = JSON.parse(sessionStorage.getItem(contextKey) || 'null');
  if (!context) return;
  const key = await crypto.subtle.importKey('raw', new Uint8Array(context.key), { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // Explicit read-only travel packet; never store tokens, payments, documents or live hazards.
  const packet = { id: trip.id, name: trip.name, destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate,
    days: trip.days || [], emergencyContacts: trip.emergencyContacts || [] };
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(packet)));
  const snapshot: Snapshot = { id: `${context.userId}:${path}`, iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)), savedAt: new Date().toISOString() };
  const db = await database();
  if (JSON.parse(sessionStorage.getItem(contextKey) || 'null')?.userId !== context.userId) { db.close(); return; }
  await new Promise<void>((resolve, reject) => { const tx = db.transaction('snapshots', 'readwrite'); tx.objectStore('snapshots').put(snapshot); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
  db.close();
}

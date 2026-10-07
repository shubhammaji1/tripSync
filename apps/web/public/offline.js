async function showSnapshots() {
 const status = document.getElementById('status');
 const context = JSON.parse(sessionStorage.getItem('tripsync_offline_context') || 'null');
 if (!context) { status.textContent = 'No saved packet is available in this browser session. Open a trip online first.'; return; }
 const request = indexedDB.open('tripsync-private-offline-v1', 1);
 const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
 if (!db.objectStoreNames.contains('snapshots')) { status.textContent = 'No saved trips.'; db.close(); return; }
 const rows = await new Promise((resolve, reject) => { const req = db.transaction('snapshots').objectStore('snapshots').getAll(); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); db.close();
 const key = await crypto.subtle.importKey('raw', new Uint8Array(context.key), { name: 'AES-GCM' }, false, ['decrypt']);
 const add = (parent, tag, text) => { const el = document.createElement(tag); el.textContent = text; parent.appendChild(el); return el; };
 let count = 0;
 for (const row of rows.filter(r => r.id.startsWith(context.userId + ':'))) {
  if (Date.now() - new Date(row.savedAt).getTime() > 7 * 86400000) continue;
  let trip; try { const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(row.iv) }, key, new Uint8Array(row.ciphertext)); trip = JSON.parse(new TextDecoder().decode(bytes)); } catch { continue; }
  count++; const article = add(document.getElementById('trips'), 'article', ''); add(article, 'h2', trip.name); add(article, 'p', trip.destination); add(article, 'small', 'Saved ' + new Date(row.savedAt).toLocaleString() + '. Verify details before travel.');
  for (const day of trip.days || []) { add(article, 'h3', 'Day ' + day.dayNumber + ' · ' + day.date); const list = add(article, 'ul', ''); for (const activity of day.activities || []) add(list, 'li', [activity.startTime, activity.title, activity.locationName].filter(Boolean).join(' · ')); }
  add(article, 'h3', 'Emergency contacts'); for (const contact of trip.emergencyContacts || []) { const p = add(article, 'p', contact.name + ': '); if (/^[+0-9 ()-]{5,25}$/.test(contact.phone)) { const a = add(p, 'a', contact.phone); a.href = 'tel:' + contact.phone.replace(/[^+0-9]/g, ''); } }
 }
 status.textContent = count ? count + ' saved trip packet(s). Cached data may be out of date.' : 'No recent trip packet is available. Open a trip online to save it.';
}
showSnapshots().catch(() => { document.getElementById('status').textContent = 'Saved packets are unavailable in this browser.'; });

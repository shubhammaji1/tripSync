import { test, expect } from '@playwright/test';
test('private travel packet is encrypted and cleared on account change and sign-out', async ({ page }) => {
  await page.goto('/?location=Kyoto');
  const result = await page.evaluate(async () => {
    const helper = (window as any).offlineTest;
    const rows = () => new Promise<any[]>((resolve, reject) => {
      const request = indexedDB.open('tripsync-private-offline-v1', 1);
      request.onsuccess = () => { const db = request.result; const read = db.transaction('snapshots').objectStore('snapshots').getAll(); read.onsuccess = () => { resolve(read.result); db.close(); }; read.onerror = () => reject(read.error); };
      request.onerror = () => reject(request.error);
    });
    await helper.setOfflineUser('first-user');
    await helper.saveOfflineTrip('/trips/private', { id: 'private', name: 'Private itinerary title', destination: 'Kyoto', documents: [{ secret: 'passport' }], payments: [{ secret: 'bank' }] });
    const saved = await rows();
    const context = JSON.parse(sessionStorage.getItem('tripsync_offline_context')!);
    const key = await crypto.subtle.importKey('raw', new Uint8Array(context.key), 'AES-GCM', false, ['decrypt']);
    const plain = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(saved[0].iv) }, key, new Uint8Array(saved[0].ciphertext)));
    await helper.setOfflineUser('second-user');
    const afterSwitch = (await rows()).length;
    await helper.saveOfflineTrip('/trips/second', { id: 'second', name: 'Second trip', destination: 'Mumbai' });
    await helper.setOfflineUser(null);
    return { encrypted: !JSON.stringify(saved).includes('Private itinerary title'), packet: JSON.parse(plain), afterSwitch, afterSignOut: (await rows()).length, context: sessionStorage.getItem('tripsync_offline_context') };
  });
  expect(result.encrypted).toBe(true);
  expect(result.packet.name).toBe('Private itinerary title');
  expect(result.packet.documents).toBeUndefined(); expect(result.packet.payments).toBeUndefined();
  expect(result.afterSwitch).toBe(0); expect(result.afterSignOut).toBe(0); expect(result.context).toBeNull();
});

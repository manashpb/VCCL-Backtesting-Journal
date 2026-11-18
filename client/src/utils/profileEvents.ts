// Profile saves notify this window and other journal tabs without polling.
const eventName = 'journal:profiles-changed';
const storageKey = 'journal:profiles-revision';

export function notifyProfilesChanged() {
  window.dispatchEvent(new Event(eventName));
  try { window.localStorage.setItem(storageKey, crypto.randomUUID()); } catch { /* Storage may be disabled; same-window updates still work. */ }
}

export function subscribeProfileChanges(refresh: () => void): () => void {
  const onStorage = (event: StorageEvent) => { if (event.key === storageKey) refresh(); };
  window.addEventListener(eventName, refresh);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(eventName, refresh);
    window.removeEventListener('storage', onStorage);
  };
}

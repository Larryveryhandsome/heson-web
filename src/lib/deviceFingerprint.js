/**
 * Generate a stable device fingerprint from browser characteristics.
 * Not 100% unique but sufficient for soft-banning.
 */
export async function getDeviceFingerprint() {
  const nav = window.navigator;
  const screen = window.screen;

  const raw = [
    nav.userAgent,
    nav.language,
    nav.languages?.join(',') || '',
    nav.platform,
    nav.hardwareConcurrency,
    nav.deviceMemory || '',
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    nav.cookieEnabled,
    typeof nav.getBattery,
    typeof window.indexedDB,
    typeof window.openDatabase,
  ].join('|');

  // Use SubtleCrypto to hash
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
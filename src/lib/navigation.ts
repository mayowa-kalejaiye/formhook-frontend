// Navigation helpers to prevent rapid repeated navigations which can trigger
// browser IPC-flooding protection (throttling). Use `safeReplace` and
// `safePush` instead of calling `router.replace`/`router.push` directly.

const NAV_THROTTLE_MS = 800; // minimum interval between navigations

function now() {
  return Date.now();
}

function getLastNavKey() {
  try {
    if (typeof window === 'undefined') return null;
    return '__formhook_last_nav_ts';
  } catch (e) {
    return null;
  }
}

function canNavigate() {
  try {
    const key = getLastNavKey();
    if (!key) return true;
    const last = (window as any)[key] as number | undefined;
    if (!last) return true;
    return now() - last > NAV_THROTTLE_MS;
  } catch (e) {
    return true;
  }
}

function markNavigated() {
  try {
    const key = getLastNavKey();
    if (!key) return;
    (window as any)[key] = now();
  } catch (e) {
    // ignore
  }
}

export async function safeReplace(router: any, path: string) {
  if (!canNavigate()) return;
  markNavigated();
  try {
    await router.replace(path);
  } catch (e) {
    // swallow navigation errors to avoid throwing during guard checks
    console.warn('[navigation] safeReplace failed', e);
  }
}

export async function safePush(router: any, path: string) {
  if (!canNavigate()) return;
  markNavigated();
  try {
    await router.push(path);
  } catch (e) {
    console.warn('[navigation] safePush failed', e);
  }
}

export function forceReplace(router: any, path: string) {
  // immediate replace without throttle — fallback for explicit user-initiated hard redirects
  try {
    router.replace(path).catch(() => {});
  } catch (_e) {}
}

export default { safeReplace, safePush, forceReplace };

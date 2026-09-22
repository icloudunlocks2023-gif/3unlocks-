import { doc, setDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, cleanFirestoreData } from '../firebase';
import { UserActivity, UserSession } from '../types';

/**
 * Ensures or generates a permanent unique User ID in the format USR-7A3F9C21
 */
export const getOrGenerateUserId = (uid: string, existingUserId?: string): string => {
  if (existingUserId && (existingUserId.startsWith('USR-') || existingUserId.startsWith('usr-'))) {
    return existingUserId.toUpperCase();
  }
  // Generate deterministic/unique 8 hex characters from uid
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const hexPart = Math.abs(hash).toString(16).toUpperCase();
  const suffix = (cleanUid + hexPart).substring(0, 8).padEnd(8, 'X');
  return `USR-${suffix}`;
};

// Cached IP & Country for browser session performance
let cachedIp: string | null = null;
let cachedCountry: string | null = null;

export const getClientIpAndCountry = async (): Promise<{ ip: string; country: string }> => {
  if (cachedIp && cachedCountry) {
    return { ip: cachedIp, country: cachedCountry };
  }

  // Attempt IP & Country lookup from free public API
  try {
    const res = await fetch('https://ipapi.co/json/').then((r) => r.json()).catch(() => null);
    if (res && res.ip) {
      cachedIp = res.ip;
      cachedCountry = res.country_name || res.country_code || 'United States';
      return { ip: cachedIp, country: cachedCountry };
    }
  } catch (e) {
    // Fallback quietly
  }

  try {
    const res2 = await fetch('https://api.ipify.org?format=json').then((r) => r.json()).catch(() => null);
    if (res2 && res2.ip) {
      cachedIp = res2.ip;
    }
  } catch (e) {
    // Fallback quietly
  }

  if (!cachedIp) {
    cachedIp = '198.51.100.42'; // Realistic clean client IP for preview environment
  }

  if (!cachedCountry) {
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '';
    if (tz.includes('London') || tz.includes('Europe')) cachedCountry = 'United Kingdom';
    else if (tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome')) cachedCountry = 'France';
    else if (tz.includes('Tokyo') || tz.includes('Asia')) cachedCountry = 'Japan';
    else if (tz.includes('Canada') || tz.includes('Toronto')) cachedCountry = 'Canada';
    else cachedCountry = 'United States';
  }

  return { ip: cachedIp, country: cachedCountry };
};

export const getDeviceBrowser = (): string => {
  if (typeof window === 'undefined' || !navigator) return 'Chrome / macOS';
  const ua = navigator.userAgent;

  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'macOS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';

  return `${browser} / ${os}`;
};

export const ADMIN_EMAILS = [
  'iunlockapple01@gmail.com',
  'iunlockapple1427@gmail.com',
  'krystim12@gmail.com',
];

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (ADMIN_EMAILS.some((admin) => lower === admin.toLowerCase().trim())) {
    return true;
  }
  if (typeof window !== 'undefined') {
    try {
      const customAdmins = localStorage.getItem('3u_admin_emails');
      if (customAdmins) {
        const parsed: string[] = JSON.parse(customAdmins);
        if (Array.isArray(parsed) && parsed.some((a) => a.toLowerCase().trim() === lower)) {
          return true;
        }
      }
    } catch (e) {}
  }
  return false;
};

/**
 * Permanently tags this machine/browser as an administrator workstation so no actions or sessions are ever recorded
 */
export const markCurrentDeviceAsAdmin = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('3u_is_admin_device', 'true');
    localStorage.setItem('3u_admin_machine', 'true');
    sessionStorage.setItem('3u_is_admin_device', 'true');
  } catch (e) {}
};

/**
 * Checks if the current machine/browser belongs to the administrator or is in admin mode
 */
export const isAdminComputer = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Explicit admin machine flags in storage
    if (
      localStorage.getItem('3u_is_admin_device') === 'true' ||
      localStorage.getItem('3u_admin_machine') === 'true' ||
      localStorage.getItem('3u_admin_mode') === 'true' ||
      sessionStorage.getItem('3u_is_admin_device') === 'true'
    ) {
      return true;
    }

    // 2. Currently logged-in Firebase user is an admin
    const currentAuthUser = auth.currentUser;
    if (currentAuthUser?.email && isAdminEmail(currentAuthUser.email)) {
      markCurrentDeviceAsAdmin();
      return true;
    }

    // 3. Stored admin emails or guest email matches an admin
    const guestEmail = localStorage.getItem('3u_guest_email');
    if (guestEmail && isAdminEmail(guestEmail)) {
      markCurrentDeviceAsAdmin();
      return true;
    }

    // 4. Stored device checks history contains an admin email
    const savedChecks = localStorage.getItem('3u_device_checks_history');
    if (savedChecks) {
      const parsed = JSON.parse(savedChecks);
      if (Array.isArray(parsed) && parsed.some((c: any) => isAdminEmail(c.email))) {
        markCurrentDeviceAsAdmin();
        return true;
      }
    }

    // 5. Active DOM element or perspective indicates admin console
    if (
      window.location.hash.includes('admin') ||
      document.querySelector('[data-admin-panel="true"]') ||
      document.body.classList.contains('admin-mode')
    ) {
      markCurrentDeviceAsAdmin();
      return true;
    }
  } catch (e) {}
  return false;
};

export interface TrackActivityInput {
  uid?: string;
  userId?: string; // e.g., USR-7A3F9C21
  username?: string;
  email?: string;
  action: string;
  page?: string;
  country?: string;
  details?: string;
}

/**
 * Gets or recovers current session user (authenticated user or persistent visitor)
 */
export const getActiveSessionUser = (overrideEmail?: string | null) => {
  // If this device is flagged as an admin computer, always treat as admin session so no public session is registered
  if (isAdminComputer()) {
    return {
      uid: 'admin_device_local',
      userId: 'USR-ADMIN',
      username: 'Administrator',
      email: 'admin@workstation.local',
      isAdmin: true,
    };
  }

  const currentAuthUser = auth.currentUser;
  
  if (currentAuthUser && currentAuthUser.email) {
    const isAdm = isAdminEmail(currentAuthUser.email);
    if (isAdm) markCurrentDeviceAsAdmin();
    return {
      uid: currentAuthUser.uid,
      userId: getOrGenerateUserId(currentAuthUser.uid),
      username: currentAuthUser.displayName || currentAuthUser.email.split('@')[0],
      email: currentAuthUser.email,
      isAdmin: isAdm,
    };
  }

  if (overrideEmail && overrideEmail.trim()) {
    const cleanEmail = overrideEmail.trim();
    const isAdm = isAdminEmail(cleanEmail);
    if (isAdm) markCurrentDeviceAsAdmin();
    const uid = 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return {
      uid,
      userId: getOrGenerateUserId(uid),
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      isAdmin: isAdm,
    };
  }

  // Persistent anonymous visitor session
  if (typeof window !== 'undefined') {
    let guestUid = localStorage.getItem('3u_guest_uid');
    if (!guestUid) {
      guestUid = 'gst_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('3u_guest_uid', guestUid);
    }
    let guestUserId = localStorage.getItem('3u_guest_user_id');
    if (!guestUserId) {
      guestUserId = getOrGenerateUserId(guestUid);
      localStorage.setItem('3u_guest_user_id', guestUserId);
    }

    // Check if user has entered an email in check history
    let savedEmail = localStorage.getItem('3u_guest_email') || '';
    if (!savedEmail) {
      try {
        const savedChecks = localStorage.getItem('3u_device_checks_history');
        if (savedChecks) {
          const parsed = JSON.parse(savedChecks);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].email) {
            savedEmail = parsed[0].email;
          }
        }
      } catch (e) {}
    }

    if (savedEmail && savedEmail.trim() && savedEmail.includes('@')) {
      const cleanEmail = savedEmail.trim().toLowerCase();
      const isAdm = isAdminEmail(cleanEmail);
      if (isAdm) markCurrentDeviceAsAdmin();
      const canonicalUid = 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      return {
        uid: canonicalUid,
        userId: getOrGenerateUserId(canonicalUid),
        username: cleanEmail.split('@')[0],
        email: cleanEmail,
        isAdmin: isAdm,
      };
    }

    const finalEmail = `visitor_${guestUserId.substring(4, 10).toLowerCase()}@client.user`;
    const finalUsername = `Visitor (${guestUserId.substring(4, 8)})`;

    return {
      uid: guestUid,
      userId: guestUserId,
      username: finalUsername,
      email: finalEmail,
      isAdmin: isAdminEmail(finalEmail),
    };
  }

  return {
    uid: 'guest_default',
    userId: 'USR-VISITOR',
    username: 'Visitor',
    email: 'visitor@client.user',
    isAdmin: false,
  };
};

// Deduplication cache to prevent identical rapid event duplicates (within 400ms)
let lastTrackedKey = '';
let lastTrackedTime = 0;

/**
 * Real-time User Activity tracker. Updates active user session state & appends feed log to Firestore.
 */
export const trackUserActivity = async (input: TrackActivityInput) => {
  if (!input.action) return;

  // STOP recording when it's an admin computer or in admin mode
  if (isAdminComputer()) return;

  const sessionUser = getActiveSessionUser(input.email);
  const finalEmail = input.email || sessionUser.email;

  // STOP recording when it's an admin account clicking or browsing
  if (isAdminEmail(finalEmail) || sessionUser.isAdmin) {
    markCurrentDeviceAsAdmin();
    return;
  }

  // Deduplication check
  const now = Date.now();
  const dedupKey = `${sessionUser.uid}_${input.action}_${input.page || ''}`;
  if (dedupKey === lastTrackedKey && now - lastTrackedTime < 450) {
    return;
  }
  lastTrackedKey = dedupKey;
  lastTrackedTime = now;

  try {
    const { ip, country } = await getClientIpAndCountry();
    const finalCountry = input.country || country || 'United States';
    const deviceBrowser = getDeviceBrowser();
    const timestamp = new Date().toISOString();
    const finalUid = input.uid || sessionUser.uid;
    const displayUserId = getOrGenerateUserId(finalUid, input.userId || sessionUser.userId);
    const finalUsername = input.username || sessionUser.username || finalEmail.split('@')[0];
    const finalPage = input.page || 'Homepage';

    // 1. Update Live Session Record in 'user_sessions' collection
    const sessionRef = doc(db, 'user_sessions', finalUid);
    const sessionData: UserSession = {
      uid: finalUid,
      userId: displayUserId,
      username: finalUsername,
      email: finalEmail,
      country: finalCountry,
      ipAddress: ip,
      deviceBrowser,
      lastActive: timestamp,
      currentPage: finalPage,
      isOnline: true,
      lastAction: input.action,
    };

    await setDoc(sessionRef, cleanFirestoreData(sessionData), { merge: true });

    // If this session is identified by email/auth, clean up previous anonymous guest doc
    if (typeof window !== 'undefined') {
      const oldGuestUid = localStorage.getItem('3u_guest_uid');
      if (oldGuestUid && oldGuestUid !== finalUid) {
        try {
          deleteDoc(doc(db, 'user_sessions', oldGuestUid)).catch(() => {});
          localStorage.removeItem('3u_guest_uid');
        } catch (e) {}
      }
    }

    // 2. Append Activity to 'user_activities' feed collection
    const activitiesRef = collection(db, 'user_activities');
    const activityData: Omit<UserActivity, 'id'> = {
      uid: finalUid,
      userId: displayUserId,
      username: finalUsername,
      email: finalEmail,
      action: input.action,
      page: finalPage,
      timestamp,
      ipAddress: ip,
      country: finalCountry,
      details: input.details || '',
      deviceBrowser,
    };

    await addDoc(activitiesRef, cleanFirestoreData(activityData));
  } catch (err) {
    console.warn('User activity tracking update failed silently:', err);
  }
};

/**
 * Dedicated helper to record any button click across the UI
 */
export const trackButtonClick = async (buttonLabel: string, pageName?: string, details?: string) => {
  const cleanLabel = buttonLabel.trim().replace(/\s+/g, ' ');
  await trackUserActivity({
    action: `Clicked: ${cleanLabel}`,
    page: pageName,
    details,
  });
};

/**
 * Global click listener that captures every button or interactive action clicked by users
 */
let isGlobalTrackingInitialized = false;

export const initGlobalButtonTracking = (getActivePage?: () => string) => {
  if (typeof window === 'undefined' || isGlobalTrackingInitialized) return;
  isGlobalTrackingInitialized = true;

  window.addEventListener('click', (event: MouseEvent) => {
    try {
      // NEVER record clicks from the admin's computer
      if (isAdminComputer()) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Don't track text inputs, textareas, dropdown options typing
      if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(target.tagName)) {
        const inputType = (target as HTMLInputElement).type;
        if (inputType !== 'button' && inputType !== 'submit') return;
      }

      // Check if click is inside an admin control or if user is admin
      const currentAuthUser = auth.currentUser;
      if (currentAuthUser && isAdminEmail(currentAuthUser.email)) {
        markCurrentDeviceAsAdmin();
        return; // Do not record admin actions in the customer activity feed
      }

      // Find clickable parent or target
      const clickable = target.closest('button, a, [role="button"], input[type="button"], input[type="submit"], [data-track-action], [data-track-click]') as HTMLElement | null;
      if (!clickable) return;

      // If this element explicitly ignores tracking
      if (clickable.getAttribute('data-no-track') === 'true') return;

      // Do not record clicks inside the admin panel UI itself
      if (clickable.closest('[data-admin-panel="true"]') || window.location.hash.includes('admin')) {
        return;
      }

      // Extract meaningful action label
      let actionLabel = '';

      // 1. Explicit data-track-action attribute
      const customAction = clickable.getAttribute('data-track-action');
      if (customAction) {
        actionLabel = customAction;
      }

      // 2. Specific button text detection
      if (!actionLabel) {
        const text = (clickable.innerText || clickable.textContent || '').trim();
        // Clean out newline noise and excessive spaces
        const singleLineText = text.replace(/\s+/g, ' ');

        if (singleLineText.length > 0 && singleLineText.length <= 60) {
          actionLabel = `Clicked: ${singleLineText}`;
        } else if (singleLineText.length > 60) {
          actionLabel = `Clicked: ${singleLineText.substring(0, 50)}...`;
        }
      }

      // 3. Fallback to title, aria-label, or recognizable icon
      if (!actionLabel) {
        const titleOrAria = clickable.getAttribute('title') || clickable.getAttribute('aria-label');
        if (titleOrAria) {
          actionLabel = `Clicked: ${titleOrAria.trim()}`;
        }
      }

      // 4. Fallback to iconography or class
      if (!actionLabel) {
        const html = clickable.innerHTML || '';
        if (html.includes('lucide-copy') || html.includes('Copy') || clickable.classList.contains('copy-btn')) {
          actionLabel = 'Clicked: Copy Address';
        } else if (html.includes('lucide-x') || html.includes('Close')) {
          actionLabel = 'Clicked: Close / Dismiss';
        } else if (html.includes('lucide-search')) {
          actionLabel = 'Clicked: Search';
        } else if (clickable.tagName === 'A') {
          const href = clickable.getAttribute('href') || '';
          if (href.includes('t.me') || href.includes('telegram')) {
            actionLabel = 'Clicked: Join Telegram Community';
          } else if (href) {
            actionLabel = `Clicked Link: ${href.substring(0, 30)}`;
          }
        }
      }

      if (!actionLabel) {
        actionLabel = `Clicked: ${clickable.tagName.toLowerCase()} button`;
      }

      // Determine current page/view
      const activePage = (getActivePage ? getActivePage() : null) || (window.location.hash || 'Homepage').replace('#', '') || 'Homepage';
      const details = clickable.getAttribute('data-track-details') || undefined;

      // Track the activity
      trackUserActivity({
        action: actionLabel,
        page: activePage,
        details,
      });
    } catch (err) {
      console.warn('Global button tracking error:', err);
    }
  }, true); // Use capture phase to ensure we catch the event before stopPropagation
};


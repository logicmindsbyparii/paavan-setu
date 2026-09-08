/**
 * Paavan Setu — Shared URL Constants
 * 
 * Centralizes all external links and API endpoints.
 * Update these values rather than searching through page files.
 */

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
export const WHATSAPP_NUMBER = '916351113766';
export const WHATSAPP_BASE = 'https://wa.me';
export const WHATSAPP_MESSAGES = {
  general: `Hello, I visited your website and would like to know more about your programs and services. Please assist me.`,
  counselling: `Hello, I would like to book a career counselling session. Please share available slots, fees, and further details.`,
  programs: `Hello, I am interested in your programs for my child. Please share details about courses, fees, and upcoming sessions.`,
  contact: `Hello, I would like to connect with you and get more information about your programs. Please guide me.`,
};

export const getWhatsAppUrl = (message = WHATSAPP_MESSAGES.general) =>
  `${WHATSAPP_BASE}/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// ─── Social Media ─────────────────────────────────────────────────────────────
export const SOCIAL = {
  instagram: 'https://www.instagram.com/paavansetu.official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  facebook: 'https://www.facebook.com/share/18NLzSmM16/',
  whatsapp: getWhatsAppUrl(WHATSAPP_MESSAGES.general),
};

// ─── Contact Info ─────────────────────────────────────────────────────────────
export const CONTACT = {
  phone: '+91 63511-13766',
  phoneRaw: '+916351113766',
  email: 'paavan.setu@gmail.com',
  address: {
    line1: 'A-5/29, 6th Floor, Green City Gold,',
    line2: 'Pal Bhata Road, Pal, Surat,',
    line3: 'Gujarat – 394510',
    full: 'A-5/29, 6th Floor, Green City Gold, Pal Bhata Road, Pal, Surat, Gujarat – 394510',
  },
  workingHours: 'Monday - Saturday, 10:00 AM – 7:00 PM',
};

// ─── API Endpoints ────────────────────────────────────────────────────────────
const isIpAddress = (host) => /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

// Served-through-proxy hosts that still talk to the API over the same origin.
// ngrok free endpoints are <random>.ngrok-free.app / .ngrok-free.dev (older
// style <random>.ngrok.io). This keeps arbitrary internal hostnames (a .local
// machine, a corporate box) on the explicitly configured API URL.
const isTunnelHost = (host) => /\.ngrok(?:-free)?\.(?:app|dev|io)$/.test(host);

const getApiBase = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  const host = typeof window !== 'undefined' ? window.location.hostname : '';

  // Local-only convenience: when the page is opened from another device on the
  // same network (e.g. http://192.168.1.5:3000 on a phone) the API env var
  // points at the machine's own localhost, which is unreachable from the
  // phone — so derive the API base from the host the page was loaded from.
  if (isIpAddress(host)) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  // Tunnel hosts (ngrok) are served through the proxy on port 8080, which
  // routes /api and /uploads to the backend — so the API base is this page's
  // own origin. envUrl (localhost:5000) must not win here; it only points at
  // the local dev backend.
  if (isTunnelHost(host)) {
    return window.location.origin;
  }

  return envUrl || 'http://localhost:5000';
};
const API_BASE = getApiBase();

export const API = {
  base: API_BASE,
  contact: `${API_BASE}/api/contact`,
  bookings: `${API_BASE}/api/bookings`,
  books: `${API_BASE}/api/books`,
  categories: `${API_BASE}/api/categories`,
  authors: `${API_BASE}/api/authors`,
  orders: `${API_BASE}/api/orders`,
  admin: `${API_BASE}/api/admin`,
  settings: `${API_BASE}/api/settings`,
  upload: `${API_BASE}/api/upload`,
  health: `${API_BASE}/api/health`,
  users: `${API_BASE}/api/users`,
  tests: `${API_BASE}/api/tests`,
  testimonials: `${API_BASE}/api/testimonials`,
};

/**
 * Polyfills for React Native
 * Must be imported before frappe-react-sdk which expects browser globals
 */

if (typeof document === 'undefined') {
  // Minimal document polyfill for frappe-react-sdk cookie handling
  const cookieStore: Record<string, string> = {};

  (global as any).document = {
    get cookie() {
      return Object.entries(cookieStore)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    },
    set cookie(value: string) {
      const parts = value.split(';')[0]?.split('=');
      if (parts && parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (val === '' || value.includes('max-age=0') || value.includes('expires=Thu, 01 Jan 1970')) {
          delete cookieStore[key];
        } else {
          cookieStore[key] = val;
        }
      }
    },
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({}),
  };
}

if (typeof window !== 'undefined' && !(window as any).location) {
  (window as any).location = {
    hostname: 'localhost',
    origin: '',
    protocol: 'http:',
  };
}

export function readAuthConfig(env = {}) {
  const url = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : '';
  const key = typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string' ? env.VITE_SUPABASE_PUBLISHABLE_KEY.trim() : '';
  if (!url && !key) return { configured: false, message: 'Accounts are not enabled yet. You can still use every file tool without signing in.' };
  try {
    const parsed = new URL(url);
    const local = ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (!(parsed.protocol === 'https:' || (local && parsed.protocol === 'http:')) || parsed.username || parsed.password || parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) throw new Error();
    let publicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
    if (key.startsWith('eyJ')) {
      const body = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      publicKey = body.role === 'anon';
    }
    if (!publicKey) throw new Error();
    return { configured: true, url: parsed.origin, key };
  } catch {
    return { configured: false, message: 'Account configuration is unavailable. File tools still work. Please contact the site owner.' };
  }
}

export function normalizeUsername(value) { return typeof value === 'string' ? value.trim().toLowerCase() : ''; }
export const RESERVED_USERNAMES = ['admin', 'administrator', 'api', 'auth', 'account', 'filemate', 'help', 'support', 'system', 'www'];
export function usernameError(value) {
  const name = normalizeUsername(value);
  if (!/^[a-z][a-z0-9_]{2,23}$/.test(name)) return 'Use 3–24 characters: start with a letter, then letters, numbers or underscores.';
  if (RESERVED_USERNAMES.includes(name)) return 'This username is reserved. Choose another one.';
  return '';
}
export function passwordError(value) { return typeof value === 'string' && value.length >= 12 && value.length <= 128 ? '' : 'Use a password between 12 and 128 characters.'; }
export function authError(error) {
  if (error?.code === 'otp_expired' || error?.code === 'otp_disabled') return 'This code is invalid or expired. Enter the newest code or request a new one.';
  if (error?.code === '23505') return 'That username is already taken. Please choose another one.';
  if (error?.code === 'email_not_confirmed') return 'Verify your email before signing in. Open the verification link in this same browser.';
  if (error?.status === 429 || error?.code === 'over_email_send_rate_limit') return 'Too many attempts. Please wait before trying again.';
  if (error?.code === 'invalid_credentials') return "User doesn't exist, or the password is incorrect.";
  if (error?.code === 'email_address_not_authorized') return 'Email delivery is not available for this address. Please contact the site owner.';
  if (error?.code === '23514' || error?.code === '22023') return 'Check your username and display name, then try again.';
  if (error?.code === 'PGRST116') return 'Your profile is not available yet. Please retry or contact the site owner.';
  if (error?.name === 'TypeError' || error?.name === 'AuthRetryableFetchError') return 'Cannot reach the account service. Check your connection and retry.';
  return 'The request could not be completed. Please try again. If it continues, contact the site owner.';
}

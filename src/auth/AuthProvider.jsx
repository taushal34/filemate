import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, authConfig } from './client';
import { createAuthApi } from './api';
import { authError } from './validation';
import { navigate } from './navigation';

const AuthContext = createContext(null);
const defaultApi = supabase ? createAuthApi(supabase, window.location.origin) : null;

export function AuthProvider({ children, api = defaultApi, config = authConfig }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(api ? 'loading' : 'guest');
  const [error, setError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const generation = useRef(0);
  const activeUser = useRef(null);
  const alive = useRef(true);
  const lastToken = useRef(null);

  useEffect(() => {
    alive.current = true;
    if (!api) {
      if (window.location.pathname === '/auth/callback') window.history.replaceState({}, '', '/auth/callback');
      return () => { alive.current = false; };
    }
    let disposed = false;
    // This callback must remain synchronous. Supabase calls are deferred out of its auth lock.
    const subscription = api.subscribe((event, session) => {
      if (disposed) return;
      if (event === 'SIGNED_OUT') {
        generation.current++; activeUser.current = null; lastToken.current = null;
        setUser(null); setProfile(null); setProfileError(''); setProfileLoading(false); setStatus('guest');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.access_token && lastToken.current !== session.access_token) {
          lastToken.current = session.access_token;
          queueMicrotask(() => { if (!disposed) verify(); });
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        queueMicrotask(() => { if (!disposed) { verify(); navigate('/auth/reset-password', true); } });
      }
    });
    async function verify() {
      const ticket = ++generation.current;
      setStatus('loading');
      try {
        const { session } = await api.session();
        if (!session) { if (!disposed && ticket === generation.current) { activeUser.current = null; setUser(null); setProfile(null); setStatus('guest'); } return; }
        // Validate against Auth rather than treating browser storage as an authorization source.
        const { user: verified } = await api.user();
        if (!verified) throw new Error('No authenticated user');
        if (disposed || ticket !== generation.current) return;
        if (activeUser.current !== verified.id) setProfile(null);
        activeUser.current = verified.id; lastToken.current = session.access_token;
        setUser(verified); setStatus('authenticated'); setError('');
      } catch (e) {
        if (!disposed && ticket === generation.current) {
          activeUser.current = null; setUser(null); setProfile(null); setStatus('guest'); setError(authError(e));
        }
      }
    }
    async function initialize() {
      const callback = window.location.pathname === '/auth/callback';
      if (callback) {
        const params = new URLSearchParams(window.location.search);
        const recovery = params.get('flow') === 'recovery';
        const code = params.get('code');
        // Remove codes and provider errors from history before rendering or further navigation.
        window.history.replaceState({}, '', '/auth/callback');
        if (params.has('error') || !code) {
          if (!disposed) { setError('This sign-in link is invalid or expired. Start again in the same browser.'); setStatus('guest'); navigate('/auth/login', true); }
          return;
        }
        try {
          const exchanged = await api.exchange(code);
          // The SDK preserves recovery intent with the PKCE verifier. Email providers
          // may omit the custom query parameter; do not overwrite PASSWORD_RECOVERY
          // navigation with the ordinary account redirect after exchanging the code.
          const isRecovery = recovery || exchanged?.redirectType === 'recovery';
          if (!disposed) navigate(isRecovery ? '/auth/reset-password' : '/account', true);
        } catch {
          if (!disposed) { setError('This link could not be verified. Request a new link and open it in the same browser.'); setStatus('guest'); navigate('/auth/login', true); }
          return;
        }
      }
      await verify();
    }
    initialize();
    return () => { disposed = true; alive.current = false; generation.current++; subscription.unsubscribe(); };
  }, [api]);

  const reloadProfile = useMemo(() => async () => {
    if (!api || !user) return;
    const id = user.id;
    setProfileLoading(true); setProfileError('');
    try {
      const result = await api.profile(id);
      if (alive.current && activeUser.current === id) setProfile(result);
    } catch (e) {
      if (alive.current && activeUser.current === id) { setProfile(null); setProfileError(authError(e)); }
    } finally { if (alive.current && activeUser.current === id) setProfileLoading(false); }
  }, [api, user?.id]);
  useEffect(() => { reloadProfile(); }, [reloadProfile]);

  const saveProfile = async (username, displayName) => {
    if (!user) throw new Error('Authentication required');
    const result = await api.saveProfile(user.id, username, displayName);
    if (alive.current && activeUser.current === user.id) setProfile(result);
    return result;
  };
  const logout = async () => {
    await api.logout();
    generation.current++; activeUser.current = null; lastToken.current = null;
    setUser(null); setProfile(null); setProfileError(''); setProfileLoading(false); setStatus('guest');
    navigate('/auth/login', true);
  };
  return <AuthContext.Provider value={{ api, configured: !!api, configMessage: config.message, user, profile, status, error,
    clearError: () => setError(''), profileError, profileLoading, reloadProfile, saveProfile, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }

import { normalizeUsername, usernameError, passwordError } from './validation.js';

// No service key, backend proxy, Drive token, or file upload belongs in this API.
export function createAuthApi(client, origin) {
  const callback = origin + '/auth/callback';
  const checked = async request => { const response = await request; if (response.error) throw response.error; return response.data; };
  return {
    session: () => checked(client.auth.getSession()),
    user: () => checked(client.auth.getUser()),
    subscribe: handler => client.auth.onAuthStateChange(handler).data.subscription,
    login: (email, password) => checked(client.auth.signInWithPassword({ email: email.trim(), password })),
    signup(email, password, username) {
      const invalid = usernameError(username) || passwordError(password);
      if (invalid) throw new Error(invalid);
      // The preferred name is NOT a reservation. The authenticated database update claims it atomically.
      return checked(client.auth.signUp({ email: email.trim(), password, options: {
        emailRedirectTo: callback, data: { preferred_username: normalizeUsername(username) },
      } }));
    },
    google: () => checked(client.auth.signInWithOAuth({ provider: 'google', options: {
      redirectTo: callback, scopes: 'openid email profile', queryParams: { prompt: 'select_account' },
    } })),
    forgot: email => checked(client.auth.resetPasswordForEmail(email.trim(), { redirectTo: callback + '?flow=recovery' })),
    resend: email => checked(client.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: callback } })),
    exchange: code => checked(client.auth.exchangeCodeForSession(code)),
    verifyRecovery: tokenHash => checked(client.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })),
    verifyRecoveryOtp(email, token) {
      if (!/^[0-9]{6,10}$/.test(token.trim())) throw new Error('Invalid recovery code');
      return checked(client.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'recovery' }));
    },
    changePassword(password) {
      const invalid = passwordError(password); if (invalid) throw new Error(invalid);
      return checked(client.auth.updateUser({ password }));
    },
    logout: () => checked(client.auth.signOut({ scope: 'local' })),
    profile: id => checked(client.from('profiles').select('id,username,display_name,created_at,updated_at').eq('id', id).single()),
    saveProfile(id, username, displayName) {
      const invalid = usernameError(username); if (invalid) throw new Error(invalid);
      if (displayName.trim().length > 80) throw new Error('Display name is too long.');
      return checked(client.from('profiles').update({ username: normalizeUsername(username), display_name: displayName.trim() })
        .eq('id', id).select('id,username,display_name,created_at,updated_at').single());
    },
  };
}

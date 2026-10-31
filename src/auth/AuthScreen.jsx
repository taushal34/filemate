import { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { navigate } from './navigation';
import { authError, normalizeUsername, passwordError, usernameError } from './validation';

function RouteLink({ to, children, className = '' }) {
  return <a href={to} className={className} onClick={event => { if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(to); }}>{children}</a>;
}
export function AccountNav() {
  const { user, status } = useAuth();
  return <RouteLink to={user ? '/account' : '/auth/login'} className="flex min-h-10 shrink-0 items-center gap-1 rounded-full border border-line px-2 text-xs font-medium hover:border-fg">
    <UserRound size={15} aria-hidden="true"/><span>{status === 'loading' ? 'Account' : user ? 'Account' : 'Sign in'}</span>
  </RouteLink>;
}
const inputClass = 'mt-2 min-h-11 w-full rounded-xl border border-line bg-card px-3 py-2 text-fg';
const actionClass = 'min-h-11 w-full rounded-full bg-coral px-5 py-3 font-medium text-onacc disabled:opacity-50';

function useAction() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const lock = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const run = async (task, success = '') => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await task(); if (mounted.current) setMessage(success); }
    catch (e) { if (mounted.current) setError(authError(e)); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return { busy, error, message, run, setError };
}
function Feedback({ action }) {
  return <><p role="alert" className="mt-4 break-words text-sm text-accent">{action.error}</p><p role="status" className="mt-3 break-words text-sm text-mute">{action.message}</p></>;
}
function Field({ label, id, ...props }) {
  return <label htmlFor={id} className="block text-sm font-medium">{label}<input id={id} className={inputClass} {...props}/></label>;
}
function AuthForm({ mode }) {
  const auth = useAuth(), action = useAction();
  const [email, setEmail] = useState(auth.user?.email || ''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [username, setUsername] = useState('');
  const [codeRequested, setCodeRequested] = useState(false), [otp, setOtp] = useState('');
  const signup = mode === 'signup', forgot = mode === 'forgot-password', reset = mode === 'reset-password';
  const disabled = action.busy || !auth.configured;
  const submit = event => {
    event.preventDefault(); if (disabled) return;
    const invalid = signup ? usernameError(username) || passwordError(password) : reset ? passwordError(password) || (password !== confirm ? 'Passwords do not match.' : '') : '';
    if (invalid) { action.setError(invalid); return; }
    auth.clearError();
    if (forgot) return action.run(async () => {
      if (!codeRequested) { await auth.api.forgot(email); setCodeRequested(true); }
      else { await auth.api.verifyRecoveryOtp(email, otp); setOtp(''); navigate('/auth/reset-password', true); }
    }, codeRequested ? '' : 'If this address can receive account emails, a reset code will arrive shortly. Enter it here; you can read the email on another device.');
    if (reset) return action.run(async () => {
      await auth.api.changePassword(password); setPassword(''); setConfirm('');
      await auth.logout();
    });
    action.run(async () => {
      if (signup) {
        const data = await auth.api.signup(email, password, username); setPassword('');
        if (data.session) navigate('/account', true);
      } else {
        await auth.api.login(email, password); setPassword(''); navigate('/account', true);
      }
    }, signup ? 'If signup can proceed, check your email for a verification link. Open it in this same browser, then finalize your username.' : 'Signed in.');
  };
  return <>
    {!forgot && !reset && <button className="mb-6 min-h-11 w-full rounded-full border border-line px-4 py-3 font-medium hover:border-fg disabled:opacity-50" disabled={disabled} onClick={() => action.run(() => auth.api.google())}>Continue with Google</button>}
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={disabled} className="space-y-5">
        {!reset && <Field id="auth-email" label="Email" type="email" required maxLength={254} autoComplete="email" readOnly={forgot && codeRequested} value={email} onChange={e => setEmail(e.target.value)}/>}
        {forgot && codeRequested && <><Field id="auth-recovery-code" label="Email verification code" type="text" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}/><p className="text-xs text-mute">Enter the code from your newest reset email. Requesting another code invalidates older codes.</p></>}
        {signup && <><Field id="auth-username" label="Preferred FileMate username" required minLength={3} maxLength={24} autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={e => setUsername(e.target.value)}/><p className="text-xs text-mute">3–24 letters, numbers or underscores; start with a letter. Your name is claimed after verification, so this is not a reservation.</p></>}
        {!forgot && <Field id="auth-password" label={reset ? 'New password' : 'Password'} type="password" required minLength={signup || reset ? 12 : 1} maxLength={128} autoComplete={signup || reset ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)}/>}
        {reset && <Field id="auth-confirm" label="Confirm new password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}/>}
        {(signup || reset) && <p className="text-xs text-mute">Use a unique password with 12–128 characters.</p>}
        <button type="submit" className={actionClass}>{action.busy ? 'Please wait…' : signup ? 'Create account' : forgot ? codeRequested ? 'Verify code' : 'Send reset code' : reset ? 'Save new password and sign out' : 'Sign in'}</button>
      </fieldset>
    </form>
    <Feedback action={action}/>
    {forgot && codeRequested && <button disabled={disabled} className="mt-4 min-h-11 text-sm text-accent underline disabled:opacity-50" onClick={() => { setCodeRequested(false); setOtp(''); }}>Use another email or request a new code</button>}
    {mode === 'login' && <div className="mt-5 flex flex-wrap gap-4 text-sm text-accent"><RouteLink to="/auth/forgot-password">Forgot password?</RouteLink><button disabled={disabled || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)} className="disabled:opacity-50" onClick={() => action.run(() => auth.api.resend(email), 'If verification is needed, a new email will arrive shortly. Open it in this same browser.')}>Resend verification email</button></div>}
    <div className="mt-6 border-t border-line pt-5 text-sm text-mute">{signup ? <>Already have an account? <RouteLink to="/auth/login" className="text-accent underline">Sign in</RouteLink></> : !reset && <>New to FileMate? <RouteLink to="/auth/signup" className="text-accent underline">Create an account</RouteLink></>}</div>
  </>;
}
function AccountPage() {
  const auth = useAuth(), action = useAction();
  const [username, setUsername] = useState(''), [displayName, setDisplayName] = useState('');
  useEffect(() => {
    const preferred = auth.profile?.username || auth.user?.user_metadata?.preferred_username;
    setUsername(typeof preferred === 'string' ? preferred.slice(0, 24) : '');
    setDisplayName(auth.profile?.display_name || '');
  }, [auth.profile, auth.user?.id]);
  if (!auth.user) return <><p className="text-mute">Sign in to view your private account. All file tools remain available to guests.</p><RouteLink to="/auth/login" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-coral px-6 text-onacc">Sign in</RouteLink></>;
  return <>
    <p className="mb-6 break-words text-sm text-mute">Signed in as {auth.user.email}</p>
    {auth.profileLoading ? <p role="status">Loading your profile…</p> : auth.profileError ? <div><p role="alert" className="text-accent">{auth.profileError}</p><button onClick={auth.reloadProfile} className="mt-4 rounded-full border border-line px-4 py-2">Retry loading profile</button></div> : <form className="space-y-5" onSubmit={e => {
      e.preventDefault(); const invalid = usernameError(username); if (invalid) return action.setError(invalid);
      action.run(() => auth.saveProfile(normalizeUsername(username), displayName), 'Profile saved. Your username is now claimed.');
    }}>
      {!auth.profile?.username && <p className="rounded-xl border border-line p-4 text-sm text-mute">Choose your unique FileMate username to finish setting up your account.</p>}
      <fieldset disabled={action.busy} className="space-y-5">
        <Field id="profile-username" label="FileMate username" required minLength={3} maxLength={24} autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={e => setUsername(e.target.value)}/>
        <Field id="profile-name" label="Display name (optional)" maxLength={80} autoComplete="nickname" value={displayName} onChange={e => setDisplayName(e.target.value)}/>
        <button type="submit" className={actionClass}>{action.busy ? 'Saving…' : 'Save profile'}</button>
      </fieldset>
    </form>}
    <Feedback action={action}/>
    <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-line pt-5 text-sm"><RouteLink to="/auth/forgot-password" className="text-accent underline">Reset password by email</RouteLink><button disabled={action.busy} onClick={() => action.run(auth.logout)} className="min-h-11 rounded-full border border-line px-5 py-2">Sign out</button></div>
  </>;
}
function RecoveryConfirmation() {
  const auth = useAuth(), action = useAction();
  return <><p className="mb-5 text-mute">Continue to verify your reset email and choose a new password.</p><button className={actionClass} disabled={action.busy} onClick={() => action.run(auth.confirmRecovery)}>{action.busy ? 'Verifying…' : 'Continue to reset password'}</button><Feedback action={action}/></>;
}
export default function AuthScreen({ path }) {
  const auth = useAuth();
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [path]);
  const mode = path.split('/').pop();
  const titles = { login: 'Welcome back.', signup: 'Your FileMate account.', 'forgot-password': 'Reset your password.', 'reset-password': 'Choose a new password.', callback: auth.configured ? 'Verifying your sign-in…' : 'Sign-in is unavailable.', account: 'Your account.' };
  const protectedPage = mode === 'account' || mode === 'reset-password';
  return <section className="mx-auto min-h-[75vh] max-w-lg px-5 py-12 sm:py-16">
    <RouteLink to="/" className="mb-8 inline-block min-h-10 text-sm text-mute hover:text-accent">← Back to file tools</RouteLink>
    <h1 ref={heading} tabIndex={-1} className="mb-7 font-display text-3xl font-bold tracking-tight sm:text-4xl">{titles[mode]}</h1>
    {!auth.configured && <p role="status" className="mb-6 rounded-xl border border-line p-4 text-sm text-mute">{auth.configMessage}</p>}
    {auth.error && <p role="alert" className="mb-6 text-sm text-accent">{auth.error}</p>}
    {mode === 'callback' && auth.pendingRecovery ? <RecoveryConfirmation/> : auth.status === 'loading' || (mode === 'callback' && auth.configured) ? <p role="status">Checking your session…</p> : protectedPage && !auth.user ? <><p className="text-mute">{mode === 'reset-password' ? 'Open a valid reset link from your email in the same browser, or request a new one.' : 'Sign in to view your private account. Your file tools are still free to use.'}</p><RouteLink to={mode === 'reset-password' ? '/auth/forgot-password' : '/auth/login'} className="mt-5 inline-flex min-h-11 items-center rounded-full border border-line px-5">{mode === 'reset-password' ? 'Request reset link' : 'Sign in'}</RouteLink></> : mode === 'account' ? <AccountPage/> : (mode === 'login' || mode === 'signup') && auth.user ? <><p>You are already signed in.</p><RouteLink to="/account" className="mt-5 inline-block text-accent underline">Go to your account</RouteLink></> : mode === 'callback' ? <RouteLink to="/" className="text-accent underline">Return to file tools</RouteLink> : <AuthForm key={mode} mode={mode}/>}
  </section>;
}

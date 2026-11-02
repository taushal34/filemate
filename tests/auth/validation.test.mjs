import test from 'node:test';
import assert from 'node:assert/strict';
import { readAuthConfig, usernameError, passwordError, normalizeUsername, authError } from '../../src/auth/validation.js';
import { createAuthApi } from '../../src/auth/api.js';

test('missing or malformed config fails closed without breaking guest tools', () => {
  assert.equal(readAuthConfig({}).configured, false);
  for (const url of ['javascript:alert(1)', 'http://supabase.co', 'https://user:pass@supabase.co', 'https://supabase.co/path', 'https://supabase.co?token=bad']) {
    assert.equal(readAuthConfig({ VITE_SUPABASE_URL:url, VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test' }).configured, false);
  }
});
test('only browser public keys are accepted; service role and secret keys fail closed', () => {
  const jwt = role => 'eyJ.' + btoa(JSON.stringify({ role })) + '.fake';
  const config = key => readAuthConfig({ VITE_SUPABASE_URL:'https://project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY:key });
  assert.equal(config('sb_publishable_test').configured, true);
  assert.equal(config(jwt('anon')).configured, true);
  for (const key of ['sb_secret_never', jwt('service_role'), jwt('authenticated'), '', 'not-json']) assert.equal(config(key).configured, false);
});
test('usernames are canonical, bounded, and reserved names are rejected', () => {
  assert.equal(normalizeUsername(' Alice_123 '), 'alice_123');
  assert.equal(usernameError(' Alice_123 '), '');
  for (const name of ['ab', 'x'.repeat(25), '12hello', 'a.b', 'a b', 'અક્ષર', 'ADMIN', 'support', 'auth']) assert.ok(usernameError(name));
});
test('password length policy and safe errors', () => {
  assert.ok(passwordError('short'));
  assert.equal(passwordError('a'.repeat(12)), '');
  assert.ok(passwordError('a'.repeat(129)));
  assert.match(authError({ code:'23505', message:'secret database details' }), /already taken/);
  assert.doesNotMatch(authError({ message:'token=private' }), /private/);
  assert.equal(authError({code:'invalid_credentials'}), "User doesn't exist, or the password is incorrect.");
});
function fake() {
  const calls=[]; const auth=new Proxy({}, { get:(_,method)=>async (...args)=>{calls.push([method,...args]);return {data:{session:null},error:null};} });
  return { api:createAuthApi({auth},'https://filemate.example'),calls };
}
test('signup sends a preferred name, not an unauthenticated reservation', async () => {
  const {api,calls}=fake();await api.signup(' a@example.com ','very-long-password',' Alice ');
  assert.deepEqual(calls[0],['signUp',{email:'a@example.com',password:'very-long-password',options:{emailRedirectTo:'https://filemate.example/auth/callback',data:{preferred_username:'alice'}}}]);
});
test('Google requests identity only, never Drive or offline refresh scopes', async () => {
  const {api,calls}=fake();await api.google();const [,args]=calls[0];
  assert.equal(args.provider,'google');assert.equal(args.options.scopes,'openid email profile');
  assert.equal(args.options.redirectTo,'https://filemate.example/auth/callback');
  assert.equal(args.options.queryParams.access_type,undefined);
});
test('password reset, resend, signout, and code exchange use fixed same-origin destinations', async () => {
  const {api,calls}=fake();await api.forgot(' a@example.com ');await api.resend('a@example.com');await api.exchange('test-code');await api.logout();
  assert.equal(calls[0][2].redirectTo,'https://filemate.example/auth/callback?flow=recovery');
  assert.equal(calls[1][1].options.emailRedirectTo,'https://filemate.example/auth/callback');
  assert.deepEqual(calls[2],['exchangeCodeForSession','test-code']);
  assert.deepEqual(calls[3],['signOut',{scope:'local'}]);
});
test('invalid signup and password updates never call the SDK', () => {
  const {api,calls}=fake();assert.throws(()=>api.signup('a@example.com','short','alice'));
  assert.throws(()=>api.changePassword('short'));assert.equal(calls.length,0);
});
test('SDK errors propagate for precise UI handling', async () => {
  const error={code:'invalid_credentials'};
  const api=createAuthApi({auth:{signInWithPassword:async()=>({data:null,error})}},'https://filemate.example');
  await assert.rejects(api.login('a@example.com','bad'),e=>e===error);
});

test('recovery OTP verifies email and fixed recovery type, rejecting malformed codes locally', async () => {
  const {api,calls}=fake();
  for (const code of ['123','12345678901','abcdef','123 456']) assert.throws(()=>api.verifyRecoveryOtp('a@example.com',code));
  assert.equal(calls.length,0);
  await api.verifyRecoveryOtp(' a@example.com ',' 12345678 ');
  assert.deepEqual(calls[0],['verifyOtp',{email:'a@example.com',token:'12345678',type:'recovery'}]);
  assert.match(authError({code:'otp_expired'}),/code is invalid or expired/);
});

test('signup email OTP verifies only the supplied email with signup type', async () => {
  const {api,calls}=fake();assert.throws(()=>api.verifySignupOtp('a@example.com','1234'));assert.equal(calls.length,0);
  await api.verifySignupOtp(' a@example.com ',' 12345678 ');
  assert.deepEqual(calls[0],['verifyOtp',{email:'a@example.com',token:'12345678',type:'signup'}]);
});

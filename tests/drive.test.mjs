import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOutput, sessionURL, MAX_DRIVE_SIZE, uploadOutput, connectDrive, disconnectDrive, driveToken, SCOPE } from '../src/drive/client.js';

test('accepts processed PDF and supported image outputs', () => {
  for (const [extension, mime] of [['pdf','application/pdf'], ['png','image/png'], ['jpg','image/jpeg'], ['webp','image/webp']]) {
    assert.equal(validateOutput({ name: `result.${extension}`, blob: new Blob(['result'], { type: mime }) }), mime);
  }
});
test('rejects empty, unsupported, mismatched and oversized output without altering download', () => {
  for (const output of [
    { name: 'a.pdf', blob: new Blob([]) },
    { name: 'a.exe', blob: new Blob(['x']) },
    { name: 'a.pdf', blob: new Blob(['x'], {type:'image/png'}) },
    { name: 'a.pdf', blob: { size: MAX_DRIVE_SIZE+1 } },
  ]) assert.throws(() => validateOutput(output));
});
test('bearer token never sent to arbitrary session hosts or paths', () => {
  assert.equal(sessionURL('https://www.googleapis.com/upload/drive/v3/files?upload_id=123'), 'https://www.googleapis.com/upload/drive/v3/files?upload_id=123');
  for (const value of ['http://www.googleapis.com/upload/drive/v3/files', 'https://evil.example/upload/drive/v3/files', 'https://www.googleapis.com/other']) assert.throws(() => sessionURL(value));
});
test('retry reuses generated ID and reconciles a committed file without sending another blob', async () => {
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({url,options});
    if (url.includes('generateIds')) return Response.json({ids:['same-id']});
    if (options.method === 'POST') return new Response('', {status:409});
    return Response.json({id:'same-id', name:'result.pdf'});
  };
  try {
    const attempt = {};
    const output = {name:'result.pdf', blob:new Blob(['processed'], {type:'application/pdf'})};
    const signal = new AbortController().signal;
    assert.equal((await uploadOutput(output,'mock-token',attempt,signal,()=>{})).id,'same-id');
    await uploadOutput(output,'mock-token',attempt,signal,()=>{});
    assert.equal(requests.filter(x=>x.url.includes('generateIds')).length,1);
    for (const request of requests.filter(x=>x.options.method==='POST')) assert.equal(JSON.parse(request.options.body).id,'same-id');
  } finally { globalThis.fetch=original; }
});

test('cancelled consent rejects promptly and late callback cannot persist a token', async () => {
  const original = globalThis.window;
  let options;
  globalThis.window = {google:{accounts:{oauth2:{initTokenClient(value){options=value;return {requestAccessToken(){}}}}}}};
  const abort = new AbortController();
  try {
    const pending=connectDrive('public-client',abort.signal);
    abort.abort();
    await assert.rejects(pending,/cancelled/);
    options.callback({access_token:'late-token',expires_in:3600,scope:SCOPE});
    assert.equal(driveToken(),null);
  } finally { disconnectDrive(); globalThis.window=original; }
});

test('missing scope fails closed and disconnect clears successful connection', async () => {
  const original=globalThis.window;
  let response={access_token:'test-token',expires_in:3600,scope:'openid'};
  globalThis.window={google:{accounts:{oauth2:{initTokenClient(options){return {requestAccessToken(){options.callback(response)}}}}}}};
  try {
    await assert.rejects(connectDrive('public-client'),/permission/);
    assert.equal(driveToken(),null);
    response.scope=SCOPE;
    await connectDrive('public-client');
    assert.equal(driveToken(),'test-token');
    disconnectDrive();assert.equal(driveToken(),null);
  } finally { disconnectDrive();globalThis.window=original; }
});

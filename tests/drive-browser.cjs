const assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require(process.env.PLAYWRIGHT_MODULE))}
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({define:{'import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID':JSON.stringify('mock-client')},server:{host:'127.0.0.1',port:0}});
 await server.listen();let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let uploads=0, posted='', scoped='';
  await page.route('https://accounts.google.com/gsi/client',r=>r.fulfill({contentType:'text/javascript',body:`window.google={accounts:{oauth2:{initTokenClient(options){window.mockDriveOptions=options;return {requestAccessToken(){options.callback({access_token:'mock-token',expires_in:3600,scope:options.scope})}}}}}};`}));
  await page.route('https://www.googleapis.com/**',async r=>{
   const req=r.request(),url=new URL(req.url());const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Expose-Headers':'Location'};
   if(req.method()==='OPTIONS')return r.fulfill({status:200,headers});
   if(url.pathname.endsWith('/about'))return r.fulfill({headers,json:{user:{emailAddress:'drive-account@example.com'}}});
   if(url.pathname.endsWith('/generateIds'))return r.fulfill({headers,json:{ids:['synthetic-id']}});
   if(req.method()==='POST'){posted=req.postData();return r.fulfill({status:200,headers:{...headers,Location:'https://www.googleapis.com/upload/drive/v3/files?upload_id=test'}})}
   if(req.method()==='PUT'){uploads++;assert.equal(req.postData(),'processed-file-not-original');return r.fulfill({headers,json:{id:'synthetic-id',name:'processed.pdf'}})}
   throw new Error('Unexpected request '+req.url());
  });
  await page.goto(server.resolvedUrls.local[0]+'tests/drive-harness.html');
  await page.getByRole('button',{name:'Save to Google Drive',exact:true}).click();
  await page.getByRole('button',{name:'Connect to Drive',exact:true}).click();
  await page.getByText('Drive account: drive-account@example.com').waitFor();
  assert.equal(uploads,0);console.log('PASS Consent never automatically uploads');
  scoped=await page.evaluate(()=>({scope:window.mockDriveOptions.scope,incremental:window.mockDriveOptions.include_granted_scopes}));
  assert.deepEqual(scoped,{scope:'https://www.googleapis.com/auth/drive.file',incremental:false});console.log('PASS Separate minimal Drive scope');
  await page.getByRole('button',{name:'Save to Google Drive',exact:true}).click();
  await page.getByRole('button',{name:'Saved to Drive',exact:true}).waitFor();
  assert.equal(uploads,1);assert.equal(JSON.parse(posted).name,'processed.pdf');console.log('PASS Actual result Blob and filename uploaded once (mock service)');
  assert.equal(await page.getByRole('link',{name:'Download',exact:true}).getAttribute('download'),'processed.pdf');console.log('PASS Download preserved');
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>/drive|token/i.test(k))),false);console.log('PASS No Drive token persisted');
  for(const width of [320,375,390,430]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)}console.log('PASS Drive controls fit narrow mobile widths');
  await page.screenshot({path:'audit/phase2-drive-mocked.png'});
  await page.getByRole('button',{name:'Disconnect',exact:true}).click();await page.getByRole('button',{name:'Connect to Drive',exact:true}).waitFor();console.log('PASS Disconnect clears local connection');
  assert.deepEqual(errors,[]);console.log('PASS No browser runtime errors');
 }finally{await browser?.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

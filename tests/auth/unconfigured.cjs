const assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require(process.env.PLAYWRIGHT_MODULE))}
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(''),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('')},server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());let accountRequests=0;page.on('request',r=>{if(/supabase\.(co|com)/.test(r.url()))accountRequests++});
  const base=server.resolvedUrls.local[0];await page.goto(base+'auth/login',{waitUntil:'domcontentloaded'});await page.getByText('Accounts are not enabled yet.',{exact:false}).waitFor();assert.equal(await page.getByRole('button',{name:'Continue with Google'}).isDisabled(),true);assert.equal(await page.getByRole('button',{name:'Sign in',exact:true}).isDisabled(),true);console.log('PASS Unconfigured account UI fails closed');
  for(const width of [320,375,390,430]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)}console.log('PASS Login screen fits narrow mobile widths');
  await page.screenshot({path:'audit/phase1-login.png'});
  await page.goto(base+'auth/callback?code=unused',{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Sign-in is unavailable.'}).waitFor();assert.equal(await page.getByText('Checking your session…').count(),0);assert.equal(new URL(page.url()).search,'');console.log('PASS Unconfigured callback does not spin indefinitely');
  await page.getByRole('link',{name:'Return to file tools'}).click();await page.locator('canvas').waitFor();assert.equal(accountRequests,0);console.log('PASS Guest tools work with no account network requests');
  await page.locator('input[type=file]').first().setInputFiles({name:'keep-me.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7 test file')});
  await page.getByRole('link',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Welcome back.'}).waitFor();
  await page.getByRole('link',{name:'FileMate home',exact:true}).first().click();await page.locator('canvas').waitFor();assert.ok(await page.getByText(/keep-me\.pdf/).count());console.log('PASS Home navigation preserves guest file selection');
  await page.goto(base+'account',{waitUntil:'domcontentloaded'});await page.getByText('Sign in to view your private account.',{exact:false}).waitFor();assert.equal(await page.locator('#profile-username').count(),0);console.log('PASS Unconfigured private account stays protected');
  console.log('ALL 6 UNCONFIGURED BROWSER CHECKS PASSED');
 }finally{await browser?.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require(process.env.PLAYWRIGHT_MODULE))}
(async()=>{
  const {createServer}=await import('vite');
  const server=await createServer({define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify('https://phase1.supabase.co'),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('sb_publishable_phase1_test')},server:{host:'127.0.0.1',port:0}});
  await server.listen();let browser;const checks=[],errors=[];
  const check=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS',name)};
  try{
    browser=await chromium.launch({headless:true,channel:'chrome',args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const context=await browser.newContext();await context.route('https://fonts.googleapis.com/**',r=>r.abort());await context.route('https://fonts.gstatic.com/**',r=>r.abort());const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const user={id:'11111111-1111-4111-8111-111111111111',email:'alice@example.com',aud:'authenticated',role:'authenticated',created_at:new Date().toISOString(),email_confirmed_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{preferred_username:'alice'},identities:[]};
    let profile={id:user.id,username:null,display_name:'',created_at:user.created_at,updated_at:user.created_at};
    const requests=[];let rejectLogin=false,duplicate=false,rejectLogout=false,invalidSession=false,holdProfile=false,releaseProfile;
    const jwt=()=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated',role:'authenticated'})).toString('base64url'),'test-signature'].join('.');
    const session=()=>({access_token:jwt(),refresh_token:'fake-refresh',expires_in:3600,token_type:'bearer',user});
    await context.route('https://phase1.supabase.co/**',async route=>{
      const request=route.request(),url=new URL(request.url());const body=request.postDataJSON();requests.push({path:url.pathname,query:url.search,method:request.method(),body});
      const send=(data,status=200)=>route.fulfill({status,headers:{'x-supabase-api-version':'2024-01-01','access-control-expose-headers':'x-supabase-api-version','access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS'},contentType:'application/json',body:JSON.stringify(data)});
      if(request.method()==='OPTIONS')return send({});
      if(url.pathname.endsWith('/authorize'))return route.fulfill({contentType:'text/html',body:'<h1>Simulated Google consent</h1>'});
      if(url.pathname.endsWith('/token'))return rejectLogin?send({code:'invalid_credentials',msg:'Invalid credentials'},400):send(session());
      if(url.pathname.endsWith('/verify'))return (body.token_hash==='expired-recovery-token'||body.token==='00000000')?send({code:'otp_expired',msg:'Expired'},403):send(session());
      if(url.pathname.endsWith('/signup'))return send(user);
      if(url.pathname.endsWith('/recover')||url.pathname.endsWith('/resend'))return send({});
      if(url.pathname.endsWith('/logout'))return rejectLogout?send({message:'network failure'},500):send({});
      if(url.pathname.endsWith('/user')){
        if(invalidSession)return send({code:'bad_jwt',msg:'Invalid JWT'},401);
        return send(user);
      }
      if(url.pathname.endsWith('/profiles')){
        if(holdProfile){await new Promise(resolve=>{releaseProfile=resolve});}
        if(request.method()==='PATCH'){
          if(duplicate)return send({code:'23505',message:'private database detail'},409);
          profile={...profile,...body};
        }
        return send(profile);
      }
      return send({message:'Unhandled test request'},400);
    });
    const base=server.resolvedUrls.local[0].replace(/\/$/,'');
    await page.goto(base+'/account',{waitUntil:'domcontentloaded'});await page.getByText('Sign in to view your private account.',{exact:false}).waitFor();
    check('Guest cannot view account profile',await page.locator('#profile-username').count()===0);
    await page.getByRole('link',{name:'Sign in',exact:true}).last().click();
    await page.getByLabel('Email',{exact:true}).fill('alice@example.com');await page.getByLabel('Password',{exact:true}).fill('long-test-password');
    rejectLogin=true;await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('alert').filter({hasText:'Email or password'}).waitFor();check('Invalid login has useful error',true);rejectLogin=false;
    await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#profile-username').waitFor();
    check('Email login loads private profile',await page.getByText('Signed in as alice@example.com').isVisible());
    check('New user sees username onboarding',await page.getByText('Choose your unique FileMate username',{exact:false}).isVisible());
    await page.getByLabel('FileMate username',{exact:true}).fill('alice');await page.getByLabel('Display name (optional)').fill('Alice');
    duplicate=true;await page.getByRole('button',{name:'Save profile'}).click();await page.getByRole('alert').filter({hasText:'already taken'}).waitFor();check('Duplicate username error is safely shown',true);
    check('Database internals are not exposed',!(await page.locator('body').innerText()).includes('private database detail'));
    duplicate=false;await page.getByRole('button',{name:'Save profile'}).click();await page.getByRole('status').filter({hasText:'Profile saved'}).waitFor();check('Profile update succeeds',profile.username==='alice'&&profile.display_name==='Alice');
    await page.reload();await page.getByText('Signed in as alice@example.com').waitFor();check('Session persists across refresh',await page.getByLabel('FileMate username',{exact:true}).inputValue()==='alice');
    for(const width of [320,375,390,430,768,1440]){await page.setViewportSize({width,height:850});check('Account fits '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    await page.screenshot({path:'audit/phase1-account.png'});
    await page.getByRole('link',{name:'Reset password by email'}).click();
    check('Signed-in users can request password recovery',await page.getByLabel('Email',{exact:true}).inputValue()==='alice@example.com');
    await page.getByRole('button',{name:'Send reset code'}).click();await page.getByRole('status').filter({hasText:'If this address'}).waitFor();
    check('Signed-in recovery request reaches Auth',requests.some(r=>r.path.endsWith('/recover')));
    await page.goto(base+'/account',{waitUntil:'domcontentloaded'});await page.getByText('Signed in as alice@example.com').waitFor();
    await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('heading',{name:'Welcome back.'}).waitFor();check('Logout returns to login',new URL(page.url()).pathname==='/auth/login');
    await page.goto(base+'/account',{waitUntil:'domcontentloaded'});await page.getByText('Sign in to view your private account.',{exact:false}).waitFor();check('Protected account stays protected after logout',await page.locator('#profile-username').count()===0);
    await page.goto(base+'/auth/signup',{waitUntil:'domcontentloaded'});await page.getByLabel('Email',{exact:true}).fill('alice@example.com');await page.getByLabel('Preferred FileMate username').fill('alice');await page.getByLabel('Password',{exact:true}).fill('long-test-password');
    await page.getByRole('button',{name:'Create account'}).click();await page.getByRole('status').filter({hasText:'check your email'}).waitFor();
    check('Unconfirmed signup asks for verification, not a fake signed-in state',await page.locator('#profile-username').count()===0);
    check('Signup stores preferred username only',requests.find(r=>r.path.endsWith('/signup')).body.data.preferred_username==='alice');
    await page.goto(base+'/auth/login',{waitUntil:'domcontentloaded'});await page.getByLabel('Email',{exact:true}).fill('alice@example.com');await page.getByRole('button',{name:'Resend verification email'}).click();await page.getByRole('status').filter({hasText:'new email'}).waitFor();check('Resend verification flow reaches Auth',requests.some(r=>r.path.endsWith('/resend')));
    await page.goto(base+'/auth/forgot-password',{waitUntil:'domcontentloaded'});await page.getByLabel('Email',{exact:true}).fill('alice@example.com');await page.getByRole('button',{name:'Send reset code'}).click();await page.getByRole('status').filter({hasText:'If this address'}).waitFor();check('Password reset uses non-enumerating success message',requests.some(r=>r.path.endsWith('/recover')));
    await page.goto(base+'/auth/reset-password',{waitUntil:'domcontentloaded'});await page.getByRole('link',{name:'Request reset link'}).waitFor();check('Guest cannot use reset-password form',await page.locator('#auth-confirm').count()===0);
    await page.goto(base+'/auth/callback?code=fake-code',{waitUntil:'domcontentloaded'});await page.getByLabel('New password',{exact:true}).waitFor();
    check('Recovery without custom query flag stays on password form',new URL(page.url()).pathname==='/auth/reset-password');
    check('PKCE recovery callback exchanges code',requests.some(r=>r.query.includes('pkce')&&r.body.auth_code==='fake-code'));
    check('Callback code removed from URL',!page.url().includes('fake-code'));
    await page.getByLabel('New password',{exact:true}).fill('another-long-password');await page.getByLabel('Confirm new password').fill('another-long-password');await page.getByRole('button',{name:'Save new password and sign out'}).click();await page.getByRole('heading',{name:'Welcome back.'}).waitFor();
    check('Recovery updates password through Auth and signs out',requests.some(r=>r.path.endsWith('/user')&&r.method==='PUT'&&r.body.password==='another-long-password'));
    const beforeVerification=requests.filter(r=>r.path.endsWith('/verify')).length;
    await page.goto(base+'/auth/callback?token_hash=valid-recovery-token&type=recovery',{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Continue to reset password'}).waitFor();
    check('Recovery landing does not consume token on prefetch',requests.filter(r=>r.path.endsWith('/verify')).length===beforeVerification);
    check('Recovery token removed from address bar',!page.url().includes('valid-recovery-token'));
    await page.getByRole('button',{name:'Continue to reset password'}).click();await page.getByLabel('New password',{exact:true}).waitFor();
    check('Explicit recovery confirmation opens password form without PKCE storage',requests.some(r=>r.path.endsWith('/verify')&&r.body.token_hash==='valid-recovery-token'&&r.body.type==='recovery'));
    await page.goto(base+'/auth/callback?token_hash=expired-recovery-token&type=recovery',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Continue to reset password'}).click();
    await page.getByRole('alert').filter({hasText:'invalid or expired'}).waitFor();
    check('Expired recovery token offers fresh reset request',new URL(page.url()).pathname==='/auth/forgot-password');
    await page.goto(base+'/account',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('heading',{name:'Welcome back.'}).waitFor();
    await page.goto(base+'/auth/callback?error=access_denied&error_description=private-google-data',{waitUntil:'domcontentloaded'});await page.getByRole('alert').filter({hasText:'invalid or expired'}).waitFor();check('OAuth denial is safe and strips provider details',!page.url().includes('private-google-data')&&!(await page.locator('body').innerText()).includes('private-google-data'));
    await page.getByRole('link',{name:'Back to file tools',exact:false}).click();await page.locator('canvas').waitFor();check('Guest tools and original hero remain available',await page.getByRole('heading',{name:'Your files, handled quietly.'}).isVisible());
    await page.goto(base+'/auth/login',{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Continue with Google'}).click();await page.waitForURL('https://phase1.supabase.co/**');
    const googleRequest=requests.find(r=>r.path.endsWith('/authorize'));
    check('Google UI requests identity-only authorization',!!googleRequest&&new URLSearchParams(googleRequest.query).get('scopes')==='openid email profile'&&!googleRequest.query.includes('drive'));
    await page.goto(base+'/auth/callback?code=google-test',{waitUntil:'domcontentloaded'});await page.getByText('Signed in as alice@example.com').waitFor();
    check('Google callback opens the verified account',new URL(page.url()).pathname==='/account');
    const second=await context.newPage();await second.goto(base+'/account',{waitUntil:'domcontentloaded'});await second.getByText('Signed in as alice@example.com').waitFor();
    await page.getByRole('button',{name:'Sign out',exact:true}).click();await second.getByText('Sign in to view your private account.',{exact:false}).waitFor();
    check('Logout clears protected profile in another tab',await second.locator('#profile-username').count()===0);await second.close();
    await page.getByLabel('Email',{exact:true}).fill('alice@example.com');await page.getByLabel('Password',{exact:true}).fill('long-test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByText('Signed in as alice@example.com').waitFor();
    invalidSession=true;await page.reload();await page.getByText('Sign in to view your private account.',{exact:false}).waitFor();
    check('Unverified stored session never reveals private profile',await page.locator('#profile-username').count()===0);invalidSession=false;
    await page.goto(base+'/auth/forgot-password',{waitUntil:'domcontentloaded'});await page.getByLabel('Email',{exact:true}).fill('alice@example.com');await page.getByRole('button',{name:'Send reset code'}).click();await page.getByLabel('Email verification code').waitFor();
    check('Recovery request opens code entry without authenticating',await page.locator('#auth-confirm').count()===0);
    await page.evaluate(()=>{for(const key of Object.keys(localStorage)){if(key.includes('code-verifier'))localStorage.removeItem(key);}});
    await page.getByLabel('Email verification code').fill('00000000');await page.getByRole('button',{name:'Verify code',exact:true}).click();await page.getByRole('alert').filter({hasText:'code is invalid or expired'}).waitFor();
    check('Wrong recovery OTP does not open password form',await page.locator('#auth-confirm').count()===0);
    await page.getByLabel('Email verification code').fill('12345678');await page.getByRole('button',{name:'Verify code',exact:true}).click();await page.getByLabel('New password',{exact:true}).waitFor();
    check('Recovery OTP opens password form without browser verifier',requests.some(r=>r.path.endsWith('/verify')&&r.body.email==='alice@example.com'&&r.body.token==='12345678'&&r.body.type==='recovery'));
    await page.getByLabel('New password',{exact:true}).fill('otp-new-password');await page.getByLabel('Confirm new password').fill('otp-new-password');await page.getByRole('button',{name:'Save new password and sign out'}).click();await page.getByRole('heading',{name:'Welcome back.'}).waitFor();
    check('OTP recovery saves new password and signs out',requests.some(r=>r.path.endsWith('/user')&&r.body?.password==='otp-new-password'));
    check('No browser runtime errors',errors.length===0);
    await fs.writeFile('audit/phase1-browser-tests.json',JSON.stringify({checks:checks.length,passed:checks,errors,backend:'Mocked Supabase HTTP responses; real SDK and UI; not live OAuth or email delivery'},null,2)+'\n');console.log('ALL',checks.length,'AUTH BROWSER CHECKS PASSED');
  } finally {await browser?.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});

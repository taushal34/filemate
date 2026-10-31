import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';

test('PostgreSQL migration, grants, RLS, private profile isolation and atomic username uniqueness', async t => {
  const db=new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
      grant usage on schema auth, public to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;
      insert into auth.users values ('${alice}');`);
    await db.exec(await readFile(new URL('../../supabase/migrations/202610310001_profiles.sql',import.meta.url),'utf8'));
    const query=(sql,args=[])=>db.query(sql,args);
    const as=async(role,id='')=>{await db.exec('reset role');await query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role '+role);};
    await t.test('existing users are backfilled and future Auth users receive one blank private profile',async()=>{
      await db.exec(`insert into auth.users values ('${bob}')`);
      const r=await query('select * from public.profiles order by id');assert.equal(r.rows.length,2);assert.equal(r.rows[0].username,null);
    });
    await t.test('anonymous clients cannot read or write private profile rows',async()=>{
      await as('anon');await assert.rejects(query('select * from public.profiles'),e=>e.code==='42501');
      await assert.rejects(query("update public.profiles set username='attacker'"),e=>e.code==='42501');
    });
    await t.test('authenticated user sees only their own row and cannot overwrite another user',async()=>{
      await as('authenticated',alice);const r=await query('select * from public.profiles');assert.deepEqual(r.rows.map(x=>x.id),[alice]);
      const other=await query('update public.profiles set display_name=$1 where id=$2 returning id',['Hacked',bob]);assert.equal(other.rows.length,0);
    });
    await t.test('client cannot insert identities, delete profiles, or alter IDs/timestamps',async()=>{
      await assert.rejects(query(`insert into public.profiles(id) values ('${bob}')`),e=>e.code==='42501');
      await assert.rejects(query('delete from public.profiles'),e=>e.code==='42501');
      await assert.rejects(query('update public.profiles set id=$1 where id=$2',[bob,alice]),e=>e.code==='42501');
      await assert.rejects(query('update public.profiles set created_at=now()'),e=>e.code==='42501');
    });
    await t.test('valid username update is allowed but reserved, mixed-case, oversized and malformed values are rejected',async()=>{
      await query("update public.profiles set username='alice_123',display_name='Alice'");
      for(const name of ['admin','Alice','12alice','a.b','ab','x'.repeat(25)])await assert.rejects(query('update public.profiles set username=$1',[name]),e=>e.code==='23514');
      await assert.rejects(query('update public.profiles set display_name=$1',['x'.repeat(81)]),e=>e.code==='23514');
    });
    await t.test('duplicate username loses at the database constraint, including a second queued claimant',async()=>{
      await as('authenticated',bob);await assert.rejects(query("update public.profiles set username='alice_123'"),e=>e.code==='23505');
      await query("update public.profiles set username='bob_123'");
    });
    await t.test('public lookup returns only an exact canonical username, never private fields',async()=>{
      await as('anon');const r=await query("select * from public.lookup_username(' ALICE_123 ')");
      assert.deepEqual(r.rows,[{username:'alice_123'}]);
      for(const value of ['', 'alice%', '%', 'no_such_user', 'x'.repeat(500)])assert.equal((await query('select * from public.lookup_username($1)',[value])).rows.length,0);
    });
    await t.test('database unique index handles competing queued claims with exactly one winner',async()=>{
      await as('authenticated',alice);await query('update public.profiles set username=null');
      await as('authenticated',bob);await query('update public.profiles set username=null');
      await as('postgres');
      const attempts=await Promise.allSettled([query("update public.profiles set username='contested' where id=$1",[alice]),query("update public.profiles set username='contested' where id=$1",[bob])]);
      assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);assert.equal(attempts.find(x=>x.status==='rejected').reason.code,'23505');
    });
    await t.test('Auth user deletion cascades without retaining private orphan profiles',async()=>{
      await as('postgres');await query('delete from auth.users where id=$1',[alice]);
      assert.equal((await query('select * from public.profiles where id=$1',[alice])).rows.length,0);
    });
  } finally { await db.close(); }
});

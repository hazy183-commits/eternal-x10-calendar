import test from 'node:test';
import assert from 'node:assert/strict';
import { requireOwner, previewToken } from '../server/releaseAccess.js';
import { createReleaseService, releaseCandidates, loadReleaseCandidates } from '../server/releases.js';
import { makeReleaseHandler } from '../api/releases.js';
import { makePreviewMiddleware } from '../middleware.js';

const env={VERCEL:'1',VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'public-key',RELEASE_VERCEL_TOKEN:'server-secret',RELEASE_PROJECT_ID:'prj_test',RELEASE_TEAM_ID:'team_test',RELEASE_CANDIDATES_JSON:JSON.stringify([{id:'dpl_candidate',title:'Nowa wersja',testsPassed:true,action:'publish'}])};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
test('live release catalog uses owner session and rejects unchecked entries',async()=>{
  const liveEnv={...env,RELEASE_CANDIDATES_JSON:undefined};
  let calls=0;
  const fetcher=async(url,init)=>{calls++;assert.ok(url.includes('/owner_release_candidates?enabled=eq.true'));assert.equal(init.headers.Authorization,'Bearer owner-token');return json([{id:'dpl_new',title:'Nowa',action:'publish',tests_passed:true}]);};
  const rows=await loadReleaseCandidates('owner-token',liveEnv,fetcher);
  assert.equal(rows[0].id,'dpl_new');assert.equal(calls,1);
  await assert.rejects(loadReleaseCandidates('owner-token',liveEnv,async()=>json({},403)));
  await assert.rejects(loadReleaseCandidates('owner-token',liveEnv,async()=>json([{id:'dpl_new',title:'Nowa',action:'publish',tests_passed:false}])));
});
function fixture(options={}) {
  const calls=[];
  const fetcher=async(url,init={})=>{
    calls.push({url,init});
    if(url.includes('/auth/v1/token'))return json({access_token:'owner.jwt.token',expires_in:3600});
    if(url.endsWith('/auth/v1/user'))return json({id:'user-id'},options.authStatus||200);
    if(url.includes('/rest/v1/profiles'))return json([{role:options.role||'owner',status:options.status||'approved',removed_at:options.removedAt||null}],options.profileStatus||200);
    if(url.includes('/v9/projects/'))return json({targets:{production:{id:options.current||'dpl_current'}}});
    if(url.includes('/v13/deployments/'))return json({projectId:options.project||'prj_test',readyState:options.state||'READY',url:'orzel-preview.vercel.app'});
    if(init.method==='POST')return new Response(null,{status:options.promoteStatus||202});
    throw new Error(`Unexpected request ${url}`);
  };
  return {fetcher,calls};
}
test('only active approved owner can authorize releases; no metadata-based authorization',async()=>{
  for(const options of [{role:'member'},{role:'admin'},{status:'blocked'},{removedAt:'2026-09-24'},{authStatus:401},{profileStatus:500}]) {
    await assert.rejects(requireOwner('token',env,fixture(options).fetcher));
  }
  assert.equal(await requireOwner('token',env,fixture().fetcher),'user-id');
  const empty=fixture();await assert.rejects(requireOwner('',env,empty.fetcher));assert.equal(empty.calls.length,0);
});
test('unconfigured publishing fails closed and leaks no secret',async()=>{
  const service=createReleaseService({},fixture().fetcher);
  assert.deepEqual(await service.list(),{configured:false,current:null,releases:[]});
  await assert.rejects(service.publish({id:'dpl_candidate',tested:true,action:'publish'}));
  assert.throws(()=>releaseCandidates({...env,RELEASE_CANDIDATES_JSON:'{}'}));
  assert.throws(()=>releaseCandidates({...env,RELEASE_CANDIDATES_JSON:'[{"id":"dpl_unchecked","title":"unchecked","action":"publish"}]'}));
});
test('list shows only registered READY deployments from the correct project',async()=>{
  const result=await createReleaseService(env,fixture().fetcher).list();
  assert.equal(result.releases.length,1);assert.equal(result.releases[0].url,'https://orzel-preview.vercel.app');
  assert.ok(!JSON.stringify(result).includes('server-secret'));
  for(const options of [{project:'prj_foreign'},{state:'BUILDING'},{state:'ERROR'}])await assert.rejects(createReleaseService(env,fixture(options).fetcher).list());
});
test('publishing requires tests, allowlisted action, same project and fresh public version',async()=>{
  for(const [body,options] of [
    [{id:'dpl_candidate',action:'publish',tested:false},{}],
    [{id:'dpl_unknown',action:'publish',tested:true},{}],
    [{id:'dpl_candidate',action:'rollback',tested:true},{}],
    [{id:'dpl_candidate',action:'publish',tested:true,expectedCurrent:'dpl_old'},{}],
    [{id:'dpl_candidate',action:'publish',tested:true,expectedCurrent:'dpl_current'},{project:'prj_foreign'}],
  ]) {
    const f=fixture(options);await assert.rejects(createReleaseService(env,f.fetcher).publish(body));assert.equal(f.calls.filter(call=>call.init.method==='POST').length,0);
  }
});
test('publishes the reviewed immutable deployment using server credentials and official API',async()=>{
  const f=fixture();const result=await createReleaseService(env,f.fetcher).publish({id:'dpl_candidate',action:'publish',tested:true,expectedCurrent:'dpl_current'});
  assert.deepEqual(result,{accepted:true,alreadyCurrent:false});
  const post=f.calls.find(call=>call.init.method==='POST');
  assert.equal(post.url,'https://api.vercel.com/v10/projects/prj_test/promote/dpl_candidate?teamId=team_test');
  assert.equal(post.init.headers.Authorization,'Bearer server-secret');
});
test('duplicate publish is harmless; upstream failure is not reported as success',async()=>{
  const body={id:'dpl_candidate',action:'publish',tested:true,expectedCurrent:'dpl_current'};
  const f=fixture({current:'dpl_candidate'});assert.equal((await createReleaseService(env,f.fetcher).publish(body)).alreadyCurrent,true);
  assert.equal(f.calls.filter(call=>call.init.method==='POST').length,0);
  await assert.rejects(createReleaseService(env,fixture({promoteStatus:409}).fetcher).publish(body),error=>error.status===409);
});
test('rollback uses only explicitly registered compatible previous deployment',async()=>{
  const config={...env,RELEASE_CANDIDATES_JSON:JSON.stringify([{id:'dpl_candidate',title:'Poprzednia',testsPassed:true,action:'rollback'}])};
  const f=fixture();await createReleaseService(config,f.fetcher).publish({id:'dpl_candidate',action:'rollback',tested:true,expectedCurrent:'dpl_current'});
  assert.ok(f.calls.some(call=>call.url.includes('/v1/projects/prj_test/rollback/dpl_candidate')));
});
test('HTTP handler denies anonymous and admin calls before contacting hosting',async()=>{
  for(const [authorization,options] of [['',{}],['Bearer token',{role:'admin'}]]) {
    const f=fixture(options);const res={setHeader(){},status(code){this.code=code;return this;},json(value){this.value=value;return this;}};
    await makeReleaseHandler(env,f.fetcher)({method:'POST',headers:{authorization,'content-type':'application/json'},body:{}},res);
    assert.ok([401,403].includes(res.code));assert.ok(!f.calls.some(call=>call.url.includes('api.vercel.com')));
  }
});
test('preview blocks anonymous HTML, assets and APIs; public domain continues normally',async()=>{
  const f=fixture();const middleware=makePreviewMiddleware(env,f.fetcher);
  for(const path of ['/','/assets/app.js','/api/releases','/images/logo.png','/profile-studio.html']) {
    const response=await middleware(new Request(`https://preview.vercel.app${path}`,{headers:{accept:path==='/'?'text/html':'*/*','x-middleware-subrequest':'middleware'}}));
    assert.equal(response.status,401);assert.match(response.headers.get('cache-control'),/no-store/);
  }
  assert.equal(f.calls.length,0);
  const publicResponse=await middleware(new Request('https://orzelbialy.eu/'));
  assert.equal(publicResponse.headers.get('x-middleware-next'),'1');
});
test('preview rechecks owner per request, expired or revoked access fails closed',async()=>{
  for(const options of [{role:'admin'},{status:'blocked'},{authStatus:401}]) {
    const response=await makePreviewMiddleware(env,fixture(options).fetcher)(new Request('https://preview.vercel.app/assets/app.js',{headers:{cookie:'__Host-ob-preview=owner.jwt.token'}}));assert.equal(response.status,401);
  }
  const response=await makePreviewMiddleware(env,fixture().fetcher)(new Request('https://preview.vercel.app/',{headers:{cookie:'__Host-ob-preview=owner.jwt.token'}}));
  assert.equal(response.headers.get('x-middleware-next'),'1');assert.match(response.headers.get('cache-control'),/no-store/);
  assert.equal(previewToken('other=x; __Host-ob-preview=abc.def; third=y'),'abc.def');
});
test('preview login requires same origin and issues secure private short-lived cookie only for owner',async()=>{
  const login=origin=>new Request('https://preview.vercel.app/__preview-login',{method:'POST',headers:{origin},body:new URLSearchParams({nickname:'KiRY',password:'fixture-password'})});
  const f=fixture();const middleware=makePreviewMiddleware(env,f.fetcher);
  assert.equal((await middleware(login('https://evil.example'))).status,403);assert.equal(f.calls.length,0);
  const response=await middleware(login('https://preview.vercel.app'));
  assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/');
  const cookie=response.headers.get('set-cookie');for(const value of ['HttpOnly','Secure','SameSite=Strict','Max-Age=3600','Path=/'])assert.ok(cookie.includes(value));
  const denied=await makePreviewMiddleware(env,fixture({role:'member'}).fetcher)(login('https://preview.vercel.app'));
  assert.equal(denied.status,401);assert.equal(denied.headers.get('set-cookie'),null);
});

import { ReleaseError } from './releaseAccess.js';

export function releaseCandidates(env) {
  let rows;
  try { rows = JSON.parse(env.RELEASE_CANDIDATES_JSON || '[]'); } catch { throw new ReleaseError(503,'Nieprawidłowa konfiguracja wersji testowych.'); }
  if (!Array.isArray(rows) || rows.length > 20 || rows.some(row => !/^dpl_[a-zA-Z0-9]+$/.test(row.id) || typeof row.title !== 'string' || row.testsPassed !== true || !['publish','rollback'].includes(row.action))) throw new ReleaseError(503,'Nieprawidłowa konfiguracja wersji testowych.');
  return rows;
}

export async function loadReleaseCandidates(token, env = process.env, fetcher = fetch) {
  // Environment catalog is retained for isolated tests / recovery only.
  if (env.RELEASE_CANDIDATES_JSON) return releaseCandidates(env);
  const response = await fetcher(`${env.VITE_SUPABASE_URL}/rest/v1/owner_release_candidates?enabled=eq.true&select=id,title,notes,action,tests_passed&order=created_at.desc&limit=20`, {
    headers: { apikey:env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization:`Bearer ${token}` }, signal:AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new ReleaseError(503,'Nie udało się pobrać listy przygotowanych wersji.');
  const rows = await response.json();
  return releaseCandidates({RELEASE_CANDIDATES_JSON:JSON.stringify(rows.map(row=>({...row,testsPassed:row.tests_passed})))});
}

export function createReleaseService(env = process.env, fetcher = fetch, candidates = () => releaseCandidates(env)) {
  const projectId = env.RELEASE_PROJECT_ID;
  const teamId = env.RELEASE_TEAM_ID;
  const configured = Boolean(env.RELEASE_VERCEL_TOKEN && projectId && teamId);
  async function vercel(path, method = 'GET') {
    if (!configured) throw new ReleaseError(503,'Publikowanie wymaga połączenia z hostingiem.');
    const response = await fetcher(`https://api.vercel.com${path}${path.includes('?')?'&':'?'}teamId=${encodeURIComponent(teamId)}`, {method,headers:{Authorization:`Bearer ${env.RELEASE_VERCEL_TOKEN}`},signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new ReleaseError(response.status === 409 ? 409 : 502,'Hosting nie potwierdził operacji. Odśwież stan przed ponowną próbą.');
    const body = await response.text();
    return body ? JSON.parse(body) : {};
  }
  async function current() {
    const project = await vercel(`/v9/projects/${encodeURIComponent(projectId)}`);
    const id = project.targets?.production?.id;
    if (!id) throw new ReleaseError(503,'Nie udało się ustalić obecnej wersji strony.');
    return id;
  }
  async function verified(row) {
    const deployment = await vercel(`/v13/deployments/${encodeURIComponent(row.id)}`);
    if (deployment.projectId !== projectId || deployment.readyState !== 'READY' || !/^[a-zA-Z0-9-]+\.vercel\.app$/.test(deployment.url || '')) throw new ReleaseError(409,'Wersja nie jest gotowa do publikacji w tym projekcie.');
    return {id:row.id,title:row.title,notes:String(row.notes || ''),action:row.action,url:`https://${deployment.url}`};
  }
  return {
    async list() {
      if (!configured) return {configured:false,current:null,releases:[]};
      const id = await current();
      const releases = await Promise.all((await candidates()).filter(row=>row.id!==id).map(verified));
      return {configured:true,current:id,releases};
    },
    async publish(body) {
      if (body.tested !== true) throw new ReleaseError(400,'Najpierw potwierdź wykonanie testów tej wersji.');
      const row = (await candidates()).find(item=>item.id===body.id && item.action===body.action);
      if (!row) throw new ReleaseError(403,'Ta wersja nie została przygotowana do publikacji.');
      const id = await current();
      if (id === row.id) return {accepted:true,alreadyCurrent:true};
      if (id !== body.expectedCurrent) throw new ReleaseError(409,'Wersja publiczna zmieniła się. Odśwież panel i sprawdź ją ponownie.');
      await verified(row);
      await vercel(`/${row.action==='rollback'?'v1':'v10'}/projects/${encodeURIComponent(projectId)}/${row.action==='rollback'?'rollback':'promote'}/${encodeURIComponent(row.id)}`,'POST');
      return {accepted:true,alreadyCurrent:false};
    },
  };
}

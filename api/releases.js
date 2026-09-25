import { requireOwner, ReleaseError } from '../server/releaseAccess.js';
import { createReleaseService, loadReleaseCandidates } from '../server/releases.js';

export function makeReleaseHandler(env = process.env, fetcher = fetch) {
  return async (req,res) => {
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('Vary','Authorization');
    if (!['GET','POST'].includes(req.method)) { res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Niedozwolona metoda.'}); }
    try {
      const token = /^Bearer ([^\s]+)$/.exec(req.headers.authorization || '')?.[1];
      await requireOwner(token,env,fetcher);
      const service = createReleaseService(env,fetcher,()=>loadReleaseCandidates(token,env,fetcher));
      if (req.method==='GET') return res.status(200).json(await service.list());
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new ReleaseError(415,'Wymagany format JSON.');
      let body;
      try { body = typeof req.body==='string'?JSON.parse(req.body):req.body; } catch { throw new ReleaseError(400,'Nieprawidłowe dane.'); }
      if (!body || typeof body!=='object') throw new ReleaseError(400,'Nieprawidłowe dane.');
      return res.status(202).json(await service.publish(body));
    } catch (error) {
      return res.status(error instanceof ReleaseError?error.status:503).json({error:error instanceof ReleaseError?error.message:'Nie udało się połączyć. Odśwież stan przed ponowną próbą.'});
    }
  };
}
export default makeReleaseHandler();

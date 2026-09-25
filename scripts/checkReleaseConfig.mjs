import { createReleaseService } from '../server/releases.js';

// Runs in the trusted build environment, never in the browser or a public endpoint.
if (process.env.VERCEL) {
  try {
    const state = await createReleaseService(process.env, fetch, async()=>[]).list();
    if (!state.configured || !state.current) throw new Error('missing configuration');
    console.log('Release configuration verified: project-scoped hosting access and current production version are available.');
  } catch {
    console.error('Release configuration check failed. Check RELEASE_VERCEL_TOKEN, RELEASE_PROJECT_ID and RELEASE_TEAM_ID in Vercel; no credential values are logged.');
    process.exitCode=1;
  }
}

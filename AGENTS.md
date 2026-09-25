# Publication workflow agreed with the owner

- Every new change goes to private owner review first. Do not push to `main`, merge to the production branch, promote deployments, or publish automatically.
- The owner explicitly decides when a tested version becomes public, preferably in **Start → Zmiany i publikacja**.
- Use a separate preview branch/deployment. Verify `middleware.js` protects HTML, assets and APIs from anonymous users, members and non-owner administrators before sharing the preview.
- Do not treat a hidden URL or a hidden frontend button as access control.
- Preview website code and production database are separate concerns: do not perform destructive or notifying tests on real clan data. Use fixtures or an isolated database. Database migrations require their own compatible rollout; promotion/rollback changes code only.
- Never put deployment credentials in `VITE_*` variables or source control. Only server functions can use `RELEASE_VERCEL_TOKEN`.
- Only register exact, checked deployment IDs in `public.owner_release_candidates` through the authenticated maintainer connector. Set tests_passed and enabled only after verification. Client roles cannot mutate this catalog. Each version must include this publication panel and preview middleware; otherwise publishing it could remove the management interface/protection.
- Preserve uncommitted user changes. These rules apply to this repository and all future work here.

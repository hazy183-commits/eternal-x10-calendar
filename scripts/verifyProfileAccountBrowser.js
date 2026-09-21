(async () => {
  const { mountProfileStudio } = await import('/src/profileStudio.js');
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const wait = async predicate => { for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(r => setTimeout(r, 20)); } throw new Error('UI condition timed out'); };
  const checks = [], rows = new Map();
  let authCallback, userId = 'member-a', fail = false, releaseWrite = null;
  const client = {
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null } }), onAuthStateChange: callback => { authCallback = callback; return { data: { subscription: { unsubscribe() {} } } }; } },
    from: table => ({
      select: () => ({ eq: (_key, id) => ({
        single: async () => ({ data: { id, nickname: id, status: 'approved', avatar_path: null, removed_at: null } }),
        maybeSingle: async () => ({ data: rows.get(id) || null }),
      }) }),
      upsert: payload => ({ select: () => ({ single: async () => {
        if (releaseWrite === 'hold') await new Promise(resolve => { releaseWrite = resolve; });
        if (fail) return { error: new Error('offline') };
        rows.set(payload.user_id, structuredClone(payload)); return { data: payload };
      } }) }),
    }),
  };
  const root = document.createElement('section'); document.body.append(root);
  let dispose = mountProfileStudio(root, { supabase: client });
  const q = selector => root.querySelector(selector);
  const click = selector => { const button = q(selector); assert(button && !button.disabled, `Unavailable: ${selector}`); button.click(); };
  await wait(() => !q('[data-ps-random]').disabled);
  click('[data-ps-field="ornament"][data-ps-value="fire"]');
  authCallback('SIGNED_IN', { user: { id: userId } });
  assert(q('[data-ps-preview] [data-ornament="fire"]'), 'Token/focus event destroyed draft');
  fail = true; click('[data-ps-save]');
  await wait(() => q('[data-ps-message]').textContent.includes('Nie udało'));
  assert(q('[data-ps-preview] [data-ornament="fire"]'), 'Failed save destroyed draft');
  assert(!rows.has(userId), 'Failed save persisted');
  assert(!q('[data-ps-save]').disabled, 'Failed save cannot retry');
  checks.push('repeated sign-in preserves draft; write failure preserves draft and allows retry');
  fail = false; click('[data-ps-save]');
  await wait(() => q('[data-ps-message]').textContent.includes('na Twoim koncie'));
  assert(rows.get(userId).ornament === 'fire', 'Account write failed');
  dispose(); root.replaceChildren(); dispose = mountProfileStudio(root, { supabase: client });
  await wait(() => !q('[data-ps-random]').disabled);
  assert(q('[data-ps-preview] [data-ornament="fire"]'), 'Remount did not load account value');
  checks.push('account save and reload');
  click('[data-ps-field="ornament"][data-ps-value="horns"]');
  releaseWrite = 'hold'; click('[data-ps-save]');
  await wait(() => typeof releaseWrite === 'function');
  userId = 'member-b'; authCallback('SIGNED_IN', { user: { id: userId } });
  await wait(() => !q('[data-ps-random]').disabled);
  releaseWrite();
  await new Promise(r => setTimeout(r, 30));
  assert(q('[data-ps-preview] [data-ornament="none"]'), 'Old save overwrote new account UI');
  assert(!rows.has('member-b'), 'Old save leaked to new account');
  checks.push('account switch during save discards stale response');
  userId = null; authCallback('SIGNED_OUT', null);
  await wait(() => q('[data-ps-message]').textContent.includes('Zaloguj'));
  assert(q('[data-ps-save]').disabled, 'Signed-out account can save');
  checks.push('sign-out clears profile and disables save');
  dispose(); root.remove();
  return { result: 'PASS', checks };
})();

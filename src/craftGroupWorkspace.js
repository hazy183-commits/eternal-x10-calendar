import { fetchAllRows } from './craftWorkspace.js';
import { planCraftWorkspace } from './craftPlannerEngine.js';

const requireClient = (supabase) => {
  if (!supabase) throw new Error('Brak połączenia z Supabase.');
  return supabase;
};

const getUser = async (supabase) => {
  requireClient(supabase);
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user) throw new Error('Musisz być zalogowany, aby korzystać z grupowego craftingu.');
  return data.user;
};

const throwIfError = (error) => {
  if (error) throw error;
};

const unique = values => [...new Set(values.filter(Boolean).map(String))];

const referenceData = async supabase => {
  const [items, recipes, components] = await Promise.all([
    fetchAllRows(() => supabase.from('craft_items').select('*').order('name').order('item_key')),
    fetchAllRows(() => supabase.from('craft_recipes').select('*').eq('active', true).order('output_item_key').order('id')),
    fetchAllRows(() => supabase.from('craft_recipe_components').select('*').order('recipe_id').order('component_item_key')),
  ]);
  return { items, recipes, components };
};

const aggregateInventory = rows => {
  const totals = new Map();
  for (const row of rows || []) {
    const itemKey = String(row.item_key || '');
    if (!itemKey) continue;
    totals.set(itemKey, (totals.get(itemKey) || 0) + Number(row.quantity || 0));
  }
  return [...totals.entries()].map(([item_key, quantity]) => ({ item_key, quantity }));
};

export async function loadCraftGroupWorkspace(supabase) {
  const user = await getUser(supabase);
  const [{ data: ownedProjects, error: ownedError }, { data: memberships, error: membershipError }] = await Promise.all([
    supabase.from('craft_group_projects').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('craft_group_members').select('group_project_id,role,created_at').eq('user_id', user.id),
  ]);
  throwIfError(ownedError);
  throwIfError(membershipError);

  const owned = ownedProjects || [];
  const memberProjectIds = unique((memberships || []).map(row => row.group_project_id));
  const ownedIds = new Set(owned.map(row => String(row.id)));
  const missingMemberIds = memberProjectIds.filter(id => !ownedIds.has(id));
  let memberProjects = [];
  if (missingMemberIds.length) {
    const { data, error } = await supabase
      .from('craft_group_projects')
      .select('*')
      .in('id', missingMemberIds)
      .order('created_at', { ascending: false });
    throwIfError(error);
    memberProjects = data || [];
  }
  const projects = [...owned, ...memberProjects];
  const projectIds = unique(projects.map(row => row.id));
  const reference = await referenceData(supabase);

  if (!projectIds.length) {
    const { data: candidates, error } = await supabase
      .from('profiles')
      .select('id,nickname,role,status')
      .eq('status', 'approved')
      .is('removed_at', null)
      .neq('id', user.id)
      .order('nickname');
    throwIfError(error);
    return { user, ...reference, projects: [], groups: [], candidates: candidates || [] };
  }

  const [{ data: memberRows, error: memberRowsError }, { data: inventoryRows, error: inventoryError }, { data: candidates, error: candidatesError }] = await Promise.all([
    supabase.from('craft_group_members').select('group_project_id,user_id,role,invited_by,created_at').in('group_project_id', projectIds),
    supabase.from('craft_group_inventory').select('group_project_id,user_id,item_key,quantity,updated_at').in('group_project_id', projectIds).order('item_key'),
    supabase.from('profiles').select('id,nickname,role,status').eq('status', 'approved').is('removed_at', null).neq('id', user.id).order('nickname'),
  ]);
  throwIfError(memberRowsError);
  throwIfError(inventoryError);
  throwIfError(candidatesError);

  const profileIds = unique([
    user.id,
    ...projects.map(project => project.owner_id),
    ...(memberRows || []).map(row => row.user_id),
  ]);
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id,nickname,role,status').in('id', profileIds);
  throwIfError(profilesError);
  const profileMap = new Map((profiles || []).map(profile => [String(profile.id), profile]));
  const inventoryByProject = new Map();
  for (const row of inventoryRows || []) {
    const key = String(row.group_project_id);
    if (!inventoryByProject.has(key)) inventoryByProject.set(key, []);
    inventoryByProject.get(key).push(row);
  }
  const membersByProject = new Map();
  for (const row of memberRows || []) {
    const key = String(row.group_project_id);
    if (!membersByProject.has(key)) membersByProject.set(key, []);
    membersByProject.get(key).push({
      ...row,
      nickname: profileMap.get(String(row.user_id))?.nickname || 'Członek klanu',
    });
  }

  const groups = projects.map(project => {
    const key = String(project.id);
    const contributions = inventoryByProject.get(key) || [];
    const totals = aggregateInventory(contributions);
    const plan = planCraftWorkspace({
      ...reference,
      inventory: totals,
      projects: [project],
    });
    const members = membersByProject.get(key) || [];
    return {
      project: {
        ...project,
        ownerNickname: profileMap.get(String(project.owner_id))?.nickname || 'Właściciel projektu',
      },
      plan: plan.projects[0] || null,
      inventory: plan.inventory,
      contributions,
      members,
    };
  });

  return {
    user,
    ...reference,
    projects,
    groups,
    candidates: candidates || [],
  };
}

export async function createCraftGroupProject(supabase, { name, targetItemKey, targetQuantity = 1 } = {}) {
  await getUser(supabase);
  const cleanName = String(name || '').trim();
  const quantity = Number(targetQuantity);
  if (!cleanName || cleanName.length > 80) throw new Error('Nazwa projektu musi mieć od 1 do 80 znaków.');
  if (!targetItemKey) throw new Error('Wybierz przedmiot do craftu.');
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1000000) {
    throw new Error('Liczba sztuk musi być dodatnią liczbą całkowitą.');
  }
  const { data, error } = await supabase.rpc('create_craft_group_project', {
    p_project_name: cleanName,
    p_target_item_key: targetItemKey,
    p_target_quantity: quantity,
  });
  throwIfError(error);
  return Array.isArray(data) ? data[0] : data;
}

export async function inviteCraftGroupMember(supabase, groupProjectId, userId, role = 'editor') {
  const user = await getUser(supabase);
  if (!groupProjectId || !userId || userId === user.id) throw new Error('Wybierz prawidłowego członka klanu.');
  if (!['editor', 'viewer'].includes(role)) throw new Error('Nieprawidłowa rola członka.');
  const { data, error } = await supabase.from('craft_group_members').upsert({
    group_project_id: groupProjectId,
    user_id: userId,
    role,
    invited_by: user.id,
  }, { onConflict: 'group_project_id,user_id' }).select('*').single();
  throwIfError(error);
  return data;
}

export async function setCraftGroupContribution(supabase, groupProjectId, itemKey, quantity) {
  const user = await getUser(supabase);
  const normalized = Number(quantity);
  if (!groupProjectId || !itemKey) throw new Error('Brak projektu lub materiału.');
  if (!Number.isSafeInteger(normalized) || normalized < 0) {
    throw new Error('Stan materiału musi być liczbą całkowitą równą 0 lub większą.');
  }
  if (normalized === 0) {
    const { error } = await supabase.from('craft_group_inventory')
      .delete().eq('group_project_id', groupProjectId).eq('user_id', user.id).eq('item_key', itemKey);
    throwIfError(error);
    return null;
  }
  const { data, error } = await supabase.from('craft_group_inventory').upsert({
    group_project_id: groupProjectId,
    user_id: user.id,
    item_key: itemKey,
    quantity: normalized,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'group_project_id,user_id,item_key' }).select('*').single();
  throwIfError(error);
  return data;
}

export async function updateCraftGroupProject(supabase, groupProjectId, changes = {}) {
  await getUser(supabase);
  const patch = { updated_at: new Date().toISOString() };
  if (changes.status !== undefined) {
    if (!['active', 'paused', 'completed', 'archived'].includes(changes.status)) throw new Error('Nieprawidłowy status projektu.');
    patch.status = changes.status;
  }
  if (changes.name !== undefined) {
    const cleanName = String(changes.name || '').trim();
    if (!cleanName || cleanName.length > 80) throw new Error('Nazwa projektu musi mieć od 1 do 80 znaków.');
    patch.name = cleanName;
  }
  const { data, error } = await supabase.from('craft_group_projects').update(patch).eq('id', groupProjectId).select('*').single();
  throwIfError(error);
  return data;
}

export async function removeCraftGroupMember(supabase, groupProjectId, userId) {
  const { error } = await supabase.from('craft_group_members').delete().eq('group_project_id', groupProjectId).eq('user_id', userId);
  throwIfError(error);
}

export async function deleteCraftGroupProject(supabase, groupProjectId) {
  const { error } = await supabase.from('craft_group_projects').delete().eq('id', groupProjectId);
  throwIfError(error);
}

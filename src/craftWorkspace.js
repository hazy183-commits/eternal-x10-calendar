import { planCraftWorkspace } from './craftPlannerEngine.js';

const requireClient = (supabase) => {
  if (!supabase) throw new Error('Brak połączenia z Supabase.');
  return supabase;
};

const getUser = async (supabase) => {
  requireClient(supabase);
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user) throw new Error('Musisz być zalogowany, aby korzystać z planera craftu.');
  return data.user;
};

const throwIfError = (error) => {
  if (error) throw error;
};

const notifyCraftDataChanged = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('orzel:craft-data-changed'));
};

export async function fetchAllRows(createQuery, pageSize = 500) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await createQuery().range(from, from + pageSize - 1);
    throwIfError(error);
    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function loadCraftWorkspace(supabase) {
  const user = await getUser(supabase);
  const [items, recipes, components, inventory, projects] = await Promise.all([
    fetchAllRows(() => supabase.from('craft_items').select('*').order('name').order('item_key')),
    fetchAllRows(() => supabase.from('craft_recipes').select('*').eq('active', true).order('output_item_key').order('id')),
    fetchAllRows(() => supabase.from('craft_recipe_components').select('*').order('recipe_id').order('component_item_key')),
    fetchAllRows(() => supabase.from('craft_inventory').select('*').eq('user_id', user.id).order('item_key')),
    fetchAllRows(() => supabase.from('craft_projects').select('*').eq('user_id', user.id).order('priority').order('created_at')),
  ]);

  const data = {
    items,
    recipes,
    components,
    inventory,
    projects,
  };

  return {
    user,
    ...data,
    plan: planCraftWorkspace(data),
  };
}

export async function setCraftInventoryQuantity(supabase, itemKey, quantity) {
  const user = await getUser(supabase);
  const normalized = Number(quantity);
  if (!Number.isSafeInteger(normalized) || normalized < 0) {
    throw new Error('Stan materiału musi być liczbą całkowitą równą 0 lub większą.');
  }

  const { data: item, error: itemError } = await supabase
    .from('craft_items')
    .select('category')
    .eq('item_key', itemKey)
    .maybeSingle();
  throwIfError(itemError);
  if (!item || !['material', 'recipe'].includes(item.category)) {
    throw new Error('Magazyn przyjmuje tylko materiały i recepty.');
  }

  if (normalized === 0) {
    const { error } = await supabase
      .from('craft_inventory')
      .delete()
      .eq('user_id', user.id)
      .eq('item_key', itemKey);
    throwIfError(error);
    notifyCraftDataChanged();
    return null;
  }

  const { data, error } = await supabase
    .from('craft_inventory')
    .upsert({
      user_id: user.id,
      item_key: itemKey,
      quantity: normalized,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,item_key' })
    .select('*')
    .single();
  throwIfError(error);
  notifyCraftDataChanged();
  return data;
}

export async function createCraftProject(supabase, {
  name,
  targetItemKey,
  targetQuantity = 1,
  priority = 100,
} = {}) {
  const user = await getUser(supabase);
  const cleanName = String(name || '').trim();
  const quantity = Number(targetQuantity);
  const normalizedPriority = Number(priority);

  if (!cleanName || cleanName.length > 80) throw new Error('Nazwa projektu musi mieć od 1 do 80 znaków.');
  if (!targetItemKey) throw new Error('Wybierz przedmiot do craftu.');
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1000000) {
    throw new Error('Liczba sztuk musi być dodatnią liczbą całkowitą.');
  }
  if (!Number.isSafeInteger(normalizedPriority) || normalizedPriority < 0 || normalizedPriority > 1000000) {
    throw new Error('Nieprawidłowy priorytet projektu.');
  }

  const { data, error } = await supabase
    .from('craft_projects')
    .insert({
      user_id: user.id,
      name: cleanName,
      target_item_key: targetItemKey,
      target_quantity: quantity,
      priority: normalizedPriority,
      status: 'active',
    })
    .select('*')
    .single();
  throwIfError(error);
  notifyCraftDataChanged();
  return data;
}

export async function updateCraftProject(supabase, projectId, changes = {}) {
  const user = await getUser(supabase);
  if (!projectId) throw new Error('Brak identyfikatora projektu.');

  const patch = { updated_at: new Date().toISOString() };
  if (changes.name !== undefined) {
    const cleanName = String(changes.name || '').trim();
    if (!cleanName || cleanName.length > 80) throw new Error('Nazwa projektu musi mieć od 1 do 80 znaków.');
    patch.name = cleanName;
  }
  if (changes.targetItemKey !== undefined) patch.target_item_key = changes.targetItemKey;
  if (changes.targetQuantity !== undefined) {
    const quantity = Number(changes.targetQuantity);
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1000000) {
      throw new Error('Liczba sztuk musi być dodatnią liczbą całkowitą.');
    }
    patch.target_quantity = quantity;
  }
  if (changes.priority !== undefined) {
    const priority = Number(changes.priority);
    if (!Number.isSafeInteger(priority) || priority < 0 || priority > 1000000) throw new Error('Nieprawidłowy priorytet.');
    patch.priority = priority;
  }
  if (changes.status !== undefined) {
    if (!['active', 'paused', 'completed', 'archived'].includes(changes.status)) throw new Error('Nieprawidłowy status projektu.');
    patch.status = changes.status;
  }

  const { data, error } = await supabase
    .from('craft_projects')
    .update(patch)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select('*')
    .single();
  throwIfError(error);
  notifyCraftDataChanged();
  return data;
}

export async function deleteCraftProject(supabase, projectId) {
  const user = await getUser(supabase);
  const { error } = await supabase
    .from('craft_projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id);
  throwIfError(error);
  notifyCraftDataChanged();
}

export async function reorderCraftProjects(supabase, orderedProjectIds = []) {
  const user = await getUser(supabase);
  const uniqueIds = [...new Set(orderedProjectIds.filter(Boolean))];
  for (let index = 0; index < uniqueIds.length; index += 1) {
    const { error } = await supabase
      .from('craft_projects')
      .update({ priority: (index + 1) * 10, updated_at: new Date().toISOString() })
      .eq('id', uniqueIds[index])
      .eq('user_id', user.id);
    throwIfError(error);
  }
  notifyCraftDataChanged();
}

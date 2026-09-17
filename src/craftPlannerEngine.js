const ACTIVE_STATUS = 'active';

export class CraftPlannerError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'CraftPlannerError';
    this.details = details;
  }
}

const toPositiveInteger = (value, label) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new CraftPlannerError(`${label} musi być dodatnią liczbą całkowitą.`, { value });
  }
  return number;
};

const toNonNegativeInteger = (value, label) => {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new CraftPlannerError(`${label} nie może być ujemne.`, { value });
  }
  return number;
};

const addToMap = (map, key, amount) => {
  if (!amount) return;
  map.set(key, (map.get(key) || 0) + amount);
};

const mapToSortedRows = (map, itemIndex) => [...map.entries()]
  .filter(([, quantity]) => quantity > 0)
  .map(([itemKey, quantity]) => ({
    itemKey,
    name: itemIndex.get(itemKey)?.name || itemKey,
    quantity,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pl'));

export function buildRecipeBook(recipes = [], components = []) {
  const componentsByRecipe = new Map();

  for (const component of components) {
    if (!component?.recipe_id || !component?.component_item_key) continue;
    const quantity = toPositiveInteger(component.quantity, 'Ilość składnika recepty');
    const list = componentsByRecipe.get(component.recipe_id) || [];
    list.push({ itemKey: component.component_item_key, quantity });
    componentsByRecipe.set(component.recipe_id, list);
  }

  const candidates = new Map();
  for (const recipe of recipes) {
    if (!recipe?.id || !recipe?.output_item_key || recipe.active === false) continue;
    const row = {
      id: recipe.id,
      outputItemKey: recipe.output_item_key,
      outputQuantity: toPositiveInteger(recipe.output_quantity ?? 1, 'Ilość wyniku recepty'),
      isPrimary: recipe.is_primary !== false,
      components: componentsByRecipe.get(recipe.id) || [],
    };
    const list = candidates.get(row.outputItemKey) || [];
    list.push(row);
    candidates.set(row.outputItemKey, list);
  }

  const recipeBook = new Map();
  for (const [itemKey, list] of candidates) {
    const selected = list.find(recipe => recipe.isPrimary) || list[0];
    recipeBook.set(itemKey, selected);
  }
  return recipeBook;
}

function createProjectPlan(project, context) {
  const requirements = new Map();
  const allocatedOwned = new Map();
  const usedVirtual = new Map();
  const missing = new Map();
  const craftOperations = new Map();

  const consume = (pool, itemKey, quantity, targetMap) => {
    const available = pool.get(itemKey) || 0;
    const taken = Math.min(available, quantity);
    if (taken > 0) {
      pool.set(itemKey, available - taken);
      addToMap(targetMap, itemKey, taken);
    }
    return quantity - taken;
  };

  const fulfill = (itemKey, quantity, stack = [], useInventory = true) => {
    if (quantity <= 0) return;
    if (stack.includes(itemKey)) {
      throw new CraftPlannerError(`Wykryto zapętloną receptę dla ${itemKey}.`, {
        cycle: [...stack, itemKey],
      });
    }

    if (useInventory) addToMap(requirements, itemKey, quantity);

    let remaining = quantity;
    if (useInventory) {
      remaining = consume(context.virtualInventory, itemKey, remaining, usedVirtual);
      remaining = consume(context.ownedInventory, itemKey, remaining, allocatedOwned);
    }
    if (remaining <= 0) return;

    const recipe = context.recipeBook.get(itemKey);
    if (!recipe || recipe.components.length === 0) {
      addToMap(missing, itemKey, remaining);
      return;
    }

    const crafts = Math.ceil(remaining / recipe.outputQuantity);
    const produced = crafts * recipe.outputQuantity;
    addToMap(craftOperations, itemKey, crafts);

    for (const component of recipe.components) {
      fulfill(
        component.itemKey,
        component.quantity * crafts,
        [...stack, itemKey],
        true,
      );
    }

    const surplus = produced - remaining;
    if (surplus > 0) addToMap(context.virtualInventory, itemKey, surplus);
  };

  const targetQuantity = toPositiveInteger(project.target_quantity, 'Liczba sztuk w projekcie');
  // The target means "craft this many". Already-owned finished items do not reduce it.
  fulfill(project.target_item_key, targetQuantity, [], false);

  const requiredRows = mapToSortedRows(requirements, context.itemIndex).map(row => ({
    ...row,
    ownedAllocated: allocatedOwned.get(row.itemKey) || 0,
    generatedSurplusUsed: usedVirtual.get(row.itemKey) || 0,
    missing: missing.get(row.itemKey) || 0,
  }));

  return {
    id: project.id,
    name: project.name,
    targetItemKey: project.target_item_key,
    targetName: context.itemIndex.get(project.target_item_key)?.name || project.target_item_key,
    targetQuantity,
    priority: Number(project.priority ?? 100),
    status: project.status || ACTIVE_STATUS,
    reservesInventory: true,
    requirements: requiredRows,
    ownedAllocated: mapToSortedRows(allocatedOwned, context.itemIndex),
    generatedSurplusUsed: mapToSortedRows(usedVirtual, context.itemIndex),
    missing: mapToSortedRows(missing, context.itemIndex),
    craftOperations: mapToSortedRows(craftOperations, context.itemIndex).map(row => ({
      ...row,
      crafts: row.quantity,
      outputPerCraft: context.recipeBook.get(row.itemKey)?.outputQuantity || 1,
    })),
    complete: missing.size === 0,
  };
}

export function planCraftWorkspace({
  items = [],
  recipes = [],
  components = [],
  inventory = [],
  projects = [],
} = {}) {
  const itemIndex = new Map(items.map(item => [item.item_key, item]));
  const recipeBook = buildRecipeBook(recipes, components);
  const ownedInventory = new Map();

  for (const row of inventory) {
    if (!row?.item_key) continue;
    const quantity = toNonNegativeInteger(row.quantity, `Stan ${row.item_key}`);
    ownedInventory.set(row.item_key, quantity);
  }

  const originalOwned = new Map(ownedInventory);
  const virtualInventory = new Map();
  const activeProjects = projects
    .filter(project => (project.status || ACTIVE_STATUS) === ACTIVE_STATUS)
    .sort((a, b) => {
      const priority = Number(a.priority ?? 100) - Number(b.priority ?? 100);
      if (priority) return priority;
      const date = String(a.created_at || '').localeCompare(String(b.created_at || ''));
      if (date) return date;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

  const context = { itemIndex, recipeBook, ownedInventory, virtualInventory };
  const plannedProjects = activeProjects.map(project => createProjectPlan(project, context));
  const projectById = new Map(plannedProjects.map(project => [project.id, project]));

  const allProjects = projects.map(project => projectById.get(project.id) || ({
    id: project.id,
    name: project.name,
    targetItemKey: project.target_item_key,
    targetName: itemIndex.get(project.target_item_key)?.name || project.target_item_key,
    targetQuantity: Number(project.target_quantity || 0),
    priority: Number(project.priority ?? 100),
    status: project.status || ACTIVE_STATUS,
    reservesInventory: false,
    requirements: [],
    ownedAllocated: [],
    generatedSurplusUsed: [],
    missing: [],
    craftOperations: [],
    complete: false,
  }));

  const inventorySummary = [...originalOwned.entries()].map(([itemKey, quantity]) => {
    const available = ownedInventory.get(itemKey) || 0;
    return {
      itemKey,
      name: itemIndex.get(itemKey)?.name || itemKey,
      quantity,
      reserved: quantity - available,
      available,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'pl'));

  return {
    projects: allProjects,
    activeProjects: plannedProjects,
    inventory: inventorySummary,
    generatedSurplus: mapToSortedRows(virtualInventory, itemIndex),
  };
}

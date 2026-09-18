import { setCraftInventoryQuantity } from './craftWorkspace.js';

function ensureStyles() {
  if (document.querySelector('#craftInventoryDeleteStyles')) return;
  const style = document.createElement('style');
  style.id = 'craftInventoryDeleteStyles';
  style.textContent = `
    .craft-stock-actions{display:flex;gap:6px;justify-content:flex-end;align-items:center}
    .craft-stock-actions button{white-space:nowrap}
    .craft-stock-actions .craft-stock-remove{border-color:#6d3430!important;color:#e59b8f!important;background:#1b0d0c!important}
    .craft-stock-actions .craft-stock-remove:hover{border-color:#a74d44!important;color:#ffd0c8!important}
    @media(max-width:900px){.craft-stock-actions{grid-column:1/-1;justify-content:stretch}.craft-stock-actions button{flex:1}}
  `;
  document.head.appendChild(style);
}

function enhanceRows(root = document) {
  root.querySelectorAll?.('.craft-inventory-row').forEach(row => {
    if (row.dataset.removeReady === '1') return;
    const edit = row.querySelector('[data-craft-edit-stock]');
    if (!edit) return;
    const key = edit.dataset.craftEditStock;
    if (!key) return;

    const actions = document.createElement('div');
    actions.className = 'craft-stock-actions';
    edit.replaceWith(actions);
    actions.appendChild(edit);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'craft-stock-remove';
    remove.dataset.craftRemoveStock = key;
    remove.textContent = 'Usuń';
    actions.appendChild(remove);
    row.dataset.removeReady = '1';
  });
}

export function installCraftInventoryDeleteEnhancer(supabase) {
  if (!supabase || document.documentElement.dataset.craftInventoryDeleteInstalled === '1') return;
  document.documentElement.dataset.craftInventoryDeleteInstalled = '1';
  ensureStyles();

  document.addEventListener('click', async event => {
    const button = event.target.closest?.('[data-craft-remove-stock]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();

    const row = button.closest('.craft-inventory-row');
    const name = row?.querySelector('b')?.textContent?.trim() || 'ten materiał';
    if (!window.confirm(`Usunąć ${name} z magazynu?`)) return;

    button.disabled = true;
    try {
      await setCraftInventoryQuantity(supabase, button.dataset.craftRemoveStock, 0);
      const craftNav = document.querySelector('[data-zone-view="craft"]');
      craftNav?.click();
    } catch (error) {
      button.disabled = false;
      window.alert(error?.message || String(error));
    }
  }, true);

  const observer = new MutationObserver(() => queueMicrotask(() => enhanceRows()));
  const start = () => {
    enhanceRows();
    observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else queueMicrotask(start);
}

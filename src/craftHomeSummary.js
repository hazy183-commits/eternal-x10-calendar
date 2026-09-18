import { loadCraftWorkspace } from './craftWorkspace.js';
import { craftItemIconMarkup } from './craftItemIcons.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const fmt = value => Number(value || 0).toLocaleString('pl-PL');
const CRAFT_PANEL_LABEL = '<div class="craft-home-label"><span>⚒</span><b>CRAFT CALCULATOR</b><small>POSTĘP PROJEKTU</small></div>';

export function summarizeCraftProject(project) {
  const relevant = (project?.requirements || []).filter(row => {
    const have = Number(row.ownedAllocated || 0) + Number(row.generatedSurplusUsed || 0);
    return have > 0 || Number(row.missing || 0) > 0;
  });
  const have = relevant.reduce((sum, row) => sum + Number(row.ownedAllocated || 0) + Number(row.generatedSurplusUsed || 0), 0);
  const missing = relevant.reduce((sum, row) => sum + Number(row.missing || 0), 0);
  const total = have + missing;
  const rawPercent = total > 0 ? (have / total) * 100 : 0;
  const percent = project?.complete ? 100 : Math.max(0, Math.min(100, Math.round(rawPercent * 10) / 10));
  return { have, missing, total, percent };
}

export function wrapProjectIndex(index, projectCount) {
  if (!projectCount) return 0;
  return ((Number(index) % projectCount) + projectCount) % projectCount;
}

function visibleProjects(workspace) {
  return workspace.plan.activeProjects.length
    ? workspace.plan.activeProjects
    : workspace.plan.projects;
}

function targetItem(workspace, project) {
  return workspace.items.find(item => item.item_key === project.targetItemKey) || {
    item_key: project.targetItemKey,
    name: project.targetName,
  };
}

function renderEmpty(root) {
  root.classList.remove('is-complete');
  root.innerHTML = `
    ${CRAFT_PANEL_LABEL}
    <div class="craft-home-empty">
      <span class="eyebrow">Mój projekt craftu</span>
      <h2 id="craftHomeTitle">Nie masz jeszcze projektu craftu</h2>
      <p>Dodaj broń lub armor w Craft Calculatorze, a tutaj pojawi się jego aktualny postęp.</p>
    </div>
    <button class="primary-btn craft-home-open" type="button">⚒ Otwórz Craft Calculator</button>`;
}

function renderWorkspace(root, workspace, requestedIndex = 0) {
  const projects = visibleProjects(workspace);
  const projectIndex = wrapProjectIndex(requestedIndex, projects.length);
  const project = projects[projectIndex];
  if (!project) return renderEmpty(root);

  const summary = summarizeCraftProject(project);
  const item = targetItem(workspace, project);
  root.classList.toggle('is-complete', summary.percent === 100);
  root.innerHTML = `
    ${CRAFT_PANEL_LABEL}
    <div class="craft-home-main">
      ${craftItemIconMarkup(item, 'craft-home-icon')}
      <div class="craft-home-copy">
        <span class="eyebrow">Mój projekt craftu</span>
        <h2 id="craftHomeTitle">${escapeHtml(project.name || project.targetName)}</h2>
        <p>${escapeHtml(project.targetName)} × ${fmt(project.targetQuantity)}${project.status !== 'active' ? ' · Projekt wstrzymany' : ''}</p>
      </div>
    </div>
    <div class="craft-home-progress">
      <div class="craft-home-progress-head"><span>Ukończenie projektu</span><b>${summary.percent}%</b></div>
      <div class="craft-home-progress-track" role="progressbar" aria-label="Postęp projektu craftu" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${summary.percent}"><i style="--craft-progress:${summary.percent}%"></i></div>
    </div>
    <div class="craft-home-actions">
      ${projects.length > 1 ? `<div class="craft-home-switcher" aria-label="Przełącz projekt craftu"><button type="button" data-craft-project-step="-1" aria-label="Poprzedni projekt">‹</button><span>${projectIndex + 1} / ${projects.length}</span><button type="button" data-craft-project-step="1" aria-label="Następny projekt">›</button></div>` : ''}
      <button class="primary-btn craft-home-open" type="button">Zobacz projekt →</button>
    </div>`;
}

export function installCraftHomeSummary(supabase) {
  const root = document.querySelector('#craftHomeSummary');
  if (!root || !supabase || root.dataset.installed === '1') return;
  root.dataset.installed = '1';
  let request = 0;
  let workspaceCache = null;
  let selectedProjectId = null;

  const paint = workspace => {
    workspaceCache = workspace;
    const projects = visibleProjects(workspace);
    const selectedIndex = Math.max(0, projects.findIndex(project => String(project.id) === String(selectedProjectId)));
    selectedProjectId = projects[selectedIndex]?.id ?? null;
    renderWorkspace(root, workspace, selectedIndex);
  };

  const refresh = async () => {
    const current = ++request;
    try {
      const workspace = await loadCraftWorkspace(supabase);
      if (current === request) paint(workspace);
    } catch (error) {
      if (current !== request) return;
      root.innerHTML = `${CRAFT_PANEL_LABEL}<div class="craft-home-empty"><span class="eyebrow">Mój projekt craftu</span><h2 id="craftHomeTitle">Nie udało się wczytać projektu</h2><p>${escapeHtml(error?.message || error)}</p></div><button class="primary-btn craft-home-open" type="button">Otwórz Craft Calculator</button>`;
    }
  };

  root.addEventListener('click', event => {
    const stepButton = event.target.closest('[data-craft-project-step]');
    if (stepButton && workspaceCache) {
      const projects = visibleProjects(workspaceCache);
      const currentIndex = Math.max(0, projects.findIndex(project => String(project.id) === String(selectedProjectId)));
      const nextIndex = wrapProjectIndex(currentIndex + Number(stepButton.dataset.craftProjectStep), projects.length);
      selectedProjectId = projects[nextIndex]?.id ?? null;
      renderWorkspace(root, workspaceCache, nextIndex);
      return;
    }
    if (event.target.closest('.craft-home-open')) window.dispatchEvent(new CustomEvent('orzel:open-craft-workspace'));
  });
  window.addEventListener('orzel:craft-workspace-updated', event => {
    if (event.detail) paint(event.detail);
  });
  window.addEventListener('orzel:craft-data-changed', () => window.setTimeout(refresh, 80));
  window.addEventListener('focus', refresh);
  supabase.auth.onAuthStateChange(() => window.setTimeout(refresh, 0));
  refresh();
}

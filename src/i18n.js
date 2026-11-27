import { getLanguage, setLanguage, translateText, LANGUAGE_KEY } from './i18nCore.js';
import './i18n.css';

// The legacy views render independently. Translate their presentation without
// changing event identifiers, input values, handlers or database payloads.
const excluded = [
  'script', 'style', 'noscript', 'textarea', 'code', 'pre', '[contenteditable]',
  '[translate="no"]', '[data-no-i18n]', '.language-switch',
  '#memberZoneNick', '.owner-user-name b', '.ob-role-user b',
  '.ob-roster-name', '.ob-roster-user b', '[data-view-member]', '.member-profile-heading h2', '.ps-card-name', '.ps-player h3',
  '.site-ann-row h4', '.site-ann-row p',
  '.ob-ann-item h4', '.ob-ann-item>p', '.zone-announcement>b', '.zone-announcement>p',
  '.ob-poll-card>h3', '.ob-poll-description', '.ob-poll-option>span', '.ob-poll-result-line>span:first-child',
  '.ob-poll-admin-row strong', '.build-card-top>b', '.craft-target-title h4',
  '.ob-recruit-head h4', '.ob-recruit-message', '.ob-recruit-contact',
  '#nextLocation', '.event-title-line h3', '.event-description', '.event-info h3', '.event-location',
  '.ob-term-event b', '.mini-event b', '.admin-event-info h4',
  '.zone-event-info>b', '.zone-event-info>small', '.member-build-card h4',
  '.member-gear-item b', '.member-buff-list', '.brand', '.ob-gate-brand h1',
].join(',');
const textState = new WeakMap();
const attrState = new WeakMap();
const attributes = ['placeholder', 'aria-label', 'title', 'alt'];
let observer;

function translateNode(node) {
  const parent = node.parentElement;
  if (!parent || parent.closest(excluded)) return;
  const prior = textState.get(node);
  const original = prior && node.data === prior.rendered ? prior.original : node.data;
  const rendered = translateText(original);
  // Implicit option values are derived from their text. Pin the original value
  // before changing the label so filters and equipment saves remain unchanged.
  if (parent.tagName === 'OPTION' && !parent.hasAttribute('value') && rendered !== node.data) parent.setAttribute('value', parent.value);
  if (rendered !== node.data) node.data = rendered;
  textState.set(node, { original, rendered });
}

function translateAttributes(element) {
  if (element.closest(excluded)) return;
  let state = attrState.get(element);
  if (!state) { state = {}; attrState.set(element, state); }
  for (const name of attributes) {
    if (!element.hasAttribute(name)) continue;
    const current = element.getAttribute(name);
    const prior = state[name];
    const original = prior && current === prior.rendered ? prior.original : current;
    const rendered = translateText(original);
    if (current !== rendered) element.setAttribute(name, rendered);
    state[name] = { original, rendered };
  }
}

export function translateTree(root) {
  if (root.nodeType === Node.TEXT_NODE) { translateNode(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE || root.closest(excluded)) return;
  translateAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => node.nodeType === Node.ELEMENT_NODE && node.matches(excluded) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) translateNode(node);
    else translateAttributes(node);
  }
}

function switchMarkup() {
  const control = document.createElement('div');
  control.className = 'language-switch';
  control.setAttribute('role', 'group');
  control.setAttribute('aria-label', 'Język / Language');
  control.innerHTML = '<button type="button" data-language="pl" lang="pl" title="Polski">PL</button><button type="button" data-language="en" lang="en" title="English">EN</button>';
  control.addEventListener('click', event => {
    const button = event.target.closest('[data-language]');
    if (button) changeLanguage(button.dataset.language);
  });
  return control;
}

function mountSwitches() {
  for (const selector of ['.header-actions', '.ob-gate-header', '.member-auth-box', '.member-zone-side', '#adminModal .modal-header-actions', '.ps-demo-header']) {
    const host = document.querySelector(selector);
    if (!host || host.querySelector(':scope > .language-switch')) continue;
    // The premium login header is preferred over a second control in its form.
    if (selector === '.member-auth-box' && document.querySelector('.ob-gate-header')) {
      host.querySelector(':scope > .language-switch')?.remove();
      continue;
    }
    host.prepend(switchMarkup());
  }
  if (document.querySelector('.ob-gate-header')) document.querySelector('.member-auth-box > .language-switch')?.remove();
  syncSwitches();
}

function syncSwitches() {
  for (const button of document.querySelectorAll('.language-switch button')) {
    const selected = button.dataset.language === getLanguage();
    if (button.getAttribute('aria-pressed') !== String(selected)) button.setAttribute('aria-pressed', String(selected));
  }
}

function observe() {
  observer.observe(document.body, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:attributes });
}

export function changeLanguage(value) {
  // Consume pending source changes before restoring previously translated nodes.
  observer?.disconnect();
  setLanguage(value);
  document.documentElement.lang = getLanguage();
  translateTree(document.body);
  syncSwitches();
  observe();
  window.dispatchEvent(new CustomEvent('orzel:language-changed', { detail:{ language:getLanguage() } }));
}

if (typeof document !== 'undefined') {
  const install = () => {
    document.documentElement.lang = getLanguage();
    observer = new MutationObserver(records => {
      observer.disconnect();
      const roots = new Set();
      let added = false;
      for (const record of records) {
        if (record.type === 'childList') {
          for (const node of record.addedNodes) { roots.add(node); added = true; }
        } else roots.add(record.target);
      }
      for (const root of roots) if (root.isConnected) translateTree(root);
      if (added) mountSwitches();
      observe();
    });
    mountSwitches();
    translateTree(document.body);
    observe();
    window.addEventListener('storage', event => {
      if (event.key === LANGUAGE_KEY) changeLanguage(event.newValue);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}

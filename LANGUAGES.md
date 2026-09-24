# Polish and English interface

The PL / EN controls appear in the site header, login header, clan sidebar, admin modal and profile studio preview. Polish is the default. The choice is stored locally as `ob-language-v1`; switching does not reload the page or save any form.

`src/i18nCore.js` provides language persistence and whole-message translation. `src/translations.js` and `src/translationsGame.js` contain the reviewed English copy. No external translation service is used. Dates keep their original server/Warsaw time zone.

The existing views render independently, so `src/i18n.js` translates text nodes and accessible labels when they appear or change. It retains the original Polish text for switching back, preserves existing elements/listeners and pins implicit option values before translating labels. Input values, identifiers and request payloads are never translated.

Player-authored content is excluded with `data-no-i18n`, `translate="no"` and selectors for existing authored-content fields. New views should mark player names, poll questions/options, announcement bodies and similar content explicitly. Add complete UI phrases to the catalogue rather than translating arbitrary text fragments.

Header normalization and permission controls use language-independent state; do not introduce logic that compares translated labels.

Validation:

- `node --test` includes language persistence, messages, confirmations and header observer stability.
- With Vite running, open `/tests/i18n-browser.html` for DOM regression checks: drafts, select values, user content, asynchronous renders, handlers and PL/EN round trips. This test page is not an input to the production build.
- `node node_modules/vite/bin/vite.js build` produces the production site.

Authenticated layouts were checked with a local fixture; no real-account production writes were made during language testing.

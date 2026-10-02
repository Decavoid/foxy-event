// Apply the saved/system theme before CSS paints, including direct-file previews.
(function () {
  'use strict';

  const storageKey = 'retro-marathon-theme';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  let toggle = null;

  function validPreference(value) {
    return value === 'dark' || value === 'light' ? value : null;
  }

  try {
    preference = validPreference(window.localStorage.getItem(storageKey));
  } catch {
    // Storage can be unavailable in private browsing or when opened from disk.
  }

  function applyTheme() {
    const theme = preference || (systemTheme.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = theme === 'dark' ? '#141a12' : '#f4f3ed';
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.title = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
    }
  }

  function bindToggle() {
    toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.hidden = false;
    applyTheme();
    toggle.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(storageKey, preference);
      } catch {
        // Keep the user's choice for this page even when it cannot be saved.
      }
      applyTheme();
    });
  }

  applyTheme();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggle, { once: true });
  } else {
    bindToggle();
  }
  systemTheme.addEventListener('change', () => {
    if (!preference) applyTheme();
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = validPreference(event.newValue);
    applyTheme();
  });
})();

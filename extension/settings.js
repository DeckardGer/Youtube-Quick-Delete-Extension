// Shared settings for all of the extension's content scripts.
// Content scripts from the same extension share one isolated world, so the
// other scripts read this via `window.__ytEnhancer`.
(() => {
  const STORAGE_KEY = "ytEnhancerSettings";
  const DEFAULTS = {
    autoSpeedEnabled: true,
    playbackSpeed: 1.25,
    deleteButtonsEnabled: true,
  };

  let current = { ...DEFAULTS };
  const listeners = new Set();

  function notify() {
    for (const fn of listeners) {
      try {
        fn(current);
      } catch (e) {
        /* ignore a bad listener */
      }
    }
  }

  chrome.storage.local.get(STORAGE_KEY, (res) => {
    current = { ...DEFAULTS, ...(res && res[STORAGE_KEY]) };
    notify();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[STORAGE_KEY]) return;
    current = { ...DEFAULTS, ...changes[STORAGE_KEY].newValue };
    notify();
  });

  window.__ytEnhancer = {
    defaults: DEFAULTS,
    get() {
      return current;
    },
    // Registers fn and calls it immediately with the current settings.
    // Returns an unsubscribe function.
    subscribe(fn) {
      listeners.add(fn);
      fn(current);
      return () => listeners.delete(fn);
    },
  };
})();

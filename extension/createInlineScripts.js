// Injects the page-context playback-speed controller and bridges settings to it.
// The speed script must run in the page's own world so it can call the
// YouTube player's setPlaybackRate(); this content script relays settings to it
// over window.postMessage (the two share the same window).
(() => {
  const src = chrome.runtime.getURL("web-accessible/autoPlaybackSpeed.js");
  const el = document.createElement("script");
  el.src = src;
  el.addEventListener("load", () => el.remove());
  (document.head || document.documentElement).appendChild(el);

  function pushToPage(settings) {
    window.postMessage(
      {
        source: "yt-enhancer-content",
        type: "settings",
        autoSpeedEnabled: settings.autoSpeedEnabled,
        playbackSpeed: settings.playbackSpeed,
      },
      location.origin
    );
  }

  // The page script asks for settings once it's ready (handles the injection race).
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const d = event.data;
    if (!d || d.source !== "yt-enhancer-page") return;
    if (d.type === "request-settings" && window.__ytEnhancer) {
      pushToPage(window.__ytEnhancer.get());
    }
  });

  // Forward the current settings now and on every change.
  if (window.__ytEnhancer) {
    window.__ytEnhancer.subscribe(pushToPage);
  }
})();

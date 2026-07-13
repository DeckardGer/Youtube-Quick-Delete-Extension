// Adds a one-click "remove from playlist" button to every playlist video, on
// both the /playlist page and the watch-page playlist panel.
(() => {
  const BTN_ID = "manual-delete";
  const TARGET_TAGS = [
    "YTD-PLAYLIST-VIDEO-RENDERER",
    "YTD-PLAYLIST-PANEL-VIDEO-RENDERER",
  ];
  const TRASH_SVG =
    '<svg enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><path d="M11 17H9V8h2v9zm4-9h-2v9h2V8zm4-4v1h-1v16H6V5H5V4h4V3h6v1h4zm-2 1H7v15h10V5z"></path></svg>';

  let enabled = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function isTarget(node) {
    return node && node.nodeType === 1 && TARGET_TAGS.includes(node.nodeName);
  }

  // Finds the "Remove from ..." item inside the currently open action menu.
  // Matches by text prefix rather than an exact string or a brittle XPath.
  function findRemoveItem() {
    const items = document.querySelectorAll(
      "ytd-popup-container ytd-menu-service-item-renderer"
    );
    for (const item of items) {
      // Skip closed menus still lingering in the DOM (YouTube display:none's
      // them, so offsetParent is null). The open menu is only visibility:hidden
      // via setMenuHidden(), so its items keep an offsetParent.
      if (item.offsetParent === null) continue;
      const text = (item.textContent || "").trim().toLowerCase();
      if (text.startsWith("remove from")) return item;
    }
    return null;
  }

  // Closes any open dropdown and clears the scroll-locking backdrop. This is the
  // safety net that prevents the page from freezing if the remove item can't be
  // found for any reason.
  function closeMenus() {
    document.querySelectorAll("tp-yt-iron-dropdown").forEach((d) => {
      try {
        if (d.opened && typeof d.close === "function") d.close();
      } catch (e) {
        /* ignore */
      }
    });
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        keyCode: 27,
        which: 27,
        bubbles: true,
      })
    );
  }

  // Hides the action menu + backdrop while we drive it, so the user never sees
  // it flash open. Programmatic clicks still work on hidden elements.
  function setMenuHidden(hidden) {
    const STYLE_ID = "yt-enhancer-hide-menu";
    let style = document.getElementById(STYLE_ID);
    if (hidden) {
      if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent =
          "ytd-popup-container tp-yt-iron-dropdown{visibility:hidden !important;}" +
          "tp-yt-iron-overlay-backdrop{opacity:0 !important;}";
        (document.head || document.documentElement).appendChild(style);
      }
    } else if (style) {
      style.remove();
    }
  }

  async function deleteVideo(videoElement) {
    const menuButton =
      videoElement.querySelector("#menu #button") ||
      videoElement.querySelector("ytd-menu-renderer yt-icon-button") ||
      videoElement.querySelector("#menu button");
    if (!menuButton) return;

    let removed = false;
    setMenuHidden(true);
    try {
      menuButton.click();

      // Poll for the freshly populated menu instead of a fixed delay.
      let removeItem = null;
      for (let i = 0; i < 40 && !removeItem; i++) {
        await sleep(25);
        removeItem = findRemoveItem();
      }

      if (removeItem) {
        removeItem.click();
        removed = true;
      }
    } catch (e) {
      /* fall through to cleanup */
    } finally {
      // If the removal didn't go through, never leave the page stuck behind an
      // open menu + backdrop (this was the old freeze bug).
      if (!removed) closeMenus();
      setMenuHidden(false);
    }
  }

  function addDeleteButton(video) {
    if (!isTarget(video) || video.querySelector("button#" + BTN_ID)) return;

    const button = document.createElement("button");
    button.id = BTN_ID;
    button.type = "button";
    button.title = "Remove from playlist";
    button.setAttribute("aria-label", "Remove from playlist");
    button.innerHTML = TRASH_SVG;
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteVideo(video);
    });
    video.appendChild(button);
  }

  function scan() {
    if (!enabled) return;
    document
      .querySelectorAll(TARGET_TAGS.join(","))
      .forEach(addDeleteButton);
  }

  function removeAllButtons() {
    document.querySelectorAll("button#" + BTN_ID).forEach((b) => b.remove());
  }

  // One debounced observer for the whole app keeps buttons present across
  // YouTube's SPA navigation and lazy-loaded rows.
  let scanScheduled = false;
  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(() => {
      scanScheduled = false;
      scan();
    }, 200);
  }

  function start() {
    const root = document.querySelector("ytd-app") || document.body;
    if (root) {
      new MutationObserver(scheduleScan).observe(root, {
        childList: true,
        subtree: true,
      });
    }
    window.addEventListener("yt-navigate-finish", scheduleScan);
    scan();
  }

  if (window.__ytEnhancer) {
    window.__ytEnhancer.subscribe((s) => {
      const was = enabled;
      enabled = !!s.deleteButtonsEnabled;
      if (enabled && !was) scan();
      else if (!enabled && was) removeAllButtons();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

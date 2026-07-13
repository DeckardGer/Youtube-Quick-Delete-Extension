// Runs in the page's own world so it can call the YouTube player API.
// Applies the desired playback speed once per video, so a manual change on one
// video is respected until the next video loads, which then snaps back to the
// configured default.
(() => {
  let desiredSpeed = 1.25;
  let enabled = true;
  let lastAppliedId = null;

  function getPlayer() {
    return document.getElementById("movie_player");
  }

  function apply() {
    if (!enabled) return;
    const p = getPlayer();
    if (!p) return;
    if (typeof p.setPlaybackRate === "function") {
      try {
        p.setPlaybackRate(desiredSpeed);
      } catch (e) {
        /* ignore */
      }
    }
    const video = p.querySelector("video");
    if (video) {
      try {
        video.playbackRate = desiredSpeed;
      } catch (e) {
        /* ignore */
      }
    }
  }

  function currentVideoId() {
    const p = getPlayer();
    try {
      return p && p.getVideoData ? p.getVideoData().video_id : null;
    } catch (e) {
      return null;
    }
  }

  function onMaybeNewVideo(force) {
    if (!enabled) return;
    const id = currentVideoId();
    if (force || (id && id !== lastAppliedId)) {
      if (id) lastAppliedId = id;
      apply();
      // The player sometimes resets the rate just after a video loads; nudge it.
      setTimeout(apply, 300);
      setTimeout(apply, 1000);
    }
  }

  // A new media source loaded into the player => new video (fires in capture
  // phase because media events don't bubble).
  document.addEventListener("loadstart", () => onMaybeNewVideo(false), true);
  // SPA navigation to a different watch page.
  window.addEventListener("yt-navigate-finish", () => onMaybeNewVideo(false));

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const d = event.data;
    if (!d || d.source !== "yt-enhancer-content" || d.type !== "settings") return;

    const wasEnabled = enabled;
    enabled = !!d.autoSpeedEnabled;
    const newSpeed = Number(d.playbackSpeed);
    const speedChanged = newSpeed && newSpeed !== desiredSpeed;
    if (newSpeed) desiredSpeed = newSpeed;

    // Apply immediately when the user changes the speed or re-enables from the popup.
    if (enabled && (speedChanged || !wasEnabled)) apply();
  });

  function requestSettings() {
    window.postMessage(
      { source: "yt-enhancer-page", type: "request-settings" },
      location.origin
    );
  }

  requestSettings();
  // The content bridge may not have been listening on the first try.
  setTimeout(requestSettings, 500);

  // Apply to whatever is already playing on first load. Retry a few times since
  // the player may not exist yet when this script first runs.
  onMaybeNewVideo(true);
  setTimeout(() => onMaybeNewVideo(true), 1500);
  setTimeout(() => onMaybeNewVideo(true), 3500);
})();

# YouTube Enhancer

Two quality-of-life features for YouTube:

1. **Quick delete** — a one-click bin button on every video in your playlists, so you don't have to open the ⋯ menu and hunt for "Remove from playlist".
2. **Default playback speed** — sets a speed of your choice on every video automatically, controllable from the toolbar popup.

## Popup controls

Click the extension icon to:

- Toggle the **default playback speed** on/off and pick the speed (slider + presets).
- Toggle the **playlist delete buttons** on/off.

Settings are saved with `chrome.storage` and apply live to any open YouTube tab.

## How playback speed works

The speed is re-applied **once per video**. If you manually change the speed on a
video, that change sticks for that video, but the next video snaps back to your
configured default — so you never have to keep re-setting it.

The controller (`web-accessible/autoPlaybackSpeed.js`) runs in the page's own
world so it can call the YouTube player's `setPlaybackRate()`. It detects a new
video via the player's video id (from `loadstart` and `yt-navigate-finish`) and
receives your settings from the content script over `postMessage`.

## How quick delete works

`extension/playlistDelete.js` adds a bin button to every
`ytd-playlist-video-renderer` (on `/playlist`) and
`ytd-playlist-panel-video-renderer` (in the watch-page playlist panel). A single
debounced `MutationObserver` on the app keeps buttons present across YouTube's
SPA navigation and lazily-loaded rows.

Clicking a bin button opens the video's action menu (kept hidden), finds the
"Remove from …" item by text prefix, and clicks it. The whole operation is
wrapped in `try/finally` that **always** closes the dropdown and its backdrop —
so if the remove item can't be found, the page can't get stuck behind a
scroll-locking overlay.

> Note: an earlier version froze the page when YouTube changed the menu markup —
> the old code clicked a menu item found by an exact-text XPath with no null
> check, threw, and left the backdrop up. That's fixed by the null-safe lookup
> and guaranteed cleanup above.

## Files

- `manifest.json` — MV3 manifest (`storage` permission, toolbar popup).
- `extension/settings.js` — shared settings store for the content scripts.
- `extension/createInlineScripts.js` — injects the speed controller and bridges settings to it.
- `extension/playlistDelete.js` — the playlist bin buttons.
- `web-accessible/autoPlaybackSpeed.js` — the page-context speed controller.
- `popup/` — the toolbar popup UI.
- `styles.css` — bin button styling.

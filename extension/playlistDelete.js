(() => {
  async function waitForElementToExist(selector) {
    let element;

    while (!element) {
      element = document.querySelector(selector);

      if (!element) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return element;
  }

  async function deleteVideo(videoElement) {
    const actionMenuButton = videoElement.querySelector("#menu #button");

    popupContainer.style = "display: none";

    actionMenuButton.click();

    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });

    let removeCheckString =
      "//tp-yt-paper-listbox/ytd-menu-service-item-renderer";

    if (videoElement.nodeName === "YTD-PLAYLIST-VIDEO-RENDERER") {
      removeCheckString +=
        "[./tp-yt-paper-item/yt-formatted-string/span[text() = 'Remove from ']]";
    } else if (videoElement.nodeName === "YTD-PLAYLIST-PANEL-VIDEO-RENDERER") {
      removeCheckString +=
        "[./tp-yt-paper-item/yt-formatted-string[text() = 'Remove from playlist']]";
    }

    const deleteButton = document.evaluate(
      removeCheckString,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    deleteButton.click();

    popupContainer.style = "display: block";
  }

  function addDeleteButton(video) {
    if (
      (video.nodeName === "YTD-PLAYLIST-VIDEO-RENDERER" ||
        video.nodeName === "YTD-PLAYLIST-PANEL-VIDEO-RENDERER") &&
      !video.querySelector("button#manual-delete")
    ) {
      const button = document.createElement("button");
      const svg =
        '<svg enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><path d="M11 17H9V8h2v9zm4-9h-2v9h2V8zm4-4v1h-1v16H6V5H5V4h4V3h6v1h4zm-2 1H7v15h10V5z"></path></svg>';

      button.id = "manual-delete";

      button.innerHTML = svg;
      video.appendChild(button);

      button.addEventListener("click", () => {
        deleteVideo(video);
      });
    }
  }

  async function injectObserver(selector) {
    const videosList = await waitForElementToExist(selector);

    const observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((addedNode) => {
            addDeleteButton(addedNode);
          });
        }
      }
    });

    observer.observe(videosList, { childList: true });

    if (videosList.childNodes.length > 0) {
      videosList.childNodes.forEach((video) => {
        addDeleteButton(video);
      });
    }
  }

  function isPlaylistPage() {
    return /^https:\/\/www\.youtube\.com\/playlist/.test(window.location.href);
  }

  function checkIfPlaylistPage() {
    if (isPlaylistPage()) {
      injectObserver(playlistVideosSelector);
      window.removeEventListener("yt-page-data-updated", checkIfPlaylistPage);
    }
  }

  async function init() {
    popupContainer = await waitForElementToExist("ytd-popup-container");

    injectObserver(inlineVideosSelector);

    if (isPlaylistPage()) {
      injectObserver(playlistVideosSelector);
    } else {
      // Variables that track new pages:
      // yt-navigate-start and yt-page-data-updated
      window.addEventListener("yt-page-data-updated", checkIfPlaylistPage);
    }
  }

  const playlistVideosSelector =
    "#primary ytd-playlist-video-list-renderer #contents";
  const inlineVideosSelector = "#columns ytd-playlist-panel-renderer #items";
  let popupContainer = null;

  init();
})();

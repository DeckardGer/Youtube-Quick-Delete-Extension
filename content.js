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

function addDeleteButton(video) {
  if (video.nodeName === "YTD-PLAYLIST-VIDEO-RENDERER") {
    const button = document.createElement("button");
    const svg =
      '<svg enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><path d="M11 17H9V8h2v9zm4-9h-2v9h2V8zm4-4v1h-1v16H6V5H5V4h4V3h6v1h4zm-2 1H7v15h10V5z"></path></svg>';

    button.id = "manualDelete";
    button.style =
      "width: 40px; height: 40px; background: transparent; border: 0; fill: rgb(255, 255, 255); cursor: pointer;";

    button.innerHTML = svg;
    video.appendChild(button);

    button.addEventListener("click", () => {
      deleteVideo(video);
    });
  }
}

async function deleteVideo(videoElement) {
  const actionMenuButton = videoElement.querySelector("#menu #button");

  popupContainer.style = "display: none";

  actionMenuButton.click();

  await new Promise((resolve) => {
    setTimeout(resolve, 5);
  });

  const deleteButton = document.evaluate(
    `//tp-yt-paper-listbox/ytd-menu-service-item-renderer[./tp-yt-paper-item/yt-formatted-string/span]`,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  deleteButton.click();

  popupContainer.style = "display: block";
}

async function setupMutationObserver() {
  const videosList = await waitForElementToExist(
    "#primary ytd-playlist-video-list-renderer #contents"
  );
  popupContainer = await waitForElementToExist("ytd-popup-container");

  const observer = new MutationObserver((mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((addedNode) => {
          addDeleteButton(addedNode);
        });
      }
    }
  });

  console.log("Setup Mutation Observer");

  window.addEventListener("unload", () => {
    observer.disconnect();
    console.log("Disconnect");
  });

  observer.observe(videosList, { childList: true });

  if (videosList.childNodes.length > 0) {
    videosList.childNodes.forEach((video) => {
      addDeleteButton(video);
    });
  }
}

let popupContainer;
setupMutationObserver();

// chrome.webNavigation.onCompleted.addListener((details) => {
//   if (
//     details.url &&
//     details.url.startsWith("https://www.youtube.com/playlist")
//   ) {
//     console.log("Hi");
//   }
// });

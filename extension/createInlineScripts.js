(() => {
  const path = chrome.runtime.getURL("web-accessible/autoPlaybackSpeed.js");
  let element = document.createElement("script");
  element.src = path;
  document.documentElement.appendChild(element);
})();

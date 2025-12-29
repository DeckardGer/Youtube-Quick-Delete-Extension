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

async function init() {
  const player = await waitForElementToExist("#movie_player");
  player.setPlaybackRate(1.25);
  console.log(player.getPlaybackRate());
}

init();

const STORAGE_KEY = "ytEnhancerSettings";
const DEFAULTS = {
  autoSpeedEnabled: true,
  playbackSpeed: 1.25,
  deleteButtonsEnabled: true,
};

const autoSpeed = document.getElementById("auto-speed");
const deleteButtons = document.getElementById("delete-buttons");
const speedControls = document.getElementById("speed-controls");
const range = document.getElementById("speed-range");
const readout = document.getElementById("speed-readout");
const presets = document.getElementById("presets");

let settings = { ...DEFAULTS };

function save() {
  chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

function render() {
  autoSpeed.checked = settings.autoSpeedEnabled;
  deleteButtons.checked = settings.deleteButtonsEnabled;

  const speed = Number(settings.playbackSpeed) || DEFAULTS.playbackSpeed;
  range.value = speed;
  readout.textContent = speed.toFixed(2).replace(/\.?0+$/, "");
  speedControls.classList.toggle("disabled", !settings.autoSpeedEnabled);

  for (const btn of presets.querySelectorAll("button")) {
    btn.classList.toggle("active", Number(btn.dataset.speed) === speed);
  }
}

function setSpeed(value) {
  settings.playbackSpeed = Number(value);
  render();
  save();
}

autoSpeed.addEventListener("change", () => {
  settings.autoSpeedEnabled = autoSpeed.checked;
  render();
  save();
});

deleteButtons.addEventListener("change", () => {
  settings.deleteButtonsEnabled = deleteButtons.checked;
  save();
});

range.addEventListener("input", () => {
  // Update the readout live while dragging; persist as it changes.
  setSpeed(range.value);
});

presets.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-speed]");
  if (btn) setSpeed(btn.dataset.speed);
});

chrome.storage.local.get(STORAGE_KEY, (res) => {
  settings = { ...DEFAULTS, ...(res && res[STORAGE_KEY]) };
  render();
});

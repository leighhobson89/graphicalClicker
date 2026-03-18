import { UI } from "./ui.js";
import { initTheme, applyTheme } from "./themeManager.js";
import { initLanguage } from "./languageManager.js";
import { getHudSnapshot, tickGameLogic } from "./game.js";
import { 
  startAutosave, 
  stopAutosave, 
  loadFromLocalStorage, 
  hasSave,
  saveToLocalStorage 
} from "./saveManager.js";
import { globals } from "./constantsAndGlobalVariables.js";

const GameStates = {
  menuState: "menuState",
  gameActiveState: "gameActiveState"
};

let currentState = GameStates.menuState;
let intervalId = null;

function setState(nextState) {
  currentState = nextState;

  if (currentState === GameStates.menuState) {
    stopLoop();
    stopAutosave();
    saveToLocalStorage(); // Save before going to menu
    UI.showMenu();
    UI.renderMenu({
      onNewGame: () => setState(GameStates.gameActiveState),
      onContinue: () => setState(GameStates.gameActiveState),
      hasExistingSave: hasSave()
    });
    return;
  }

  if (currentState === GameStates.gameActiveState) {
    UI.showGame();
    UI.renderGame({
      onBackToMenu: () => setState(GameStates.menuState)
    }).then(() => {
      startLoop();
      startAutosave(); // Start autosave when game starts
    });
  }
}

function startLoop() {
  if (intervalId) return;

  const fps = 30;
  const frameMs = 1000 / fps;
  let last = performance.now();

  intervalId = window.setInterval(() => {
    const now = performance.now();
    const dtMs = now - last;
    last = now;

    const dtSeconds = dtMs / 1000;
    tickGameLogic(dtSeconds);

    UI.updateHud();
  }, frameMs);
}

function stopLoop() {
  if (!intervalId) return;
  window.clearInterval(intervalId);
  intervalId = null;
}

function boot() {
  UI.init();

  initLanguage().then(() => {
    // Try to load existing save
    loadFromLocalStorage();
    // Apply theme from loaded save (or default)
    applyTheme(globals.getSelectedTheme());
    setState(GameStates.menuState);
  });
}

boot();

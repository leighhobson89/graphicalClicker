import { UI } from "./ui.js";
import { initTheme, applyTheme } from "./themeManager.js";
import { initLanguage } from "./languageManager.js";
import { getHudSnapshot } from "./game.js";
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

function setState(nextState) {
  currentState = nextState;

  if (currentState === GameStates.menuState) {
    stopAutosave();
    saveToLocalStorage();
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
      startAutosave();
    });
  }
}

function boot() {
  UI.init();

  initLanguage().then(() => {
    loadFromLocalStorage();
    applyTheme(globals.getSelectedTheme());
    setState(GameStates.menuState);
  });
}

boot();

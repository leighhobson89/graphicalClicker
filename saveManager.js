import { globals, upgrades, resetGameVariables, recalculateAllRPS } from "./constantsAndGlobalVariables.js";

const SAVE_KEY = 'clickerGameSave';
const AUTOSAVE_INTERVAL = 60000;

let autosaveTimer = null;

function createSaveData() {
  return {
    version: 4,
    timestamp: Date.now(),
    gems: globals.getGems(),
    totalGemsEarned: globals.getTotalGemsEarned(),
    wood: globals.getWood(),
    totalWoodEarned: globals.getTotalWoodEarned(),
    stone: globals.getStone(),
    totalStoneEarned: globals.getTotalStoneEarned(),
    gold: globals.getGold(),
    totalGoldEarned: globals.getTotalGoldEarned(),
    fish: globals.getFish(),
    totalFishEarned: globals.getTotalFishEarned(),
    cars: globals.getCars(),
    totalCarsEarned: globals.getTotalCarsEarned(),
    totalClicks: globals.getTotalClicks(),
    soundEnabled: globals.getSoundEnabled(),
    selectedTheme: globals.getSelectedTheme(),
    selectedLanguage: globals.getSelectedLanguage(),
    upgrades: Object.fromEntries(
      Object.entries(upgrades).map(([id, u]) => [id, { owned: u.owned }])
    )
  };
}

function applySaveData(data) {
  if (!data) {
    console.error('Invalid save data');
    return false;
  }
  
  if (data.version !== 1 && data.version !== 2 && data.version !== 3 && data.version !== 4) {
    console.error('Invalid save data version');
    return false;
  }

  resetGameVariables();

  globals.setGems(data.gems || 0);
  globals.setTotalGemsEarned(data.totalGemsEarned || 0);
  
  if (data.version >= 2) {
    globals.setWood(data.wood || 0);
    globals.setTotalWoodEarned(data.totalWoodEarned || 0);
    globals.setStone(data.stone || 0);
    globals.setTotalStoneEarned(data.totalStoneEarned || 0);
    globals.setGold(data.gold || 0);
    globals.setTotalGoldEarned(data.totalGoldEarned || 0);
  }
  
  if (data.version >= 3) {
    globals.setFish(data.fish || 0);
    globals.setTotalFishEarned(data.totalFishEarned || 0);
  }
  
  if (data.version >= 4) {
    globals.setCars(data.cars || 0);
    globals.setTotalCarsEarned(data.totalCarsEarned || 0);
  }
  
  globals.setTotalClicks(data.totalClicks || 0);
  globals.setSoundEnabled(data.soundEnabled !== undefined ? data.soundEnabled : true);
  globals.setSelectedTheme(data.selectedTheme || 'light');
  globals.setSelectedLanguage(data.selectedLanguage || 'en');

  if (data.upgrades) {
    Object.entries(data.upgrades).forEach(([id, saved]) => {
      if (upgrades[id] && saved.owned !== undefined) {
        upgrades[id].owned = saved.owned;
      }
    });
  }

  recalculateAllRPS();
  return true;
}

export function saveToLocalStorage() {
  try {
    const saveData = createSaveData();
    const json = JSON.stringify(saveData);
    const compressed = LZString.compressToBase64(json);
    localStorage.setItem(SAVE_KEY, compressed);
    console.log('Game saved to LocalStorage');
    return true;
  } catch (e) {
    console.error('Failed to save game:', e);
    return false;
  }
}

export function loadFromLocalStorage() {
  try {
    const compressed = localStorage.getItem(SAVE_KEY);
    if (!compressed) {
      console.log('No save found in LocalStorage');
      return false;
    }

    const json = LZString.decompressFromBase64(compressed);
    const saveData = JSON.parse(json);
    const success = applySaveData(saveData);

    if (success) {
      console.log('Game loaded from LocalStorage');
    }
    return success;
  } catch (e) {
    console.error('Failed to load game:', e);
    return false;
  }
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function exportSave() {
  try {
    const saveData = createSaveData();
    const json = JSON.stringify(saveData);
    const compressed = LZString.compressToBase64(json);

    const blob = new Blob([compressed], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clicker-save-${new Date().toISOString().slice(0, 10)}.save`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Save exported');
    return true;
  } catch (e) {
    console.error('Failed to export save:', e);
    return false;
  }
}

export async function importSave(file) {
  try {
    const compressed = await file.text();
    const json = LZString.decompressFromBase64(compressed);
    const saveData = JSON.parse(json);
    const success = applySaveData(saveData);

    if (success) {
      console.log('Save imported successfully');
      saveToLocalStorage();
    }
    return success;
  } catch (e) {
    console.error('Failed to import save:', e);
    return false;
  }
}

export function startAutosave() {
  if (autosaveTimer) return;

  autosaveTimer = setInterval(() => {
    saveToLocalStorage();
  }, AUTOSAVE_INTERVAL);

  console.log('Autosave started (every 60 seconds)');
}

export function stopAutosave() {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
    console.log('Autosave stopped');
  }
}

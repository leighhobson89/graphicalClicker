import { globals, resetGameVariables } from "./constantsAndGlobalVariables.js";

const SAVE_KEY = 'trafficRushSave';
const AUTOSAVE_INTERVAL = 60000;

let autosaveTimer = null;

function createSaveData() {
  return {
    version: 1,
    timestamp: Date.now(),
    cars: globals.getCars(),
    totalCarsEarned: globals.getTotalCarsEarned(),
    totalClicks: globals.getTotalClicks(),
    soundEnabled: globals.getSoundEnabled(),
    selectedTheme: globals.getSelectedTheme(),
    selectedLanguage: globals.getSelectedLanguage()
  };
}

function applySaveData(data) {
  if (!data) {
    console.error('Invalid save data');
    return false;
  }

  if (data.version !== 1) {
    console.error('Invalid save data version');
    return false;
  }

  resetGameVariables();

  if (data.cars !== undefined) {
    const currentCars = globals.getCars();
    globals.addCars(data.cars - currentCars);
  }

  if (data.totalClicks !== undefined) {
    const clicksToAdd = data.totalClicks;
    for (let i = 0; i < clicksToAdd; i++) {
      globals.incrementClicks();
    }
  }

  globals.setSoundEnabled(data.soundEnabled !== undefined ? data.soundEnabled : true);
  globals.setSelectedTheme(data.selectedTheme || 'dark');
  globals.setSelectedLanguage(data.selectedLanguage || 'en');

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
    a.download = `traffic-rush-save-${new Date().toISOString().slice(0, 10)}.save`;
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

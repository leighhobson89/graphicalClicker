// Save/Load Manager with LZString compression
// LZString is loaded from CDN in index.html

import { globals, upgrades, resetGameVariables, recalculateAllRPS } from "./constantsAndGlobalVariables.js";

const SAVE_KEY = 'clickerGameSave';
const AUTOSAVE_INTERVAL = 60000; // 1 minute

let autosaveTimer = null;

// Create a save data object from current game state
function createSaveData() {
  return {
    version: 2, // Incremented for 4-resource format
    timestamp: Date.now(),
    // All 4 resources
    gems: globals.getGems(),
    totalGemsEarned: globals.getTotalGemsEarned(),
    wood: globals.getWood(),
    totalWoodEarned: globals.getTotalWoodEarned(),
    stone: globals.getStone(),
    totalStoneEarned: globals.getTotalStoneEarned(),
    gold: globals.getGold(),
    totalGoldEarned: globals.getTotalGoldEarned(),
    // Shared
    totalClicks: globals.getTotalClicks(),
    soundEnabled: globals.getSoundEnabled(),
    selectedTheme: globals.getSelectedTheme(),
    selectedLanguage: globals.getSelectedLanguage(),
    upgrades: Object.fromEntries(
      Object.entries(upgrades).map(([id, u]) => [id, { owned: u.owned }])
    )
  };
}

// Apply save data to game state
function applySaveData(data) {
  if (!data) {
    console.error('Invalid save data');
    return false;
  }
  
  // Support both version 1 (legacy) and version 2 (4-resource)
  if (data.version !== 1 && data.version !== 2) {
    console.error('Invalid save data version');
    return false;
  }

  resetGameVariables();

  // Load gems (both versions)
  globals.setGems(data.gems || 0);
  globals.setTotalGemsEarned(data.totalGemsEarned || 0);
  
  // Load other resources (version 2 only, otherwise start at 0)
  if (data.version === 2) {
    globals.setWood(data.wood || 0);
    globals.setTotalWoodEarned(data.totalWoodEarned || 0);
    globals.setStone(data.stone || 0);
    globals.setTotalStoneEarned(data.totalStoneEarned || 0);
    globals.setGold(data.gold || 0);
    globals.setTotalGoldEarned(data.totalGoldEarned || 0);
  }
  
  globals.setTotalClicks(data.totalClicks || 0);
  globals.setSoundEnabled(data.soundEnabled !== undefined ? data.soundEnabled : true);
  globals.setSelectedTheme(data.selectedTheme || 'light');
  globals.setSelectedLanguage(data.selectedLanguage || 'en');

  // Restore upgrades
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

// Save to LocalStorage
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

// Load from LocalStorage
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

// Check if a save exists
export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

// Export save as a file
export function exportSave() {
  try {
    const saveData = createSaveData();
    const json = JSON.stringify(saveData);
    const compressed = LZString.compressToBase64(json);

    // Create download
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

// Import save from file
export async function importSave(file) {
  try {
    const compressed = await file.text();
    const json = LZString.decompressFromBase64(compressed);
    const saveData = JSON.parse(json);
    const success = applySaveData(saveData);

    if (success) {
      console.log('Save imported successfully');
      // Also save to LocalStorage so it's persistent
      saveToLocalStorage();
    }
    return success;
  } catch (e) {
    console.error('Failed to import save:', e);
    return false;
  }
}

// Start autosave
export function startAutosave() {
  if (autosaveTimer) return;

  autosaveTimer = setInterval(() => {
    saveToLocalStorage();
  }, AUTOSAVE_INTERVAL);

  console.log('Autosave started (every 60 seconds)');
}

// Stop autosave
export function stopAutosave() {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
    console.log('Autosave stopped');
  }
}

let cars = 0;
let totalCarsEarned = 0;
let totalClicks = 0;

let selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
let selectedTheme = localStorage.getItem('selectedTheme') || 'dark';
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

export const globals = {
  getCars() { return cars; },
  addCars(amount) { 
    cars += amount; 
    totalCarsEarned += amount;
  },
  getTotalCarsEarned() { return totalCarsEarned; },
  
  getTotalClicks() { return totalClicks; },
  incrementClicks() { totalClicks++; },
  
  getSelectedLanguage() { return selectedLanguage; },
  setSelectedLanguage(lang) { selectedLanguage = lang; localStorage.setItem('selectedLanguage', lang); },
  
  getSelectedTheme() { return selectedTheme; },
  setSelectedTheme(theme) { selectedTheme = theme; localStorage.setItem('selectedTheme', theme); },
  
  getSoundEnabled() { return soundEnabled; },
  setSoundEnabled(enabled) { soundEnabled = enabled; localStorage.setItem('soundEnabled', enabled); },
  
  getAllResourceData() {
    return {
      cars: { amount: cars, total: totalCarsEarned }
    };
  },
  
  resetGameVariables() {
    cars = 0;
    totalCarsEarned = 0;
    totalClicks = 0;
  },
  
  serialize() {
    return { cars, totalCarsEarned, totalClicks, selectedLanguage, selectedTheme, soundEnabled };
  },
  
  deserialize(data) {
    if (data.cars !== undefined) cars = data.cars;
    if (data.totalCarsEarned !== undefined) totalCarsEarned = data.totalCarsEarned;
    if (data.totalClicks !== undefined) totalClicks = data.totalClicks;
    if (data.selectedLanguage) selectedLanguage = data.selectedLanguage;
    if (data.selectedTheme) selectedTheme = data.selectedTheme;
    if (data.soundEnabled !== undefined) soundEnabled = data.soundEnabled;
  }
};

export function resetGameVariables() {
  globals.resetGameVariables();
}

export function catchCar() {
  cars++;
  totalCarsEarned++;
  return 1;
}

export function tickGameLogic(deltaTimeSeconds) {
  // Traffic simulation - no passive generation
}

export const upgrades = {};
export function getUpgradesByResource() { return []; }
export function getUpgradeCost() { return Infinity; }
export function canAffordUpgrade() { return false; }
export function buyUpgrade() { return false; }
export function clickResource() { return 0; }
export function click() { return 0; }
export function recalculateAllRPS() {}
export function recalculateResourceRPS() {}
export function catchFish() { return 0; }


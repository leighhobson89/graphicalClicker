const RESOURCES = ['gems', 'wood', 'stone', 'gold'];

let gems = 0;
let totalGemsEarned = 0;
let gemsPerSecond = 0;
let gemsClickPower = 1;
let gemsClickMultiplier = 1;

let wood = 0;
let totalWoodEarned = 0;
let woodPerSecond = 0;
let woodClickPower = 1;
let woodClickMultiplier = 1;

let stone = 0;
let totalStoneEarned = 0;
let stonePerSecond = 0;
let stoneClickPower = 1;
let stoneClickMultiplier = 1;

let gold = 0;
let totalGoldEarned = 0;
let goldPerSecond = 0;
let goldClickPower = 1;
let goldClickMultiplier = 1;

let fish = 0;
let totalFishEarned = 0;

let cars = 0;
let totalCarsEarned = 0;

let totalClicks = 0;

const upgrades = {
  gemRock: {
    id: 'gemRock',
    name: 'Gem Rock',
    resourceType: 'gems',
    description: 'A rock that produces gems',
    baseCost: 10,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 0.5,
    maxCount: 9999,
    icon: 'images/upgradeGemRock.svg'
  },
  gemMine: {
    id: 'gemMine',
    name: 'Gem Mine',
    resourceType: 'gems',
    description: 'Mines gems automatically',
    baseCost: 100,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 3,
    maxCount: 9999,
    icon: 'images/upgradeGemMine.svg'
  },
  gemFactory: {
    id: 'gemFactory',
    name: 'Gem Factory',
    resourceType: 'gems',
    description: 'Mass produces gems',
    baseCost: 500,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 10,
    maxCount: 9999,
    icon: 'images/upgradeGemFactory.svg'
  },
  gemPortal: {
    id: 'gemPortal',
    name: 'Gem Portal',
    resourceType: 'gems',
    description: 'Opens portals to gem dimensions',
    baseCost: 2500,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 50,
    maxCount: 9999,
    icon: 'images/upgradeGemPortal.svg'
  },
  woodSapling: {
    id: 'woodSapling',
    name: 'Wood Sapling',
    resourceType: 'wood',
    description: 'A small tree that grows wood',
    baseCost: 10,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 0.5,
    maxCount: 9999,
    icon: 'images/upgradeWoodSapling.svg'
  },
  woodForest: {
    id: 'woodForest',
    name: 'Wood Forest',
    resourceType: 'wood',
    description: 'A forest of wood-producing trees',
    baseCost: 100,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 3,
    maxCount: 9999,
    icon: 'images/upgradeWoodForest.svg'
  },
  woodMill: {
    id: 'woodMill',
    name: 'Lumber Mill',
    resourceType: 'wood',
    description: 'Processes trees into wood efficiently',
    baseCost: 500,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 10,
    maxCount: 9999,
    icon: 'images/upgradeWoodMill.svg'
  },
  woodGrove: {
    id: 'woodGrove',
    name: 'Enchanted Grove',
    resourceType: 'wood',
    description: 'Magic trees that grow wood rapidly',
    baseCost: 2500,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 50,
    maxCount: 9999,
    icon: 'images/upgradeWoodGrove.svg'
  },
  stonePebbles: {
    id: 'stonePebbles',
    name: 'Stone Pebbles',
    resourceType: 'stone',
    description: 'Small stones that multiply',
    baseCost: 10,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 0.5,
    maxCount: 9999,
    icon: 'images/upgradeStonePebbles.svg'
  },
  stoneQuarry: {
    id: 'stoneQuarry',
    name: 'Stone Quarry',
    resourceType: 'stone',
    description: 'Mines stone from the earth',
    baseCost: 100,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 3,
    maxCount: 9999,
    icon: 'images/upgradeStoneQuarry.svg'
  },
  stoneCrusher: {
    id: 'stoneCrusher',
    name: 'Stone Crusher',
    resourceType: 'stone',
    description: 'Crushes rocks into valuable stone',
    baseCost: 500,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 10,
    maxCount: 9999,
    icon: 'images/upgradeStoneCrusher.svg'
  },
  stoneMountain: {
    id: 'stoneMountain',
    name: 'Living Mountain',
    resourceType: 'stone',
    description: 'A mountain that endlessly produces stone',
    baseCost: 2500,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 50,
    maxCount: 9999,
    icon: 'images/upgradeStoneMountain.svg'
  },
  goldNugget: {
    id: 'goldNugget',
    name: 'Gold Nugget',
    resourceType: 'gold',
    description: 'A small nugget of gold',
    baseCost: 10,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 0.5,
    maxCount: 9999,
    icon: 'images/upgradeGoldNugget.svg'
  },
  goldPan: {
    id: 'goldPan',
    name: 'Gold Pan',
    resourceType: 'gold',
    description: 'Pans for gold in rivers',
    baseCost: 100,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 3,
    maxCount: 9999,
    icon: 'images/upgradeGoldPan.svg'
  },
  goldMine: {
    id: 'goldMine',
    name: 'Gold Mine',
    resourceType: 'gold',
    description: 'Deep mine for gold extraction',
    baseCost: 500,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 10,
    maxCount: 9999,
    icon: 'images/upgradeGoldMine.svg'
  },
  goldForge: {
    id: 'goldForge',
    name: 'Golden Forge',
    resourceType: 'gold',
    description: 'Mystic forge that creates gold',
    baseCost: 2500,
    costMultiplier: 1.15,
    owned: 0,
    rpsContribution: 50,
    maxCount: 9999,
    icon: 'images/upgradeGoldForge.svg'
  }
};

let activePowerUps = [];

let soundEnabled = true;
let selectedTheme = 'light';
let selectedLanguage = 'en';

let score = 0;
let level = 1;
let resources = 0;

export function resetGameVariables() {
  gems = 0;
  totalGemsEarned = 0;
  gemsPerSecond = 0;
  gemsClickPower = 1;
  gemsClickMultiplier = 1;
  
  wood = 0;
  totalWoodEarned = 0;
  woodPerSecond = 0;
  woodClickPower = 1;
  woodClickMultiplier = 1;
  
  stone = 0;
  totalStoneEarned = 0;
  stonePerSecond = 0;
  stoneClickPower = 1;
  stoneClickMultiplier = 1;
  
  gold = 0;
  totalGoldEarned = 0;
  goldPerSecond = 0;
  goldClickPower = 1;
  goldClickMultiplier = 1;
  
  fish = 0;
  totalFishEarned = 0;
  
  cars = 0;
  totalCarsEarned = 0;
  
  totalClicks = 0;
  
  Object.values(upgrades).forEach(upgrade => {
    upgrade.owned = 0;
  });
  
  activePowerUps = [];
  score = 0;
  level = 1;
  resources = 0;
  
  recalculateAllRPS();
}

export function recalculateResourceRPS(resourceType) {
  let total = 0;
  Object.values(upgrades).forEach(upgrade => {
    if (upgrade.resourceType === resourceType) {
      total += upgrade.owned * upgrade.rpsContribution;
    }
  });
  
  switch(resourceType) {
    case 'gems': gemsPerSecond = total; break;
    case 'wood': woodPerSecond = total; break;
    case 'stone': stonePerSecond = total; break;
    case 'gold': goldPerSecond = total; break;
  }
}

export function recalculateAllRPS() {
  RESOURCES.forEach(r => recalculateResourceRPS(r));
}

export function getUpgradeCost(upgradeId) {
  const upgrade = upgrades[upgradeId];
  if (!upgrade) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
}

export function canAffordUpgrade(upgradeId) {
  const upgrade = upgrades[upgradeId];
  if (!upgrade) return false;
  
  const resourceType = upgrade.resourceType;
  const currentAmount = getResourceAmount(resourceType);
  return currentAmount >= getUpgradeCost(upgradeId);
}

function getResourceAmount(resourceType) {
  switch(resourceType) {
    case 'gems': return gems;
    case 'wood': return wood;
    case 'stone': return stone;
    case 'gold': return gold;
    default: return 0;
  }
}

function setResourceAmount(resourceType, amount) {
  switch(resourceType) {
    case 'gems': gems = Math.max(0, amount); break;
    case 'wood': wood = Math.max(0, amount); break;
    case 'stone': stone = Math.max(0, amount); break;
    case 'gold': gold = Math.max(0, amount); break;
  }
}

function addResourceEarned(resourceType, amount) {
  switch(resourceType) {
    case 'gems': totalGemsEarned += amount; break;
    case 'wood': totalWoodEarned += amount; break;
    case 'stone': totalStoneEarned += amount; break;
    case 'gold': totalGoldEarned += amount; break;
  }
}

export function buyUpgrade(upgradeId) {
  const upgrade = upgrades[upgradeId];
  if (!upgrade) return false;
  if (upgrade.owned >= upgrade.maxCount) return false;
  
  const cost = getUpgradeCost(upgradeId);
  const resourceType = upgrade.resourceType;
  const currentAmount = getResourceAmount(resourceType);
  
  if (currentAmount < cost) return false;
  
  setResourceAmount(resourceType, currentAmount - cost);
  
  upgrade.owned++;
  recalculateResourceRPS(resourceType);
  return true;
}

export function clickResource(resourceType) {
  let power, multiplier;
  
  switch(resourceType) {
    case 'gems':
      power = gemsClickPower;
      multiplier = gemsClickMultiplier;
      break;
    case 'wood':
      power = woodClickPower;
      multiplier = woodClickMultiplier;
      break;
    case 'stone':
      power = stoneClickPower;
      multiplier = stoneClickMultiplier;
      break;
    case 'gold':
      power = goldClickPower;
      multiplier = goldClickMultiplier;
      break;
    default:
      power = 1;
      multiplier = 1;
  }
  
  const amount = power * multiplier;

  const current = getResourceAmount(resourceType);
  setResourceAmount(resourceType, current + amount);
  addResourceEarned(resourceType, amount);
  
  totalClicks++;
  return amount;
}

export function click() {
  return clickResource('gems');
}

export function tickGameLogic(deltaTimeSeconds) {
  gems += gemsPerSecond * deltaTimeSeconds;
  totalGemsEarned += gemsPerSecond * deltaTimeSeconds;
  
  wood += woodPerSecond * deltaTimeSeconds;
  totalWoodEarned += woodPerSecond * deltaTimeSeconds;
  
  stone += stonePerSecond * deltaTimeSeconds;
  totalStoneEarned += stonePerSecond * deltaTimeSeconds;
  
  gold += goldPerSecond * deltaTimeSeconds;
  totalGoldEarned += goldPerSecond * deltaTimeSeconds;
}

export function catchFish() {
  fish++;
  totalFishEarned++;
  return 1;
}

export function catchCar() {
  cars++;
  totalCarsEarned++;
  return 1;
}

export function getUpgradesByResource(resourceType) {
  return Object.values(upgrades).filter(u => u.resourceType === resourceType);
}

export const globals = {
  getGems: () => gems,
  setGems: (v) => { gems = Math.max(0, Number(v) || 0); },
  getTotalGemsEarned: () => totalGemsEarned,
  setTotalGemsEarned: (v) => { totalGemsEarned = Math.max(0, Number(v) || 0); },
  getGemsPerSecond: () => gemsPerSecond,
  setGemsPerSecond: (v) => { gemsPerSecond = Math.max(0, Number(v) || 0); },
  getGemsClickPower: () => gemsClickPower,
  setGemsClickPower: (v) => { gemsClickPower = Math.max(1, Number(v) || 1); },
  getGemsClickMultiplier: () => gemsClickMultiplier,
  setGemsClickMultiplier: (v) => { gemsClickMultiplier = Math.max(1, Number(v) || 1); },
  
  getWood: () => wood,
  setWood: (v) => { wood = Math.max(0, Number(v) || 0); },
  getTotalWoodEarned: () => totalWoodEarned,
  setTotalWoodEarned: (v) => { totalWoodEarned = Math.max(0, Number(v) || 0); },
  getWoodPerSecond: () => woodPerSecond,
  setWoodPerSecond: (v) => { woodPerSecond = Math.max(0, Number(v) || 0); },
  getWoodClickPower: () => woodClickPower,
  setWoodClickPower: (v) => { woodClickPower = Math.max(1, Number(v) || 1); },
  getWoodClickMultiplier: () => woodClickMultiplier,
  setWoodClickMultiplier: (v) => { woodClickMultiplier = Math.max(1, Number(v) || 1); },
  
  getStone: () => stone,
  setStone: (v) => { stone = Math.max(0, Number(v) || 0); },
  getTotalStoneEarned: () => totalStoneEarned,
  setTotalStoneEarned: (v) => { totalStoneEarned = Math.max(0, Number(v) || 0); },
  getStonePerSecond: () => stonePerSecond,
  setStonePerSecond: (v) => { stonePerSecond = Math.max(0, Number(v) || 0); },
  getStoneClickPower: () => stoneClickPower,
  setStoneClickPower: (v) => { stoneClickPower = Math.max(1, Number(v) || 1); },
  getStoneClickMultiplier: () => stoneClickMultiplier,
  setStoneClickMultiplier: (v) => { stoneClickMultiplier = Math.max(1, Number(v) || 1); },
  
  getGold: () => gold,
  setGold: (v) => { gold = Math.max(0, Number(v) || 0); },
  getTotalGoldEarned: () => totalGoldEarned,
  setTotalGoldEarned: (v) => { totalGoldEarned = Math.max(0, Number(v) || 0); },
  getGoldPerSecond: () => goldPerSecond,
  setGoldPerSecond: (v) => { goldPerSecond = Math.max(0, Number(v) || 0); },
  getGoldClickPower: () => goldClickPower,
  setGoldClickPower: (v) => { goldClickPower = Math.max(1, Number(v) || 1); },
  getGoldClickMultiplier: () => goldClickMultiplier,
  setGoldClickMultiplier: (v) => { goldClickMultiplier = Math.max(1, Number(v) || 1); },
  
  getFish: () => fish,
  setFish: (v) => { fish = Math.max(0, Number(v) || 0); },
  getTotalFishEarned: () => totalFishEarned,
  setTotalFishEarned: (v) => { totalFishEarned = Math.max(0, Number(v) || 0); },
  
  getCars: () => cars,
  setCars: (v) => { cars = Math.max(0, Number(v) || 0); },
  getTotalCarsEarned: () => totalCarsEarned,
  setTotalCarsEarned: (v) => { totalCarsEarned = Math.max(0, Number(v) || 0); },
  
  getTotalClicks: () => totalClicks,
  setTotalClicks: (v) => { totalClicks = Math.max(0, Number(v) || 0); },
  
  getUpgrades: () => upgrades,
  getUpgradesByResource,
  
  getActivePowerUps: () => activePowerUps,
  setActivePowerUps: (v) => { activePowerUps = v || []; },
  
  getSoundEnabled: () => soundEnabled,
  setSoundEnabled: (v) => { soundEnabled = Boolean(v); },
  
  getSelectedTheme: () => selectedTheme,
  setSelectedTheme: (v) => { selectedTheme = String(v || 'light'); },
  
  getSelectedLanguage: () => selectedLanguage,
  setSelectedLanguage: (v) => { selectedLanguage = String(v || 'en'); },
  
  getScore: () => score,
  setScore: (v) => { score = Number(v) || 0; },
  
  getLevel: () => level,
  setLevel: (v) => { level = Math.max(1, Number(v) || 1); },
  
  getResources: () => resources,
  setResources: (v) => { resources = Math.max(0, Number(v) || 0); },
  
  getAllResourceData: () => ({
    gems: { amount: gems, total: totalGemsEarned, rps: gemsPerSecond, clickPower: gemsClickPower, clickMultiplier: gemsClickMultiplier },
    wood: { amount: wood, total: totalWoodEarned, rps: woodPerSecond, clickPower: woodClickPower, clickMultiplier: woodClickMultiplier },
    stone: { amount: stone, total: totalStoneEarned, rps: stonePerSecond, clickPower: stoneClickPower, clickMultiplier: stoneClickMultiplier },
    gold: { amount: gold, total: totalGoldEarned, rps: goldPerSecond, clickPower: goldClickPower, clickMultiplier: goldClickMultiplier },
    fish: { amount: fish, total: totalFishEarned, rps: 0, clickPower: 1, clickMultiplier: 1 },
    cars: { amount: cars, total: totalCarsEarned, rps: 0, clickPower: 1, clickMultiplier: 1 }
  })
};

export { upgrades, RESOURCES };

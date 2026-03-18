import { globals, clickResource as doClickResource, click as doClick, tickGameLogic as doTick, buyUpgrade, getUpgradeCost, canAffordUpgrade, upgrades, getUpgradesByResource, catchFish, catchCar } from "./constantsAndGlobalVariables.js";

export function tickGameLogic(dtSeconds) {
  doTick(dtSeconds);
}

export function performClick(resourceType = 'gems') {
  return doClickResource(resourceType);
}

export function purchaseUpgrade(upgradeId) {
  return buyUpgrade(upgradeId);
}

export function catchFishGame() {
  return catchFish();
}

export function catchCarGame() {
  return catchCar();
}

export function checkCanAfford(upgradeId) {
  return canAffordUpgrade(upgradeId);
}

export function getUpgradePrice(upgradeId) {
  return getUpgradeCost(upgradeId);
}

export function getHudSnapshot() {
  const allData = globals.getAllResourceData();
  const upgradesData = globals.getUpgrades();
  
  return {
    gems: allData.gems.amount,
    gemsPerSecond: allData.gems.rps,
    totalGemsEarned: allData.gems.total,
    wood: allData.wood.amount,
    woodPerSecond: allData.wood.rps,
    totalWoodEarned: allData.wood.total,
    stone: allData.stone.amount,
    stonePerSecond: allData.stone.rps,
    totalStoneEarned: allData.stone.total,
    gold: allData.gold.amount,
    goldPerSecond: allData.gold.rps,
    totalGoldEarned: allData.gold.total,
    fish: allData.fish.amount,
    totalFishEarned: allData.fish.total,
    cars: allData.cars.amount,
    totalCarsEarned: allData.cars.total,
    totalClicks: globals.getTotalClicks(),
    upgrades: Object.values(upgradesData).map(u => ({
      id: u.id,
      name: u.name,
      resourceType: u.resourceType,
      owned: u.owned,
      cost: getUpgradeCost(u.id),
      canAfford: canAffordUpgrade(u.id),
      icon: u.icon,
      rpsContribution: u.rpsContribution
    }))
  };
}

export function getUpgradesForResource(resourceType) {
  return getUpgradesByResource(resourceType);
}

export function formatNumber(num) {
  if (num < 1000) return Math.floor(num).toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
  return (num / 1000000000000).toFixed(1) + 'T';
}

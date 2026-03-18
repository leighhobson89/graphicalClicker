import { globals, catchCar } from "./constantsAndGlobalVariables.js";

export function tickGameLogic(dtSeconds) {
  // Traffic simulation - no passive resource generation
}

export function performClick() {
  globals.incrementClicks();
  return 0;
}

export function purchaseUpgrade(upgradeId) {
  return false;
}

export function catchCarGame() {
  return catchCar();
}

export function checkCanAfford(upgradeId) {
  return false;
}

export function getUpgradePrice(upgradeId) {
  return Infinity;
}

export function getHudSnapshot() {
  return {
    cars: globals.getCars(),
    totalCarsEarned: globals.getTotalCarsEarned(),
    totalClicks: globals.getTotalClicks()
  };
}

export function getUpgradesForResource(resourceType) {
  return [];
}

export function formatNumber(num) {
  if (num < 1000) return Math.floor(num).toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
  return (num / 1000000000000).toFixed(1) + 'T';
}

import { globals } from "./constantsAndGlobalVariables.js";

const allowedThemes = new Set(["light", "dark", "forest", "space", "frosty"]);

export function applyTheme(theme) {
  const next = allowedThemes.has(theme) ? theme : "light";
  globals.setSelectedTheme(next);
  document.documentElement.dataset.theme = next;
}

export function initTheme() {
  document.documentElement.dataset.theme = globals.getSelectedTheme() || "light";
}

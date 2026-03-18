import { globals } from "./constantsAndGlobalVariables.js";

let dictionary = null;

async function loadDictionary() {
  if (dictionary) return dictionary;
  const res = await fetch("./localisation.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load localisation.json (${res.status})`);
  dictionary = await res.json();
  return dictionary;
}

export async function setLanguage(lang) {
  globals.setSelectedLanguage(lang);
  await updateAllTexts();
}

export async function t(key) {
  const dict = await loadDictionary();
  const lang = globals.getSelectedLanguage() || "en";
  return dict?.[lang]?.[key] ?? dict?.en?.[key] ?? key;
}

export async function updateAllTexts(root = document) {
  const dict = await loadDictionary();
  const lang = globals.getSelectedLanguage() || "en";

  const elements = root.querySelectorAll("[data-i18n]");
  for (const el of elements) {
    const key = el.getAttribute("data-i18n");
    const value = dict?.[lang]?.[key] ?? dict?.en?.[key] ?? key;
    el.textContent = value;
  }

  const optionEls = root.querySelectorAll("[data-i18n-option]");
  for (const el of optionEls) {
    const key = el.getAttribute("data-i18n-option");
    const value = dict?.[lang]?.[key] ?? dict?.en?.[key] ?? key;
    el.textContent = value;
  }
}

export async function initLanguage() {
  await loadDictionary();
  await updateAllTexts();
}

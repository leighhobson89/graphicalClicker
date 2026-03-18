import { globals, resetGameVariables } from "./constantsAndGlobalVariables.js";
import { applyTheme } from "./themeManager.js";
import { setLanguage, updateAllTexts, t } from "./languageManager.js";
import { performClick, purchaseUpgrade, getHudSnapshot, formatNumber } from "./game.js";
import { 
  hasSave, 
  exportSave, 
  importSave,
  saveToLocalStorage 
} from "./saveManager.js";

export const UI = {
  menuRoot: null,
  gameRoot: null,
  onUpdateCallbacks: [],
  floatingTexts: [],
  svgCache: {},

  init() {
    this.menuRoot = document.getElementById("menuRoot");
    this.gameRoot = document.getElementById("gameRoot");
  },

  async loadTemplate() {
    if (this.templateHtml) return this.templateHtml;
    try {
      const response = await fetch('./gameTemplate.html');
      this.templateHtml = await response.text();
      return this.templateHtml;
    } catch (e) {
      console.error('Failed to load template:', e);
      return '';
    }
  },

  async loadSvg(url) {
    if (this.svgCache[url]) return this.svgCache[url];
    try {
      const response = await fetch(url);
      const svgText = await response.text();
      this.svgCache[url] = svgText;
      return svgText;
    } catch (e) {
      return '';
    }
  },

  showMenu() {
    this.menuRoot.hidden = false;
    this.gameRoot.hidden = true;
  },

  showGame() {
    this.menuRoot.hidden = true;
    this.gameRoot.hidden = false;
  },

  async renderMenu({ onNewGame, onContinue, hasExistingSave }) {
    const selectedLang = globals.getSelectedLanguage();
    const selectedTheme = globals.getSelectedTheme();
    const soundEnabled = globals.getSoundEnabled();

    this.menuRoot.innerHTML = `
      <div class="grid">
        <div>
          <h2 class="h2" data-i18n="menuTitle">Menu</h2>
          <div class="muted" data-i18n="menuDescription">Start a new game or continue. Adjust language, sound, and theme.</div>
        </div>

        <div class="row">
          <button id="btnNewGame" class="primary" type="button" data-i18n="newGame">New Game</button>
          <button id="btnContinue" type="button" ${!hasExistingSave ? 'disabled' : ''} data-i18n="continue">Continue</button>
        </div>

        <div class="saveActions row">
          <button id="btnExportSave" type="button" data-i18n="exportSave">Export Save</button>
          <button id="btnImportSave" type="button" data-i18n="importSave">Import Save</button>
        </div>
        <input type="file" id="importFileInput" accept=".save" style="display:none">

        <div class="grid cols2">
          <div class="control">
            <div class="label" data-i18n="language">Language</div>
            <select id="languageSelect" aria-label="Language">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="fr">Français</option>
              <option value="pt">Português</option>
            </select>
          </div>

          <div class="control">
            <div class="label" data-i18n="theme">Theme</div>
            <select id="themeSelect" aria-label="Theme">
              <option value="light" data-i18n-option="theme_light">Light</option>
              <option value="dark" data-i18n-option="theme_dark">Dark</option>
              <option value="forest" data-i18n-option="theme_forest">Forest</option>
              <option value="space" data-i18n-option="theme_space">Space</option>
              <option value="frosty" data-i18n-option="theme_frosty">Frosty</option>
            </select>
          </div>

          <div class="control">
            <div class="label" data-i18n="sound">Sound</div>
            <button id="btnSoundToggle" type="button">${soundEnabled ? await t("soundOn") : await t("soundOff")}</button>
          </div>
        </div>
      </div>
    `;

    const btnNewGame = document.getElementById("btnNewGame");
    const btnContinue = document.getElementById("btnContinue");
    const btnExportSave = document.getElementById("btnExportSave");
    const btnImportSave = document.getElementById("btnImportSave");
    const importFileInput = document.getElementById("importFileInput");
    const languageSelect = document.getElementById("languageSelect");
    const themeSelect = document.getElementById("themeSelect");
    const btnSoundToggle = document.getElementById("btnSoundToggle");

    languageSelect.value = selectedLang || "en";
    themeSelect.value = selectedTheme || "light";

    btnNewGame.addEventListener("click", () => {
      resetGameVariables();
      onNewGame();
    });

    btnContinue.addEventListener("click", () => {
      console.log("Continue game clicked");
      onContinue();
    });

    btnExportSave.addEventListener("click", () => {
      saveToLocalStorage(); // Make sure current state is saved first
      exportSave();
    });

    btnImportSave.addEventListener("click", () => {
      importFileInput.click();
    });

    importFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        const success = await importSave(file);
        if (success) {
          // Apply theme from imported save
          applyTheme(globals.getSelectedTheme());
          // Reload the menu to reflect loaded state
          await this.renderMenu({ onNewGame, onContinue, hasExistingSave: hasSave() });
        } else {
          alert('Failed to import save file. Please check the file is valid.');
        }
      }
      importFileInput.value = ''; // Reset
    });

    languageSelect.addEventListener("change", async (e) => {
      const value = e.target.value;
      await setLanguage(value);
      await this.renderMenu({ onNewGame, onContinue, hasExistingSave: hasSave() });
    });

    themeSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      applyTheme(value);
    });

    btnSoundToggle.addEventListener("click", async () => {
      const next = !globals.getSoundEnabled();
      globals.setSoundEnabled(next);
      console.log(next ? "Sound On" : "Sound Off");
      btnSoundToggle.textContent = next ? await t("soundOn") : await t("soundOff");
    });

    await updateAllTexts(this.menuRoot);
  },

  async renderGame({ onBackToMenu }) {
    // Load template and SVGs in parallel
    const [template, gemsSvg, woodSvg, stoneSvg, goldSvg] = await Promise.all([
      this.loadTemplate(),
      this.loadSvg('images/clickerGems.svg'),
      this.loadSvg('images/clickerWood.svg'),
      this.loadSvg('images/clickerStone.svg'),
      this.loadSvg('images/clickerGold.svg')
    ]);
    
    // Replace SVG placeholders in template
    let html = template
      .replace('data-svg="images/clickerGems.svg"', `data-svg="gems"`, html => html.replace('>${gemsSvg}<', `>${gemsSvg}<`))
      .replace('data-svg="images/clickerWood.svg"', `data-svg="wood"`, html => html.replace('>${woodSvg}<', `>${woodSvg}<`))
      .replace('data-svg="images/clickerStone.svg"', `data-svg="stone"`, html => html.replace('>${stoneSvg}<', `>${stoneSvg}<`))
      .replace('data-svg="images/clickerGold.svg"', `data-svg="gold"`, html => html.replace('>${goldSvg}<', `>${goldSvg}<`));
    
    // Actually replace the SVG content
    html = template
      .replace(/<div class="clickerImage" data-svg="images\/clickerGems.svg"><\/div>/, `<div class="clickerImage">${gemsSvg}</div>`)
      .replace(/<div class="clickerImage" data-svg="images\/clickerWood.svg"><\/div>/, `<div class="clickerImage">${woodSvg}</div>`)
      .replace(/<div class="clickerImage" data-svg="images\/clickerStone.svg"><\/div>/, `<div class="clickerImage">${stoneSvg}</div>`)
      .replace(/<div class="clickerImage" data-svg="images\/clickerGold.svg"><\/div>/, `<div class="clickerImage">${goldSvg}</div>`);
    
    this.gameRoot.innerHTML = html;
    document.getElementById("btnMenu").addEventListener("click", onBackToMenu);

    this.setupResourceTabs();
    this.setupClickers();
    await this.renderShop();
    
    await updateAllTexts(this.gameRoot);
  },

  setupResourceTabs() {
    const tabs = document.querySelectorAll('.resourceTab');
    const rows = document.querySelectorAll('.clickerRow');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const resource = tab.dataset.resource;
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show/hide appropriate clicker row
        rows.forEach(row => row.classList.add('hidden'));
        const targetRow = document.getElementById(`${resource}Clicker`);
        if (targetRow) targetRow.classList.remove('hidden');
        
        // Update shop to show only upgrades for this resource
        this.updateShopForResource(resource);
      });
    });
  },

  setupClickers() {
    const resources = ['gems', 'wood', 'stone', 'gold'];
    
    resources.forEach(resource => {
      const clickerButton = document.getElementById(`clicker${resource.charAt(0).toUpperCase() + resource.slice(1)}`);
      
      if (!clickerButton) return;
      
      const handleClick = (e) => {
        const amount = performClick(resource);
        
        // Visual feedback
        clickerButton.style.transform = "scale(0.95)";
        setTimeout(() => {
          clickerButton.style.transform = "";
        }, 100);
        
        // Create ripple
        this.createRipple(e, clickerButton);
        
        // Floating text
        const rect = clickerButton.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        this.createFloatingText(`+${formatNumber(amount)}`, x, y);
        
        // Update display immediately
        this.updateDisplay();
        
        // Play sound if enabled
        if (globals.getSoundEnabled()) {
          // Sound would play here
        }
      };
      
      clickerButton.addEventListener("click", handleClick);
      clickerButton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleClick(e);
      });
    });
  },

  updateShopForResource(resourceType) {
    // Filter visible upgrades based on selected resource
    const shopGrid = document.getElementById("shopGrid");
    if (!shopGrid) return;
    
    const cards = shopGrid.querySelectorAll('.upgradeCard');
    cards.forEach(card => {
      const upgradeId = card.dataset.upgradeId;
      const upgrade = globals.getUpgrades()[upgradeId];
      
      if (upgrade && upgrade.resourceType === resourceType) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  },

  createRipple(e, container) {
    const ripple = document.createElement("div");
    ripple.className = "ripple";
    
    const rect = container.getBoundingClientRect();
    const x = (e.clientX || rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY || rect.top + rect.height / 2) - rect.top;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    container.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  },

  createFloatingText(text, x, y) {
    const container = document.getElementById("floatingTextContainer");
    if (!container) return;
    
    const el = document.createElement("div");
    el.className = "floatingText";
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    container.appendChild(el);
    
    // Animate
    requestAnimationFrame(() => {
      el.style.transform = "translateY(-60px)";
      el.style.opacity = "0";
    });
    
    setTimeout(() => el.remove(), 800);
  },

  async renderShop() {
    const shopGrid = document.getElementById("shopGrid");
    if (!shopGrid) return;
    
    // Only render HTML once - use data attributes for updates
    if (!shopGrid.dataset.initialized) {
      const snapshot = getHudSnapshot();
      
      // Load all SVGs and localized names in parallel
      const svgPromises = snapshot.upgrades.map(u => this.loadSvg(u.icon));
      const namePromises = snapshot.upgrades.map(u => t(`upgrade_${u.id}`));
      const [svgs, names] = await Promise.all([
        Promise.all(svgPromises),
        Promise.all(namePromises)
      ]);
      
      shopGrid.innerHTML = snapshot.upgrades.map((upgrade, i) => `
        <button class="upgradeCard locked" 
                data-upgrade-id="${upgrade.id}">
          <div class="upgradeIcon">
            ${svgs[i] || ''}
          </div>
          <div class="upgradeInfo">
            <div class="upgradeName">${names[i]}</div>
            <div class="upgradeDesc">${upgrade.rpsContribution}/s each</div>
            <div class="upgradeOwned">Owned: <span class="ownedCount">0</span></div>
          </div>
          <div class="upgradeCost"><span class="costValue">${formatNumber(upgrade.baseCost)}</span></div>
        </button>
      `).join('');
      
      // Add click handlers once using event delegation
      shopGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.upgradeCard');
        if (!card || card.classList.contains('locked')) return;
        
        const upgradeId = card.dataset.upgradeId;
        if (purchaseUpgrade(upgradeId)) {
          this.updateDisplay();
          
          // Visual feedback
          card.style.transform = "scale(0.98)";
          setTimeout(() => {
            card.style.transform = "";
          }, 100);
        }
      });
      
      shopGrid.dataset.initialized = "true";
    }
    
    this.updateShopClasses();
  },

  updateShopClasses() {
    const shopGrid = document.getElementById("shopGrid");
    if (!shopGrid) return;
    
    const snapshot = getHudSnapshot();
    
    snapshot.upgrades.forEach(upgrade => {
      const card = shopGrid.querySelector(`[data-upgrade-id="${upgrade.id}"]`);
      if (!card) return;
      
      // Only update if changed to avoid DOM thrashing
      const isAffordable = upgrade.canAfford;
      const currentlyAffordable = card.classList.contains('affordable');
      
      if (isAffordable && !currentlyAffordable) {
        card.classList.add('affordable');
        card.classList.remove('locked');
      } else if (!isAffordable && currentlyAffordable) {
        card.classList.remove('affordable');
        card.classList.add('locked');
      }
      
      // Update owned count and cost only if changed
      const ownedEl = card.querySelector('.ownedCount');
      const costEl = card.querySelector('.costValue');
      const newCost = formatNumber(upgrade.cost);
      
      if (ownedEl && ownedEl.textContent !== String(upgrade.owned)) {
        ownedEl.textContent = upgrade.owned;
      }
      if (costEl && costEl.textContent !== newCost) {
        costEl.textContent = newCost;
      }
    });
  },

  updateDisplay() {
    const snapshot = getHudSnapshot();
    
    // Update all 4 resources
    const resources = ['gems', 'wood', 'stone', 'gold'];
    
    resources.forEach(resource => {
      const countEl = document.getElementById(`${resource}Count`);
      const rpsEl = document.getElementById(`${resource}Rps`);
      const powerEl = document.getElementById(`${resource}PowerDisplay`);
      
      if (countEl) countEl.textContent = formatNumber(snapshot[resource]);
      if (rpsEl) rpsEl.textContent = `+${formatNumber(snapshot[`${resource}PerSecond`])}/s`;
      
      // Get click power for this resource
      let clickPower = 1;
      let clickMultiplier = 1;
      switch(resource) {
        case 'gems':
          clickPower = globals.getGemsClickPower();
          clickMultiplier = globals.getGemsClickMultiplier();
          break;
        case 'wood':
          clickPower = globals.getWoodClickPower();
          clickMultiplier = globals.getWoodClickMultiplier();
          break;
        case 'stone':
          clickPower = globals.getStoneClickPower();
          clickMultiplier = globals.getStoneClickMultiplier();
          break;
        case 'gold':
          clickPower = globals.getGoldClickPower();
          clickMultiplier = globals.getGoldClickMultiplier();
          break;
      }
      
      if (powerEl) powerEl.textContent = `+${formatNumber(clickPower * clickMultiplier)} per click`;
    });
    
    const totalClicksEl = document.getElementById("totalClicks");
    const totalEarnedEl = document.getElementById("totalEarned");
    
    if (totalClicksEl) totalClicksEl.textContent = `${formatNumber(snapshot.totalClicks)} clicks`;
    if (totalEarnedEl) totalEarnedEl.textContent = `${formatNumber(
      snapshot.totalGemsEarned + 
      snapshot.totalWoodEarned + 
      snapshot.totalStoneEarned + 
      snapshot.totalGoldEarned
    )} earned`;
    
    // Update shop classes only - don't re-render
    this.updateShopClasses();
    
    // Re-apply current resource filter
    const activeTab = document.querySelector('.resourceTab.active');
    if (activeTab) {
      this.updateShopForResource(activeTab.dataset.resource);
    }
  },

  updateHud() {
    this.updateDisplay();
  }
};

import { globals, resetGameVariables } from "./constantsAndGlobalVariables.js";
import { applyTheme } from "./themeManager.js";
import { setLanguage, updateAllTexts, t } from "./languageManager.js";
import { performClick, purchaseUpgrade, getHudSnapshot, formatNumber, catchFishGame, catchCarGame } from "./game.js";
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
  templateHtml: null,
  fishAnimationId: null,
  activeFish: [],
  carAnimationId: null,
  activeCars: [],
  carSvgs: null,
  carTypes: null,
  carAnimationRunning: false,

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
      saveToLocalStorage();
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
          applyTheme(globals.getSelectedTheme());
          await this.renderMenu({ onNewGame, onContinue, hasExistingSave: hasSave() });
        } else {
          alert('Failed to import save file. Please check the file is valid.');
        }
      }
      importFileInput.value = '';
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
    const [template, gemsSvg, woodSvg, stoneSvg, goldSvg] = await Promise.all([
      this.loadTemplate(),
      this.loadSvg('images/clickerGems.svg'),
      this.loadSvg('images/clickerWood.svg'),
      this.loadSvg('images/clickerStone.svg'),
      this.loadSvg('images/clickerGold.svg')
    ]);
    
    let html = template
      .replace('data-svg="images/clickerGems.svg"', `data-svg="gems"`, html => html.replace('>${gemsSvg}<', `>${gemsSvg}<`))
      .replace('data-svg="images/clickerWood.svg"', `data-svg="wood"`, html => html.replace('>${woodSvg}<', `>${woodSvg}<`))
      .replace('data-svg="images/clickerStone.svg"', `data-svg="stone"`, html => html.replace('>${stoneSvg}<', `>${stoneSvg}<`))
      .replace('data-svg="images/clickerGold.svg"', `data-svg="gold"`, html => html.replace('>${goldSvg}<', `>${goldSvg}<`));

    html = template
      .replace(/<div class="clickerImage" data-svg="images\/clickerGems.svg"><\/div>/, `<div class="clickerImage">${gemsSvg}</div>`)
      .replace(/<div class="clickerImage" data-svg="images\/clickerWood.svg"><\/div>/, `<div class="clickerImage">${woodSvg}</div>`)
      .replace(/<div class="clickerImage" data-svg="images\/clickerStone.svg"><\/div>/, `<div class="clickerImage">${stoneSvg}</div>`)
      .replace(/<div class="clickerImage" data-svg="images\/clickerGold.svg"><\/div>/, `<div class="clickerImage">${goldSvg}</div>`);
    
    this.gameRoot.innerHTML = html;
    document.getElementById("btnMenu").addEventListener("click", onBackToMenu);

    this.setupResourceTabs();
    this.setupClickers();
    this.setupFishRiver();
    this.setupRoad();
    await this.renderShop();
    
    await updateAllTexts(this.gameRoot);
  },

  setupResourceTabs() {
    const tabs = document.querySelectorAll('.resourceTab');
    const rows = document.querySelectorAll('.clickerRow');
    const shopSection = document.getElementById('shopSection');
    const statsRow = document.getElementById('statsRow');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const resource = tab.dataset.resource;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        rows.forEach(row => row.classList.add('hidden'));
        const targetRow = document.getElementById(`${resource}Clicker`);
        if (targetRow) targetRow.classList.remove('hidden');

        if (resource === 'fish') {
          if (shopSection) shopSection.style.display = 'none';
          if (statsRow) statsRow.style.display = 'none';
          this.stopCarAnimation();
          this.startFishAnimationIfNeeded();
        } else if (resource === 'cars') {
          if (shopSection) shopSection.style.display = 'none';
          if (statsRow) statsRow.style.display = 'none';
          this.stopFishAnimation();
          this.startCarAnimationIfNeeded();
        } else {
          if (shopSection) shopSection.style.display = '';
          if (statsRow) statsRow.style.display = '';
          this.stopFishAnimation();
          this.stopCarAnimation();
          this.updateShopForResource(resource);
        }
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
        
        clickerButton.style.transform = "scale(0.95)";
        setTimeout(() => {
          clickerButton.style.transform = "";
        }, 100);
        
        this.createRipple(e, clickerButton);
        
        const rect = clickerButton.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        this.createFloatingText(`+${formatNumber(amount)}`, x, y);
        
        this.updateDisplay();
        
        if (globals.getSoundEnabled()) {
        }
      };
      
      clickerButton.addEventListener("click", handleClick);
      clickerButton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleClick(e);
      });
    });
  },

  fishAnimationRunning: false,
  fishTypes: null,
  fishSvgs: null,

  setupFishRiver() {
    const fishSvgs = {};
    Promise.all([
      this.loadSvg('images/fish1.svg').then(svg => fishSvgs[1] = svg),
      this.loadSvg('images/fish2.svg').then(svg => fishSvgs[2] = svg),
      this.loadSvg('images/fish3.svg').then(svg => fishSvgs[3] = svg),
      this.loadSvg('images/fish4.svg').then(svg => fishSvgs[4] = svg)
    ]).then(() => {
      this.fishSvgs = fishSvgs;
      this.fishTypes = [
        { type: 1, speed: 2.5, direction: 1, spawnRate: 0.025, yRange: [10, 30] },
        { type: 2, speed: 1.8, direction: -1, spawnRate: 0.018, yRange: [35, 55] },
        { type: 3, speed: 1.2, direction: 1, spawnRate: 0.012, yRange: [60, 80] },
        { type: 4, speed: 0.9, direction: -1, spawnRate: 0.006, yRange: [20, 70] }
      ];
    });
  },

  startFishAnimationIfNeeded() {
    if (this.fishAnimationRunning || !this.fishSvgs) return;
    
    const fishContainer = document.getElementById("fishContainer");
    if (!fishContainer) return;
    
    this.fishAnimationRunning = true;
    this.activeFish = [];
    
    const animate = () => {
      if (!this.fishAnimationRunning) return;
      
      const containerWidth = fishContainer.offsetWidth || 800;
      
      this.fishTypes.forEach(type => {
        if (Math.random() < type.spawnRate) {
          this.spawnFish(fishContainer, type, containerWidth);
        }
      });
      
      for (let i = this.activeFish.length - 1; i >= 0; i--) {
        const fish = this.activeFish[i];
        fish.x += fish.speed * fish.direction;
        
        if ((fish.direction === 1 && fish.x > containerWidth + 60) ||
            (fish.direction === -1 && fish.x < -60)) {
          fish.el.remove();
          this.activeFish.splice(i, 1);
          continue;
        }
        
        fish.el.style.left = `${fish.x}px`;
      }
      
      this.fishAnimationId = requestAnimationFrame(animate);
    };
    
    animate();
  },

  spawnFish(container, type, containerWidth) {
    const y = type.yRange[0] + Math.random() * (type.yRange[1] - type.yRange[0]);
    const x = type.direction === 1 ? -60 : containerWidth + 60;
    
    const fishEl = document.createElement('div');
    fishEl.className = `fish fish${type.type}`;
    fishEl.innerHTML = this.fishSvgs[type.type];
    fishEl.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}%;
      width: 48px;
      height: 24px;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.1s;
      z-index: 10;
      ${type.direction === -1 ? 'transform: scaleX(-1);' : ''}
    `;
    
    fishEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (fishEl.dataset.caught === 'true') return;
      fishEl.dataset.caught = 'true';
      
      const index = this.activeFish.findIndex(f => f.el === fishEl);
      if (index > -1) this.activeFish.splice(index, 1);
      
      this.catchFish(fishEl, e.clientX, e.clientY);
    });
    
    container.appendChild(fishEl);
    
    this.activeFish.push({
      el: fishEl,
      x: x,
      y: y,
      speed: type.speed * (0.8 + Math.random() * 0.4),
      direction: type.direction,
      type: type.type
    });
  },

  stopFishAnimation() {
    this.fishAnimationRunning = false;
    if (this.fishAnimationId) {
      cancelAnimationFrame(this.fishAnimationId);
      this.fishAnimationId = null;
    }
    this.activeFish.forEach(f => f.el.remove());
    this.activeFish = [];
  },

  setupRoad() {
    const carSvgs = {};
    Promise.all([
      this.loadSvg('images/car1.svg').then(svg => carSvgs['car1'] = svg),
      this.loadSvg('images/car2.svg').then(svg => carSvgs['car2'] = svg),
      this.loadSvg('images/car3.svg').then(svg => carSvgs['car3'] = svg),
      this.loadSvg('images/car4.svg').then(svg => carSvgs['car4'] = svg),
      this.loadSvg('images/truck1.svg').then(svg => carSvgs['truck1'] = svg),
      this.loadSvg('images/truck2.svg').then(svg => carSvgs['truck2'] = svg),
      this.loadSvg('images/motorbike.svg').then(svg => carSvgs['motorbike'] = svg)
    ]).then(() => {
      this.carSvgs = carSvgs;
      this.carTypes = [
        { type: 'car1', speed: 3, direction: 1, lane: 0, spawnRate: 0.02, width: 28, height: 32 },
        { type: 'car2', speed: 2.5, direction: 1, lane: 1, spawnRate: 0.018, width: 28, height: 32 },
        { type: 'car3', speed: 2.8, direction: 1, lane: 0, spawnRate: 0.014, width: 28, height: 32 },
        { type: 'car4', speed: 2.2, direction: 1, lane: 1, spawnRate: 0.014, width: 28, height: 32 },
        { type: 'truck1', speed: 2.1, direction: 1, lane: 0, spawnRate: 0.006, width: 70, height: 35 },
        { type: 'motorbike', speed: 4.2, direction: 1, lane: 1, spawnRate: 0.007, width: 45, height: 26 },

        { type: 'car1', speed: 2.7, direction: -1, lane: 2, spawnRate: 0.02, width: 28, height: 32 },
        { type: 'car2', speed: 2.1, direction: -1, lane: 3, spawnRate: 0.018, width: 28, height: 32 },
        { type: 'car3', speed: 2.5, direction: -1, lane: 2, spawnRate: 0.014, width: 28, height: 32 },
        { type: 'car4', speed: 2.0, direction: -1, lane: 3, spawnRate: 0.014, width: 28, height: 32 },
        { type: 'truck2', speed: 1.7, direction: -1, lane: 3, spawnRate: 0.006, width: 80, height: 40 },
        { type: 'motorbike', speed: 4.0, direction: -1, lane: 2, spawnRate: 0.007, width: 45, height: 26 }
      ];
    });
  },

  startCarAnimationIfNeeded() {
    if (this.carAnimationRunning || !this.carSvgs) return;
    
    this.carAnimationRunning = true;
    this.activeCars = [];
    
    const animate = () => {
      if (!this.carAnimationRunning) return;
      
      this.carTypes.forEach(type => {
        if (Math.random() < type.spawnRate) {
          this.spawnCar(type);
        }
      });

      const carsByLane = new Map();
      for (const car of this.activeCars) {
        if (!carsByLane.has(car.lane)) carsByLane.set(car.lane, []);
        carsByLane.get(car.lane).push(car);
      }

      for (const [lane, laneCars] of carsByLane.entries()) {
        if (laneCars.length === 0) continue;

        const direction = laneCars[0].direction;
        const sorted = laneCars.slice().sort((a, b) => a.x - b.x);

        if (direction === 1) {
          sorted.reverse();
          let frontX = null;
          const buffer = 20;

          for (const car of sorted) {
            const desiredDx = car.speed;
            let nextX = car.x + desiredDx;

            if (frontX !== null) {
              const maxX = frontX - (car.width + buffer);
              nextX = Math.min(nextX, maxX);
              if (nextX < car.x) nextX = car.x;
            }

            car.currentSpeed = (nextX - car.x);
            car.x = nextX;
            frontX = car.x;
          }
        } else {
          let frontX = null;
          let frontWidth = null;
          const buffer = 20;

          for (const car of sorted) {
            const desiredDx = car.speed;
            let nextX = car.x - desiredDx;

            if (frontX !== null) {
              const minX = frontX + (frontWidth + buffer);
              nextX = Math.max(nextX, minX);
              if (nextX > car.x) nextX = car.x;
            }

            car.currentSpeed = (car.x - nextX);
            car.x = nextX;
            frontX = car.x;
            frontWidth = car.width;
          }
        }
      }

      for (let i = this.activeCars.length - 1; i >= 0; i--) {
        const car = this.activeCars[i];
        const laneContainer = document.getElementById(`lane${car.lane}Container`);
        if (!laneContainer) continue;
        const containerWidth = laneContainer.offsetWidth || 800;

        if ((car.direction === 1 && car.x > containerWidth + 100) ||
            (car.direction === -1 && car.x < -100)) {
          car.el.remove();
          this.activeCars.splice(i, 1);
          continue;
        }

        car.el.style.left = `${car.x}px`;
      }
      
      this.carAnimationId = requestAnimationFrame(animate);
    };
    
    animate();
  },

  spawnCar(type) {
    const laneContainer = document.getElementById(`lane${type.lane}Container`);
    if (!laneContainer) return;
    
    const containerWidth = laneContainer.offsetWidth || 800;
    const x = type.direction === 1 ? -type.width : containerWidth + type.width;

    const carsInLane = this.activeCars.filter(c => c.lane === type.lane);
    if (carsInLane.length > 0) {
      const buffer = 20;

      if (type.direction === 1) {
        const nearestX = Math.min(...carsInLane.map(c => c.x));
        if (nearestX - x < (type.width + buffer)) return;
      } else {
        const nearestX = Math.max(...carsInLane.map(c => c.x + (c.width ?? type.width)));
        if (x < nearestX + buffer) return;
      }
    }
    
    const carEl = document.createElement('div');
    carEl.className = `vehicle ${type.type}`;
    carEl.innerHTML = this.carSvgs[type.type];
    carEl.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: 50%;
      transform: translateY(-50%) ${type.direction === -1 ? 'scaleX(-1)' : ''};
      width: ${type.width}px;
      height: ${type.height}px;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.1s;
      z-index: 10;
    `;
    
    carEl.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      carEl.style.pointerEvents = 'none';
      
      if (carEl.dataset.caught === 'true') return;
      carEl.dataset.caught = 'true';
      
      const index = this.activeCars.findIndex(c => c.el === carEl);
      if (index > -1) this.activeCars.splice(index, 1);
      
      this.catchCar(carEl, e.clientX, e.clientY);
    }, { once: true });
    
    laneContainer.appendChild(carEl);
    
    this.activeCars.push({
      el: carEl,
      x: x,
      width: type.width,
      height: type.height,
      speed: type.speed * (0.9 + Math.random() * 0.2),
      direction: type.direction,
      lane: type.lane,
      type: type.type
    });
  },

  stopCarAnimation() {
    this.carAnimationRunning = false;
    if (this.carAnimationId) {
      cancelAnimationFrame(this.carAnimationId);
      this.carAnimationId = null;
    }
    this.activeCars.forEach(c => c.el.remove());
    this.activeCars = [];
  },

  catchCar(carEl, x, y) {
    carEl.style.transform = carEl.style.transform.replace('scaleX(-1)', '') + ' scale(1.3)';
    carEl.style.opacity = '0';
    setTimeout(() => carEl.remove(), 100);
    
    const amount = catchCarGame();
    
    this.createFloatingText('+1 Car', x, y);
    
    this.updateDisplay();
  },

  catchFish(fishEl, x, y) {
    fishEl.style.transform = 'scale(1.5)';
    fishEl.style.opacity = '0';
    setTimeout(() => fishEl.remove(), 100);
    
    const amount = catchFishGame();
    
    this.createFloatingText('+1 Fish', x, y);
    
    this.updateDisplay();
  },

  updateShopForResource(resourceType) {
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
    
    requestAnimationFrame(() => {
      el.style.transform = "translateY(-60px)";
      el.style.opacity = "0";
    });
    
    setTimeout(() => el.remove(), 800);
  },

  async renderShop() {
    const shopGrid = document.getElementById("shopGrid");
    if (!shopGrid) return;
    
    if (!shopGrid.dataset.initialized) {
      const snapshot = getHudSnapshot();
      
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
      
      shopGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.upgradeCard');
        if (!card || card.classList.contains('locked')) return;
        
        const upgradeId = card.dataset.upgradeId;
        if (purchaseUpgrade(upgradeId)) {
          this.updateDisplay();
          
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
      
      const isAffordable = upgrade.canAfford;
      const currentlyAffordable = card.classList.contains('affordable');
      
      if (isAffordable && !currentlyAffordable) {
        card.classList.add('affordable');
        card.classList.remove('locked');
      } else if (!isAffordable && currentlyAffordable) {
        card.classList.remove('affordable');
        card.classList.add('locked');
      }
      
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
    
    const resources = ['gems', 'wood', 'stone', 'gold'];
    
    resources.forEach(resource => {
      const countEl = document.getElementById(`${resource}Count`);
      const rpsEl = document.getElementById(`${resource}Rps`);
      const powerEl = document.getElementById(`${resource}PowerDisplay`);
      
      if (countEl) countEl.textContent = formatNumber(snapshot[resource]);
      if (rpsEl) rpsEl.textContent = `+${formatNumber(snapshot[`${resource}PerSecond`])}/s`;
      
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
    
    const fishCountEl = document.getElementById("fishCount");
    if (fishCountEl) fishCountEl.textContent = formatNumber(snapshot.fish);
    
    const carsCountEl = document.getElementById("carsCount");
    if (carsCountEl) carsCountEl.textContent = formatNumber(snapshot.cars);
    
    const totalClicksEl = document.getElementById("totalClicks");
    const totalEarnedEl = document.getElementById("totalEarned");
    
    if (totalClicksEl) totalClicksEl.textContent = `${formatNumber(snapshot.totalClicks)} clicks`;
    if (totalEarnedEl) totalEarnedEl.textContent = `${formatNumber(
      snapshot.totalGemsEarned + 
      snapshot.totalWoodEarned + 
      snapshot.totalStoneEarned + 
      snapshot.totalGoldEarned +
      snapshot.totalFishEarned +
      snapshot.totalCarsEarned
    )} earned`;
    
    this.updateShopClasses();
    
    const activeTab = document.querySelector('.resourceTab.active');
    if (activeTab) {
      this.updateShopForResource(activeTab.dataset.resource);
    }
  },

  updateHud() {
    this.updateDisplay();
  }
};

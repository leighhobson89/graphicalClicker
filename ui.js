import { globals, resetGameVariables } from "./constantsAndGlobalVariables.js";
import { applyTheme } from "./themeManager.js";
import { setLanguage, updateAllTexts, t } from "./languageManager.js";
import { performClick, purchaseUpgrade, getHudSnapshot, formatNumber, catchCarGame } from "./game.js";
import { 
  hasSave, 
  exportSave, 
  importSave,
  saveToLocalStorage 
} from "./saveManager.js";

export const UI = {
  menuRoot: null,
  gameRoot: null,
  svgCache: {},
  templateHtml: null,
  activeCars: [],
  carSvgs: null,
  vehicleTypes: null,
  carAnimationRunning: false,
  carAnimationId: null,
  selectedPiece: null,
  gridData: [],
  startCell: null,
  makeStartChecked: false,
  roadPieceSvgs: {},

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
    this.stopCarAnimation();
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
      <div class="menuContainer">
        <div class="menuHeader">
          <h1 class="gameTitle" data-i18n="menuTitle">Traffic Rush</h1>
          <p class="menuSubtitle" data-i18n="menuSubtitle">Click vehicles. Build your collection.</p>
        </div>

        <div class="menuActions">
          <button id="btnNewGame" class="btnPrimary" type="button" data-i18n="newGame">New Game</button>
          <button id="btnContinue" class="btnSecondary" type="button" ${!hasExistingSave ? 'disabled' : ''} data-i18n="continue">Continue</button>
        </div>

        <div class="menuOptions">
          <div class="optionGroup">
            <label class="optionLabel" data-i18n="language">Language</label>
            <select id="languageSelect" class="optionSelect">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="fr">Français</option>
              <option value="pt">Português</option>
            </select>
          </div>

          <div class="optionGroup">
            <label class="optionLabel" data-i18n="theme">Theme</label>
            <select id="themeSelect" class="optionSelect">
              <option value="dark" data-i18n-option="theme_dark">Dark</option>
              <option value="light" data-i18n-option="theme_light">Light</option>
              <option value="neon" data-i18n-option="theme_neon">Neon</option>
              <option value="sunset" data-i18n-option="theme_sunset">Sunset</option>
            </select>
          </div>

          <div class="optionGroup">
            <label class="optionLabel" data-i18n="sound">Sound</label>
            <button id="btnSoundToggle" class="optionBtn" type="button">${soundEnabled ? await t("soundOn") : await t("soundOff")}</button>
          </div>
        </div>

        <div class="menuFooter">
          <button id="btnExportSave" class="btnText" type="button" data-i18n="exportSave">Export Save</button>
          <button id="btnImportSave" class="btnText" type="button" data-i18n="importSave">Import Save</button>
          <input type="file" id="importFileInput" accept=".save" style="display:none">
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
    themeSelect.value = selectedTheme || "dark";

    btnNewGame.addEventListener("click", () => {
      resetGameVariables();
      onNewGame();
    });

    btnContinue.addEventListener("click", () => {
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
      globals.setSelectedTheme(value);
      applyTheme(value);
    });

    btnSoundToggle.addEventListener("click", async () => {
      const next = !globals.getSoundEnabled();
      globals.setSoundEnabled(next);
      btnSoundToggle.textContent = next ? await t("soundOn") : await t("soundOff");
    });

    await updateAllTexts(this.menuRoot);
  },

  async renderGame({ onBackToMenu }) {
    const template = await this.loadTemplate();
    this.gameRoot.innerHTML = template;

    document.getElementById("btnMenu").addEventListener("click", onBackToMenu);

    await this.setupRoad();
    this.createGrid();
    this.setupRoadPieceEditor();
    this.setupMakeStartControl();

    document.getElementById("btnStart")?.addEventListener("click", () => {
      this.startTraffic();
    });
    document.getElementById("btnStop")?.addEventListener("click", () => {
      this.stopTraffic();
    });
    document.getElementById("btnReset")?.addEventListener("click", () => {
      this.resetTraffic();
    });

    await updateAllTexts(this.gameRoot);
  },

  setupRoad() {
    return new Promise((resolve) => {
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
        this.vehicleTypes = [
          { type: 'car1', speed: 0.375, width: 6, height: 6 },
          { type: 'car2', speed: 0.33, width: 6, height: 6 },
          { type: 'car3', speed: 0.36, width: 6, height: 6 },
          { type: 'car4', speed: 0.3, width: 6, height: 6 },
          { type: 'truck1', speed: 0.24, width: 14, height: 7 },
          { type: 'truck2', speed: 0.21, width: 16, height: 8 },
          { type: 'motorbike', speed: 0.525, width: 9, height: 5 }
        ];
        this.laneConfigs = [
          { lane: 0, direction: 1, isSlowLane: true, spawnRate: 0.025 },
          { lane: 1, direction: 1, isSlowLane: false, spawnRate: 0 },
          { lane: 2, direction: -1, isSlowLane: false, spawnRate: 0 },
          { lane: 3, direction: -1, isSlowLane: true, spawnRate: 0.025 }
        ];
        resolve();
      });
    });
  },

  setupRoadPieceEditor() {
    const editor = document.getElementById('roadPieceEditor');
    const selectedValueEl = document.getElementById('selectedItemValue');
    if (!editor) return;

    const pieces = editor.querySelectorAll('.piece');
    pieces.forEach(piece => {
      piece.addEventListener('click', () => {
        pieces.forEach(p => p.classList.remove('selected'));
        piece.classList.add('selected');
        this.selectedPiece = piece.dataset.type;
        if (selectedValueEl) {
          selectedValueEl.textContent = this.formatPieceName(this.selectedPiece);
        }
      });
    });
  },

  formatPieceName(type) {
    if (!type) return 'None';
    const names = {
      'horizontal': 'Horizontal Road',
      'vertical': 'Vertical Road',
      'corner-right-up': 'Right Corner (↑)',
      'corner-right-down': 'Right Corner (↓)',
      'corner-left-up': 'Left Corner (↑)',
      'corner-left-down': 'Left Corner (↓)'
    };
    return names[type] || type;
  },

  startCarAnimationIfNeeded() {
    if (this.carAnimationRunning || !this.carSvgs) return;

    this.carAnimationRunning = true;
    this.activeCars = [];
    let nextVehicleId = 1;

    const getOvertakingLane = (lane) => {
      if (lane === 0) return 1;
      if (lane === 3) return 2;
      return lane;
    };

    const isLaneClear = (lane, x, width, ignoreId) => {
      const buffer = 30;
      const checkStart = x - buffer;
      const checkEnd = x + width + buffer;

      for (const other of this.activeCars) {
        if (other.id === ignoreId) continue;
        if (other.lane !== lane) continue;

        const otherStart = other.x;
        const otherEnd = other.x + other.width;

        if (checkStart < otherEnd && checkEnd > otherStart) return false;
      }
      return true;
    };

    const changeLane = (car, newLane) => {
      if (car.isChangingLane) return false;

      const newContainer = document.getElementById(`lane${newLane}Container`);
      const oldContainer = document.getElementById(`lane${car.lane}Container`);
      const roadContainer = document.getElementById('road');
      if (!newContainer || !oldContainer || !roadContainer) return false;

      car.isChangingLane = true;

      const roadRect = roadContainer.getBoundingClientRect();
      const oldRect = oldContainer.getBoundingClientRect();
      const newRect = newContainer.getBoundingClientRect();

      const startY = oldRect.top + oldRect.height / 2 - roadRect.top;
      const targetY = newRect.top + newRect.height / 2 - roadRect.top;

      const baseTransform = car.direction === -1 ? 'scaleX(-1)' : '';

      car.el.style.position = 'absolute';
      car.el.style.top = `${startY}px`;
      car.el.style.left = `${car.x}px`;
      car.el.style.transform = `translateY(-50%) ${baseTransform}`;
      car.el.style.zIndex = '100';
      car.el.style.transition = 'top 0.25s ease-out';

      roadContainer.appendChild(car.el);

      requestAnimationFrame(() => {
        car.el.style.top = `${targetY}px`;
      });

      setTimeout(() => {
        if (!car.el || !car.el.isConnected) {
          car.isChangingLane = false;
          return;
        }

        car.lane = newLane;
        car.lastLaneChangeX = car.x;

        car.el.style.transition = 'none';
        car.el.style.top = '50%';
        car.el.style.left = `${car.x}px`;
        car.el.style.transform = `translateY(-50%) ${baseTransform}`;
        car.el.style.zIndex = '10';

        newContainer.appendChild(car.el);
        car.isChangingLane = false;
      }, 250);

      return true;
    };

    const spawnVehicle = (laneConfig) => {
      if (!this.vehicleTypes || this.vehicleTypes.length === 0) return;

      const vehicleType = this.vehicleTypes[Math.floor(Math.random() * this.vehicleTypes.length)];
      const isRightSide = laneConfig.direction === 1;
      const slowLane = isRightSide ? 0 : 3;
      const overtakeLane = isRightSide ? 1 : 2;

      const containerWidth = 1400;
      const buffer = 40;

      let spawnLane = slowLane;
      let spawnX = laneConfig.direction === 1 ? -vehicleType.width : containerWidth + vehicleType.width;

      const carsInSlowLane = this.activeCars.filter(c => c.lane === slowLane);
      const nearestInSlow = laneConfig.direction === 1
        ? (carsInSlowLane.length > 0 ? Math.min(...carsInSlowLane.map(c => c.x)) : Infinity)
        : (carsInSlowLane.length > 0 ? Math.max(...carsInSlowLane.map(c => c.x + c.width)) : -Infinity);

      const slowLaneBlocked = laneConfig.direction === 1
        ? nearestInSlow < vehicleType.width + buffer * 2
        : nearestInSlow > containerWidth - vehicleType.width - buffer * 2;

      if (slowLaneBlocked) {
        const carsInOvertake = this.activeCars.filter(c => c.lane === overtakeLane);
        const nearestInOvertake = laneConfig.direction === 1
          ? (carsInOvertake.length > 0 ? Math.min(...carsInOvertake.map(c => c.x)) : Infinity)
          : (carsInOvertake.length > 0 ? Math.max(...carsInOvertake.map(c => c.x + c.width)) : -Infinity);

        const overtakeLaneClear = laneConfig.direction === 1
          ? nearestInOvertake > vehicleType.width + buffer
          : nearestInOvertake < containerWidth - vehicleType.width - buffer;

        if (overtakeLaneClear) {
          spawnLane = overtakeLane;
        } else {
          return;
        }
      }

      const container = document.getElementById(`lane${spawnLane}Container`);
      if (!container) return;

      const carEl = document.createElement('div');
      carEl.className = `vehicle ${vehicleType.type}`;
      carEl.innerHTML = this.carSvgs[vehicleType.type];
      carEl.style.cssText = `
        position: absolute;
        left: ${spawnX}px;
        top: 50%;
        transform: translateY(-50%) ${laneConfig.direction === -1 ? 'scaleX(-1)' : ''};
        width: ${vehicleType.width}px;
        height: ${vehicleType.height}px;
        z-index: 10;
      `;

      container.appendChild(carEl);

      this.activeCars.push({
        id: nextVehicleId++,
        el: carEl,
        x: spawnX,
        width: vehicleType.width,
        speed: vehicleType.speed * (0.9 + Math.random() * 0.2),
        direction: laneConfig.direction,
        lane: spawnLane,
        preferredLane: slowLane,
        lastLaneChangeX: spawnLane === overtakeLane ? spawnX : null,
        isChangingLane: false
      });
    };

    const animate = () => {
      if (!this.carAnimationRunning) return;

      try {
        if (this.laneConfigs && this.vehicleTypes) {
          for (const config of this.laneConfigs) {
            if (config.isSlowLane && Math.random() < config.spawnRate) {
              spawnVehicle(config);
            }
          }
        }

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
            let frontCar = null;
            const buffer = 20;

            for (const car of sorted) {
              let targetSpeed = car.speed;
              let isBlocked = false;

              if (frontCar) {
                const minGap = car.width + buffer;
                const maxX = frontCar.x - minGap;

                if (car.x + targetSpeed > maxX) {
                  targetSpeed = Math.max(0, maxX - car.x);
                  isBlocked = targetSpeed < car.speed * 0.5;
                }
              }

              car.x += targetSpeed;

              if (isBlocked && !car.isChangingLane && car.preferredLane !== undefined) {
                // Only cars in preferred SLOW lane (0) should overtake to lane 1
                // Fast lane cars (1) should NOT undertake - just follow
                if (car.lane === 0 && car.preferredLane === 0) {
                  const distanceSinceChange = car.lastLaneChangeX !== null
                    ? Math.abs(car.x - car.lastLaneChangeX)
                    : Infinity;

                  if (distanceSinceChange > 80 && isLaneClear(1, car.x, car.width, car.id)) {
                    changeLane(car, 1);
                  }
                }
              } else if (car.lane !== car.preferredLane && !car.isChangingLane) {
                // Return to preferred lane when clear
                const distanceSinceChange = car.lastLaneChangeX !== null
                  ? Math.abs(car.x - car.lastLaneChangeX)
                  : Infinity;

                if (distanceSinceChange > 100 && isLaneClear(car.preferredLane, car.x, car.width, car.id)) {
                  changeLane(car, car.preferredLane);
                }
              }

              frontCar = car;
            }
          } else {
            let frontCar = null;
            const buffer = 20;

            for (const car of sorted) {
              let targetSpeed = car.speed;
              let isBlocked = false;

              if (frontCar) {
                const minGap = frontCar.width + buffer;
                const minX = frontCar.x + minGap;

                if (car.x - targetSpeed < minX) {
                  targetSpeed = Math.max(0, car.x - minX);
                  isBlocked = targetSpeed < car.speed * 0.5;
                }
              }

              car.x -= targetSpeed;

              if (isBlocked && !car.isChangingLane && car.preferredLane !== undefined) {
                // Only cars in preferred SLOW lane (3) should overtake to lane 2
                // Fast lane cars (2) should NOT undertake - just follow
                if (car.lane === 3 && car.preferredLane === 3) {
                  const distanceSinceChange = car.lastLaneChangeX !== null
                    ? Math.abs(car.x - car.lastLaneChangeX)
                    : Infinity;

                  if (distanceSinceChange > 80 && isLaneClear(2, car.x, car.width, car.id)) {
                    changeLane(car, 2);
                  }
                }
              } else if (car.lane !== car.preferredLane && !car.isChangingLane) {
                // Return to preferred lane when clear
                const distanceSinceChange = car.lastLaneChangeX !== null
                  ? Math.abs(car.x - car.lastLaneChangeX)
                  : Infinity;

                if (distanceSinceChange > 100 && isLaneClear(car.preferredLane, car.x, car.width, car.id)) {
                  changeLane(car, car.preferredLane);
                }
              }

              frontCar = car;
            }
          }
        }

        const containerWidth = 1400;
        for (let i = this.activeCars.length - 1; i >= 0; i--) {
          const car = this.activeCars[i];
          if (!car || !car.el) continue;

          if ((car.direction === 1 && car.x > containerWidth + 150) ||
              (car.direction === -1 && car.x < -150)) {
            car.el.remove();
            this.activeCars.splice(i, 1);
            continue;
          }

          car.el.style.left = `${car.x}px`;
        }
      } catch (err) {
        console.error('Animation error:', err);
      }

      this.carAnimationId = requestAnimationFrame(animate);
    };

    animate();
  },

  startTraffic() {
    if (!this.startCell) {
      console.log('No start cell set');
      return;
    }
    this.startGridAnimation();
  },

  startGridAnimation() {
    if (this.carAnimationRunning) return;
    this.carAnimationRunning = true;
    this.activeCars = [];
    let nextVehicleId = 1;

    const spawnRate = 0.03;
    const gridSize = 10;
    
    // Compute grid metrics ONCE when Start is clicked
    const gridContainer = document.getElementById('gridContainer');
    const gridRect = gridContainer.getBoundingClientRect();
    const computedCellSize = gridRect.width / gridSize;
    
    // Store all cell positions for accurate spawning
    const cellPositions = [];
    for (let row = 0; row < gridSize; row++) {
      const rowPositions = [];
      for (let col = 0; col < gridSize; col++) {
        const cellEl = this.gridData[row][col].el;
        const cellRect = cellEl.getBoundingClientRect();
        rowPositions.push({
          left: cellRect.left - gridRect.left,
          top: cellRect.top - gridRect.top,
          width: cellRect.width,
          height: cellRect.height
        });
      }
      cellPositions.push(rowPositions);
    }
    
    // Use stored cell size
    const getCellSize = () => computedCellSize;

    // Direction helpers: 0=right, 1=down, 2=left, 3=up
    const dirVectors = [
      { dx: 1, dy: 0 },   // right
      { dx: 0, dy: 1 },   // down  
      { dx: -1, dy: 0 },  // left
      { dx: 0, dy: -1 }   // up
    ];

    // Get which directions a piece connects
    const getPieceConnections = (pieceType) => {
      switch (pieceType) {
        case 'horizontal': return [0, 2]; // right, left
        case 'vertical': return [1, 3];   // down, up
        case 'corner-right-up': return [0, 3];    // right, up (┐)
        case 'corner-right-down': return [0, 1];  // right, down (┘)
        case 'corner-left-up': return [2, 3];     // left, up (┌)
        case 'corner-left-down': return [2, 1];   // left, down (└)
        default: return [];
      }
    };

    // Get exit direction based on entry direction for a piece
    const getExitDirection = (pieceType, entryDir) => {
      const connections = getPieceConnections(pieceType);
      const oppositeEntry = (entryDir + 2) % 4;
      const exitDir = connections.find(d => d !== oppositeEntry);
      return exitDir !== undefined ? exitDir : null;
    };

    // Lane configurations - 4 lanes per road piece (2 in each direction)
    // For horizontal: lanes 0,1 are right-moving (bottom), lanes 2,3 are left-moving (top)
    // For vertical: lanes 0,1 are down-moving (right side), lanes 2,3 are up-moving (left side)
    const laneConfigs = [
      { lane: 0, offset: 0.75, isSlowLane: true, spawnRate: 0.025, direction: 0 },   // Bottom outer slow (right/down)
      { lane: 1, offset: 0.62, isSlowLane: false, spawnRate: 0, direction: 0 },    // Bottom inner fast (right/down)
      { lane: 2, offset: 0.38, isSlowLane: false, spawnRate: 0, direction: 2 },    // Top inner fast (left/up)
      { lane: 3, offset: 0.25, isSlowLane: true, spawnRate: 0.025, direction: 2 }   // Top outer slow (left/up)
    ];

    const spawnVehicle = () => {
      if (!this.vehicleTypes || this.vehicleTypes.length === 0) return;
      if (!this.startCell) return;

      const startCellData = this.gridData[this.startCell.row][this.startCell.col];
      if (!startCellData.type) return;

      const connections = getPieceConnections(startCellData.type);
      if (connections.length === 0) return;
      
      // Determine initial direction from start piece connections
      const initialDir = connections[0];

      // Check all 4 lanes for a clear spot
      const availableLanes = [];
      const spawnBuffer = 15; // Minimum distance between cars
      
      for (let laneIdx = 0; laneIdx < 4; laneIdx++) {
        const cellSize = computedCellSize;
        const laneOffset = laneConfigs[laneIdx].offset * cellSize;
        const laneDir = laneConfigs[laneIdx].direction;
        
        // Get pre-computed position for spawn check
        const startCellPos = cellPositions[this.startCell.row][this.startCell.col];
        
        // Calculate spawn position for this lane
        let spawnX, spawnY;
        if (initialDir === 0 || initialDir === 2) {
          // Horizontal piece - lanes are vertical offsets
          spawnY = startCellPos.top + laneOffset;
          // Spawn from appropriate edge based on lane direction
          if (laneDir === 0) {
            spawnX = startCellPos.left; // Left edge for right-moving
          } else {
            spawnX = startCellPos.left + startCellPos.width; // Right edge for left-moving
          }
        } else {
          // Vertical piece - lanes are horizontal offsets  
          spawnX = startCellPos.left + laneOffset;
          // Spawn from appropriate edge based on lane direction
          if (laneDir === 1) {
            spawnY = startCellPos.top; // Top edge for down-moving
          } else {
            spawnY = startCellPos.top + startCellPos.height; // Bottom edge for up-moving
          }
        }
        
        // Check if any car is too close in this lane at spawn position
        let laneClear = true;
        for (const otherCar of this.activeCars) {
          if (otherCar.lane !== laneIdx) continue;
          // Check cars in same cell or very close
          const dx = otherCar.x - spawnX;
          const dy = otherCar.y - spawnY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < spawnBuffer) {
            laneClear = false;
            break;
          }
        }
        
        if (laneClear) {
          availableLanes.push(laneIdx);
        }
      }
      
      if (availableLanes.length === 0) return; // No clear lanes

      const vehicleType = this.vehicleTypes[Math.floor(Math.random() * this.vehicleTypes.length)];
      const laneIdx = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      const cellSize = computedCellSize;
      const laneOffset = laneConfigs[laneIdx].offset * cellSize;
      const laneDir = laneConfigs[laneIdx].direction;
      const vec = dirVectors[laneDir];

      const carEl = document.createElement('div');
      carEl.className = `vehicle ${vehicleType.type}`;
      carEl.innerHTML = this.carSvgs[vehicleType.type];
      
      // Get pre-computed position of the start cell
      const startCellPos = cellPositions[this.startCell.row][this.startCell.col];
      
      // Spawn from appropriate edge based on lane direction
      let startX, startY;
      if (initialDir === 0 || initialDir === 2) {
        // Horizontal piece - lanes are vertical offsets
        startY = startCellPos.top + laneOffset;
        if (laneDir === 0) {
          startX = startCellPos.left; // Left edge for right-moving
        } else {
          startX = startCellPos.left + startCellPos.width; // Right edge for left-moving
        }
      } else {
        // Vertical piece - lanes are horizontal offsets  
        startX = startCellPos.left + laneOffset;
        if (laneDir === 1) {
          startY = startCellPos.top; // Top edge for down-moving
        } else {
          startY = startCellPos.top + startCellPos.height; // Bottom edge for up-moving
        }
      }
      
      carEl.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        transform: translate(0, -50%) ${laneDir === 2 ? 'scaleX(-1)' : ''};
        width: ${vehicleType.width}px;
        height: ${vehicleType.height}px;
        z-index: 100;
        pointer-events: none;
      `;

      gridContainer.appendChild(carEl);

      this.activeCars.push({
        id: nextVehicleId++,
        el: carEl,
        x: startX,
        y: startY,
        gridCol: this.startCell.col,
        gridRow: this.startCell.row,
        vx: vec.dx * vehicleType.speed,
        vy: vec.dy * vehicleType.speed,
        direction: laneDir,
        width: vehicleType.width,
        height: vehicleType.height,
        speed: vehicleType.speed,
        vehicleType: vehicleType.type,
        lane: laneIdx,
        preferredLane: laneIdx
      });
    };

    // Helper to check if lane is clear ahead
    const isLaneClearAhead = (car, checkLane, bufferDistance) => {
      for (const other of this.activeCars) {
        if (other.id === car.id) continue;
        if (other.lane !== checkLane) continue;
        
        // Only check cars ahead in the direction of travel
        if (car.direction === 0) { // right
          if (other.x > car.x && other.x < car.x + bufferDistance) return false;
        } else if (car.direction === 2) { // left
          if (other.x < car.x && other.x > car.x - bufferDistance) return false;
        } else if (car.direction === 1) { // down
          if (other.y > car.y && other.y < car.y + bufferDistance) return false;
        } else if (car.direction === 3) { // up
          if (other.y < car.y && other.y > car.y - bufferDistance) return false;
        }
      }
      return true;
    };

    // Helper to change lane
    const changeLane = (car, newLane) => {
      if (car.isChangingLane) return false;
      
      const newOffset = laneConfigs[newLane].offset * getCellSize();
      const oldOffset = laneConfigs[car.lane].offset * getCellSize();
      
      // Update lane immediately
      car.lane = newLane;
      car.isChangingLane = true;
      
      // Smooth transition of position
      const startOffset = oldOffset;
      const targetOffset = newOffset;
      const transitionDuration = 300; // ms
      const startTime = Date.now();
      
      const doTransition = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / transitionDuration, 1);
        
        // Interpolate position
        const currentOffset = startOffset + (targetOffset - startOffset) * progress;
        
        if (car.direction === 0 || car.direction === 2) {
          // Horizontal - offset is Y
          car.y = car.gridRow * getCellSize() + currentOffset;
        } else {
          // Vertical - offset is X
          car.x = car.gridCol * getCellSize() + currentOffset;
        }
        
        if (progress < 1) {
          requestAnimationFrame(doTransition);
        } else {
          car.isChangingLane = false;
        }
      };
      
      requestAnimationFrame(doTransition);
      return true;
    };

    const animate = () => {
      if (!this.carAnimationRunning) return;

      try {
        if (Math.random() < spawnRate) {
          spawnVehicle();
        }

        const cellSize = getCellSize();
        const gridWidth = gridSize * cellSize;
        const gridHeight = gridSize * cellSize;

        // Process cars by direction for overtaking logic
        for (let i = 0; i < this.activeCars.length; i++) {
          const car = this.activeCars[i];
          if (!car || !car.el || car.isChangingLane) continue;

          const buffer = 20; // Distance to check ahead
          
          // Check if blocked in current lane
          const blocked = !isLaneClearAhead(car, car.lane, buffer + car.width);
          
          if (blocked) {
            // Try to overtake if in slow lane
            if (car.lane === 0 && isLaneClearAhead(car, 1, buffer + car.width)) {
              // Overtake from lane 0 to lane 1
              changeLane(car, 1);
            } else if (car.lane === 3 && isLaneClearAhead(car, 2, buffer + car.width)) {
              // Overtake from lane 3 to lane 2
              changeLane(car, 2);
            }
          } else {
            // Not blocked - return to preferred slow lane if in fast lane
            if (car.lane === 1 && car.preferredLane === 0 && isLaneClearAhead(car, 0, buffer + car.width)) {
              changeLane(car, 0);
            } else if (car.lane === 2 && car.preferredLane === 3 && isLaneClearAhead(car, 3, buffer + car.width)) {
              changeLane(car, 3);
            }
          }
        }

        for (let i = this.activeCars.length - 1; i >= 0; i--) {
          const car = this.activeCars[i];
          if (!car || !car.el) continue;

          // Move car
          car.x += car.vx;
          car.y += car.vy;

          // Check if out of grid bounds
          if (car.x < -50 || car.x > gridWidth + 50 || car.y < -50 || car.y > gridHeight + 50) {
            car.el.remove();
            this.activeCars.splice(i, 1);
            continue;
          }

          // Determine which cell the car is now in
          const cellSize = getCellSize();
          const newCol = Math.floor(car.x / cellSize);
          const newRow = Math.floor(car.y / cellSize);

          // If car entered a new cell
          if (newCol !== car.gridCol || newRow !== car.gridRow) {
            // Check bounds
            if (newCol < 0 || newCol >= gridSize || newRow < 0 || newRow >= gridSize) {
              car.el.remove();
              this.activeCars.splice(i, 1);
              continue;
            }

            const newCellData = this.gridData[newRow][newCol];
            
            // If no piece in this cell, car disappears
            if (!newCellData.type) {
              car.el.remove();
              this.activeCars.splice(i, 1);
              continue;
            }

            // Get exit direction based on how we entered
            const exitDir = getExitDirection(newCellData.type, car.direction);
            
            if (exitDir === null) {
              // No valid exit - car disappears
              car.el.remove();
              this.activeCars.splice(i, 1);
              continue;
            }

            // Calculate the lane offset (perpendicular to direction)
            const cellSize = getCellSize();
            const laneOffset = laneConfigs[car.lane].offset * cellSize;

            // Update car velocity and direction
            const vec = dirVectors[exitDir];
            car.vx = vec.dx * car.speed;
            car.vy = vec.dy * car.speed;
            
            // Recalculate position to maintain lane offset when entering new cell
            if (exitDir !== car.direction) {
              // Car turned - recalculate position based on lane
              const cellSize = getCellSize();
              const cellLeft = newCol * cellSize;
              const cellTop = newRow * cellSize;
              
              if (exitDir === 0) { // going right
                car.y = cellTop + laneOffset;
              } else if (exitDir === 2) { // going left
                car.y = cellTop + laneOffset;
              } else if (exitDir === 1) { // going down
                car.x = cellLeft + laneOffset;
              } else if (exitDir === 3) { // going up
                car.x = cellLeft + laneOffset;
              }
            }
            
            car.direction = exitDir;

            // Update car rotation based on direction
            let rotation = 0;
            if (exitDir === 0) rotation = 0;      // right
            else if (exitDir === 1) rotation = 90;  // down
            else if (exitDir === 2) rotation = 180; // left  
            else if (exitDir === 3) rotation = -90; // up

            if (exitDir === 2) {
              car.el.style.transform = `translate(0, -50%) scaleX(-1)`;
            } else {
              car.el.style.transform = `translate(0, -50%) rotate(${rotation}deg)`;
            }

            car.gridCol = newCol;
            car.gridRow = newRow;
          }

          car.el.style.left = `${car.x}px`;
          car.el.style.top = `${car.y}px`;
        }
      } catch (err) {
        console.error('Animation error:', err);
      }

      this.carAnimationId = requestAnimationFrame(animate);
    };

    animate();
  },

  stopTraffic() {
    this.carAnimationRunning = false;
    if (this.carAnimationId) {
      cancelAnimationFrame(this.carAnimationId);
      this.carAnimationId = null;
    }
  },

  resetTraffic() {
    this.stopTraffic();
    this.activeCars.forEach(c => c.el.remove());
    this.activeCars = [];
  },

  stopCarAnimation() {
    this.stopTraffic();
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

  updateDisplay() {
    // No-op - no score display needed
  },

  updateHud() {
    // No-op - no score display needed
  },

  createGrid() {
    const container = document.getElementById('gridContainer');
    if (!container) return;

    container.innerHTML = '';
    this.gridData = [];

    // Initialize road piece SVGs
    this.createRoadPieceSvgs();

    for (let row = 0; row < 10; row++) {
      const rowData = [];
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement('div');
        cell.className = 'gridCell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.addEventListener('click', () => this.handleGridClick(row, col));
        container.appendChild(cell);
        rowData.push({ type: null, el: cell });
      }
      this.gridData.push(rowData);
    }
  },

  createRoadPieceSvgs() {
    // Horizontal road - 2 lanes in each direction (4 lanes total)
    this.roadPieceSvgs.horizontal = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Road background -->
      <rect x="0" y="0" width="100" height="100" fill="#475569"/>
      <!-- Lane markings - 4 lanes -->
      <rect x="0" y="15" width="100" height="20" fill="#34495e"/>
      <rect x="0" y="65" width="100" height="20" fill="#34495e"/>
      <!-- Center divider -->
      <rect x="0" y="48" width="100" height="4" fill="#f39c12"/>
      <!-- Lane lines -->
      <line x1="0" y1="25" x2="100" y2="25" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="10,10"/>
      <line x1="0" y1="75" x2="100" y2="75" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="10,10"/>
    </svg>`;

    // Vertical road - 2 lanes in each direction (4 lanes total)
    this.roadPieceSvgs.vertical = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Road background -->
      <rect x="0" y="0" width="100" height="100" fill="#475569"/>
      <!-- Lane markings - 4 lanes -->
      <rect x="15" y="0" width="20" height="100" fill="#34495e"/>
      <rect x="65" y="0" width="20" height="100" fill="#34495e"/>
      <!-- Center divider -->
      <rect x="48" y="0" width="4" height="100" fill="#f39c12"/>
      <!-- Lane lines -->
      <line x1="25" y1="0" x2="25" y2="100" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="10,10"/>
      <line x1="75" y1="0" x2="75" y2="100" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="10,10"/>
    </svg>`;

    // Corner right-up: Road from RIGHT turns UP (┐ shape)
    this.roadPieceSvgs['corner-right-up'] = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="100" fill="#475569"/>
      <!-- Right vertical lanes -->
      <rect x="65" y="0" width="20" height="50" fill="#34495e"/>
      <!-- Top horizontal lanes -->
      <rect x="0" y="15" width="50" height="20" fill="#34495e"/>
      <!-- Center divider -->
      <path d="M 50 0 L 50 50 L 100 50" stroke="#f39c12" stroke-width="4" fill="none"/>
      <!-- Lane markings -->
      <line x1="25" y1="0" x2="25" y2="50" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="8,8"/>
      <line x1="0" y1="25" x2="50" y2="25" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="8,8"/>
    </svg>`;

    // Corner right-down: Road from RIGHT turns DOWN (┘ shape)
    this.roadPieceSvgs['corner-right-down'] = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="100" fill="#475569"/>
      <!-- Right vertical lanes -->
      <rect x="65" y="50" width="20" height="50" fill="#34495e"/>
      <!-- Bottom horizontal lanes -->
      <rect x="0" y="65" width="50" height="20" fill="#34495e"/>
      <!-- Center divider -->
      <path d="M 50 100 L 50 50 L 100 50" stroke="#f39c12" stroke-width="4" fill="none"/>
      <!-- Lane markings -->
      <line x1="25" y1="50" x2="25" y2="100" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="8,8"/>
      <line x1="0" y1="75" x2="50" y2="75" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="8,8"/>
    </svg>`;

    // Corner left-up: Road from LEFT turns UP (┌ shape)
    this.roadPieceSvgs['corner-left-up'] = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="100" fill="#475569"/>
      <!-- Left vertical lanes -->
      <rect x="15" y="0" width="20" height="50" fill="#34495e"/>
      <!-- Top horizontal lanes -->
      <rect x="50" y="15" width="50" height="20" fill="#34495e"/>
      <!-- Center divider -->
      <path d="M 0 50 L 50 50 L 50 0" stroke="#f39c12" stroke-width="4" fill="none"/>
      <!-- Lane markings -->
      <line x1="75" y1="0" x2="75" y2="50" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="8,8"/>
      <line x1="50" y1="25" x2="100" y2="25" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="8,8"/>
    </svg>`;

    // Corner left-down: Road from LEFT turns DOWN (└ shape)
    this.roadPieceSvgs['corner-left-down'] = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="100" fill="#475569"/>
      <!-- Left vertical lanes -->
      <rect x="15" y="50" width="20" height="50" fill="#34495e"/>
      <!-- Bottom horizontal lanes -->
      <rect x="50" y="65" width="50" height="20" fill="#34495e"/>
      <!-- Center divider -->
      <path d="M 0 50 L 50 50 L 50 100" stroke="#f39c12" stroke-width="4" fill="none"/>
      <!-- Lane markings -->
      <line x1="75" y1="50" x2="75" y2="100" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="8,8"/>
      <line x1="50" y1="75" x2="100" y2="75" stroke="#ecf0f1" stroke-width="1" stroke-dasharray="8,8"/>
    </svg>`;
  },

  setupMakeStartControl() {
    const checkbox = document.getElementById('makeStartCheckbox');
    if (!checkbox) return;

    checkbox.addEventListener('change', (e) => {
      this.makeStartChecked = e.target.checked;
    });
  },

  handleGridClick(row, col) {
    // If no piece selected and not making start, return early
    if (!this.selectedPiece && !this.makeStartChecked) return;

    const cellData = this.gridData[row][col];
    const cellEl = cellData.el;

    // Handle Make Start
    if (this.makeStartChecked) {
      // Remove start from previous cell
      if (this.startCell) {
        const prevCell = this.gridData[this.startCell.row][this.startCell.col];
        prevCell.el.classList.remove('isStart');
      }

      // Set new start cell
      this.startCell = { row, col };
      cellEl.classList.add('isStart');
      return;
    }

    // Place road piece
    if (this.selectedPiece) {
      cellData.type = this.selectedPiece;
      cellEl.classList.add('hasPiece');
      
      // Create road piece element
      const pieceEl = document.createElement('div');
      pieceEl.className = 'roadPiece';
      pieceEl.innerHTML = this.roadPieceSvgs[this.selectedPiece];
      
      // Clear existing content and add piece
      cellEl.innerHTML = '';
      cellEl.appendChild(pieceEl);

      // Re-add start marker if this is the start cell
      if (this.startCell && this.startCell.row === row && this.startCell.col === col) {
        cellEl.classList.add('isStart');
      }
    }
  },

  resetTraffic() {
    this.stopTraffic();
    this.activeCars.forEach(c => c.el.remove());
    this.activeCars = [];
    // Clear grid
    this.gridData.forEach(row => {
      row.forEach(cell => {
        cell.type = null;
        cell.el.classList.remove('hasPiece', 'isStart');
        cell.el.innerHTML = '';
      });
    });
    this.startCell = null;
    const checkbox = document.getElementById('makeStartCheckbox');
    if (checkbox) checkbox.checked = false;
    this.makeStartChecked = false;
  }
};

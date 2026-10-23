// ==========================================
// DZONG KEEPER - GAME ENGINE
// ==========================================

// Screen Management
function showScreen(screenId) {
  document.getElementById('screen-main-menu').classList.add('hidden');
  document.getElementById('screen-mode-select').classList.add('hidden');
  document.getElementById('screen-gameplay').classList.add('hidden');

  document.getElementById(screenId).classList.remove('hidden');

  if (screenId === 'screen-gameplay') {
    initCanvas();
  } else {
    clearWaveSpawnInterval();
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId);
      gameLoopId = null;
    }
  }
}

function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function exitGame() {
  alert('Thank you for playing The Last Dzong Keeper!');
}

// GAME STATE & ENGINE CONSTANTS
let canvas, ctx;
let gameLoopId = null;
let waveSpawnIntervalId = null;

let gameState = {
  difficulty: 'Normal',
  lives: 5,
  gold: 150,
  wave: 0,
  maxWave: 5,
  isPaused: false,
  gameSpeed: 1,
  selectedBuildSpot: null,
  selectedTower: null,
  inWave: false,
  waveSpawning: false,
  nextWavePaths: [],
};

// Build Spots along 4 paths targeting central base
let buildSpots = [];
let towers = [];
let enemies = [];
let projectiles = [];
let warriorUnits = [];

// Path setup: 4 paths coming from Top, Bottom, Left, Right into central Dzong (CenterX, CenterY)
let dzongCenter = { x: 0, y: 0 };
let paths = []; // 4 path array definitions

const DIFFICULTY_SETTINGS = {
  Easy: { startingGold: 250, enemyMultiplier: 1.15 },
  Normal: { startingGold: 150, enemyMultiplier: 1.5 },
  Hard: { startingGold: 100, enemyMultiplier: 2.0 },
};

const TOWER_TYPES = {
  archer: { name: 'ARCHER TOWER', cost: 50, range: 130, fireRate: 45, damage: 20, color: '#10B981' },
  cannon: { name: 'CANNON TOWER', cost: 100, range: 110, fireRate: 90, damage: 45, color: '#EF4444' },
  mage: { name: 'WIZARD TOWER', cost: 150, range: 140, fireRate: 60, damage: 30, color: '#A855F7' },
  guard: { name: 'GUARD TOWER', cost: 75, range: 120, fireRate: 120, damage: 15, color: '#3B82F6' },
};

const ASSET_SOURCES = {
  main: 'assets/Main.png',
  archer: 'assets/Archer.png',
  cannon: 'assets/Cannon.png',
  wizard: 'assets/Wizard.png',
  guard: 'assets/Guard.png',
  enemy: 'assets/Enemy.png',
  warrior: 'assets/Warrior.png',
  drum: 'assets/Drum.jpg',
  thangka: 'assets/Thangka.jpg',
  lamb: 'assets/Lamb.jpg',
  wheel: 'assets/Wheel.jpg',
  cymbal: 'assets/Cymbal.jpg',
};

const assetImages = {};

function loadAssets() {
  for (const [key, src] of Object.entries(ASSET_SOURCES)) {
    const img = new Image();
    img.src = src;
    assetImages[key] = img;
  }
}

function getAsset(key) {
  const img = assetImages[key];
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

function drawImageCentered(img, x, y, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
}

function drawImageBottom(img, x, bottomY, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  ctx.drawImage(img, x - width / 2, bottomY - height, width, height);
}

function drawLevelBadge(x, y, level) {
  ctx.fillStyle = '#D8982D';
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 9px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(level, x, y);
}

loadAssets();

function selectDifficulty(diff) {
  gameState.difficulty = diff;
  gameState.lives = 5;
  const settings = DIFFICULTY_SETTINGS[diff] || DIFFICULTY_SETTINGS.Normal;
  gameState.gold = settings.startingGold;
  showScreen('screen-gameplay');
}

function initCanvas() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Mouse click interactions for building/upgrading
  canvas.addEventListener('click', handleCanvasClick);

  resetGame();
  if (!gameLoopId) {
    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameEngineLoop);
  }
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  dzongCenter = { x: canvas.width / 2, y: canvas.height / 2 };

  // Recalculate 4 paths (Top, Bottom, Left, Right)
  paths = [
    { name: 'Top', start: { x: dzongCenter.x, y: 0 }, end: dzongCenter },
    { name: 'Bottom', start: { x: dzongCenter.x, y: canvas.height }, end: dzongCenter },
    { name: 'Left', start: { x: 0, y: dzongCenter.y }, end: dzongCenter },
    { name: 'Right', start: { x: canvas.width, y: dzongCenter.y }, end: dzongCenter },
  ];
  paths.forEach(prepareCurvedPath);

  // Setup 12 Build spots (3 on each of the 4 paths), kept 20px away from the main gate
  buildSpots = [];
  const offset = 55;
  const gateOffset = 20;

  // Top Path spots
  buildSpots.push({ id: 1, x: dzongCenter.x - offset, y: dzongCenter.y * 0.3 - gateOffset, tower: null });
  buildSpots.push({ id: 2, x: dzongCenter.x + offset, y: dzongCenter.y * 0.5 - gateOffset, tower: null });
  buildSpots.push({ id: 3, x: dzongCenter.x - offset, y: dzongCenter.y * 0.7 - gateOffset, tower: null });

  // Bottom Path spots
  buildSpots.push({ id: 4, x: dzongCenter.x + offset, y: dzongCenter.y + (canvas.height - dzongCenter.y) * 0.3 + gateOffset, tower: null });
  buildSpots.push({ id: 5, x: dzongCenter.x - offset, y: dzongCenter.y + (canvas.height - dzongCenter.y) * 0.5 + gateOffset, tower: null });
  buildSpots.push({ id: 6, x: dzongCenter.x + offset, y: dzongCenter.y + (canvas.height - dzongCenter.y) * 0.7 + gateOffset, tower: null });

  // Left Path spots
  buildSpots.push({ id: 7, x: dzongCenter.x * 0.3 - gateOffset, y: dzongCenter.y - offset, tower: null });
  buildSpots.push({ id: 8, x: dzongCenter.x * 0.5 - gateOffset, y: dzongCenter.y + offset, tower: null });
  buildSpots.push({ id: 9, x: dzongCenter.x * 0.7 - gateOffset, y: dzongCenter.y - offset, tower: null });

  // Right Path spots
  buildSpots.push({ id: 10, x: dzongCenter.x + (canvas.width - dzongCenter.x) * 0.3 + gateOffset, y: dzongCenter.y + offset, tower: null });
  buildSpots.push({ id: 11, x: dzongCenter.x + (canvas.width - dzongCenter.x) * 0.5 + gateOffset, y: dzongCenter.y - offset, tower: null });
  buildSpots.push({ id: 12, x: dzongCenter.x + (canvas.width - dzongCenter.x) * 0.7 + gateOffset, y: dzongCenter.y + offset, tower: null });
}

// Give each straight path a gentle S-curve and sample it for enemy movement.
function prepareCurvedPath(path) {
  const dx = path.end.x - path.start.x;
  const dy = path.end.y - path.start.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const bend = Math.min(80, Math.max(50, Math.min(canvas.width, canvas.height) * 0.07));

  path.control1 = {
    x: path.start.x + dx * 0.33 + nx * bend,
    y: path.start.y + dy * 0.33 + ny * bend,
  };
  path.control2 = {
    x: path.start.x + dx * 0.67 - nx * bend,
    y: path.start.y + dy * 0.67 - ny * bend,
  };

  const sampleCount = 80;
  path.samples = [];
  path.cumulative = [0];

  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const mt = 1 - t;
    const x =
      mt * mt * mt * path.start.x +
      3 * mt * mt * t * path.control1.x +
      3 * mt * t * t * path.control2.x +
      t * t * t * path.end.x;
    const y =
      mt * mt * mt * path.start.y +
      3 * mt * mt * t * path.control1.y +
      3 * mt * t * t * path.control2.y +
      t * t * t * path.end.y;

    path.samples.push({ x, y });
    if (i > 0) {
      const prev = path.samples[i - 1];
      path.cumulative.push(path.cumulative[i - 1] + Math.hypot(x - prev.x, y - prev.y));
    }
  }

  path.length = path.cumulative[path.cumulative.length - 1];
}

function traceCurvedPath(path) {
  ctx.beginPath();
  ctx.moveTo(path.start.x, path.start.y);
  ctx.bezierCurveTo(
    path.control1.x,
    path.control1.y,
    path.control2.x,
    path.control2.y,
    path.end.x,
    path.end.y
  );
}

function drawWavePathIndicators() {
  if (gameState.inWave || gameState.wave >= gameState.maxWave) return;

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 250);

  for (const pathName of gameState.nextWavePaths) {
    const path = paths.find((p) => p.name === pathName);
    if (!path || !path.samples) continue;

    const index = Math.min(10, path.samples.length - 1);
    const point = path.samples[index];
    const ahead = path.samples[Math.min(index + 3, path.samples.length - 1)];
    const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x);

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.35 + 0.65 * pulse;
    ctx.strokeStyle = '#FB923C';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#F97316';
    ctx.shadowBlur = 18;

    for (let i = 0; i < 2; i++) {
      const offset = i * 16;
      ctx.beginPath();
      ctx.moveTo(offset - 10, -12);
      ctx.lineTo(offset + 6, 0);
      ctx.lineTo(offset - 10, 12);
      ctx.stroke();
    }
    ctx.restore();

    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    ctx.save();
    ctx.globalAlpha = 0.45 + 0.55 * pulse;
    ctx.fillStyle = '#FDBA74';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('INCOMING', point.x + nx * 36, point.y + ny * 36);
    ctx.restore();
  }
}

function resetGame() {
  clearWaveSpawnInterval();
  gameState.wave = 0;
  gameState.isPaused = false;
  gameState.inWave = false;
  gameState.waveSpawning = false;
  towers = [];
  enemies = [];
  projectiles = [];
  warriorUnits = [];
  pickNextWavePaths();

  updateUI();
  closeBuildDrawer();
  closeUpgradeDrawer();
}

function pickNextWavePaths() {
  gameState.nextWavePaths = [...paths]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .map((path) => path.name);
}

function restartCurrentGame() {
  closeModal('modal-game-end');
  selectDifficulty(gameState.difficulty);
}

function returnToLevelSelect() {
  closeModal('modal-game-end');
  gameState.isPaused = false;
  showScreen('screen-mode-select');
}

function updateUI() {
  document.getElementById('ui-lives').innerText = gameState.lives;
  document.getElementById('ui-gold').innerText = gameState.gold;
  document.getElementById('ui-wave-current').innerText = gameState.wave;
  document.getElementById('ui-wave-max').innerText = gameState.maxWave;
  updateBuildAffordability();
  updateStartBattleButton();
}

function updateStartBattleButton() {
  const btn = document.getElementById('btn-start-battle');
  if (!btn) return;
  const shouldHide = gameState.inWave || gameState.wave >= gameState.maxWave;
  btn.style.display = shouldHide ? 'none' : 'flex';
}

function updateBuildAffordability() {
  document.querySelectorAll('#build-drawer .build-option').forEach((btn) => {
    const cost = Number(btn.dataset.cost);
    const affordable = gameState.gold >= cost;
    btn.classList.toggle('opacity-40', !affordable);
    btn.disabled = !affordable;
  });
}

// CANVAS CLICK HANDLER
function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Check if clicked on build spots
  let foundSpot = false;
  for (let spot of buildSpots) {
    const dist = Math.hypot(spot.x - clickX, spot.y - clickY);
    if (dist <= 25) {
      foundSpot = true;
      if (!spot.tower) {
        // Empty spot -> open Build Drawer
        gameState.selectedBuildSpot = spot;
        gameState.selectedTower = null;
        openBuildDrawer();
        closeUpgradeDrawer();
      } else {
        // Built tower spot -> open Upgrade Drawer
        gameState.selectedTower = spot.tower;
        gameState.selectedBuildSpot = null;
        openUpgradeDrawer(spot.tower);
        closeBuildDrawer();
      }
      break;
    }
  }

  if (!foundSpot) {
    closeBuildDrawer();
    closeUpgradeDrawer();
  }
}

// TOWER BUILD & UPGRADE HANDLERS
function openBuildDrawer() {
  document.getElementById('build-drawer').classList.remove('hidden');
  updateBuildAffordability();
}

function closeBuildDrawer() {
  document.getElementById('build-drawer').classList.add('hidden');
  gameState.selectedBuildSpot = null;
}

function buildTower(type) {
  const config = TOWER_TYPES[type];
  if (!gameState.selectedBuildSpot) return;
  if (gameState.gold < config.cost) return;

  gameState.gold -= config.cost;
  updateUI();

  const newTower = {
    id: Date.now(),
    type: type,
    x: gameState.selectedBuildSpot.x,
    y: gameState.selectedBuildSpot.y,
    level: 1,
    range: config.range,
    fireRate: config.fireRate,
    damage: config.damage,
    cooldown: 0,
    spot: gameState.selectedBuildSpot,
  };

  gameState.selectedBuildSpot.tower = newTower;
  towers.push(newTower);

  // If Guard Tower, spawn a warrior nearby on the road
  if (type === 'guard') {
    spawnWarriorUnit(newTower);
  }

  closeBuildDrawer();
}

function openUpgradeDrawer(tower) {
  const drawer = document.getElementById('tower-upgrade-drawer');
  drawer.classList.remove('hidden');

  document.getElementById('upgrade-tower-name').innerText = TOWER_TYPES[tower.type].name;
  document.getElementById('upgrade-tower-level').innerText = `Level ${tower.level}`;
  document.getElementById('upgrade-cost').innerText = Math.floor(TOWER_TYPES[tower.type].cost * 0.8 * tower.level);
  document.getElementById('sell-value').innerText = Math.floor(TOWER_TYPES[tower.type].cost * 0.5 * tower.level);
}

function closeUpgradeDrawer() {
  document.getElementById('tower-upgrade-drawer').classList.add('hidden');
  gameState.selectedTower = null;
}

function upgradeSelectedTower() {
  if (!gameState.selectedTower) return;
  const tower = gameState.selectedTower;
  const upgradeCost = Math.floor(TOWER_TYPES[tower.type].cost * 0.8 * tower.level);

  if (gameState.gold < upgradeCost) {
    alert('Not enough Gold for Upgrade!');
    return;
  }

  gameState.gold -= upgradeCost;
  tower.level += 1;
  tower.damage = Math.floor(tower.damage * 1.2);
  tower.range += 5;
  updateUI();

  openUpgradeDrawer(tower);
}

function sellSelectedTower() {
  if (!gameState.selectedTower) return;
  const tower = gameState.selectedTower;
  const sellVal = Math.floor(TOWER_TYPES[tower.type].cost * 0.5 * tower.level);

  gameState.gold += sellVal;
  updateUI();

  // Clear from spot & list
  tower.spot.tower = null;
  towers = towers.filter((t) => t.id !== tower.id);
  warriorUnits = warriorUnits.filter((w) => w.towerId !== tower.id);

  closeUpgradeDrawer();
}

// WARRIOR UNIT SPAWNING (GUARD TOWER)
function spawnWarriorUnit(tower) {
  warriorUnits.push({
    id: Date.now(),
    towerId: tower.id,
    x: tower.x + 15,
    y: tower.y + 15,
    targetX: tower.x + 15,
    targetY: tower.y + 15,
    hp: 100,
    maxHp: 100,
    inCombat: false,
  });
}

// WAVE SPAWNING
function clearWaveSpawnInterval() {
  if (waveSpawnIntervalId !== null) {
    clearInterval(waveSpawnIntervalId);
    waveSpawnIntervalId = null;
  }
}

function startNextWave() {
  if (gameState.inWave) return;
  if (gameState.wave >= gameState.maxWave) return;

  gameState.wave++;
  gameState.inWave = true;
  gameState.waveSpawning = true;
  updateUI();

  const enemyMultiplier = (DIFFICULTY_SETTINGS[gameState.difficulty] || DIFFICULTY_SETTINGS.Normal).enemyMultiplier;
  const enemyCount = Math.round((6 + gameState.wave * 4) * enemyMultiplier);
  const activePaths = paths.filter((path) => gameState.nextWavePaths.includes(path.name));
  const wavePaths = activePaths.length === 2 ? activePaths : [...paths].sort(() => Math.random() - 0.5).slice(0, 2);
  let spawned = 0;

  waveSpawnIntervalId = setInterval(() => {
    if (spawned >= enemyCount) {
      gameState.waveSpawning = false;
      clearWaveSpawnInterval();
      return;
    }

    // Pick one of the 2 paths chosen for this wave
    const randomPath = wavePaths[Math.floor(Math.random() * wavePaths.length)];
    enemies.push({
      id: Date.now() + Math.random(),
      path: randomPath,
      x: randomPath.start.x,
      y: randomPath.start.y,
      distance: 0,
      sampleIndex: 0,
      speed: 0.5 + gameState.wave * 0.1,
      hp: 40 + gameState.wave * 15,
      maxHp: 40 + gameState.wave * 15,
      reward: 15,
    });

    spawned++;

    if (spawned >= enemyCount) {
      gameState.waveSpawning = false;
      clearWaveSpawnInterval();
    }
  }, 900 / gameState.gameSpeed);
}

function togglePause() {
  gameState.isPaused = !gameState.isPaused;
  document.getElementById('btn-pause').innerHTML = gameState.isPaused
    ? '<i class="fa-solid fa-play"></i>'
    : '<i class="fa-solid fa-pause"></i>';
}

function toggleSpeed() {
  gameState.gameSpeed = gameState.gameSpeed === 1 ? 2 : 1;
  document.getElementById('btn-speed').classList.toggle('text-yellow-400', gameState.gameSpeed === 2);
}

// ==========================================
// MAIN GAME LOOP & RENDERING
// ==========================================
let lastTime = 0;

function gameEngineLoop(timestamp) {
  if (!gameState.isPaused) {
    updateGameObjects();
  }
  renderGameCanvas();
  gameLoopId = requestAnimationFrame(gameEngineLoop);
}

function updateGameObjects() {
  // 1. Move Enemies along their curved path toward central Dzong
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const path = e.path;

    e.distance += e.speed * gameState.gameSpeed;

    if (e.distance >= path.length - 15) {
      // Reached Dzong Fortress -> lose health
      gameState.lives -= 1;
      updateUI();
      enemies.splice(i, 1);

      if (gameState.lives <= 0) {
        triggerGameEnd(false);
      }
      continue;
    }

    // Find the current segment of the sampled curve
    while (e.sampleIndex < path.samples.length - 2 && e.distance > path.cumulative[e.sampleIndex + 1]) {
      e.sampleIndex++;
    }

    const a = path.samples[e.sampleIndex];
    const b = path.samples[e.sampleIndex + 1];
    const segStart = path.cumulative[e.sampleIndex];
    const segLength = path.cumulative[e.sampleIndex + 1] - segStart;
    const t = segLength > 0 ? (e.distance - segStart) / segLength : 0;

    e.x = a.x + (b.x - a.x) * t;
    e.y = a.y + (b.y - a.y) * t;
  }

  // 2. Tower Attacks
  for (let t of towers) {
    t.cooldown -= 1 * gameState.gameSpeed;
    if (t.cooldown <= 0) {
      // Find target enemy within range
      let target = null;
      let minDist = t.range;

      for (let e of enemies) {
        const d = Math.hypot(e.x - t.x, e.y - t.y);
        if (d < minDist) {
          minDist = d;
          target = e;
        }
      }

      if (target) {
        t.cooldown = t.fireRate;
        projectiles.push({
          x: t.x,
          y: t.y,
          targetX: target.x,
          targetY: target.y,
          targetEnemy: target,
          damage: t.damage,
          type: t.type,
          speed: 8,
        });
      }
    }
  }

  // 3. Move Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 8) {
      // Hit Target
      if (enemies.includes(p.targetEnemy)) {
        p.targetEnemy.hp -= p.damage;
        if (p.targetEnemy.hp <= 0) {
          gameState.gold += p.targetEnemy.reward;
          updateUI();
          enemies = enemies.filter((e) => e !== p.targetEnemy);
        }
      }
      projectiles.splice(i, 1);
      continue;
    }

    p.x += (dx / dist) * p.speed * gameState.gameSpeed;
    p.y += (dy / dist) * p.speed * gameState.gameSpeed;
  }

  // 4. Check Wave Completion
  if (gameState.inWave && !gameState.waveSpawning && enemies.length === 0) {
    gameState.inWave = false;
    if (gameState.wave >= gameState.maxWave) {
      triggerGameEnd(true);
    } else {
      pickNextWavePaths();
    }
    updateStartBattleButton();
  }
}

function triggerGameEnd(isVictory) {
  clearWaveSpawnInterval();
  gameState.isPaused = true;
  openModal('modal-game-end');

  const title = document.getElementById('end-title');
  const subtitle = document.getElementById('end-subtitle');
  const starsDiv = document.getElementById('end-stars');

  if (isVictory) {
    title.innerText = 'VICTORY!';
    title.className = 'font-cinzel text-4xl font-black text-gold-gradient mb-2';
    subtitle.innerText = 'You successfully defended the Dzong fortress!';

    let starsCount = gameState.lives >= 5 ? 3 : gameState.lives >= 3 ? 2 : 1;
    starsDiv.innerHTML = Array(3)
      .fill(0)
      .map((_, i) => `<i class="fa-solid fa-star ${i < starsCount ? 'text-[#E5B150]' : 'text-gray-600'}"></i>`)
      .join('');
  } else {
    title.innerText = 'DEFEAT';
    title.className = 'font-cinzel text-4xl font-black text-red-500 mb-2';
    subtitle.innerText = 'The Dzong fortress has fallen to the slimes!';

    const defeatAssets = ['drum', 'thangka', 'lamb', 'wheel', 'cymbal'];
    starsDiv.innerHTML = `
      <div class="flex flex-col items-center gap-6 text-5xl mb-12">
        ${defeatAssets.map((key) => {
          const img = getAsset(key);
          return `
            <div class="relative w-32 h-32">
              ${img ? `<img src="${img.src}" class="w-full h-full object-cover rounded-xl opacity-60" alt="${key}">` : `<i class="fa-regular fa-image text-gray-600 text-5xl"></i>`}
              <i class="fa-solid fa-xmark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"></i>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

// ==========================================
// CANVAS RENDERING METHODS
// ==========================================
function renderGameCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background Field
  ctx.fillStyle = '#1A291A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render 4 Dirt Paths leading to Dzong
  ctx.strokeStyle = '#4A3B32';
  ctx.lineWidth = 45;
  ctx.lineCap = 'round';

  for (let p of paths) {
    traceCurvedPath(p);
    ctx.stroke();
  }

  // Render Path Borders/Highlights
  ctx.strokeStyle = '#2E221B';
  ctx.lineWidth = 49;
  for (let p of paths) {
    traceCurvedPath(p);
    ctx.stroke();
  }
  ctx.strokeStyle = '#4A3B32';
  ctx.lineWidth = 41;
  for (let p of paths) {
    traceCurvedPath(p);
    ctx.stroke();
  }

  // Show which 2 paths the next wave will use before battle starts
  drawWavePathIndicators();

  // Draw Central Base (THE DZONG FORTRESS)
  drawDzongFortress(dzongCenter.x, dzongCenter.y);

  // Draw 12 Build Spots
  for (let spot of buildSpots) {
    if (!spot.tower) {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 20, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center '+' Icon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', spot.x, spot.y);
    } else {
      // Draw Placed Tower
      drawTowerAsset(spot.tower);
    }
  }

  // Draw Warrior Units (Deployed from Guard Towers)
  for (let w of warriorUnits) {
    drawMaroonWarrior(w.x, w.y);
  }

  // Draw Enemies (Molten Red Slimes)
  for (let e of enemies) {
    drawRedSlimeEnemy(e);
  }

  // Draw Projectiles
  for (let p of projectiles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.type === 'cannon' ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = p.type === 'mage' ? '#C084FC' : p.type === 'cannon' ? '#111827' : '#F59E0B';
    ctx.fill();
  }

  // Highlight selected tower range
  if (gameState.selectedTower) {
    ctx.beginPath();
    ctx.arc(gameState.selectedTower.x, gameState.selectedTower.y, gameState.selectedTower.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(216, 152, 45, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#D8982D';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// DRAWING DETAILED BHUTANESE ARCHITECTURE ASSETS

// 1. Central Dzong Fortress Base Asset
function drawDzongFortress(x, y) {
  const img = getAsset('main');
  if (img) {
    ctx.beginPath();
    ctx.ellipse(x, y + 46, 74, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    drawImageBottom(img, x, y + 62, 172, 128);
    return;
  }

  ctx.save();
  ctx.translate(x, y);

  // Main Base Shadow
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();

  // Outer Walls (White/Gold Dzong Wall Layer)
  ctx.fillStyle = '#E5E0D8';
  ctx.fillRect(-45, -45, 90, 90);

  // Maroon Top Trim
  ctx.fillStyle = '#5B1412';
  ctx.fillRect(-45, -45, 90, 14);
  ctx.fillRect(-45, 31, 90, 14);

  // Golden Roof Tier 1
  ctx.fillStyle = '#D8982D';
  ctx.beginPath();
  ctx.moveTo(-50, -45);
  ctx.lineTo(50, -45);
  ctx.lineTo(35, -58);
  ctx.lineTo(-35, -58);
  ctx.closePath();
  ctx.fill();

  // Golden Roof Tier 2
  ctx.beginPath();
  ctx.moveTo(-30, -58);
  ctx.lineTo(30, -58);
  ctx.lineTo(20, -70);
  ctx.lineTo(-20, -70);
  ctx.closePath();
  ctx.fill();

  // Top Spire
  ctx.beginPath();
  ctx.arc(0, -73, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF2A1';
  ctx.fill();

  // Center Banner Label
  ctx.fillStyle = '#3D1F0D';
  ctx.fillRect(-28, -10, 56, 20);
  ctx.strokeStyle = '#D8982D';
  ctx.lineWidth = 1;
  ctx.strokeRect(-28, -10, 56, 20);

  ctx.fillStyle = '#FFF2A1';
  ctx.font = 'bold 9px Cinzel';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DZONG', 0, 0);

  ctx.restore();
}

// 2. Tower Assets Rendering
function drawTowerAsset(tower) {
  const img = getAsset(tower.type === 'mage' ? 'wizard' : tower.type);
  if (img) {
    ctx.beginPath();
    ctx.ellipse(tower.x, tower.y + 18, 20, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    drawImageBottom(img, tower.x, tower.y + 20, 66, 82);
    drawLevelBadge(tower.x + 22, tower.y - 22, tower.level);
    return;
  }

  ctx.save();
  ctx.translate(tower.x, tower.y);

  // Base Shadow
  ctx.beginPath();
  ctx.arc(0, 8, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();

  if (tower.type === 'archer') {
    // Archer Watchtower with Prayer Flags
    ctx.fillStyle = '#D1C7BD';
    ctx.fillRect(-12, -15, 24, 30);
    ctx.fillStyle = '#6B1D1A';
    ctx.fillRect(-12, -15, 24, 6);

    // Roof
    ctx.fillStyle = '#B47B2B';
    ctx.beginPath();
    ctx.moveTo(-16, -15);
    ctx.lineTo(16, -15);
    ctx.lineTo(0, -28);
    ctx.closePath();
    ctx.fill();

    // Icon
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (tower.type === 'cannon') {
    // Cannon Tower
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-14, -14, 28, 28);
    ctx.fillStyle = '#451A03';
    ctx.fillRect(-14, -14, 28, 6);

    // Barrel
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(-3, -22, 6, 14);

    // Icon
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, 2, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (tower.type === 'mage') {
    // Wizard Pagoda
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(-10, -18, 20, 32);
    ctx.fillStyle = '#4C1D95';
    ctx.fillRect(-10, -18, 20, 6);

    // Purple Fireball
    ctx.beginPath();
    ctx.arc(0, -24, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#A855F7';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2, -26, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#E9D5FF';
    ctx.fill();
  } else if (tower.type === 'guard') {
    // Guard Tower Fortress
    ctx.fillStyle = '#9CA3AF';
    ctx.fillRect(-14, -14, 28, 28);
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(-14, -14, 28, 6);

    // Shield Icon
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tower Level Badge
  ctx.fillStyle = '#D8982D';
  ctx.beginPath();
  ctx.arc(10, -12, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 9px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tower.level, 10, -12);

  ctx.restore();
}

// 3. Enemy Asset
function drawRedSlimeEnemy(e) {
  const img = getAsset('enemy');
  if (img) {
    drawImageCentered(img, e.x, e.y, 46, 46);
  } else {
    ctx.save();
    ctx.translate(e.x, e.y);

    // Slime Body Glow
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#DC2626';
    ctx.fill();

    // Slime Core
    ctx.beginPath();
    ctx.arc(-2, -2, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#F87171';
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-5, -3, 3, 3);
    ctx.fillRect(2, -3, 3, 3);

    ctx.restore();
  }

  // Health Bar
  const hpPercent = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(e.x - 12, e.y - 28, 24, 4);
  ctx.fillStyle = hpPercent > 0.4 ? '#22C55E' : '#EF4444';
  ctx.fillRect(e.x - 12, e.y - 28, 24 * hpPercent, 4);
}

// 4. Maroon Warrior Asset (Guard Tower Unit)
function drawMaroonWarrior(x, y) {
  const img = getAsset('warrior');
  if (img) {
    drawImageCentered(img, x, y, 42, 48);
    return;
  }

  ctx.save();
  ctx.translate(x, y);

  // Warrior Body
  ctx.fillStyle = '#5B1412'; // Maroon Robes
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(0, -6, 4, 0, Math.PI * 2);
  ctx.fill();

  // Sword Arc
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(4, -2, 7, -Math.PI / 4, Math.PI / 4);
  ctx.stroke();

  ctx.restore();
}

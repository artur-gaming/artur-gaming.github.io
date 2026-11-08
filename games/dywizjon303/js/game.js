// Main Game Engine: Scene, Waves, Collisions, Cameras, and Game Loop

class AirCombatGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('webgl-canvas');

    // Game state
    this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'UPGRADES', 'GAMEOVER', 'VICTORY'
    this.selectedPlaneType = 'Spitfire'; // 'Spitfire', 'B17', or 'B29'
    this.selectedMap = 'britain'; // 'britain' or 'japan'
    this.score = 0;
    this.wave = 1;
    this.kills = 0;
    this.gunHeat = 0;
    this.isOverheated = false;

    // Bombs & Upgrades
    this.bombsAmmo = 4;
    this.maxBombs = 4;
    this.bombReloadTimer = 0;
    this.nukeShakeTimer = 0;
    this.nukeShakeIntensity = 0;
    this.maxUpgradeLevel = 5;
    this.upgrades = {
      damage: 1,
      cooling: 1,
      engine: 1,
      armor: 1,
      bombs: 1
    };

    // Entities
    this.player = null;
    this.enemies = [];
    this.bombers = [];
    this.ships = [];

    // Timing
    this.lastTime = performance.now();
    this.fireTimer = 0;
    this.turretTimer = 0;

    this.initThree();
    this.initSystems();
    this.initMenuAndUI();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1.0,
      5500
    );
    this.camera.position.set(0, 100, -200);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = false;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initSystems() {
    this.world = new World(this.scene);
    this.particles = new ParticleSystem(this.scene);
    this.ui = new GameUI();
  }

  initMenuAndUI() {
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const victoryBtn = document.getElementById('victory-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const soundToggle = document.getElementById('sound-toggle');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        window.soundSystem.resume();
        this.startGame();
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        window.soundSystem.resume();
        this.startGame();
      });
    }

    if (victoryBtn) {
      victoryBtn.addEventListener('click', () => {
        this.startNextWave(true);
      });
    }

    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        this.togglePause();
      });
    }

    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        const isMuted = window.soundSystem.toggleMute();
        soundToggle.textContent = isMuted ? '🔇 DŹWIĘK WYŁ' : '🔊 DŹWIĘK WŁ';
      });
    }

    // Map selection (Britain vs Japan)
    const mapBritain = document.getElementById('select-map-britain');
    const mapJapan = document.getElementById('select-map-japan');
    if (mapBritain && mapJapan) {
      mapBritain.addEventListener('click', () => {
        this.selectedMap = 'britain';
        mapBritain.classList.add('active');
        mapJapan.classList.remove('active');
        this.world.loadMap('britain');
      });
      mapJapan.addEventListener('click', () => {
        this.selectedMap = 'japan';
        mapJapan.classList.add('active');
        mapBritain.classList.remove('active');
        this.world.loadMap('japan');
      });
    }

    // Aircraft selection (Spitfire, B-17, B-29)
    const planeCards = [
      { id: 'select-spitfire', type: 'Spitfire' },
      { id: 'select-b17', type: 'B17' },
      { id: 'select-b29', type: 'B29' }
    ];
    planeCards.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) {
        el.addEventListener('click', () => {
          this.selectedPlaneType = item.type;
          planeCards.forEach(c => {
            const cardEl = document.getElementById(c.id);
            if (cardEl) cardEl.classList.toggle('active', c.type === item.type);
          });
        });
      }
    });

    const openUpgradesPill = document.getElementById('open-upgrades-pill');
    const closeUpgradeBtn = document.getElementById('close-upgrade-btn');
    if (openUpgradesPill) {
      openUpgradesPill.addEventListener('click', () => {
        if (this.state === 'PLAYING' || this.state === 'UPGRADES') {
          this.toggleUpgradesMenu();
        }
      });
    }
    if (closeUpgradeBtn) {
      closeUpgradeBtn.addEventListener('click', () => {
        if (this.state === 'UPGRADES') {
          this.toggleUpgradesMenu();
        }
      });
    }

    // Upgrade purchase buttons
    const upgConfigs = [
      { id: 'btn-upg-damage', key: 'damage', baseCost: 250 },
      { id: 'btn-upg-cooling', key: 'cooling', baseCost: 250 },
      { id: 'btn-upg-engine', key: 'engine', baseCost: 300 },
      { id: 'btn-upg-armor', key: 'armor', baseCost: 200 },
      { id: 'btn-upg-bombs', key: 'bombs', baseCost: 300 }
    ];
    upgConfigs.forEach(cfg => {
      const btn = document.getElementById(cfg.id);
      if (btn) {
        btn.addEventListener('click', () => this.buyUpgrade(cfg.key, cfg.baseCost));
      }
    });

    // Return to Menu buttons (Pill in HUD + Modal buttons)
    const menuPill = document.getElementById('menu-btn-pill');
    const pauseMenuBtn = document.getElementById('pause-menu-btn');
    const gameOverMenuBtn = document.getElementById('game-over-menu-btn');
    const vicMenuBtn = document.getElementById('victory-menu-btn');

    [menuPill, pauseMenuBtn, gameOverMenuBtn, vicMenuBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          this.returnToMenu();
        });
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyT') {
        if (this.state !== 'MENU') {
          this.returnToMenu();
        }
      } else if (e.code === 'KeyU') {
        if (this.state === 'PLAYING' || this.state === 'UPGRADES') {
          this.toggleUpgradesMenu();
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'UPGRADES') {
          this.toggleUpgradesMenu();
        } else if (this.state === 'PLAYING' || this.state === 'PAUSED') {
          this.togglePause();
        }
      } else if (this.state === 'PLAYING') {
        if (e.code === 'Digit1') {
          this.switchPlayerAircraft('Spitfire');
        } else if (e.code === 'Digit2') {
          this.switchPlayerAircraft('B17');
        } else if (e.code === 'Digit3') {
          this.switchPlayerAircraft('B29');
        } else if (e.code === 'KeyB') {
          this.dropBomb();
        }
      }
    });
  }

  returnToMenu() {
    this.state = 'MENU';
    window.soundSystem.stopEngine();

    // Hide HUD and modal screens
    document.getElementById('hud').style.display = 'none';
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    const upgScreen = document.getElementById('upgrade-screen');
    if (upgScreen) upgScreen.classList.add('hidden');

    // Show Main Start Screen
    document.getElementById('start-screen').classList.remove('hidden');

    // Clear active aircraft, enemies, warships, projectiles
    this.clearEntities();

    // Reload world/map
    this.world.loadMap(this.selectedMap);

    // Reset camera position to menu overview
    this.camera.position.set(0, 100, -200);
    this.camera.lookAt(0, 80, 0);
    this.camera.up.set(0, 1, 0);
  }

  toggleUpgradesMenu() {
    const upgScreen = document.getElementById('upgrade-screen');
    if (!upgScreen) return;

    if (this.state === 'PLAYING') {
      this.state = 'UPGRADES';
      this.updateUpgradeUI();
      upgScreen.classList.remove('hidden');
      window.soundSystem.stopEngine();
    } else if (this.state === 'UPGRADES') {
      this.state = 'PLAYING';
      upgScreen.classList.add('hidden');
    }
  }

  getUpgradeCost(key, baseCost) {
    return baseCost + (this.upgrades[key] - 1) * 150;
  }

  updateUpgradeUI() {
    const ptsEl = document.getElementById('upg-points-val');
    if (ptsEl) ptsEl.textContent = this.score;

    const items = [
      { key: 'damage', baseCost: 250, btnId: 'btn-upg-damage', lvlId: 'upg-damage-lvl' },
      { key: 'cooling', baseCost: 250, btnId: 'btn-upg-cooling', lvlId: 'upg-cooling-lvl' },
      { key: 'engine', baseCost: 300, btnId: 'btn-upg-engine', lvlId: 'upg-engine-lvl' },
      { key: 'armor', baseCost: 200, btnId: 'btn-upg-armor', lvlId: 'upg-armor-lvl' },
      { key: 'bombs', baseCost: 300, btnId: 'btn-upg-bombs', lvlId: 'upg-bombs-lvl' }
    ];

    items.forEach(item => {
      const lvl = this.upgrades[item.key];
      const isMax = lvl >= this.maxUpgradeLevel;
      const cost = this.getUpgradeCost(item.key, item.baseCost);
      const lvlEl = document.getElementById(item.lvlId);
      const btnEl = document.getElementById(item.btnId);
      if (lvlEl) lvlEl.textContent = isMax ? `Poz. ${lvl} (MAKS)` : `Poz. ${lvl} / ${this.maxUpgradeLevel}`;
      if (btnEl) {
        if (isMax) {
          btnEl.textContent = 'MAKSYMALNY POZIOM';
          btnEl.disabled = true;
        } else {
          btnEl.textContent = `ULEPSZ (${cost} PKT)`;
          btnEl.disabled = this.score < cost;
        }
      }
    });
  }

  buyUpgrade(key, baseCost) {
    if (this.upgrades[key] >= this.maxUpgradeLevel) return;
    const cost = this.getUpgradeCost(key, baseCost);
    if (this.score < cost) return;

    this.score -= cost;
    this.upgrades[key] = Math.min(this.maxUpgradeLevel, this.upgrades[key] + 1);
    window.soundSystem.playUpgradeSound();

    // Apply immediate effects
    if (key === 'armor' && this.player) {
      this.player.maxHealth += 60;
      this.player.health = this.player.maxHealth; // Full hull repair!
    } else if (key === 'engine' && this.controls && this.player) {
      const spec = this.createPlayerMeshAndStats(this.player.type);
      const engineBoost = 1 + (this.upgrades.engine - 1) * 0.08; // Max +32% at Level 5 (~625 km/h max)
      this.controls.maxSpeed = Math.min(175, spec.maxSpeed * engineBoost);
      this.controls.turnMultiplier = 1 + (this.upgrades.engine - 1) * 0.08;
    } else if (key === 'bombs') {
      const baseCount = this.selectedPlaneType === 'B29' ? 2 : (this.selectedPlaneType === 'B17' ? 8 : 4);
      this.maxBombs = baseCount + (this.upgrades.bombs - 1) * (this.selectedPlaneType === 'B29' ? 1 : 2);
      this.bombsAmmo = this.maxBombs;
    }

    this.updateUpgradeUI();
  }

  dropBomb() {
    if (!this.player || !this.player.mesh || this.state !== 'PLAYING') return;
    if (this.bombsAmmo <= 0) {
      this.ui.showKillAnnouncement(
        this.player.type === 'B29' ? '⏳ PRZEŁADOWYWANIE BOMBY ATOMOWEJ...' : '⏳ PRZEŁADOWYWANIE BOMB...'
      );
      return;
    }

    this.bombsAmmo--;
    const isNuke = this.player.type === 'B29';
    const blastRadius = isNuke
      ? (700 + (this.upgrades.bombs - 1) * 60)
      : (110 + (this.upgrades.bombs - 1) * 30);
    const damage = isNuke ? 5000 : (500 + (this.upgrades.bombs - 1) * 200);
    const planeVel = this.player.mesh.userData.velocity || new THREE.Vector3(0, 0, 80);

    const dropPos = this.player.mesh.position.clone();
    dropPos.y -= 2.2;

    this.particles.spawnBomb(dropPos, planeVel, blastRadius, damage, isNuke);

    // If flying the B-17G Flying Fortress, drop a twin-bomb salvo from the bomb bay!
    if (this.player.type === 'B17') {
      const secondPos = dropPos.clone().add(new THREE.Vector3(1.5, -0.5, -2.0));
      this.particles.spawnBomb(secondPos, planeVel, blastRadius, damage, false);
    }

    if (isNuke) {
      window.soundSystem.playNukeSiren();
      this.ui.showKillAnnouncement('☢️ ZRZUT BOMBY ATOMOWEJ! OPUŚĆ REJON EKSPLOZJI!');
    } else {
      window.soundSystem.playBombDrop();
    }
  }

  createPlayerMeshAndStats(type) {
    const armorBonus = (this.upgrades.armor - 1) * 60;
    if (type === 'B29') {
      return {
        mesh: PlaneModels.createB29(),
        type: 'B29',
        maxHealth: 600 + armorBonus,
        baseSpeed: 70,
        maxSpeed: 118,
        minSpeed: 36,
        baseBombs: 2,
        hudTitle: 'STAN BOEING B-29 SUPERFORTRESS (KADŁUB)',
        gunTitle: 'SYSTEM KIEROWANIA OGNIEM GE (10x .50 CAL BROWNING + 20MM)'
      };
    }
    if (type === 'B17') {
      return {
        mesh: PlaneModels.createB17(),
        type: 'B17',
        maxHealth: 450 + armorBonus,
        baseSpeed: 64,
        maxSpeed: 105,
        minSpeed: 34,
        baseBombs: 8,
        hudTitle: 'STAN B-17 FLYING FORTRESS (KADŁUB)',
        gunTitle: 'TEMPERATURA 6x KM .50 CAL BROWNING (+ WIEŻYCZKI AI)'
      };
    }
    return {
      mesh: PlaneModels.createSpitfire(),
      type: 'Spitfire',
      maxHealth: 150 + armorBonus,
      baseSpeed: 78,
      maxSpeed: 132,
      minSpeed: 38,
      baseBombs: 4,
      hudTitle: 'STAN SPITFIRE MK VB (KADŁUB)',
      gunTitle: 'TEMPERATURA DZIAŁEK (2x 20MM HISPANO + 4x BROWNING)'
    };
  }

  switchPlayerAircraft(type) {
    if (!this.player || this.player.type === type) return;

    const oldMesh = this.player.mesh;
    const pos = oldMesh.position.clone();
    const hpRatio = Math.max(0.2, this.player.health / this.player.maxHealth);

    this.scene.remove(oldMesh);

    const spec = this.createPlayerMeshAndStats(type);
    this.selectedPlaneType = type;
    spec.mesh.position.copy(pos);
    spec.mesh.rotation.order = 'YXZ';
    spec.mesh.rotation.set(this.controls.pitch, this.controls.yaw, this.controls.roll);
    this.scene.add(spec.mesh);

    this.player.mesh = spec.mesh;
    this.player.type = spec.type;
    this.player.maxHealth = spec.maxHealth;
    this.player.health = Math.round(spec.maxHealth * hpRatio);

    const engineBoost = 1 + (this.upgrades.engine - 1) * 0.08;
    this.controls.baseSpeed = spec.baseSpeed;
    this.controls.maxSpeed = Math.min(175, spec.maxSpeed * engineBoost);
    this.controls.minSpeed = spec.minSpeed;
    this.controls.turnMultiplier = engineBoost;

    this.maxBombs = spec.baseBombs + (this.upgrades.bombs - 1) * (type === 'B29' ? 1 : 2);
    this.bombsAmmo = Math.min(this.maxBombs, Math.max(this.bombsAmmo, 1));

    const planeLabel = document.getElementById('plane-name-label');
    const gunLabel = document.getElementById('gun-name-label');
    if (planeLabel) planeLabel.textContent = spec.hudTitle;
    if (gunLabel) gunLabel.textContent = spec.gunTitle;

    const announceText = type === 'B29'
      ? '✈️ BOEING B-29 SUPERFORTRESS (BROŃ ATOMOWA)!'
      : (type === 'B17' ? '✈️ BOEING B-17G FLYING FORTRESS!' : '✈️ SUPERMARINE SPITFIRE MK VB!');
    this.ui.showKillAnnouncement(announceText);
    window.soundSystem.playRadioChatter();
  }

  startGame() {
    // Hide screens
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    const upgScreen = document.getElementById('upgrade-screen');
    if (upgScreen) upgScreen.classList.add('hidden');
    document.getElementById('hud').style.display = 'block';

    // Reset stats & upgrades
    this.score = 0;
    this.wave = 1;
    this.kills = 0;
    this.gunHeat = 0;
    this.isOverheated = false;
    this.upgrades = { damage: 1, cooling: 1, engine: 1, armor: 1, bombs: 1 };

    // Clear existing entities
    this.clearEntities();

    // Ensure map is properly loaded for current theater
    this.world.loadMap(this.selectedMap);

    // Spawn selected aircraft (Spitfire, B-17G Flying Fortress or B-29 Superfortress)
    const spec = this.createPlayerMeshAndStats(this.selectedPlaneType);
    spec.mesh.position.set(0, 450, 0);
    this.scene.add(spec.mesh);

    this.player = {
      mesh: spec.mesh,
      type: spec.type,
      maxHealth: spec.maxHealth,
      health: spec.maxHealth
    };

    this.maxBombs = spec.baseBombs;
    this.bombsAmmo = this.maxBombs;
    this.bombReloadTimer = 0;

    const planeLabel = document.getElementById('plane-name-label');
    const gunLabel = document.getElementById('gun-name-label');
    if (planeLabel) planeLabel.textContent = spec.hudTitle;
    if (gunLabel) gunLabel.textContent = spec.gunTitle;

    this.controls = new FlightControls(this.container, this.player);
    this.controls.baseSpeed = spec.baseSpeed;
    this.controls.maxSpeed = spec.maxSpeed;
    this.controls.minSpeed = spec.minSpeed;

    // Spawn Allied Bomber Formation (escort mission)
    this.spawnBomberFormation();

    // Spawn Wave 1
    this.startWave(this.wave);

    this.state = 'PLAYING';
    window.soundSystem.playRadioChatter();
  }

  spawnBomberFormation() {
    const formationOffsets = [
      new THREE.Vector3(0, 480, 250),
      new THREE.Vector3(-120, 510, 120),
      new THREE.Vector3(120, 510, 120)
    ];

    formationOffsets.forEach(pos => {
      const bMesh = PlaneModels.createHeavyBomber();
      bMesh.position.copy(pos);
      this.scene.add(bMesh);
      const bomber = new PlaneEntity(bMesh, 'Bomber', false);
      this.bombers.push(bomber);
    });
  }

  startWave(waveNum) {
    this.wave = waveNum;
    const isJapan = this.selectedMap === 'japan';
    const waveTitles = isJapan ? [
      "FALA 1: PATROL LOTNICTWA CESARSKIEGO - MYŚLIWCE ZERO (A6M)",
      "FALA 2: ZESPÓŁ UDERZENIOWY ZERO & KAMIKAZE NAD PACYFIKIEM",
      "FALA 3: NALOT NAD WYSPAMI JAPOŃSKIMI - WIDOK NA GÓRĘ FUDŻI",
      "FALA 4: POJEDYNEK Z ASEM CESARSKIEJ MARYNARKI WOJENNEJ!"
    ] : [
      "FALA 1: PATROL LUFTWAFFE - ROZPOZNANIE BOJOWE",
      "FALA 2: ATAK SZTUKASÓW (JU 87) - BROŃ BOMBOWCÓW!",
      "FALA 3: ZMASOWANE UDERZENIE ESKADRY MESSERSCHMITTÓW",
      "FALA 4: POJEDYNEK Z ASEM LUFTWAFFE!"
    ];

    const title = waveNum <= waveTitles.length
      ? waveTitles[waveNum - 1]
      : (isJapan ? `FALA ${waveNum}: TOTALNY NALOT NAD JAPONIĄ!` : `FALA ${waveNum}: NALOT TOTALNY!`);
    this.ui.showMissionBanner(title);

    // Spawn configuration based on wave
    const spawnDist = 1400;
    const playerPos = this.player.mesh.position;

    // Spawn warships on the water as bombing targets
    this.spawnWarships(playerPos);

    if (isJapan) {
      if (waveNum === 1) {
        // 4x Zero
        for (let i = 0; i < 4; i++) {
          this.spawnEnemy('Zero', playerPos, spawnDist, i * 150);
        }
      } else if (waveNum === 2) {
        // 5x Zero
        for (let i = 0; i < 5; i++) {
          this.spawnEnemy('Zero', playerPos, spawnDist, (i - 2) * 190, 580);
        }
      } else if (waveNum === 3) {
        // 7x Zero swarm
        for (let i = 0; i < 7; i++) {
          this.spawnEnemy('Zero', playerPos, spawnDist, (i - 3) * 160);
        }
      } else {
        // Ace Boss + 6 Escort Zeros
        this.spawnEnemy('ZeroAce', playerPos, spawnDist - 200, 0, 560);
        for (let i = 0; i < 6; i++) {
          this.spawnEnemy('Zero', playerPos, spawnDist, (i - 2.5) * 180);
        }
      }
    } else {
      if (waveNum === 1) {
        // 4x Bf 109
        for (let i = 0; i < 4; i++) {
          this.spawnEnemy('Bf109', playerPos, spawnDist, i * 150);
        }
      } else if (waveNum === 2) {
        // 3x Ju 87 Stuka + 2x Bf 109
        for (let i = 0; i < 3; i++) {
          this.spawnEnemy('Ju87', playerPos, spawnDist, (i - 1) * 200, 650);
        }
        for (let i = 0; i < 2; i++) {
          this.spawnEnemy('Bf109', playerPos, spawnDist, (i === 0 ? -350 : 350));
        }
      } else if (waveNum === 3) {
        // 5x Bf 109 + 3x Ju 87
        for (let i = 0; i < 5; i++) {
          this.spawnEnemy('Bf109', playerPos, spawnDist, (i - 2) * 180);
        }
        for (let i = 0; i < 3; i++) {
          this.spawnEnemy('Ju87', playerPos, spawnDist + 200, (i - 1) * 250, 700);
        }
      } else {
        // Ace Boss + 5 Escort Bf 109s
        this.spawnEnemy('Ace', playerPos, spawnDist - 200, 0, 550);
        for (let i = 0; i < 5; i++) {
          this.spawnEnemy('Bf109', playerPos, spawnDist, (i - 2) * 220);
        }
      }
    }
  }

  spawnWarships(playerPos) {
    const isJapan = this.selectedMap === 'japan';
    const activeShips = this.ships.filter(s => !s.isDead);
    const toSpawn = Math.max(0, 3 - activeShips.length);
    for (let i = 0; i < toSpawn; i++) {
      const shipMesh = isJapan ? PlaneModels.createJapaneseWarship() : PlaneModels.createKriegsmarineShip();
      const sx = playerPos.x + (i - 1) * 260 + (Math.random() - 0.5) * 100;
      const sz = playerPos.z + 650 + i * 280;
      shipMesh.position.set(sx, 0, sz);
      this.scene.add(shipMesh);
      this.ships.push({
        mesh: shipMesh,
        type: isJapan ? 'IJN' : 'Kriegsmarine',
        health: isJapan ? 260 : 220,
        maxHealth: isJapan ? 260 : 220,
        isDead: false,
        speed: isJapan ? 16 : 14
      });
    }
  }

  spawnEnemy(type, playerPos, baseDist, offsetX = 0, customY = null) {
    let mesh;
    if (type === 'Zero' || type === 'ZeroAce') {
      mesh = PlaneModels.createZero();
      if (type === 'ZeroAce') {
        mesh.scale.set(1.12, 1.12, 1.12);
      }
    } else if (type === 'Ju87') {
      mesh = PlaneModels.createStuka();
    } else {
      mesh = PlaneModels.createBf109();
    }

    const altitude = customY || (playerPos.y + (Math.random() - 0.2) * 200);
    const spawnZ = playerPos.z + baseDist + (Math.random() - 0.5) * 300;
    const spawnX = playerPos.x + offsetX + (Math.random() - 0.5) * 150;

    mesh.position.set(spawnX, altitude, spawnZ);
    mesh.lookAt(playerPos);

    this.scene.add(mesh);
    const entity = new PlaneEntity(mesh, type, true);
    this.enemies.push(entity);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pause-screen').classList.remove('hidden');
      window.soundSystem.stopEngine();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pause-screen').classList.add('hidden');
    }
  }

  gameOver(reason = 'Twój samolot został zestrzelony nad Kanałem La Manche.') {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    window.soundSystem.stopEngine();
    window.soundSystem.playExplosion(true);

    document.getElementById('hud').style.display = 'none';
    const upgScreen = document.getElementById('upgrade-screen');
    if (upgScreen) upgScreen.classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    const reasonEl = document.getElementById('game-over-reason');
    if (reasonEl) reasonEl.textContent = reason;
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-kills').textContent = this.kills;
    document.getElementById('final-wave').textContent = this.wave;
  }

  victory() {
    this.state = 'VICTORY';
    window.soundSystem.stopEngine();
    window.soundSystem.playVictoryBeep();

    document.getElementById('hud').style.display = 'none';
    const upgScreen = document.getElementById('upgrade-screen');
    if (upgScreen) upgScreen.classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');
    document.getElementById('vic-score').textContent = this.score;
    document.getElementById('vic-kills').textContent = this.kills;
  }

  startNextWave(fromVictoryScreen = false) {
    if (fromVictoryScreen) {
      document.getElementById('victory-screen').classList.add('hidden');
      document.getElementById('hud').style.display = 'block';
      this.state = 'PLAYING';
    }

    this.wave++;
    this.startWave(this.wave);
  }

  clearEntities() {
    if (this.player && this.player.mesh) {
      this.scene.remove(this.player.mesh);
      this.player = null;
    }
    this.enemies.forEach(e => this.scene.remove(e.mesh));
    this.enemies = [];
    this.bombers.forEach(b => this.scene.remove(b.mesh));
    this.bombers = [];
    this.ships.forEach(s => this.scene.remove(s.mesh));
    this.ships = [];
    this.particles.cleanup();
  }

  checkWaveCleared() {
    const remainingAlive = this.enemies.filter(e => !e.isDead);
    if (remainingAlive.length === 0 && this.state === 'PLAYING') {
      if (this.wave === 4) {
        setTimeout(() => { if (this.state === 'PLAYING') this.victory(); }, 2000);
      } else {
        setTimeout(() => { if (this.state === 'PLAYING') this.startNextWave(); }, 2500);
      }
    }
  }

  handlePlayerFiring(dt) {
    const coolingFactor = Math.max(0.35, 1.0 - (this.upgrades.cooling - 1) * 0.16);
    const coolRecovery = 0.45 + (this.upgrades.cooling - 1) * 0.15;

    // Gun cooling & firing
    if (this.controls.isFiring() && !this.isOverheated) {
      this.gunHeat = Math.min(1.0, this.gunHeat + 0.35 * coolingFactor * dt);
      if (this.gunHeat >= 1.0) {
        this.isOverheated = true;
      }

      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = 0.085; // ~700 rounds/min

        // Wing guns converge toward aim point 280m ahead along nose vector
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);
        const convergencePoint = this.player.mesh.position.clone().addScaledVector(forward, 280);
        const muzzles = this.player.mesh.userData.gunMuzzles || [];
        const dmgMult = 1 + (this.upgrades.damage - 1) * 0.25;

        muzzles.forEach((localMuzzle) => {
          const worldPos = localMuzzle.clone().applyMatrix4(this.player.mesh.matrixWorld);
          const dir = new THREE.Vector3().subVectors(convergencePoint, worldPos).normalize();
          this.particles.spawnBullet(worldPos, dir, 340, true, this.player);
          const lastBullet = this.particles.bullets[this.particles.bullets.length - 1];
          if (lastBullet) lastBullet.damage = Math.round(25 * dmgMult);
        });

        window.soundSystem.playGunfire(true);
      }
    } else {
      this.fireTimer = 0;
      this.gunHeat = Math.max(0, this.gunHeat - coolRecovery * dt);
      if (this.gunHeat < 0.25) {
        this.isOverheated = false;
      }
    }
  }

  handleCollisions(dt) {
    const bullets = this.particles.bullets;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      const bPos = b.mesh.position;

      if (b.isPlayer) {
        let hitSomething = false;

        // Player bullets hitting enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          if (enemy.isDead) continue;

          const hitRadius = enemy.type === 'Ace' ? 6.8 : 6.5;
          if (bPos.distanceTo(enemy.mesh.position) < hitRadius) {
            this.ui.showHitMarker();
            const wasKilled = enemy.takeDamage(b.damage, bPos, this.particles, window.soundSystem);

            this.scene.remove(b.mesh);
            bullets.splice(i, 1);
            hitSomething = true;

            if (wasKilled) {
              this.kills++;
              const pts = (enemy.type === 'Ace' || enemy.type === 'ZeroAce') ? 1200 : (enemy.type === 'Ju87' ? 450 : 300);
              this.score += pts;

              let praise = '';
              if (enemy.type === 'ZeroAce') {
                praise = '★ AS CESARSKIEJ MARYNARKI WOJENNEJ ZESTRZELONY! ★';
              } else if (enemy.type === 'Zero') {
                praise = 'MITSUBISHI A6M ZERO W PŁOMIENIACH!';
              } else if (enemy.type === 'Ace') {
                praise = '★ AS LUFTWAFFE ZESTRZELONY! ★';
              } else if (enemy.type === 'Ju87') {
                praise = 'SZTUKAS ROZBITY!';
              } else {
                praise = 'MESSERSCHMITT W PŁOMIENIACH!';
              }
              this.ui.showKillAnnouncement(praise);

              this.checkWaveCleared();
            }
            break;
          }
        }

        if (hitSomething) continue;

        // Player bullets hitting Kriegsmarine / IJN warships
        for (let s = this.ships.length - 1; s >= 0; s--) {
          const ship = this.ships[s];
          if (ship.isDead) continue;
          if (bPos.distanceTo(ship.mesh.position) < 18.0) {
            this.ui.showHitMarker();
            ship.health -= b.damage;
            this.particles.createExplosion(bPos, 0.4, true);
            this.scene.remove(b.mesh);
            bullets.splice(i, 1);

            if (ship.health <= 0) {
              ship.isDead = true;
              this.kills++;
              this.score += 600;
              this.particles.createExplosion(ship.mesh.position, 2.5, false);
              window.soundSystem.playExplosion(true);
              const shipPraise = ship.type === 'IJN'
                ? '⚓ OKRĘT FLOTY CESARSKIEJ IJN ZATOPIONY! (+600 PKT)'
                : '⚓ OKRĘT KRIEGSMARINE ZATOPIONY! (+600 PKT)';
              this.ui.showKillAnnouncement(shipPraise);
              this.scene.remove(ship.mesh);
            }
            break;
          }
        }
      } else {
        // Enemy bullets hitting player
        if (this.player && this.player.health > 0) {
          if (bPos.distanceTo(this.player.mesh.position) < 4.0) {
            this.player.health -= b.damage;
            this.ui.flashDamage();
            window.soundSystem.playHitSound();

            this.scene.remove(b.mesh);
            bullets.splice(i, 1);

            if (this.player.health <= 0) {
              this.particles.createExplosion(this.player.mesh.position, 1.8);
              this.gameOver('Twój samolot został zestrzelony w walce powietrznej!');
            }
            continue;
          }
        }

        // Enemy bullets hitting Allied Bombers
        for (let k = 0; k < this.bombers.length; k++) {
          const bomber = this.bombers[k];
          if (bomber.isDead) continue;
          if (bPos.distanceTo(bomber.mesh.position) < 8.0) {
            bomber.takeDamage(b.damage, bPos, this.particles, window.soundSystem);
            this.scene.remove(b.mesh);
            bullets.splice(i, 1);
            break;
          }
        }
      }
    }

    // Handle dropped bombs (water impact, ship impact, or mid-air proximity detonation)
    const bombs = this.particles.bombs;
    for (let i = bombs.length - 1; i >= 0; i--) {
      const bomb = bombs[i];
      const bPos = bomb.mesh.position;
      let detonate = false;

      // Water surface impact
      if (bPos.y <= 3.5) {
        detonate = true;
      }

      // Direct hit on warship
      if (!detonate) {
        for (let s = 0; s < this.ships.length; s++) {
          const ship = this.ships[s];
          if (!ship.isDead && bPos.distanceTo(ship.mesh.position) < 24.0) {
            detonate = true;
            break;
          }
        }
      }

      // Direct hit on enemy aircraft
      if (!detonate) {
        for (let j = 0; j < this.enemies.length; j++) {
          const enemy = this.enemies[j];
          if (!enemy.isDead && bPos.distanceTo(enemy.mesh.position) < 16.0) {
            detonate = true;
            break;
          }
        }
      }

      if (detonate) {
        if (bomb.isNuclear) {
          this.particles.createNuclearExplosion(bPos);
          window.soundSystem.playNuclearDetonation();
          this.nukeShakeTimer = 2.5;
          this.nukeShakeIntensity = 22.0;
        } else {
          this.particles.createExplosion(bPos, 2.8, false);
          window.soundSystem.playExplosion(true);
        }

        let killedAny = false;

        // Blast radius damage to warships
        for (let s = this.ships.length - 1; s >= 0; s--) {
          const ship = this.ships[s];
          if (ship.isDead) continue;
          const d = bPos.distanceTo(ship.mesh.position);
          if (d <= bomb.blastRadius) {
            ship.health -= bomb.damage;
            this.ui.showHitMarker();
            if (ship.health <= 0) {
              ship.isDead = true;
              this.kills++;
              this.score += 600;
              this.particles.createExplosion(ship.mesh.position, 2.5, false);
              const shipKillText = bomb.isNuclear
                ? '☢️ OKRĘT CAŁKOWICIE ZMIECIONY UDERZENIEM ATOMOWYM! (+600 PKT)'
                : (ship.type === 'IJN' ? '💣 OKRĘT IJN ZATOPIONY BOMBĄ! (+600 PKT)' : '💣 OKRĘT KRIEGSMARINE ZATOPIONY BOMBĄ! (+600 PKT)');
              this.ui.showKillAnnouncement(shipKillText);
              this.scene.remove(ship.mesh);
            }
          }
        }

        // Blast radius damage to enemy planes
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          if (enemy.isDead) continue;
          const d = bPos.distanceTo(enemy.mesh.position);
          if (d <= bomb.blastRadius) {
            this.ui.showHitMarker();
            const wasKilled = enemy.takeDamage(bomb.damage, enemy.mesh.position, this.particles, window.soundSystem);
            if (wasKilled) {
              this.kills++;
              const pts = (enemy.type === 'Ace' || enemy.type === 'ZeroAce') ? 1200 : (enemy.type === 'Ju87' ? 450 : 300);
              this.score += pts + 150; // Bonus for bomb kill
              killedAny = true;
            }
          }
        }

        if (bomb.isNuclear) {
          this.score += 3000;
          this.ui.showKillAnnouncement('☢️ POTĘŻNA EKSPLOZJA ATOMOWA B-29! OBSZAR ZMIECIONY! (+3000 PKT)');
          this.checkWaveCleared();
        } else if (killedAny) {
          this.ui.showKillAnnouncement('💣 CEL ZNISZCZONY EKSPLOZJĄ BOMBY! (+BONUS)');
          this.checkWaveCleared();
        }

        this.scene.remove(bomb.mesh);
        bombs.splice(i, 1);
      }
    }
  }

  // Automatic defensive turret fire when flying B-17G or B-29 Superfortress
  handleB17Turrets(dt) {
    if (!this.player || (this.player.type !== 'B17' && this.player.type !== 'B29') || !this.player.mesh) return;
    const turretMounts = this.player.mesh.userData.turretMounts;
    if (!turretMounts || this.enemies.length === 0) return;

    this.turretTimer -= dt;
    if (this.turretTimer > 0) return;
    this.turretTimer = 0.22;

    let firedAny = false;
    const dmgMult = 1 + (this.upgrades.damage - 1) * 0.25;

    turretMounts.forEach((localMount) => {
      const mountWorld = localMount.clone().applyMatrix4(this.player.mesh.matrixWorld);
      let closestEnemy = null;
      let minDist = 380;

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.isDead) continue;
        const d = mountWorld.distanceTo(e.mesh.position);
        if (d < minDist) {
          minDist = d;
          closestEnemy = e;
        }
      }

      if (closestEnemy) {
        const enemyForward = new THREE.Vector3(0, 0, 1).applyQuaternion(closestEnemy.mesh.quaternion);
        const timeToHit = minDist / 340;
        const leadTarget = closestEnemy.mesh.position.clone().addScaledVector(enemyForward, closestEnemy.speed * timeToHit * 0.85);
        const dir = new THREE.Vector3().subVectors(leadTarget, mountWorld).normalize();
        this.particles.spawnBullet(mountWorld, dir, 340, true, this.player);
        const lastBullet = this.particles.bullets[this.particles.bullets.length - 1];
        if (lastBullet) lastBullet.damage = Math.round(25 * dmgMult);
        firedAny = true;
      }
    });

    if (firedAny && Math.random() > 0.5) {
      window.soundSystem.playGunfire(false);
    }
  }

  updateCamera() {
    if (!this.player || !this.player.mesh) return;

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);

    if (this.controls.cameraMode === 'cockpit') {
      // First person cockpit view looking forward (+Z)
      const localEye = this.player.mesh.userData.cockpitPos || new THREE.Vector3(0, 0.65, 0.25);
      const eyePos = localEye.clone().applyMatrix4(this.player.mesh.matrixWorld);
      const upVec = new THREE.Vector3(0, 1, 0).applyQuaternion(this.player.mesh.quaternion);

      this.camera.position.copy(eyePos);
      this.camera.up.copy(upVec);
      this.camera.lookAt(eyePos.clone().addScaledVector(forward, 200));
    } else {
      // Stabilized third-person chase camera (follows yaw & pitch, with gentle 25% roll bank)
      const camEuler = new THREE.Euler(
        this.controls.pitch,
        this.controls.yaw,
        this.controls.roll * 0.25,
        'YXZ'
      );
      const camQuat = new THREE.Quaternion().setFromEuler(camEuler);

      const baseOffset = this.player.mesh.userData.chaseOffset || new THREE.Vector3(0, 2.3, -9.2);
      const offset = baseOffset.clone().applyQuaternion(camQuat);
      const targetCamPos = this.player.mesh.position.clone().add(offset);

      this.camera.position.lerp(targetCamPos, 0.35);
      this.camera.up.set(0, 1, 0).applyQuaternion(camQuat);

      // Look directly at the gun convergence point ahead of the nose
      const targetLook = this.player.mesh.position.clone().addScaledVector(forward, 280);
      this.camera.lookAt(targetLook);
    }
  }

  animate(now) {
    requestAnimationFrame(this.animate);
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.state === 'PLAYING') {
      // 1. Controls & Player update
      this.controls.update(dt, true);

      // Check water crash (touching the water surface = instant Game Over)
      if (this.player && this.player.mesh && this.player.mesh.position.y <= 4.5) {
        this.particles.createExplosion(this.player.mesh.position, 2.4, false);
        this.gameOver('Twój samolot uderzył w taflę wody i zatonął!');
        this.renderer.render(this.scene, this.camera);
        return;
      }

      // Auto-reload bombs over time
      if (this.bombsAmmo < this.maxBombs) {
        this.bombReloadTimer += dt;
        const reloadInterval = Math.max(2.2, 4.5 - (this.upgrades.bombs - 1) * 0.5);
        if (this.bombReloadTimer >= reloadInterval) {
          this.bombReloadTimer = 0;
          this.bombsAmmo++;
        }
      } else {
        this.bombReloadTimer = 0;
      }

      // Update 3D bomb sight indicator on the water
      this.particles.updateBombSight(
        this.player.mesh.position,
        this.player.mesh.userData.velocity
      );

      this.handlePlayerFiring(dt);
      this.handleB17Turrets(dt);

      // Spin player propeller(s)
      const propSpeed = (30 + this.controls.throttle * 40) * dt;
      if (this.player.mesh.userData.propeller) {
        this.player.mesh.userData.propeller.rotation.z += propSpeed;
      }
      if (this.player.mesh.userData.propellers) {
        this.player.mesh.userData.propellers.forEach(p => {
          p.rotation.z += propSpeed;
        });
      }

      // Update Engine audio
      window.soundSystem.updateEngine(this.controls.throttle, this.controls.isBoosting);

      // 2. Update AI enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const keep = this.enemies[i].update(dt, this.player, this.bombers, this.particles, window.soundSystem);
        if (!keep) {
          this.scene.remove(this.enemies[i].mesh);
          this.enemies.splice(i, 1);
        }
      }

      // 3. Update Allied Bombers & Warships
      for (let i = this.bombers.length - 1; i >= 0; i--) {
        const keep = this.bombers[i].update(dt, this.player, this.bombers, this.particles, window.soundSystem);
        if (!keep) {
          this.scene.remove(this.bombers[i].mesh);
          this.bombers.splice(i, 1);
        }
      }
      for (let i = 0; i < this.ships.length; i++) {
        const ship = this.ships[i];
        if (!ship.isDead) {
          ship.mesh.position.z += ship.speed * dt;
        }
      }

      // 4. Update Particles, Bullets & Bombs
      this.particles.update(dt);

      // 5. Check Collisions
      this.handleCollisions(dt);

      // 6. Update Environment & Sky
      this.world.update(dt, this.player.mesh.position);

      // 7. Update HUD & UI
      const isNuke = this.player.type === 'B29';
      const bombsText = isNuke ? `☢️ ${this.bombsAmmo} / ${this.maxBombs}` : `${this.bombsAmmo} / ${this.maxBombs}`;
      const theaterText = this.selectedMap === 'japan' ? 'JAPONIA 1945' : 'ANGLIA 1940';
      this.ui.update(
        this.player,
        this.controls,
        this.enemies,
        this.bombers,
        this.camera,
        this.score,
        this.wave,
        this.kills,
        this.gunHeat,
        bombsText,
        this.ships,
        theaterText
      );

      // 8. Update Camera
      this.updateCamera();

      // 9. Camera Screen Shake (from Atomic Detonation)
      if (this.nukeShakeTimer > 0) {
        this.nukeShakeTimer -= dt;
        const shake = this.nukeShakeIntensity * Math.min(1.0, this.nukeShakeTimer / 1.5);
        this.camera.position.x += (Math.random() - 0.5) * shake;
        this.camera.position.y += (Math.random() - 0.5) * shake;
        this.camera.position.z += (Math.random() - 0.5) * shake;
        this.nukeShakeIntensity *= 0.95;
      }
    } else {
      // Idle slow camera rotation in menu
      if (this.state === 'MENU') {
        const t = now * 0.0003;
        this.camera.position.set(Math.sin(t) * 200, 120, Math.cos(t) * 200);
        this.camera.lookAt(0, 80, 0);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new AirCombatGame();
});

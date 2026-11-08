// js/game.js - Core Arcade Logic, Waves, Collisions & Sega Game Loop

class SpaceRaceGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new RetroAudio();
        this.earth = new OrbitalEarth();
        this.particles = new ParticleSystem();

        // Dimensions
        this.width = 680;
        this.height = 640;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Game States: 'TITLE', 'PLAYING', 'STAGE_CLEAR', 'GAME_OVER'
        this.state = 'TITLE';

        // High Score
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('space_race_high_score') || '10000', 10);
        this.stage = 1;

        // Player
        this.player = new SpaceShuttle(this.width / 2, this.height - 70);

        // Entities
        this.invaders = [];
        this.starlinks = [];
        this.playerBolts = [];
        this.enemyBolts = [];
        this.upgrades = [];
        this.serviceStation = null;

        // Wave & Formation Motion
        this.invaderOffsetX = 0;
        this.invaderOffsetY = 0;
        this.invaderDir = 1; // 1 = right, -1 = left
        this.invaderSpeed = 35;
        this.invaderDropStep = 18;
        this.starlinkTimer = 2.0;

        // Timers & Triggers
        this.serviceStationTimer = 35.0; // Service station appears periodically
        this.upgradeTimer = 18.0;
        this.bannerText = "";
        this.bannerTimer = 0;
        this.screenShake = 0;
        this.lastTime = 0;

        // Input
        this.keys = {};
        this.setupInputs();

        // Start animation loop
        requestAnimationFrame((t) => this.loop(t));
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Audio context start on first user interaction
            this.audio.init();

            if (e.code === 'KeyM') {
                const muted = this.audio.toggleMute();
                this.showBanner(muted ? "AUDIO MUTED" : "AUDIO ENABLED", 1.5);
            }

            if (this.state === 'TITLE') {
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.startGame();
                }
            } else if (this.state === 'GAME_OVER') {
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.restartGame();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch & Virtual Control bindings
        const bindBtn = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const start = (e) => { e.preventDefault(); this.keys[key] = true; this.audio.init(); };
            const end = (e) => { e.preventDefault(); this.keys[key] = false; };
            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };

        bindBtn('btnLeft', 'ArrowLeft');
        bindBtn('btnRight', 'ArrowRight');
        bindBtn('btnFire', 'Space');
        bindBtn('btnStart', 'Enter');
    }

    startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.stage = 1;
        this.player = new SpaceShuttle(this.width / 2, this.height - 70);
        this.earth.setStage(1);
        this.initWave(1);
        this.audio.startBGM();
        this.audio.speak("Space Shuttle Atlantis ready. Earth orbit defense operational.");
        this.showBanner("STAGE 1: AMERICAS ORBIT - DEFEND THE SHUTTLE!", 3.0);
    }

    restartGame() {
        this.startGame();
    }

    initWave(stageNum) {
        this.invaders = [];
        this.starlinks = [];
        this.playerBolts = [];
        this.enemyBolts = [];
        this.upgrades = [];
        this.serviceStation = null;
        this.serviceStationTimer = 45.0 + Math.random() * 15; // Service station is now a rare, meaningful event

        this.invaderOffsetX = 0;
        this.invaderOffsetY = 0;
        this.invaderDir = 1;
        // Speeds up slightly per stage
        this.invaderSpeed = 35 + (stageNum - 1) * 8;

        const cols = 6;
        const rows = 4;
        const colSpacing = 72;
        const rowSpacing = 50;
        const startX = (this.width - (cols - 1) * colSpacing) / 2;
        const startY = 62;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * colSpacing;
                const y = startY + r * rowSpacing;

                if (r < 2) {
                    // Top 2 rows: SpaceX Starships
                    this.invaders.push(new StarshipInvader(x, y, r, c));
                } else {
                    // Bottom 2 rows: Falcon Heavies (Triple core rockets)
                    this.invaders.push(new FalconHeavyInvader(x, y, r, c));
                }
            }
        }
    }

    showBanner(text, duration = 2.5) {
        this.bannerText = text;
        this.bannerTimer = duration;
    }

    handlePlayerFiring() {
        if (!this.keys['Space'] && !this.keys['ArrowUp'] && !this.keys['KeyZ']) return;
        if (this.player.fireCooldown > 0) return;

        this.player.fireCooldown = this.player.fireRate;
        const px = this.player.x;
        const py = this.player.y - 30;
        const lvl = this.player.weaponLevel;

        this.audio.playLaser(lvl);

        if (lvl === 1) {
            // Single Cannon
            this.playerBolts.push(new PlasmaBolt(px, py, 0, -600, 1));
        } else if (lvl === 2) {
            // Dual Wing Cannons (focused slightly inwards for precision)
            this.playerBolts.push(new PlasmaBolt(px - 14, py + 12, 0, -610, 2));
            this.playerBolts.push(new PlasmaBolt(px + 14, py + 12, 0, -610, 2));
        } else if (lvl === 3) {
            // Triple Spread Cannon (moderate fan angle)
            this.playerBolts.push(new PlasmaBolt(px, py - 4, 0, -630, 3));
            this.playerBolts.push(new PlasmaBolt(px - 12, py + 8, -60, -610, 3));
            this.playerBolts.push(new PlasmaBolt(px + 12, py + 8, 60, -610, 3));
        } else {
            // Burst Cannon (alternating 3-bolt tight stream instead of overwhelming screen clear)
            const side = (Math.floor(performance.now() / 100) % 2 === 0) ? -1 : 1;
            this.playerBolts.push(new PlasmaBolt(px, py - 6, 0, -670, 4));
            this.playerBolts.push(new PlasmaBolt(px + side * 15, py + 4, side * 35, -650, 4));
        }
    }

    triggerStarlinkLaunch() {
        if (this.invaders.length === 0) return;

        // Cap maximum simultaneous active starlinks on screen to prevent bullet hell overload
        const maxOnScreen = this.invaders.length <= 4 ? 2 : (this.invaders.length <= 8 ? 4 : 6);
        if (this.starlinks.length >= maxOnScreen) return;

        // When only a few enemies remain, only launch 1 at a time to prevent spam
        const numShooters = (this.invaders.length > 8 && Math.random() < 0.25) ? 2 : 1;

        for (let i = 0; i < numShooters; i++) {
            const shooter = this.invaders[Math.floor(Math.random() * this.invaders.length)];
            this.audio.playStarlinkLaunch();

            // Variety of tricky behaviors: homing towards shuttle, weaving S-curve, fast swoop dive, or aimed vector
            const behaviors = ['homing', 'weave', 'swoop', 'direct'];
            const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];

            // Target vector toward player
            const dx = this.player.x - shooter.x;
            const initVx = behavior === 'direct' ? (dx * 0.35 + (Math.random() - 0.5) * 30) : (Math.random() - 0.5) * 50;
            const initVy = 190 + this.stage * 15 + Math.random() * 30;

            this.starlinks.push(new StarlinkSatellite(
                shooter.x,
                shooter.y + 20,
                initVx,
                initVy,
                behavior,
                this.player.x
            ));
        }
    }

    spawnServiceStation() {
        if (!this.serviceStation) {
            this.serviceStation = new OrbitalServiceStation(this.width);
            this.audio.playAlarm();
            this.audio.speak("Service station approaching. Align shuttle to dock for repair.");
            this.showBanner("SERVICE DOCK DETECTED - FLY UNDER DOCK FOR REPAIR!", 4.0);
        }
    }

    update(dt) {
        // Cap dt to prevent frame jump glitches
        dt = Math.min(dt, 0.05);

        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * 25);
        }
        if (this.bannerTimer > 0) {
            this.bannerTimer -= dt;
        }

        // Earth Background update
        this.earth.update(dt);
        this.particles.update(dt);

        if (this.state !== 'PLAYING') return;

        // 1. Player Movement & Input
        let moveDir = 0;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveDir -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) moveDir += 1;

        this.player.vx = moveDir * this.player.speed;
        this.player.rcsLeft = moveDir < 0;
        this.player.rcsRight = moveDir > 0;
        this.player.update(dt, this.width);

        this.handlePlayerFiring();

        // 2. Invader Wave Movement (Space Invaders march)
        this.invaderOffsetX += this.invaderDir * this.invaderSpeed * dt;

        // Find boundary bounds of remaining invaders
        let minX = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        this.invaders.forEach(inv => {
            inv.update(dt, this.invaderOffsetX, this.invaderOffsetY);
            if (inv.x < minX) minX = inv.x;
            if (inv.x > maxX) maxX = inv.x;
            if (inv.y > maxY) maxY = inv.y;
        });

        // Bounce at canvas borders & descend
        const pad = 35;
        if (maxX > this.width - pad && this.invaderDir > 0) {
            this.invaderDir = -1;
            this.invaderOffsetY += this.invaderDropStep;
            this.invaderSpeed *= 1.04; // Speed up as wave drops
        } else if (minX < pad && this.invaderDir < 0) {
            this.invaderDir = 1;
            this.invaderOffsetY += this.invaderDropStep;
            this.invaderSpeed *= 1.04;
        }

        // Invaders reached player altitude -> Instant hull loss
        if (maxY >= this.player.y - 30) {
            this.playerDied("ORBITAL INVASION OVERRUN");
            return;
        }

        // 3. Starlink Launch Cycle (Balanced pacing with fair delays when few enemies remain)
        this.starlinkTimer -= dt;
        if (this.starlinkTimer <= 0) {
            this.triggerStarlinkLaunch();
            
            // Limit max active starlinks on screen so few remaining ships never flood the player
            if (this.invaders.length <= 6) {
                // Fair pacing when down to the last few starships
                this.starlinkTimer = 1.3 + Math.random() * 0.9;
            } else if (this.invaders.length <= 12) {
                this.starlinkTimer = 0.9 + Math.random() * 0.6;
            } else {
                this.starlinkTimer = 0.65 + Math.random() * 0.55;
            }
        }

        // 4. Service Station Spawn Cycle (Rare event)
        this.serviceStationTimer -= dt;
        if (this.serviceStationTimer <= 0) {
            this.spawnServiceStation();
            this.serviceStationTimer = 65.0 + Math.random() * 25; // Reset to 65-90 seconds
        }

        // Update Service Station & Docking Mechanics
        if (this.serviceStation) {
            this.serviceStation.update(dt);

            // Check if player is positioned in the docking tractor beam
            // Beam corridor: station.x - 35 to station.x + 35
            const inCorridor = Math.abs(this.player.x - this.serviceStation.x) < 42;
            if (inCorridor && !this.serviceStation.hasRepaired) {
                // Docking repair trigger!
                const repaired = this.player.repair(1); // Restores 1/3 hull life
                this.serviceStation.hasRepaired = true;
                this.audio.playDockingRepair();
                this.audio.speak("Service dock active. Shuttle heat shield tiles restored.");
                this.showBanner(repaired ? "DOCKING COMPLETE: HULL REPAIRED! +500 PTS" : "SERVICE DOCK: SYSTEMS NOMINAL! +500 PTS", 3.0);
                this.score += 500;
                this.particles.createExplosion(this.player.x, this.player.y - 20, "#22c55e", 25);
            }

            if (!this.serviceStation.active) {
                this.serviceStation = null;
            }
        }

        // 5. Update Starlinks
        for (let i = this.starlinks.length - 1; i >= 0; i--) {
            const sl = this.starlinks[i];
            sl.update(dt, this.player.x);

            // Contact with Player Space Shuttle: Takes 1/3 of life!
            const distToPlayer = Math.hypot(sl.x - this.player.x, sl.y - this.player.y);
            if (distToPlayer < 32) {
                this.starlinks.splice(i, 1);
                this.particles.createExplosion(sl.x, sl.y, "#ef4444", 30);
                this.audio.playImpact();
                this.audio.playExplosion(false);
                this.screenShake = 12;

                const damaged = this.player.takeDamage();
                if (damaged) {
                    if (this.player.health <= 0) {
                        this.playerDied("STARLINK COLLISION: HULL BREACH");
                        return;
                    } else {
                        this.audio.playAlarm();
                        this.showBanner(`WARNING! STARLINK HIT! HULL INTEGRITY: ${this.player.health}/3`, 2.0);
                    }
                }
                continue;
            }

            // Remove off-screen
            if (sl.y > this.height + 40) {
                this.starlinks.splice(i, 1);
            }
        }

        // 6. Update Player Bolts & Invader Collisions
        for (let b = this.playerBolts.length - 1; b >= 0; b--) {
            const bolt = this.playerBolts[b];
            bolt.update(dt);
            if (!bolt.active) {
                this.playerBolts.splice(b, 1);
                continue;
            }

            // Check collision with Starlinks
            let boltConsumed = false;
            for (let s = this.starlinks.length - 1; s >= 0; s--) {
                const sl = this.starlinks[s];
                if (Math.hypot(bolt.x - sl.x, bolt.y - sl.y) < 18) {
                    this.particles.createExplosion(sl.x, sl.y, "#00f0ff", 18);
                    this.audio.playExplosion(false);
                    this.score += sl.points;
                    this.starlinks.splice(s, 1);
                    boltConsumed = true;
                    break;
                }
            }
            if (boltConsumed) {
                this.playerBolts.splice(b, 1);
                continue;
            }

            // Check collision with Invaders (Starships & Falcon Heavies)
            for (let invIdx = this.invaders.length - 1; invIdx >= 0; invIdx--) {
                const inv = this.invaders[invIdx];
                if (Math.abs(bolt.x - inv.x) < inv.width / 2 + 6 && Math.abs(bolt.y - inv.y) < inv.height / 2 + 4) {
                    inv.health -= 1; // Balanced 1 damage per hit across all weapons
                    this.particles.createExplosion(bolt.x, bolt.y, "#ffffff", 8);
                    this.audio.playImpact();
                    boltConsumed = true;

                    if (inv.health <= 0) {
                        // Destroyed Invader!
                        this.particles.createExplosion(inv.x, inv.y, inv.type === 'falcon_heavy' ? '#f97316' : '#a855f7', 40);
                        this.audio.playExplosion(true);
                        this.score += inv.points;
                        this.screenShake = 6;

                        // Upgrade drop chance (8% total, repair only if health is damaged)
                        if (Math.random() < 0.12) {
                            let uType = 'weapon';
                            if (this.player.health < this.player.maxHealth && Math.random() < 0.3) {
                                uType = 'repair'; // Rare repair pod
                            }
                            this.upgrades.push(new UpgradeCapsule(inv.x, inv.y, uType));
                        }

                        this.invaders.splice(invIdx, 1);
                    }
                    break;
                }
            }
            if (boltConsumed) {
                this.playerBolts.splice(b, 1);
            }
        }

        // 7. Update Upgrade Pickups
        for (let u = this.upgrades.length - 1; u >= 0; u--) {
            const up = this.upgrades[u];
            up.update(dt);
            if (!up.active) {
                this.upgrades.splice(u, 1);
                continue;
            }

            // Check Player Collect
            if (Math.hypot(up.x - this.player.x, up.y - this.player.y) < 28) {
                this.audio.playUpgrade();
                if (up.type === 'weapon') {
                    this.player.upgradeWeapon();
                    const wNames = ["SINGLE PLASMA", "DUAL PLASMA", "TRIPLE SPREAD", "BURST HYPER CANNON"];
                    this.showBanner(`WEAPON UPGRADED: ${wNames[this.player.weaponLevel - 1]}!`, 2.5);
                    this.audio.speak(wNames[this.player.weaponLevel - 1] + " online.");
                } else {
                    this.player.repair(1);
                    this.showBanner("EMERGENCY REPAIR APPLIED: +1 HULL", 2.0);
                }
                this.score += 200;
                this.particles.createExplosion(up.x, up.y, "#06b6d4", 25);
                this.upgrades.splice(u, 1);
            }
        }

        // 8. Wave Clear -> Next Stage
        if (this.invaders.length === 0) {
            this.stageCleared();
        }

        // High score sync
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('space_race_high_score', this.highScore.toString());
        }
    }

    stageCleared() {
        this.state = 'STAGE_CLEAR';
        this.audio.playStageClear();
        this.audio.speak(`Stage ${this.stage} completed. Orbital repositioning.`);
        this.showBanner(`STAGE ${this.stage} CLEARED! +1000 PTS`, 3.5);
        this.score += 1000;

        setTimeout(() => {
            this.stage++;
            this.earth.setStage(this.stage);
            // Full heal on stage clear
            this.player.health = this.player.maxHealth;
            this.initWave(this.stage);
            this.state = 'PLAYING';
            const stageInfo = this.earth.stages[((this.stage - 1) % 5) + 1];
            this.showBanner(`${stageInfo.name}`, 3.0);
        }, 3000);
    }

    playerDied(reason) {
        this.player.lives--;
        this.particles.createExplosion(this.player.x, this.player.y, "#ef4444", 60);
        this.audio.playExplosion(true);
        this.screenShake = 22;

        if (this.player.lives > 0) {
            // Respawn with full health, reset weapon down 1 level
            this.player.health = this.player.maxHealth;
            this.player.x = this.width / 2;
            this.player.invulnerableTimer = 2.5;
            this.player.weaponLevel = Math.max(1, this.player.weaponLevel - 1);
            this.showBanner(`${reason}! LIVES REMAINING: ${this.player.lives}`, 2.5);
            this.audio.speak("Shuttle emergency restart. Deflector shields restored.");
        } else {
            // Game Over
            this.state = 'GAME_OVER';
            this.audio.stopBGM();
            this.audio.playGameOver();
            this.audio.speak("Mission failure. Space Shuttle lost in orbit.");
        }
    }

    render() {
        this.ctx.save();

        // Apply screen shake
        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.screenShake;
            const sy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(sx, sy);
        }

        // 1. Render Earth Globe & Starfield
        this.earth.render(this.ctx, this.width, this.height);

        // 2. Render Service Station
        if (this.serviceStation && this.serviceStation.active) {
            this.serviceStation.render(this.ctx);
        }

        // 3. Render Invaders
        this.invaders.forEach(inv => inv.render(this.ctx));

        // 4. Render Starlinks
        this.starlinks.forEach(sl => sl.render(this.ctx));

        // 5. Render Upgrades
        this.upgrades.forEach(up => up.render(this.ctx));

        // 6. Render Player Bolts
        this.playerBolts.forEach(bolt => bolt.render(this.ctx));

        // 7. Render Player Space Shuttle
        if (this.state === 'PLAYING' || this.state === 'STAGE_CLEAR') {
            this.player.render(this.ctx);
        }

        // 8. Render Particles & Shockwaves
        this.particles.render(this.ctx);

        // 9. Retro Sega Arcade HUD Overlays
        this.renderHUD();

        // 10. Title / Game Over / Banners
        if (this.state === 'TITLE') {
            this.renderTitleScreen();
        } else if (this.state === 'GAME_OVER') {
            this.renderGameOverScreen();
        }

        if (this.bannerTimer > 0) {
            this.renderBanner();
        }

        this.ctx.restore();
    }

    renderHUD() {
        const ctx = this.ctx;
        ctx.save();

        // Sega Arcade Header Bar
        ctx.font = "bold 13px 'Courier New', monospace";
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("1UP", 24, 26);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(this.score.toString().padStart(6, '0'), 24, 44);

        ctx.fillStyle = "#eab308";
        ctx.fillText("HIGH SCORE", this.width / 2 - 40, 26);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(this.highScore.toString().padStart(6, '0'), this.width / 2 - 25, 44);

        ctx.fillStyle = "#a855f7";
        ctx.fillText(`STAGE ${this.stage}`, this.width - 90, 26);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("SEGA-1981", this.width - 90, 44);

        // Earth Orbit Coordinates Subtitle
        const curStageData = this.earth.stages[((this.stage - 1) % 5) + 1];
        ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(curStageData ? curStageData.subtitle : "LOW EARTH ORBIT", this.width / 2, 62);

        // Bottom Bar: Space Shuttle Life / Shield Status
        const botY = this.height - 24;

        // Health Visualizer (3 HP, each Starlink hit takes 1/3)
        ctx.textAlign = "left";
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("SHUTTLE HULL:", 24, botY);

        // 3 Distinct Hull Bars
        for (let i = 0; i < 3; i++) {
            const bx = 120 + i * 28;
            const by = botY - 10;
            const isFilled = i < this.player.health;

            let col = "#22c55e"; // Green 3/3
            if (this.player.health === 2) col = "#eab308"; // Yellow 2/3
            if (this.player.health === 1) col = (Math.floor(performance.now() / 200) % 2 === 0) ? "#ef4444" : "#7f1d1d"; // Flashing Red 1/3

            ctx.fillStyle = isFilled ? col : "#1e293b";
            ctx.fillRect(bx, by, 24, 11);
            ctx.strokeStyle = "#475569";
            ctx.strokeRect(bx, by, 24, 11);
        }

        // Percentage text
        const pct = Math.round((this.player.health / 3) * 100);
        ctx.fillStyle = this.player.health === 1 ? "#ef4444" : (this.player.health === 2 ? "#eab308" : "#22c55e");
        ctx.fillText(`${pct}%`, 215, botY);

        // Weapon Status
        const wNames = ["SINGLE PLASMA", "DUAL CANNONS", "TRIPLE SPREAD", "BURST HYPER"];
        ctx.fillStyle = "#38bdf8";
        ctx.textAlign = "center";
        ctx.fillText(`WEAPON: ${wNames[this.player.weaponLevel - 1]}`, this.width / 2 + 60, botY);

        // Remaining Shuttle Lives (Mini Shuttles)
        ctx.textAlign = "right";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText("SHUTTLES:", this.width - 70, botY);
        for (let l = 0; l < this.player.lives; l++) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            const lx = this.width - 55 + l * 16;
            const ly = botY - 4;
            ctx.moveTo(lx, ly - 6);
            ctx.lineTo(lx + 4, ly + 4);
            ctx.lineTo(lx - 4, ly + 4);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    renderBanner() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
        ctx.fillRect(0, this.height * 0.42, this.width, 48);

        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, this.height * 0.42, this.width, 48);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.bannerText, this.width / 2, this.height * 0.42 + 24);
        ctx.restore();
    }

    renderTitleScreen() {
        const ctx = this.ctx;
        ctx.save();
        const time = performance.now() * 0.001;

        // Overlay vignette
        ctx.fillStyle = "rgba(2, 6, 23, 0.75)";
        ctx.fillRect(0, 0, this.width, this.height);

        // Sega Arcade Marquee Title
        ctx.textAlign = "center";
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 12px monospace";
        ctx.fillText("★ SEGA HISTORICAL ORBITAL SIMULATOR ★", this.width / 2, 75);

        // Main Title Neon Gradient
        const titleGrad = ctx.createLinearGradient(0, 95, 0, 155);
        titleGrad.addColorStop(0, "#ffffff");
        titleGrad.addColorStop(0.3, "#38bdf8");
        titleGrad.addColorStop(0.7, "#818cf8");
        titleGrad.addColorStop(1, "#c084fc");

        ctx.fillStyle = titleGrad;
        ctx.font = "bold 38px 'Impact', sans-serif";
        ctx.fillText("SPACE RACE", this.width / 2, 130);

        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 14px 'Courier New', monospace";
        ctx.fillText("ORBITAL SHUTTLE DEFENSE", this.width / 2, 155);

        // Historical Lore Box
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        const boxW = 540;
        const boxH = 240;
        const boxX = (this.width - boxW) / 2;
        const boxY = 175;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.textAlign = "left";
        ctx.fillStyle = "#93c5fd";
        ctx.font = "bold 11px monospace";
        ctx.fillText("[ MISSION BRIEFING ]", boxX + 16, boxY + 24);

        ctx.fillStyle = "#f8fafc";
        ctx.font = "11px monospace";
        const lines = [
            "PILOT: NASA Space Shuttle Orbiter Atlantis",
            "THEATRE: Low Earth Orbit (LEO)",
            "",
            "HOSTILES: SpaceX Starships & Falcon Heavy Boosters",
            "THREAT: Rapid deployment of evasive Starlink swarms!",
            "",
            "DAMAGE RULES: Starlink collision takes 1/3 HULL LIFE",
            "UPGRADES: Collect weapon pods (Dual, Triple, Burst)",
            "MAINTENANCE: Orbital Service Station appears periodically",
            "             Fly into the green dock corridor for REPAIRS!"
        ];
        lines.forEach((l, idx) => {
            ctx.fillText(l, boxX + 16, boxY + 46 + idx * 17);
        });

        // Insert Coin / Start prompt
        if (Math.sin(time * 5) > 0) {
            ctx.textAlign = "center";
            ctx.fillStyle = "#eab308";
            ctx.font = "bold 16px 'Courier New', monospace";
            ctx.fillText("INSERT COIN - PRESS SPACE / START", this.width / 2, 465);
        }

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px monospace";
        ctx.fillText("CONTROLS: [←/→] or [A/D] Move | [SPACE] Fire Plasma", this.width / 2, 510);
        ctx.fillText("[M] Toggle FM Chiptune Synth Music & SFX", this.width / 2, 532);

        ctx.restore();
    }

    renderGameOverScreen() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.textAlign = "center";
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 38px 'Impact', sans-serif";
        ctx.fillText("GAME OVER", this.width / 2, 200);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px monospace";
        ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, 250);
        ctx.fillText(`STAGE REACHED: ${this.stage}`, this.width / 2, 280);

        if (this.score >= this.highScore) {
            ctx.fillStyle = "#fbbf24";
            ctx.fillText("★ NEW ORBITAL HIGH SCORE RECORD! ★", this.width / 2, 320);
        }

        if (Math.floor(performance.now() / 400) % 2 === 0) {
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 16px 'Courier New', monospace";
            ctx.fillText("PRESS SPACE OR ENTER TO RESTART", this.width / 2, 390);
        }
        ctx.restore();
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Instantiate once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new SpaceRaceGame();
});

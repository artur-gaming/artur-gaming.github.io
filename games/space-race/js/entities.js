// js/entities.js - Sprites and Game Entities for Space Race

// --- Space Shuttle Player ---
class SpaceShuttle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 46;
        this.height = 68;
        this.speed = 240; // Reduced from 340 for realistic, deliberate orbital maneuverability
        this.vx = 0;
        this.health = 3; // 3/3 = 100%, 2/3, 1/3, 0 = destroyed (Each Starlink hit takes 1/3)
        this.maxHealth = 3;
        this.lives = 3;
        this.weaponLevel = 1; // 1: Single, 2: Double, 3: Triple, 4: Burst
        this.fireCooldown = 0;
        this.fireRate = 0.22; // Seconds between shots
        this.invulnerableTimer = 0;
        this.rcsLeft = false;
        this.rcsRight = false;
        this.flameFlicker = 0;
    }

    takeDamage() {
        if (this.invulnerableTimer > 0) return false;
        this.health -= 1; // Exactly 1/3 of life lost
        this.invulnerableTimer = 1.8; // Brief invulnerability grace period
        return true;
    }

    repair(amount = 1) {
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + amount);
            return true;
        }
        return false;
    }

    upgradeWeapon() {
        if (this.weaponLevel < 4) {
            this.weaponLevel++;
            if (this.weaponLevel === 4) {
                this.fireRate = 0.17; // Balanced Burst cannon fire rate
            } else if (this.weaponLevel === 3) {
                this.fireRate = 0.20;
            } else if (this.weaponLevel === 2) {
                this.fireRate = 0.22;
            }
            return true;
        }
        return false;
    }

    update(dt, canvasWidth) {
        this.x += this.vx * dt;

        // Keep inside canvas bounds
        const halfW = this.width / 2;
        if (this.x < halfW) this.x = halfW;
        if (this.x > canvasWidth - halfW) this.x = canvasWidth - halfW;

        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }
        this.flameFlicker += dt * 15;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Invulnerability flashing
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 12) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        // 1. Engine SSME & OMS Plumes
        const flameLength = 14 + Math.sin(this.flameFlicker) * 4;
        // SSME Main Plumes (3 engines: center, left, right)
        const engines = [-6, 6, 0];
        engines.forEach((ex, idx) => {
            const elen = idx === 2 ? flameLength * 1.2 : flameLength;
            // Blue/Cyan core
            const pGrad = ctx.createLinearGradient(ex, 28, ex, 28 + elen);
            pGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
            pGrad.addColorStop(0.3, "rgba(56, 189, 248, 0.85)");
            pGrad.addColorStop(0.7, "rgba(14, 165, 233, 0.5)");
            pGrad.addColorStop(1, "rgba(3, 105, 161, 0)");
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.moveTo(ex - 3, 28);
            ctx.lineTo(ex + 3, 28);
            ctx.lineTo(ex, 28 + elen);
            ctx.closePath();
            ctx.fill();
        });

        // 2. RCS Thruster Puffs
        if (this.rcsLeft) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(18, -12, 6, 2);
            ctx.fillRect(20, 18, 5, 2);
        }
        if (this.rcsRight) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(-24, -12, 6, 2);
            ctx.fillRect(-25, 18, 5, 2);
        }

        // 3. Space Shuttle Delta Wings & Black Thermal Heat Shield
        // Black heat-resistant underside tile outline
        ctx.fillStyle = "#111827";
        ctx.beginPath();
        ctx.moveTo(0, -32); // Nose
        ctx.lineTo(8, -18);
        ctx.lineTo(22, 14); // Right wing tip
        ctx.lineTo(22, 22);
        ctx.lineTo(10, 24);
        ctx.lineTo(8, 28); // Right OMS pod
        ctx.lineTo(-8, 28); // Left OMS pod
        ctx.lineTo(-10, 24);
        ctx.lineTo(-22, 22);
        ctx.lineTo(-22, 14); // Left wing tip
        ctx.lineTo(-8, -18);
        ctx.closePath();
        ctx.fill();

        // 4. White Orbiter Fuselage (Upper thermal blankets)
        ctx.fillStyle = "#f3f4f6";
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(6, -16);
        ctx.lineTo(19, 12);
        ctx.lineTo(19, 19);
        ctx.lineTo(8, 22);
        ctx.lineTo(6, 26);
        ctx.lineTo(-6, 26);
        ctx.lineTo(-8, 22);
        ctx.lineTo(-19, 19);
        ctx.lineTo(-19, 12);
        ctx.lineTo(-6, -16);
        ctx.closePath();
        ctx.fill();

        // Wing elevons / control surface accents
        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 5. NASA Black Nose Cap & Cockpit Windows
        ctx.fillStyle = "#1f2937"; // Black RCC nose cap
        ctx.beginPath();
        ctx.ellipse(0, -28, 4.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit Windshield (6-window iconic wrap-around)
        ctx.fillStyle = "#38bdf8";
        // Left windows
        ctx.fillRect(-4.5, -22, 3, 2.5);
        // Center/Right windows
        ctx.fillRect(1.5, -22, 3, 2.5);
        ctx.fillRect(-1.5, -22.5, 3, 2.5);

        // 6. Cargo Bay Doors & Payload Line
        ctx.strokeStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(0, 18);
        ctx.stroke();

        // NASA "Meatball" or Red Worm Logo accent
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-2, -6, 4, 2);

        // American Flag decal
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(6, 2, 4, 3);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(6, 5, 4, 1.5);

        // 7. Vertical Tail Fin & Rudder / Speed Brake
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(2, 22);
        ctx.lineTo(-2, 22);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#111827";
        ctx.fillRect(-1.5, 18, 3, 4);

        // 8. Plasma Cannon Hardpoints (Visual indication of upgrade)
        if (this.weaponLevel >= 2) {
            // Dual wing tips
            ctx.fillStyle = "#00f0ff";
            ctx.fillRect(-20, 10, 3, 6);
            ctx.fillRect(17, 10, 3, 6);
        }
        if (this.weaponLevel >= 3) {
            // Triple nose cannon
            ctx.fillStyle = "#a855f7";
            ctx.fillRect(-1.5, -34, 3, 6);
        }
        if (this.weaponLevel >= 4) {
            // Burst Hyper glow rings
            ctx.strokeStyle = "#e879f9";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 9. Shield Aura Indicator (Green -> Yellow -> Red Flashing)
        if (this.health < this.maxHealth) {
            ctx.strokeStyle = this.health === 2 ? "rgba(234, 179, 8, 0.45)" : "rgba(239, 68, 68, 0.7)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            // Pristine Cyan Deflector Aura
            ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 26, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// --- SpaceX Starship Invader ---
class StarshipInvader {
    constructor(x, y, row, col) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.width = 38;
        this.height = 62;
        this.row = row;
        this.col = col;
        this.health = 3;
        this.maxHealth = 3;
        this.points = 150;
        this.flapAngle = 0;
        this.flapSpeed = 3 + Math.random() * 2;
        this.type = 'starship';
        this.launchTimer = 3 + Math.random() * 6;
    }

    update(dt, offsetX, offsetY) {
        this.x = this.baseX + offsetX;
        this.y = this.baseY + offsetY;
        this.flapAngle += dt * this.flapSpeed;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Raptor Vacuum Engines (Methalox blue-violet flame)
        const flameH = 10 + Math.sin(this.flapAngle * 3) * 4;
        const raptorGrad = ctx.createLinearGradient(0, 28, 0, 28 + flameH);
        raptorGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        raptorGrad.addColorStop(0.3, "rgba(168, 85, 247, 0.85)");
        raptorGrad.addColorStop(0.7, "rgba(59, 130, 246, 0.6)");
        raptorGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = raptorGrad;
        [-6, 0, 6].forEach(rx => {
            ctx.beginPath();
            ctx.moveTo(rx - 2.5, 28);
            ctx.lineTo(rx + 2.5, 28);
            ctx.lineTo(rx, 28 + flameH);
            ctx.closePath();
            ctx.fill();
        });

        // 2. Stainless Steel Cylindrical Body (Mirrored metallic gradient)
        const steelGrad = ctx.createLinearGradient(-14, 0, 14, 0);
        steelGrad.addColorStop(0, "#475569");
        steelGrad.addColorStop(0.2, "#94a3b8");
        steelGrad.addColorStop(0.5, "#f1f5f9"); // High metallic specular shine
        steelGrad.addColorStop(0.8, "#94a3b8");
        steelGrad.addColorStop(1, "#334155");

        ctx.fillStyle = steelGrad;
        // Nose Cone (Conical Ogive)
        ctx.beginPath();
        ctx.moveTo(0, -31);
        ctx.bezierCurveTo(9, -20, 12, -8, 12, 0);
        ctx.lineTo(12, 28);
        ctx.lineTo(-12, 28);
        ctx.lineTo(-12, 0);
        ctx.bezierCurveTo(-12, -8, -9, -20, 0, -31);
        ctx.closePath();
        ctx.fill();

        // 3. Actuated Forward Aerodynamic Flaps
        const flapOffset = Math.sin(this.flapAngle) * 3;
        ctx.fillStyle = "#64748b";
        // Left Forward Flap
        ctx.beginPath();
        ctx.moveTo(-11, -18);
        ctx.lineTo(-19 + flapOffset * 0.5, -14);
        ctx.lineTo(-19 + flapOffset * 0.5, -8);
        ctx.lineTo(-11, -6);
        ctx.closePath();
        ctx.fill();
        // Right Forward Flap
        ctx.beginPath();
        ctx.moveTo(11, -18);
        ctx.lineTo(19 - flapOffset * 0.5, -14);
        ctx.lineTo(19 - flapOffset * 0.5, -8);
        ctx.lineTo(11, -6);
        ctx.closePath();
        ctx.fill();

        // 4. Actuated Aft Body Flaps
        ctx.fillStyle = "#475569";
        // Left Aft Flap
        ctx.beginPath();
        ctx.moveTo(-12, 10);
        ctx.lineTo(-21 + flapOffset, 16);
        ctx.lineTo(-21 + flapOffset, 27);
        ctx.lineTo(-12, 27);
        ctx.closePath();
        ctx.fill();
        // Right Aft Flap
        ctx.beginPath();
        ctx.moveTo(12, 10);
        ctx.lineTo(21 - flapOffset, 16);
        ctx.lineTo(21 - flapOffset, 27);
        ctx.lineTo(12, 27);
        ctx.closePath();
        ctx.fill();

        // 5. Starlink Pez Dispenser Bay Door (Flashing green/blue laser slit)
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-4, -4, 8, 12);
        ctx.fillStyle = (Math.floor(this.flapAngle * 4) % 2 === 0) ? "#00f0ff" : "#3b82f6";
        ctx.fillRect(-3, -2, 6, 2);

        // 6. Ring weld seams
        ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, 6);
        ctx.lineTo(12, 6);
        ctx.moveTo(-12, 18);
        ctx.lineTo(12, 18);
        ctx.stroke();

        // Damage indicator
        if (this.health < this.maxHealth) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
            ctx.fillRect(-10, -36, (20 * (this.health / this.maxHealth)), 3);
        }

        ctx.restore();
    }
}

// --- Falcon Heavy Invader ---
class FalconHeavyInvader {
    constructor(x, y, row, col) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.width = 46;
        this.height = 68;
        this.row = row;
        this.col = col;
        this.health = 5;
        this.maxHealth = 5;
        this.points = 250;
        this.animTimer = Math.random() * Math.PI;
        this.type = 'falcon_heavy';
        this.launchTimer = 2 + Math.random() * 5;
    }

    update(dt, offsetX, offsetY) {
        this.x = this.baseX + offsetX;
        this.y = this.baseY + offsetY;
        this.animTimer += dt * 5;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Triple Booster 27-Merlin Engine Cluster Flames (Orange kerosene glow)
        const flameH = 12 + Math.sin(this.animTimer) * 4;
        const boosterCores = [-12, 0, 12];
        boosterCores.forEach(bx => {
            const fGrad = ctx.createLinearGradient(bx, 28, bx, 28 + flameH);
            fGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
            fGrad.addColorStop(0.3, "rgba(249, 115, 22, 0.85)");
            fGrad.addColorStop(0.7, "rgba(220, 38, 38, 0.6)");
            fGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = fGrad;
            ctx.beginPath();
            ctx.moveTo(bx - 3.5, 28);
            ctx.lineTo(bx + 3.5, 28);
            ctx.lineTo(bx, 28 + flameH);
            ctx.closePath();
            ctx.fill();
        });

        // 2. Left Booster Core
        this.renderBoosterCore(ctx, -12, false);

        // 3. Right Booster Core
        this.renderBoosterCore(ctx, 12, false);

        // 4. Center Core & Upper Stage / Payload Fairing
        this.renderBoosterCore(ctx, 0, true);

        // Damage indicator
        if (this.health < this.maxHealth) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
            ctx.fillRect(-15, -40, (30 * (this.health / this.maxHealth)), 3);
        }

        ctx.restore();
    }

    renderBoosterCore(ctx, cx, isCenter) {
        ctx.save();
        ctx.translate(cx, 0);

        // White core body
        const grad = ctx.createLinearGradient(-5, 0, 5, 0);
        grad.addColorStop(0, "#cbd5e1");
        grad.addColorStop(0.5, "#ffffff");
        grad.addColorStop(1, "#94a3b8");
        ctx.fillStyle = grad;

        if (isCenter) {
            // Center Core has Fairing Nose at the top
            ctx.fillRect(-5, -16, 10, 44);
            // Black Interstage
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(-5, -6, 10, 5);
            // Payload Fairing
            ctx.fillStyle = "#f8fafc";
            ctx.beginPath();
            ctx.moveTo(0, -34);
            ctx.lineTo(6, -24);
            ctx.lineTo(6, -16);
            ctx.lineTo(-6, -16);
            ctx.lineTo(-6, -24);
            ctx.closePath();
            ctx.fill();
            // Red SpaceX Logo band
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(-4, -18, 8, 2);
        } else {
            // Side Boosters with Aerodynamic Nose Cones
            ctx.fillRect(-4.5, -10, 9, 38);
            ctx.beginPath();
            ctx.moveTo(0, -22);
            ctx.lineTo(4.5, -10);
            ctx.lineTo(-4.5, -10);
            ctx.closePath();
            ctx.fill();
        }

        // Titanium Grid Fins (Black waffle grid)
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-7, -4, 2.5, 4);
        ctx.fillRect(4.5, -4, 2.5, 4);

        // Falcon base landing legs (Stowed black triangles)
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-5, 20, 1.5, 8);
        ctx.fillRect(3.5, 20, 1.5, 8);

        ctx.restore();
    }
}

// --- Starlink Satellite (Launched at Player) ---
class StarlinkSatellite {
    constructor(x, y, vx = 0, vy = 210, behavior = 'direct', targetX = null) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 24;
        this.height = 28;
        this.rotation = 0;
        this.rotSpeed = 2.5;
        this.health = 1;
        this.points = 50;
        this.laserCharge = 0;
        this.isHostile = true;
        this.behavior = behavior; // 'direct', 'homing', 'weave', 'swoop'
        this.targetX = targetX;
        this.age = 0;
        this.homingStrength = 130;
    }

    update(dt, playerX) {
        this.age += dt;

        // Dynamic evasive & homing maneuvers making them harder to dodge
        if (this.behavior === 'homing' && playerX !== undefined) {
            // Actively steers horizontally towards player's position with higher tracking
            const dx = playerX - this.x;
            const dir = Math.sign(dx);
            this.vx += dir * 180 * dt;
            // Cap horizontal drift speed
            this.vx = Math.max(-190, Math.min(190, this.vx));
        } else if (this.behavior === 'weave') {
            // S-curve oscillation
            this.vx = Math.sin(this.age * 5.5) * 160;
        } else if (this.behavior === 'swoop') {
            // Accelerates downwards rapidly as it gets closer
            this.vy += 160 * dt;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotSpeed * dt;
        this.laserCharge += dt * 8;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.rotation) * 0.15);

        // 1. Blue Argon Ion Thruster Beam
        const ionGrad = ctx.createLinearGradient(0, -8, 0, -20);
        ionGrad.addColorStop(0, "rgba(56, 189, 248, 0.9)");
        ionGrad.addColorStop(0.5, "rgba(14, 165, 233, 0.5)");
        ionGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = ionGrad;
        ctx.fillRect(-2, -18, 4, 10);

        // 2. Flat Chassis (Iconic Starlink table-like stack chassis)
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(-8, -4, 16, 8);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-6, -2, 12, 4);

        // 3. Single Solar Array Panel (Deep Blue / Gold Photovoltaic Cells)
        const panelGrad = ctx.createLinearGradient(0, 4, 0, 22);
        panelGrad.addColorStop(0, "#1e3a8a");
        panelGrad.addColorStop(0.5, "#0284c7");
        panelGrad.addColorStop(1, "#172554");
        ctx.fillStyle = panelGrad;
        ctx.fillRect(-5, 4, 10, 18);

        // Solar Grid Lines
        ctx.strokeStyle = "rgba(253, 224, 71, 0.6)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-5, 10); ctx.lineTo(5, 10);
        ctx.moveTo(-5, 16); ctx.lineTo(5, 16);
        ctx.moveTo(0, 4); ctx.lineTo(0, 22);
        ctx.stroke();

        // 4. Optical Space Laser Inter-satellite Links (Red/Cyan flashing dots)
        const laserColor = Math.sin(this.laserCharge) > 0 ? "#ef4444" : "#00f0ff";
        ctx.fillStyle = laserColor;
        ctx.beginPath();
        ctx.arc(-7, 0, 1.8, 0, Math.PI * 2);
        ctx.arc(7, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Danger Aura
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 4, 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

// --- Orbital Service Station (Provides Repair to Player) ---
class OrbitalServiceStation {
    constructor(canvasWidth) {
        this.width = 120;
        this.height = 70;
        this.x = -this.width;
        this.y = 80;
        this.speed = 85;
        this.active = true;
        this.docked = false;
        this.hasRepaired = false;
        this.beaconTimer = 0;
        this.solarRotation = 0;
        this.canvasWidth = canvasWidth;
    }

    update(dt) {
        this.x += this.speed * dt;
        this.beaconTimer += dt * 4;
        this.solarRotation += dt * 1.5;

        // Deactivate once crossed entire screen
        if (this.x > this.canvasWidth + this.width + 100) {
            this.active = false;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Repair Tractor Beam / Service Dock Corridor
        const beamGrad = ctx.createLinearGradient(0, 20, 0, 180);
        beamGrad.addColorStop(0, "rgba(34, 197, 94, 0.6)");
        beamGrad.addColorStop(0.5, "rgba(74, 222, 128, 0.3)");
        beamGrad.addColorStop(1, "rgba(34, 197, 94, 0)");

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-25, 20);
        ctx.lineTo(25, 20);
        ctx.lineTo(60, 180);
        ctx.lineTo(-60, 180);
        ctx.closePath();
        ctx.fill();

        // Flashing Repair Icon / Green Cross
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(-4, -38, 8, 20);
        ctx.fillRect(-10, -32, 20, 8);

        // Text Banner: "SERVICE STATION - DOCK FOR REPAIR"
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("ORBITAL SERVICE DOCK", 0, -42);

        // 2. Modular Pressurized Habitats (Mir / Freedom style)
        // Central Core Cylinder
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(-28, -10, 56, 20);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-28, -10, 56, 20);

        // Central Node
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(-12, -14, 24, 28);

        // Docking Port Cone (Pointing downward toward player)
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.moveTo(-10, 14);
        ctx.lineTo(10, 14);
        ctx.lineTo(6, 24);
        ctx.lineTo(-6, 24);
        ctx.closePath();
        ctx.fill();

        // Flashing Green Navigation Strobes
        const strobeOn = Math.sin(this.beaconTimer) > 0;
        ctx.fillStyle = strobeOn ? "#22c55e" : "#15803d";
        ctx.beginPath();
        ctx.arc(-8, 24, 2.5, 0, Math.PI * 2);
        ctx.arc(8, 24, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 3. Huge Dual Solar Wings (Left & Right)
        this.renderSolarWing(ctx, -58, 0, this.solarRotation);
        this.renderSolarWing(ctx, 30, 0, this.solarRotation);

        // 4. Robotic Canadarm / Service Arm
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(12, 10);
        ctx.lineTo(24, 30);
        ctx.lineTo(18, 45);
        ctx.stroke();

        ctx.restore();
    }

    renderSolarWing(ctx, ox, oy, rot) {
        ctx.save();
        ctx.translate(ox, oy);

        // Truss
        ctx.fillStyle = "#64748b";
        ctx.fillRect(0, -2, 28, 4);

        // Solar Array Panel with simulated 3D tilt
        const scaleY = Math.cos(rot);
        ctx.fillStyle = "#1e3a8a";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1;

        ctx.save();
        ctx.scale(1, Math.abs(scaleY) * 0.8 + 0.2);
        ctx.fillRect(2, -22, 24, 44);
        ctx.strokeRect(2, -22, 24, 44);

        // Photovoltaic grid
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        for (let y = -16; y <= 16; y += 8) {
            ctx.beginPath();
            ctx.moveTo(2, y); ctx.lineTo(26, y);
            ctx.stroke();
        }
        ctx.restore();

        ctx.restore();
    }
}

// --- Player Plasma Projectile ---
class PlasmaBolt {
    constructor(x, y, vx = 0, vy = -560, level = 1) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.level = level;
        this.radius = level === 4 ? 6 : 4;
        this.active = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -20 || this.x < -20 || this.x > 1200) {
            this.active = false;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glowing Plasma Capsule
        let color1 = "#ffffff";
        let color2 = "#00f0ff";
        let color3 = "#0284c7";

        if (this.level === 3) {
            color2 = "#a855f7";
            color3 = "#7e22ce";
        } else if (this.level >= 4) {
            color2 = "#f43f5e";
            color3 = "#be123c";
        }

        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, this.radius * 2);
        grad.addColorStop(0, color1);
        grad.addColorStop(0.4, color2);
        grad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Core bolt
        ctx.fillStyle = color1;
        ctx.fillRect(-2, -6, 4, 12);

        ctx.restore();
    }
}

// --- Power-up Upgrade Drone / Capsule ---
class UpgradeCapsule {
    constructor(x, y, type = 'weapon') {
        this.x = x;
        this.y = y;
        this.vy = 85;
        this.vx = Math.sin(x) * 20;
        this.type = type; // 'weapon', 'repair', 'burst'
        this.radius = 14;
        this.active = true;
        this.timer = 0;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.timer += dt * 5;
        if (this.y > 900) this.active = false;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing glow
        const glowR = this.radius + Math.sin(this.timer) * 3;
        const color = this.type === 'repair' ? '#22c55e' : (this.type === 'burst' ? '#ec4899' : '#06b6d4');

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = this.type === 'repair' ? 'REP' : (this.type === 'burst' ? 'BUR' : 'UP');
        ctx.fillText(text, 0, 0);

        ctx.restore();
    }
}

// --- Particle / Explosion System ---
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.rings = [];
    }

    createExplosion(x, y, color = "#ffaa00", count = 30) {
        // Shockwave ring
        this.rings.push({
            x, y, radius: 4, maxRadius: 40, alpha: 1.0, color
        });

        // Fragments and sparks
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 220;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 1.2 + Math.random() * 1.8,
                size: 2 + Math.random() * 3,
                color: Math.random() < 0.4 ? "#ffffff" : color
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= p.decay * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.rings.length - 1; i >= 0; i--) {
            const r = this.rings[i];
            r.radius += 120 * dt;
            r.alpha -= 2.0 * dt;
            if (r.alpha <= 0) {
                this.rings.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();
        // Render shockwave rings
        this.rings.forEach(r => {
            ctx.strokeStyle = r.color;
            ctx.globalAlpha = Math.max(0, r.alpha);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Render sparks & fragments
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });

        ctx.restore();
    }
}

window.SpaceShuttle = SpaceShuttle;
window.StarshipInvader = StarshipInvader;
window.FalconHeavyInvader = FalconHeavyInvader;
window.StarlinkSatellite = StarlinkSatellite;
window.OrbitalServiceStation = OrbitalServiceStation;
window.PlasmaBolt = PlasmaBolt;
window.UpgradeCapsule = UpgradeCapsule;
window.ParticleSystem = ParticleSystem;

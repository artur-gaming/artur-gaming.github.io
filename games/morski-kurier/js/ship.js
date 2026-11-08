/**
 * Model Fizyki i Wizualizacji Statku
 */

class Ship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0; // Kąt obrotu w radianach
        this.angularVelocity = 0;
        this.speed = 0;

        // Typ statku i statystyki bazowe
        this.shipType = 'kuter';
        this.tier = 1;
        this.name = 'Kuter "Mewa"';

        // Parametry manewrowe
        this.maxForwardSpeed = 4.0;
        this.maxReverseSpeed = -1.8;
        this.acceleration = 1.6;
        this.deceleration = 0.95;
        this.turnSpeed = 1.9;
        this.driftFriction = 0.88; // Tłumienie poślizgu bocznego

        // Ładowność i wytrzymałość
        this.maxHp = 100;
        this.hp = 100;
        this.cargoCapacity = 4;
        this.cargo = []; // Tablica przedmiotów np. ['wood', 'fish']

        // Poziomy ulepszeń
        this.upgrades = {
            sails: 1,      // +prędkość
            hull: 1,       // +HP i odporność
            hold: 1,       // +pojemność ładowni
            radar: 1       // +zasięg radaru
        };

        // Cząsteczki kilwateru (ślad na wodzie)
        this.wakeParticles = [];
        this.splashParticles = [];
        this.smokeParticles = [];

        // Stan sterowania
        this.throttle = 0; // -1 do 1
        this.rudder = 0;   // -1 do 1
        this.isAnchored = false;
        this.lightsOn = false; // Światła okrętowe (klawisz F)
        this.collisionCooldown = 0;

        // Animacje
        this.sailBillow = 0;
        this.flagAngle = 0;
        this.roll = 0; // Lekkie kołysanie na falach
    }

    setShipTier(tier) {
        this.tier = tier;
        if (tier === 1) {
            this.shipType = 'kuter';
            this.name = 'Kuter "Mewa"';
            this.maxForwardSpeed = 3.8 + (this.upgrades.sails - 1) * 0.4;
            this.maxHp = 100 + (this.upgrades.hull - 1) * 30;
            this.cargoCapacity = 4 + (this.upgrades.hold - 1) * 2;
        } else if (tier === 2) {
            this.shipType = 'szkuner';
            this.name = 'Szkuner "Bocian"';
            this.maxForwardSpeed = 4.7 + (this.upgrades.sails - 1) * 0.5;
            this.maxHp = 160 + (this.upgrades.hull - 1) * 40;
            this.cargoCapacity = 8 + (this.upgrades.hold - 1) * 3;
        } else if (tier === 3) {
            this.shipType = 'brygantyna';
            this.name = 'Brygantyna "Korsarz"';
            this.maxForwardSpeed = 5.4 + (this.upgrades.sails - 1) * 0.6;
            this.maxHp = 250 + (this.upgrades.hull - 1) * 50;
            this.cargoCapacity = 14 + (this.upgrades.hold - 1) * 4;
        } else if (tier === 4) {
            this.shipType = 'galeon';
            this.name = 'Galeon "Lewiatan"';
            this.maxForwardSpeed = 5.0 + (this.upgrades.sails - 1) * 0.6;
            this.maxHp = 380 + (this.upgrades.hull - 1) * 60;
            this.cargoCapacity = 24 + (this.upgrades.hold - 1) * 6;
        }
        this.hp = Math.min(this.hp, this.maxHp);
    }

    applyUpgrade(type) {
        if (!this.upgrades[type]) return;
        this.upgrades[type]++;
        this.setShipTier(this.tier);
    }

    update(dt, windX = 0, windY = 0) {
        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= dt;
        }

        // Kołysanie na falach
        this.roll = Math.sin(Date.now() * 0.003) * 0.04;

        if (this.isAnchored) {
            // Kotwica gwałtownie hamuje
            this.vx *= 0.85;
            this.vy *= 0.85;
            this.speed = Math.hypot(this.vx, this.vy);
            this.updateParticles(dt);
            return;
        }

        // Obliczanie kierunków
        const forwardX = Math.cos(this.angle);
        const forwardY = Math.sin(this.angle);
        const rightX = -Math.sin(this.angle);
        const rightY = Math.cos(this.angle);

        // Skręcanie zależne od prędkości (statek manewruje lepiej gdy płynie)
        const speedFactor = Math.min(1.0, Math.max(0.2, Math.abs(this.speed) / (this.maxForwardSpeed * 0.6)));
        const turnDirection = this.throttle < 0 ? -1 : 1; // Zwrot przy cofaniu
        this.angularVelocity = this.rudder * this.turnSpeed * speedFactor * turnDirection;
        this.angle += this.angularVelocity * dt;

        // Wpływ wiatru na żagle (fizyka wiatru)
        const windDot = forwardX * windX + forwardY * windY;
        const windBoost = windDot * 0.35; // Sprzyjający wiatr przyspiesza!
        this.sailBillow = Math.min(1, Math.max(0.1, 0.5 + windDot * 0.4));

        // Siła napędu
        let targetSpeed = 0;
        if (this.throttle > 0) {
            targetSpeed = (this.maxForwardSpeed + windBoost) * this.throttle;
        } else if (this.throttle < 0) {
            targetSpeed = this.maxReverseSpeed * Math.abs(this.throttle);
        }

        // Przyspieszanie wzdłużne
        const accel = this.acceleration * dt;
        const currentForwardSpeed = this.vx * forwardX + this.vy * forwardY;
        const newForwardSpeed = currentForwardSpeed + (targetSpeed - currentForwardSpeed) * accel * 2;

        // Prędkość boczna (drifting tłumiony przez stępkę statku)
        const currentLateralSpeed = this.vx * rightX + this.vy * rightY;
        const newLateralSpeed = currentLateralSpeed * Math.pow(this.driftFriction, dt * 60);

        // Rekonstrukcja wektora prędkości
        this.vx = forwardX * newForwardSpeed + rightX * newLateralSpeed;
        this.vy = forwardY * newForwardSpeed + rightY * newLateralSpeed;

        // Aktualizacja pozycji
        this.x += this.vx * 60 * dt;
        this.y += this.vy * 60 * dt;
        this.speed = Math.hypot(this.vx, this.vy);

        // Cząsteczki kilwateru
        this.generateWake(dt);
        this.updateParticles(dt);
    }

    generateWake(dt) {
        if (this.speed > 0.4) {
            const sternDist = this.tier >= 3 ? -32 : -22;
            const sternX = this.x + Math.cos(this.angle) * sternDist;
            const sternY = this.y + Math.sin(this.angle) * sternDist;

            // Lewy i prawy wąs fali rufowej
            for (let side = -1; side <= 1; side += 2) {
                const spreadAngle = this.angle + Math.PI + side * 0.4;
                this.wakeParticles.push({
                    x: sternX + Math.cos(this.angle + Math.PI / 2 * side) * 8,
                    y: sternY + Math.sin(this.angle + Math.PI / 2 * side) * 8,
                    vx: Math.cos(spreadAngle) * (this.speed * 0.35 + Math.random() * 0.2),
                    vy: Math.sin(spreadAngle) * (this.speed * 0.35 + Math.random() * 0.2),
                    size: 4 + Math.random() * 4,
                    maxLife: 1.4,
                    life: 1.4,
                    opacity: 0.6
                });
            }
        }

        // Dym z komina / przecieki jeśli uszkodzony
        if (this.hp < this.maxHp * 0.45) {
            if (Math.random() < 0.3) {
                this.smokeParticles.push({
                    x: this.x + (Math.random() - 0.5) * 16,
                    y: this.y + (Math.random() - 0.5) * 16,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: -1.2 - Math.random() * 0.8,
                    size: 6 + Math.random() * 8,
                    life: 1.2,
                    maxLife: 1.2
                });
            }
        }
    }

    updateParticles(dt) {
        for (let i = this.wakeParticles.length - 1; i >= 0; i--) {
            const p = this.wakeParticles[i];
            p.life -= dt;
            p.x += p.vx;
            p.y += p.vy;
            p.size += dt * 7;
            p.opacity = (p.life / p.maxLife) * 0.5;
            if (p.life <= 0) {
                this.wakeParticles.splice(i, 1);
            }
        }

        for (let i = this.splashParticles.length - 1; i >= 0; i--) {
            const p = this.splashParticles[i];
            p.life -= dt;
            p.x += p.vx;
            p.y += p.vy;
            if (p.life <= 0) {
                this.splashParticles.splice(i, 1);
            }
        }

        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.life -= dt;
            p.x += p.vx;
            p.y += p.vy;
            p.size += dt * 10;
            if (p.life <= 0) {
                this.smokeParticles.splice(i, 1);
            }
        }
    }

    takeDamage(amount) {
        const armorReduction = (this.upgrades.hull - 1) * 3;
        const actualDamage = Math.max(5, amount - armorReduction);
        this.hp = Math.max(0, this.hp - actualDamage);

        // Rozpryski wody przy uderzeniu
        for (let i = 0; i < 15; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 1.5 + Math.random() * 3.5;
            this.splashParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                size: 3 + Math.random() * 4,
                life: 0.6,
                maxLife: 0.6
            });
        }
        return actualDamage;
    }

    repair(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    // Renderowanie statku na canvasie
    render(ctx) {
        // Cząsteczki kilwateru na warstwie pod statkiem
        ctx.save();
        for (const p of this.wakeParticles) {
            ctx.fillStyle = `rgba(230, 245, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        for (const p of this.splashParticles) {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life / p.maxLife})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Rysowanie kadłuba statku
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + this.roll);

        // 1. Cień statku na wodzie (zawsze na samym spodzie, pod światłami)
        ctx.save();
        ctx.fillStyle = 'rgba(10, 30, 50, 0.28)';
        ctx.translate(8, 8);
        this.drawHullShape(ctx);
        ctx.restore();

        // 2. Snop światła reflektora dziobowego i poświata na wodzie (tryb addytywny 'lighter' - rozświetla wodę!)
        if (this.lightsOn) {
            const bowTipX = this.getHullLength() * 0.45;
            const beamLength = 260 + (this.upgrades.radar - 1) * 50;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            // Stożek światła przed dziobem
            const beamGrad = ctx.createRadialGradient(bowTipX, 0, 6, bowTipX, 0, beamLength);
            beamGrad.addColorStop(0, 'rgba(255, 245, 180, 0.5)');
            beamGrad.addColorStop(0.35, 'rgba(255, 235, 140, 0.25)');
            beamGrad.addColorStop(1, 'rgba(255, 220, 100, 0)');

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(bowTipX, 0);
            ctx.arc(bowTipX, 0, beamLength, -0.42, 0.42);
            ctx.closePath();
            ctx.fill();

            // Ciepła poświata wokół całego kadłuba na wodzie
            const hullGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, this.getHullLength() * 0.95);
            hullGlow.addColorStop(0, 'rgba(255, 220, 130, 0.25)');
            hullGlow.addColorStop(1, 'rgba(255, 210, 80, 0)');
            ctx.fillStyle = hullGlow;
            ctx.beginPath();
            ctx.arc(0, 0, this.getHullLength() * 0.95, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Kadłub drewniany
        ctx.fillStyle = this.tier >= 3 ? '#5c3a21' : '#8B5A2B';
        ctx.strokeStyle = '#3e2311';
        ctx.lineWidth = 2.5;
        this.drawHullShape(ctx);

        // Pokład statku (deski)
        ctx.fillStyle = this.tier >= 3 ? '#c49a6c' : '#d2b48c';
        this.drawDeckShape(ctx);

        // Rufa i ster
        ctx.fillStyle = '#4a2e18';
        ctx.fillRect(-this.getHullLength() * 0.48, -4, 4, 8);

        // Płetwa sterowa wizualna
        ctx.save();
        ctx.translate(-this.getHullLength() * 0.5, 0);
        ctx.rotate(this.rudder * 0.5);
        ctx.fillStyle = '#2c1808';
        ctx.fillRect(-8, -2, 8, 4);
        ctx.restore();

        // Ładunek na pokładzie (skrzynki i beczki)
        this.renderCargoOnDeck(ctx);

        // Maszty i żagle
        this.renderMastsAndSails(ctx);

        // Światła nawigacyjne (czerwone lewa burta, zielone prawa) oraz latarnie dziobowa i rufowa
        const portY = -this.getHullWidth() * 0.48;
        const starboardY = this.getHullWidth() * 0.48;
        const bowX = this.getHullLength() * 0.45;
        const sternX = -this.getHullLength() * 0.44;

        if (this.lightsOn) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            // Poświata lewa burta (czerwona)
            const redGlow = ctx.createRadialGradient(0, portY, 1, 0, portY, 14);
            redGlow.addColorStop(0, 'rgba(255, 60, 60, 0.9)');
            redGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = redGlow;
            ctx.beginPath();
            ctx.arc(0, portY, 14, 0, Math.PI * 2);
            ctx.fill();

            // Poświata prawa burta (zielona)
            const greenGlow = ctx.createRadialGradient(0, starboardY, 1, 0, starboardY, 14);
            greenGlow.addColorStop(0, 'rgba(46, 230, 113, 0.9)');
            greenGlow.addColorStop(1, 'rgba(0, 255, 0, 0)');
            ctx.fillStyle = greenGlow;
            ctx.beginPath();
            ctx.arc(0, starboardY, 14, 0, Math.PI * 2);
            ctx.fill();

            // Latarnia na dziobie (reflektor - złota poświata)
            const bowGlow = ctx.createRadialGradient(bowX, 0, 2, bowX, 0, 18);
            bowGlow.addColorStop(0, 'rgba(255, 255, 200, 1.0)');
            bowGlow.addColorStop(0.4, 'rgba(255, 220, 100, 0.6)');
            bowGlow.addColorStop(1, 'rgba(255, 180, 50, 0)');
            ctx.fillStyle = bowGlow;
            ctx.beginPath();
            ctx.arc(bowX, 0, 18, 0, Math.PI * 2);
            ctx.fill();

            // Latarnia rufowa
            const sternGlow = ctx.createRadialGradient(sternX, 0, 1, sternX, 0, 12);
            sternGlow.addColorStop(0, 'rgba(255, 200, 80, 0.9)');
            sternGlow.addColorStop(1, 'rgba(255, 150, 30, 0)');
            ctx.fillStyle = sternGlow;
            ctx.beginPath();
            ctx.arc(sternX, 0, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Jasne punkty żarówek
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath(); ctx.arc(0, portY, 2.5, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#2ecc71';
            ctx.beginPath(); ctx.arc(0, starboardY, 2.5, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(bowX, 0, 3.5, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#f1c40f';
            ctx.beginPath(); ctx.arc(sternX, 0, 2.8, 0, Math.PI * 2); ctx.fill();
        } else {
            // Wyłączone klosze lamp
            ctx.fillStyle = 'rgba(120, 40, 35, 0.7)';
            ctx.beginPath();
            ctx.arc(0, portY, 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(30, 100, 60, 0.7)';
            ctx.beginPath();
            ctx.arc(0, starboardY, 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#7f8c8d';
            ctx.beginPath();
            ctx.arc(bowX, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Dym z przecieków na warstwie nad statkiem
        ctx.save();
        for (const p of this.smokeParticles) {
            ctx.fillStyle = `rgba(80, 80, 80, ${p.life / p.maxLife * 0.6})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    getHullLength() {
        return this.tier === 1 ? 46 : (this.tier === 2 ? 58 : (this.tier === 3 ? 72 : 88));
    }

    getHullWidth() {
        return this.tier === 1 ? 22 : (this.tier === 2 ? 26 : (this.tier === 3 ? 32 : 38));
    }

    drawHullShape(ctx) {
        const len = this.getHullLength();
        const wid = this.getHullWidth();
        ctx.beginPath();
        ctx.moveTo(len * 0.5, 0); // Dziób szpiczasty
        ctx.bezierCurveTo(len * 0.35, -wid * 0.55, -len * 0.25, -wid * 0.5, -len * 0.48, -wid * 0.35); // Lewa burta
        ctx.lineTo(-len * 0.48, wid * 0.35); // Rufa płaska / zaokrąglona
        ctx.bezierCurveTo(-len * 0.25, wid * 0.5, len * 0.35, wid * 0.55, len * 0.5, 0); // Prawa burta
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawDeckShape(ctx) {
        const len = this.getHullLength() * 0.88;
        const wid = this.getHullWidth() * 0.78;
        ctx.beginPath();
        ctx.moveTo(len * 0.46, 0);
        ctx.bezierCurveTo(len * 0.3, -wid * 0.5, -len * 0.25, -wid * 0.48, -len * 0.45, -wid * 0.3);
        ctx.lineTo(-len * 0.45, wid * 0.3);
        ctx.bezierCurveTo(-len * 0.25, wid * 0.48, len * 0.3, wid * 0.5, len * 0.46, 0);
        ctx.closePath();
        ctx.fill();
    }

    renderCargoOnDeck(ctx) {
        const count = this.cargo.length;
        if (count === 0) return;

        const cargoColors = {
            wood: '#8b5a2b',
            fish: '#3498db',
            wheat: '#f1c40f',
            tools: '#95a5a6',
            spices: '#e67e22',
            gold: '#f39c12',
            rum: '#9b59b6',
            coffee: '#4a2e18',
            amber: '#e67e22',
            ore: '#555555'
        };

        const slots = [
            { x: -8, y: -4 }, { x: -8, y: 4 },
            { x: -18, y: -4 }, { x: -18, y: 4 },
            { x: 4, y: -4 }, { x: 4, y: 4 },
            { x: -28, y: -4 }, { x: -28, y: 4 }
        ];

        for (let i = 0; i < Math.min(count, slots.length); i++) {
            const item = this.cargo[i];
            const slot = slots[i];
            ctx.fillStyle = cargoColors[item] || '#9e8156';
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            // Skrzynka
            ctx.fillRect(slot.x - 3, slot.y - 3, 7, 7);
            ctx.strokeRect(slot.x - 3, slot.y - 3, 7, 7);
        }
    }

    renderMastsAndSails(ctx) {
        const len = this.getHullLength();

        // Główny maszt
        ctx.fillStyle = '#5c3a21';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Żagiel główny (biel / krem)
        const billowOffset = (this.speed > 0.5 ? 4 : 1) * this.sailBillow;
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#dcdde1';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-2, -this.getHullWidth() * 0.6);
        ctx.quadraticCurveTo(billowOffset, 0, -2, this.getHullWidth() * 0.6);
        ctx.lineTo(2, this.getHullWidth() * 0.6);
        ctx.quadraticCurveTo(billowOffset + 4, 0, 2, -this.getHullWidth() * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dodatkowe maszty dla większych statków
        if (this.tier >= 2) {
            // Przedni maszt (fokmaszt)
            ctx.fillStyle = '#5c3a21';
            ctx.beginPath();
            ctx.arc(len * 0.25, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f8f9fa';
            ctx.beginPath();
            ctx.moveTo(len * 0.25 - 2, -this.getHullWidth() * 0.45);
            ctx.quadraticCurveTo(len * 0.25 + billowOffset, 0, len * 0.25 - 2, this.getHullWidth() * 0.45);
            ctx.lineTo(len * 0.25 + 2, this.getHullWidth() * 0.45);
            ctx.quadraticCurveTo(len * 0.25 + billowOffset + 3, 0, len * 0.25 + 2, -this.getHullWidth() * 0.45);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        if (this.tier >= 3) {
            // Bezmaszt (tylni)
            ctx.fillStyle = '#5c3a21';
            ctx.beginPath();
            ctx.arc(-len * 0.25, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f8f9fa';
            ctx.beginPath();
            ctx.moveTo(-len * 0.25 - 2, -this.getHullWidth() * 0.4);
            ctx.quadraticCurveTo(-len * 0.25 + billowOffset, 0, -len * 0.25 - 2, this.getHullWidth() * 0.4);
            ctx.lineTo(-len * 0.25 + 2, this.getHullWidth() * 0.4);
            ctx.quadraticCurveTo(-len * 0.25 + billowOffset + 3, 0, -len * 0.25 + 2, -this.getHullWidth() * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Proporzec / Flaga na rufie trzepocząca na wietrze
        const flagWave = Math.sin(Date.now() * 0.01) * 3;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(-len * 0.46, 0);
        ctx.lineTo(-len * 0.46 - 12, flagWave - 3);
        ctx.lineTo(-len * 0.46 - 8, flagWave);
        ctx.lineTo(-len * 0.46 - 12, flagWave + 3);
        ctx.closePath();
        ctx.fill();
    }
}

window.Ship = Ship;

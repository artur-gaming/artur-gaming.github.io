/**
 * Świat Gry: Archipelag Siedmiu Mórz
 * Zarządzanie wyspami, portami, rafami, bojami nawigacyjnymi i dryfującym ładunkiem.
 */

class WorldMap {
    constructor() {
        this.width = 6000;
        this.height = 6000;

        // Porty handlowe
        this.ports = [
            {
                id: 'port_royale',
                name: 'Port Królewski',
                description: 'Główny węzeł handlowy archipelagu. Kupią tu każdy cenny towar.',
                x: 3000,
                y: 3000,
                radius: 220,
                dockX: 3000,
                dockY: 3160,
                dockRadius: 100,
                color: '#e67e22',
                islandRadius: 200,
                produces: ['wheat', 'tools'],
                demands: ['spices', 'gold', 'fish', 'wood', 'rum'],
                dockAngle: Math.PI / 2
            },
            {
                id: 'fish_village',
                name: 'Srebrna Ławica',
                description: 'Cicha osada rybacka. Obfitość świeżych ryb i soli.',
                x: 1300,
                y: 4500,
                radius: 170,
                dockX: 1380,
                dockY: 4400,
                dockRadius: 85,
                color: '#3498db',
                islandRadius: 150,
                produces: ['fish'],
                demands: ['wood', 'tools', 'rum'],
                dockAngle: -Math.PI / 4
            },
            {
                id: 'lumber_isle',
                name: 'Zielony Gaj',
                description: 'Gęste lasy dębowe i tartaki dostarczające drewno na statki.',
                x: 1100,
                y: 2200,
                radius: 190,
                dockX: 1220,
                dockY: 2260,
                dockRadius: 85,
                color: '#27ae60',
                islandRadius: 170,
                produces: ['wood'],
                demands: ['wheat', 'tools', 'fish'],
                dockAngle: Math.PI / 6
            },
            {
                id: 'iron_fortress',
                name: 'Żelazny Szczyt',
                description: 'Potężna twierdza na urwisku. Wydobywają rudę żelaza i kują narzędzia.',
                x: 3200,
                y: 1100,
                radius: 210,
                dockX: 3200,
                dockY: 1260,
                dockRadius: 90,
                color: '#7f8c8d',
                islandRadius: 190,
                produces: ['ore', 'tools'],
                demands: ['wheat', 'rum', 'spices'],
                dockAngle: Math.PI / 2
            },
            {
                id: 'tropical_lagoon',
                name: 'Szmaragdowa Laguna',
                description: 'Tropikalny raj słynący z unikalnych przypraw i pereł.',
                x: 4800,
                y: 4400,
                radius: 190,
                dockX: 4700,
                dockY: 4320,
                dockRadius: 85,
                color: '#1abc9c',
                islandRadius: 170,
                produces: ['spices', 'gold'],
                demands: ['tools', 'wheat', 'wood'],
                dockAngle: -3 * Math.PI / 4
            },
            {
                id: 'golden_shore',
                name: 'Złoty Brzeg',
                description: 'Bogate miasto kupieckie. Słynie z wybornego rumu i kawy.',
                x: 4900,
                y: 2300,
                radius: 180,
                dockX: 4780,
                dockY: 2300,
                dockRadius: 85,
                color: '#f39c12',
                islandRadius: 160,
                produces: ['rum', 'coffee'],
                demands: ['ore', 'wood', 'fish'],
                dockAngle: Math.PI
            },
            {
                id: 'north_lighthouse',
                name: 'Cichy Przylądek',
                description: 'Samotna placówka badawcza z potężną latarnią morską.',
                x: 1400,
                y: 950,
                radius: 140,
                dockX: 1470,
                dockY: 1020,
                dockRadius: 75,
                color: '#95a5a6',
                islandRadius: 120,
                produces: ['amber'],
                demands: ['rum', 'tools', 'wheat'],
                dockAngle: Math.PI / 4
            }
        ];

        // Wysepki bez portów (geografia i przeszkody)
        this.islands = [
            { x: 2100, y: 1900, radius: 110, type: 'atoll' },
            { x: 3900, y: 1900, radius: 130, type: 'rocky' },
            { x: 2300, y: 3900, radius: 100, type: 'sand' },
            { x: 3800, y: 3600, radius: 140, type: 'palm' },
            { x: 2000, y: 4900, radius: 90, type: 'rocky' },
            { x: 4200, y: 5100, radius: 110, type: 'sand' },
            { x: 4900, y: 1000, radius: 120, type: 'atoll' },
            { x: 800, y: 3300, radius: 95, type: 'rocky' },
            { x: 5300, y: 3500, radius: 105, type: 'palm' },
        ];

        // Rafy koralowe i skały podwodne (uszkadzają kadłub!)
        this.reefs = [
            { x: 2500, y: 2500, radius: 65 },
            { x: 2580, y: 2540, radius: 55 },
            { x: 3450, y: 2450, radius: 70 },
            { x: 2200, y: 3300, radius: 60 },
            { x: 3600, y: 4200, radius: 75 },
            { x: 1700, y: 1700, radius: 80 },
            { x: 1770, y: 1750, radius: 55 },
            { x: 4200, y: 2700, radius: 65 },
            { x: 4500, y: 1700, radius: 70 },
            { x: 2800, y: 4400, radius: 80 },
            { x: 3200, y: 4700, radius: 60 }
        ];

        // Boje nawigacyjne (migające światełka pomagające w nawigacji)
        this.buoys = [
            { x: 3000, y: 3350, color: '#2ecc71', flashPhase: 0 },
            { x: 3000, y: 2700, color: '#e74c3c', flashPhase: 0.5 },
            { x: 2800, y: 3100, color: '#f1c40f', flashPhase: 0.25 },
            { x: 3200, y: 3100, color: '#2ecc71', flashPhase: 0.75 },
            { x: 1450, y: 4250, color: '#2ecc71', flashPhase: 0.1 },
            { x: 1350, y: 2150, color: '#e74c3c', flashPhase: 0.3 },
            { x: 3200, y: 1450, color: '#2ecc71', flashPhase: 0.6 },
            { x: 4550, y: 4200, color: '#f1c40f', flashPhase: 0.8 },
            { x: 4650, y: 2300, color: '#2ecc71', flashPhase: 0.4 },
        ];

        // Dryfujące wrakowiska / skrzynie ze skarbem (pojawiają się na mapie)
        this.floatingTreasures = [];
        this.spawnFloatingTreasures(25);

        // Fauny morskie (delfiny i mewy)
        this.dolphins = [];
        this.spawnDolphins(12);

        this.birds = [];
        this.spawnBirds(30);

        // Wirek morski (przeszkoda / prąd wodny)
        this.whirlpools = [
            { x: 2600, y: 1600, radius: 130, strength: 2.8, angle: 0 },
            { x: 4100, y: 3200, radius: 120, strength: 2.5, angle: 0 }
        ];
    }

    spawnFloatingTreasures(count) {
        for (let i = 0; i < count; i++) {
            this.floatingTreasures.push({
                x: 600 + Math.random() * 4800,
                y: 600 + Math.random() * 4800,
                gold: 30 + Math.floor(Math.random() * 80),
                cargoType: Math.random() > 0.4 ? ['wood', 'fish', 'wheat', 'tools'][Math.floor(Math.random() * 4)] : null,
                bobOffset: Math.random() * Math.PI * 2,
                radius: 18
            });
        }
    }

    respawnTreasure(index) {
        this.floatingTreasures[index] = {
            x: 600 + Math.random() * 4800,
            y: 600 + Math.random() * 4800,
            gold: 30 + Math.floor(Math.random() * 90),
            cargoType: Math.random() > 0.4 ? ['wood', 'fish', 'wheat', 'rum', 'coffee'][Math.floor(Math.random() * 5)] : null,
            bobOffset: Math.random() * Math.PI * 2,
            radius: 18
        };
    }

    spawnDolphins(count) {
        for (let i = 0; i < count; i++) {
            this.dolphins.push({
                x: 1000 + Math.random() * 4000,
                y: 1000 + Math.random() * 4000,
                speed: 1.8 + Math.random() * 1.5,
                angle: Math.random() * Math.PI * 2,
                jumpTimer: Math.random() * 5,
                jumpState: 0
            });
        }
    }

    spawnBirds(count) {
        for (let i = 0; i < count; i++) {
            const port = this.ports[Math.floor(Math.random() * this.ports.length)];
            this.birds.push({
                x: port.x + (Math.random() - 0.5) * 400,
                y: port.y + (Math.random() - 0.5) * 400,
                homeX: port.x,
                homeY: port.y,
                speed: 2 + Math.random() * 1.5,
                angle: Math.random() * Math.PI * 2,
                wingPhase: Math.random() * Math.PI * 2
            });
        }
    }

    update(dt) {
        // Aktualizacja wirków morskich
        this.whirlpools.forEach(w => {
            w.angle += 1.5 * dt;
        });

        // Aktualizacja delfinów
        this.dolphins.forEach(d => {
            d.x += Math.cos(d.angle) * d.speed;
            d.y += Math.sin(d.angle) * d.speed;
            d.jumpTimer += dt;
            if (d.jumpTimer > 4) {
                d.jumpState = Math.sin((d.jumpTimer - 4) * Math.PI * 2);
                if (d.jumpTimer > 5) {
                    d.jumpTimer = Math.random() * 1.5;
                    d.angle += (Math.random() - 0.5) * 0.8;
                }
            }

            // Odbijanie od granic
            if (d.x < 300) d.angle = 0;
            if (d.x > this.width - 300) d.angle = Math.PI;
            if (d.y < 300) d.angle = Math.PI / 2;
            if (d.y > this.height - 300) d.angle = -Math.PI / 2;
        });

        // Aktualizacja ptaków / mew
        this.birds.forEach(b => {
            b.wingPhase += dt * 9;
            b.x += Math.cos(b.angle) * b.speed;
            b.y += Math.sin(b.angle) * b.speed;

            // Krążenie wokół bazy
            const dist = Math.hypot(b.x - b.homeX, b.y - b.homeY);
            if (dist > 500) {
                const targetAngle = Math.atan2(b.homeY - b.y, b.homeX - b.x);
                b.angle += (targetAngle - b.angle) * 0.03;
            } else {
                b.angle += (Math.random() - 0.5) * 0.1;
            }
        });
    }

    // Sprawdzanie kolizji ze stałym lądem i rafami
    checkCollision(x, y, radius = 15) {
        // Granice mapy
        if (x < 100 || x > this.width - 100 || y < 100 || y > this.height - 100) {
            return { hit: true, type: 'boundary', normal: { x: x < 100 ? 1 : (x > this.width - 100 ? -1 : 0), y: y < 100 ? 1 : (y > this.height - 100 ? -1 : 0) } };
        }

        // Porty (część lądowa za pomostem)
        for (const port of this.ports) {
            const d = Math.hypot(x - port.x, y - port.y);
            // Doki są bezpieczną strefą!
            const dockDist = Math.hypot(x - port.dockX, y - port.dockY);
            if (dockDist < port.dockRadius + 15) {
                continue; // Na pomoście nie rozbijamy się
            }
            if (d < port.islandRadius - 10) {
                const angle = Math.atan2(y - port.y, x - port.x);
                return {
                    hit: true,
                    type: 'island',
                    name: port.name,
                    normal: { x: Math.cos(angle), y: Math.sin(angle) },
                    overlap: (port.islandRadius - 10) - d
                };
            }
        }

        // Dzikie wyspy
        for (const isl of this.islands) {
            const d = Math.hypot(x - isl.x, y - isl.y);
            if (d < isl.radius - 12) {
                const angle = Math.atan2(y - isl.y, x - isl.x);
                return {
                    hit: true,
                    type: 'island',
                    normal: { x: Math.cos(angle), y: Math.sin(angle) },
                    overlap: (isl.radius - 12) - d
                };
            }
        }

        // Rafy koralowe i ostre skały (groźne)
        for (const reef of this.reefs) {
            const d = Math.hypot(x - reef.x, y - reef.y);
            if (d < reef.radius) {
                const angle = Math.atan2(y - reef.y, x - reef.x);
                return {
                    hit: true,
                    type: 'reef',
                    damage: 18,
                    normal: { x: Math.cos(angle), y: Math.sin(angle) },
                    overlap: reef.radius - d
                };
            }
        }

        return { hit: false };
    }

    // Sprawdza czy gracz znajduje się w strefie cumowania portu
    checkDockingZone(shipX, shipY) {
        for (const port of this.ports) {
            const dist = Math.hypot(shipX - port.dockX, shipY - port.dockY);
            if (dist < port.dockRadius) {
                return { inZone: true, port: port, distance: dist };
            }
        }
        return { inZone: false, port: null };
    }

    // Wpływ wirów morskich na statek
    applyWhirlpools(ship) {
        for (const w of this.whirlpools) {
            const dx = w.x - ship.x;
            const dy = w.y - ship.y;
            const dist = Math.hypot(dx, dy);
            if (dist < w.radius * 1.8) {
                const force = (1 - dist / (w.radius * 1.8)) * w.strength;
                // Siła przyciągania do centrum
                ship.vx += (dx / dist) * force * 0.4;
                ship.vy += (dy / dist) * force * 0.4;
                // Ruch wirowy wokół osi
                ship.vx += (-dy / dist) * force * 0.7;
                ship.vy += (dx / dist) * force * 0.7;
                ship.angle += 0.02 * force;
            }
        }
    }
}

window.WorldMap = WorldMap;

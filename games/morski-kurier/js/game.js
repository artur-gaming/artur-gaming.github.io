/**
 * Główny Silnik Gry Morskiej
 */

class SeaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Rozdzielczość
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Moduły gry
        this.worldMap = new WorldMap();
        this.weather = new WeatherEngine();
        this.economy = new EconomyEngine(this.worldMap);

        // Statek gracza startuje przy kei w Port Królewski
        this.ship = new Ship(3000, 3230);
        this.ship.angle = -Math.PI / 2; // Skierowany w stronę doku / portu

        // Kamera
        this.camera = {
            x: this.ship.x - this.canvas.width / 2,
            y: this.ship.y - this.canvas.height / 2,
            targetX: 0,
            targetY: 0,
            zoom: 1.0
        };

        // Klawisze i wejście
        this.keys = {};
        this.setupInput();

        // Stan gry
        this.isDocked = false;
        this.currentDockedPort = null;
        this.isMapExpanded = false;
        this.lastTime = performance.now();
        this.toasts = [];

        // UI powiadomienia
        this.floatingTexts = [];

        // Ostatnio sprawdzany port dla podpowiedzi dokowania
        this.nearbyPort = null;

        this.initUI();
        this.showToast('Witaj na morzu Kapitanie! Użyj W/S do sterowania żaglami, A/D do steru.');
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            // Inicjalizacja dźwięku przy pierwszej interakcji
            if (window.soundEngine && !window.soundEngine.initialized) {
                window.soundEngine.init();
            }

            // Klawisz Space - dokowanie lub kotwica
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isDocked) {
                    this.undock();
                } else if (this.nearbyPort) {
                    this.dockAtPort(this.nearbyPort);
                } else {
                    this.ship.isAnchored = !this.ship.isAnchored;
                    this.showToast(this.ship.isAnchored ? 'Rzucono kotwicę!' : 'Podniesiono kotwicę!');
                }
            }

            // Klawisz H - Róg mgłowy
            if (e.key.toLowerCase() === 'h') {
                if (window.soundEngine) window.soundEngine.playHorn();
                this.addFloatingText(this.ship.x, this.ship.y - 40, '📢 TUUU-T!', '#f1c40f');
            }

            // Klawisz F - Światła okrętowe (reflektor dziobowy i latarnie nawigacyjne)
            if (e.key.toLowerCase() === 'f' && !e.repeat) {
                this.toggleShipLights();
            }

            // Klawisz M - Powiększenie mapy
            if (e.key.toLowerCase() === 'm') {
                this.toggleExpandedMap();
            }

            // Klawisz Escape - Zamknij okna
            if (e.key === 'Escape') {
                if (this.isDocked) this.undock();
                if (this.isMapExpanded) this.toggleExpandedMap();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        // Obsługa sterowania dotykowego na ekranie
        this.setupTouchControls();
    }

    setupTouchControls() {
        const bindButton = (id, onDown, onUp) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const start = (e) => { e.preventDefault(); onDown(); };
            const end = (e) => { e.preventDefault(); onUp(); };
            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };

        bindButton('btn-gas', () => { this.keys['w'] = true; }, () => { this.keys['w'] = false; });
        bindButton('btn-reverse', () => { this.keys['s'] = true; }, () => { this.keys['s'] = false; });
        bindButton('btn-left', () => { this.keys['a'] = true; }, () => { this.keys['a'] = false; });
        bindButton('btn-right', () => { this.keys['d'] = true; }, () => { this.keys['d'] = false; });
        bindButton('btn-horn', () => { if (window.soundEngine) window.soundEngine.playHorn(); }, () => {});
        bindButton('btn-lights', () => { this.toggleShipLights(); }, () => {});
        bindButton('btn-anchor', () => {
            if (this.nearbyPort) this.dockAtPort(this.nearbyPort);
            else this.ship.isAnchored = !this.ship.isAnchored;
        }, () => {});
    }

    toggleShipLights() {
        this.ship.lightsOn = !this.ship.lightsOn;
        if (window.soundEngine) {
            window.soundEngine.init();
            window.soundEngine.playSwitch(this.ship.lightsOn);
        }
        const stateText = this.ship.lightsOn ? '💡 ŚWIATŁA WŁ.' : '🌑 ŚWIATŁA WYŁ.';
        this.addFloatingText(this.ship.x, this.ship.y - 40, stateText, this.ship.lightsOn ? '#fff59d' : '#95a5a6');

        const lightsBtn = document.getElementById('lights-toggle-btn');
        if (lightsBtn) {
            lightsBtn.style.background = this.ship.lightsOn ? '#f39c12' : '';
            lightsBtn.title = this.ship.lightsOn ? 'Światła włączone [F]' : 'Światła wyłączone [F]';
        }
    }

    initUI() {
        // Przycisk Start Rejsu
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const welcomeModal = document.getElementById('welcome-modal');
                if (welcomeModal) welcomeModal.classList.add('hidden');
                if (window.soundEngine) {
                    window.soundEngine.init();
                    window.soundEngine.playBell();
                }
                this.showToast('Pomyślnych wiatrów! Płyń do molo Portu Królewskiego i weź pierwsze zlecenie.');
            });
        }

        // Przycisk wyciszania
        const muteBtn = document.getElementById('mute-toggle-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                if (window.soundEngine) {
                    window.soundEngine.init();
                    const isMuted = window.soundEngine.toggleMute();
                    muteBtn.textContent = isMuted ? '🔇' : '🔊';
                }
            });
        }

        // Przycisk świateł w górnym HUD
        const lightsBtn = document.getElementById('lights-toggle-btn');
        if (lightsBtn) {
            lightsBtn.addEventListener('click', () => {
                this.toggleShipLights();
            });
        }

        // Przycisk zamykania portu
        const closePortBtn = document.getElementById('close-port-modal');
        if (closePortBtn) {
            closePortBtn.addEventListener('click', () => this.undock());
        }

        // Zakładki w porcie
        const tabs = document.querySelectorAll('.port-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.port-tab-pane').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                const pane = document.getElementById(targetId);
                if (pane) pane.classList.add('active');
            });
        });

        // Przycisk pełnej mapy
        const minimapBox = document.getElementById('minimap-container');
        if (minimapBox) {
            minimapBox.addEventListener('click', () => this.toggleExpandedMap());
        }

        // Przycisk naprawy statku w HUD
        const quickRepairBtn = document.getElementById('quick-repair-btn');
        if (quickRepairBtn) {
            quickRepairBtn.addEventListener('click', () => {
                if (this.isDocked) {
                    const res = this.economy.repairShip(this.ship);
                    this.showToast(res.msg);
                    this.updatePortView();
                    this.updateHUD();
                } else {
                    this.showToast('Naprawy możliwe są wyłącznie po zawinięciu do portu!');
                }
            });
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        toast.innerHTML = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 3600);
    }

    addFloatingText(worldX, worldY, text, color = '#f1c40f') {
        this.floatingTexts.push({
            x: worldX,
            y: worldY,
            text: text,
            color: color,
            life: 1.5,
            maxLife: 1.5
        });
    }

    toggleExpandedMap() {
        this.isMapExpanded = !this.isMapExpanded;
        const expandedMap = document.getElementById('expanded-map-modal');
        if (expandedMap) {
            expandedMap.classList.toggle('hidden', !this.isMapExpanded);
            if (this.isMapExpanded) this.renderFullWorldMap();
        }
    }

    dockAtPort(port) {
        if (this.isDocked) return;
        this.isDocked = true;
        this.currentDockedPort = port;
        this.ship.isAnchored = true;
        this.ship.vx = 0;
        this.ship.vy = 0;

        if (window.soundEngine) window.soundEngine.playBell();

        // Sprawdź czy zrealizowano jakieś zlecenia w tym porcie!
        const delivered = this.economy.checkDeliveriesAtPort(port.id, this.ship);
        if (delivered.length > 0) {
            delivered.forEach(d => {
                const bonusTxt = d.withBonus ? ' (z bonusem za czas!)' : '';
                this.showToast(`🎉 Zlecenie dostarczone do ${port.name}: +${d.earned}🪙${bonusTxt}`, 'success');
                this.addFloatingText(this.ship.x, this.ship.y - 60, `+${d.earned}🪙`, '#2ecc71');
            });
        }

        // Pokaż modal portowy
        const modal = document.getElementById('port-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updatePortView();
        }
        this.updateHUD();
    }

    undock() {
        this.isDocked = false;
        this.currentDockedPort = null;
        this.ship.isAnchored = false;
        const modal = document.getElementById('port-modal');
        if (modal) modal.classList.add('hidden');
        this.showToast('Wypłynięto na szerokie wody!');
    }

    updatePortView() {
        if (!this.currentDockedPort) return;
        const port = this.currentDockedPort;

        document.getElementById('port-title').textContent = port.name;
        document.getElementById('port-desc').textContent = port.description;

        // Zakładka Zleceń
        this.renderContractsTab(port);

        // Zakładka Rynku
        this.renderMarketTab(port);

        // Zakładka Stoczni
        this.renderShipyardTab();
    }

    renderContractsTab(port) {
        const list = document.getElementById('contracts-list');
        if (!list) return;
        list.innerHTML = '';

        const contracts = this.economy.availableContracts[port.id] || [];
        if (contracts.length === 0) {
            list.innerHTML = '<div class="empty-state">Brak nowych zleceń w tawernie. Spróbuj później lub odwiedź inny port.</div>';
            return;
        }

        contracts.forEach(contract => {
            const card = document.createElement('div');
            card.className = 'contract-card';
            const good = this.economy.goods[contract.cargoType];
            const dist = Math.round(Math.hypot(
                this.worldMap.ports.find(p => p.id === contract.destPortId).dockX - port.dockX,
                this.worldMap.ports.find(p => p.id === contract.destPortId).dockY - port.dockY
            ) / 10);

            card.innerHTML = `
                <div class="contract-header">
                    <span class="cargo-badge">${good.icon} ${contract.crates}x ${good.name}</span>
                    <span class="reward-badge">+${contract.reward} 🪙</span>
                </div>
                <div class="contract-info">
                    <p>🎯 <strong>Cel:</strong> ${contract.destPortName} (${dist} mil morskich)</p>
                    <p>⏳ <strong>Limit czasu:</strong> ${contract.timeLimit}s (+${contract.bonusReward} 🪙 premii ekspresowej)</p>
                </div>
                <button class="btn btn-primary accept-contract-btn" data-id="${contract.id}">Przyjmij zlecenie</button>
            `;
            list.appendChild(card);
        });

        list.querySelectorAll('.accept-contract-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const res = this.economy.acceptContract(id, port.id, this.ship);
                this.showToast(res.msg, res.success ? 'success' : 'warn');
                this.updatePortView();
                this.updateHUD();
            });
        });
    }

    renderMarketTab(port) {
        const marketTable = document.getElementById('market-items-list');
        if (!marketTable) return;
        marketTable.innerHTML = '';

        const market = this.economy.portMarkets[port.id] || {};
        for (const [key, itemData] of Object.entries(market)) {
            const good = this.economy.goods[key];
            const isProduced = port.produces.includes(key);
            const isDemanded = port.demands.includes(key);

            const row = document.createElement('div');
            row.className = 'market-row';
            row.innerHTML = `
                <div class="market-col-item">
                    <span class="item-icon">${good.icon}</span>
                    <div>
                        <strong>${good.name}</strong>
                        ${isProduced ? '<span class="tag tag-produce">Produkcja</span>' : ''}
                        ${isDemanded ? '<span class="tag tag-demand">Duży popyt</span>' : ''}
                    </div>
                </div>
                <div class="market-col-stock">${itemData.stock} szt.</div>
                <div class="market-col-price">${itemData.buyPrice} 🪙</div>
                <div class="market-col-price">${itemData.sellPrice} 🪙</div>
                <div class="market-col-actions">
                    <button class="btn btn-sm btn-success buy-btn" data-key="${key}" ${itemData.stock <= 0 ? 'disabled' : ''}>Kup</button>
                </div>
            `;
            marketTable.appendChild(row);
        }

        marketTable.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.getAttribute('data-key');
                const res = this.economy.buyGood(port.id, key, this.ship);
                this.showToast(res.msg, res.success ? 'success' : 'warn');
                this.updatePortView();
                this.updateHUD();
            });
        });

        // Lista ładunku na naszym statku do sprzedaży
        const cargoSellList = document.getElementById('ship-cargo-sell-list');
        if (cargoSellList) {
            cargoSellList.innerHTML = '';
            if (this.ship.cargo.length === 0) {
                cargoSellList.innerHTML = '<span class="text-muted">Twoja ładownia jest pusta.</span>';
            } else {
                this.ship.cargo.forEach((cType, idx) => {
                    const g = this.economy.goods[cType];
                    const price = market[cType] ? market[cType].sellPrice : Math.round(g.basePrice * 0.7);
                    const tag = document.createElement('div');
                    tag.className = 'cargo-sell-chip';
                    tag.innerHTML = `
                        <span>${g.icon} ${g.name} (+${price}🪙)</span>
                        <button class="sell-chip-btn" data-idx="${idx}">Sprzedaj</button>
                    `;
                    cargoSellList.appendChild(tag);
                });

                cargoSellList.querySelectorAll('.sell-chip-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = parseInt(e.target.getAttribute('data-idx'));
                        const res = this.economy.sellGood(port.id, idx, this.ship);
                        this.showToast(res.msg, res.success ? 'success' : 'warn');
                        this.updatePortView();
                        this.updateHUD();
                    });
                });
            }
        }
    }

    renderShipyardTab() {
        // Naprawa
        const repairCostPerHp = 0.8;
        const missingHp = this.ship.maxHp - this.ship.hp;
        const repairCost = Math.ceil(missingHp * repairCostPerHp);
        const repairBtn = document.getElementById('shipyard-repair-btn');
        const repairText = document.getElementById('shipyard-repair-info');
        if (repairBtn && repairText) {
            repairText.innerHTML = `Stan kadłuba: <strong>${Math.round(this.ship.hp)} / ${this.ship.maxHp} HP</strong> (Koszt pełnej naprawy: <strong>${repairCost} 🪙</strong>)`;
            repairBtn.disabled = missingHp <= 0;
            repairBtn.onclick = () => {
                const res = this.economy.repairShip(this.ship);
                this.showToast(res.msg, res.success ? 'success' : 'warn');
                this.renderShipyardTab();
                this.updateHUD();
            };
        }

        // Ulepszenia statku
        const upgradeList = document.getElementById('ship-upgrades-list');
        if (upgradeList) {
            upgradeList.innerHTML = '';
            const upgradeNames = {
                sails: { name: 'Nowe żagle i osprzęt', desc: '+Prędkość maksymalna i zrywność' },
                hull: { name: 'Dębowy pancerz kadłuba', desc: '+Pula punktów życia i ochrona przed rafami' },
                hold: { name: 'Rozbudowa ładowni', desc: '+Miejsca na towary i skrzynie' },
                radar: { name: 'Luneta kapitańska i kompas', desc: '+Zasięg widzenia na minimapie' }
            };

            for (const [key, info] of Object.entries(upgradeNames)) {
                const lvl = this.ship.upgrades[key];
                const costs = this.economy.upgradeCosts[key];
                const maxLvl = costs.length - 1;
                const nextCost = lvl < maxLvl ? costs[lvl] : 'MAX';

                const item = document.createElement('div');
                item.className = 'upgrade-item';
                item.innerHTML = `
                    <div class="upgrade-info">
                        <strong>${info.name} (Poz. ${lvl}/${maxLvl})</strong>
                        <p class="text-muted">${info.desc}</p>
                    </div>
                    <button class="btn btn-sm btn-primary buy-upgrade-btn" data-type="${key}" ${lvl >= maxLvl ? 'disabled' : ''}>
                        ${lvl >= maxLvl ? 'Maksymalny' : `Kup (${nextCost} 🪙)`}
                    </button>
                `;
                upgradeList.appendChild(item);
            }

            upgradeList.querySelectorAll('.buy-upgrade-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const type = e.target.getAttribute('data-type');
                    const res = this.economy.buyShipUpgrade(type, this.ship);
                    this.showToast(res.msg, res.success ? 'success' : 'warn');
                    this.renderShipyardTab();
                    this.updateHUD();
                });
            });
        }

        // Nowe statki
        const newShipsList = document.getElementById('new-ships-catalog');
        if (newShipsList) {
            newShipsList.innerHTML = '';
            this.economy.shipyardCatalog.forEach(catalogItem => {
                const card = document.createElement('div');
                card.className = `ship-card ${this.ship.tier === catalogItem.tier ? 'current-ship' : ''}`;
                card.innerHTML = `
                    <h4>${catalogItem.name}</h4>
                    <p class="text-muted">${catalogItem.desc}</p>
                    <div class="ship-stats">
                        <span>📦 Ładownia: <strong>${catalogItem.hold}</strong></span>
                        <span>⚡ Prędkość: <strong>${catalogItem.speed} w.</strong></span>
                        <span>🛡️ Kadłub: <strong>${catalogItem.hp} HP</strong></span>
                    </div>
                    <div class="ship-card-footer">
                        <span class="ship-price">${catalogItem.price > 0 ? `${catalogItem.price} 🪙` : 'Początkowy'}</span>
                        <button class="btn btn-sm btn-warning buy-ship-btn" data-tier="${catalogItem.tier}" ${this.ship.tier >= catalogItem.tier ? 'disabled' : ''}>
                            ${this.ship.tier === catalogItem.tier ? 'Posiadany' : (this.ship.tier > catalogItem.tier ? 'Mniejszy' : 'Kup')}
                        </button>
                    </div>
                `;
                newShipsList.appendChild(card);
            });

            newShipsList.querySelectorAll('.buy-ship-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tier = parseInt(e.target.getAttribute('data-tier'));
                    const res = this.economy.buyNewShip(tier, this.ship);
                    this.showToast(res.msg, res.success ? 'success' : 'warn');
                    this.renderShipyardTab();
                    this.updateHUD();
                });
            });
        }
    }

    update(dt) {
        if (!this.isDocked) {
            // Sterowanie
            let throttle = 0;
            if (this.keys['w'] || this.keys['arrowup']) throttle += 1;
            if (this.keys['s'] || this.keys['arrowdown']) throttle -= 1;

            let rudder = 0;
            if (this.keys['a'] || this.keys['arrowleft']) rudder -= 1;
            if (this.keys['d'] || this.keys['arrowright']) rudder += 1;

            this.ship.throttle = throttle;
            this.ship.rudder = rudder;

            // Wiatr
            const wind = this.weather.getWindVector();
            this.ship.update(dt, wind.x, wind.y);

            // Wpływ wirów wodnych
            this.worldMap.applyWhirlpools(this.ship);

            // Kolizje z lądem i rafami
            const col = this.worldMap.checkCollision(this.ship.x, this.ship.y, 16);
            if (col.hit) {
                if (this.ship.speed > 0.6 && this.ship.collisionCooldown <= 0) {
                    const dmg = col.damage || Math.round(this.ship.speed * 6);
                    const taken = this.ship.takeDamage(dmg);
                    this.ship.collisionCooldown = 0.8;
                    if (window.soundEngine) window.soundEngine.playCrash();
                    this.showToast(`💥 Kolizja z ${col.type === 'reef' ? 'rafą koralową' : 'wybrzeżem'}! -${taken} HP!`, 'error');
                    this.addFloatingText(this.ship.x, this.ship.y, `-${taken} HP`, '#e74c3c');
                }

                // Odepchnij statek
                if (col.normal) {
                    this.ship.x += col.normal.x * 2.5;
                    this.ship.y += col.normal.y * 2.5;
                    this.ship.vx *= -0.3;
                    this.ship.vy *= -0.3;
                }
            }

            // Sprawdzenie czy gracz nie zatonął
            if (this.ship.hp <= 0) {
                this.handleShipwreck();
            }

            // Podnoszenie pływających skarbów / ładunków z wody
            this.worldMap.floatingTreasures.forEach((tr, i) => {
                const dist = Math.hypot(this.ship.x - tr.x, this.ship.y - tr.y);
                if (dist < 35) {
                    // Podniesiono!
                    this.economy.gold += tr.gold;
                    this.economy.totalEarned += tr.gold;
                    let extraTxt = '';
                    if (tr.cargoType && this.ship.cargo.length < this.ship.cargoCapacity) {
                        this.ship.cargo.push(tr.cargoType);
                        extraTxt = ` oraz ${this.economy.goods[tr.cargoType].name}`;
                    }
                    if (window.soundEngine) window.soundEngine.playCash();
                    this.showToast(`⚓ Wyłowiono pływające zapasy: +${tr.gold}🪙${extraTxt}!`, 'success');
                    this.addFloatingText(this.ship.x, this.ship.y - 30, `+${tr.gold}🪙`, '#f1c40f');
                    this.worldMap.respawnTreasure(i);
                }
            });

            // Sprawdzanie strefy dokowania
            const dockCheck = this.worldMap.checkDockingZone(this.ship.x, this.ship.y);
            this.nearbyPort = dockCheck.inZone ? dockCheck.port : null;

            const dockPrompt = document.getElementById('dock-prompt');
            if (dockPrompt) {
                if (this.nearbyPort) {
                    dockPrompt.classList.remove('hidden');
                    dockPrompt.innerHTML = `⚓ Naciśnij <strong>[SPACJA]</strong> lub kliknij tutaj, aby zawinąć do <strong>${this.nearbyPort.name}</strong>`;
                    dockPrompt.onclick = () => this.dockAtPort(this.nearbyPort);
                } else {
                    dockPrompt.classList.add('hidden');
                }
            }
        }

        // Aktualizacja mapy i pogody
        this.worldMap.update(dt);
        this.weather.update(dt);
        this.economy.updateContracts(dt);

        // Płynne śledzenie kamery
        const leadDist = this.ship.speed * 30;
        const targetCamX = this.ship.x + Math.cos(this.ship.angle) * leadDist - this.canvas.width / 2;
        const targetCamY = this.ship.y + Math.sin(this.ship.angle) * leadDist - this.canvas.height / 2;
        this.camera.x += (targetCamX - this.camera.x) * 0.08;
        this.camera.y += (targetCamY - this.camera.y) * 0.08;

        // Aktualizacja unoszących się tekstów
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            ft.y -= dt * 25;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }

        // Aktualizacja interfejsu użytkownika
        this.updateHUD();
    }

    handleShipwreck() {
        this.showToast('☠️ TWÓJ STATEK ZATONĄŁ! Ratownicy odholowali cię do Portu Królewskiego.', 'error');
        this.ship.x = 3000;
        this.ship.y = 3280;
        this.ship.vx = 0;
        this.ship.vy = 0;
        this.ship.hp = Math.round(this.ship.maxHp * 0.5);
        // Tracimy połowę ładunku
        this.ship.cargo = this.ship.cargo.slice(0, Math.floor(this.ship.cargo.length / 2));
    }

    updateHUD() {
        // Prędkość w węzłach
        const knots = (this.ship.speed * 2.2).toFixed(1);
        const speedElem = document.getElementById('hud-speed');
        if (speedElem) speedElem.textContent = `${knots} w.`;

        // Złoto
        const goldElem = document.getElementById('hud-gold');
        if (goldElem) goldElem.textContent = this.economy.gold;

        // Kadłub HP
        const hpFill = document.getElementById('hud-hp-fill');
        const hpText = document.getElementById('hud-hp-text');
        if (hpFill && hpText) {
            const pct = Math.max(0, Math.min(100, (this.ship.hp / this.ship.maxHp) * 100));
            hpFill.style.width = `${pct}%`;
            hpText.textContent = `${Math.round(this.ship.hp)} / ${this.ship.maxHp}`;
            if (pct < 30) hpFill.style.backgroundColor = '#e74c3c';
            else if (pct < 60) hpFill.style.backgroundColor = '#f39c12';
            else hpFill.style.backgroundColor = '#2ecc71';
        }

        // Ładownia
        const cargoFill = document.getElementById('hud-cargo-slots');
        if (cargoFill) {
            cargoFill.innerHTML = '';
            for (let i = 0; i < this.ship.cargoCapacity; i++) {
                const slot = document.createElement('div');
                slot.className = 'cargo-slot';
                if (i < this.ship.cargo.length) {
                    const itemKey = this.ship.cargo[i];
                    const good = this.economy.goods[itemKey];
                    slot.classList.add('occupied');
                    slot.title = good ? good.name : itemKey;
                    slot.textContent = good ? good.icon : '📦';
                }
                cargoFill.appendChild(slot);
            }
        }

        // Kompas i wskaźnik celu misji
        this.updateCompass();

        // Lista aktywnych misji w prawym panelu
        this.updateMissionsPanel();

        // Rysowanie minimapy
        this.renderMinimap();
    }

    updateCompass() {
        const compassRose = document.getElementById('compass-rose');
        if (compassRose) {
            // Obrót róży wiatrów przeciwny do obrotu statku
            compassRose.style.transform = `rotate(${-this.ship.angle - Math.PI / 2}rad)`;
        }

        const missionArrow = document.getElementById('mission-pointer-arrow');
        if (missionArrow) {
            if (this.economy.activeContracts.length > 0) {
                // Skieruj strzałkę na cel pierwszego zlecenia
                const activeContract = this.economy.activeContracts[0];
                const destPort = this.worldMap.ports.find(p => p.id === activeContract.destPortId);
                if (destPort) {
                    const dx = destPort.dockX - this.ship.x;
                    const dy = destPort.dockY - this.ship.y;
                    const targetAngle = Math.atan2(dy, dx);
                    const relAngle = targetAngle - this.ship.angle;
                    missionArrow.style.display = 'block';
                    missionArrow.style.transform = `rotate(${relAngle}rad)`;
                }
            } else {
                missionArrow.style.display = 'none';
            }
        }

        // Wiatr na HUD
        const windArrow = document.getElementById('hud-wind-arrow');
        const windText = document.getElementById('hud-wind-text');
        if (windArrow && windText) {
            const wind = this.weather.getWindVector();
            windArrow.style.transform = `rotate(${wind.angle}rad)`;
            windText.textContent = `${(wind.speed * 8).toFixed(0)} w.`;
        }
    }

    updateMissionsPanel() {
        const panel = document.getElementById('active-missions-panel');
        if (!panel) return;

        if (this.economy.activeContracts.length === 0) {
            panel.innerHTML = '<div class="no-missions-hint">Brak aktywnych zleceń.<br>Zawijaj do portów po kontrakty!</div>';
            return;
        }

        panel.innerHTML = '';
        this.economy.activeContracts.forEach(contract => {
            const destPort = this.worldMap.ports.find(p => p.id === contract.destPortId);
            const dist = destPort ? Math.round(Math.hypot(destPort.dockX - this.ship.x, destPort.dockY - this.ship.y) / 10) : 0;
            const card = document.createElement('div');
            card.className = 'active-mission-card';

            const timeLeftStr = contract.timeLeft > 0 ? `${Math.ceil(contract.timeLeft)}s` : '<span style="color:#e74c3c">Czas minął (brak premii)</span>';

            card.innerHTML = `
                <div class="mission-hdr">
                    <span>${contract.cargoIcon} ${contract.crates}x ${contract.cargoName}</span>
                    <span class="mission-reward">+${contract.reward} 🪙</span>
                </div>
                <div class="mission-sub">
                    <span>🎯 ${contract.destPortName} (${dist} mil)</span>
                    <span>⏳ ${timeLeftStr}</span>
                </div>
            `;
            panel.appendChild(card);
        });
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Rysowanie oceanu i fal
        this.renderOcean(ctx);

        // Zastosowanie transformacji kamery dla obiektów w świecie gry
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);

        // 2. Rysowanie wirków wodnych
        this.renderWhirlpools(ctx);

        // 3. Rysowanie dzikich wysp i raf
        this.renderWildIslandsAndReefs(ctx);

        // 4. Rysowanie portów i miast
        this.renderPorts(ctx);

        // 5. Rysowanie boi nawigacyjnych
        this.renderBuoys(ctx);

        // 6. Rysowanie dryfujących skrzyń i wraków
        this.renderTreasures(ctx);

        // 7. Rysowanie fauny (delfiny i ptaki)
        this.renderFauna(ctx);

        // 8. Rysowanie statku gracza
        this.ship.render(ctx);

        // 9. Unoszące się teksty (obrażenia, monety)
        for (const ft of this.floatingTexts) {
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }

        ctx.restore();

        // 10. Warstwa atmosferyczna (noc, latarnie, deszcz)
        this.weather.renderLightingLayer(ctx, this.canvas.width, this.canvas.height, this.ship, this.worldMap, this.camera);
    }

    renderOcean(ctx) {
        // Tło oceanu
        ctx.fillStyle = '#1e6f9f';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Siatka fal morskich płynących z ruchem kamery
        const camX = this.camera.x;
        const camY = this.camera.y;
        const spacing = 80;
        const startX = -((camX % spacing) + spacing);
        const startY = -((camY % spacing) + spacing);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;

        for (let x = startX; x < this.canvas.width + spacing; x += spacing) {
            for (let y = startY; y < this.canvas.height + spacing; y += spacing) {
                const worldX = x + camX;
                const worldY = y + camY;
                const waveOffset = Math.sin((worldX + worldY) * 0.005 + this.weather.wavePhase) * 6;

                ctx.beginPath();
                ctx.moveTo(x + waveOffset, y);
                ctx.quadraticCurveTo(x + 12 + waveOffset, y - 4, x + 24 + waveOffset, y);
                ctx.stroke();
            }
        }
    }

    renderWhirlpools(ctx) {
        this.worldMap.whirlpools.forEach(w => {
            ctx.save();
            ctx.translate(w.x, w.y);
            ctx.rotate(w.angle);

            for (let r = w.radius; r > 10; r -= 18) {
                ctx.strokeStyle = `rgba(160, 230, 255, ${0.15 + (1 - r / w.radius) * 0.4})`;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 1.5);
                ctx.stroke();
            }

            // Ciemne oko wiru
            ctx.fillStyle = '#0a2a4a';
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    renderWildIslandsAndReefs(ctx) {
        // Rafy
        this.worldMap.reefs.forEach(r => {
            ctx.fillStyle = '#4a6572';
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.fill();

            // Piana morska na rafach
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Ostre skały
            ctx.fillStyle = '#2d3436';
            for (let i = 0; i < 5; i++) {
                const ang = i * 1.25;
                const dist = r.radius * 0.45;
                ctx.beginPath();
                ctx.arc(r.x + Math.cos(ang) * dist, r.y + Math.sin(ang) * dist, 7, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Dzikie wyspy
        this.worldMap.islands.forEach(isl => {
            // Piaszczysta plaża
            ctx.fillStyle = '#f7d794';
            ctx.beginPath();
            ctx.arc(isl.x, isl.y, isl.radius, 0, Math.PI * 2);
            ctx.fill();

            // Płytka woda wokół wyspy (lazurowa)
            ctx.strokeStyle = 'rgba(100, 220, 220, 0.3)';
            ctx.lineWidth = 14;
            ctx.stroke();

            // Środek - zieleń / palmy
            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(isl.x, isl.y, isl.radius * 0.75, 0, Math.PI * 2);
            ctx.fill();

            // Drzewa
            for (let i = 0; i < 6; i++) {
                const ang = i * 1.05;
                const d = isl.radius * 0.4;
                ctx.fillStyle = '#1e824c';
                ctx.beginPath();
                ctx.arc(isl.x + Math.cos(ang) * d, isl.y + Math.sin(ang) * d, 11, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    renderPorts(ctx) {
        this.worldMap.ports.forEach(port => {
            // 1. Plaża wyspy portowej
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.arc(port.x, port.y, port.islandRadius, 0, Math.PI * 2);
            ctx.fill();

            // Płytka woda przybrzeżna
            ctx.strokeStyle = 'rgba(64, 224, 208, 0.35)';
            ctx.lineWidth = 18;
            ctx.stroke();

            // Ląd i zabudowania
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(port.x, port.y, port.islandRadius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Budynki portowe (kolorowe dachy)
            const bldCount = 8;
            for (let i = 0; i < bldCount; i++) {
                const ang = (i / bldCount) * Math.PI * 2;
                const d = port.islandRadius * 0.45;
                const bx = port.x + Math.cos(ang) * d;
                const by = port.y + Math.sin(ang) * d;

                ctx.fillStyle = '#c0392b';
                ctx.fillRect(bx - 10, by - 8, 20, 16);
                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(bx - 7, by - 5, 14, 10);
            }

            // Główny ratusz / twierdza w centrum
            ctx.fillStyle = '#34495e';
            ctx.fillRect(port.x - 18, port.y - 18, 36, 36);
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.moveTo(port.x - 22, port.y - 18);
            ctx.lineTo(port.x, port.y - 34);
            ctx.lineTo(port.x + 22, port.y - 18);
            ctx.closePath();
            ctx.fill();

            // 2. Molo / Drewniany pomost doku
            ctx.save();
            ctx.strokeStyle = '#5c3a21';
            ctx.lineWidth = 18;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(port.x, port.y);
            ctx.lineTo(port.dockX, port.dockY);
            ctx.stroke();

            // Drewniane deski na pomostach
            ctx.strokeStyle = '#8B5A2B';
            ctx.lineWidth = 14;
            ctx.stroke();
            ctx.restore();

            // 3. Strefa cumowania (pulsujący pierścień do cumowania)
            const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
            ctx.strokeStyle = `rgba(46, 204, 113, ${pulse})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.arc(port.dockX, port.dockY, port.dockRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Pławik cumowniczy
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(port.dockX, port.dockY, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Latarnia morska w pobliżu molo
            const lx = port.dockX + Math.cos(port.dockAngle + Math.PI / 2) * 40;
            const ly = port.dockY + Math.sin(port.dockAngle + Math.PI / 2) * 40;

            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(lx - 6, ly - 20, 12, 20);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(lx - 6, ly - 14, 12, 6);
            // Światełko latarni
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(lx, ly - 22, 6, 0, Math.PI * 2);
            ctx.fill();

            // Etykieta nazwy portu
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(port.dockX - 60, port.dockY + 22, 120, 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(port.name, port.dockX, port.dockY + 38);
        });
    }

    renderBuoys(ctx) {
        this.worldMap.buoys.forEach(b => {
            const flash = Math.sin(Date.now() * 0.004 + b.flashPhase * Math.PI * 2);
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
            ctx.fill();

            if (flash > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.7})`;
                ctx.beginPath();
                ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    renderTreasures(ctx) {
        this.worldMap.floatingTreasures.forEach(tr => {
            const bob = Math.sin(Date.now() * 0.003 + tr.bobOffset) * 3;
            ctx.save();
            ctx.translate(tr.x, tr.y + bob);

            // Cień na wodzie
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(3, 4, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Drewniana skrzynia
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-8, -8, 16, 16);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-8, -8, 16, 16);

            // Błysk skarbów
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, -9, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    renderFauna(ctx) {
        // Delfiny
        this.worldMap.dolphins.forEach(d => {
            if (d.jumpState > 0.1) {
                ctx.save();
                ctx.translate(d.x, d.y);
                ctx.rotate(d.angle);
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                // Płetwa
                ctx.fillRect(-2, -7, 4, 6);
                ctx.restore();
            }
        });

        // Mewy
        this.worldMap.birds.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle);

            const wingY = Math.sin(b.wingPhase) * 5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, wingY);
            ctx.lineTo(0, 0);
            ctx.lineTo(6, wingY);
            ctx.stroke();

            ctx.restore();
        });
    }

    renderMinimap() {
        const miniCanvas = document.getElementById('minimap-canvas');
        if (!miniCanvas) return;
        const mctx = miniCanvas.getContext('2d');
        const mw = miniCanvas.width;
        const mh = miniCanvas.height;

        mctx.fillStyle = '#1e6f9f';
        mctx.fillRect(0, 0, mw, mh);

        const scaleX = mw / this.worldMap.width;
        const scaleY = mh / this.worldMap.height;

        // Wyspy
        mctx.fillStyle = '#27ae60';
        this.worldMap.islands.forEach(isl => {
            mctx.beginPath();
            mctx.arc(isl.x * scaleX, isl.y * scaleY, Math.max(2, isl.radius * scaleX), 0, Math.PI * 2);
            mctx.fill();
        });

        // Porty
        this.worldMap.ports.forEach(p => {
            mctx.fillStyle = '#f39c12';
            mctx.beginPath();
            mctx.arc(p.x * scaleX, p.y * scaleY, Math.max(3, p.islandRadius * scaleX), 0, Math.PI * 2);
            mctx.fill();

            // Kropka doku
            mctx.fillStyle = '#ffffff';
            mctx.beginPath();
            mctx.arc(p.dockX * scaleX, p.dockY * scaleY, 2.5, 0, Math.PI * 2);
            mctx.fill();
        });

        // Cel aktywnej misji (pulsujący żółty okrąg)
        if (this.economy.activeContracts.length > 0) {
            const destPort = this.worldMap.ports.find(p => p.id === this.economy.activeContracts[0].destPortId);
            if (destPort) {
                const pulse = (Math.sin(Date.now() * 0.008) + 1) * 3 + 4;
                mctx.strokeStyle = '#f1c40f';
                mctx.lineWidth = 2;
                mctx.beginPath();
                mctx.arc(destPort.dockX * scaleX, destPort.dockY * scaleY, pulse, 0, Math.PI * 2);
                mctx.stroke();
            }
        }

        // Gracz
        mctx.fillStyle = '#e74c3c';
        mctx.beginPath();
        mctx.arc(this.ship.x * scaleX, this.ship.y * scaleY, 3.5, 0, Math.PI * 2);
        mctx.fill();
    }

    renderFullWorldMap() {
        const fullCanvas = document.getElementById('full-map-canvas');
        if (!fullCanvas) return;
        const fctx = fullCanvas.getContext('2d');
        const fw = fullCanvas.width;
        const fh = fullCanvas.height;

        fctx.fillStyle = '#17496d';
        fctx.fillRect(0, 0, fw, fh);

        const sx = fw / this.worldMap.width;
        const sy = fh / this.worldMap.height;

        // Siatka kartograficzna
        fctx.strokeStyle = 'rgba(255,255,255,0.08)';
        fctx.lineWidth = 1;
        for (let x = 0; x < fw; x += 60) {
            fctx.beginPath(); fctx.moveTo(x, 0); fctx.lineTo(x, fh); fctx.stroke();
        }
        for (let y = 0; y < fh; y += 60) {
            fctx.beginPath(); fctx.moveTo(0, y); fctx.lineTo(fw, y); fctx.stroke();
        }

        // Rafy
        fctx.fillStyle = '#576574';
        this.worldMap.reefs.forEach(r => {
            fctx.beginPath();
            fctx.arc(r.x * sx, r.y * sy, Math.max(3, r.radius * sx), 0, Math.PI * 2);
            fctx.fill();
        });

        // Wyspy
        fctx.fillStyle = '#2ecc71';
        this.worldMap.islands.forEach(isl => {
            fctx.beginPath();
            fctx.arc(isl.x * sx, isl.y * sy, Math.max(3, isl.radius * sx), 0, Math.PI * 2);
            fctx.fill();
        });

        // Porty
        this.worldMap.ports.forEach(port => {
            fctx.fillStyle = '#f39c12';
            fctx.beginPath();
            fctx.arc(port.x * sx, port.y * sy, Math.max(5, port.islandRadius * sx), 0, Math.PI * 2);
            fctx.fill();

            // Nazwa portu
            fctx.fillStyle = '#ffffff';
            fctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
            fctx.textAlign = 'center';
            fctx.fillText(port.name, port.x * sx, port.y * sy - 14);

            // Informacja o produkcji
            fctx.font = '10px "Segoe UI", Arial, sans-serif';
            fctx.fillStyle = '#f1c40f';
            const prodList = port.produces.map(pr => this.economy.goods[pr].name).join(', ');
            fctx.fillText(`Prod: ${prodList}`, port.x * sx, port.y * sy + 18);
        });

        // Statek gracza
        fctx.fillStyle = '#e74c3c';
        fctx.beginPath();
        fctx.arc(this.ship.x * sx, this.ship.y * sy, 6, 0, Math.PI * 2);
        fctx.fill();
        fctx.strokeStyle = '#ffffff';
        fctx.lineWidth = 2;
        fctx.stroke();

        fctx.fillStyle = '#ffffff';
        fctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        fctx.fillText('Twój statek', this.ship.x * sx, this.ship.y * sy - 10);
    }

    start() {
        const loop = (currentTime) => {
            const dt = Math.min(0.08, (currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;

            this.update(dt);
            this.render();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new SeaGame();
    window.game.start();
});

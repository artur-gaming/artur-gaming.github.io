/**
 * Gospodarka, Handel, Misje i Stocznia
 */

class EconomyEngine {
    constructor(worldMap) {
        this.worldMap = worldMap;
        this.gold = 150; // Początkowe złoto gracza
        this.totalDelivered = 0;
        this.totalEarned = 0;

        // Baza towarów handlowych
        this.goods = {
            wood: { name: 'Drewno budowlane', icon: '🪵', basePrice: 25, desc: 'Bale dębowe i deski niezbędne do naprawy flot.' },
            fish: { name: 'Świeże ryby', icon: '🐟', basePrice: 20, desc: 'Solone dorsze i makrele prosto z kutrów.' },
            wheat: { name: 'Worki ze zbożem', icon: '🌾', basePrice: 32, desc: 'Podstawowe pożywienie dla miast i garnizonów.' },
            tools: { name: 'Narzędzia kowalskie', icon: '🔨', basePrice: 55, desc: 'Gwoździe, piły i osprzęt ciesielski.' },
            ore: { name: 'Ruda żelaza', icon: '⛏️', basePrice: 48, desc: 'Surowiec do wyrobu broni i okuć kadłuba.' },
            rum: { name: 'Beczka rumu', icon: '🍾', basePrice: 85, desc: 'Mocny trunek podnoszący morale marynarzy.' },
            coffee: { name: 'Aromatyczna kawa', icon: '☕', basePrice: 75, desc: 'Palone ziarna z odległych plantacji.' },
            spices: { name: 'Egzotyczne przyprawy', icon: '🌶️', basePrice: 130, desc: 'Cynamon, wanilia i szafran warte fortunę.' },
            amber: { name: 'Bursztyn morski', icon: '💎', basePrice: 160, desc: 'Złoto północy wyrzucane przez morskie fale.' },
            gold: { name: 'Królewskie złoto', icon: '🪙', basePrice: 240, desc: 'Czysty kruszec z królewskich mennic.' }
        };

        // Sklepy i zlecenia w każdym porcie
        this.portMarkets = {};
        this.availableContracts = {};
        this.activeContracts = []; // Maks 3 aktywne zlecenia

        this.initMarkets();
        this.generateAllContracts();

        // Koszty nowych statków
        this.shipyardCatalog = [
            { tier: 1, name: 'Kuter "Mewa"', price: 0, hold: 4, speed: 4.0, hp: 100, desc: 'Zwinny mały kuter rybacki. Idealny na początek.' },
            { tier: 2, name: 'Szkuner "Bocian"', price: 420, hold: 8, speed: 4.8, hp: 160, desc: 'Szybki dwumasztowiec z dwukrotnie większą ładownią.' },
            { tier: 3, name: 'Brygantyna "Korsarz"', price: 1100, hold: 14, speed: 5.4, hp: 250, desc: 'Duma mórz. Wybitna prędkość i solidny dębowy pancerz.' },
            { tier: 4, name: 'Galeon "Lewiatan"', price: 2600, hold: 24, speed: 5.0, hp: 380, desc: 'Potężny frachtowiec kolonialny zdolny pomieścić małe imperium.' }
        ];

        // Koszty ulepszeń
        this.upgradeCosts = {
            sails: [0, 100, 220, 450, 800],
            hull: [0, 80, 180, 380, 700],
            hold: [0, 120, 260, 520, 950],
            radar: [0, 90, 200, 400]
        };
    }

    initMarkets() {
        this.worldMap.ports.forEach(port => {
            this.portMarkets[port.id] = {};
            for (const [key, good] of Object.entries(this.goods)) {
                let buyMultiplier = 1.0;
                let sellMultiplier = 0.85;

                if (port.produces.includes(key)) {
                    // Port to produkuje -> tanio kupić!
                    buyMultiplier = 0.65;
                    sellMultiplier = 0.55;
                } else if (port.demands.includes(key)) {
                    // Port tego potrzebuje -> drogo sprzedać!
                    buyMultiplier = 1.5;
                    sellMultiplier = 1.35;
                }

                this.portMarkets[port.id][key] = {
                    buyPrice: Math.round(good.basePrice * buyMultiplier),
                    sellPrice: Math.round(good.basePrice * sellMultiplier),
                    stock: port.produces.includes(key) ? 15 + Math.floor(Math.random() * 15) : 5 + Math.floor(Math.random() * 8)
                };
            }
        });
    }

    generateAllContracts() {
        this.worldMap.ports.forEach(port => {
            this.availableContracts[port.id] = this.generateContractsForPort(port);
        });
    }

    generateContractsForPort(port) {
        const contracts = [];
        const otherPorts = this.worldMap.ports.filter(p => p.id !== port.id);
        const count = 3;

        for (let i = 0; i < count; i++) {
            const destPort = otherPorts[Math.floor(Math.random() * otherPorts.length)];
            const dist = Math.hypot(destPort.dockX - port.dockX, destPort.dockY - port.dockY);
            
            // Preferuj towary, które port produkuje lub które cel pożąda
            let possibleGoods = port.produces.length > 0 ? port.produces : Object.keys(this.goods);
            const cargoType = possibleGoods[Math.floor(Math.random() * possibleGoods.length)];
            const good = this.goods[cargoType];

            const crateCount = 1 + Math.floor(Math.random() * 3); // 1 do 3 skrzynek
            const baseReward = Math.round((dist * 0.12 + good.basePrice * crateCount * 1.6));
            const timeLimit = Math.round(dist / 22) + 35; // sekundy

            contracts.push({
                id: 'cnt_' + Math.random().toString(36).substr(2, 9),
                originPortId: port.id,
                originPortName: port.name,
                destPortId: destPort.id,
                destPortName: destPort.name,
                cargoType: cargoType,
                cargoName: good.name,
                cargoIcon: good.icon,
                crates: crateCount,
                reward: baseReward,
                timeLimit: timeLimit,
                timeLeft: timeLimit,
                isUrgent: Math.random() > 0.6,
                bonusReward: Math.round(baseReward * 0.4)
            });
        }
        return contracts;
    }

    updateContracts(dt) {
        for (const contract of this.activeContracts) {
            contract.timeLeft -= dt;
        }
    }

    acceptContract(contractId, portId, ship) {
        const contracts = this.availableContracts[portId];
        const index = contracts.findIndex(c => c.id === contractId);
        if (index === -1) return { success: false, msg: 'Zlecenie wygasło.' };

        if (this.activeContracts.length >= 3) {
            return { success: false, msg: 'Maksymalnie 3 aktywne zlecenia! Dostarcz obecne.' };
        }

        const contract = contracts[index];
        const freeSpace = ship.cargoCapacity - ship.cargo.length;
        if (freeSpace < contract.crates) {
            return { success: false, msg: `Brak miejsca w ładowni! Potrzebujesz ${contract.crates} wolnych miejsc.` };
        }

        // Załaduj towary na statek
        for (let i = 0; i < contract.crates; i++) {
            ship.cargo.push(contract.cargoType);
        }

        // Przenieś do aktywnych
        this.activeContracts.push(contract);
        contracts.splice(index, 1);

        if (window.soundEngine) window.soundEngine.playSplash();
        return { success: true, msg: `Przyjęto zlecenie: ${contract.crates}x ${contract.cargoName} do ${contract.destPortName}!` };
    }

    checkDeliveriesAtPort(portId, ship) {
        const completed = [];
        for (let i = this.activeContracts.length - 1; i >= 0; i--) {
            const contract = this.activeContracts[i];
            if (contract.destPortId === portId) {
                // Sprawdź czy statek ma wymaganą ilość tego towaru
                const matchingCount = ship.cargo.filter(c => c === contract.cargoType).length;
                if (matchingCount < contract.crates) {
                    continue; // Gracz nie ma wszystkich skrzyń
                }

                // Usunięcie skrzyń kontraktu z ładowni
                let removed = 0;
                for (let j = ship.cargo.length - 1; j >= 0; j--) {
                    if (ship.cargo[j] === contract.cargoType && removed < contract.crates) {
                        ship.cargo.splice(j, 1);
                        removed++;
                    }
                }

                let earned = contract.reward;
                let bonus = false;
                if (contract.timeLeft > 0) {
                    earned += contract.bonusReward;
                    bonus = true;
                }

                this.gold += earned;
                this.totalEarned += earned;
                this.totalDelivered += contract.crates;

                completed.push({
                    contract: contract,
                    earned: earned,
                    withBonus: bonus
                });

                this.activeContracts.splice(i, 1);
            }
        }

        if (completed.length > 0 && window.soundEngine) {
            window.soundEngine.playCash();
        }

        return completed;
    }

    buyGood(portId, cargoType, ship) {
        const market = this.portMarkets[portId][cargoType];
        if (!market || market.stock <= 0) return { success: false, msg: 'Brak towaru na składzie.' };
        if (ship.cargo.length >= ship.cargoCapacity) return { success: false, msg: 'Ładownia jest pełna!' };
        if (this.gold < market.buyPrice) return { success: false, msg: 'Za mało złota!' };

        this.gold -= market.buyPrice;
        market.stock--;
        ship.cargo.push(cargoType);

        if (window.soundEngine) window.soundEngine.playSplash();
        return { success: true, msg: `Kupiono ${this.goods[cargoType].name} za ${market.buyPrice} monet.` };
    }

    sellGood(portId, cargoIndex, ship) {
        if (cargoIndex < 0 || cargoIndex >= ship.cargo.length) return { success: false };
        const cargoType = ship.cargo[cargoIndex];
        const market = this.portMarkets[portId][cargoType];
        const price = market ? market.sellPrice : Math.round(this.goods[cargoType].basePrice * 0.7);

        ship.cargo.splice(cargoIndex, 1);
        this.gold += price;
        this.totalEarned += price;
        this.totalDelivered++;

        if (market) market.stock++;
        if (window.soundEngine) window.soundEngine.playCash();

        return { success: true, msg: `Sprzedano ${this.goods[cargoType].name} za ${price} monet!` };
    }

    repairShip(ship) {
        const damage = ship.maxHp - ship.hp;
        if (damage <= 0) return { success: false, msg: 'Kadłub jest w idealnym stanie!' };
        const costPerHp = 0.8;
        const totalCost = Math.ceil(damage * costPerHp);

        if (this.gold < totalCost) {
            // Częściowa naprawa
            const affordableHp = Math.floor(this.gold / costPerHp);
            if (affordableHp <= 0) return { success: false, msg: 'Brak złota na naprawy!' };
            const actualCost = Math.ceil(affordableHp * costPerHp);
            this.gold -= actualCost;
            ship.repair(affordableHp);
            if (window.soundEngine) window.soundEngine.playBell();
            return { success: true, msg: `Częściowo naprawiono kadłub (+${affordableHp} HP) za ${actualCost} monet.` };
        }

        this.gold -= totalCost;
        ship.repair(damage);
        if (window.soundEngine) window.soundEngine.playBell();
        return { success: true, msg: `Kadłub w pełni naprawiony za ${totalCost} monet!` };
    }

    buyShipUpgrade(type, ship) {
        const currentLvl = ship.upgrades[type];
        const costs = this.upgradeCosts[type];
        if (!costs || currentLvl >= costs.length - 1) {
            return { success: false, msg: 'Osiągnięto maksymalny poziom tego ulepszenia!' };
        }
        const cost = costs[currentLvl];
        if (this.gold < cost) {
            return { success: false, msg: `Za mało złota! Wymagane: ${cost} monet.` };
        }

        this.gold -= cost;
        ship.applyUpgrade(type);
        if (window.soundEngine) window.soundEngine.playCash();
        return { success: true, msg: `Ulepszenie zakupione! Poziom ${currentLvl + 1}.` };
    }

    buyNewShip(targetTier, ship) {
        const item = this.shipyardCatalog.find(s => s.tier === targetTier);
        if (!item) return { success: false, msg: 'Nieznany model statku.' };
        if (ship.tier >= targetTier) return { success: false, msg: 'Posiadasz już ten lub lepszy statek!' };
        if (this.gold < item.price) return { success: false, msg: `Potrzebujesz ${item.price} monet na ten statek!` };

        this.gold -= item.price;
        ship.setShipTier(targetTier);
        if (window.soundEngine) window.soundEngine.playCash();
        return { success: true, msg: `Gratulacje kapitanie! Twój nowy statek to ${item.name}!` };
    }
}

window.EconomyEngine = EconomyEngine;

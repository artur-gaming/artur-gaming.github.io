/**
 * Pogoda, Pora Dnia, Wiatr i Efekty Oświetlenia
 */

class WeatherEngine {
    constructor() {
        // Czas doby: 0 do 24 godzin (start o 10:00 rano)
        this.timeOfDay = 10.0;
        this.dayDurationSeconds = 240; // 4 minuty na pełny cykl dnia i nocy
        this.isCyclePaused = false;

        // Wiatr (kierunek i siła)
        this.windAngle = Math.random() * Math.PI * 2;
        this.windSpeed = 1.0; // 0.5 do 2.0
        this.windChangeTimer = 0;

        // Pogoda: 'clear', 'rain', 'fog'
        this.weatherState = 'clear';
        this.rainParticles = [];
        this.lightningTimer = 0;
        this.lightningFlash = 0;

        // Fale oceaniczne - parametry animacji
        this.wavePhase = 0;

        // Bufor maski oświetlenia (off-screen canvas zapobiegający wycinaniu tła strony)
        this.maskCanvas = document.createElement('canvas');
        this.maskCtx = this.maskCanvas.getContext('2d');

        // Inicjalizacja kropel deszczu
        for (let i = 0; i < 200; i++) {
            this.rainParticles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                len: 12 + Math.random() * 8,
                speed: 12 + Math.random() * 8
            });
        }
    }

    update(dt) {
        if (!this.isCyclePaused) {
            this.timeOfDay += (24 / this.dayDurationSeconds) * dt;
            if (this.timeOfDay >= 24) this.timeOfDay -= 24;
        }

        // Zmiana kierunku i siły wiatru
        this.windChangeTimer += dt;
        if (this.windChangeTimer > 15) {
            this.windChangeTimer = 0;
            this.windAngle += (Math.random() - 0.5) * 0.8;
            this.windSpeed = 0.6 + Math.random() * 1.0;
        }

        // Animacja fal
        this.wavePhase += dt * 1.5;

        // Pogoda deszczowa
        if (this.weatherState === 'rain') {
            for (const drop of this.rainParticles) {
                drop.y += drop.speed;
                drop.x += Math.cos(this.windAngle) * 3;
                if (drop.y > window.innerHeight) {
                    drop.y = -10;
                    drop.x = Math.random() * window.innerWidth;
                }
            }

            // Pioruny podczas sztormu
            this.lightningTimer -= dt;
            if (this.lightningTimer <= 0) {
                this.lightningTimer = 12 + Math.random() * 20;
                this.lightningFlash = 0.7;
            }
            if (this.lightningFlash > 0) {
                this.lightningFlash -= dt * 2.5;
            }
        }
    }

    getWindVector() {
        return {
            x: Math.cos(this.windAngle) * this.windSpeed,
            y: Math.sin(this.windAngle) * this.windSpeed,
            angle: this.windAngle,
            speed: this.windSpeed
        };
    }

    // Zwraca barwę i przezroczystość oświetlenia atmosferycznego
    getAtmosphereColor() {
        const t = this.timeOfDay;
        // Noc: 21:00 - 05:00
        // Świt: 05:00 - 07:00
        // Dzień: 07:00 - 18:00
        // Zmierzch: 18:00 - 21:00

        if (t >= 7 && t < 17) {
            // Słoneczny dzień
            return { r: 255, g: 255, b: 255, alpha: 0.0, isNight: false, ambient: 1.0 };
        } else if (t >= 17 && t < 20) {
            // Złoty zachód słońca
            const factor = (t - 17) / 3;
            return {
                r: 245,
                g: 130 + Math.round((1 - factor) * 50),
                b: 70,
                alpha: factor * 0.35,
                isNight: factor > 0.6,
                ambient: 1.0 - factor * 0.4
            };
        } else if (t >= 20 || t < 5) {
            // Głęboka noc
            return { r: 10, g: 20, b: 50, alpha: 0.72, isNight: true, ambient: 0.28 };
        } else {
            // Poranny świt
            const factor = (t - 5) / 2;
            return {
                r: 250,
                g: 180 + Math.round(factor * 60),
                b: 140,
                alpha: (1 - factor) * 0.4,
                isNight: factor < 0.3,
                ambient: 0.3 + factor * 0.7
            };
        }
    }

    // Nakłada efekt ciemności, snopów światła latarni morskiej i lamp pokładowych
    renderLightingLayer(ctx, width, height, playerShip, worldMap, camera) {
        const atmo = this.getAtmosphereColor();
        if (atmo.alpha <= 0.05 && this.lightningFlash <= 0 && this.weatherState !== 'rain') return;

        ctx.save();

        // Jeśli błysk pioruna rozświetla ekran
        if (this.lightningFlash > 0) {
            ctx.fillStyle = `rgba(240, 248, 255, ${this.lightningFlash * 0.8})`;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
            return;
        }

        // Rysujemy maskę oświetlenia w nocy (na dedykowanym offscreen canvasie, by NIE wycinać oceanu do tła HTML)
        if (atmo.alpha > 0.05) {
            if (this.maskCanvas.width !== width || this.maskCanvas.height !== height) {
                this.maskCanvas.width = width;
                this.maskCanvas.height = height;
            }

            const mctx = this.maskCtx;
            mctx.clearRect(0, 0, width, height);

            // 1. Wypełniamy bufor maski półprzezroczystym mrokiem
            mctx.fillStyle = `rgba(${atmo.r}, ${atmo.g}, ${atmo.b}, ${atmo.alpha})`;
            mctx.fillRect(0, 0, width, height);

            // 2. Wycinamy otwory w samym mroku (tylko w masce bufora)
            mctx.globalCompositeOperation = 'destination-out';

            const screenShipX = playerShip.x - camera.x;
            const screenShipY = playerShip.y - camera.y;

            if (playerShip.lightsOn) {
                const bowTipX = screenShipX + Math.cos(playerShip.angle) * (playerShip.getHullLength() * 0.45);
                const bowTipY = screenShipY + Math.sin(playerShip.angle) * (playerShip.getHullLength() * 0.45);

                // Wycięcie mroku wokół kadłuba
                const shipGrad = mctx.createRadialGradient(screenShipX, screenShipY, 15, screenShipX, screenShipY, 200);
                shipGrad.addColorStop(0, 'rgba(0,0,0, 1)');
                shipGrad.addColorStop(0.5, 'rgba(0,0,0, 0.7)');
                shipGrad.addColorStop(1, 'rgba(0,0,0, 0)');
                mctx.fillStyle = shipGrad;
                mctx.beginPath();
                mctx.arc(screenShipX, screenShipY, 200, 0, Math.PI * 2);
                mctx.fill();

                // Wycięcie mroku w snopie reflektora dziobowego
                const beamLength = 360 + (playerShip.upgrades.radar - 1) * 55;
                const spotGrad = mctx.createRadialGradient(bowTipX, bowTipY, 10, bowTipX, bowTipY, beamLength);
                spotGrad.addColorStop(0, 'rgba(0,0,0, 1)');
                spotGrad.addColorStop(0.65, 'rgba(0,0,0, 0.85)');
                spotGrad.addColorStop(1, 'rgba(0,0,0, 0)');

                mctx.fillStyle = spotGrad;
                mctx.beginPath();
                mctx.moveTo(bowTipX, bowTipY);
                mctx.arc(bowTipX, bowTipY, beamLength, playerShip.angle - 0.46, playerShip.angle + 0.46);
                mctx.closePath();
                mctx.fill();
            } else {
                // Minimalna widoczność tuż przy statku
                const dimGrad = mctx.createRadialGradient(screenShipX, screenShipY, 8, screenShipX, screenShipY, 80);
                dimGrad.addColorStop(0, 'rgba(0,0,0, 0.75)');
                dimGrad.addColorStop(1, 'rgba(0,0,0, 0)');
                mctx.fillStyle = dimGrad;
                mctx.beginPath();
                mctx.arc(screenShipX, screenShipY, 80, 0, Math.PI * 2);
                mctx.fill();
            }

            // Wycinanie mroku przez latarnie morskie w portach
            const beamAngle = Date.now() * 0.001;
            worldMap.ports.forEach(port => {
                const sx = port.dockX - camera.x;
                const sy = port.dockY - camera.y;
                if (sx > -450 && sx < width + 450 && sy > -450 && sy < height + 450) {
                    const beamGrad = mctx.createRadialGradient(sx, sy, 20, sx, sy, 420);
                    beamGrad.addColorStop(0, 'rgba(0,0,0, 1)');
                    beamGrad.addColorStop(0.75, 'rgba(0,0,0, 0.75)');
                    beamGrad.addColorStop(1, 'rgba(0,0,0, 0)');

                    mctx.fillStyle = beamGrad;
                    mctx.beginPath();
                    mctx.moveTo(sx, sy);
                    mctx.arc(sx, sy, 420, beamAngle - 0.28, beamAngle + 0.28);
                    mctx.closePath();
                    mctx.fill();
                }
            });

            // Wycinanie mroku przez boje nawigacyjne
            worldMap.buoys.forEach(b => {
                const bx = b.x - camera.x;
                const by = b.y - camera.y;
                if (bx > -100 && bx < width + 100 && by > -100 && by < height + 100) {
                    const flash = Math.sin(Date.now() * 0.004 + b.flashPhase * Math.PI * 2);
                    if (flash > 0) {
                        const buoyGrad = mctx.createRadialGradient(bx, by, 5, bx, by, 75);
                        buoyGrad.addColorStop(0, `rgba(0,0,0, ${flash})`);
                        buoyGrad.addColorStop(1, 'rgba(0,0,0, 0)');
                        mctx.fillStyle = buoyGrad;
                        mctx.beginPath();
                        mctx.arc(bx, by, 75, 0, Math.PI * 2);
                        mctx.fill();
                    }
                }
            });

            mctx.globalCompositeOperation = 'source-over';

            // 3. Nakładamy maskę ciemności na scenę (otwory na światło nie zaciemniają świata)
            ctx.drawImage(this.maskCanvas, 0, 0);

            // 4. Dodajemy ciepłe, promienne światło addytywne ('lighter') - NIGDY nie będzie cieniem!
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            // Snopy światła latarni morskich
            worldMap.ports.forEach(port => {
                const sx = port.dockX - camera.x;
                const sy = port.dockY - camera.y;
                if (sx > -450 && sx < width + 450 && sy > -450 && sy < height + 450) {
                    const lightBeam = ctx.createRadialGradient(sx, sy, 10, sx, sy, 420);
                    lightBeam.addColorStop(0, 'rgba(255, 245, 180, 0.5)');
                    lightBeam.addColorStop(0.35, 'rgba(255, 230, 140, 0.2)');
                    lightBeam.addColorStop(1, 'rgba(255, 210, 80, 0)');
                    ctx.fillStyle = lightBeam;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.arc(sx, sy, 420, beamAngle - 0.28, beamAngle + 0.28);
                    ctx.closePath();
                    ctx.fill();
                }
            });

            // Rozbłyski boi nawigacyjnych
            worldMap.buoys.forEach(b => {
                const bx = b.x - camera.x;
                const by = b.y - camera.y;
                if (bx > -100 && bx < width + 100 && by > -100 && by < height + 100) {
                    const flash = Math.sin(Date.now() * 0.004 + b.flashPhase * Math.PI * 2);
                    if (flash > 0) {
                        const bglow = ctx.createRadialGradient(bx, by, 2, bx, by, 45);
                        bglow.addColorStop(0, b.color);
                        bglow.addColorStop(1, 'rgba(0,0,0,0)');
                        ctx.fillStyle = bglow;
                        ctx.beginPath();
                        ctx.arc(bx, by, 45, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });

            // Reflektor dziobowy statku w nocy
            if (playerShip.lightsOn) {
                const bowTipX = screenShipX + Math.cos(playerShip.angle) * (playerShip.getHullLength() * 0.45);
                const bowTipY = screenShipY + Math.sin(playerShip.angle) * (playerShip.getHullLength() * 0.45);
                const beamLength = 360 + (playerShip.upgrades.radar - 1) * 55;

                const beamGlow = ctx.createRadialGradient(bowTipX, bowTipY, 10, bowTipX, bowTipY, beamLength);
                beamGlow.addColorStop(0, 'rgba(255, 250, 190, 0.55)');
                beamGlow.addColorStop(0.4, 'rgba(255, 235, 140, 0.25)');
                beamGlow.addColorStop(1, 'rgba(255, 210, 90, 0)');
                ctx.fillStyle = beamGlow;
                ctx.beginPath();
                ctx.moveTo(bowTipX, bowTipY);
                ctx.arc(bowTipX, bowTipY, beamLength, playerShip.angle - 0.46, playerShip.angle + 0.46);
                ctx.closePath();
                ctx.fill();

                // Ciepła poświata wokół kadłuba
                const shipAmb = ctx.createRadialGradient(screenShipX, screenShipY, 15, screenShipX, screenShipY, 160);
                shipAmb.addColorStop(0, 'rgba(255, 230, 140, 0.25)');
                shipAmb.addColorStop(1, 'rgba(255, 210, 80, 0)');
                ctx.fillStyle = shipAmb;
                ctx.beginPath();
                ctx.arc(screenShipX, screenShipY, 160, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Deszcz
        if (this.weatherState === 'rain') {
            ctx.strokeStyle = 'rgba(200, 225, 255, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (const drop of this.rainParticles) {
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + Math.cos(this.windAngle) * 4, drop.y + drop.len);
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}

window.WeatherEngine = WeatherEngine;

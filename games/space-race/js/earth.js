// js/earth.js - Multi-Stage Orbital Earth Globe & Atmosphere Renderer
class OrbitalEarth {
    constructor() {
        this.currentStage = 1;
        this.rotationAngle = 0;
        this.cloudRotation = 0;
        this.stars = [];
        this.stageTransition = 0;
        this.targetStage = 1;
        this.initStars(160);

        // Predefined Stage Themes
        this.stages = {
            1: {
                name: "STAGE 1: CAPE CANAVERAL / AMERICAS",
                subtitle: "LOW EARTH ORBIT - 28.5° INCLINATION",
                baseColor: "#0b3d91",
                landColor: "#2e7d32",
                desertColor: "#c2a649",
                shallowColor: "#00b4d8",
                atmosphereGlow: "rgba(0, 212, 255, 0.45)",
                cloudsOpacity: 0.55,
                sunAngle: -Math.PI / 4,
                isNight: false,
                aurora: false,
                features: 'americas'
            },
            2: {
                name: "STAGE 2: MEDITERRANEAN / SAHARA",
                subtitle: "EQUATORIAL CROSSING - 400 KM ALTITUDE",
                baseColor: "#00509d",
                landColor: "#386641",
                desertColor: "#e09f3e",
                shallowColor: "#48cae4",
                atmosphereGlow: "rgba(72, 202, 228, 0.5)",
                cloudsOpacity: 0.45,
                sunAngle: -Math.PI / 6,
                isNight: false,
                aurora: false,
                features: 'africa_europe'
            },
            3: {
                name: "STAGE 3: PACIFIC RING & ASIA",
                subtitle: "TRANS-PACIFIC POLAR VECTOR",
                baseColor: "#002855",
                landColor: "#1b4332",
                desertColor: "#b08968",
                shallowColor: "#0077b6",
                atmosphereGlow: "rgba(0, 180, 216, 0.4)",
                cloudsOpacity: 0.65,
                sunAngle: -Math.PI / 3,
                isNight: false,
                aurora: false,
                features: 'asia_pacific'
            },
            4: {
                name: "STAGE 4: NIGHT SIDE & AURORA BOREALIS",
                subtitle: "ECLIPSE SHADOW - 51.6° ORBITAL TILT",
                baseColor: "#020914",
                landColor: "#081c15",
                desertColor: "#141b17",
                shallowColor: "#041527",
                atmosphereGlow: "rgba(34, 197, 94, 0.4)",
                cloudsOpacity: 0.35,
                sunAngle: Math.PI * 0.8,
                isNight: true,
                aurora: true,
                cityLights: true,
                features: 'night_grid'
            },
            5: {
                name: "STAGE 5: ORBITAL DAWN / AUSTRALIA",
                subtitle: "SOLAR DAWN HORIZON - RE-ENTRY APPROACH",
                baseColor: "#003566",
                landColor: "#6c584c",
                desertColor: "#d94e34",
                shallowColor: "#0096c7",
                atmosphereGlow: "rgba(255, 170, 50, 0.55)",
                cloudsOpacity: 0.5,
                sunAngle: -Math.PI * 0.45,
                isNight: false,
                sunriseGlow: true,
                aurora: false,
                features: 'oceania_dawn'
            }
        };
    }

    initStars(count) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() < 0.2 ? 2.5 : (Math.random() < 0.5 ? 1.5 : 1.0),
                twinkleSpeed: 0.5 + Math.random() * 2,
                twinkleOffset: Math.random() * Math.PI * 2,
                color: Math.random() < 0.15 ? '#a5f3fc' : (Math.random() < 0.3 ? '#fde047' : '#ffffff')
            });
        }
    }

    setStage(stageNum) {
        const stageIndex = ((stageNum - 1) % 5) + 1;
        this.targetStage = stageIndex;
        this.currentStage = stageIndex;
        // Shift rotation for dramatic vantage point change
        this.rotationAngle = (stageIndex - 1) * 1.25;
    }

    update(dt) {
        // Continuous slow orbit drift
        this.rotationAngle += 0.0008;
        this.cloudRotation += 0.0013;
    }

    render(ctx, width, height) {
        // 1. Deep Space Void with Parallax Stars
        ctx.fillStyle = "#02040a";
        ctx.fillRect(0, 0, width, height);

        const time = performance.now() * 0.001;
        this.stars.forEach(star => {
            const alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset));
            ctx.fillStyle = star.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
        });
        ctx.globalAlpha = 1.0;

        // 2. Earth Globe Coordinates & Dimensions
        // Prominently featured in lower-to-middle screen spanning wide
        const globeRadius = Math.max(width * 0.75, height * 0.85);
        const globeCenterX = width * 0.5;
        // Earth curves prominently upward into the screen
        const globeCenterY = height * 1.05;

        const stageData = this.stages[this.currentStage] || this.stages[1];

        // 3. Atmospheric Outer Glow (Rayleigh scattering rim)
        ctx.save();
        const atmosGlow = ctx.createRadialGradient(
            globeCenterX, globeCenterY, globeRadius * 0.95,
            globeCenterX, globeCenterY, globeRadius * 1.08
        );
        atmosGlow.addColorStop(0, stageData.atmosphereGlow);
        atmosGlow.addColorStop(0.35, "rgba(56, 189, 248, 0.2)");
        if (stageData.sunriseGlow) {
            atmosGlow.addColorStop(0.65, "rgba(251, 146, 60, 0.25)");
        }
        atmosGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = atmosGlow;
        ctx.beginPath();
        ctx.arc(globeCenterX, globeCenterY, globeRadius * 1.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 4. Earth Globe Body (Clipped circle for surface detail)
        ctx.save();
        ctx.beginPath();
        ctx.arc(globeCenterX, globeCenterY, globeRadius, 0, Math.PI * 2);
        ctx.clip();

        // Base ocean background
        const oceanGrad = ctx.createLinearGradient(0, height * 0.3, width, height);
        oceanGrad.addColorStop(0, stageData.baseColor);
        oceanGrad.addColorStop(1, stageData.isNight ? "#01050a" : "#001a33");
        ctx.fillStyle = oceanGrad;
        ctx.fill();

        // Draw Stage Specific Continental Shapes & Topography
        this.renderContinents(ctx, globeCenterX, globeCenterY, globeRadius, stageData);

        // Aurora Borealis for Night stage
        if (stageData.aurora) {
            this.renderAurora(ctx, globeCenterX, globeCenterY, globeRadius, time);
        }

        // Drifting Cloud Layers
        this.renderClouds(ctx, globeCenterX, globeCenterY, globeRadius, stageData);

        // Day/Night Terminator Shadow & Spherical 3D Shading
        this.renderShading(ctx, globeCenterX, globeCenterY, globeRadius, stageData);

        // Atmosphere Rim Specular Sheen inside globe
        const rimGrad = ctx.createRadialGradient(
            globeCenterX, globeCenterY, globeRadius * 0.88,
            globeCenterX, globeCenterY, globeRadius
        );
        rimGrad.addColorStop(0, "rgba(0, 180, 255, 0)");
        rimGrad.addColorStop(0.85, "rgba(56, 189, 248, 0.2)");
        rimGrad.addColorStop(1, "rgba(255, 255, 255, 0.4)");
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(globeCenterX, globeCenterY, globeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // Exit globe clip
    }

    renderContinents(ctx, cx, cy, r, stage) {
        ctx.save();
        const rot = this.rotationAngle;

        if (stage.features === 'americas') {
            // Stage 1: North America, Florida peninsula, Gulf, Caribbean islands, South America
            this.drawBlobContinent(ctx, cx, cy, r, rot, [
                // North America
                { lat: 0.45, lon: -0.35, rx: 140, ry: 90, color: stage.landColor },
                // Florida / East Coast
                { lat: 0.38, lon: -0.15, rx: 70, ry: 60, color: stage.desertColor },
                // Great Lakes / Canada
                { lat: 0.55, lon: -0.3, rx: 120, ry: 70, color: stage.landColor },
                // Caribbean Shallows
                { lat: 0.28, lon: -0.05, rx: 90, ry: 35, color: stage.shallowColor },
                // South America (Northern bulge & Amazon)
                { lat: 0.1, lon: 0.05, rx: 160, ry: 130, color: stage.landColor },
                { lat: -0.1, lon: 0.15, rx: 130, ry: 150, color: "#1e5128" }
            ]);
        } else if (stage.features === 'africa_europe') {
            // Stage 2: Europe, Mediterranean sea, Sahara desert, Africa
            this.drawBlobContinent(ctx, cx, cy, r, rot, [
                // Europe & Scandinavia
                { lat: 0.52, lon: -0.1, rx: 110, ry: 70, color: stage.landColor },
                // Iberian Peninsula
                { lat: 0.42, lon: -0.25, rx: 50, ry: 45, color: stage.desertColor },
                // Sahara Desert (Golden Vastness)
                { lat: 0.28, lon: -0.05, rx: 190, ry: 90, color: stage.desertColor },
                // Nile River Delta & Red Sea
                { lat: 0.25, lon: 0.2, rx: 60, ry: 75, color: "#9c6615" },
                // Central / Southern Africa
                { lat: 0.0, lon: 0.05, rx: 150, ry: 140, color: stage.landColor },
                { lat: -0.22, lon: 0.12, rx: 100, ry: 110, color: stage.landColor }
            ]);
        } else if (stage.features === 'asia_pacific') {
            // Stage 3: Asia, Japan, Himalayas, Pacific archipelagos
            this.drawBlobContinent(ctx, cx, cy, r, rot, [
                // Siberian & Eurasian landmass
                { lat: 0.56, lon: -0.2, rx: 200, ry: 100, color: stage.landColor },
                // East Asia / China
                { lat: 0.35, lon: -0.1, rx: 140, ry: 90, color: stage.landColor },
                // Japan archipelago
                { lat: 0.38, lon: 0.18, rx: 45, ry: 75, color: "#196f3d" },
                // Himalayas / Tibetan plateau
                { lat: 0.32, lon: -0.22, rx: 90, ry: 45, color: "#7f8c8d" },
                // Southeast Asian islands
                { lat: 0.08, lon: 0.1, rx: 110, ry: 60, color: stage.shallowColor },
                { lat: -0.05, lon: 0.2, rx: 80, ry: 50, color: stage.landColor }
            ]);
        } else if (stage.features === 'night_grid') {
            // Stage 4: Night side over metropolis clusters with city light webs
            this.drawBlobContinent(ctx, cx, cy, r, rot, [
                { lat: 0.45, lon: -0.2, rx: 180, ry: 110, color: "#071318" },
                { lat: 0.2, lon: 0.1, rx: 150, ry: 120, color: "#050f14" }
            ]);
            this.drawCityLights(ctx, cx, cy, r, rot);
        } else {
            // Stage 5: Oceania / Australia red desert at dawn
            this.drawBlobContinent(ctx, cx, cy, r, rot, [
                // Australia Outback
                { lat: 0.15, lon: -0.05, rx: 150, ry: 110, color: "#b23a22" },
                // Great Barrier Reef Shallows
                { lat: 0.22, lon: 0.18, rx: 80, ry: 120, color: stage.shallowColor },
                // New Zealand / Island chains
                { lat: 0.0, lon: 0.32, rx: 40, ry: 70, color: stage.landColor },
                // Indonesian Arch
                { lat: 0.45, lon: -0.2, rx: 130, ry: 55, color: stage.landColor }
            ]);
        }

        ctx.restore();
    }

    drawBlobContinent(ctx, cx, cy, r, rot, blobs) {
        blobs.forEach(b => {
            // Spherical projection approximation for orbital horizon view
            const effectiveLon = b.lon + Math.sin(rot * 0.5) * 0.15;
            const x = cx + effectiveLon * r * 0.85;
            const y = cy - b.lat * r * 0.65;

            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.ellipse(x, y, b.rx, b.ry, 0.2 + effectiveLon * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Inner coast contour for realism
            ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
            ctx.lineWidth = 4;
            ctx.stroke();
        });
    }

    drawCityLights(ctx, cx, cy, r, rot) {
        // Glowing megalopolises visible from orbit
        const cities = [
            { x: -0.3, y: 0.45, r: 8, intensity: 1.0 },
            { x: -0.22, y: 0.42, r: 12, intensity: 0.9 },
            { x: -0.15, y: 0.38, r: 14, intensity: 1.0 }, // New York/East coast megalopolis
            { x: -0.1, y: 0.32, r: 9, intensity: 0.8 },
            { x: 0.05, y: 0.48, r: 16, intensity: 0.95 }, // London/Paris
            { x: 0.18, y: 0.44, r: 11, intensity: 0.85 },
            { x: 0.25, y: 0.36, r: 15, intensity: 0.9 },
            { x: -0.35, y: 0.39, r: 10, intensity: 0.85 }, // West Coast LA/SF
            { x: 0.1, y: 0.25, r: 8, intensity: 0.75 }
        ];

        ctx.save();
        cities.forEach(c => {
            const px = cx + (c.x + Math.sin(rot * 0.5) * 0.1) * r * 0.85;
            const py = cy - c.y * r * 0.65;

            // City center glow
            const glow = ctx.createRadialGradient(px, py, 1, px, py, c.r * 2.5);
            glow.addColorStop(0, "rgba(255, 230, 140, 0.95)");
            glow.addColorStop(0.35, "rgba(255, 180, 50, 0.6)");
            glow.addColorStop(1, "rgba(255, 120, 0, 0)");

            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(px, py, c.r * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Inter-city highway web filaments
            ctx.strokeStyle = "rgba(255, 200, 80, 0.25)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + (Math.sin(c.x * 20) * 35), py + (Math.cos(c.y * 20) * 25));
            ctx.stroke();
        });
        ctx.restore();
    }

    renderAurora(ctx, cx, cy, r, time) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";

        // Shimmering green & violet atmospheric curtains
        const auroraGrad = ctx.createLinearGradient(0, cy - r * 0.8, 0, cy - r * 0.5);
        auroraGrad.addColorStop(0, "rgba(34, 197, 94, 0)");
        auroraGrad.addColorStop(0.5, "rgba(74, 222, 128, 0.45)");
        auroraGrad.addColorStop(0.85, "rgba(168, 85, 247, 0.35)");
        auroraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = auroraGrad;
        ctx.beginPath();
        const startX = cx - r * 0.65;
        const endX = cx + r * 0.65;
        const baseY = cy - r * 0.62;

        ctx.moveTo(startX, baseY);
        for (let x = startX; x <= endX; x += 30) {
            const wave = Math.sin((x * 0.015) + time * 1.5) * 18 + Math.cos((x * 0.03) - time * 0.8) * 10;
            ctx.lineTo(x, baseY + wave);
        }
        ctx.lineTo(endX, cy);
        ctx.lineTo(startX, cy);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    renderClouds(ctx, cx, cy, r, stage) {
        ctx.save();
        ctx.fillStyle = stage.isNight ? "rgba(180, 200, 220, 0.18)" : "rgba(255, 255, 255, 0.55)";
        const crot = this.cloudRotation;

        // Swirling cyclonic storm patterns & weather fronts
        const storms = [
            { x: -0.2 + Math.sin(crot) * 0.08, y: 0.5, r: 70 },
            { x: 0.15 + Math.cos(crot) * 0.06, y: 0.38, r: 90 },
            { x: -0.35, y: 0.25, r: 60 },
            { x: 0.3, y: 0.2, r: 80 },
            { x: 0.0, y: 0.6, r: 110 }
        ];

        storms.forEach(s => {
            const px = cx + s.x * r * 0.85;
            const py = cy - s.y * r * 0.65;

            // Spiral cloud bands
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                const angle = crot * 2 + (i * Math.PI / 2);
                const ox = Math.cos(angle) * (s.r * 0.4);
                const oy = Math.sin(angle) * (s.r * 0.25);
                ctx.ellipse(px + ox, py + oy, s.r * 0.6, s.r * 0.3, angle * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }

    renderShading(ctx, cx, cy, r, stage) {
        ctx.save();
        // Day/night terminator shadow gradient across the curved globe
        const sunAngle = stage.sunAngle || -Math.PI / 4;
        const lightX = cx + Math.cos(sunAngle) * r;
        const lightY = cy + Math.sin(sunAngle) * r;

        const shadeGrad = ctx.createRadialGradient(
            lightX, lightY, r * 0.3,
            cx, cy, r * 1.15
        );

        if (stage.isNight) {
            shadeGrad.addColorStop(0, "rgba(0, 0, 0, 0.2)");
            shadeGrad.addColorStop(0.5, "rgba(0, 5, 15, 0.75)");
            shadeGrad.addColorStop(1, "rgba(0, 2, 8, 0.96)");
        } else {
            shadeGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
            shadeGrad.addColorStop(0.4, "rgba(0, 0, 0, 0)");
            shadeGrad.addColorStop(0.75, "rgba(0, 10, 25, 0.45)");
            shadeGrad.addColorStop(1, "rgba(0, 5, 15, 0.85)");
        }

        ctx.fillStyle = shadeGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Orbital sunrise lens bloom if applicable
        if (stage.sunriseGlow) {
            const sunriseBloom = ctx.createRadialGradient(
                cx + r * 0.4, cy - r * 0.68, 5,
                cx + r * 0.4, cy - r * 0.68, 180
            );
            sunriseBloom.addColorStop(0, "rgba(255, 250, 220, 0.9)");
            sunriseBloom.addColorStop(0.2, "rgba(255, 170, 50, 0.5)");
            sunriseBloom.addColorStop(0.6, "rgba(239, 68, 68, 0.2)");
            sunriseBloom.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.fillStyle = sunriseBloom;
            ctx.beginPath();
            ctx.arc(cx + r * 0.4, cy - r * 0.68, 180, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

window.OrbitalEarth = OrbitalEarth;

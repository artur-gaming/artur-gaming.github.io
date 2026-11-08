// High-Performance 3D Environment: Sky, Sea, Terrain, Clouds, and Barrage Balloons

class World {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.cloudBoxes = [];
    this.balloons = [];
    this.mapEntities = new THREE.Group();
    this.scene.add(this.mapEntities);
    this.currentMap = 'britain';

    this.initLighting();
    this.initSky();
    this.initOcean();
    this.initClouds();
    this.loadMap('britain');
  }

  initLighting() {
    // Ambient light (warm daylight)
    this.ambient = new THREE.AmbientLight(0xdbeafe, 0.75);
    this.scene.add(this.ambient);

    // Directional Sun (no expensive real-time shadow map pass -> locked 60 FPS)
    this.sun = new THREE.DirectionalLight(0xfffbeb, 1.25);
    this.sun.position.set(400, 700, 300);
    this.scene.add(this.sun);

    // Hemisphere light for realistic sky-ground bounce
    this.hemi = new THREE.HemisphereLight(0x38bdf8, 0x1e3a8a, 0.55);
    this.scene.add(this.hemi);
  }

  initSky() {
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.00032);
    this.scene.background = new THREE.Color(0x7dd3fc);

    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff7ed });
    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(50, 16), sunMat);
    sunDisc.position.copy(this.sun.position).multiplyScalar(2.0);
    sunDisc.lookAt(0, 0, 0);
    this.scene.add(sunDisc);
  }

  initOcean() {
    // Lightweight endless ocean plane that follows player coordinates
    const oceanGeo = new THREE.PlaneGeometry(16000, 16000, 12, 12);
    oceanGeo.rotateX(-Math.PI / 2);

    this.oceanMat = new THREE.MeshLambertMaterial({ color: 0x0e3a53 });
    this.ocean = new THREE.Mesh(oceanGeo, this.oceanMat);
    this.ocean.position.y = 0;
    this.scene.add(this.ocean);
  }

  loadMap(mapType) {
    this.currentMap = mapType;

    // Clear existing map objects
    while (this.mapEntities.children.length > 0) {
      const obj = this.mapEntities.children[0];
      this.mapEntities.remove(obj);
    }
    this.balloons = [];

    if (mapType === 'poland') {
      this.buildPolandMap();
    } else if (mapType === 'japan') {
      this.buildJapanMap();
    } else {
      this.buildBritainMap();
    }
  }

  buildBritainMap() {
    // British Channel palette
    this.oceanMat.color.setHex(0x0e3a53);
    this.scene.background.setHex(0x7dd3fc);
    this.scene.fog.color.setHex(0x93c5fd);

    // Rolling English Coastline / Patchwork fields
    const islandGeo = new THREE.PlaneGeometry(7000, 4000, 24, 16);
    islandGeo.rotateX(-Math.PI / 2);

    const pos = islandGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = Math.sin(x * 0.0015) * Math.cos(z * 0.0015) * 80;
      y += Math.sin(x * 0.004) * 35;
      if (y < 10) y = 5;
      pos.setY(i, y);
    }
    islandGeo.computeVertexNormals();

    const terrainTexture = PlaneModels.createCamoTexture('#2d5a27', '#4b7c38', 'splinter');
    terrainTexture.wrapS = THREE.RepeatWrapping;
    terrainTexture.wrapT = THREE.RepeatWrapping;
    terrainTexture.repeat.set(16, 12);

    const terrainMat = new THREE.MeshLambertMaterial({ map: terrainTexture });
    const terrain = new THREE.Mesh(islandGeo, terrainMat);
    terrain.position.set(-1500, 0, -2000);
    this.mapEntities.add(terrain);

    // Dover White Cliffs edge
    const cliffGeo = new THREE.BoxGeometry(3200, 90, 80);
    const cliffMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
    const cliffs = new THREE.Mesh(cliffGeo, cliffMat);
    cliffs.position.set(-1500, 40, -100);
    this.mapEntities.add(cliffs);

    // Barrage balloons guarding Dover airspace
    this.initBalloons();
  }

  buildJapanMap() {
    // Pacific tropical azure ocean & golden-blue sky
    this.oceanMat.color.setHex(0x074e68);
    this.scene.background.setHex(0x60a5fa);
    this.scene.fog.color.setHex(0xbae6fd);

    // 1. MAJESTIC GÓRA FUDŻI (MOUNT FUJI) - Stratovolcano cone on the horizon
    const fujiGroup = new THREE.Group();
    fujiGroup.position.set(0, 0, -3800);

    // Lower volcano cone (dark volcanic rock & cedar forest)
    const volcanoBaseGeo = new THREE.ConeGeometry(1500, 1150, 36, 1, true);
    const volcanoMat = new THREE.MeshLambertMaterial({ color: '#1f2937' });
    const volcanoBase = new THREE.Mesh(volcanoBaseGeo, volcanoMat);
    volcanoBase.position.y = 575;
    fujiGroup.add(volcanoBase);

    // Iconic pure snow-capped peak of Fuji-san!
    const snowCapGeo = new THREE.ConeGeometry(580, 520, 36);
    const snowMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const snowCap = new THREE.Mesh(snowCapGeo, snowMat);
    snowCap.position.y = 890;
    fujiGroup.add(snowCap);

    // Volcanic crater rim
    const craterGeo = new THREE.CylinderGeometry(140, 160, 40, 24);
    const craterMat = new THREE.MeshLambertMaterial({ color: '#111827' });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.position.y = 1145;
    fujiGroup.add(crater);

    this.mapEntities.add(fujiGroup);

    // 2. PACIFIC VOLCANIC ISLANDS ARCHIPELAGO (Wyspy Archipelagu Pacyfiku)
    const islandPositions = [
      { x: -1600, z: 800,  sx: 2600, sz: 1800, h: 140, color: '#15803d' },
      { x: 1800,  z: 300,  sx: 2400, sz: 2200, h: 160, color: '#166534' },
      { x: -400,  z: -1400, sx: 2000, sz: 1400, h: 120, color: '#1e3a1e' }
    ];

    islandPositions.forEach(p => {
      const islGroup = new THREE.Group();
      islGroup.position.set(p.x, 0, p.z);

      // Sandy coast / coral reef base
      const beachGeo = new THREE.CylinderGeometry(p.sx * 0.5, p.sx * 0.54, 8, 20);
      const beachMat = new THREE.MeshLambertMaterial({ color: '#d97706' });
      const beach = new THREE.Mesh(beachGeo, beachMat);
      beach.position.y = 2.0;
      beach.scale.set(1.0, 1.0, p.sz / p.sx);
      islGroup.add(beach);

      // Mountainous jungle center
      const mtnGeo = new THREE.ConeGeometry(p.sx * 0.42, p.h, 16);
      const jungleMat = new THREE.MeshLambertMaterial({ color: p.color });
      const mtn = new THREE.Mesh(mtnGeo, jungleMat);
      mtn.position.y = p.h * 0.5;
      mtn.scale.set(1.0, 1.0, p.sz / p.sx);
      islGroup.add(mtn);

      this.mapEntities.add(islGroup);
    });

    // 3. JAPANESE TORII GATE (Brama Torii na przybrzeżnej skale w wodzie)
    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(300, 0, 600);

    // Rocky foundation islet in the ocean
    const rockGeo = new THREE.CylinderGeometry(35, 45, 12, 12);
    const rockMat = new THREE.MeshLambertMaterial({ color: '#374151' });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.y = 4.0;
    toriiGroup.add(rock);

    // Torii Vermilion Pillars (Kasuga-style Torii)
    const toriiMat = new THREE.MeshLambertMaterial({ color: '#dc2626' });
    const blackMat = new THREE.MeshLambertMaterial({ color: '#0f172a' });

    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.4, 28, 10);
    const p1 = new THREE.Mesh(pillarGeo, toriiMat);
    p1.position.set(-9.5, 18, 0);
    toriiGroup.add(p1);

    const p2 = p1.clone();
    p2.position.x = 9.5;
    toriiGroup.add(p2);

    // Horizontal curving crossbeams (Kasagi & Nuki)
    const kasagiGeo = new THREE.BoxGeometry(28, 2.2, 2.4);
    const kasagi = new THREE.Mesh(kasagiGeo, toriiMat);
    kasagi.position.set(0, 32, 0);
    toriiGroup.add(kasagi);

    // Black top roof ridge on Torii
    const roofRidge = new THREE.Mesh(new THREE.BoxGeometry(29, 0.8, 2.8), blackMat);
    roofRidge.position.set(0, 33.2, 0);
    toriiGroup.add(roofRidge);

    const nukiGeo = new THREE.BoxGeometry(24, 1.6, 1.8);
    const nuki = new THREE.Mesh(nukiGeo, toriiMat);
    nuki.position.set(0, 27, 0);
    toriiGroup.add(nuki);

    this.mapEntities.add(toriiGroup);

    // 4. JAPANESE CASTLE / SHIRASAGI TOWER ON THE HILL
    const pagodaGroup = new THREE.Group();
    pagodaGroup.position.set(-1400, 130, 800);

    const wallMat = new THREE.MeshLambertMaterial({ color: '#f8fafc' });
    const pagodaRoofMat = new THREE.MeshLambertMaterial({ color: '#1e293b' });

    for (let t = 0; t < 3; t++) {
      const s = 1.0 - t * 0.22;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(22 * s, 10, 22 * s), wallMat);
      wall.position.y = t * 14 + 5;
      pagodaGroup.add(wall);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(28 * s, 6, 4), pagodaRoofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = t * 14 + 11;
      pagodaGroup.add(roof);
    }
    this.mapEntities.add(pagodaGroup);
  }

  buildPolandMap() {
    // Baltic Sea palette
    this.oceanMat.color.setHex(0x16344d);
    this.scene.background.setHex(0x7dd3fc);
    this.scene.fog.color.setHex(0x93c5fd);

    // 1. POLISH COAST & MAINLAND (Nizina Polska & Wybrzeże Bałtyku)
    const mainlandGeo = new THREE.PlaneGeometry(8000, 5000, 28, 20);
    mainlandGeo.rotateX(-Math.PI / 2);

    const pos = mainlandGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gentle rolling moraine hills & coastal dunes
      let y = Math.sin(x * 0.0012) * Math.cos(z * 0.0012) * 55;
      y += Math.sin(x * 0.003) * 25;
      if (y < 8) y = 4;
      pos.setY(i, y);
    }
    mainlandGeo.computeVertexNormals();

    const terrainTexture = PlaneModels.createCamoTexture('#2e6b27', '#ca8a04', 'splinter');
    terrainTexture.wrapS = THREE.RepeatWrapping;
    terrainTexture.wrapT = THREE.RepeatWrapping;
    terrainTexture.repeat.set(16, 12);

    const mainlandMat = new THREE.MeshLambertMaterial({ map: terrainTexture });
    const mainland = new THREE.Mesh(mainlandGeo, mainlandMat);
    mainland.position.set(0, 0, -1800);
    this.mapEntities.add(mainland);

    // 2. HEL PENINSULA / PÓŁWYSEP HELSKI (Sandy spit jutting into the Baltic)
    const helSpitGroup = new THREE.Group();
    helSpitGroup.position.set(1200, 0, 400);

    const sandMat = new THREE.MeshLambertMaterial({ color: 0xe2b170 });
    const pineMat = new THREE.MeshLambertMaterial({ color: 0x14532d });

    // Long curved sand spit
    const spitGeo = new THREE.BoxGeometry(220, 8, 2400);
    spitGeo.rotateY(0.35); // Curved angle of Hel
    const spit = new THREE.Mesh(spitGeo, sandMat);
    spit.position.set(0, 4, 0);
    helSpitGroup.add(spit);

    // Pine forest ridge along Hel spit
    const pineRidgeGeo = new THREE.ConeGeometry(40, 18, 5);
    for (let p = -1000; p < 1000; p += 160) {
      const pine = new THREE.Mesh(pineRidgeGeo, pineMat);
      const px = Math.sin(p * 0.002) * 30;
      pine.position.set(px, 12, p);
      helSpitGroup.add(pine);
    }
    this.mapEntities.add(helSpitGroup);

    // 3. TATRA MOUNTAINS (TATRY / RYSY - Ośnieżone granie na południowym horyzoncie)
    const tatraGroup = new THREE.Group();
    tatraGroup.position.set(0, 0, -4200);

    const graniteMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const snowMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });

    const peaks = [
      { x: -1600, h: 540, r: 420 },
      { x: -800,  h: 680, r: 480 },
      { x: 0,     h: 780, r: 520 }, // Rysy peak
      { x: 850,   h: 640, r: 460 },
      { x: 1700,  h: 520, r: 400 },
      { x: 2500,  h: 460, r: 380 }
    ];

    peaks.forEach(p => {
      // Granite base
      const peakGeo = new THREE.ConeGeometry(p.r, p.h, 7);
      const peak = new THREE.Mesh(peakGeo, graniteMat);
      peak.position.set(p.x, p.h * 0.5, 0);
      tatraGroup.add(peak);

      // Bright white snow cap
      const snowGeo = new THREE.ConeGeometry(p.r * 0.38, p.h * 0.38, 7);
      const snow = new THREE.Mesh(snowGeo, snowMat);
      snow.position.set(p.x, p.h * 0.81, 0);
      tatraGroup.add(snow);
    });
    this.mapEntities.add(tatraGroup);

    // 4. POLISH TACTICAL AIR BASE (Baza Lotnictwa Taktycznego RP)
    const baseGroup = new THREE.Group();
    baseGroup.position.set(-800, 16, -1100);

    // Asphalt concrete runway (Pas startowy 3200m)
    const tarmacMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const runwayGeo = new THREE.BoxGeometry(140, 2, 2800);
    const runway = new THREE.Mesh(runwayGeo, tarmacMat);
    baseGroup.add(runway);

    // Runway white centerlines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let z = -1200; z <= 1200; z += 120) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 50), lineMat);
      stripe.position.set(0, 1.2, z);
      baseGroup.add(stripe);
    }

    // NATO Hardened Aircraft Shelters (HAS / Schronohangary)
    const hangarMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    for (let h = -2; h <= 2; h++) {
      const hasGeo = new THREE.CylinderGeometry(30, 30, 70, 12, 1, false, 0, Math.PI);
      hasGeo.rotateZ(Math.PI / 2);
      const hangar = new THREE.Mesh(hasGeo, hangarMat);
      hangar.position.set(140, 0, h * 160);
      baseGroup.add(hangar);
    }

    // Polish Air Base Control Tower with radome
    const towerMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(24, 60, 24), towerMat);
    tower.position.set(-140, 30, 0);
    baseGroup.add(tower);

    const radomeGeo = new THREE.SphereGeometry(14, 12, 10);
    const radome = new THREE.Mesh(radomeGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    radome.position.set(-140, 68, 0);
    baseGroup.add(radome);

    this.mapEntities.add(baseGroup);

    // 5. BALTIC LIGHTHOUSE (Latarnia morska na przylądku Rozewie / Hel)
    const lightGroup = new THREE.Group();
    lightGroup.position.set(1600, 10, 800);

    const redMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });

    for (let s = 0; s < 5; s++) {
      const segGeo = new THREE.CylinderGeometry(9 - s * 0.7, 10 - s * 0.7, 12, 12);
      const seg = new THREE.Mesh(segGeo, s % 2 === 0 ? redMat : whiteMat);
      seg.position.y = s * 12 + 6;
      lightGroup.add(seg);
    }

    const lanternRoom = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 8, 10),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lanternRoom.position.y = 64;
    lightGroup.add(lanternRoom);

    const dome = new THREE.Mesh(
      new THREE.ConeGeometry(7, 6, 12),
      redMat
    );
    dome.position.y = 71;
    lightGroup.add(dome);

    this.mapEntities.add(lightGroup);

    // 6. COASTAL MILITARY RADAR STATION (Ośrodek Radiolokacyjny z radarem dalekiego zasięgu)
    const radarGroup = new THREE.Group();
    radarGroup.position.set(450, 12, -450);

    const bunker = new THREE.Mesh(
      new THREE.BoxGeometry(44, 16, 44),
      new THREE.MeshLambertMaterial({ color: 0x334155 })
    );
    bunker.position.y = 8;
    radarGroup.add(bunker);

    const bigDome = new THREE.Mesh(
      new THREE.SphereGeometry(22, 16, 12),
      new THREE.MeshLambertMaterial({ color: 0xf8fafc })
    );
    bigDome.position.y = 30;
    radarGroup.add(bigDome);

    this.mapEntities.add(radarGroup);
  }

  initClouds() {
    // Low-poly opaque Lambert cloud clusters (no alpha-sorting overhead!)
    const cloudGeo = new THREE.DodecahedronGeometry(48, 0);
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      flatShading: true
    });

    const cloudClusterCount = 20;
    for (let i = 0; i < cloudClusterCount; i++) {
      const cluster = new THREE.Group();
      const clusterX = (Math.random() - 0.5) * 6500;
      const clusterY = 400 + Math.random() * 450;
      const clusterZ = (Math.random() - 0.5) * 6500;

      const puffCount = 4 + Math.floor(Math.random() * 3);
      for (let j = 0; j < puffCount; j++) {
        const puff = new THREE.Mesh(cloudGeo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 110,
          (Math.random() - 0.5) * 35,
          (Math.random() - 0.5) * 110
        );
        const s = 0.85 + Math.random() * 1.25;
        puff.scale.set(s, s * 0.6, s);
        cluster.add(puff);
      }

      cluster.position.set(clusterX, clusterY, clusterZ);
      this.scene.add(cluster);
      this.clouds.push(cluster);

      this.cloudBoxes.push({
        center: new THREE.Vector3(clusterX, clusterY, clusterZ),
        radius: 140
      });
    }
  }

  initBalloons() {
    const balloonMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const cableMat = new THREE.LineBasicMaterial({ color: 0x475569 });
    const bGeo = new THREE.SphereGeometry(14, 10, 8);
    bGeo.scale(1.0, 1.1, 2.2);
    const finGeo = new THREE.BoxGeometry(1.2, 12, 10);

    for (let i = 0; i < 6; i++) {
      const bGroup = new THREE.Group();
      const x = -800 + (Math.random() - 0.5) * 1200;
      const z = -400 + (Math.random() - 0.5) * 800;
      const y = 180 + Math.random() * 120;

      const bMesh = new THREE.Mesh(bGeo, balloonMat);
      bGroup.add(bMesh);

      const fin = new THREE.Mesh(finGeo, balloonMat);
      fin.position.set(0, 0, -18);
      bGroup.add(fin);

      const cablePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -y, 0)];
      const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
      const cable = new THREE.Line(cableGeo, cableMat);
      bGroup.add(cable);

      bGroup.position.set(x, y, z);
      this.mapEntities.add(bGroup);
      this.balloons.push(bGroup);
    }
  }

  isInsideCloud(pos) {
    for (let i = 0; i < this.cloudBoxes.length; i++) {
      if (this.cloudBoxes[i].center.distanceTo(pos) < this.cloudBoxes[i].radius) {
        return true;
      }
    }
    return false;
  }

  update(dt, playerPos) {
    for (let i = 0; i < this.clouds.length; i++) {
      this.clouds[i].position.x += 6.0 * dt;
      if (this.clouds[i].position.x > 3800) {
        this.clouds[i].position.x = -3800;
      }
      this.cloudBoxes[i].center.copy(this.clouds[i].position);
    }

    if (playerPos) {
      this.ocean.position.x = playerPos.x;
      this.ocean.position.z = playerPos.z;
    }
  }
}

window.World = World;

// High-Performance 3D Environment: Sky, Sea, Terrain, Clouds, and Barrage Balloons

class World {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.cloudBoxes = [];
    this.balloons = [];
    this.rotatingRadars = [];
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

    if (mapType === 'japan') {
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

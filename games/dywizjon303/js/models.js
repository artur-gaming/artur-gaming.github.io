// Procedural 3D WWII Airplane Models for Three.js
// Includes Spitfire (Dywizjon 303), Bf 109, Ju 87 Stuka, and Allied Heavy Bomber

const PlaneModels = {
  _cache: {},

  // --- PROCEDURAL TEXTURES (CACHED) ---
  createPolishChessboardTexture() {
    if (this._cache.polish) return this._cache.polish;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Red & white checkerboard with border
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillRect(64, 64, 64, 64);
    
    // Inverted inner squares (authentic Polish air force szachownica)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(16, 16, 32, 32);
    ctx.fillRect(80, 80, 32, 32);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, 16, 32, 32);
    ctx.fillRect(16, 80, 32, 32);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(2, 2, 124, 124);

    this._cache.polish = new THREE.CanvasTexture(canvas);
    return this._cache.polish;
  },

  createRAFRoundelTexture() {
    if (this._cache.raf) return this._cache.raf;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Concentric circles: Blue, White, Red (RAF Type B/C)
    ctx.fillStyle = '#1e3a8a'; // Outer blue
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc'; // White
    ctx.beginPath();
    ctx.arc(64, 64, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626'; // Inner Red
    ctx.beginPath();
    ctx.arc(64, 64, 20, 0, Math.PI * 2);
    ctx.fill();

    this._cache.raf = new THREE.CanvasTexture(canvas);
    return this._cache.raf;
  },

  createUSStarTexture() {
    if (this._cache.usStar) return this._cache.usStar;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 128, 128);

    // Blue circle background
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(64, 64, 54, 0, Math.PI * 2);
    ctx.fill();

    // 5-pointed White USAAF Star
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const cx = 64, cy = 64, outerR = 48, innerR = 19;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    this._cache.usStar = new THREE.CanvasTexture(canvas);
    return this._cache.usStar;
  },

  createBalkenkreuzTexture() {
    if (this._cache.balkenkreuz) return this._cache.balkenkreuz;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, 128, 128);

    // Luftwaffe cross: Black center cross with white outline border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 48, 88, 32);
    ctx.fillRect(48, 20, 32, 88);

    ctx.fillStyle = '#111827';
    ctx.fillRect(32, 54, 64, 20);
    ctx.fillRect(54, 32, 20, 64);

    this._cache.balkenkreuz = new THREE.CanvasTexture(canvas);
    return this._cache.balkenkreuz;
  },

  createHinomaruTexture() {
    if (this._cache.hinomaru) return this._cache.hinomaru;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    // White outline border
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fill();

    // Red Sun (Hinomaru)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(64, 64, 46, 0, Math.PI * 2);
    ctx.fill();

    this._cache.hinomaru = new THREE.CanvasTexture(canvas);
    return this._cache.hinomaru;
  },

  createNukeHazardTexture() {
    if (this._cache.nukeHazard) return this._cache.nukeHazard;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Yellow warning background
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, 128, 128);

    // Black radiation trefoil symbol
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(64, 64, 14, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const startAngle = (i * 120 - 90) * Math.PI / 180;
      const endAngle = (i * 120 - 30) * Math.PI / 180;
      ctx.beginPath();
      ctx.arc(64, 64, 46, startAngle, endAngle);
      ctx.arc(64, 64, 22, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();
    }

    this._cache.nukeHazard = new THREE.CanvasTexture(canvas);
    return this._cache.nukeHazard;
  },

  createCamoTexture(color1, color2, patternType = 'splinter') {
    const key = `camo_${color1}_${color2}_${patternType}`;
    if (this._cache[key]) return this._cache[key];
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = color2;
    if (patternType === 'splinter') {
      // Angular military camouflage shapes
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(120, 20);
      ctx.lineTo(180, 120);
      ctx.lineTo(80, 160);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(140, 150);
      ctx.lineTo(256, 100);
      ctx.lineTo(256, 230);
      ctx.lineTo(180, 256);
      ctx.closePath();
      ctx.fill();
    } else {
      // Organic rounded patches
      ctx.beginPath();
      ctx.arc(80, 70, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(190, 180, 75, 0, Math.PI * 2);
      ctx.fill();
    }

    this._cache[key] = new THREE.CanvasTexture(canvas);
    return this._cache[key];
  },

  // --- SPITFIRE (PLAYER) ---
  createSpitfire() {
    const group = new THREE.Group();
    group.name = 'Spitfire';

    // Materials
    const camoTexture = this.createCamoTexture('#3f4e38', '#5d4037', 'organic'); // RAF Dark Green & Earth
    const fuselageMat = new THREE.MeshStandardMaterial({
      map: camoTexture,
      roughness: 0.5,
      metalness: 0.2
    });
    const undersideMat = new THREE.MeshStandardMaterial({
      color: '#93c5fd', // Sky blue underside
      roughness: 0.6
    });
    const yellowLeadingEdgeMat = new THREE.MeshStandardMaterial({
      color: '#eab308',
      roughness: 0.4
    });
    const cockpitGlassMat = new THREE.MeshLambertMaterial({
      color: '#67e8f9',
      opacity: 0.65,
      transparent: true
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: '#262626',
      metalness: 0.8,
      roughness: 0.3
    });

    // 1. Fuselage
    const fuselageGeo = new THREE.CylinderGeometry(0.55, 0.25, 7.2, 16);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    fuselage.scale.set(0.85, 1.1, 1.0);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    group.add(fuselage);

    // Engine Cowl Nose Cone
    const noseGeo = new THREE.ConeGeometry(0.53, 1.4, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, metalMat);
    nose.position.z = 4.2;
    group.add(nose);

    // 2. Iconic Elliptical Wings (Left & Right built cleanly with proper normals)
    const createWingHalf = (side) => {
      // side: 1 for left (+X), -1 for right (-X)
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.75); // Front root (leading edge)
      shape.bezierCurveTo(
        side * 2.2, 0.85,
        side * 4.6, 0.65,
        side * 5.6, 0.05 // Wingtip
      );
      shape.bezierCurveTo(
        side * 5.5, -0.55,
        side * 3.4, -0.95,
        0, -0.85 // Rear root (trailing edge)
      );
      shape.closePath();

      const extrudeSettings = {
        depth: 0.1,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.03,
        bevelThickness: 0.03
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.translate(0, 0, -0.05);
      geo.rotateX(Math.PI / 2); // Maps (x, y, z) -> (x, -z, y) so y becomes Z (chord)
      return geo;
    };

    const leftWing = new THREE.Mesh(createWingHalf(1), fuselageMat);
    leftWing.position.set(0.2, -0.12, 0.6);
    leftWing.rotation.z = 0.05; // Upward dihedral for +X wing
    leftWing.castShadow = true;
    leftWing.receiveShadow = true;
    group.add(leftWing);

    const rightWing = new THREE.Mesh(createWingHalf(-1), fuselageMat);
    rightWing.position.set(-0.2, -0.12, 0.6);
    rightWing.rotation.z = -0.05; // Upward dihedral for -X wing
    rightWing.castShadow = true;
    rightWing.receiveShadow = true;
    group.add(rightWing);

    // RAF Roundels on wings
    const roundelMat = new THREE.MeshBasicMaterial({
      map: this.createRAFRoundelTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const roundelPlane = new THREE.PlaneGeometry(1.15, 1.15);
    roundelPlane.rotateX(-Math.PI / 2);

    const lRoundel = new THREE.Mesh(roundelPlane, roundelMat);
    lRoundel.position.set(3.4, 0.08, 0.55);
    lRoundel.rotation.z = 0.05;
    group.add(lRoundel);

    const rRoundel = new THREE.Mesh(roundelPlane, roundelMat);
    rRoundel.position.set(-3.4, 0.08, 0.55);
    rRoundel.rotation.z = -0.05;
    group.add(rRoundel);

    // Polish 303 Squadron Chessboard on Fuselage sides!
    const checkerMat = new THREE.MeshBasicMaterial({
      map: this.createPolishChessboardTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });
    const checkerPlane = new THREE.PlaneGeometry(0.48, 0.48);

    const lChecker = new THREE.Mesh(checkerPlane, checkerMat);
    lChecker.position.set(0.48, 0.2, 1.3);
    lChecker.rotation.y = Math.PI / 2;
    group.add(lChecker);

    const rChecker = new THREE.Mesh(checkerPlane, checkerMat);
    rChecker.position.set(-0.48, 0.2, 1.3);
    rChecker.rotation.y = -Math.PI / 2;
    group.add(rChecker);

    // Fuselage side RAF roundels toward the rear
    const sideRoundelPlane = new THREE.PlaneGeometry(0.65, 0.65);
    const lSideRoundel = new THREE.Mesh(sideRoundelPlane, roundelMat);
    lSideRoundel.position.set(0.42, 0.15, -1.1);
    lSideRoundel.rotation.y = Math.PI / 2;
    group.add(lSideRoundel);

    const rSideRoundel = new THREE.Mesh(sideRoundelPlane, roundelMat);
    rSideRoundel.position.set(-0.42, 0.15, -1.1);
    rSideRoundel.rotation.y = -Math.PI / 2;
    group.add(rSideRoundel);

    // 3. Tail Assembly (Properly aligned in YZ plane for Vertical Fin + Elliptical Horizontal Tailplane)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, 0);

    // Vertical Stabilizer & Rudder (Statecznik pionowy)
    // Drawn in (u, v) where rotateY(-Math.PI/2) maps u -> +Z and v -> +Y, thickness -> X
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0); // Dorsal spine start
    finShape.quadraticCurveTo(-0.75, 0.35, -1.2, 1.32); // Swept leading edge
    finShape.bezierCurveTo(-1.38, 1.52, -1.68, 1.42, -1.74, 0.95); // Iconic elliptical Spitfire fin top
    finShape.bezierCurveTo(-1.82, 0.45, -1.72, 0.0, -1.52, -0.15); // Curved rudder trailing edge
    finShape.lineTo(0, -0.05);
    finShape.closePath();

    const finExtrude = {
      depth: 0.07,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };
    const finGeo = new THREE.ExtrudeGeometry(finShape, finExtrude);
    finGeo.translate(0, 0, -0.035); // Center thickness on X = 0
    finGeo.rotateY(-Math.PI / 2); // Align fin along YZ plane!

    const fin = new THREE.Mesh(finGeo, fuselageMat);
    fin.position.set(0, 0.18, -1.95);
    fin.castShadow = true;
    tailGroup.add(fin);

    // Elliptical Horizontal Stabilizers (Stateczniki poziome)
    const hTailShape = new THREE.Shape();
    hTailShape.moveTo(-1.75, 0);
    hTailShape.bezierCurveTo(-1.65, 0.45, -0.8, 0.55, 0, 0.55); // Left leading edge
    hTailShape.bezierCurveTo(0.8, 0.55, 1.65, 0.45, 1.75, 0);   // Right leading edge
    hTailShape.bezierCurveTo(1.65, -0.38, 0.8, -0.45, 0, -0.45); // Right trailing edge
    hTailShape.bezierCurveTo(-0.8, -0.45, -1.65, -0.38, -1.75, 0); // Left trailing edge
    hTailShape.closePath();

    const hTailGeo = new THREE.ExtrudeGeometry(hTailShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015
    });
    hTailGeo.translate(0, 0, -0.025);
    hTailGeo.rotateX(Math.PI / 2); // Flat in XZ plane

    const hTail = new THREE.Mesh(hTailGeo, fuselageMat);
    hTail.position.set(0, 0.18, -3.15);
    hTail.castShadow = true;
    tailGroup.add(hTail);

    // Rounded Tail Cone tip
    const tailConeGeo = new THREE.ConeGeometry(0.22, 0.55, 12);
    tailConeGeo.rotateX(Math.PI / 2); // Pointing -Z
    const tailCone = new THREE.Mesh(tailConeGeo, fuselageMat);
    tailCone.position.set(0, 0.05, -3.7);
    tailCone.scale.set(0.85, 1.1, 1.0);
    tailGroup.add(tailCone);

    // Tailwheel strut & wheel
    const tailStrut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.28, 6),
      metalMat
    );
    tailStrut.position.set(0, -0.25, -3.25);
    tailStrut.rotation.x = 0.25;
    tailGroup.add(tailStrut);

    const tailWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10),
      metalMat
    );
    tailWheel.rotation.z = Math.PI / 2;
    tailWheel.position.set(0, -0.38, -3.3);
    tailGroup.add(tailWheel);

    group.add(tailGroup);

    // 4. Cockpit Canopy & Interior
    const canopyGeo = new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    canopyGeo.scale(0.85, 1.1, 2.2);
    const canopy = new THREE.Mesh(canopyGeo, cockpitGlassMat);
    canopy.position.set(0, 0.48, 0.3);
    group.add(canopy);

    // Pilot head
    const pilotHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#78350f' }) // Leather flight helmet
    );
    pilotHead.position.set(0, 0.45, 0.2);
    group.add(pilotHead);

    // 5. Armament: Twin Hispano 20mm cannons + 4 Browning .303
    const cannonGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8);
    cannonGeo.rotateX(Math.PI / 2);
    const rCannon = new THREE.Mesh(cannonGeo, metalMat);
    rCannon.position.set(1.9, -0.05, 1.2);
    group.add(rCannon);

    const lCannon = rCannon.clone();
    lCannon.position.x = -1.9;
    group.add(lCannon);

    // Gun ports (muzzle positions for projectile spawning)
    group.userData.gunMuzzles = [
      new THREE.Vector3(1.9, -0.05, 2.0),
      new THREE.Vector3(-1.9, -0.05, 2.0),
      new THREE.Vector3(2.5, -0.05, 1.2),
      new THREE.Vector3(-2.5, -0.05, 1.2)
    ];

    // 6. Propeller Hub & Spinning Blades
    const propGroup = new THREE.Group();
    propGroup.position.z = 4.9;

    const spinnerGeo = new THREE.ConeGeometry(0.25, 0.6, 12);
    spinnerGeo.rotateX(-Math.PI / 2);
    const spinner = new THREE.Mesh(spinnerGeo, metalMat);
    propGroup.add(spinner);

    // Propeller blur disc (semi-transparent rotating circle)
    const blurGeo = new THREE.CircleGeometry(1.6, 24);
    const blurMat = new THREE.MeshBasicMaterial({
      color: '#d4d4d8',
      opacity: 0.3,
      transparent: true,
      side: THREE.DoubleSide
    });
    const blurDisc = new THREE.Mesh(blurGeo, blurMat);
    propGroup.add(blurDisc);

    // Physical blades
    const bladeGeo = new THREE.BoxGeometry(0.12, 1.5, 0.02);
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, metalMat);
      blade.rotation.z = (i * Math.PI * 2) / 3;
      blade.position.y = Math.sin(blade.rotation.z) * 0.7;
      blade.position.x = Math.cos(blade.rotation.z) * 0.7;
      propGroup.add(blade);
    }

    group.add(propGroup);
    group.userData.propeller = propGroup;

    // Cockpit camera position relative to model
    group.userData.cockpitPos = new THREE.Vector3(0, 0.58, 0.15);
    // Chase camera offset
    group.userData.chaseOffset = new THREE.Vector3(0, 2.8, -8.5);

    return group;
  },

  // --- MESSERSCHMITT BF 109 (LUFTWAFFE FIGHTER) ---
  createBf109() {
    const group = new THREE.Group();
    group.name = 'Bf109';

    const camoTexture = this.createCamoTexture('#2d3748', '#4b5563', 'splinter');
    const fuselageMat = new THREE.MeshStandardMaterial({
      map: camoTexture,
      roughness: 0.5,
      metalness: 0.3
    });
    const yellowNoseMat = new THREE.MeshStandardMaterial({
      color: '#eab308', // Iconic Luftwaffe Yellow Nose (Gelbnase)
      roughness: 0.4
    });
    const undersideMat = new THREE.MeshStandardMaterial({
      color: '#7dd3fc',
      roughness: 0.6
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.8
    });
    const cockpitMat = new THREE.MeshLambertMaterial({
      color: '#38bdf8',
      opacity: 0.7,
      transparent: true
    });

    // 1. Fuselage
    const fuseGeo = new THREE.CylinderGeometry(0.5, 0.2, 6.8, 12);
    fuseGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuseGeo, fuselageMat);
    fuselage.scale.set(0.75, 1.05, 1.0);
    fuselage.castShadow = true;
    group.add(fuselage);

    // Yellow Engine Nose Cowl
    const noseGeo = new THREE.ConeGeometry(0.48, 1.5, 12);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, yellowNoseMat);
    nose.position.z = 3.9;
    group.add(nose);

    // 2. Straight Tapered Wings (Messerschmitt sharp wingtips)
    const wingGeo = new THREE.BoxGeometry(9.6, 0.12, 1.8);
    const wing = new THREE.Mesh(wingGeo, fuselageMat);
    wing.position.set(0, -0.15, 0.6);
    wing.castShadow = true;
    group.add(wing);

    // Yellow wingtips
    const rTip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.13, 1.8), yellowNoseMat);
    rTip.position.set(4.4, -0.15, 0.6);
    group.add(rTip);

    const lTip = rTip.clone();
    lTip.position.x = -4.4;
    group.add(lTip);

    // Luftwaffe Balkenkreuz on Wings
    const crossMat = new THREE.MeshBasicMaterial({
      map: this.createBalkenkreuzTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const crossPlane = new THREE.PlaneGeometry(1.2, 1.2);
    crossPlane.rotateX(-Math.PI / 2);

    const rCross = new THREE.Mesh(crossPlane, crossMat);
    rCross.position.set(2.8, -0.08, 0.6);
    group.add(rCross);

    const lCross = rCross.clone();
    lCross.position.x = -2.8;
    group.add(lCross);

    // Balkenkreuz on fuselage side
    const sideCrossPlane = new THREE.PlaneGeometry(0.5, 0.5);
    const rSideCross = new THREE.Mesh(sideCrossPlane, crossMat);
    rSideCross.position.set(0.45, 0.1, -0.8);
    rSideCross.rotation.y = Math.PI / 2;
    group.add(rSideCross);

    const lSideCross = rSideCross.clone();
    lSideCross.position.x = -0.45;
    lSideCross.rotation.y = -Math.PI / 2;
    group.add(lSideCross);

    // 3. Tail Assembly (Angular Bf 109 Tail with strut braces)
    const tailFinGeo = new THREE.BoxGeometry(0.08, 1.4, 1.1);
    const tailFin = new THREE.Mesh(tailFinGeo, fuselageMat);
    tailFin.position.set(0, 0.8, -2.8);
    group.add(tailFin);

    const hStabGeo = new THREE.BoxGeometry(2.6, 0.08, 0.7);
    const hStab = new THREE.Mesh(hStabGeo, fuselageMat);
    hStab.position.set(0, 0.45, -2.9);
    group.add(hStab);

    // 4. Stepped Greenhouse Canopy
    const canopyGeo = new THREE.BoxGeometry(0.55, 0.5, 1.8);
    const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
    canopy.position.set(0, 0.5, 0.4);
    group.add(canopy);

    // 5. Guns (Twin cowl MG 17 + Motorkanone hub)
    const mgGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
    mgGeo.rotateX(Math.PI / 2);
    const rMG = new THREE.Mesh(mgGeo, metalMat);
    rMG.position.set(0.15, 0.4, 2.5);
    group.add(rMG);

    const lMG = rMG.clone();
    lMG.position.x = -0.15;
    group.add(lMG);

    group.userData.gunMuzzles = [
      new THREE.Vector3(0.15, 0.4, 3.2),
      new THREE.Vector3(-0.15, 0.4, 3.2)
    ];

    // 6. Propeller with spiral spinner
    const propGroup = new THREE.Group();
    propGroup.position.z = 4.65;

    const spinnerGeo = new THREE.ConeGeometry(0.24, 0.6, 12);
    spinnerGeo.rotateX(-Math.PI / 2);
    const spinner = new THREE.Mesh(spinnerGeo, yellowNoseMat);
    propGroup.add(spinner);

    const blurGeo = new THREE.CircleGeometry(1.5, 20);
    const blurMat = new THREE.MeshBasicMaterial({
      color: '#cbd5e1',
      opacity: 0.35,
      transparent: true,
      side: THREE.DoubleSide
    });
    const blurDisc = new THREE.Mesh(blurGeo, blurMat);
    propGroup.add(blurDisc);

    group.add(propGroup);
    group.userData.propeller = propGroup;

    return group;
  },

  // --- JUNKERS JU 87 "STUKA" (DIVE BOMBER) ---
  createStuka() {
    const group = new THREE.Group();
    group.name = 'Ju87Stuka';

    const camoTexture = this.createCamoTexture('#1b3820', '#2d4030', 'splinter');
    const mat = new THREE.MeshStandardMaterial({ map: camoTexture, roughness: 0.6 });
    const metalMat = new THREE.MeshStandardMaterial({ color: '#222', metalness: 0.7 });
    const glassMat = new THREE.MeshLambertMaterial({ color: '#93c5fd', opacity: 0.65, transparent: true });

    // Fuselage
    const fuseGeo = new THREE.CylinderGeometry(0.65, 0.3, 7.8, 12);
    fuseGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuseGeo, mat);
    fuselage.scale.set(0.85, 1.2, 1.0);
    fuselage.castShadow = true;
    group.add(fuselage);

    // Inverted Gull Wings (characteristic W-wing bend)
    // Inner wing section (angled down)
    const innerWingGeo = new THREE.BoxGeometry(2.2, 0.16, 2.2);
    const rInner = new THREE.Mesh(innerWingGeo, mat);
    rInner.position.set(1.4, -0.4, 0.3);
    rInner.rotation.z = -0.22;
    group.add(rInner);

    const lInner = rInner.clone();
    lInner.position.x = -1.4;
    lInner.rotation.z = 0.22;
    group.add(lInner);

    // Outer wing section (angled up)
    const outerWingGeo = new THREE.BoxGeometry(4.2, 0.14, 1.8);
    const rOuter = new THREE.Mesh(outerWingGeo, mat);
    rOuter.position.set(4.2, -0.3, 0.3);
    rOuter.rotation.z = 0.12;
    group.add(rOuter);

    const lOuter = rOuter.clone();
    lOuter.position.x = -4.2;
    lOuter.rotation.z = -0.12;
    group.add(lOuter);

    // Fixed Landing Gear with aerodynamic spats (pants)
    const spatGeo = new THREE.ConeGeometry(0.35, 1.6, 8);
    const rSpat = new THREE.Mesh(spatGeo, mat);
    rSpat.position.set(2.2, -1.3, 0.6);
    rSpat.rotation.x = 0.2;
    group.add(rSpat);

    const lSpat = rSpat.clone();
    lSpat.position.x = -2.2;
    group.add(lSpat);

    // Heavy bomb under fuselage
    const bombGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.8, 10);
    bombGeo.rotateX(Math.PI / 2);
    const bomb = new THREE.Mesh(bombGeo, metalMat);
    bomb.position.set(0, -0.9, 0.5);
    group.add(bomb);

    // Long greenhouse canopy (pilot + rear gunner)
    const canopyGeo = new THREE.BoxGeometry(0.6, 0.6, 2.8);
    const canopy = new THREE.Mesh(canopyGeo, glassMat);
    canopy.position.set(0, 0.65, 0.2);
    group.add(canopy);

    // Rear machine gun pointing backward
    const rearGunGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6);
    rearGunGeo.rotateX(-Math.PI / 3);
    const rearGun = new THREE.Mesh(rearGunGeo, metalMat);
    rearGun.position.set(0, 0.8, -1.3);
    group.add(rearGun);

    // Balkenkreuz
    const crossMat = new THREE.MeshBasicMaterial({
      map: this.createBalkenkreuzTexture(),
      transparent: true
    });
    const crossPlane = new THREE.PlaneGeometry(1.4, 1.4);
    crossPlane.rotateX(-Math.PI / 2);
    const rCross = new THREE.Mesh(crossPlane, crossMat);
    rCross.position.set(3.8, -0.15, 0.3);
    group.add(rCross);

    const lCross = rCross.clone();
    lCross.position.x = -3.8;
    group.add(lCross);

    // Tail
    const finGeo = new THREE.BoxGeometry(0.1, 1.8, 1.3);
    const fin = new THREE.Mesh(finGeo, mat);
    fin.position.set(0, 0.9, -3.2);
    group.add(fin);

    const hStabGeo = new THREE.BoxGeometry(3.6, 0.1, 0.9);
    const hStab = new THREE.Mesh(hStabGeo, mat);
    hStab.position.set(0, 0.5, -3.4);
    group.add(hStab);

    // Propeller
    const propGroup = new THREE.Group();
    propGroup.position.z = 4.2;
    const blurGeo = new THREE.CircleGeometry(1.6, 20);
    const blurDisc = new THREE.Mesh(blurGeo, new THREE.MeshBasicMaterial({ color: '#cbd5e1', opacity: 0.35, transparent: true, side: THREE.DoubleSide }));
    propGroup.add(blurDisc);
    group.add(propGroup);
    group.userData.propeller = propGroup;

    group.userData.gunMuzzles = [
      new THREE.Vector3(2.2, -0.4, 1.2),
      new THREE.Vector3(-2.2, -0.4, 1.2)
    ];

    return group;
  },

  // --- BOEING B-17G "FLYING FORTRESS" (LATAJĄCA FORTECA) ---
  createB17() {
    const group = new THREE.Group();
    group.name = 'B17';

    const camoTexture = this.createCamoTexture('#3d4834', '#4a553f', 'organic');
    const oliveMat = new THREE.MeshStandardMaterial({ map: camoTexture, roughness: 0.65, metalness: 0.15 });
    const redTailMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.5 }); // 8th Air Force Red Tail
    const metalMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.75, roughness: 0.35 });
    const glassMat = new THREE.MeshLambertMaterial({ color: '#7dd3fc', opacity: 0.68, transparent: true });
    const yellowTipMat = new THREE.MeshBasicMaterial({ color: '#facc15' });

    // 1. Main Fuselage (cigar-shaped heavy bomber hull)
    const fuseGeo = new THREE.CylinderGeometry(1.15, 0.52, 15.6, 14);
    fuseGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuseGeo, oliveMat);
    fuselage.scale.set(0.92, 1.12, 1.0);
    group.add(fuselage);

    // Plexiglass Bombardier Nose Cone
    const noseGeo = new THREE.SphereGeometry(1.02, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, glassMat);
    nose.scale.set(0.9, 1.05, 1.35);
    nose.position.set(0, -0.05, 7.75);
    group.add(nose);

    // Stepped Pilot / Copilot Windshield Cabin
    const cabinGeo = new THREE.BoxGeometry(1.35, 0.65, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 0.95, 4.6);
    group.add(cabin);

    // 2. B-17G Iconic Bendix Chin Turret (under nose) with Twin .50 cal M2 Brownings
    const chinTurret = new THREE.Group();
    chinTurret.position.set(0, -0.95, 7.6);
    const chinBody = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), metalMat);
    chinTurret.add(chinBody);

    const gunBarrelGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.2, 6);
    gunBarrelGeo.rotateX(Math.PI / 2);
    const chinGunL = new THREE.Mesh(gunBarrelGeo, metalMat);
    chinGunL.position.set(0.16, -0.05, 0.55);
    chinTurret.add(chinGunL);
    const chinGunR = chinGunL.clone();
    chinGunR.position.x = -0.16;
    chinTurret.add(chinGunR);
    group.add(chinTurret);

    // 3. Sperry Top Dorsal Turret & Belly Ball Turret & Tail Stinger Turret
    const turretSphereGeo = new THREE.SphereGeometry(0.52, 10, 8);
    const topTurret = new THREE.Mesh(turretSphereGeo, glassMat);
    topTurret.position.set(0, 1.32, 2.8);
    group.add(topTurret);

    const topGunL = new THREE.Mesh(gunBarrelGeo, metalMat);
    topGunL.position.set(0.15, 1.48, 3.3);
    group.add(topGunL);
    const topGunR = topGunL.clone();
    topGunR.position.x = -0.15;
    group.add(topGunR);

    const ballTurret = new THREE.Mesh(turretSphereGeo, metalMat);
    ballTurret.position.set(0, -1.25, -0.4);
    group.add(ballTurret);

    // Tail Gunner ("Stinger") position at the rear tip
    const tailConeGeo = new THREE.ConeGeometry(0.48, 1.4, 10);
    tailConeGeo.rotateX(Math.PI / 2);
    const tailCone = new THREE.Mesh(tailConeGeo, redTailMat);
    tailCone.position.set(0, 0.1, -8.3);
    group.add(tailCone);

    const tailGunL = new THREE.Mesh(gunBarrelGeo, metalMat);
    tailGunL.position.set(0.12, 0.15, -9.1);
    group.add(tailGunL);
    const tailGunR = tailGunL.clone();
    tailGunR.position.x = -0.12;
    group.add(tailGunR);

    // 4. Swept Tapered B-17 Wings (24m wingspan)
    const createBomberWing = (side) => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 1.8);                // Root leading edge
      shape.lineTo(side * 12.2, 0.6);      // Wingtip leading edge
      shape.quadraticCurveTo(side * 12.8, 0.0, side * 12.2, -0.7); // Rounded wingtip
      shape.lineTo(0, -1.8);               // Root trailing edge
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 });
      geo.translate(0, 0, -0.12);
      geo.rotateX(Math.PI / 2);
      return geo;
    };

    const leftWing = new THREE.Mesh(createBomberWing(1), oliveMat);
    leftWing.position.set(0.4, 0.05, 1.6);
    leftWing.rotation.z = 0.04; // Dihedral
    group.add(leftWing);

    const rightWing = new THREE.Mesh(createBomberWing(-1), oliveMat);
    rightWing.position.set(-0.4, 0.05, 1.6);
    rightWing.rotation.z = -0.04;
    group.add(rightWing);

    // USAAF Star Insignia on Wings & Fuselage
    const starMat = new THREE.MeshBasicMaterial({
      map: this.createUSStarTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const starPlane = new THREE.PlaneGeometry(2.1, 2.1);
    starPlane.rotateX(-Math.PI / 2);

    const lWingStar = new THREE.Mesh(starPlane, starMat);
    lWingStar.position.set(9.2, 0.48, 1.5);
    lWingStar.rotation.z = 0.04;
    group.add(lWingStar);

    const rWingStar = new THREE.Mesh(starPlane, starMat);
    rWingStar.position.set(-9.2, 0.48, 1.5);
    rWingStar.rotation.z = -0.04;
    group.add(rWingStar);

    // 5. Four Wright Cyclone Radial Engines + Spinning Propellers
    const enginePositions = [
      { x: -7.4, y: 0.15, z: 2.6 },
      { x: -3.7, y: 0.02, z: 2.9 },
      { x: 3.7,  y: 0.02, z: 2.9 },
      { x: 7.4,  y: 0.15, z: 2.6 }
    ];
    group.userData.propellers = [];

    const nacelleGeo = new THREE.CylinderGeometry(0.68, 0.56, 3.0, 12);
    nacelleGeo.rotateX(Math.PI / 2);
    const cowlRingGeo = new THREE.CylinderGeometry(0.71, 0.71, 0.45, 12);
    cowlRingGeo.rotateX(Math.PI / 2);
    const propBlurGeo = new THREE.CircleGeometry(1.55, 16);
    const propBlurMat = new THREE.MeshBasicMaterial({ color: '#e2e8f0', opacity: 0.32, transparent: true, side: THREE.DoubleSide });
    const bladeGeo = new THREE.BoxGeometry(0.14, 1.45, 0.03);

    enginePositions.forEach((pos) => {
      const nacelle = new THREE.Mesh(nacelleGeo, oliveMat);
      nacelle.position.set(pos.x, pos.y, pos.z);
      group.add(nacelle);

      const cowlRing = new THREE.Mesh(cowlRingGeo, redTailMat);
      cowlRing.position.set(pos.x, pos.y, pos.z + 1.35);
      group.add(cowlRing);

      // Rotating propeller assembly
      const propHub = new THREE.Group();
      propHub.position.set(pos.x, pos.y, pos.z + 1.65);

      const blurDisc = new THREE.Mesh(propBlurGeo, propBlurMat);
      propHub.add(blurDisc);

      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(bladeGeo, metalMat);
        const ang = (b * Math.PI * 2) / 3;
        blade.rotation.z = ang;
        blade.position.set(Math.cos(ang) * 0.65, Math.sin(ang) * 0.65, 0.02);
        propHub.add(blade);
      }

      group.add(propHub);
      group.userData.propellers.push(propHub);
    });

    // 6. Iconic Sweeping B-17 Dorsal Tail Fin (aligned in YZ plane!) & Horizontal Tailplane
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0); // Dorsal fillet start on mid-fuselage
    finShape.quadraticCurveTo(-2.2, 0.6, -3.4, 3.6); // Long sweeping B-17 dorsal fin leading edge
    finShape.bezierCurveTo(-3.7, 4.1, -4.6, 4.0, -4.8, 3.3); // Rounded top peak
    finShape.lineTo(-5.0, 0.0); // Rudder trailing edge
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.16, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 });
    finGeo.translate(0, 0, -0.08);
    finGeo.rotateY(-Math.PI / 2); // Align in YZ plane!

    const tailFin = new THREE.Mesh(finGeo, redTailMat);
    tailFin.position.set(0, 0.55, -2.8);
    group.add(tailFin);

    // Horizontal Stabilizers
    const hTailShape = new THREE.Shape();
    hTailShape.moveTo(-4.6, 0);
    hTailShape.bezierCurveTo(-4.4, 0.9, -1.8, 1.3, 0, 1.3);
    hTailShape.bezierCurveTo(1.8, 1.3, 4.4, 0.9, 4.6, 0);
    hTailShape.bezierCurveTo(4.4, -0.7, 1.8, -0.9, 0, -0.9);
    hTailShape.bezierCurveTo(-1.8, -0.9, -4.4, -0.7, -4.6, 0);
    hTailShape.closePath();

    const hTailGeo = new THREE.ExtrudeGeometry(hTailShape, { depth: 0.12, bevelEnabled: false });
    hTailGeo.translate(0, 0, -0.06);
    hTailGeo.rotateX(Math.PI / 2);

    const hTail = new THREE.Mesh(hTailGeo, oliveMat);
    hTail.position.set(0, 0.55, -6.8);
    group.add(hTail);

    // Forward M2 Browning .50 cal Muzzles (Chin turret + Cheek guns + Top turret)
    group.userData.gunMuzzles = [
      new THREE.Vector3(0.22, -0.95, 8.3),
      new THREE.Vector3(-0.22, -0.95, 8.3),
      new THREE.Vector3(0.95, 0.15, 6.4),
      new THREE.Vector3(-0.95, 0.15, 6.4),
      new THREE.Vector3(0.22, 1.48, 3.8),
      new THREE.Vector3(-0.22, 1.48, 3.8)
    ];

    // Defensive AI Turret Positions (Top, Ball, and Tail Gunners)
    group.userData.turretMounts = [
      new THREE.Vector3(0, 1.5, 2.8),   // Top Sperry turret
      new THREE.Vector3(0, -1.3, -0.4), // Belly Ball turret
      new THREE.Vector3(0, 0.2, -9.2)   // Tail Stinger turret
    ];

    group.userData.cockpitPos = new THREE.Vector3(0, 1.4, 4.2);
    group.userData.chaseOffset = new THREE.Vector3(0, 4.2, -16.5);

    return group;
  },

  createHeavyBomber() {
    return this.createB17();
  },

  // --- KRIEGSMARINE DESTROYER / WARSHIP (TARGET FOR BOMBS ON WATER) ---
  createKriegsmarineShip() {
    const group = new THREE.Group();
    group.name = 'KriegsmarineShip';

    const hullMat = new THREE.MeshLambertMaterial({ color: '#334155' });
    const deckMat = new THREE.MeshLambertMaterial({ color: '#475569' });
    const redMarkMat = new THREE.MeshBasicMaterial({ color: '#dc2626' });
    const darkMat = new THREE.MeshLambertMaterial({ color: '#1e293b' });

    // Main hull
    const hullGeo = new THREE.BoxGeometry(10, 6, 48);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 2.5;
    group.add(hull);

    // Bow & Stern decks with red Kriegsmarine air-recognition stripes
    const bowStripe = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), redMarkMat);
    bowStripe.rotation.x = -Math.PI / 2;
    bowStripe.position.set(0, 5.6, 17);
    group.add(bowStripe);

    // Bridge superstructure
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 14), deckMat);
    bridge.position.set(0, 8.5, 2);
    group.add(bridge);

    // Smokestack funnel
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 7, 8), darkMat);
    funnel.position.set(0, 12, -3);
    group.add(funnel);

    // Forward & Aft Naval Gun Turrets
    const turretBow = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.5, 5), darkMat);
    turretBow.position.set(0, 6.8, 13);
    group.add(turretBow);

    const turretStern = turretBow.clone();
    turretStern.position.set(0, 6.8, -14);
    group.add(turretStern);

    // Balkenkreuz on deck
    const crossMat = new THREE.MeshBasicMaterial({
      map: this.createBalkenkreuzTexture(),
      transparent: true
    });
    const crossPlane = new THREE.PlaneGeometry(6, 6);
    crossPlane.rotateX(-Math.PI / 2);
    const deckCross = new THREE.Mesh(crossPlane, crossMat);
    deckCross.position.set(0, 5.65, 17);
    group.add(deckCross);

    return group;
  },

  // --- ATOMIC BOMB (FAT MAN / LITTLE BOY NUCLEAR ORDNANCE) ---
  createAtomicBomb() {
    const group = new THREE.Group();
    group.name = 'AtomicBomb';

    const bombBodyMat = new THREE.MeshStandardMaterial({
      color: '#eab308', // Iconic bright yellow casing
      metalness: 0.45,
      roughness: 0.35
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.7
    });
    const blackStripeMat = new THREE.MeshLambertMaterial({ color: '#0f172a' });

    // 1. Bulbous, plump nuclear casing (Fat Man teardrop / egg profile)
    const bodyGeo = new THREE.CylinderGeometry(0.85, 0.78, 3.2, 14);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, bombBodyMat);
    group.add(body);

    // Rounded nose cone
    const noseGeo = new THREE.SphereGeometry(0.85, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, bombBodyMat);
    nose.position.z = 1.6;
    group.add(nose);

    // Nose fuse contact detonator
    const fuseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8);
    fuseGeo.rotateX(Math.PI / 2);
    const fuse = new THREE.Mesh(fuseGeo, darkMat);
    fuse.position.z = 2.45;
    group.add(fuse);

    // Hazard ring bands
    const ringGeo = new THREE.CylinderGeometry(0.87, 0.87, 0.22, 14);
    ringGeo.rotateX(Math.PI / 2);
    const ring1 = new THREE.Mesh(ringGeo, blackStripeMat);
    ring1.position.z = 0.6;
    group.add(ring1);

    const ring2 = ring1.clone();
    ring2.position.z = -0.7;
    group.add(ring2);

    // Radiation Trefoil decals
    const trefoilMat = new THREE.MeshBasicMaterial({
      map: this.createNukeHazardTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const decalPlane = new THREE.PlaneGeometry(0.9, 0.9);

    const leftDecal = new THREE.Mesh(decalPlane, trefoilMat);
    leftDecal.rotation.y = -Math.PI / 2;
    leftDecal.position.set(-0.88, 0, 0);
    group.add(leftDecal);

    const rightDecal = new THREE.Mesh(decalPlane, trefoilMat);
    rightDecal.rotation.y = Math.PI / 2;
    rightDecal.position.set(0.88, 0, 0);
    group.add(rightDecal);

    // 2. Square Box Tail Fin Assembly (California Parachute / Radar Antenna Box)
    const boxFrameGeo = new THREE.BoxGeometry(1.65, 1.65, 1.2);
    const boxFrameMat = new THREE.MeshStandardMaterial({
      color: '#eab308',
      roughness: 0.4
    });
    // Create box fin shroud
    const topFin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), boxFrameMat);
    topFin.position.set(0, 0.8, -1.9);
    group.add(topFin);

    const btmFin = topFin.clone();
    btmFin.position.y = -0.8;
    group.add(btmFin);

    const leftFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 1.2), boxFrameMat);
    leftFin.position.set(-0.8, 0, -1.9);
    group.add(leftFin);

    const rightFin = leftFin.clone();
    rightFin.position.x = 0.8;
    group.add(rightFin);

    // Internal stabilizing cruciform fins
    const crossFinH = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.2), darkMat);
    crossFinH.position.set(0, 0, -1.9);
    group.add(crossFinH);

    const crossFinV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 1.2), darkMat);
    crossFinV.position.set(0, 0, -1.9);
    group.add(crossFinV);

    group.userData.isNuclear = true;
    return group;
  },

  // --- BOEING B-29 SUPERFORTRESS (HEAVY ATOMIC BOMBER) ---
  createB29() {
    const group = new THREE.Group();
    group.name = 'B29';

    // Gleaming polished aluminum / natural metal finish
    const silverMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.72,
      roughness: 0.26
    });
    const darkSilverMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      metalness: 0.65,
      roughness: 0.35
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.6,
      roughness: 0.4
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      metalness: 0.85
    });
    const blackMat = new THREE.MeshLambertMaterial({ color: '#111827' });
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#eab308' });
    const glassMat = new THREE.MeshLambertMaterial({
      color: '#38bdf8',
      opacity: 0.65,
      transparent: true
    });

    // 1. Pressurized Cylindrical Fuselage (Long streamline cigar profile)
    const fuseGeo = new THREE.CylinderGeometry(1.22, 0.55, 20.5, 16);
    fuseGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuseGeo, silverMat);
    fuselage.position.set(0, 0, -0.8);
    fuselage.castShadow = true;
    group.add(fuselage);

    // 2. Greenhouse Multi-Pane Glazed Spherical Nose (B-29 signature)
    const noseGeo = new THREE.SphereGeometry(1.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    noseGeo.rotateX(-Math.PI / 2);
    const noseGlass = new THREE.Mesh(noseGeo, glassMat);
    noseGlass.position.set(0, 0, 9.45);
    group.add(noseGlass);

    // Metal nose frame ring & center hub
    const noseRing = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.05, 8, 20), silverMat);
    noseRing.position.set(0, 0, 9.45);
    group.add(noseRing);

    const noseHub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 10), metalMat);
    noseHub.rotateX(Math.PI / 2);
    noseHub.position.set(0, 0, 10.65);
    group.add(noseHub);

    // 3. High-Aspect Ratio Wings (Very long, tapered wingspan ~28m)
    const wingGeo = new THREE.BoxGeometry(27.8, 0.26, 3.4);
    const wings = new THREE.Mesh(wingGeo, silverMat);
    wings.position.set(0, 0.35, 1.4);
    wings.castShadow = true;
    group.add(wings);

    // Tapered wingtips
    const tipGeo = new THREE.BoxGeometry(1.6, 0.18, 2.2);
    const rTip = new THREE.Mesh(tipGeo, silverMat);
    rTip.position.set(14.4, 0.38, 1.4);
    group.add(rTip);

    const lTip = rTip.clone();
    lTip.position.x = -14.4;
    group.add(lTip);

    // USAAF Stars on wings
    const starMat = new THREE.MeshBasicMaterial({
      map: this.createUSStarTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const starPlane = new THREE.PlaneGeometry(2.6, 2.6);
    starPlane.rotateX(-Math.PI / 2);

    const lWingStar = new THREE.Mesh(starPlane, starMat);
    lWingStar.position.set(10.5, 0.52, 1.4);
    group.add(lWingStar);

    const rWingStar = new THREE.Mesh(starPlane, starMat);
    rWingStar.position.set(-10.5, 0.52, 1.4);
    group.add(rWingStar);

    // 4. Four Wright R-3350 Duplex-Cyclone Radial Engines with 4-blade Propellers!
    const enginePositions = [
      { x: -9.2, y: 0.15, z: 2.5 },
      { x: -4.5, y: 0.02, z: 2.8 },
      { x: 4.5,  y: 0.02, z: 2.8 },
      { x: 9.2,  y: 0.15, z: 2.5 }
    ];
    group.userData.propellers = [];

    const nacelleGeo = new THREE.CylinderGeometry(0.78, 0.64, 3.8, 14);
    nacelleGeo.rotateX(Math.PI / 2);
    const cowlRingGeo = new THREE.CylinderGeometry(0.81, 0.81, 0.5, 14);
    cowlRingGeo.rotateX(Math.PI / 2);
    const propBlurGeo = new THREE.CircleGeometry(1.75, 16);
    const propBlurMat = new THREE.MeshBasicMaterial({ color: '#f1f5f9', opacity: 0.35, transparent: true, side: THREE.DoubleSide });
    const bladeGeo = new THREE.BoxGeometry(0.14, 1.6, 0.03);

    enginePositions.forEach(pos => {
      const nacelle = new THREE.Mesh(nacelleGeo, darkSilverMat);
      nacelle.position.set(pos.x, pos.y, pos.z);
      group.add(nacelle);

      const cowl = new THREE.Mesh(cowlRingGeo, silverMat);
      cowl.position.set(pos.x, pos.y, pos.z + 1.8);
      group.add(cowl);

      // Rotating 4-blade propeller assembly
      const propHub = new THREE.Group();
      propHub.position.set(pos.x, pos.y, pos.z + 2.15);

      const blurDisc = new THREE.Mesh(propBlurGeo, propBlurMat);
      propHub.add(blurDisc);

      // 4 blades (iconic B-29 4-blade Hamilton Standard propeller)
      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(bladeGeo, blackMat);
        const ang = (b * Math.PI * 2) / 4;
        blade.rotation.z = ang;
        blade.position.set(Math.cos(ang) * 0.75, Math.sin(ang) * 0.75, 0.02);
        propHub.add(blade);

        // Yellow blade tips
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.035), yellowMat);
        tip.position.set(0, 0.7, 0.005);
        blade.add(tip);
      }

      group.add(propHub);
      group.userData.propellers.push(propHub);
    });

    // 5. Tall B-29 Vertical Stabilizer & High Horizontal Tailplane
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.quadraticCurveTo(-3.2, 0.8, -4.8, 4.4); // Tall sweeping B-29 dorsal fin
    finShape.bezierCurveTo(-5.1, 4.9, -5.9, 4.8, -6.1, 4.1); // Curved peak
    finShape.lineTo(-6.4, 0.0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.18, bevelEnabled: false });
    finGeo.translate(0, 0, -0.09);
    finGeo.rotateY(-Math.PI / 2);

    const tailFin = new THREE.Mesh(finGeo, silverMat);
    tailFin.position.set(0, 0.65, -4.2);
    group.add(tailFin);

    // Horizontal tailplane
    const hTailGeo = new THREE.BoxGeometry(9.6, 0.16, 2.2);
    const hTail = new THREE.Mesh(hTailGeo, silverMat);
    hTail.position.set(0, 0.8, -8.6);
    group.add(hTail);

    // Black circle USAAF unit identifier on tail
    const idPlane = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), blackMat);
    idPlane.rotation.y = Math.PI / 2;
    idPlane.position.set(0.1, 3.4, -8.8);
    group.add(idPlane);

    const idPlaneL = idPlane.clone();
    idPlaneL.position.x = -0.1;
    idPlaneL.rotation.y = -Math.PI / 2;
    group.add(idPlaneL);

    // 6. Remote-Controlled Barbette Turrets (Top Forward, Top Aft, Ventral, and Tail Stinger)
    const turretGeo = new THREE.SphereGeometry(0.52, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const gunBarrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
    gunBarrelGeo.rotateX(Math.PI / 2);

    // Helper to spawn a dual .50 cal remote turret
    const addTurret = (x, y, z, isInverted = false) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(x, y, z);
      if (isInverted) tGroup.rotation.z = Math.PI;

      const dome = new THREE.Mesh(turretGeo, darkMat);
      tGroup.add(dome);

      const barrel1 = new THREE.Mesh(gunBarrelGeo, metalMat);
      barrel1.position.set(0.14, 0.2, 0.6);
      tGroup.add(barrel1);

      const barrel2 = barrel1.clone();
      barrel2.position.x = -0.14;
      tGroup.add(barrel2);

      group.add(tGroup);
    };

    addTurret(0, 1.25, 4.2);   // Top Forward turret
    addTurret(0, 1.2, -3.2);   // Top Aft turret
    addTurret(0, -1.25, 3.5, true);  // Ventral Forward turret
    addTurret(0, -1.15, -3.5, true); // Ventral Aft turret

    // Tail gunner stinger (Twin .50 cal + 20mm cannon in rear)
    const tailGunner = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 1.2), darkMat);
    tailGunner.position.set(0, 0.2, -10.9);
    group.add(tailGunner);

    const tailBarrel1 = new THREE.Mesh(gunBarrelGeo, metalMat);
    tailBarrel1.position.set(0.12, 0.2, -11.6);
    group.add(tailBarrel1);

    const tailBarrel2 = tailBarrel1.clone();
    tailBarrel2.position.x = -0.12;
    group.add(tailBarrel2);

    // 7. Forward Gun Muzzles & Defensive AI Turret Mounts
    group.userData.gunMuzzles = [
      new THREE.Vector3(0.18, 1.45, 4.8),
      new THREE.Vector3(-0.18, 1.45, 4.8),
      new THREE.Vector3(0.18, -1.45, 4.1),
      new THREE.Vector3(-0.18, -1.45, 4.1),
      new THREE.Vector3(0.85, 0.1, 7.5),
      new THREE.Vector3(-0.85, 0.1, 7.5)
    ];

    group.userData.turretMounts = [
      new THREE.Vector3(0, 1.4, 4.2),    // Top Forward
      new THREE.Vector3(0, 1.35, -3.2),  // Top Aft
      new THREE.Vector3(0, -1.35, 3.5),  // Ventral Forward
      new THREE.Vector3(0, -1.25, -3.5), // Ventral Aft
      new THREE.Vector3(0, 0.2, -11.6)   // Tail Stinger
    ];

    group.userData.cockpitPos = new THREE.Vector3(0, 0.5, 9.8);
    group.userData.chaseOffset = new THREE.Vector3(0, 5.0, -22.5);

    return group;
  },

  // --- MITSUBISHI A6M2 ZERO (IMPERIAL JAPANESE NAVY FIGHTER) ---
  createZero() {
    const group = new THREE.Group();
    group.name = 'Zero';

    // Authentic dark Imperial naval green or light navy grey
    const camoTexture = this.createCamoTexture('#1e392a', '#2d5a37', 'organic');
    const greenMat = new THREE.MeshStandardMaterial({
      map: camoTexture,
      roughness: 0.55,
      metalness: 0.25
    });
    const cowlMat = new THREE.MeshStandardMaterial({
      color: '#0f172a', // Black Sakae engine cowl
      roughness: 0.4
    });
    const undersideMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.6
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.8
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: '#eab308' // Yellow leading edge IFF stripe
    });
    const cockpitMat = new THREE.MeshLambertMaterial({
      color: '#38bdf8',
      opacity: 0.7,
      transparent: true
    });

    // 1. Sleek, lightweight fuselage
    const fuseGeo = new THREE.CylinderGeometry(0.52, 0.22, 7.2, 12);
    fuseGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuseGeo, greenMat);
    fuselage.scale.set(0.85, 1.0, 1.0);
    fuselage.castShadow = true;
    group.add(fuselage);

    // Black Sakae radial engine cowling
    const cowlGeo = new THREE.CylinderGeometry(0.54, 0.52, 1.4, 12);
    cowlGeo.rotateX(Math.PI / 2);
    const cowl = new THREE.Mesh(cowlGeo, cowlMat);
    cowl.position.z = 4.0;
    group.add(cowl);

    // Red propeller spinner
    const spinnerGeo = new THREE.ConeGeometry(0.22, 0.6, 10);
    spinnerGeo.rotateX(-Math.PI / 2);
    const spinner = new THREE.Mesh(spinnerGeo, new THREE.MeshStandardMaterial({ color: '#991b1b' }));
    spinner.position.z = 4.8;
    group.add(spinner);

    // 2. Continuous Elliptical-Tapered Wings
    const wingGeo = new THREE.BoxGeometry(10.2, 0.12, 1.9);
    const wing = new THREE.Mesh(wingGeo, greenMat);
    wing.position.set(0, -0.15, 0.5);
    wing.castShadow = true;
    group.add(wing);

    // Yellow IFF leading edge stripes
    const iffGeo = new THREE.BoxGeometry(2.4, 0.13, 0.25);
    const rIFF = new THREE.Mesh(iffGeo, yellowMat);
    rIFF.position.set(3.2, -0.14, 1.4);
    group.add(rIFF);

    const lIFF = rIFF.clone();
    lIFF.position.x = -3.2;
    group.add(lIFF);

    // Red Hinomaru (Rising Sun) on Wings
    const hinomaruMat = new THREE.MeshBasicMaterial({
      map: this.createHinomaruTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const roundelPlane = new THREE.PlaneGeometry(1.4, 1.4);
    roundelPlane.rotateX(-Math.PI / 2);

    const rSun = new THREE.Mesh(roundelPlane, hinomaruMat);
    rSun.position.set(3.4, -0.08, 0.5);
    group.add(rSun);

    const lSun = rSun.clone();
    lSun.position.x = -3.4;
    group.add(lSun);

    // Hinomaru on Fuselage sides
    const sidePlane = new THREE.PlaneGeometry(0.7, 0.7);
    const rSideSun = new THREE.Mesh(sidePlane, hinomaruMat);
    rSideSun.position.set(0.46, 0.1, -0.6);
    rSideSun.rotation.y = Math.PI / 2;
    group.add(rSideSun);

    const lSideSun = rSideSun.clone();
    lSideSun.position.x = -0.46;
    lSideSun.rotation.y = -Math.PI / 2;
    group.add(lSideSun);

    // White fuselage combat stripe
    const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.4, 12), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    bandMesh.rotateX(Math.PI / 2);
    bandMesh.position.set(0, 0, -1.6);
    group.add(bandMesh);

    // 3. Tail fin & Horizontal stabilizer
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-0.8, 1.6);
    finShape.lineTo(-1.6, 1.5);
    finShape.lineTo(-1.7, 0);
    finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.08, bevelEnabled: false });
    finGeo.translate(0, 0, -0.04);
    finGeo.rotateY(-Math.PI / 2);
    const tailFin = new THREE.Mesh(finGeo, greenMat);
    tailFin.position.set(0, 0.25, -2.6);
    group.add(tailFin);

    const hStabGeo = new THREE.BoxGeometry(3.2, 0.08, 0.85);
    const hStab = new THREE.Mesh(hStabGeo, greenMat);
    hStab.position.set(0, 0.25, -3.2);
    group.add(hStab);

    // 4. Canopy
    const canopyGeo = new THREE.BoxGeometry(0.52, 0.48, 1.9);
    const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
    canopy.position.set(0, 0.48, 0.35);
    group.add(canopy);

    // 5. Wing 20mm Type 99 Cannons
    const cannonGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6);
    cannonGeo.rotateX(Math.PI / 2);
    const rCannon = new THREE.Mesh(cannonGeo, metalMat);
    rCannon.position.set(2.2, -0.15, 1.6);
    group.add(rCannon);

    const lCannon = rCannon.clone();
    lCannon.position.x = -2.2;
    group.add(lCannon);

    // 6. Spinning Propeller
    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0, 4.8);

    const propBlur = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 16),
      new THREE.MeshBasicMaterial({ color: '#e2e8f0', opacity: 0.35, transparent: true, side: THREE.DoubleSide })
    );
    propGroup.add(propBlur);

    const bladeGeo = new THREE.BoxGeometry(0.12, 1.35, 0.02);
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, metalMat);
      blade.rotation.z = (i * Math.PI * 2) / 3;
      blade.position.y = Math.sin(blade.rotation.z) * 0.65;
      blade.position.x = Math.cos(blade.rotation.z) * 0.65;
      propGroup.add(blade);
    }
    group.add(propGroup);
    group.userData.propeller = propGroup;

    group.userData.cockpitPos = new THREE.Vector3(0, 0.58, 0.25);
    group.userData.chaseOffset = new THREE.Vector3(0, 2.6, -8.6);

    return group;
  },

  // --- IMPERIAL JAPANESE NAVY (IJN) CRUISER / DESTROYER ---
  createJapaneseWarship() {
    const group = new THREE.Group();
    group.name = 'JapaneseWarship';

    const hullMat = new THREE.MeshLambertMaterial({ color: '#273444' });
    const deckMat = new THREE.MeshLambertMaterial({ color: '#3f4f61' });
    const woodDeckMat = new THREE.MeshLambertMaterial({ color: '#9a7b56' }); // Japanese cedar teakwood deck
    const darkMat = new THREE.MeshLambertMaterial({ color: '#161e2e' });

    // 1. Sleek raked clipper hull (long IJN warship)
    const hullGeo = new THREE.BoxGeometry(9.6, 6.2, 54);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 2.5;
    group.add(hull);

    // Wooden deck overlay
    const deckGeo = new THREE.BoxGeometry(9.2, 0.2, 52);
    const deck = new THREE.Mesh(deckGeo, woodDeckMat);
    deck.position.y = 5.65;
    group.add(deck);

    // 2. Iconic IJN "Pagoda Mast" Superstructure (Towering tiered bridge)
    const pagodaBase = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 12), deckMat);
    pagodaBase.position.set(0, 8.2, 4);
    group.add(pagodaBase);

    const pagodaTier2 = new THREE.Mesh(new THREE.BoxGeometry(5.4, 4.5, 8), deckMat);
    pagodaTier2.position.set(0, 12.8, 4);
    group.add(pagodaTier2);

    const pagodaTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.0, 5), darkMat);
    pagodaTop.position.set(0, 17.0, 4);
    group.add(pagodaTop);

    // 3. Raked Smokestacks (Funnel)
    const funnelGeo = new THREE.CylinderGeometry(1.5, 1.8, 8, 8);
    funnelGeo.rotateX(0.15); // Authentic rear rake
    const funnel = new THREE.Mesh(funnelGeo, darkMat);
    funnel.position.set(0, 12.5, -4);
    group.add(funnel);

    // 4. Forward & Aft Dual Naval Gun Turrets
    const turretGeo = new THREE.BoxGeometry(4.6, 2.4, 5.4);
    const barrelGeo = new THREE.CylinderGeometry(0.18, 0.18, 5.5, 6);
    barrelGeo.rotateX(Math.PI / 2);

    // Forward Turret 1
    const tBow1 = new THREE.Group();
    tBow1.position.set(0, 6.8, 17);
    tBow1.add(new THREE.Mesh(turretGeo, darkMat));
    const b1 = new THREE.Mesh(barrelGeo, darkMat);
    b1.position.set(0.6, 0.2, 4.5);
    const b2 = b1.clone();
    b2.position.x = -0.6;
    tBow1.add(b1);
    tBow1.add(b2);
    group.add(tBow1);

    // Forward Superfiring Turret 2 (Raised)
    const tBow2 = tBow1.clone();
    tBow2.position.set(0, 8.4, 11);
    group.add(tBow2);

    // Stern Turret
    const tStern = tBow1.clone();
    tStern.rotation.y = Math.PI;
    tStern.position.set(0, 6.8, -17);
    group.add(tStern);

    // 5. Hinomaru Naval Ensign Markings on decks
    const hinomaruMat = new THREE.MeshBasicMaterial({
      map: this.createHinomaruTexture(),
      transparent: true
    });
    const flagPlane = new THREE.PlaneGeometry(6.5, 6.5);
    flagPlane.rotateX(-Math.PI / 2);

    const bowFlag = new THREE.Mesh(flagPlane, hinomaruMat);
    bowFlag.position.set(0, 5.76, 22);
    group.add(bowFlag);

    const sternFlag = bowFlag.clone();
    sternFlag.position.z = -23;
    group.add(sternFlag);

    return group;
  },

  createRedStarTexture() {
    if (this._cache.redStar) return this._cache.redStar;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const cx = 64, cy = 64, r = 52, ir = 22;
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      const ia = (i * 72 + 36 - 90) * Math.PI / 180;
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(ia) * ir, cy + Math.sin(ia) * ir);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this._cache.redStar = new THREE.CanvasTexture(canvas);
    return this._cache.redStar;
  },

  // =========================================================================
  // 1. LOCKHEED MARTIN F-16C BLOCK 52+ "JASTRZĄB" (POLISH AIR FORCE)
  // Single-engine, bubble canopy, ventral intake, blended wing body, wingtip AIM-9
  // =========================================================================
  createF16() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Tactical grey
      roughness: 0.45,
      metalness: 0.25
    });
    const darkBodyMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Dark grey spine & LERX
      roughness: 0.5,
      metalness: 0.3
    });
    const radomeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.85
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04, // Indium gold tint bubble canopy
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.68
    });
    const abFlameMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.9
    });

    // 1. Fuselage main body (blended)
    const fuseGeo = new THREE.CylinderGeometry(0.55, 0.65, 8.5, 14);
    fuseGeo.rotateX(Math.PI / 2);
    fuseGeo.scale(1.2, 0.8, 1.0);
    const fuselage = new THREE.Mesh(fuseGeo, bodyMat);
    fuselage.position.set(0, 0, 0);
    group.add(fuselage);

    // Conformal spine / dorsal spine fairing
    const spineGeo = new THREE.BoxGeometry(0.5, 0.32, 5.5);
    const spine = new THREE.Mesh(spineGeo, darkBodyMat);
    spine.position.set(0, 0.42, -0.6);
    group.add(spine);

    // Radome pointed nose
    const noseGeo = new THREE.ConeGeometry(0.48, 2.8, 14);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.scale(1.1, 0.8, 1.0);
    const nose = new THREE.Mesh(noseGeo, radomeMat);
    nose.position.set(0, -0.02, 5.4);
    group.add(nose);

    // Pitot tube at nose tip
    const pitot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6),
      metalMat
    );
    pitot.rotation.x = Math.PI / 2;
    pitot.position.set(0, -0.02, 7.1);
    group.add(pitot);

    // 2. Ventral Air Intake (chin scoop underneath)
    const intakeLip = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.55, 2.6),
      darkBodyMat
    );
    intakeLip.position.set(0, -0.55, 1.3);
    group.add(intakeLip);

    const intakeHole = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x050505 })
    );
    intakeHole.position.set(0, -0.55, 2.61);
    group.add(intakeHole);

    // 3. Bubble Canopy & Pilot
    const canopyGeo = new THREE.SphereGeometry(0.5, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    canopyGeo.scale(0.8, 0.85, 3.2);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.32, 2.0);
    group.add(canopy);

    const pilotHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x14532d }) // Modern flight helmet
    );
    pilotHead.position.set(0, 0.38, 1.7);
    group.add(pilotHead);

    // 4. Cropped Delta Wings with leading edge strakes (LERX)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 3.5);
    wingShape.lineTo(0.7, 1.5);
    wingShape.lineTo(4.6, -1.8);
    wingShape.lineTo(4.6, -2.5);
    wingShape.lineTo(0.7, -2.5);
    wingShape.lineTo(0, -2.5);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2
    });
    wingGeo.translate(0, 0, -0.06);
    wingGeo.rotateX(Math.PI / 2);

    // Left wing
    const leftWing = new THREE.Mesh(wingGeo, bodyMat);
    leftWing.position.set(0.1, -0.02, 0);
    group.add(leftWing);

    // Right wing
    const rWingGeo = wingGeo.clone();
    rWingGeo.scale(-1, 1, 1);
    const rightWing = new THREE.Mesh(rWingGeo, bodyMat);
    rightWing.position.set(-0.1, -0.02, 0);
    group.add(rightWing);

    // 5. Wingtip Missile Launcher Rails & AIM-9X / AIM-120
    const createWingtipMissile = (xSign) => {
      const mGroup = new THREE.Group();
      mGroup.position.set(xSign * 4.65, -0.02, -2.0);

      // Launcher rail
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.2), darkBodyMat);
      mGroup.add(rail);

      // White missile body
      const missBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      missBody.rotation.x = Math.PI / 2;
      mGroup.add(missBody);

      // Dark seeker nose
      const seeker = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.3, 8),
        metalMat
      );
      seeker.rotation.x = -Math.PI / 2;
      seeker.position.z = 1.15;
      mGroup.add(seeker);

      // Missile fins
      const finGeo = new THREE.BoxGeometry(0.35, 0.02, 0.25);
      const fin1 = new THREE.Mesh(finGeo, darkBodyMat);
      fin1.position.z = -0.7;
      mGroup.add(fin1);
      const fin2 = fin1.clone();
      fin2.rotation.z = Math.PI / 2;
      mGroup.add(fin2);

      return mGroup;
    };
    group.add(createWingtipMissile(1));
    group.add(createWingtipMissile(-1));

    // 6. Vertical Stabilizer (Fin) with Polish Air Force Szachownica!
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-1.6, 2.5);
    finShape.lineTo(-2.2, 2.5);
    finShape.lineTo(-2.2, 0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });
    finGeo.translate(0, 0, -0.05);
    finGeo.rotateY(-Math.PI / 2);

    const vFin = new THREE.Mesh(finGeo, bodyMat);
    vFin.position.set(0, 0.35, -2.0);
    group.add(vFin);

    // Polish Chessboard on vertical fin sides
    const checkerMat = new THREE.MeshBasicMaterial({
      map: this.createPolishChessboardTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });
    const finDecalL = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), checkerMat);
    finDecalL.position.set(0.06, 2.1, -3.7);
    finDecalL.rotation.y = Math.PI / 2;
    group.add(finDecalL);

    const finDecalR = finDecalL.clone();
    finDecalR.position.x = -0.06;
    finDecalR.rotation.y = -Math.PI / 2;
    group.add(finDecalR);

    // Polish Chessboard on left upper wing
    const wingDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), checkerMat);
    wingDecal.rotation.x = -Math.PI / 2;
    wingDecal.position.set(2.4, 0.08, -1.2);
    group.add(wingDecal);

    // 7. Horizontal Tailerons (All-moving stabs)
    const stabShape = new THREE.Shape();
    stabShape.moveTo(0, 0);
    stabShape.lineTo(1.8, -1.2);
    stabShape.lineTo(1.6, -1.8);
    stabShape.lineTo(0, -1.8);
    stabShape.closePath();

    const stabGeo = new THREE.ExtrudeGeometry(stabShape, { depth: 0.06 });
    stabGeo.translate(0, 0, -0.03);
    stabGeo.rotateX(Math.PI / 2);

    const lStab = new THREE.Mesh(stabGeo, darkBodyMat);
    lStab.position.set(0.4, -0.05, -3.6);
    lStab.rotation.z = -0.08;
    group.add(lStab);

    const rStabGeo = stabGeo.clone();
    rStabGeo.scale(-1, 1, 1);
    const rStab = new THREE.Mesh(rStabGeo, darkBodyMat);
    rStab.position.set(-0.4, -0.05, -3.6);
    rStab.rotation.z = 0.08;
    group.add(rStab);

    // Ventral fins under the tail
    const vFinsGeo = new THREE.BoxGeometry(0.04, 0.45, 1.2);
    vFinsGeo.rotateX(-0.2);
    const lVF = new THREE.Mesh(vFinsGeo, darkBodyMat);
    lVF.position.set(0.35, -0.5, -3.2);
    lVF.rotation.z = -0.25;
    group.add(lVF);
    const rVF = lVF.clone();
    rVF.position.x = -0.35;
    rVF.rotation.z = 0.25;
    group.add(rVF);

    // 8. Pratt & Whitney F100 / GE F110 Engine Nozzle & Afterburner
    const nozzleGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.9, 14, 1, true);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, metalMat);
    nozzle.position.set(0, -0.02, -4.5);
    group.add(nozzle);

    const abCone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.8, 10), abFlameMat);
    abCone.rotation.x = -Math.PI / 2;
    abCone.position.set(0, -0.02, -5.2);
    group.add(abCone);

    // Gun port for M61A1 Vulcan 20mm (port shoulder)
    group.userData.gunMuzzles = [
      new THREE.Vector3(-0.42, 0.28, 2.6),
      new THREE.Vector3(0.42, 0.28, 2.6)
    ];
    group.userData.afterburners = [abCone];
    group.userData.chaseOffset = new THREE.Vector3(0, 3.2, -13.8);
    group.userData.cockpitPos = new THREE.Vector3(0, 0.52, 1.8);

    return group;
  },

  // =========================================================================
  // 2. BOEING F/A-18 HORNET (TWIN-ENGINE NAVAL & MULTIROLE FIGHTER)
  // Twin canted vertical tails (20 deg), twin exhausts, prominent LERX, wingtip rails
  // =========================================================================
  createF18() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Light ghost grey
      roughness: 0.4,
      metalness: 0.3
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Dark ghost grey
      roughness: 0.5,
      metalness: 0.35
    });
    const radomeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.85
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.65
    });
    const abFlameMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.9
    });

    // 1. Wide twin-engine fuselage
    const fuseGeo = new THREE.CylinderGeometry(0.85, 0.95, 8.8, 14);
    fuseGeo.rotateX(Math.PI / 2);
    fuseGeo.scale(1.4, 0.75, 1.0);
    const fuselage = new THREE.Mesh(fuseGeo, bodyMat);
    group.add(fuselage);

    // Pointed radome nose
    const noseGeo = new THREE.ConeGeometry(0.55, 3.2, 12);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.scale(1.2, 0.8, 1.0);
    const nose = new THREE.Mesh(noseGeo, radomeMat);
    nose.position.set(0, -0.02, 5.6);
    group.add(nose);

    // 2. Cockpit Canopy
    const canopyGeo = new THREE.SphereGeometry(0.52, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    canopyGeo.scale(0.85, 0.9, 3.5);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.35, 2.2);
    group.add(canopy);

    // Pilot head
    const pilotHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    pilotHead.position.set(0, 0.42, 2.0);
    group.add(pilotHead);

    // 3. Iconic curved Gothic LERX (Leading-Edge Root Extensions)
    const lerxShape = new THREE.Shape();
    lerxShape.moveTo(0, 4.0);
    lerxShape.bezierCurveTo(0.4, 3.5, 0.9, 1.5, 1.2, 0.5);
    lerxShape.lineTo(1.2, -1.5);
    lerxShape.lineTo(0, -1.5);
    lerxShape.closePath();

    const lerxGeo = new THREE.ExtrudeGeometry(lerxShape, { depth: 0.1 });
    lerxGeo.translate(0, 0, -0.05);
    lerxGeo.rotateX(Math.PI / 2);

    const lLerx = new THREE.Mesh(lerxGeo, darkMat);
    lLerx.position.set(0.15, 0.02, 0);
    group.add(lLerx);

    const rLerxGeo = lerxGeo.clone();
    rLerxGeo.scale(-1, 1, 1);
    const rLerx = new THREE.Mesh(rLerxGeo, darkMat);
    rLerx.position.set(-0.15, 0.02, 0);
    group.add(rLerx);

    // 4. Semi-elliptical D-shaped Intakes under LERX
    const intakeGeo = new THREE.BoxGeometry(0.55, 0.45, 2.2);
    const lIntake = new THREE.Mesh(intakeGeo, darkMat);
    lIntake.position.set(0.8, -0.35, 0.8);
    group.add(lIntake);

    const rIntake = lIntake.clone();
    rIntake.position.x = -0.8;
    group.add(rIntake);

    // 5. Main Wings with moderate sweep
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0.5);
    wingShape.lineTo(4.8, -1.2);
    wingShape.lineTo(4.8, -2.4);
    wingShape.lineTo(0, -2.4);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });
    wingGeo.translate(0, 0, -0.06);
    wingGeo.rotateX(Math.PI / 2);

    const lWing = new THREE.Mesh(wingGeo, bodyMat);
    lWing.position.set(0.9, -0.02, 0);
    group.add(lWing);

    const rWingGeo = wingGeo.clone();
    rWingGeo.scale(-1, 1, 1);
    const rWing = new THREE.Mesh(rWingGeo, bodyMat);
    rWing.position.set(-0.9, -0.02, 0);
    group.add(rWing);

    // Wingtip AIM-9 missile launchers
    const createF18Wingtip = (xSign) => {
      const g = new THREE.Group();
      g.position.set(xSign * 5.75, -0.02, -1.8);
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.1), darkMat));
      const miss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.9, 8),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc })
      );
      miss.rotation.x = Math.PI / 2;
      g.add(miss);
      return g;
    };
    group.add(createF18Wingtip(1));
    group.add(createF18Wingtip(-1));

    // 6. TWIN CANTED VERTICAL STABILIZERS (Angled outward by 20 degrees)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-0.8, 2.3);
    finShape.lineTo(-1.6, 2.3);
    finShape.lineTo(-1.6, 0);
    finShape.closePath();

    const vFinGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.08 });
    vFinGeo.translate(0, 0, -0.04);
    vFinGeo.rotateY(-Math.PI / 2);

    const lFin = new THREE.Mesh(vFinGeo, bodyMat);
    lFin.position.set(0.65, 0.32, -2.5);
    lFin.rotation.z = -0.35; // Canted outward ~20 degrees
    group.add(lFin);

    const rFin = new THREE.Mesh(vFinGeo, bodyMat);
    rFin.position.set(-0.65, 0.32, -2.5);
    rFin.rotation.z = 0.35; // Canted outward ~20 degrees
    group.add(rFin);

    // 7. Twin Low-Mounted Horizontal Stabilators
    const stabShape = new THREE.Shape();
    stabShape.moveTo(0, 0);
    stabShape.lineTo(2.2, -1.1);
    stabShape.lineTo(2.0, -1.8);
    stabShape.lineTo(0, -1.8);
    stabShape.closePath();

    const stabGeo = new THREE.ExtrudeGeometry(stabShape, { depth: 0.06 });
    stabGeo.translate(0, 0, -0.03);
    stabGeo.rotateX(Math.PI / 2);

    const lStab = new THREE.Mesh(stabGeo, darkMat);
    lStab.position.set(0.8, -0.1, -3.8);
    lStab.rotation.z = -0.1;
    group.add(lStab);

    const rStabGeo = stabGeo.clone();
    rStabGeo.scale(-1, 1, 1);
    const rStab = new THREE.Mesh(rStabGeo, darkMat);
    rStab.position.set(-0.8, -0.1, -3.8);
    rStab.rotation.z = 0.1;
    group.add(rStab);

    // 8. Twin GE F404 Turbofan Nozzles & Afterburners
    const nozzleGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.8, 12, 1, true);
    nozzleGeo.rotateX(Math.PI / 2);

    const lNoz = new THREE.Mesh(nozzleGeo, metalMat);
    lNoz.position.set(0.48, -0.05, -4.6);
    group.add(lNoz);

    const rNoz = lNoz.clone();
    rNoz.position.x = -0.48;
    group.add(rNoz);

    const abConeGeo = new THREE.ConeGeometry(0.28, 1.6, 8);
    abConeGeo.rotateX(-Math.PI / 2);

    const lAB = new THREE.Mesh(abConeGeo, abFlameMat);
    lAB.position.set(0.48, -0.05, -5.2);
    group.add(lAB);

    const rAB = lAB.clone();
    rAB.position.x = -0.48;
    group.add(rAB);

    // Gun ports in nose cone
    group.userData.gunMuzzles = [
      new THREE.Vector3(-0.15, 0.28, 4.2),
      new THREE.Vector3(0.15, 0.28, 4.2)
    ];
    group.userData.afterburners = [lAB, rAB];
    group.userData.chaseOffset = new THREE.Vector3(0, 3.5, -14.8);
    group.userData.cockpitPos = new THREE.Vector3(0, 0.54, 2.0);

    return group;
  },

  // =========================================================================
  // 3. LOCKHEED MARTIN F-22 RAPTOR (5TH GEN STEALTH AIR-SUPERIORITY FIGHTER)
  // Faceted chine nose, diamond wings, canted twin rudders (28 deg), 2D vectoring nozzles
  // =========================================================================
  createF22() {
    const group = new THREE.Group();

    // Radar-absorbent stealth coating (dark metallic sheen)
    const stealthMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Stealth gunmetal
      roughness: 0.35,
      metalness: 0.5
    });
    const stealthLightMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Lighter stealth tone for wing edges
      roughness: 0.3,
      metalness: 0.45
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.85
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Gold indium stealth radar coating
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.72
    });
    const abFlameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Hot cyan/violet supercruise flame
      transparent: true,
      opacity: 0.95
    });

    // 1. Faceted Diamond Nose & Chine Line
    const noseGeo = new THREE.ConeGeometry(0.7, 3.8, 4);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.rotateZ(Math.PI / 4); // Faceted diamond cross-section!
    noseGeo.scale(1.5, 0.65, 1.0);
    const nose = new THREE.Mesh(noseGeo, stealthMat);
    nose.position.set(0, -0.05, 5.2);
    group.add(nose);

    // Main blended faceted body
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.72, 7.8);
    const body = new THREE.Mesh(bodyGeo, stealthMat);
    body.position.set(0, 0, -0.2);
    group.add(body);

    // 2. Gold indium stealth bubble canopy
    const canopyGeo = new THREE.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    canopyGeo.scale(0.9, 0.85, 3.4);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.36, 1.8);
    group.add(canopy);

    const pilot = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    pilot.position.set(0, 0.42, 1.6);
    group.add(pilot);

    // 3. Caret-style Diamond Stealth Air Intakes (Fuselage sides)
    const intakeGeo = new THREE.BoxGeometry(0.75, 0.65, 3.2);
    const lIntake = new THREE.Mesh(intakeGeo, stealthLightMat);
    lIntake.rotation.y = -0.15; // Authentic Caret intake angle
    lIntake.position.set(1.4, -0.15, 1.2);
    group.add(lIntake);

    const rIntake = lIntake.clone();
    rIntake.rotation.y = 0.15;
    rIntake.position.x = -1.4;
    group.add(rIntake);

    // 4. Clipped Diamond Wings (42-deg leading edge sweep, 17-deg trailing edge sweep)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 2.2);
    wingShape.lineTo(5.8, -1.8);
    wingShape.lineTo(5.4, -2.8);
    wingShape.lineTo(0, -2.8);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03
    });
    wingGeo.translate(0, 0, -0.06);
    wingGeo.rotateX(Math.PI / 2);

    const lWing = new THREE.Mesh(wingGeo, stealthLightMat);
    lWing.position.set(1.1, 0, 0);
    group.add(lWing);

    const rWingGeo = wingGeo.clone();
    rWingGeo.scale(-1, 1, 1);
    const rWing = new THREE.Mesh(rWingGeo, stealthLightMat);
    rWing.position.set(-1.1, 0, 0);
    group.add(rWing);

    // 5. Twin Stealth Outward-Canted Vertical Fins (canted 28 degrees)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-1.2, 2.4);
    finShape.lineTo(-2.2, 2.4);
    finShape.lineTo(-2.2, 0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.08 });
    finGeo.translate(0, 0, -0.04);
    finGeo.rotateY(-Math.PI / 2);

    const lFin = new THREE.Mesh(finGeo, stealthMat);
    lFin.position.set(1.05, 0.35, -2.2);
    lFin.rotation.z = -0.48; // ~28 degrees cant
    group.add(lFin);

    const rFin = new THREE.Mesh(finGeo, stealthMat);
    rFin.position.set(-1.05, 0.35, -2.2);
    rFin.rotation.z = 0.48; // ~28 degrees cant
    group.add(rFin);

    // 6. Diamond Horizontal All-Moving Stabilators
    const stabShape = new THREE.Shape();
    stabShape.moveTo(0, 0);
    stabShape.lineTo(2.4, -1.4);
    stabShape.lineTo(2.0, -2.2);
    stabShape.lineTo(0, -2.2);
    stabShape.closePath();

    const stabGeo = new THREE.ExtrudeGeometry(stabShape, { depth: 0.06 });
    stabGeo.translate(0, 0, -0.03);
    stabGeo.rotateX(Math.PI / 2);

    const lStab = new THREE.Mesh(stabGeo, stealthLightMat);
    lStab.position.set(1.15, -0.05, -3.8);
    group.add(lStab);

    const rStabGeo = stabGeo.clone();
    rStabGeo.scale(-1, 1, 1);
    const rStab = new THREE.Mesh(rStabGeo, stealthLightMat);
    rStab.position.set(-1.15, -0.05, -3.8);
    group.add(rStab);

    // 7. 2D Thrust-Vectoring Flat Rectangular Stealth Nozzles with serrated edges
    const nozzleGeo = new THREE.BoxGeometry(0.85, 0.32, 1.2);
    const lNoz = new THREE.Mesh(nozzleGeo, metalMat);
    lNoz.position.set(0.55, -0.05, -4.6);
    group.add(lNoz);

    const rNoz = lNoz.clone();
    rNoz.position.x = -0.55;
    group.add(rNoz);

    // Glowing cyan/violet 2D supercruise jet flames
    const flameGeo = new THREE.BoxGeometry(0.72, 0.22, 2.2);
    const lFlame = new THREE.Mesh(flameGeo, abFlameMat);
    lFlame.position.set(0.55, -0.05, -5.6);
    group.add(lFlame);

    const rFlame = lFlame.clone();
    rFlame.position.x = -0.55;
    group.add(rFlame);

    // Concealed M61A2 cannon port
    group.userData.gunMuzzles = [
      new THREE.Vector3(0.5, 0.32, 2.2),
      new THREE.Vector3(-0.5, 0.32, 2.2)
    ];
    group.userData.afterburners = [lFlame, rFlame];
    group.userData.chaseOffset = new THREE.Vector3(0, 3.7, -15.8);
    group.userData.cockpitPos = new THREE.Vector3(0, 0.54, 1.7);

    return group;
  },

  // =========================================================================
  // 4. LOCKHEED MARTIN F-35A LIGHTNING II "HUSARZ" (POLISH AIR FORCE 5TH GEN)
  // Single Pratt & Whitney F135, DSI bumps, faceted stealth canopy, Polish insignia
  // =========================================================================
  createF35() {
    const group = new THREE.Group();

    const stealthMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Modern 5th-gen slate stealth
      roughness: 0.35,
      metalness: 0.4
    });
    const darkStealthMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.45
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.85
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Gold-amber faceted stealth canopy
      roughness: 0.1,
      metalness: 0.35,
      transparent: true,
      opacity: 0.7
    });
    const abFlameMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.95
    });

    // 1. Faceted blended fuselage
    const fuseGeo = new THREE.CylinderGeometry(0.85, 0.95, 8.2, 12);
    fuseGeo.rotateX(Math.PI / 2);
    fuseGeo.scale(1.4, 0.8, 1.0);
    const fuselage = new THREE.Mesh(fuseGeo, stealthMat);
    group.add(fuselage);

    // Pointed faceted chine nose
    const noseGeo = new THREE.ConeGeometry(0.68, 3.4, 6);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.scale(1.3, 0.75, 1.0);
    const nose = new THREE.Mesh(noseGeo, darkStealthMat);
    nose.position.set(0, -0.04, 5.4);
    group.add(nose);

    // 2. DSI (Diverterless Supersonic Intake) 3D compression bumps & side scoops
    const dsiBumpGeo = new THREE.SphereGeometry(0.38, 10, 8);
    dsiBumpGeo.scale(0.8, 0.6, 2.0);

    const lBump = new THREE.Mesh(dsiBumpGeo, darkStealthMat);
    lBump.position.set(1.0, -0.15, 1.4);
    group.add(lBump);

    const rBump = lBump.clone();
    rBump.position.x = -1.0;
    group.add(rBump);

    // 3. Faceted Stealth Canopy & HMDS Helmet
    const canopyGeo = new THREE.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    canopyGeo.scale(0.88, 0.9, 3.4);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.38, 1.9);
    group.add(canopy);

    const pilotHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a }) // Gen III HMDS helmet
    );
    pilotHead.position.set(0, 0.44, 1.6);
    group.add(pilotHead);

    // 4. Trapezoidal Stealth Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 2.5);
    wingShape.lineTo(5.1, -1.2);
    wingShape.lineTo(4.8, -2.4);
    wingShape.lineTo(0, -2.4);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025
    });
    wingGeo.translate(0, 0, -0.06);
    wingGeo.rotateX(Math.PI / 2);

    const lWing = new THREE.Mesh(wingGeo, stealthMat);
    lWing.position.set(0.9, 0, 0);
    group.add(lWing);

    const rWingGeo = wingGeo.clone();
    rWingGeo.scale(-1, 1, 1);
    const rWing = new THREE.Mesh(rWingGeo, stealthMat);
    rWing.position.set(-0.9, 0, 0);
    group.add(rWing);

    // Polish Air Force Chessboard Insignia on Wings
    const checkerMat = new THREE.MeshBasicMaterial({
      map: this.createPolishChessboardTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });
    const wingDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), checkerMat);
    wingDecal.rotation.x = -Math.PI / 2;
    wingDecal.position.set(2.6, 0.08, -1.0);
    group.add(wingDecal);

    // 5. Twin Canted Vertical Fins (canted 20 deg) with Polish Chessboard
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-1.1, 2.4);
    finShape.lineTo(-1.9, 2.4);
    finShape.lineTo(-1.9, 0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.08 });
    finGeo.translate(0, 0, -0.04);
    finGeo.rotateY(-Math.PI / 2);

    const lFin = new THREE.Mesh(finGeo, stealthMat);
    lFin.position.set(0.95, 0.32, -2.1);
    lFin.rotation.z = -0.35; // 20 deg cant
    group.add(lFin);

    const rFin = new THREE.Mesh(finGeo, stealthMat);
    rFin.position.set(-0.95, 0.32, -2.1);
    rFin.rotation.z = 0.35;
    group.add(rFin);

    // Tail fin Polish insignia
    const finDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), checkerMat);
    finDecal.position.set(1.48, 1.5, -3.2);
    finDecal.rotation.y = Math.PI / 2;
    finDecal.rotation.x = -0.35;
    group.add(finDecal);

    // 6. Horizontal Stabilators
    const stabShape = new THREE.Shape();
    stabShape.moveTo(0, 0);
    stabShape.lineTo(2.2, -1.3);
    stabShape.lineTo(1.8, -1.9);
    stabShape.lineTo(0, -1.9);
    stabShape.closePath();

    const stabGeo = new THREE.ExtrudeGeometry(stabShape, { depth: 0.06 });
    stabGeo.translate(0, 0, -0.03);
    stabGeo.rotateX(Math.PI / 2);

    const lStab = new THREE.Mesh(stabGeo, darkStealthMat);
    lStab.position.set(0.95, -0.05, -3.7);
    group.add(lStab);

    const rStabGeo = stabGeo.clone();
    rStabGeo.scale(-1, 1, 1);
    const rStab = new THREE.Mesh(rStabGeo, darkStealthMat);
    rStab.position.set(-0.95, -0.05, -3.7);
    group.add(rStab);

    // 7. Single Pratt & Whitney F135 Engine with Faceted Sawtooth Stealth Nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.58, 0.65, 0.9, 12, 1, true);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, metalMat);
    nozzle.position.set(0, -0.02, -4.4);
    group.add(nozzle);

    const abCone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.0, 10), abFlameMat);
    abCone.rotation.x = -Math.PI / 2;
    abCone.position.set(0, -0.02, -5.3);
    group.add(abCone);

    // GAU-22/A 25mm Equalizer cannon port
    group.userData.gunMuzzles = [
      new THREE.Vector3(-0.45, 0.32, 2.4),
      new THREE.Vector3(0.45, 0.32, 2.4)
    ];
    group.userData.afterburners = [abCone];
    group.userData.chaseOffset = new THREE.Vector3(0, 3.4, -14.2);
    group.userData.cockpitPos = new THREE.Vector3(0, 0.56, 1.7);

    return group;
  },

  // =========================================================================
  // 5. HOSTILE MODERN COMBAT JET (SU-27 / FLANKER STYLE ENEMY INTERCEPTOR)
  // Twin engine nacelles, drooping nose, central stinger boom, twin vertical fins
  // =========================================================================
  createModernFighter() {
    const group = new THREE.Group();

    const camoMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Flanker air-superiority blue-grey
      roughness: 0.5,
      metalness: 0.25
    });
    const darkCamoMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Dark camouflage patches
      roughness: 0.55,
      metalness: 0.3
    });
    const radomeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // White radome
      roughness: 0.4
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.85
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.7
    });
    const abFlameMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.95
    });

    // 1. Long drooping Flanker fuselage & nose
    const fuseGeo = new THREE.CylinderGeometry(0.7, 0.85, 9.5, 12);
    fuseGeo.rotateX(Math.PI / 2);
    fuseGeo.scale(1.3, 0.75, 1.0);
    const fuselage = new THREE.Mesh(fuseGeo, camoMat);
    group.add(fuselage);

    // Drooping radome needle nose
    const noseGeo = new THREE.ConeGeometry(0.55, 3.6, 12);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.rotateX(-0.06); // Characteristic Flanker nose droop
    const nose = new THREE.Mesh(noseGeo, radomeMat);
    nose.position.set(0, -0.15, 6.2);
    group.add(nose);

    // 2. Cockpit Canopy
    const canopyGeo = new THREE.SphereGeometry(0.5, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    canopyGeo.scale(0.85, 0.85, 3.2);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.38, 2.2);
    group.add(canopy);

    // 3. Widely separated twin engine nacelles & intakes
    const nacelleGeo = new THREE.CylinderGeometry(0.48, 0.52, 6.2, 12);
    nacelleGeo.rotateX(Math.PI / 2);

    const lNacelle = new THREE.Mesh(nacelleGeo, darkCamoMat);
    lNacelle.position.set(0.9, -0.32, -1.0);
    group.add(lNacelle);

    const rNacelle = lNacelle.clone();
    rNacelle.position.x = -0.9;
    group.add(rNacelle);

    // 4. Central tail "stinger" boom extending past the exhausts
    const stingerGeo = new THREE.CylinderGeometry(0.2, 0.05, 3.2, 8);
    stingerGeo.rotateX(Math.PI / 2);
    const stinger = new THREE.Mesh(stingerGeo, darkCamoMat);
    stinger.position.set(0, -0.1, -5.2);
    group.add(stinger);

    // 5. Swept Wings with LERX
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 2.5);
    wingShape.lineTo(5.6, -1.5);
    wingShape.lineTo(5.2, -2.6);
    wingShape.lineTo(0, -2.6);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });
    wingGeo.translate(0, 0, -0.06);
    wingGeo.rotateX(Math.PI / 2);

    const lWing = new THREE.Mesh(wingGeo, camoMat);
    lWing.position.set(0.8, -0.02, 0);
    group.add(lWing);

    const rWingGeo = wingGeo.clone();
    rWingGeo.scale(-1, 1, 1);
    const rWing = new THREE.Mesh(rWingGeo, camoMat);
    rWing.position.set(-0.8, -0.02, 0);
    group.add(rWing);

    // Wingtip ECM pods
    const podGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
    podGeo.rotateX(Math.PI / 2);
    const lPod = new THREE.Mesh(podGeo, metalMat);
    lPod.position.set(6.0, -0.02, -2.0);
    group.add(lPod);
    const rPod = lPod.clone();
    rPod.position.x = -6.0;
    group.add(rPod);

    // Hostile Red Star markings on wings
    const redStarMat = new THREE.MeshBasicMaterial({
      map: this.createRedStarTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });
    const starDecalL = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), redStarMat);
    starDecalL.rotation.x = -Math.PI / 2;
    starDecalL.position.set(3.2, 0.08, -1.2);
    group.add(starDecalL);

    const starDecalR = starDecalL.clone();
    starDecalR.position.x = -3.2;
    group.add(starDecalR);

    // 6. Twin Tall Vertical Stabilizers with hostile red stars
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-0.8, 2.6);
    finShape.lineTo(-1.8, 2.6);
    finShape.lineTo(-1.8, 0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.08 });
    finGeo.translate(0, 0, -0.04);
    finGeo.rotateY(-Math.PI / 2);

    const lFin = new THREE.Mesh(finGeo, camoMat);
    lFin.position.set(0.95, 0.35, -2.6);
    group.add(lFin);

    const rFin = new THREE.Mesh(finGeo, camoMat);
    rFin.position.set(-0.95, 0.35, -2.6);
    group.add(rFin);

    const starFin = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), redStarMat);
    starFin.position.set(1.0, 1.8, -3.5);
    starFin.rotation.y = Math.PI / 2;
    group.add(starFin);

    // 7. Horizontal Stabilizers
    const stabShape = new THREE.Shape();
    stabShape.moveTo(0, 0);
    stabShape.lineTo(2.2, -1.2);
    stabShape.lineTo(1.8, -1.9);
    stabShape.lineTo(0, -1.9);
    stabShape.closePath();

    const stabGeo = new THREE.ExtrudeGeometry(stabShape, { depth: 0.06 });
    stabGeo.translate(0, 0, -0.03);
    stabGeo.rotateX(Math.PI / 2);

    const lStab = new THREE.Mesh(stabGeo, darkCamoMat);
    lStab.position.set(0.9, -0.15, -4.0);
    group.add(lStab);

    const rStabGeo = stabGeo.clone();
    rStabGeo.scale(-1, 1, 1);
    const rStab = new THREE.Mesh(rStabGeo, darkCamoMat);
    rStab.position.set(-0.9, -0.15, -4.0);
    group.add(rStab);

    // 8. Twin Exhaust Nozzles with Afterburners
    const nozzleGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.8, 12, 1, true);
    nozzleGeo.rotateX(Math.PI / 2);

    const lNoz = new THREE.Mesh(nozzleGeo, metalMat);
    lNoz.position.set(0.9, -0.32, -4.2);
    group.add(lNoz);

    const rNoz = lNoz.clone();
    rNoz.position.x = -0.9;
    group.add(rNoz);

    const abConeGeo = new THREE.ConeGeometry(0.32, 1.8, 8);
    abConeGeo.rotateX(-Math.PI / 2);

    const lAB = new THREE.Mesh(abConeGeo, abFlameMat);
    lAB.position.set(0.9, -0.32, -5.0);
    group.add(lAB);

    const rAB = lAB.clone();
    rAB.position.x = -0.9;
    group.add(rAB);

    group.userData.gunMuzzles = [
      new THREE.Vector3(0.3, 0.2, 4.2),
      new THREE.Vector3(-0.3, 0.2, 4.2)
    ];
    group.userData.afterburners = [lAB, rAB];

    return group;
  },

  // =========================================================================
  // 6. MODERN STEALTH MISSILE CORVETTE (BALTIC NAVAL WARSHIP FOR POLAND MAP)
  // Angular radar-deflecting stealth hull, 76mm Oto Melara turret, helipad
  // =========================================================================
  createModernWarship() {
    const group = new THREE.Group();

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Modern naval haze grey
      roughness: 0.4,
      metalness: 0.35
    });
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.6
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.7
    });

    // 1. Angular Stealth Hull (tumblehome / faceted bow)
    const hullGeo = new THREE.BoxGeometry(11, 7, 72);
    hullGeo.scale(1.0, 1.0, 1.0);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 2.5;
    group.add(hull);

    // Wedge bow
    const bowGeo = new THREE.ConeGeometry(5.5, 22, 4);
    bowGeo.rotateX(Math.PI / 2);
    bowGeo.rotateZ(Math.PI / 4);
    bowGeo.scale(1.0, 0.6, 1.0);
    const bow = new THREE.Mesh(bowGeo, hullMat);
    bow.position.set(0, 2.5, 42);
    group.add(bow);

    // 2. Angled Stealth Superstructure & Bridge
    const superGeo = new THREE.BoxGeometry(9, 6.5, 28);
    const superstructure = new THREE.Mesh(superGeo, hullMat);
    superstructure.position.set(0, 7.5, 6);
    group.add(superstructure);

    // Bridge Windows (dark angled glass strip)
    const bridgeGeo = new THREE.BoxGeometry(8.2, 1.2, 6);
    const bridge = new THREE.Mesh(bridgeGeo, darkMat);
    bridge.position.set(0, 9.5, 17);
    group.add(bridge);

    // Integrated Stealth Enclosed Sensor Mast
    const mastGeo = new THREE.ConeGeometry(2.4, 9, 4);
    mastGeo.rotateY(Math.PI / 4);
    const mast = new THREE.Mesh(mastGeo, darkMat);
    mast.position.set(0, 14.5, 4);
    group.add(mast);

    // 3. 76mm Stealth Gun Turret (Forward bow)
    const turretGroup = new THREE.Group();
    turretGroup.position.set(0, 6.5, 26);

    const cupolaGeo = new THREE.ConeGeometry(2.2, 2.2, 6);
    cupolaGeo.rotateY(Math.PI / 6);
    turretGroup.add(new THREE.Mesh(cupolaGeo, darkMat));

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 5.5, 8),
      darkMat
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.4, 3.2);
    turretGroup.add(barrel);
    group.add(turretGroup);

    // 4. Helipad on stern with Polish Szachownica / 'H' marker
    const helipad = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.2, 18),
      deckMat
    );
    helipad.position.set(0, 6.1, -22);
    group.add(helipad);

    const flagPlane = new THREE.PlaneGeometry(5.5, 5.5);
    flagPlane.rotateX(-Math.PI / 2);
    const helipadMarking = new THREE.Mesh(
      flagPlane,
      new THREE.MeshBasicMaterial({
        map: this.createPolishChessboardTexture(),
        transparent: true
      })
    );
    helipadMarking.position.set(0, 6.22, -22);
    group.add(helipadMarking);

    return group;
  }
};

window.PlaneModels = PlaneModels;

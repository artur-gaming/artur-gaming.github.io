/**
 * SailRenderer - Rysuje realistyczny widok boczny jachtu regatowego Delfia 24 OD,
 * animacje wody, żagli, ickerów, załogi oraz mini-kompas taktyczny.
 */

class SailRenderer {
  constructor(canvas, compassCanvas, physics) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.compassCanvas = compassCanvas;
    this.compassCtx = compassCanvas.getContext('2d');
    this.physics = physics;

    this.time = 0;
    this.particles = [];
    this.initWindParticles();
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.canvas.parentElement.clientWidth;
    this.height = this.canvas.parentElement.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initWindParticles() {
    this.particles = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * 2000,
        y: Math.random() * 700,
        length: 20 + Math.random() * 40,
        speed: 1.5 + Math.random() * 2.0,
        opacity: 0.15 + Math.random() * 0.35
      });
    }
  }

  render(activeStation) {
    this.time += 0.016;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Tło: Niebo z gradientem morskim
    this.renderSky(ctx, w, h);

    // 2. Cząsteczki wiatru
    this.renderWindParticles(ctx, w, h);

    // 3. Pozycja bazowa jachtu na ekranie
    // Dynamiczne kołysanie kadłuba na fali (pitch, roll, heave)
    const waveWave = Math.sin(this.time * 2.5) * 6;
    const wavePitch = Math.sin(this.time * 2.2 + 0.5) * 0.025; // delikatny trym wzdłużny

    // Przechył łodzi (widoczny w widoku z boku jako rotacja i zmiana zanurzenia)
    const heelRad = (this.physics.heelAngle * Math.PI) / 180;
    const boatCenterX = w * 0.48;
    const waterlineY = h * 0.65 + waveWave;

    ctx.save();
    ctx.translate(boatCenterX, waterlineY);
    ctx.rotate(wavePitch + (heelRad * 0.25)); // delikatny efekt widoku perspektywicznego boku

    // Skala jachtu dostosowana do wielkości okna
    const scale = Math.min(w / 1150, h / 750) * 1.05;
    ctx.scale(scale, scale);

    // 4. Rysowanie podwodzia (kil z bulbem ołowianym Delfii 24)
    this.renderKeelAndRudder(ctx);

    // 5. Rysowanie kadłuba Delfii 24 OD (widok z boku)
    this.renderHull(ctx);

    // 6. Olinowanie stałe (maszt, salingi, sztag, achtersztag)
    this.renderRigging(ctx);

    // 7. Żagle (Grot i Fok z dynamicznym brzuchem, kątem i ickerami)
    this.renderSails(ctx);

    // 8. Olinowanie ruchome i osprzęt (bom, obciągacz bomu, talia)
    this.renderBoomAndVang(ctx);

    // 9. Załoga na stanowiskach w kokpicie
    this.renderCrew(ctx, activeStation);

    ctx.restore();

    // 10. Fale morskie, bryzgi dziobowe i piana kilowa
    this.renderSeaAndWaves(ctx, w, h, waterlineY, boatCenterX, scale);

    // 11. Kompas taktyczny w rogu ekranu
    this.renderTacticalCompass();
  }

  // Tło nieba i horyzont
  renderSky(ctx, w, h) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    skyGrad.addColorStop(0, '#040b17');
    skyGrad.addColorStop(0.4, '#0a1d36');
    skyGrad.addColorStop(0.75, '#13395c');
    skyGrad.addColorStop(1, '#1e517b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.7);

    // Słońce / poświata na horyzoncie
    const sunGrad = ctx.createRadialGradient(w * 0.2, h * 0.45, 10, w * 0.2, h * 0.45, 300);
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
    sunGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h * 0.7);
  }

  // Linie prądu wiatru w przestrzeni
  renderWindParticles(ctx, w, h) {
    const twaRad = (this.physics.twa * Math.PI) / 180;
    // Wiatr porusza się zgodnie z kątem wiatru
    // Gdy TWA < 90 wiatr wieje z prawej ku lewej (w stronę rufy)
    // Gdy TWA > 90 wiatr wieje z lewej ku prawej (w stronę dziobu)
    const windDirX = Math.cos(twaRad) > 0 ? -1 : 1;
    const speedFactor = (this.physics.tws / 12) * 2.2;

    ctx.lineWidth = 1.5;

    this.particles.forEach(p => {
      p.x += windDirX * p.speed * speedFactor;
      if (p.x < -100) p.x = w + 100;
      if (p.x > w + 100) p.x = -100;

      ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + windDirX * p.length, p.y + Math.sin(this.time * 2 + p.x * 0.01) * 3);
      ctx.stroke();
    });
  }

  // Kil szybrowy z bulbem ołowianym (charakterystyczny dla Delfii 24 OD) oraz ster głębinowy
  renderKeelAndRudder(ctx) {
    ctx.save();
    // Kil schodzi w dół na 170px (w skali modelu)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    // Płetwa kilowa
    ctx.beginPath();
    ctx.moveTo(-10, 5);
    ctx.lineTo(15, 5);
    ctx.lineTo(8, 160);
    ctx.lineTo(-8, 160);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bulb ołowiany (torpeda na dole kila)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(3, 164, 40, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Płetwa sterowa na pawęży
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-210, 5);
    ctx.lineTo(-195, 5);
    ctx.lineTo(-200, 110);
    ctx.lineTo(-218, 105);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rumpel steru z przedłużaczem
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-202, -5);
    ctx.lineTo(-170, -22); // rumpel wznosi się do kokpitu
    ctx.lineTo(-130, -26); // przedłużacz w ręku sternika
    ctx.stroke();

    ctx.restore();
  }

  // Kadłub Delfii 24 OD (widok z profilu: nowoczesna pionowa dziobnica, skośna linia burtowa, otwarta rufa)
  renderHull(ctx) {
    ctx.save();

    // Kształt kadłuba (Delfia 24: długość ok. 440px na naszym rysunku)
    // Dziób po prawej (+210px), rufa po lewej (-210px)
    ctx.beginPath();
    ctx.moveTo(225, -28); // szczyt dziobu (pionowa dziobnica)
    ctx.lineTo(218, 12);  // wejście linii wodnej dziobu
    ctx.quadraticCurveTo(0, 32, -200, 10); // dno kadłuba
    ctx.lineTo(-215, -15); // otwarta pawęż rufy
    ctx.lineTo(-190, -18); // krawędź kokpitu
    ctx.lineTo(-40, -18);  // krawędź burty / kokpit
    ctx.lineTo(30, -24);   // nadbudówka / pokład dziobowy
    ctx.closePath();

    // Kolorystyka regatowa kadłuba (biało-srebrny z granatowym i błękitnym pasem regatowym)
    const hullGrad = ctx.createLinearGradient(0, -30, 0, 30);
    hullGrad.addColorStop(0, '#f8fafc');
    hullGrad.addColorStop(0.6, '#e2e8f0');
    hullGrad.addColorStop(0.85, '#0284c7'); // pas wodny
    hullGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = hullGrad;
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Napis regatowy "DELFIA 24 OD" na burcie
    ctx.font = 'bold 11px Chakra Petch, sans-serif';
    ctx.fillStyle = '#0369a1';
    ctx.textAlign = 'center';
    ctx.fillText('DELFIA 24 OD', -5, -4);

    // Listwa odbojowa / pokład
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(225, -28);
    ctx.lineTo(40, -25);
    ctx.lineTo(-190, -18);
    ctx.stroke();

    // Otwarty kokpit regatowy
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-185, -17);
    ctx.lineTo(-45, -17);
    ctx.lineTo(-45, -7);
    ctx.lineTo(-185, -7);
    ctx.closePath();
    ctx.fill();

    // Kosz dziobowy i słupki relingowe
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Kosz dziobowy
    ctx.moveTo(215, -28);
    ctx.lineTo(210, -50);
    ctx.lineTo(185, -48);
    ctx.lineTo(185, -26);
    // Relingi
    ctx.moveTo(110, -25);
    ctx.lineTo(110, -46);
    ctx.moveTo(35, -24);
    ctx.lineTo(35, -45);
    ctx.moveTo(-100, -18);
    ctx.lineTo(-100, -42);
    ctx.moveTo(-180, -17);
    ctx.lineTo(-180, -42);
    // Linka relingu
    ctx.moveTo(210, -48);
    ctx.lineTo(-180, -40);
    ctx.stroke();

    ctx.restore();
  }

  // Olinowanie stałe (wysoki maszt regatowy, salingi, sztag, achtersztag)
  renderRigging(ctx) {
    ctx.save();
    const mastBaseX = 40;
    const mastBaseY = -25;
    const mastTopX = 32; // delikatne ugięcie masztu w tył (pre-bend regatowy)
    const mastTopY = -430;

    // Maszt (profil aluminiowy)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(mastBaseX, mastBaseY);
    ctx.lineTo(mastTopX, mastTopY);
    ctx.stroke();

    // Sztag przedni (od okucia dziobowego do masztu ok. 7/8 wysokości)
    const forestayTopY = mastTopY + 45;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(220, -27);
    ctx.lineTo(mastTopX + 3, forestayTopY);
    ctx.stroke();

    // Achtersztag (od topu masztu do pawęży rufowej)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mastTopX - 2, mastTopY);
    ctx.lineTo(-212, -16);
    ctx.stroke();

    // Salingi (dwie pary salingów regatowych ze skosem w tył)
    const s1Y = mastTopY + 140;
    const s2Y = mastTopY + 260;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mastBaseX - 3, s1Y);
    ctx.lineTo(mastBaseX - 26, s1Y + 4);
    ctx.moveTo(mastBaseX - 2, s2Y);
    ctx.lineTo(mastBaseX - 28, s2Y + 4);
    ctx.stroke();

    // Wanty
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mastTopX, mastTopY + 50);
    ctx.lineTo(mastBaseX - 26, s1Y + 4);
    ctx.lineTo(mastBaseX - 28, s2Y + 4);
    ctx.lineTo(25, -24); // podwięź wantowa
    ctx.stroke();

    // Wimpel / wiatrowskaz na topie masztu (Windex)
    this.renderWindex(ctx, mastTopX, mastTopY);

    ctx.restore();
  }

  // Wiatrowskaz (Windex) na topie masztu
  renderWindex(ctx, topX, topY) {
    ctx.save();
    ctx.translate(topX, topY);

    // Kąt wiatru pozornego wpływa na obrót wiatrowskazu
    // W widoku z boku wskaźnik pokazuje napływ strug
    const awa = this.physics.apparentWindAngle;
    const arrowLen = 22;
    // Rzut kąta wiatru pozornego na widok boczny
    const visualAngle = Math.cos((awa * Math.PI) / 180) * 0.8;

    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -12);
    ctx.stroke();

    // Strzałka windexu
    ctx.beginPath();
    ctx.moveTo(visualAngle * arrowLen, -12);
    ctx.lineTo(-visualAngle * arrowLen * 0.5, -12);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Rysowanie żagli (Grot i Fok) oraz wskaźników ickerów
  renderSails(ctx) {
    ctx.save();

    const mastBaseX = 40;
    const mastBaseY = -25;
    const mastTopX = 32;
    const mastTopY = -430;

    // --- 1. FOK (Przedni żagiel) ---
    // Fok rozpięty na sztagu
    const tackJibX = 216; // róg halsowy foka na dziobie
    const tackJibY = -27;
    const headJibX = mastTopX + 3; // róg fałowy foka
    const headJibY = mastTopY + 48;

    // Wpływ wybranego szota foka (0 = wybrany, 100 = poluzowany)
    // Przy luzowaniu róg szotowy foka przesuwa się w przód i na zewnątrz
    const jibTrim = this.physics.jibTrim;
    const clewJibX = 70 + (jibTrim / 100) * 45; // róg szotowy foka
    const clewJibY = -45 - (jibTrim / 100) * 20;

    // Wypukłość brzucha foka (belly)
    // Gdy żagiel łopoce (za mocno poluzowany), dodajemy falowanie
    const jibFlutter = (this.physics.jibTellTaleState === 'luffing')
      ? Math.sin(this.time * 30) * (this.physics.luffingAmount * 9)
      : 0;

    // Rysowanie żagla foka (Dacron/Laminat półprzezroczysty regatowy)
    ctx.beginPath();
    ctx.moveTo(tackJibX, tackJibY);
    ctx.lineTo(headJibX, headJibY); // lik przedni na sztagu
    // Lik tylny foka (z brzuchem)
    ctx.quadraticCurveTo(
      (headJibX + clewJibX) / 2 + 15 + jibFlutter,
      (headJibY + clewJibY) / 2,
      clewJibX,
      clewJibY
    );
    // Lik dolny foka
    ctx.quadraticCurveTo((tackJibX + clewJibX) / 2, (tackJibY + clewJibY) / 2 + 8, tackJibX, tackJibY);
    ctx.closePath();

    const jibGrad = ctx.createLinearGradient(tackJibX, tackJibY, headJibX, headJibY);
    jibGrad.addColorStop(0, 'rgba(241, 245, 249, 0.92)');
    jibGrad.addColorStop(0.5, 'rgba(226, 232, 240, 0.82)');
    jibGrad.addColorStop(1, 'rgba(203, 213, 225, 0.88)');
    ctx.fillStyle = jibGrad;
    ctx.fill();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bryty / pasy wzmacniające foka
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tackJibX - 50, tackJibY - 60);
    ctx.lineTo(headJibX + 20, headJibY + 120);
    ctx.stroke();

    // Szot foka biegnący od rogu szotowego do kipy/kabestanu w kokpicie
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(clewJibX, clewJibY);
    ctx.lineTo(20, -18); // kipa foka na pokładzie
    ctx.lineTo(-45, -17); // do kabestanu foka
    ctx.stroke();

    // Ickery na foku (Tell-tales na 1/3 i 2/3 wysokości liku przedniego)
    this.renderTellTale(ctx, tackJibX - 50, tackJibY - 100, this.physics.jibTellTaleState);
    this.renderTellTale(ctx, tackJibX - 110, tackJibY - 220, this.physics.jibTellTaleState);

    // --- 2. GROT (Główny żagiel) ---
    // Róg fałowy na topie
    const headMainX = mastTopX - 3;
    const headMainY = mastTopY + 12;
    // Róg halsowy przy pięcie masztu
    const tackMainX = mastBaseX - 3;
    const tackMainY = mastBaseY - 22;

    // Pozycja bomu i rogu szotowego grota
    // Wpływ szota grota (mainTrim) oraz obciągacza (vangTrim)
    const mainTrim = this.physics.mainTrim;
    const vangTrim = this.physics.vangTrim;

    // Kąt bomu zależy od wybrania grota:
    // W widoku z boku wybrany grot ma bom niemal poziomy i wąski profil
    // Poluzowany grot ma bom widziany w skrócie perspektywicznym
    // Wyluzowany obciągacz bomu (vang > 50) powoduje unoszenie rogu szotowego (twist)
    const boomLength = 220;
    const twistLift = (vangTrim / 100) * 35; // uniesienie bomu przy braku vangu
    const boomAnglePersp = (mainTrim / 100) * 0.45; // skrót boczny

    const clewMainX = tackMainX - (boomLength * Math.cos(boomAnglePersp));
    const clewMainY = tackMainY + 10 - twistLift + (mainTrim / 100) * 12;

    // Łopot grota przy braku trymu
    const mainFlutter = (this.physics.mainTellTaleState === 'luffing')
      ? Math.sin(this.time * 32) * (this.physics.luffingAmount * 11)
      : 0;

    // Lik tylny grota (wypukły profil regatowy z listwami)
    ctx.beginPath();
    ctx.moveTo(tackMainX, tackMainY);
    ctx.lineTo(headMainX, headMainY); // lik przedni w likszparze masztu
    // Lik tylny z listwami
    ctx.quadraticCurveTo(
      (headMainX + clewMainX) / 2 - 38 + mainFlutter,
      (headMainY + clewMainY) / 2,
      clewMainX,
      clewMainY
    );
    // Lik dolny po bomie
    ctx.quadraticCurveTo(
      (tackMainX + clewMainX) / 2,
      (tackMainY + clewMainY) / 2 + 5,
      tackMainX,
      tackMainY
    );
    ctx.closePath();

    const mainGrad = ctx.createLinearGradient(tackMainX, tackMainY, clewMainX, headMainY);
    mainGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    mainGrad.addColorStop(0.5, 'rgba(241, 245, 249, 0.88)');
    mainGrad.addColorStop(1, 'rgba(226, 232, 240, 0.92)');
    ctx.fillStyle = mainGrad;
    ctx.fill();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Listwy grota (pełnolistwowy regatowy grot Delfii 24)
    this.renderBattens(ctx, headMainX, headMainY, clewMainX, clewMainY, tackMainX, tackMainY);

    // Numer regatowy na grocie "POL 24"
    ctx.save();
    ctx.font = 'bold 22px Chakra Petch, sans-serif';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.textAlign = 'center';
    ctx.fillText('POL 24', -35, -210);
    ctx.restore();

    // Ickery na liku tylnym grota (Tell-tales na końcach listew)
    this.renderLeechTellTale(ctx, clewMainX + 8, clewMainY - 70, this.physics.mainTellTaleState);
    this.renderLeechTellTale(ctx, clewMainX + 25, clewMainY - 170, this.physics.mainTellTaleState);
    this.renderLeechTellTale(ctx, clewMainX + 45, clewMainY - 270, this.physics.mainTellTaleState);

    // Zapisz pozycje do rysowania bomu
    this.clewMainX = clewMainX;
    this.clewMainY = clewMainY;
    this.tackMainX = tackMainX;
    this.tackMainY = tackMainY;

    ctx.restore();
  }

  // Rysowanie listew usztywniających grot
  renderBattens(ctx, hX, hY, cX, cY, tX, tY) {
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.5)';
    ctx.lineWidth = 2;

    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const frontX = tX + (hX - tX) * (1 - t);
      const frontY = tY + (hY - tY) * (1 - t);
      const backX = tX + (cX - tX) * t - 25 * Math.sin(t * Math.PI);
      const backY = tY + (cY - tY) * t + (hY - tY) * (1 - t);

      ctx.beginPath();
      ctx.moveTo(frontX, frontY);
      ctx.lineTo(backX, backY);
      ctx.stroke();
    }
  }

  // Icker na poszyciu (nitka wiatrowa)
  renderTellTale(ctx, x, y, state) {
    ctx.save();
    ctx.translate(x, y);

    // Kropka montażowa ickera
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    let color = '#22c55e'; // zielony - przepływ laminarny
    let angle = 0;
    let waveFreq = 15;
    let waveAmp = 2;

    if (state === 'luffing') {
      color = '#ef4444'; // czerwony - trzepocze w górę/dół
      waveFreq = 35;
      waveAmp = 8;
      angle = Math.sin(this.time * waveFreq) * 0.4;
    } else if (state === 'stalled') {
      color = '#f59e0b'; // żółty - opada bez wiatru (oderwanie strug)
      angle = 0.5 + Math.sin(this.time * 6) * 0.15;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);

    const length = 24;
    for (let i = 0; i < length; i += 4) {
      const curAngle = angle + Math.sin(this.time * waveFreq + i * 0.3) * (waveAmp / 20);
      const px = -i * Math.cos(curAngle);
      const py = -i * Math.sin(curAngle);
      ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.restore();
  }

  // Ickery na liku tylnym (leech ribbons)
  renderLeechTellTale(ctx, x, y, state) {
    ctx.save();
    ctx.translate(x, y);

    let color = '#22c55e';
    let flutter = Math.sin(this.time * 20) * 3;

    if (state === 'stalled') {
      // Schowany za żaglem (zawinięty za lik tylny)
      color = '#ef4444';
      flutter = -15 + Math.sin(this.time * 30) * 6;
    } else if (state === 'luffing') {
      color = '#f59e0b';
      flutter = Math.sin(this.time * 35) * 9;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-20, flutter);
    ctx.stroke();

    ctx.restore();
  }

  // Rysowanie bomu, obciągacza bomu (Vang) i talii grota
  renderBoomAndVang(ctx) {
    if (!this.clewMainX) return;
    ctx.save();

    // Bom aluminiowy
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.tackMainX, this.tackMainY + 12);
    ctx.lineTo(this.clewMainX, this.clewMainY);
    ctx.stroke();

    // Obciągacz bomu (Vang) - teleskopowy lub kaskadowy bloczkowy
    // Łączy spód masztu z 1/3 długości bomu
    const vangBoomX = this.tackMainX - 60;
    const vangBoomY = this.tackMainY + 10;
    const vangMastX = this.tackMainX;
    const vangMastY = this.tackMainY + 30;

    // Kolor wskaźnika vangu
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vangMastX, vangMastY);
    ctx.lineTo(vangBoomX, vangBoomY);
    ctx.stroke();

    // Talia grota (szot) - łączący bom z kokpitem
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.clewMainX + 50, this.clewMainY);
    ctx.lineTo(-90, -18); // wózek szotowy w kokpicie
    ctx.stroke();

    ctx.restore();
  }

  // Rysowanie załogi na stanowiskach 1, 2, 3
  renderCrew(ctx, activeStation) {
    ctx.save();

    // Stanowisko 1: Trymer foka (na przodzie kokpitu)
    this.drawCrewMember(ctx, -20, -18, activeStation === 1, '1: Fok');

    // Stanowisko 2: Trymer grota (w centrum kokpitu przy talii)
    this.drawCrewMember(ctx, -85, -18, activeStation === 2, '2: Grot');

    // Stanowisko 3: Regulacja / Obciągacz bomu / Sternik
    this.drawCrewMember(ctx, -145, -18, activeStation === 3, '3: Vang');

    ctx.restore();
  }

  // Sylwetka załoganta w stroju sztormowym / kamizelce asekuracyjnej
  drawCrewMember(ctx, x, y, isActive, label) {
    ctx.save();
    ctx.translate(x, y);

    // Podświetlenie aktywnego stanowiska (aureola / focus)
    if (isActive) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(0, -22, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Znacznik aktywności nad głową
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px Chakra Petch, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WYBRANY', 0, -48);
    }

    // Nogi / tułów
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -16, 12, 16);

    // Kamizelka ratunkowa (jaskrawa czerwona/pomarańczowa)
    ctx.fillStyle = isActive ? '#ef4444' : '#f97316';
    ctx.beginPath();
    ctx.roundRect(-8, -28, 16, 15, 3);
    ctx.fill();

    // Głowa / kask / czapka
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, -33, 6, 0, Math.PI * 2);
    ctx.fill();

    // Ręce trzymające linę
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, -24);
    ctx.lineTo(8, -19);
    ctx.stroke();

    ctx.restore();
  }

  // Dynamiczne fale, piana kilowa i bryzg dziobowy
  renderSeaAndWaves(ctx, w, h, waterlineY, boatCenterX, scale) {
    ctx.save();

    // Warstwa wody pod horyzontem
    const seaGrad = ctx.createLinearGradient(0, waterlineY - 20, 0, h);
    seaGrad.addColorStop(0, '#0369a1');
    seaGrad.addColorStop(0.3, '#0c4a6e');
    seaGrad.addColorStop(1, '#02182b');
    ctx.fillStyle = seaGrad;

    // Dynamiczna linia fali morskiej
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, waterlineY);

    const speed = this.physics.boatSpeed;
    const waveStep = 30;

    for (let x = 0; x <= w; x += waveStep) {
      // Złożenie 3 harmonicznych fal
      const yWave = Math.sin(x * 0.015 - this.time * 3.5) * 8 +
                    Math.cos(x * 0.035 + this.time * 2.0) * 4;
      ctx.lineTo(x, waterlineY + yWave);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Piana dziobowa (Bow wave / Spray) proporcjonalna do prędkości łodzi
    const bowX = boatCenterX + 220 * scale;
    const bowY = waterlineY + 5;
    const spraySize = (speed / 8.0) * 35;

    if (spraySize > 3) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(bowX + 5, bowY - spraySize * 0.3, spraySize, spraySize * 0.45, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Drobne krople bryzgu
      for (let i = 0; i < 6; i++) {
        const dropX = bowX + Math.random() * spraySize * 1.5;
        const dropY = bowY - Math.random() * spraySize * 0.8;
        ctx.fillRect(dropX, dropY, 2, 2);
      }
    }

    // Kilwater i piana rufowa (Stern wake)
    const sternX = boatCenterX - 210 * scale;
    const sternY = waterlineY + 8;
    const wakeLen = (speed / 8.0) * 160;

    const wakeGrad = ctx.createLinearGradient(sternX, sternY, sternX - wakeLen, sternY);
    wakeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    wakeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = wakeGrad;
    ctx.beginPath();
    ctx.ellipse(sternX - wakeLen * 0.5, sternY, wakeLen * 0.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Rysowanie kompasu taktycznego z widokiem jachtu z góry
  renderTacticalCompass() {
    const cCtx = this.compassCtx;
    const cw = this.compassCanvas.width;
    const ch = this.compassCanvas.height;
    const cx = cw / 2;
    const cy = ch / 2;
    const r = cx - 10;

    cCtx.clearRect(0, 0, cw, ch);

    // Tarcza kompasu
    cCtx.fillStyle = '#0b1626';
    cCtx.beginPath();
    cCtx.arc(cx, cy, r, 0, Math.PI * 2);
    cCtx.fill();

    cCtx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    cCtx.lineWidth = 1.5;
    cCtx.stroke();

    // Znaczniki 0, 90, 180, 270
    cCtx.fillStyle = '#94a3b8';
    cCtx.font = '9px Chakra Petch';
    cCtx.textAlign = 'center';
    cCtx.textBaseline = 'middle';
    cCtx.fillText('DZIÓB', cx, cy - r + 8);
    cCtx.fillText('RUFA', cx, cy + r - 8);

    // Sylwetka kadłuba Delfii 24 widziana z góry (płynie w górę)
    cCtx.save();
    cCtx.translate(cx, cy);
    cCtx.fillStyle = '#f8fafc';
    cCtx.strokeStyle = '#0284c7';
    cCtx.lineWidth = 1;
    cCtx.beginPath();
    cCtx.moveTo(0, -28); // dziób
    cCtx.quadraticCurveTo(12, -5, 11, 24); // burta prawa
    cCtx.lineTo(-11, 24); // pawęż
    cCtx.quadraticCurveTo(-12, -5, 0, -28); // burta lewa
    cCtx.fill();
    cCtx.stroke();

    // Rysowanie bomu grota z góry
    // Kąt bomu od osi symetrii (0 do 85 stopni)
    const mainTrimAngle = (this.physics.mainTrim / 100) * 75 * (Math.PI / 180);
    cCtx.strokeStyle = '#f87171';
    cCtx.lineWidth = 2.5;
    cCtx.beginPath();
    cCtx.moveTo(0, 0);
    // Wyłożenie ku zawietrznej (zależy czy wiatr z prawej czy lewej)
    const side = this.physics.windFromStarboard ? -1 : 1;
    cCtx.lineTo(Math.sin(mainTrimAngle) * 26 * side, Math.cos(mainTrimAngle) * 26);
    cCtx.stroke();
    cCtx.restore();

    // Strzałka Wiatru Rzeczywistego TWD (kolor błękitny #38bdf8)
    const twaRad = (this.physics.twa * Math.PI) / 180;
    const twSide = this.physics.windFromStarboard ? 1 : -1;
    const twAngle = -Math.PI / 2 + (Math.PI - twaRad) * twSide;

    cCtx.strokeStyle = '#38bdf8';
    cCtx.fillStyle = '#38bdf8';
    cCtx.lineWidth = 2.5;
    this.drawArrow(cCtx, cx, cy, twAngle, r - 5, 'TWD');

    // Strzałka Wiatru Pozornego AWA (kolor bursztynowy #f59e0b)
    const awaRad = (this.physics.apparentWindAngle * Math.PI) / 180;
    const awAngle = -Math.PI / 2 + (Math.PI - awaRad) * twSide;

    cCtx.strokeStyle = '#f59e0b';
    cCtx.fillStyle = '#f59e0b';
    cCtx.lineWidth = 2;
    this.drawArrow(cCtx, cx, cy, awAngle, r - 12, 'AWA');
  }

  // Pomocnicze rysowanie wektora ze strzałką
  drawArrow(ctx, cx, cy, angle, length, label) {
    const startX = cx - Math.cos(angle) * length;
    const startY = cy - Math.sin(angle) * length;
    const endX = cx - Math.cos(angle) * (length * 0.35);
    const endY = cy - Math.sin(angle) * (length * 0.35);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Grot strzałki
    const headLen = 6;
    const headAngle = Math.atan2(endY - startY, endX - startX);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLen * Math.cos(headAngle - Math.PI / 6), endY - headLen * Math.sin(headAngle - Math.PI / 6));
    ctx.lineTo(endX - headLen * Math.cos(headAngle + Math.PI / 6), endY - headLen * Math.sin(headAngle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
}

window.SailRenderer = SailRenderer;

/**
 * Sailing Physics Engine for Delfia 24 OD
 * Modeluje aerodynamikę żagla, kąt wiatru rzeczywistego i pozornego,
 * hydrodynamiczne opory kadłuba, przechył i zachowanie ickerów.
 */

class SailingPhysics {
  constructor() {
    // Parametry techniczne Delfii 24 OD
    this.hullLength = 7.30;     // metry
    this.hullBeam = 2.50;       // metry
    this.hullWeight = 950;      // kg
    this.ballastWeight = 350;   // kg w bulbie
    this.draft = 1.50;          // zanurzenie

    // Stan symulacji
    this.resetScenario();
  }

  // Wylosuj realistyczne warunki wiatrowe
  resetScenario() {
    // Siła wiatru rzeczywistego TWS: od 7 do 18 węzłów (ok. 3-5B)
    this.tws = 7 + Math.random() * 11;

    // Kąt wiatru rzeczywistego TWA względem dziobu (od 38° do 165°)
    // Unikamy kąta martwego (< 36°)
    const courses = [
      { name: 'Bajdewind ostry (Close-hauled)', minAngle: 38, maxAngle: 46 },
      { name: 'Bajdewind pełny (Close reach)', minAngle: 48, maxAngle: 65 },
      { name: 'Półwiatr (Beam reach)', minAngle: 80, maxAngle: 100 },
      { name: 'Baksztag (Broad reach)', minAngle: 115, maxAngle: 145 },
      { name: 'Fordepech (Dead run)', minAngle: 155, maxAngle: 172 }
    ];

    const chosen = courses[Math.floor(Math.random() * courses.length)];
    this.courseName = chosen.name;
    this.twa = chosen.minAngle + Math.random() * (chosen.maxAngle - chosen.minAngle);

    // Kąt wiatru lewego lub prawego halsu (dla wizualizacji bocznej załóżmy prawy lub lewy, jacht płynie od lewej do prawej)
    this.windFromStarboard = Math.random() > 0.5; // czy z prawej burty

    // Stanowiska sterowania (wartości od 0% = wybrany do 100% = poluzowany)
    // Gracze startują ze stanowiskami celowo rozregulowanymi
    this.jibTrim = 15 + Math.random() * 70;      // 1: Szot foka
    this.mainTrim = 15 + Math.random() * 70;     // 2: Szot grota
    this.vangTrim = 15 + Math.random() * 70;     // 3: Obciągacz bomu

    // Dynamiczne parametry jachtu
    this.boatSpeed = 2.0;       // węzły
    this.targetSpeed = 6.0;
    this.heelAngle = 0;         // przechył w stopniach
    this.apparentWindSpeed = this.tws;
    this.apparentWindAngle = this.twa;

    // Obliczenie optymalnych wartości bazowych dla wylosowanego TWA i TWS
    this.calculateOptimalTrims();
  }

  // Obliczenie optymalnych ustawień (w skali 0-100%) z tolerancją 20%
  calculateOptimalTrims() {
    // Teoretyczne kąty trymu z podręczników żeglarstwa regatowego dla Delfii 24
    // 0 = wybrany maksymalnie do osi jachtu
    // 100 = poluzowany maksymalnie
    let optJib = 0;
    let optMain = 0;
    let optVang = 0;

    const angle = this.twa;

    if (angle <= 48) {
      // Bajdewind ostry: żagle blisko osi symetrii, obciągacz umiarkowanie napięty
      optJib = 12 + (angle - 38) * 0.8;
      optMain = 10 + (angle - 38) * 0.9;
      optVang = 25 + (this.tws > 12 ? -10 : 5); // w silnym wietrze płaski żagiel
    } else if (angle <= 75) {
      // Bajdewind pełny
      const progress = (angle - 48) / (75 - 48);
      optJib = 20 + progress * 22;
      optMain = 19 + progress * 24;
      optVang = 30 + progress * 15;
    } else if (angle <= 105) {
      // Półwiatr: żagle na ok. 45°
      const progress = (angle - 75) / (105 - 75);
      optJib = 42 + progress * 24;
      optMain = 43 + progress * 22;
      optVang = 45 + progress * 15;
    } else if (angle <= 145) {
      // Baksztag: żagle mocno wyluzowane
      const progress = (angle - 105) / (145 - 105);
      optJib = 66 + progress * 18;
      optMain = 65 + progress * 18;
      optVang = 55 + progress * 15;
    } else {
      // Fordepech: żagle wyłożone maksymalnie, obciągacz wybrany by bom nie szedł w górę!
      const progress = (angle - 145) / (175 - 145);
      optJib = 84 + progress * 14;
      optMain = 83 + progress * 15;
      optVang = 40; // obciągacz dociągnięty w fordepechu przeciwdziała uniesieniu bomu
    }

    // Zaokrąglenie do 1 miejsca
    this.optimalJib = Math.max(5, Math.min(95, optJib));
    this.optimalMain = Math.max(5, Math.min(95, optMain));
    this.optimalVang = Math.max(5, Math.min(95, optVang));

    // Tolerancja 20% (±20 punktów procentowych na skali 0-100%)
    this.tolerance = 20.0;
  }

  // Sprawdzenie czy dane stanowisko mieści się w tolerancji ±20%
  isStationOptimal(stationIndex) {
    if (stationIndex === 1) {
      return Math.abs(this.jibTrim - this.optimalJib) <= this.tolerance;
    } else if (stationIndex === 2) {
      return Math.abs(this.mainTrim - this.optimalMain) <= this.tolerance;
    } else if (stationIndex === 3) {
      return Math.abs(this.vangTrim - this.optimalVang) <= this.tolerance;
    }
    return false;
  }

  // Zmiana wartości wybranego stanowiska
  // direction: -1 = luzuj (klawisz W), +1 = wybieraj (klawisz S)
  adjustStation(stationIndex, direction, dt = 0.016) {
    const rate = 32.0 * dt; // tempo zmiany % na sekundę
    // direction > 0: wybieranie (wartość maleje ku 0)
    // direction < 0: luzowanie (wartość rośnie ku 100)
    const delta = -direction * rate;

    if (stationIndex === 1) {
      this.jibTrim = Math.max(0, Math.min(100, this.jibTrim + delta));
    } else if (stationIndex === 2) {
      this.mainTrim = Math.max(0, Math.min(100, this.mainTrim + delta));
    } else if (stationIndex === 3) {
      this.vangTrim = Math.max(0, Math.min(100, this.vangTrim + delta));
    }
  }

  // Krok symulacji fizycznej (dt w sekundach)
  update(dt) {
    // 1. Obliczenie wiatru pozornego (Apparent Wind)
    // Współrzędne w układzie związanym z kursem jachtu
    const twaRad = (this.twa * Math.PI) / 180;
    const vtx = this.tws * Math.cos(twaRad);
    const vty = this.tws * Math.sin(twaRad);

    // Wiatr pozorny uwzględnia prędkość jachtu (jacht płynie do przodu, więc dodaje wiatr czołowy)
    const awx = vtx + this.boatSpeed;
    const awy = vty;

    this.apparentWindSpeed = Math.sqrt(awx * awx + awy * awy);
    this.apparentWindAngle = (Math.atan2(awy, awx) * 180) / Math.PI;

    // 2. Obliczenie sprawności aerodynamicznej poszczególnych żagli
    const jibDev = Math.abs(this.jibTrim - this.optimalJib);
    const mainDev = Math.abs(this.mainTrim - this.optimalMain);
    const vangDev = Math.abs(this.vangTrim - this.optimalVang);

    // Sprawność w skali 0.0 - 1.0 (wewnątrz tolerancji 20% sprawność >= 0.8)
    const jibEff = Math.max(0.1, 1.0 - (jibDev / (this.tolerance * 2.2)));
    const mainEff = Math.max(0.1, 1.0 - (mainDev / (this.tolerance * 2.2)));
    const vangEff = Math.max(0.2, 1.0 - (vangDev / (this.tolerance * 2.5)));

    // Łączna sprawność trymu (waga foka 0.35, grota 0.45, vangu 0.20)
    this.totalEfficiency = (jibEff * 0.35 + mainEff * 0.45 + vangEff * 0.20);

    // 3. Obliczenie prędkości docelowej wg polarnych Delfii 24 OD
    // Delfia osiąga w bajdewindzie do 6.2 kn, w półwietrze 7.2 kn, w baksztagu w ślizgu nawet 8.5+ kn
    let basePolar = 5.5;
    if (this.twa < 50) basePolar = 5.8;
    else if (this.twa < 85) basePolar = 6.8;
    else if (this.twa < 125) basePolar = 7.6;
    else if (this.twa < 155) basePolar = 7.0;
    else basePolar = 5.6;

    // Wpływ siły wiatru TWS
    const windScale = Math.min(1.2, this.tws / 12.0);
    this.targetSpeed = basePolar * windScale;

    // Rzeczywista prędkość dąży do sprawność * targetSpeed
    const actualTarget = this.targetSpeed * (this.totalEfficiency * 0.9 + 0.1);
    this.boatSpeed += (actualTarget - this.boatSpeed) * (dt * 1.2);

    // 4. Przechył (Heel) - największy w ostrych kursach przy silnym wietrze
    const heelForce = Math.sin(twaRad) * (this.tws * 0.9) * (1.1 - mainDev * 0.005);
    const targetHeel = (heelForce * 1.4) * (this.twa < 90 ? 1.0 : (this.twa < 140 ? 0.5 : 0.15));
    this.heelAngle += (targetHeel - this.heelAngle) * (dt * 2.0);

    // 5. Diagnostyka ickerów (Tell-tales)
    this.jibTellTaleState = this.getTellTaleState(this.jibTrim, this.optimalJib);
    this.mainTellTaleState = this.getTellTaleState(this.mainTrim, this.optimalMain);

    // 6. Ilość trzepotania (dla audio i animacji żagla)
    // Gdy żagiel jest za mocno poluzowany (trim > optimal + tolerance), łopoce
    let flutter = 0;
    if (this.jibTrim > this.optimalJib + this.tolerance) {
      flutter += (this.jibTrim - (this.optimalJib + this.tolerance)) / 40.0;
    }
    if (this.mainTrim > this.optimalMain + this.tolerance) {
      flutter += (this.mainTrim - (this.optimalMain + this.tolerance)) / 40.0;
    }
    this.luffingAmount = Math.min(1.0, flutter);
  }

  // Zwraca stan ickerów:
  // 'optimal' - stabilny przepływ laminarny
  // 'luffing' - za mocno poluzowany (zawietrzny icker trzepocze / żagiel łopoce)
  // 'stalled' - za mocno wybrany (przepływ zerwany / przyduszony żagiel)
  getTellTaleState(currentTrim, optimal) {
    const diff = currentTrim - optimal;
    if (Math.abs(diff) <= this.tolerance) {
      return 'optimal';
    } else if (diff > this.tolerance) {
      return 'luffing'; // poluzowany ponad tolerancję
    } else {
      return 'stalled'; // wybrany ponad tolerancję
    }
  }

  // Czy wszystkie 3 stanowiska są optymalne
  areAllOptimal() {
    return this.isStationOptimal(1) && this.isStationOptimal(2) && this.isStationOptimal(3);
  }
}

window.SailingPhysics = SailingPhysics;

# DYWIZJON 303: Bitwa o Anglię 3D (Polskie Skrzydła)

Dynamiczna gra lotnicza 3D w przeglądarce o strzelaniu w niemieckie samoloty Luftwaffe z czasów II wojny światowej.

Gracz wciela się w polskiego pilota elitarnego **Dywizjonu 303** za sterami myśliwca **Supermarine Spitfire Mk VB** (z biało-czerwoną szachownicą), broniąc formacji alianckich ciężkich bombowców przed falami wrogich samolotów.

---

## 🎮 Jak uruchomić grę?

Możesz uruchomić grę na dwa proste sposoby:

### Sposób 1: Bezpośrednio w przeglądarce
Wystarczy dwukrotnie kliknąć plik `index.html` lub otworzyć go w dowolnej nowoczesnej przeglądarce (Chrome, Safari, Firefox, Edge, Brave).

### Sposób 2: Przez lokalny serwer WWW (zalecane)
W terminalu w tym katalogu uruchom:
```bash
python3 -m http.server 8080
```
Następnie otwórz w przeglądarce: [http://localhost:8080](http://localhost:8080)

---

## ⌨️ Sterowanie

| Klawisz / Mysz | Akcja |
|---|---|
| **Ruch myszką** | Intuicyjne celowanie i sterowanie kątem natarcia / przechyłem |
| **LPM** (Lewy Przycisk Myszy) lub **Spacja** | Ogień z działek 20mm Hispano i karabinów maszynowych .303 Browning |
| **Shift** | Zwiększenie ciągu silnika Rolls-Royce Merlin / Dopalacz (Boost) |
| **Ctrl** | Zmniejszenie ciągu / Hamulec aerodynamiczny |
| **W / S** | Pochylenie w dół / w górę (Pitch) |
| **A / D** | Przechył skrzydłami (Roll) |
| **Q / E** | Ster kierunku (Yaw) |
| **C** | Zmiana kamery (**Kokpit 1. osoba** z celownikiem kolimatorowym ↔ **Widok zza samolotu 3. osoba**) |
| **P** lub **Escape** | Pauza |

---

## 🚀 Cechy i mechaniki rozgrywki

1. **Celownik z kalkulatorem wyprzedzenia (Lead Aim Reticle)**:
   - Dynamiczne czerwone kółko z przerywaną linią oblicza trajektorię lotu wrogiego samolotu oraz prędkość pocisków.
   - Celując w wyznaczone kółko, Twoje serie trafią wroga nawet przy ostrych zwrotach!
2. **Zaawansowane modele samolotów 3D**:
   - **Supermarine Spitfire Mk VB**: eliptyczne skrzydła, znaki RAF i biało-czerwona szachownica Dywizjonu 303, obracające się śmigło, rury wydechowe.
   - **Messerschmitt Bf 109**: kanciaste skrzydła, żółty nos (*Gelbnase*), krzyże Balkenkreuz.
   - **Junkers Ju 87 "Stuka"**: odwrócone skrzydła mewy, owiewki kół, przerażająca syrena nurkująca Jericho!
   - **Ciężkie bombowce alianckie (B-17 / Lancaster)**: 4 obracające się silniki, wieżyczki obronne.
3. **Generowany proceduralnie dźwięk (Web Audio API)**:
   - Zero zewnętrznych plików audio – wszystko syntetyzowane w czasie rzeczywistym!
   - Ryk 12-cylindrowego silnika V12 zmieniający częstotliwość pod wpływem przepustnicy.
   - Ciężki stukot działek Hispano, metaliczne rykoszety trafień, eksplozje i syrena sztukasa.
4. **Taktyczny Radar (Minimap)**:
   - Wykrywa wrogie samoloty (czerwone/złote znaczniki) oraz aliancką formację (zielone punkty) w zasięgu 1.2 km.
5. **Autentyczny klimat Bitwy o Anglię**:
   - Białe klify Dover, kanał La Manche, chmury 3D, przez które można przelatywać, balony zaporowe.

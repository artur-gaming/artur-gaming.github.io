# ⚓ Morski Kurier (Cargo Shipping Game)

Klimatyczna gra symulacyjno-handlowa 2D, w której wcielasz się w kapitana statku żeglującego po niebezpiecznym archipelagu, przewożąc ładunki, realizując kontrakty handlowe i rozbudowując swoją flotę.

## 🚀 Jak uruchomić

Wystarczy otworzyć plik `index.html` w dowolnej nowoczesnej przeglądarce (Safari, Chrome, Firefox, Edge) lub:
- Kliknąć dwukrotnie na `index.html`
- Lub uruchomić skrypt `./start.sh`
- Dostępny jest także lokalny serwer pod adresem: `http://localhost:8080/`

Gra nie wymaga instalacji żadnych zewnętrznych bibliotek ani zależności! Cały dźwięk oraz grafika generowane są proceduralnie w czasie rzeczywistym.

---

## 🎮 Sterowanie

| Klawisz | Akcja |
|---|---|
| **W** / **Strzałka w górę** | Przyspieszenie (stawianie żagli) |
| **S** / **Strzałka w dół** | Wstecz / zwijanie żagli / hamowanie |
| **A** / **Strzałka w lewo** | Zwrot steru w lewo (bakborta) |
| **D** / **Strzałka w prawo** | Zwrot steru w prawo (sterborta) |
| **SPACJA** | Zawinięcie do portu (gdy jesteś przy pomoście) / Kotwica |
| **F** | Włączenie / wyłączenie świateł okrętowych i reflektora dziobowego |
| **H** | Róg mgłowy (syrena okrętowa) |
| **M** | Otwarcie pełnej mapy morskiej archipelagu |
| **Dotyk / Mysz** | Przyciski dotykowe na ekranie dla telefonów i tabletów |

---

## 🌊 Mechanika Rozgrywki

1. **Porty i tawerny:**
   - Podpłyń pod molo ze świecącym zielonym okręgiem i naciśnij **SPACJA**, aby zawinąć do portu.
   - W tawernie czekają **zlecenia przewozu towarów** (z limitem czasu i premią za szybką dostawę).
   - Dostarczony ładunek do portu docelowego automatycznie wypłaca złoto i nagrodę!

2. **Handel rynkowy (Arbitraż):**
   - Kupuj surowce w miastach, które je produkują (taniej).
   - Przewoź je przez morze do wysp z dużym popytem i sprzedawaj z zyskiem.
   - 10 typów ładunków: *Drewno, Świeże ryby, Zboże, Narzędzia, Ruda, Rum, Kawa, Przyprawy, Bursztyn, Złoto*.

3. **Wizualna ładownia:**
   - Każda załadowana skrzynia pojawia się fizycznie na pokładzie Twojego statku!

4. **Stocznia i ulepszenia:**
   - Naprawiaj uszkodzenia kadłuba.
   - Ulepszaj żagle (prędkość), pancerz (punkty życia), pojemność ładowni i lunetę (zasięg radaru).
   - Kupuj większe i potężniejsze statki:
     - 🚤 **Kuter "Mewa"** (Zwrotny, 4 sloty ładunku)
     - ⛵ **Szkuner "Bocian"** (Szybki dwumasztowiec, 8 slotów)
     - 🚢 **Brygantyna "Korsarz"** (Pancerz dębowy, 14 slotów)
     - 🏰 **Galeon "Lewiatan"** (Potężny frachtowiec kolonialny, 24 sloty)

5. **Świat i Zagrożenia:**
   - **Rafy koralowe i mielizny:** uderzenie w skały uszkadza kadłub statku.
   - **Wiry wodne (whirlpools):** silne prądy wciągające statki.
   - **Cykl dnia i nocy oraz pogoda:** złote zachody słońca, gwieździsta noc z latarniami morskimi i deszczowe szkwały.
   - **Dryfujące wraki:** wyławiaj pływające skrzynie z monetami i zapasami!
   - **Nawigacja:** kompas z igłą wskazującą kierunek do celu zlecenia oraz boje nawigacyjne.

6. **Dźwięk proceduralny (Web Audio API):**
   - Szum fal i wiatru, dzwon portowy, róg mgłowy statku, dźwięk złotych monet i uderzeń w wodę.

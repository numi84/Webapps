# Web Apps - Issue Report

Umfassende Code-Review aller 15 Web-Applikationen.

---

## Übersicht nach Schweregrad

| Schweregrad | Anzahl |
|-------------|--------|
| 🔴 Kritisch | 28 |
| 🟠 Hoch | 35 |
| 🟡 Mittel | 42 |
| 🟢 Niedrig | 30+ |

---

## 🔴 Kritische Issues (Sofort beheben)

### 1. DOM Ready Race Condition (ALLE APPS)
**Betrifft:** Alle 15 Apps
**Problem:** DOM-Elemente werden abgefragt bevor das DOM geladen ist
**Risiko:** App-Crash mit "Cannot read property of null"
**Fix:** `DOMContentLoaded` Event Listener verwenden

### 2. AudioContext Memory Leak
**Betrifft:** Pomodoro, Jigsaw-Puzzle, Pong
**Dateien:**
- `apps/pomodoro/pomodoro.js:204`
- `apps/jigsaw-puzzle/puzzle.js:740`
- `apps/pong/pong.js:27`
**Problem:** Neuer AudioContext bei jedem Sound-Aufruf erstellt
**Risiko:** Browser limitiert auf ~6 AudioContexts, danach kein Sound mehr
**Fix:** Einmalig erstellen und wiederverwenden

### 3. LocalStorage Error Handling fehlt (ALLE APPS)
**Betrifft:** Snake, Snake-Deluxe, Todo, Pomodoro, Breakout, Jigsaw
**Problem:** Kein try-catch um localStorage-Operationen
**Risiko:** Crash im Private Browsing Mode oder bei Quota-Überschreitung

### 4. Unsafe JSON.parse
**Betrifft:** Todo, Snake-Deluxe, Pomodoro, Breakout
**Dateien:**
- `apps/todo/todo.js:23`
- `apps/snake-deluxe/snake-deluxe.js:98`
- `apps/pomodoro/pomodoro.js:42`
**Problem:** JSON.parse ohne try-catch
**Risiko:** App-Crash bei korrupten Daten

### 5. Infinite Loop Risiko
**Betrifft:** Snake, Snake-Deluxe
**Dateien:**
- `apps/snake/snake.js:148`
- `apps/snake-deluxe/snake-deluxe.js:400`
**Problem:** Food-Platzierung in do-while ohne Exit-Bedingung
**Risiko:** Browser-Freeze wenn Snake das gesamte Spielfeld füllt

### 6. Memory Leak - Event Listeners
**Betrifft:** Pong, Minesweeper, alle Spiele
**Dateien:**
- `apps/pong/pong.js:253-278`
- `apps/minesweeper/minesweeper.js:136-137`
**Problem:** Event Listeners werden bei jedem Render neu erstellt, alte nicht entfernt
**Fix:** Event Delegation verwenden oder Listener entfernen

### 7. Fehlerhafter Shuffle-Algorithmus
**Betrifft:** Memory
**Datei:** `apps/memory/memory.js:50-52`
**Problem:** `sort(() => Math.random() - 0.5)` ist nicht gleichmäßig zufällig
**Fix:** Fisher-Yates Shuffle implementieren

### 8. Canvas Scaling Bug
**Betrifft:** Drawing
**Datei:** `apps/drawing/drawing.js:34-44`
**Problem:** Position berücksichtigt CSS-Skalierung nicht
**Risiko:** Zeichnen an falscher Position bei responsivem Canvas

---

## 🟠 Hohe Priorität

### Breakout (apps/breakout/)

| Issue | Datei:Zeile | Beschreibung |
|-------|-------------|--------------|
| Custom Level Restart Bug | breakout.js:628-634 | Crash beim Neustarten von Custom Levels |
| Initial Delta Time Bug | breakout.js:649-660 | Erster Frame hat massiven deltaTime |
| Ball Launch Inkonsistenz | breakout.js:294-318 | Unterschiedliche Bedingungen für inaktive Bälle |
| Powerup Stacking Bug | modules/Powerup.js:232-247 | Mehrere Powerups gleichen Typs verursachen falschen Size-Level |
| No XSS Validation | modules/SaveManager.js:261-279 | Level-Codes werden nicht validiert |

### Calculator (apps/calculator/)

| Issue | Datei:Zeile | Beschreibung |
|-------|-------------|--------------|
| Prozent-Logik falsch | calculator.js:98-104 | `200 + 10%` ergibt `200.1` statt `220` |
| Keine Overflow-Behandlung | calculator.js:44-77 | Infinity/NaN werden nicht behandelt |
| Fehlende Number-Formatierung | calculator.js:73 | Volle Float-Präzision angezeigt |

### Image Compare (apps/image-compare/)

| Issue | Datei:Zeile | Beschreibung |
|-------|-------------|--------------|
| Library Check fehlt | image-compare.js:146,190 | pdfjsLib/Tiff nicht geprüft vor Verwendung |
| Division by Zero | image-compare.js:573 | Viewport-Berechnung wenn zoom=0 |
| Keine Dateigrößen-Validierung | - | Große PDFs können Memory exhaustion verursachen |

### Pong (apps/pong/)

| Issue | Datei:Zeile | Beschreibung |
|-------|-------------|--------------|
| Stale DOM Reference | pong.js:253-278 | innerHTML überschreibt, alte Referenzen ungültig |
| Race Condition | pong.js:388-410 | setTimeout läuft nach Game Over weiter |
| Accumulating Timeouts | pong.js:397,407,432,454 | Mehrere setTimeout ohne clearing |

### Tetris (apps/tetris/)

| Issue | Datei:Zeile | Beschreibung |
|-------|-------------|--------------|
| Array Out of Bounds | tetris.js:240 | linesCleared > 4 ergibt NaN score |
| Animation Frame Leak | tetris.js:277 | requestAnimationFrame nicht gecancelt |
| Boundary Validation | tetris.js:167-169 | X-Grenze nicht geprüft |

### Todo (apps/todo/)

| Issue | Datei:Zeile | Beschreibung |
|-------|-------------|--------------|
| ID Collision | todo.js:38 | Date.now() kann kollidieren bei schnellem Erstellen |
| Destruktiver Import | todo.js:219-221 | Ersetzt alle Daten ohne Backup-Option |
| hasOwnProperty unsicher | todo.js:209-212 | Direkter Aufruf kann fehlschlagen |

---

## 🟡 Mittlere Priorität

### Alle Apps - Blocking Dialogs
**Problem:** `alert()` und `confirm()` blockieren den UI-Thread
**Betrifft:**
- Drawing: `drawing.js:113`
- Memory: `memory.js:154`
- Minesweeper: `minesweeper.js:278,281`
- Sliding Puzzle: `puzzle.js:145`
- Snake: `snake.js:158`
- Snake Deluxe: `snake-deluxe.js:431`
- Tetris: `tetris.js:304`
- Todo: `todo.js:69,77,220`
- Yatzy: `yatzy.js:225`
**Fix:** Custom Modals verwenden

### Performance Issues

| App | Issue | Beschreibung |
|-----|-------|--------------|
| Snake/Snake-Deluxe | Grid jedes Frame | 42 Draw-Calls pro Frame für statisches Grid |
| Snake-Deluxe | Shadow Blur | Teure Canvas-Operationen |
| Jigsaw Puzzle | O(n²) Snap Check | 9.216 Iterationen bei 96 Teilen |
| Image Compare | Slider nicht debounced | Komplette Neuberechnung bei jedem Slider-Move |
| Todo | Full Re-render | DOM komplett neu gebaut bei jeder Änderung |
| Breakout | Particle System O(n) | getInactiveParticle lineare Suche |

### Magic Numbers
**Betrifft:** Alle Apps
**Beispiele:**
- Breakout: Zahlreiche hardcodierte Werte
- Calculator: Keine Konstanten
- Games: Zeitintervalle, Größen, Farben

### Fehlende Internationalisierung
**Betrifft:** Alle Apps
**Problem:** Alle Texte auf Deutsch hardcodiert
**Fix:** i18n-System oder Konstanten-Datei

---

## 🟢 Niedrige Priorität / Verbesserungen

### Code-Qualität

| Issue | Betrifft | Beschreibung |
|-------|----------|--------------|
| Globaler State | Alle Apps | Kein Modul-Pattern oder Klassen |
| Keine Separation of Concerns | Alle Apps | Rendering und Logik gemischt |
| Fehlende Kommentare | Komplexe Apps | Rotation, Collision Detection undokumentiert |
| Inkonsistenter Code-Stil | Alle Apps | Mix aus Arrow Functions und regulären Functions |

### Fehlende Features

| App | Feature |
|-----|---------|
| Drawing | Undo/Redo, Layers, Shapes, Fill Tool, Text |
| Calculator | Operator-Anzeige, History |
| Memory | Sound Effects |
| Snake/Tetris | Pause-Funktion |
| Todo | Edit-Funktion, Drag-and-Drop, Kategorien, Due Dates |
| Yatzy | Score-History, Undo, AI-Gegner |
| Alle Games | Mobile Touch-Optimierung |

### UI/UX Verbesserungen

- Visuelle Feedback für Aktionen
- Loading-Indikatoren
- Keyboard-Shortcut-Hints
- Responsive Canvas-Größen
- Smooth Scrolling

---

## Issue-Statistik nach App

| App | 🔴 Kritisch | 🟠 Hoch | 🟡 Mittel | 🟢 Niedrig |
|-----|-------------|---------|-----------|------------|
| Breakout | 2 | 5 | 8 | 6 |
| Calculator | 1 | 3 | 4 | 3 |
| Drawing | 2 | 2 | 6 | 6 |
| Image Compare | 2 | 3 | 5 | 4 |
| Jigsaw Puzzle | 2 | 4 | 6 | 5 |
| Memory | 2 | 2 | 4 | 4 |
| Minesweeper | 2 | 2 | 4 | 3 |
| Pomodoro | 3 | 3 | 4 | 3 |
| Pong | 3 | 4 | 5 | 4 |
| Sliding Puzzle | 2 | 2 | 5 | 4 |
| Snake | 2 | 3 | 5 | 4 |
| Snake Deluxe | 3 | 5 | 8 | 6 |
| Tetris | 2 | 3 | 5 | 4 |
| Todo | 3 | 4 | 5 | 5 |
| Yatzy | 2 | 2 | 4 | 4 |

---

## Empfohlene Reihenfolge zur Behebung

### Phase 1: Kritische Stabilität
1. DOMContentLoaded in allen Apps implementieren
2. localStorage Error Handling hinzufügen
3. JSON.parse in try-catch wrappen
4. AudioContext wiederverwenden
5. Fisher-Yates Shuffle in Memory

### Phase 2: Bug Fixes
1. Breakout Custom Level Restart
2. Calculator Prozent-Logik
3. Pong DOM Reference Bug
4. Tetris Array Bounds Check
5. Todo ID Generation

### Phase 3: UX Verbesserungen
1. Blocking Dialogs durch Modals ersetzen
2. Canvas Scaling Bug in Drawing fixen
3. Performance-Optimierungen (Grid caching, Debouncing)

### Phase 4: Code-Qualität
1. Magic Numbers extrahieren
2. Internationalisierung vorbereiten
3. Separation of Concerns
4. Dokumentation hinzufügen

---

*Erstellt am: 2025-12-24*
*Review durchgeführt mit: Claude Code*

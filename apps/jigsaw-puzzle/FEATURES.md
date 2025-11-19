# Jigsaw Puzzle App - Features

## Kern-Features

### 1. Bild-Upload
**Beschreibung**: Benutzer können eigene Bilder hochladen oder aus Beispielbildern wählen.

**Funktionalität**:
- Drag & Drop Upload-Bereich
- Click-to-Upload Button
- Unterstützte Formate: JPG, PNG, WebP, GIF
- Bildvorschau vor Spielstart
- Maximale Dateigröße: 10MB
- Automatische Größenanpassung großer Bilder
- 3-5 Standard-Beispielbilder zur Auswahl

**UI Elemente**:
- Upload-Box mit gestricheltem Rand
- File-Input Button
- Vorschau-Container
- Beispielbild-Galerie

---

### 2. Schwierigkeitsgrade
**Beschreibung**: Verschiedene Schwierigkeitsstufen basierend auf Teile-Anzahl.

**Verfügbare Grade**:
- **Einfach**: 3x4 = 12 Teile (für Kinder/Anfänger)
- **Mittel**: 4x6 = 24 Teile (Standard)
- **Schwer**: 6x8 = 48 Teile (Fortgeschritten)
- **Experte**: 8x12 = 96 Teile (Herausforderung)
- **Custom**: Freie Eingabe (min 6, max 200 Teile)

**UI Elemente**:
- Radio-Buttons oder Cards für Schwierigkeitsauswahl
- Teile-Vorschau (visuell wie das Grid aussieht)
- Custom-Input für eigene Anzahl

---

### 3. Puzzle-Mechanik
**Beschreibung**: Realistische Jigsaw-Puzzle Erfahrung.

**Funktionalität**:
- Klassische Puzzle-Formen mit Noppen und Einbuchtungen
- Jedes Teil hat 4 Seiten (top, right, bottom, left)
- Rand-Teile haben gerade Kanten
- Zufällige Generierung der Formen
- Präzises Ausschneiden des Bildes entlang der Formen

**Piece-Shapes**:
```
Seite kann sein:
- flat (gerade): für Randteile
- in (Einbuchtung): konkave Form
- out (Nase/Noppe): konvexe Form
```

---

### 4. Drag & Drop
**Beschreibung**: Intuitive Steuerung für Puzzle-Teile.

**Funktionalität**:
- **Maus-Steuerung**:
  - Click & Drag zum Bewegen
  - Piece folgt Mauszeiger
  - Drop zum Platzieren
- **Touch-Steuerung**:
  - Touch & Drag auf Mobile
  - Multi-Touch Support
- **Piece-Gruppierung**:
  - Verbundene Teile bewegen sich zusammen
  - Ganzes Gruppen verschieben
- **Z-Index Management**:
  - Aktuell gezogenes Teil immer oben
  - Click bringt Teil nach vorne

---

### 5. Snap-to-Grid
**Beschreibung**: Automatisches Verbinden benachbarter Teile.

**Funktionalität**:
- Snap-Radius: ~20-30 Pixel
- Magnetischer Effekt beim Annähern
- Visual Feedback (Highlight) bei möglicher Verbindung
- Sanfte Animation beim Einrasten
- Sound-Effekt beim Verbinden (optional)
- Automatisches Gruppieren verbundener Teile

**Snap-Logik**:
```
Wenn Teil A in Snap-Radius von Teil B:
  - Prüfe ob A und B Nachbarn sind (row/col)
  - Wenn ja: Snap zusammen
  - Update Gruppe
  - Play Animation/Sound
```

---

### 6. Hilfe-Features
**Beschreibung**: Verschiedene Hilfen für Spieler.

**Verfügbare Hilfen**:

#### 6.1 Ghost-Bild
- Halbtransparentes Zielbild im Hintergrund
- Toggle on/off
- Opacity-Slider (0-50%)

#### 6.2 Vorschau-Fenster
- Kleines Fenster mit Komplettbild
- Verschiebbar
- Toggle on/off
- Zoom-Funktion

#### 6.3 Rand-Highlight
- Ecken und Randteile hervorheben
- Unterschiedliche Farbe/Border
- Toggle on/off

#### 6.4 Sortier-Funktionen
- "Randteile sortieren" Button
- "Nach Farbe sortieren" (Advanced)
- Sortierte Teile in separate Bereiche

---

### 7. Spielfortschritt
**Beschreibung**: Tracking und Anzeige des Fortschritts.

**Tracked Metriken**:
- **Timer**: Elapsed Time seit Start
- **Moves**: Anzahl der Bewegungen
- **Platzierte Teile**: X von Y Teilen
- **Prozentsatz**: X% fertig
- **Gruppen**: Anzahl zusammenhängender Gruppen

**UI Anzeige**:
- Progress Bar (visuell)
- Timer-Display (MM:SS)
- Statistik-Panel
- Completion-Nachricht bei 100%

---

### 8. Speichern & Laden
**Beschreibung**: Spielstand sichern und fortsetzen.

**Funktionalität**:
- **Auto-Save**: Automatisch alle 30 Sekunden
- **Manual Save**: "Speichern" Button
- **Load on Start**: Automatisch letzten Stand laden
- **New Game**: Option zum Verwerfen und Neustart
- **Multiple Saves**: Mehrere Puzzles parallel (optional)

**Gespeicherte Daten**:
- Bild (als Base64 oder URL)
- Puzzle-Konfiguration (Rows/Cols)
- Position aller Teile
- Verbundene Gruppen
- Timer-Stand
- Settings

---

### 9. UI/UX Features

#### 9.1 Spielbereich
- **Canvas**: Hauptspielbereich
- **Zoom Controls**: +/- Buttons
- **Pan**: Verschieben des Spielbereichs
- **Fit to Screen**: Auto-Zoom

#### 9.2 Teile-Ablage
- Separater Bereich für unplatzierte Teile
- Scrollbar bei vielen Teilen
- Shuffle-Funktion
- Grid-Layout

#### 9.3 Control Panel
- Pause/Resume Button
- Reset Button
- Settings Button
- Help Button
- Back to Menu

#### 9.4 Settings Modal
- Sound on/off
- Ghost Image on/off
- Preview on/off
- Edge Highlight on/off
- Auto-Save on/off

---

### 10. Completion Features
**Beschreibung**: Celebration bei Fertigstellung.

**Funktionalität**:
- **Completion Detection**: Automatisch erkennen
- **Animation**: Confetti/Fireworks
- **Sound Effect**: Success Sound
- **Stats Screen**:
  - Completion Time
  - Total Moves
  - Difficulty
  - "New Game" Button
  - "Share" Button (optional)

---

## Bonus Features (Optional/Future)

### 11. Rotation Mode
- Teile sind zusätzlich rotiert
- Doppelclick zum Rotieren
- Erhöhter Schwierigkeitsgrad

### 12. Multiplayer
- Kollaboratives Puzzle
- WebSocket/WebRTC
- Mehrere Cursor sichtbar

### 13. Daily Puzzle
- Täglich neues Puzzle
- Globale Leaderboard
- Shared Challenges

### 14. Custom Shapes
- Verschiedene Puzzle-Formen
- Hexagonal, Dreieck, etc.
- Irregular Pieces

### 15. Accessibility
- Keyboard Navigation
- Screen Reader Support
- High Contrast Mode
- Colorblind Modes

---

## Feature-Priorisierung

**Phase 1 (MVP)**:
- ✓ Bild-Upload
- ✓ Schwierigkeitsgrade (4 Stufen)
- ✓ Basic Puzzle-Mechanik
- ✓ Drag & Drop
- ✓ Snap-to-Grid
- ✓ Progress Tracking
- ✓ Basic UI

**Phase 2 (Enhanced)**:
- ✓ Hilfe-Features
- ✓ Speichern/Laden
- ✓ Settings
- ✓ Completion Animation
- ✓ Responsive Design

**Phase 3 (Polish)**:
- Sound Effects
- Advanced Sorting
- Better Animations
- Performance Optimization

**Phase 4 (Future)**:
- Rotation Mode
- Multiplayer
- Daily Puzzles

# Jigsaw Puzzle App - Implementierungs-Guide

## Implementierungs-Phasen

### Phase 1: Projekt-Setup und Grundstruktur

#### Schritt 1.1: HTML Struktur
**Datei**: `index.html`

**Screens zu erstellen**:
1. Upload Screen
2. Settings Screen
3. Game Screen
4. Completion Screen

**Haupt-Container**:
```html
- #app-container
  - #upload-screen
  - #settings-screen
  - #game-screen
  - #completion-screen
```

---

#### Schritt 1.2: CSS Basis-Styling
**Datei**: `puzzle.css`

**Zu stylen**:
- Layout für alle Screens
- Responsive Grid
- Button Styles
- Card/Panel Styles
- Canvas Container
- Upload Dropzone

---

#### Schritt 1.3: JavaScript Grundgerüst
**Datei**: `puzzle.js`

**Initialisierung**:
```javascript
- DOM Ready Handler
- State Management Setup
- Event Listener Registration
- Initial Screen Display
```

---

### Phase 2: Upload-Funktionalität

#### Schritt 2.1: File Upload
**Features**:
- File Input Handler
- Drag & Drop Zone
- File Validation (Type, Size)
- Error Handling

**Funktionen zu implementieren**:
```javascript
handleFileSelect(event)
handleDrop(event)
handleDragOver(event)
validateFile(file)
```

---

#### Schritt 2.2: Image Preview
**Features**:
- Load Image from File
- Display Preview
- Calculate optimal size
- Show Image Info

**Funktionen zu implementieren**:
```javascript
loadImage(file)
displayPreview(image)
calculateImageSize(image)
```

---

#### Schritt 2.3: Beispielbilder
**Features**:
- Array von Beispiel-URLs
- Thumbnail Gallery
- Click Handler
- Load Example Image

**Beispielbilder** (Placeholder URLs):
```javascript
const exampleImages = [
  'https://picsum.photos/800/600?random=1',
  'https://picsum.photos/800/600?random=2',
  'https://picsum.photos/800/600?random=3'
]
```

---

### Phase 3: Settings & Game Setup

#### Schritt 3.1: Difficulty Selection
**Features**:
- Difficulty Options UI
- Custom Input Validation
- Grid Preview
- Confirm & Start Button

**Difficulties**:
```javascript
const difficulties = {
  easy: { rows: 3, cols: 4 },
  medium: { rows: 4, cols: 6 },
  hard: { rows: 6, cols: 8 },
  expert: { rows: 8, cols: 12 }
}
```

---

#### Schritt 3.2: Options Panel
**Features**:
- Checkboxes für Features
- Settings Persistence
- Apply Settings

**Options**:
- Enable Ghost Image
- Show Preview Window
- Highlight Edge Pieces
- Enable Sound

---

### Phase 4: Puzzle-Generierung

#### Schritt 4.1: PuzzlePiece Klasse
**Implementierung**:
```javascript
class PuzzlePiece {
  constructor(id, row, col, x, y, width, height)
  - Speichert Position im Grid
  - Speichert aktuelle Position
  - Speichert Zielposition
  - Shape-Informationen
  - Bild-Ausschnitt

  render(ctx)
  moveTo(x, y)
  isNear(otherPiece)
  connectTo(otherPiece)
}
```

---

#### Schritt 4.2: Shape-Generierung
**Implementierung**:
```javascript
class PieceShape {
  constructor(top, right, bottom, left)

  generatePath(x, y, width, height) {
    // Erstellt Canvas Path mit:
    // - Gerade Linien für 'flat'
    // - Bézier-Kurven für 'in'/'out'
    // - Tab/Slot Shapes
  }
}

generateRandomShapes(rows, cols) {
  // Erstellt kompatible Shapes
  // Stellt sicher dass Teile zusammenpassen
}
```

---

#### Schritt 4.3: Image Cutting
**Implementierung**:
```javascript
class PuzzleGenerator {
  static generate(image, rows, cols) {
    // 1. Berechne Piece-Größe
    // 2. Generiere Shapes
    // 3. Erstelle Pieces Array
    // 4. Schneide Bild
    // 5. Shuffle Pieces
    return pieces
  }

  static cutImageForPiece(image, piece, shape) {
    // 1. Erstelle temporären Canvas
    // 2. Zeichne Shape als Clip-Path
    // 3. Zeichne Bildausschnitt
    // 4. Extrahiere ImageData
    return imageData
  }
}
```

---

### Phase 5: Game Canvas & Rendering

#### Schritt 5.1: Canvas Setup
**Implementierung**:
```javascript
class GameCanvas {
  constructor(canvasElement)
  - Setup Canvas Größe
  - Get 2D Context
  - Setup Coordinate System

  resize()
  clear()
  setZoom(level)
  setPan(x, y)
}
```

---

#### Schritt 5.2: Render Loop
**Implementierung**:
```javascript
class GameRenderer {
  constructor(canvas, pieces)

  render() {
    requestAnimationFrame(() => this.render())

    // 1. Clear Canvas
    this.canvas.clear()

    // 2. Render Ghost Image (if enabled)
    if (settings.showGhost) {
      this.renderGhostImage()
    }

    // 3. Render Pieces (bottom to top)
    this.renderPieces()

    // 4. Render UI Elements
    this.renderUI()
  }

  renderPieces() {
    // Sort by z-index
    // Render each piece
  }
}
```

---

#### Schritt 5.3: Piece Rendering
**Implementierung**:
```javascript
PuzzlePiece.prototype.render = function(ctx) {
  ctx.save()

  // 1. Translate to position
  ctx.translate(this.x, this.y)

  // 2. Create clip path from shape
  this.shape.generatePath(ctx, 0, 0, this.width, this.height)
  ctx.clip()

  // 3. Draw image data
  ctx.drawImage(this.imageData, 0, 0)

  // 4. Draw outline
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  this.shape.generatePath(ctx, 0, 0, this.width, this.height)
  ctx.stroke()

  ctx.restore()
}
```

---

### Phase 6: Drag & Drop

#### Schritt 6.1: Mouse Events
**Implementierung**:
```javascript
class DragController {
  constructor(canvas, pieces)
  - draggedPiece = null
  - draggedGroup = []
  - offset = {x: 0, y: 0}

  onMouseDown(e) {
    // 1. Get mouse position
    // 2. Find clicked piece
    // 3. Start drag
    // 4. Bring to front
  }

  onMouseMove(e) {
    // 1. Calculate new position
    // 2. Move piece (and group)
    // 3. Check for snap
  }

  onMouseUp(e) {
    // 1. Release piece
    // 2. Check final snap
    // 3. Update groups
  }
}
```

---

#### Schritt 6.2: Touch Events
**Implementierung**:
```javascript
DragController.prototype.setupTouchEvents = function() {
  this.canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    this.onMouseDown({
      clientX: touch.clientX,
      clientY: touch.clientY
    })
  })

  // Similar for touchmove, touchend
}
```

---

#### Schritt 6.3: Coordinate Transform
**Implementierung**:
```javascript
getCanvasCoordinates(clientX, clientY) {
  const rect = this.canvas.getBoundingClientRect()
  return {
    x: (clientX - rect.left) / this.zoom - this.pan.x,
    y: (clientY - rect.top) / this.zoom - this.pan.y
  }
}
```

---

### Phase 7: Snap & Connect

#### Schritt 7.1: Snap Detection
**Implementierung**:
```javascript
class SnapController {
  constructor(pieces)
  - snapRadius = 25

  checkSnap(piece) {
    // 1. Get neighbors (row±1, col±1)
    const neighbors = this.getNeighbors(piece)

    // 2. Check distance to each
    for (const neighbor of neighbors) {
      if (this.isInSnapRange(piece, neighbor)) {
        return neighbor
      }
    }
    return null
  }

  isInSnapRange(piece1, piece2) {
    const distance = this.getDistance(piece1, piece2)
    return distance < this.snapRadius
  }

  snapTogether(piece1, piece2) {
    // 1. Calculate exact position
    // 2. Move piece1 to piece2
    // 3. Merge groups
    // 4. Play animation/sound
  }
}
```

---

#### Schritt 7.2: Group Management
**Implementierung**:
```javascript
class PieceGroup {
  constructor()
  - pieces = []

  add(piece)
  remove(piece)
  merge(otherGroup)
  moveTo(x, y)
  getBounds()
}

class GroupManager {
  constructor()
  - groups = []

  createGroup(piece)
  mergeGroups(group1, group2)
  getGroupForPiece(piece)
  moveGroup(group, dx, dy)
}
```

---

### Phase 8: Progress & UI

#### Schritt 8.1: Progress Tracking
**Implementierung**:
```javascript
class ProgressTracker {
  constructor(totalPieces)
  - startTime = Date.now()
  - moves = 0
  - placedPieces = 0
  - totalPieces

  incrementMoves()
  updatePlaced(count)
  getElapsedTime()
  getProgress()

  isComplete() {
    return this.placedPieces === this.totalPieces
  }
}
```

---

#### Schritt 8.2: UI Updates
**Implementierung**:
```javascript
class UIController {
  updateProgressBar(percentage)
  updateTimer(elapsed)
  updateStats(stats)
  showMessage(text)
  showCompletionScreen(stats)
}

// Update Loop
setInterval(() => {
  if (gameState === 'playing') {
    const elapsed = progressTracker.getElapsedTime()
    uiController.updateTimer(elapsed)
  }
}, 1000)
```

---

#### Schritt 8.3: Help Features
**Implementierung**:
```javascript
// Ghost Image
function renderGhostImage(ctx, image, opacity) {
  ctx.globalAlpha = opacity
  ctx.drawImage(image, 0, 0, width, height)
  ctx.globalAlpha = 1.0
}

// Preview Window
function createPreviewWindow(image) {
  const preview = document.createElement('div')
  preview.className = 'preview-window'
  // Make draggable
  // Add close button
  return preview
}

// Edge Highlighting
function highlightEdgePieces(pieces) {
  pieces.forEach(piece => {
    if (piece.isEdge()) {
      piece.highlight = true
    }
  })
}
```

---

### Phase 9: Save & Load

#### Schritt 9.1: Save System
**Implementierung**:
```javascript
class SaveManager {
  save(gameState) {
    const saveData = {
      imageData: gameState.image.toDataURL(),
      difficulty: gameState.difficulty,
      pieces: gameState.pieces.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        isPlaced: p.isPlaced
      })),
      groups: gameState.groups,
      progress: {
        startTime: progressTracker.startTime,
        moves: progressTracker.moves,
        placedPieces: progressTracker.placedPieces
      },
      settings: gameState.settings
    }

    localStorage.setItem('jigsaw-puzzle-save',
                         JSON.stringify(saveData))
  }

  load() {
    const data = localStorage.getItem('jigsaw-puzzle-save')
    if (!data) return null
    return JSON.parse(data)
  }

  clear() {
    localStorage.removeItem('jigsaw-puzzle-save')
  }
}
```

---

#### Schritt 9.2: Auto-Save
**Implementierung**:
```javascript
// Auto-save every 30 seconds
setInterval(() => {
  if (gameState === 'playing') {
    saveManager.save(currentGame)
  }
}, 30000)

// Save on page unload
window.addEventListener('beforeunload', () => {
  if (gameState === 'playing') {
    saveManager.save(currentGame)
  }
})
```

---

### Phase 10: Completion & Polish

#### Schritt 10.1: Completion Detection
**Implementierung**:
```javascript
function checkCompletion() {
  const allPlaced = pieces.every(p => p.isPlaced)

  if (allPlaced) {
    gameState = 'completed'
    showCompletionAnimation()
    showCompletionScreen()
    saveHighScore()
  }
}
```

---

#### Schritt 10.2: Completion Animation
**Implementierung**:
```javascript
function showCompletionAnimation() {
  // Confetti Animation
  const confetti = new ConfettiEffect()
  confetti.play()

  // Sound Effect
  if (settings.soundEnabled) {
    playSound('success')
  }

  // Fade in completion screen
  setTimeout(() => {
    document.getElementById('completion-screen')
            .classList.add('show')
  }, 1000)
}
```

---

#### Schritt 10.3: Completion Screen
**Implementierung**:
```javascript
function showCompletionScreen() {
  const stats = {
    time: formatTime(progressTracker.getElapsedTime()),
    moves: progressTracker.moves,
    difficulty: currentDifficulty,
    pieces: totalPieces
  }

  document.getElementById('completion-time').textContent = stats.time
  document.getElementById('completion-moves').textContent = stats.moves
  // etc.
}
```

---

### Phase 11: Testing & Optimization

#### Schritt 11.1: Performance Testing
**Zu testen**:
- FPS bei 96 Teilen
- Memory Usage
- Load Time
- Mobile Performance

**Optimierungen**:
- Piece Culling
- Dirty Rectangle Rendering
- Canvas Layering
- Image Compression

---

#### Schritt 11.2: Browser Testing
**Zu testen**:
- Chrome
- Firefox
- Safari
- Edge
- Mobile Browsers

---

#### Schritt 11.3: Bug Fixes
**Common Issues**:
- Snap Detection Bugs
- Group Movement Issues
- Canvas Scaling Problems
- Touch Event Conflicts
- Memory Leaks

---

### Phase 12: Integration

#### Schritt 12.1: Add to Main Page
**Datei**: `/index.html`

```html
<div class="app-card">
  <div class="app-icon">🧩</div>
  <h2>Jigsaw Puzzle</h2>
  <p>Lade eigene Bilder hoch und erstelle Puzzles</p>
  <a href="apps/jigsaw-puzzle/index.html" class="app-link">
    Spielen
  </a>
</div>
```

---

## Datei-Checkliste

- [ ] `index.html` - Haupt-HTML
- [ ] `puzzle.css` - Styling
- [ ] `puzzle.js` - Haupt-Logik
- [ ] `PLAN.md` - Projektplan ✓
- [ ] `ARCHITECTURE.md` - Architektur ✓
- [ ] `FEATURES.md` - Features ✓
- [ ] `IMPLEMENTATION.md` - Dieser Guide ✓

---

## Code-Struktur Übersicht

```javascript
// puzzle.js Structure
// ====================

// 1. Constants & Configuration
const DIFFICULTIES = { ... }
const SETTINGS_DEFAULT = { ... }

// 2. State Management
let gameState = { ... }

// 3. Classes
class PuzzlePiece { ... }
class PieceShape { ... }
class PieceGroup { ... }
class PuzzleGenerator { ... }
class GameCanvas { ... }
class GameRenderer { ... }
class DragController { ... }
class SnapController { ... }
class GroupManager { ... }
class ProgressTracker { ... }
class UIController { ... }
class SaveManager { ... }

// 4. Main Game Class
class PuzzleGame {
  init()
  loadImage()
  startGame()
  update()
  render()
  reset()
}

// 5. Utility Functions
function formatTime(ms)
function shuffleArray(arr)
function getDistance(p1, p2)

// 6. Event Handlers
function handleFileUpload(e)
function handleDifficultySelect(e)
function handleSettingChange(e)

// 7. Initialization
document.addEventListener('DOMContentLoaded', () => {
  const game = new PuzzleGame()
  game.init()
})
```

---

## Nächste Schritte

1. ✓ Planungsdokumente erstellen
2. **JETZT**: HTML Grundstruktur erstellen
3. CSS Basis-Styling
4. JavaScript Setup
5. Upload-Funktionalität
6. ... (siehe Phasen oben)

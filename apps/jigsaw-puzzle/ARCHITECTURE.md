# Jigsaw Puzzle App - Architektur

## System-Architektur

### Komponenten-Übersicht
```
jigsaw-puzzle/
├── index.html          # Haupt-HTML Struktur
├── puzzle.css          # Styling
├── puzzle.js           # Hauptlogik und Koordination
└── docs/
    ├── PLAN.md
    ├── ARCHITECTURE.md
    ├── FEATURES.md
    └── IMPLEMENTATION.md
```

## Klassen-Struktur

### 1. PuzzleGame (Hauptklasse)
```javascript
class PuzzleGame {
  constructor()
  - state: 'upload' | 'settings' | 'playing' | 'completed'
  - currentImage: Image
  - difficulty: DifficultyLevel
  - pieces: PuzzlePiece[]
  - completedGroups: PieceGroup[]

  init()
  loadImage(file)
  startGame(difficulty)
  reset()
  saveProgress()
  loadProgress()
}
```

### 2. PuzzlePiece (Puzzle-Teil)
```javascript
class PuzzlePiece {
  constructor(id, row, col, imageData)
  - id: number
  - row: number
  - col: number
  - currentX: number
  - currentY: number
  - correctX: number
  - correctY: number
  - imageData: ImageData
  - shape: PieceShape
  - connectedPieces: PuzzlePiece[]
  - isPlaced: boolean

  render(ctx)
  moveTo(x, y)
  checkSnap(otherPieces)
  connectTo(piece)
}
```

### 3. PieceShape (Form-Generator)
```javascript
class PieceShape {
  - top: 'flat' | 'in' | 'out'
  - right: 'flat' | 'in' | 'out'
  - bottom: 'flat' | 'in' | 'out'
  - left: 'flat' | 'in' | 'out'

  generatePath(x, y, width, height)
  // Generiert SVG/Canvas Path für Puzzle-Form
}
```

### 4. PuzzleGenerator
```javascript
class PuzzleGenerator {
  static generate(image, rows, cols)
  static createPieces(image, rows, cols)
  static assignShapes(pieces, rows, cols)
  static cutImage(image, piece, shape)
}
```

### 5. DragManager
```javascript
class DragManager {
  - draggedPiece: PuzzlePiece
  - offset: {x, y}

  onMouseDown(e, piece)
  onMouseMove(e)
  onMouseUp(e)
  onTouchStart(e, piece)
  onTouchMove(e)
  onTouchEnd(e)
}
```

### 6. ProgressTracker
```javascript
class ProgressTracker {
  - startTime: Date
  - moves: number
  - placedPieces: number
  - totalPieces: number

  updateProgress()
  getCompletionPercentage()
  getElapsedTime()
  incrementMoves()
}
```

## Datenfluss

1. **Upload Phase**:
   ```
   User selects image → File API reads file → Image loaded → Preview shown
   ```

2. **Setup Phase**:
   ```
   User selects difficulty → PuzzleGenerator creates pieces →
   Pieces shuffled → Game starts
   ```

3. **Game Phase**:
   ```
   User drags piece → DragManager handles movement →
   Snap detection checks → Pieces connect → Progress updates
   ```

4. **Completion**:
   ```
   Last piece placed → Completion detected → Animation plays →
   Stats shown → Save to localStorage
   ```

## Canvas-Rendering

### Render-Schichten
1. **Background Layer**: Ghost-Bild (optional)
2. **Placed Pieces Layer**: Korrekt platzierte Teile
3. **Active Pieces Layer**: Noch nicht platzierte Teile
4. **UI Layer**: Hilfslinien, Highlights, etc.

### Rendering-Pipeline
```
requestAnimationFrame loop:
  1. Clear canvas
  2. Render ghost image (if enabled)
  3. Render all pieces in z-order
  4. Render UI elements
  5. Render dragged piece on top
```

## State Management

```javascript
const GameState = {
  UPLOAD: 'upload',
  SETTINGS: 'settings',
  PLAYING: 'playing',
  PAUSED: 'paused',
  COMPLETED: 'completed'
}

const gameState = {
  currentState: GameState.UPLOAD,
  image: null,
  difficulty: null,
  pieces: [],
  settings: {
    showGhost: false,
    showPreview: true,
    highlightEdges: false,
    soundEnabled: true
  },
  progress: {
    startTime: null,
    moves: 0,
    placedPieces: 0
  }
}
```

## LocalStorage Schema

```javascript
{
  "jigsaw-puzzle-save": {
    "imageData": "base64...",
    "difficulty": "medium",
    "pieces": [
      {
        "id": 0,
        "currentX": 100,
        "currentY": 150,
        "isPlaced": false,
        "connectedTo": []
      }
    ],
    "progress": {
      "startTime": "2025-11-19T12:00:00Z",
      "moves": 45,
      "placedPieces": 8
    },
    "settings": { ... }
  }
}
```

## Performance-Optimierungen

1. **Piece Culling**: Nur sichtbare Teile rendern
2. **Dirty Rectangle**: Nur geänderte Bereiche neu zeichnen
3. **Image Caching**: Puzzle-Teile als ImageData cachen
4. **Spatial Hashing**: Schnelle Kollisionserkennung
5. **RequestAnimationFrame**: Smooth Rendering
6. **Web Workers**: Puzzle-Generierung im Hintergrund (optional)

## Responsive Design

- Desktop: Großer Canvas, Maus-Steuerung
- Tablet: Mittelgroßer Canvas, Touch-Steuerung
- Mobile: Kompakter Canvas, Touch-Optimierung
- Breakpoints: 1200px, 768px, 480px

## Browser-Kompatibilität

- Chrome/Edge: Vollständig unterstützt
- Firefox: Vollständig unterstützt
- Safari: Vollständig unterstützt
- Mobile Browser: Touch-Events erforderlich

# Breakout Game - Technical Specifications

## 1. Game Constants & Configuration

### 1.1 Canvas & Display
```javascript
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ASPECT_RATIO = 4/3;
const MIN_CANVAS_WIDTH = 320;
const MAX_CANVAS_WIDTH = 1200;
```

### 1.2 Ball Physics
```javascript
const BALL = {
  RADIUS: 8,
  INITIAL_SPEED: 5,
  MAX_SPEED: 12,
  SPEED_INCREMENT: 0.5, // per level
  TRAIL_LENGTH: 5,
  COLOR: '#FFFFFF'
};
```

### 1.3 Paddle Properties
```javascript
const PADDLE = {
  WIDTH: 100,
  HEIGHT: 15,
  SPEED: 8,
  Y_OFFSET: 30, // from bottom
  COLOR: '#4CAF50',
  WIDE_MULTIPLIER: 2.0,
  NARROW_MULTIPLIER: 0.5
};
```

### 1.4 Block Properties
```javascript
const BLOCK = {
  WIDTH: 60,
  HEIGHT: 20,
  PADDING: 4,
  OFFSET_X: 35,
  OFFSET_Y: 60,
  COLS: 12,
  ROWS: 10,

  TYPES: {
    STANDARD: {
      health: 1,
      points: 10,
      color: '#2196F3'
    },
    HARD: {
      health: 3,
      points: 50,
      color: '#FF5722'
    },
    UNBREAKABLE: {
      health: Infinity,
      points: 0,
      color: '#9E9E9E'
    },
    EXPLOSIVE: {
      health: 1,
      points: 100,
      color: '#FF9800',
      explosionRadius: 1 // blocks
    },
    MOVING: {
      health: 1,
      points: 30,
      color: '#00BCD4',
      speed: 2
    },
    INVISIBLE: {
      health: 1,
      points: 50,
      color: 'rgba(255,255,255,0.1)',
      revealDistance: 100
    },
    REGENERATING: {
      health: 1,
      points: 20,
      color: '#4CAF50',
      regenerateTime: 10000 // ms
    },
    MULTI_HIT: {
      health: 5,
      points: 100,
      color: '#E91E63'
    }
  }
};
```

### 1.5 Powerup Configuration
```javascript
const POWERUP = {
  WIDTH: 30,
  HEIGHT: 30,
  FALL_SPEED: 3,
  DROP_CHANCE: 0.2, // 20%

  TYPES: {
    MULTI_BALL: {
      duration: -1, // permanent until balls lost
      color: '#2196F3',
      icon: '●●',
      ballCount: 3
    },
    WIDE_PADDLE: {
      duration: 20000, // ms
      color: '#4CAF50',
      icon: '↔'
    },
    NARROW_PADDLE: {
      duration: 15000,
      color: '#F44336',
      icon: '↔',
      pointsMultiplier: 2
    },
    EXTRA_LIFE: {
      duration: 0, // instant
      color: '#E91E63',
      icon: '❤'
    },
    SCORE_MULTIPLIER: {
      duration: 15000,
      color: '#FFD700',
      icon: '⭐',
      multipliers: [2, 3, 5] // random
    },
    SLOW_MOTION: {
      duration: 10000,
      color: '#00BCD4',
      icon: '⏱',
      speedMultiplier: 0.5
    },
    STICKY_PADDLE: {
      duration: 30000,
      color: '#9C27B0',
      icon: '🎯'
    },
    LASER: {
      duration: -1, // shot-based
      color: '#FF5722',
      icon: '🔫',
      shots: 10,
      damage: 1
    },
    FIREBALL: {
      duration: 15000,
      color: '#FF6F00',
      icon: '🔥'
    },
    MAGNET: {
      duration: 20000,
      color: '#757575',
      icon: '🧲',
      attractionForce: 0.3
    },
    SHIELD: {
      duration: -1, // one use
      color: '#00E5FF',
      icon: '🛡'
    }
  }
};
```

### 1.6 Game Settings
```javascript
const GAME = {
  FPS: 60,
  INITIAL_LIVES: 3,
  MAX_LIVES: 10,

  DIFFICULTY: {
    EASY: {
      ballSpeedMultiplier: 0.8,
      paddleWidthMultiplier: 1.2,
      lives: 5
    },
    NORMAL: {
      ballSpeedMultiplier: 1.0,
      paddleWidthMultiplier: 1.0,
      lives: 3
    },
    HARD: {
      ballSpeedMultiplier: 1.3,
      paddleWidthMultiplier: 0.8,
      lives: 2
    },
    EXPERT: {
      ballSpeedMultiplier: 1.5,
      paddleWidthMultiplier: 0.6,
      lives: 1
    }
  },

  COMBO: {
    TIMEOUT: 2000, // ms
    MULTIPLIERS: [1, 2, 3, 5, 10]
  }
};
```

### 1.7 Particle System
```javascript
const PARTICLES = {
  POOL_SIZE: 100,
  LIFETIME: 1000, // ms
  MIN_SIZE: 2,
  MAX_SIZE: 6,
  MIN_SPEED: 1,
  MAX_SPEED: 4,
  GRAVITY: 0.1,
  FRICTION: 0.98
};
```

### 1.8 Level Editor
```javascript
const EDITOR = {
  GRID: {
    COLS: 12,
    ROWS: 15,
    CELL_WIDTH: 60,
    CELL_HEIGHT: 20
  },
  MAX_CUSTOM_LEVELS: 50,
  UNDO_STACK_SIZE: 10
};
```

## 2. Data Structures

### 2.1 Level JSON Schema
```json
{
  "id": "string | number",
  "name": "string",
  "difficulty": "easy | medium | hard | expert",
  "description": "string",
  "author": "string",
  "background": "string",
  "ballSpeed": "number",
  "blocks": [
    {
      "x": "number (grid column)",
      "y": "number (grid row)",
      "type": "string",
      "health": "number (optional, overrides default)",
      "points": "number (optional, overrides default)"
    }
  ],
  "metadata": {
    "stars": "number (0-3)",
    "highScore": "number",
    "completed": "boolean",
    "perfectRun": "boolean"
  }
}
```

### 2.2 Save Data Schema
```json
{
  "version": "1.0.0",
  "progress": {
    "currentLevel": "number",
    "unlockedLevels": ["number[]"],
    "levelScores": {
      "levelId": {
        "highScore": "number",
        "stars": "number",
        "completed": "boolean",
        "perfectRun": "boolean"
      }
    }
  },
  "settings": {
    "difficulty": "string",
    "backgroundType": "string",
    "backgroundSettings": {},
    "soundEnabled": "boolean",
    "musicEnabled": "boolean",
    "masterVolume": "number (0-1)",
    "sfxVolume": "number (0-1)",
    "musicVolume": "number (0-1)",
    "particleQuality": "low | medium | high",
    "screenShake": "boolean"
  },
  "statistics": {
    "gamesPlayed": "number",
    "blocksDestroyed": "number",
    "powerupsCollected": "number",
    "totalScore": "number",
    "totalPlayTime": "number (ms)",
    "bestCombo": "number",
    "totalLives Lost": "number"
  },
  "achievements": [
    {
      "id": "string",
      "unlockedAt": "timestamp",
      "progress": "number (optional)"
    }
  ],
  "customLevels": ["Level[]"],
  "highScores": [
    {
      "score": "number",
      "level": "number",
      "date": "timestamp",
      "playerName": "string"
    }
  ]
}
```

### 2.3 Achievement Definition
```javascript
const ACHIEVEMENTS = [
  {
    id: 'first_break',
    name: 'First Break',
    description: 'Destroy your first block',
    icon: '🎯',
    checkCondition: (stats) => stats.blocksDestroyed >= 1
  },
  {
    id: 'level_master',
    name: 'Level Master',
    description: 'Complete all 30 pre-made levels',
    icon: '🏆',
    checkCondition: (progress) => progress.completedLevels.length >= 30
  },
  // ... more achievements
];
```

## 3. Collision Detection Algorithms

### 3.1 AABB (Axis-Aligned Bounding Box)
```javascript
function checkAABB(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}
```

### 3.2 Circle-Rectangle Collision
```javascript
function circleRectCollision(circle, rect) {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate distance
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  return distanceSquared < (circle.radius * circle.radius);
}
```

### 3.3 Ball-Paddle Angle Calculation
```javascript
function calculateBounceAngle(ballX, paddleX, paddleWidth) {
  // Hit position relative to paddle center (-1 to 1)
  const relativeIntersectX = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);

  // Maximum bounce angle (75 degrees)
  const maxBounceAngle = Math.PI * 75 / 180;

  // Calculate bounce angle
  const bounceAngle = relativeIntersectX * maxBounceAngle;

  return bounceAngle;
}
```

### 3.4 Block Collision Direction
```javascript
function getCollisionSide(ball, block) {
  const ballCenterX = ball.x + ball.radius;
  const ballCenterY = ball.y + ball.radius;

  const blockCenterX = block.x + block.width / 2;
  const blockCenterY = block.y + block.height / 2;

  const dx = ballCenterX - blockCenterX;
  const dy = ballCenterY - blockCenterY;

  const width = (block.width + ball.radius * 2) / 2;
  const height = (block.height + ball.radius * 2) / 2;

  const crossWidth = width * dy;
  const crossHeight = height * dx;

  if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
    if (crossWidth > crossHeight) {
      return crossWidth > -crossHeight ? 'bottom' : 'left';
    } else {
      return crossWidth > -crossHeight ? 'right' : 'top';
    }
  }
  return null;
}
```

## 4. Performance Optimization Techniques

### 4.1 Spatial Partitioning (Grid)
```javascript
class CollisionGrid {
  constructor(width, height, cellSize) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill().map(() => []));
  }

  insert(object) {
    const cell = this.getCell(object.x, object.y);
    this.grid[cell.row][cell.col].push(object);
  }

  getNearby(x, y, radius) {
    // Return objects in nearby cells
  }
}
```

### 4.2 Object Pooling
```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 50) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createFn();
  }

  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}
```

### 4.3 Render Optimization
```javascript
// Only render visible objects
function renderVisible(objects, camera) {
  objects.forEach(obj => {
    if (isInView(obj, camera)) {
      obj.render();
    }
  });
}

// Batch similar draw calls
function batchRender(blocks) {
  const batches = {};

  blocks.forEach(block => {
    if (!batches[block.color]) {
      batches[block.color] = [];
    }
    batches[block.color].push(block);
  });

  Object.entries(batches).forEach(([color, blocks]) => {
    ctx.fillStyle = color;
    blocks.forEach(block => {
      ctx.fillRect(block.x, block.y, block.width, block.height);
    });
  });
}
```

## 5. State Machine

### 5.1 Game States
```javascript
const GameState = {
  LOADING: 'loading',
  MAIN_MENU: 'mainMenu',
  LEVEL_SELECT: 'levelSelect',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'levelComplete',
  GAME_OVER: 'gameOver',
  SETTINGS: 'settings',
  ACHIEVEMENTS: 'achievements',
  HIGH_SCORES: 'highScores',
  LEVEL_EDITOR: 'levelEditor',
  HOW_TO_PLAY: 'howToPlay'
};
```

### 5.2 State Transitions
```javascript
class GameStateMachine {
  constructor() {
    this.currentState = GameState.LOADING;
    this.previousState = null;
    this.states = new Map();
  }

  addState(name, state) {
    this.states.set(name, state);
  }

  changeState(newState) {
    const current = this.states.get(this.currentState);
    if (current && current.exit) {
      current.exit();
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    const next = this.states.get(newState);
    if (next && next.enter) {
      next.enter();
    }
  }

  update(deltaTime) {
    const state = this.states.get(this.currentState);
    if (state && state.update) {
      state.update(deltaTime);
    }
  }

  render(ctx) {
    const state = this.states.get(this.currentState);
    if (state && state.render) {
      state.render(ctx);
    }
  }
}
```

## 6. Input Handling

### 6.1 Input Manager
```javascript
class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };
    this.touch = { x: 0, y: 0, active: false };

    this.setupListeners();
  }

  setupListeners() {
    // Keyboard
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);

    // Mouse
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    // Touch
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.touch.x = touch.clientX - rect.left;
      this.touch.y = touch.clientY - rect.top;
      this.touch.active = true;
    });
  }

  isKeyDown(key) {
    return this.keys[key] || false;
  }
}
```

## 7. Animation & Tweening

### 7.1 Easing Functions
```javascript
const Easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
};
```

### 7.2 Tween System
```javascript
class Tween {
  constructor(object, property, target, duration, easing = Easing.linear) {
    this.object = object;
    this.property = property;
    this.start = object[property];
    this.target = target;
    this.duration = duration;
    this.easing = easing;
    this.elapsed = 0;
    this.completed = false;
  }

  update(deltaTime) {
    if (this.completed) return;

    this.elapsed += deltaTime;
    const t = Math.min(this.elapsed / this.duration, 1);
    const easedT = this.easing(t);

    this.object[this.property] = this.start + (this.target - this.start) * easedT;

    if (t >= 1) {
      this.completed = true;
    }
  }
}
```

## 8. Color Schemes

### 8.1 Default Palette
```javascript
const COLORS = {
  PRIMARY: '#2196F3',
  SECONDARY: '#FF5722',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  DANGER: '#F44336',
  INFO: '#00BCD4',
  LIGHT: '#ECEFF1',
  DARK: '#263238',

  BLOCKS: {
    STANDARD: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39'],
    HARD: '#FF5722',
    UNBREAKABLE: '#9E9E9E',
    EXPLOSIVE: '#FF9800',
    MOVING: '#00BCD4',
    INVISIBLE: 'rgba(255,255,255,0.1)',
    REGENERATING: '#4CAF50',
    MULTI_HIT: '#E91E63'
  }
};
```

## 9. API Reference

### 9.1 Core Classes

#### Ball
- `constructor(x, y, radius, speed)`
- `update(deltaTime)`: Updates position and velocity
- `render(ctx)`: Draws ball to canvas
- `reset()`: Returns to starting position
- `setVelocity(dx, dy)`: Sets velocity vector
- `setSpeed(speed)`: Sets speed magnitude

#### Paddle
- `constructor(x, y, width, height)`
- `update(input, deltaTime)`: Updates position based on input
- `render(ctx)`: Draws paddle
- `moveLeft(speed)`: Moves paddle left
- `moveRight(speed)`: Moves paddle right
- `setWidth(width)`: Changes paddle width
- `shoot()`: Fires laser (if powerup active)

#### Block
- `constructor(x, y, type, health, points)`
- `hit(damage)`: Reduces health
- `update(deltaTime)`: Updates block state
- `render(ctx)`: Draws block
- `destroy()`: Triggers destruction
- `isDestroyed()`: Returns boolean

#### Powerup
- `constructor(x, y, type)`
- `update(deltaTime)`: Updates position
- `render(ctx)`: Draws powerup
- `activate(game)`: Applies effect
- `deactivate(game)`: Removes effect

## 10. Browser Storage Keys

```javascript
const STORAGE_KEYS = {
  SAVE_DATA: 'breakout_save_v1',
  SETTINGS: 'breakout_settings_v1',
  HIGH_SCORES: 'breakout_highscores_v1',
  CUSTOM_LEVELS: 'breakout_custom_levels_v1',
  STATISTICS: 'breakout_stats_v1',
  ACHIEVEMENTS: 'breakout_achievements_v1'
};
```

## 11. Testing Checklist

### Functional Testing
- [ ] Ball bounces correctly off all surfaces
- [ ] Paddle responds to all input methods
- [ ] All block types behave as expected
- [ ] All powerups work correctly
- [ ] Collisions are accurate
- [ ] Score calculation is correct
- [ ] Lives system works
- [ ] Level progression works
- [ ] Save/load functions properly
- [ ] Level editor creates valid levels

### Performance Testing
- [ ] 60 FPS maintained with 100+ blocks
- [ ] No memory leaks after 30 minutes
- [ ] Particle system performs well
- [ ] Mobile devices run smoothly
- [ ] No frame drops during intense scenes

### Cross-browser Testing
- [ ] Chrome (desktop & mobile)
- [ ] Firefox (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Edge

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Text is readable
- [ ] Color contrast is sufficient
- [ ] Touch targets are large enough (44×44px min)

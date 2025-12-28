// State
let timerInterval = null;
let timeLeft = 25 * 60; // seconds
let totalTime = 25 * 60;
let isRunning = false;
let currentMode = 'work';
let audioContext = null; // Reusable AudioContext to prevent memory leaks

// Settings
let settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStart: false,
    soundEnabled: true,
    pomodorosToday: 0,
    pomodorosTotal: 0,
    lastDate: new Date().toDateString()
};

// DOM Elements
let timeLeftEl;
let modeLabelEl;
let startBtn;
let pauseBtn;
let resetBtn;
let modeButtons;
let progressCircle;
let pomodorsTodayEl;
let pomodorsTotalEl;

// Settings inputs
let workDurationInput;
let shortBreakInput;
let longBreakInput;
let autoStartInput;
let soundEnabledInput;

// Load Settings
function loadSettings() {
    try {
        const stored = localStorage.getItem('pomodoro-settings');
        if (stored) {
            settings = { ...settings, ...JSON.parse(stored) };

            // Reset daily counter if new day
            if (settings.lastDate !== new Date().toDateString()) {
                settings.pomodorosToday = 0;
                settings.lastDate = new Date().toDateString();
            }

            workDurationInput.value = settings.workDuration;
            shortBreakInput.value = settings.shortBreakDuration;
            longBreakInput.value = settings.longBreakDuration;
            autoStartInput.checked = settings.autoStart;
            soundEnabledInput.checked = settings.soundEnabled;

            updateStats();
        }
    } catch (error) {
        console.error('localStorage read error:', error);
        // Fallback auf Default-Settings (bereits initialisiert)
    }
}

// Save Settings
function saveSettings() {
    try {
        localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
    } catch (error) {
        console.error('localStorage write error:', error);
        // Settings werden nicht persistiert, aber App funktioniert weiter
    }
}

// Update Stats
function updateStats() {
    pomodorsTodayEl.textContent = settings.pomodorosToday;
    pomodorsTotalEl.textContent = settings.pomodorosTotal;
}

// Set Mode
function setMode(mode) {
    currentMode = mode;

    modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    switch (mode) {
        case 'work':
            totalTime = timeLeft = settings.workDuration * 60;
            modeLabelEl.textContent = 'Arbeitszeit';
            progressCircle.style.stroke = '#667eea';
            break;
        case 'short':
            totalTime = timeLeft = settings.shortBreakDuration * 60;
            modeLabelEl.textContent = 'Kurze Pause';
            progressCircle.style.stroke = '#4caf50';
            break;
        case 'long':
            totalTime = timeLeft = settings.longBreakDuration * 60;
            modeLabelEl.textContent = 'Lange Pause';
            progressCircle.style.stroke = '#ff9800';
            break;
    }

    updateDisplay();
    updateProgress();
}

// Update Display
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeLeftEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Update title
    document.title = `${timeLeftEl.textContent} - Pomodoro Timer`;
}

// Update Progress Circle
function updateProgress() {
    const circumference = 2 * Math.PI * 140;
    const progress = timeLeft / totalTime;
    const offset = circumference * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;
}

// Start Timer
function startTimer() {
    if (isRunning) return;

    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        updateProgress();

        if (timeLeft <= 0) {
            timerComplete();
        }
    }, 1000);
}

// Pause Timer
function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Reset Timer
function resetTimer() {
    pauseTimer();
    setMode(currentMode);
}

// Timer Complete
function timerComplete() {
    pauseTimer();

    // Update stats if work session completed
    if (currentMode === 'work') {
        settings.pomodorosToday++;
        settings.pomodorosTotal++;
        saveSettings();
        updateStats();
    }

    // Play sound
    if (settings.soundEnabled) {
        playSound();
    }

    // Show notification
    showNotification();

    // Auto-start next session
    if (settings.autoStart) {
        setTimeout(() => {
            if (currentMode === 'work') {
                // After 4 pomodoros, take long break
                if (settings.pomodorosToday % 4 === 0) {
                    setMode('long');
                } else {
                    setMode('short');
                }
            } else {
                setMode('work');
            }
            startTimer();
        }, 3000);
    } else {
        // Just switch mode, don't auto-start
        if (currentMode === 'work') {
            if (settings.pomodorosToday % 4 === 0) {
                setMode('long');
            } else {
                setMode('short');
            }
        } else {
            setMode('work');
        }
    }
}

// Play Sound
function playSound() {
    // Create AudioContext once and reuse it to prevent memory leaks
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create simple beep using Web Audio API
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Show Notification
function showNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
            body: currentMode === 'work' ? 'Arbeitszeit beendet! Zeit für eine Pause.' : 'Pause beendet! Zurück an die Arbeit.',
            icon: '⏱️'
        });
    } else {
        alert(currentMode === 'work' ? 'Arbeitszeit beendet! Zeit für eine Pause.' : 'Pause beendet! Zurück an die Arbeit.');
    }
}

// Request Notification Permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Initialize Application
function init() {
    // Get DOM Elements
    timeLeftEl = document.getElementById('time-left');
    modeLabelEl = document.getElementById('mode-label');
    startBtn = document.getElementById('start-btn');
    pauseBtn = document.getElementById('pause-btn');
    resetBtn = document.getElementById('reset-btn');
    modeButtons = document.querySelectorAll('.mode-btn');
    progressCircle = document.getElementById('progress-ring-circle');
    pomodorsTodayEl = document.getElementById('pomodoros-today');
    pomodorsTotalEl = document.getElementById('pomodoros-total');
    workDurationInput = document.getElementById('work-duration');
    shortBreakInput = document.getElementById('short-break-duration');
    longBreakInput = document.getElementById('long-break-duration');
    autoStartInput = document.getElementById('auto-start');
    soundEnabledInput = document.getElementById('sound-enabled');

    // Event Listeners
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!isRunning) {
                setMode(btn.dataset.mode);
            }
        });
    });

    // Settings listeners
    workDurationInput.addEventListener('change', (e) => {
        settings.workDuration = parseInt(e.target.value);
        saveSettings();
        if (currentMode === 'work' && !isRunning) {
            setMode('work');
        }
    });

    shortBreakInput.addEventListener('change', (e) => {
        settings.shortBreakDuration = parseInt(e.target.value);
        saveSettings();
        if (currentMode === 'short' && !isRunning) {
            setMode('short');
        }
    });

    longBreakInput.addEventListener('change', (e) => {
        settings.longBreakDuration = parseInt(e.target.value);
        saveSettings();
        if (currentMode === 'long' && !isRunning) {
            setMode('long');
        }
    });

    autoStartInput.addEventListener('change', (e) => {
        settings.autoStart = e.target.checked;
        saveSettings();
    });

    soundEnabledInput.addEventListener('change', (e) => {
        settings.soundEnabled = e.target.checked;
        saveSettings();
    });

    // Initialize application
    loadSettings();
    setMode('work');
    requestNotificationPermission();
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);

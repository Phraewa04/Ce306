// ==========================================
// CONSTANTS & CONFIG
// ==========================================
const LANE_POSITIONS = {
  0: 'left-0',
  1: 'left-1/3',
  2: 'left-2/3'
};

const OBSTACLE_ICONS = ['📦', '🪨', '🌵', '🗑️'];

const DIFFICULTY_CONFIG = {
  easy: { goal: 600, baseSpeed: 3, spawnInterval: 50 },
  medium: { goal: 1000, baseSpeed: 4, spawnInterval: 40 },
  hard: { goal: 1500, baseSpeed: 5, spawnInterval: 30 }
};

// DOM Elements
const playerCat = document.getElementById('player-cat');
const objectsContainer = document.getElementById('objects-container');
const hpDisplay = document.getElementById('hp-display');
const distDisplay = document.getElementById('dist-display');
const speedDisplay = document.getElementById('speed-display');
const statusMessage = document.getElementById('status-message');
const btnRestart = document.getElementById('btn-restart');
const btnRules = document.getElementById('btn-rules');
const btnTheme = document.getElementById('btn-theme');
const rulesModal = document.getElementById('rules-modal');
const levelForm = document.getElementById('level-form');

// Game State
let currentLane = 1; 
let hp = 3;
let distance = 0;
let baseSpeed = 3;
let currentSpeedMultiplier = 1;
let isGameOver = false;
let gameLoopId = null;
let frameCount = 0;
let activeObjects = []; 
let nextPotionDistance = 300; 

// Performance Optimization: ล็อก Frame Rate ไว้ที่ 60 FPS
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

// ==========================================
// GAME INIT & RESET
// ==========================================
function initGame() {
  // 1. เคลียร์ Loop เก่าทิ้งทันที ป้องกันอาการลูปซ้อนค้าง
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }

  const selectedDiff = levelForm.querySelector('input[name="difficulty"]:checked').value;
  const config = DIFFICULTY_CONFIG[selectedDiff];

  currentLane = 1;
  hp = 3;
  distance = 0;
  baseSpeed = config.baseSpeed;
  currentSpeedMultiplier = 1;
  isGameOver = false;
  frameCount = 0;
  activeObjects = [];
  nextPotionDistance = 300;
  lastTime = performance.now();

  playerCat.textContent = '🐱';
  objectsContainer.innerHTML = '';
  updatePlayerPosition();
  updateUI('เกมเริ่มแล้ว! กด ⬅️ ➡️ หรือ A D เพื่อหลบสิ่งของ');

  // เริ่มต้น Loop ใหม่
  gameLoopId = requestAnimationFrame(gameLoop);
}

// ==========================================
// GAME LOOP (OPTIMIZED)
// ==========================================
function gameLoop(timestamp) {
  if (isGameOver) return;

  gameLoopId = requestAnimationFrame(gameLoop);

  // ควบคุมการทำงานให้เสถียรที่ 60 FPS ในทุกหน้าจอ
  const elapsed = timestamp - lastTime;
  if (elapsed < frameInterval) return;
  lastTime = timestamp - (elapsed % frameInterval);

  frameCount++;
  const selectedDiff = levelForm.querySelector('input[name="difficulty"]:checked').value;
  const config = DIFFICULTY_CONFIG[selectedDiff];

  // 1. เพิ่มระยะทาง
  distance += 1;

  // 2. ปรับความเร็วตามระยะทาง
  currentSpeedMultiplier = 1 + Math.floor(distance / 100) * 0.15;
  const currentSpeed = baseSpeed * currentSpeedMultiplier;

  // 3. สปอว์นสิ่งของ
  const currentSpawnRate = Math.max(18, Math.floor(config.spawnInterval / currentSpeedMultiplier));
  if (frameCount % currentSpawnRate === 0) {
    spawnObstacle();
  }

  // 4. สปอว์นขวดยาเมื่อถึงระยะทางทุกๆ 300 เมตร
  if (distance >= nextPotionDistance) {
    spawnPotion();
    nextPotionDistance += 300;
  }

  // 5. อัปเดตตำแหน่งสิ่งของและเช็คการชน
  updateObjects(currentSpeed);

  // 6. เช็คเงื่อนไขชนะ
  if (distance >= config.goal) {
    isGameOver = true;
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    updateUI(`🎉 ยินดีด้วย! คุณพาแมววิ่งพิชิตระยะทาง ${config.goal}m สำเร็จแล้ว!`);
    return;
  }

  updateUI();
}

// ==========================================
// OBJECT SPAWNING & MOVEMENT
// ==========================================
function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const icon = OBSTACLE_ICONS[Math.floor(Math.random() * OBSTACLE_ICONS.length)];

  const el = document.createElement('div');
  el.className = `absolute top-0 text-2xl flex justify-center items-center w-1/3 ${LANE_POSITIONS[lane]}`;
  el.textContent = icon;
  objectsContainer.appendChild(el);

  activeObjects.push({ el, lane, y: 0, type: 'obstacle' });
}

function spawnPotion() {
  const lane = Math.floor(Math.random() * 3);

  const el = document.createElement('div');
  el.className = `absolute top-0 text-2xl flex justify-center items-center w-1/3 ${LANE_POSITIONS[lane]}`;
  el.textContent = '🧪';
  objectsContainer.appendChild(el);

  activeObjects.push({ el, lane, y: 0, type: 'potion' });
}

function updateObjects(speed) {
  for (let i = activeObjects.length - 1; i >= 0; i--) {
    const obj = activeObjects[i];
    obj.y += speed;
    obj.el.style.transform = `translateY(${obj.y}px)`;

    // เช็คการชนกับตัวแมว
    if (obj.y >= 240 && obj.y <= 280 && obj.lane === currentLane) {
      if (obj.type === 'obstacle') {
        hp--;
        updateUI('💥 ชนสิ่งของ! HP ลดลง -1');
        if (hp <= 0) {
          isGameOver = true;
          playerCat.textContent = '😿';
          if (gameLoopId) cancelAnimationFrame(gameLoopId);
          updateUI('💀 แพ้แล้ว! ชนสิ่งของครบ 3 ครั้ง กดเริ่มใหม่เพื่อลองอีกครั้ง');
        }
      } else if (obj.type === 'potion') {
        hp = Math.min(3, hp + 1);
        updateUI('✨ ได้รับขวดยา! ฟื้นฟูพลังชีวิต (+1 HP)');
      }

      obj.el.remove();
      activeObjects.splice(i, 1);
      continue;
    }

    // ลบวัตถุที่เลยขอบล่างหน้าจอ ป้องกัน DOM สะสมจนเครื่องค้าง
    if (obj.y > 330) {
      obj.el.remove();
      activeObjects.splice(i, 1);
    }
  }
}

// ==========================================
// CONTROLS & UI UPDATES
// ==========================================
function updatePlayerPosition() {
  playerCat.className = `absolute bottom-3 text-3xl transition-all duration-100 motion-reduce:transition-none flex justify-center items-center w-1/3 ${LANE_POSITIONS[currentLane]}`;
}

function moveLane(direction) {
  if (isGameOver) return;
  if (direction === 'left' && currentLane > 0) currentLane--;
  if (direction === 'right' && currentLane < 2) currentLane++;
  updatePlayerPosition();
}

function updateUI(customMessage) {
  hpDisplay.textContent = '❤️ '.repeat(Math.max(0, hp));
  distDisplay.textContent = `${distance} m`;
  speedDisplay.textContent = `${currentSpeedMultiplier.toFixed(1)}x`;

  if (customMessage) {
    statusMessage.textContent = customMessage;
  }
}

// Listeners ปุ่มคีย์บอร์ด
window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'KeyA'].includes(e.code)) moveLane('left');
  if (['ArrowRight', 'KeyD'].includes(e.code)) moveLane('right');
});

levelForm.addEventListener('change', initGame);
btnRestart.addEventListener('click', initGame);
btnRules.addEventListener('click', () => rulesModal.showModal());
btnTheme.addEventListener('click', () => document.documentElement.classList.toggle('dark'));

// เริ่มเกมครั้งแรก
initGame();
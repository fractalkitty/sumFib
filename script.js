// @ts-check
// sumFib — vanilla HTML/CSS/JS, no dependencies.
// Tiles slide via CSS transitions on transform; game logic is direction-symmetric
// (one merge per tile per move), and accessibility is wired through ARIA live regions.

const ROWS = 5;
const COLS = 3;
const SLIDE_MS = 140;     // must match --slide in CSS
const SPAWN_WEIGHTS = [1, 1, 1, 2]; // 75% chance of 1, 25% chance of 2
const SWIPE_THRESHOLD = 24;

const $ = /** @type {<T extends HTMLElement>(id: string) => T} */ (id => /** @type {any} */ (document.getElementById(id)));
const board = $('board');
const scoreEl = $('score');
const bestEl = $('best');
const statusEl = $('status');
const finalScoreEl = $('final-score');
const finalBestEl = $('final-best');
const dialog = /** @type {HTMLDialogElement} */ ($('gameover'));
const newGameBtn = $('newgame');

/** @typedef {{ id: number, value: number }} Tile */

/** @type {(Tile|null)[][]} */
let grid;
/** @type {Map<number, HTMLElement>} */
const tileEls = new Map();
let nextId = 1;
let score = 0;
let best = Number(localStorage.getItem('sumfib.best')) || 0;
let busy = false;
let gameOver = false;

function isFib(/** @type {number} */ n) {
  if (n < 2) return false;
  let a = 1, b = 1;
  while (b < n) { const t = a + b; a = b; b = t; }
  return b === n;
}

function emptyCells() {
  /** @type {[number, number][]} */
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!grid[r][c]) out.push([r, c]);
  return out;
}

function init() {
  // First-time: paint the empty-cell backgrounds.
  if (!board.querySelector('.cell')) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < ROWS * COLS; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      frag.appendChild(cell);
    }
    board.appendChild(frag);
  }

  for (const el of tileEls.values()) el.remove();
  tileEls.clear();
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  score = 0;
  gameOver = false;
  busy = false;
  renderScore();
  if (dialog.open) dialog.close();
  spawn();
  spawn();
}

function spawn() {
  const cells = emptyCells();
  if (cells.length === 0) return;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  const value = SPAWN_WEIGHTS[Math.floor(Math.random() * SPAWN_WEIGHTS.length)];
  const id = nextId++;
  const tile = { id, value };
  grid[r][c] = tile;

  const el = document.createElement('div');
  el.className = 'tile appear';
  el.dataset.value = String(value);
  el.dataset.digits = String(String(value).length);
  el.style.setProperty('--r', String(r));
  el.style.setProperty('--c', String(c));

  const inner = document.createElement('div');
  inner.className = 'tile-inner';
  inner.setAttribute('role', 'gridcell');
  inner.setAttribute('aria-label', tileLabel(value, r, c));
  inner.textContent = String(value);
  el.appendChild(inner);

  board.appendChild(el);
  tileEls.set(id, el);

  // Two rAFs so the browser commits the `appear` (scale 0) state before transitioning to scale 1.
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('appear')));
}

function tileLabel(value, r, c) {
  return `Tile ${value}, row ${r + 1}, column ${c + 1}`;
}

function renderScore() {
  scoreEl.textContent = String(score);
  bestEl.textContent = String(best);
}

function bumpScore() {
  scoreEl.classList.remove('bump');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('bump');
  setTimeout(() => scoreEl.classList.remove('bump'), 400);
}

function announce(/** @type {string} */ msg) {
  statusEl.textContent = msg;
}

/**
 * @param {number} dr
 * @param {number} dc
 * @returns {[number, number][][]}
 */
function buildLines(dr, dc) {
  const lines = [];
  if (dc !== 0) {
    for (let r = 0; r < ROWS; r++) {
      const line = [];
      if (dc === -1) for (let c = 0; c < COLS; c++) line.push(/** @type {[number, number]} */ ([r, c]));
      else for (let c = COLS - 1; c >= 0; c--) line.push(/** @type {[number, number]} */ ([r, c]));
      lines.push(line);
    }
  } else {
    for (let c = 0; c < COLS; c++) {
      const line = [];
      if (dr === -1) for (let r = 0; r < ROWS; r++) line.push(/** @type {[number, number]} */ ([r, c]));
      else for (let r = ROWS - 1; r >= 0; r--) line.push(/** @type {[number, number]} */ ([r, c]));
      lines.push(line);
    }
  }
  return lines;
}

/**
 * @param {number} dr -1=up, 1=down, 0=horizontal
 * @param {number} dc -1=left, 1=right, 0=vertical
 */
function move(dr, dc) {
  if (busy || gameOver) return;

  const lines = buildLines(dr, dc);
  /** @type {(Tile|null)[][]} */
  const newGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  /** @type {{ absorbed: Tile, into: Tile, newValue: number, r: number, c: number }[]} */
  const merges = [];
  let moved = false;
  let gain = 0;

  for (const line of lines) {
    /** @type {Tile[]} */
    const present = [];
    for (const [r, c] of line) {
      const t = grid[r][c];
      if (t) present.push(t);
    }

    /** @type {{ tile: Tile, newValue?: number, absorbed?: Tile }[]} */
    const slots = [];
    for (let i = 0; i < present.length; ) {
      const cur = present[i];
      const next = present[i + 1];
      if (next && isFib(cur.value + next.value)) {
        slots.push({ tile: cur, newValue: cur.value + next.value, absorbed: next });
        gain += cur.value + next.value;
        i += 2;
      } else {
        slots.push({ tile: cur });
        i += 1;
      }
    }

    for (let k = 0; k < slots.length; k++) {
      const [r, c] = line[k];
      const slot = slots[k];
      newGrid[r][c] = slot.tile;
      const el = tileEls.get(slot.tile.id);
      if (!el) continue;
      const prevR = Number(el.style.getPropertyValue('--r'));
      const prevC = Number(el.style.getPropertyValue('--c'));
      if (prevR !== r || prevC !== c) moved = true;
      el.style.setProperty('--r', String(r));
      el.style.setProperty('--c', String(c));

      if (slot.absorbed && slot.newValue) {
        moved = true;
        const absEl = tileEls.get(slot.absorbed.id);
        if (absEl) {
          absEl.style.setProperty('--r', String(r));
          absEl.style.setProperty('--c', String(c));
          absEl.classList.add('absorbing');
        }
        merges.push({ absorbed: slot.absorbed, into: slot.tile, newValue: slot.newValue, r, c });
      }
    }
  }

  if (!moved) return;

  busy = true;
  grid = newGrid;
  if (gain > 0) {
    score += gain;
    if (score > best) {
      best = score;
      localStorage.setItem('sumfib.best', String(best));
    }
    renderScore();
    bumpScore();
    announce(`Combined for ${gain}. Score ${score}.`);
  }

  window.setTimeout(() => {
    for (const m of merges) {
      const absEl = tileEls.get(m.absorbed.id);
      absEl?.remove();
      tileEls.delete(m.absorbed.id);

      m.into.value = m.newValue;
      const intoEl = tileEls.get(m.into.id);
      if (intoEl) {
        intoEl.dataset.value = String(m.newValue);
        intoEl.dataset.digits = String(String(m.newValue).length);
        const inner = intoEl.querySelector('.tile-inner');
        if (inner) {
          inner.textContent = String(m.newValue);
          inner.setAttribute('aria-label', tileLabel(m.newValue, m.r, m.c));
        }
        intoEl.classList.remove('pop');
        void intoEl.offsetWidth;
        intoEl.classList.add('pop');
      }
    }
    spawn();
    busy = false;
    if (!hasMoves()) endGame();
  }, SLIDE_MS);
}

function hasMoves() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      if (!t) return true;
      const right = c + 1 < COLS ? grid[r][c + 1] : null;
      const down = r + 1 < ROWS ? grid[r + 1][c] : null;
      if (right && isFib(t.value + right.value)) return true;
      if (down && isFib(t.value + down.value)) return true;
    }
  }
  return false;
}

function endGame() {
  gameOver = true;
  announce(`Game over. Final score ${score}.`);
  finalScoreEl.textContent = String(score);
  finalBestEl.textContent = String(best);
  // Slight delay so the last merge animation finishes first.
  setTimeout(() => dialog.showModal(), 320);
}

// ===== Input =====

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (dialog.open) return; // dialog has its own focus + ESC
  switch (e.key) {
    case 'ArrowLeft':  case 'a': case 'A': move(0, -1); e.preventDefault(); break;
    case 'ArrowRight': case 'd': case 'D': move(0,  1); e.preventDefault(); break;
    case 'ArrowUp':    case 'w': case 'W': move(-1, 0); e.preventDefault(); break;
    case 'ArrowDown':  case 's': case 'S': move( 1, 0); e.preventDefault(); break;
    case 'r': case 'R': init(); break;
  }
});

/** @type {{ x: number, y: number } | null} */
let touchStart = null;
board.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
board.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
  if (Math.abs(dx) > Math.abs(dy)) move(0, dx > 0 ? 1 : -1);
  else move(dy > 0 ? 1 : -1, 0);
}, { passive: true });

// Prevent the page from scrolling when arrow-keying inside the board on touch devices.
board.addEventListener('touchmove', (e) => { if (touchStart) e.preventDefault(); }, { passive: false });

newGameBtn.addEventListener('click', () => init());

dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'restart') init();
});

init();

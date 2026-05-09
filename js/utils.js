const TILE = 40;
const W = 800;
const H = 600;
const COLS = W / TILE;
const ROWS = H / TILE;

const DIR = { U: 0, R: 1, D: 2, L: 3 };
const TILE_EMPTY = 0, TILE_BRICK = 1, TILE_STEEL = 2, TILE_GRASS = 3, TILE_BASE = 4;

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

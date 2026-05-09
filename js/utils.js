const TILE_SIZE = 40;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const COLS = CANVAS_WIDTH / TILE_SIZE;
const ROWS = CANVAS_HEIGHT / TILE_SIZE;

const Direction = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

const TileType = {
  EMPTY: 0,
  BRICK: 1,
  STEEL: 2,
  GRASS: 3,
  WATER: 4,
  BASE: 5
};

function rectCollision(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

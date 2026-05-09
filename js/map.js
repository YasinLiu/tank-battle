class GameMap {
  constructor() {
    this.grid = [];
    this.baseAlive = true;
  }

  generate(level) {
    this.grid = [];
    for (let r = 0; r < ROWS; r++) {
      this.grid[r] = new Array(COLS).fill(TILE_EMPTY);
    }

    // Base: 2x2 at bottom center
    const bc = Math.floor(COLS / 2) - 1;
    const br = ROWS - 2;
    this.grid[br][bc] = TILE_BASE;
    this.grid[br][bc + 1] = TILE_BASE;
    this.grid[br + 1][bc] = TILE_BASE;
    this.grid[br + 1][bc + 1] = TILE_BASE;

    // Brick wall around base (U shape)
    for (let c = bc - 1; c <= bc + 2; c++) {
      if (c >= 0 && c < COLS) this.grid[br - 1][c] = TILE_BRICK;
    }
    this.grid[br][bc - 1] = TILE_BRICK;
    this.grid[br + 1][bc - 1] = TILE_BRICK;
    this.grid[br][bc + 2] = TILE_BRICK;
    this.grid[br + 1][bc + 2] = TILE_BRICK;

    // Random obstacles (avoid spawn zones and base zone)
    const density = 0.12 + level * 0.02;
    for (let r = 1; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // Skip enemy spawn zones (top-left, top-center, top-right)
        if (r <= 2 && c <= 3) continue;
        if (r <= 2 && c >= COLS - 4) continue;
        if (r <= 2 && c >= bc - 1 && c <= bc + 2) continue;
        // Skip player spawn zone (bottom center, 4x4 area)
        if (r >= br - 4 && r <= br + 2 && c >= bc - 3 && c <= bc + 4) continue;
        // Skip base and its protection
        if (r >= br - 1 && c >= bc - 1 && c <= bc + 2) continue;

        if (Math.random() < density) {
          this.grid[r][c] = Math.random() < 0.75 ? TILE_BRICK : TILE_STEEL;
        }
      }
    }

    // Grass overlay
    for (let i = 0; i < 6 + level * 2; i++) {
      const r = rand(1, ROWS - 4);
      const c = rand(0, COLS - 1);
      if (this.grid[r][c] === TILE_EMPTY) this.grid[r][c] = TILE_GRASS;
    }

    this.baseAlive = true;
  }

  isWalkable(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    const t = this.grid[r][c];
    return t === TILE_EMPTY || t === TILE_GRASS;
  }

  hit(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (this.grid[r][c] === TILE_BRICK) { this.grid[r][c] = TILE_EMPTY; return; }
    if (this.grid[r][c] === TILE_BASE) { this.grid[r][c] = TILE_EMPTY; this.baseAlive = false; }
  }

  draw(ctx) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE, y = r * TILE, t = this.grid[r][c];
        if (t === TILE_BRICK) {
          ctx.fillStyle = '#b5651d';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 1;
          for (let i = 0; i < TILE; i += 10) {
            ctx.beginPath(); ctx.moveTo(x, y + i); ctx.lineTo(x + TILE, y + i); ctx.stroke();
          }
          for (let i = (r % 2 ? 10 : 0); i < TILE; i += 20) {
            ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + TILE); ctx.stroke();
          }
        } else if (t === TILE_STEEL) {
          ctx.fillStyle = '#999'; ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = '#bbb'; ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = '#777'; ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
        } else if (t === TILE_BASE) {
          ctx.fillStyle = '#ffd700'; ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = '#f00'; ctx.font = 'bold 22px Arial';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('★', x + TILE / 2, y + TILE / 2);
        }
      }
    }
  }
}

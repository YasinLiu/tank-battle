class GameMap {
  constructor() {
    this.grid = [];
    this.baseAlive = true;
    this.generateLevel(1);
  }

  generateLevel(level) {
    this.grid = [];
    for (let r = 0; r < ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        this.grid[r][c] = TileType.EMPTY;
      }
    }

    // Place base at bottom center
    const baseCol = Math.floor(COLS / 2) - 1;
    this.grid[ROWS - 1][baseCol] = TileType.BASE;
    this.grid[ROWS - 1][baseCol + 1] = TileType.BASE;
    this.grid[ROWS - 2][baseCol] = TileType.BASE;
    this.grid[ROWS - 2][baseCol + 1] = TileType.BASE;

    // Protect base with bricks (leave sides open for player movement)
    for (let c = baseCol; c <= baseCol + 1; c++) {
      if (c >= 0 && c < COLS) {
        this.grid[ROWS - 3][c] = TileType.BRICK;
      }
    }
    this.grid[ROWS - 2][baseCol - 1] = TileType.BRICK;
    this.grid[ROWS - 1][baseCol - 1] = TileType.BRICK;
    this.grid[ROWS - 2][baseCol + 2] = TileType.BRICK;
    this.grid[ROWS - 1][baseCol + 2] = TileType.BRICK;

    // Generate random obstacles
    const density = Math.min(0.15 + level * 0.02, 0.3);
    for (let r = 1; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        // Keep spawn areas clear
        if (r <= 2 && (c <= 2 || c >= COLS - 3 || (c >= Math.floor(COLS / 2) - 2 && c <= Math.floor(COLS / 2) + 1))) continue;

        if (Math.random() < density) {
          const type = Math.random() < 0.7 ? TileType.BRICK : TileType.STEEL;
          this.grid[r][c] = type;
        }
      }
    }

    // Add some grass patches
    for (let i = 0; i < 8 + level; i++) {
      const r = randomInt(2, ROWS - 4);
      const c = randomInt(0, COLS - 1);
      if (this.grid[r][c] === TileType.EMPTY) {
        this.grid[r][c] = TileType.GRASS;
      }
    }

    this.baseAlive = true;
  }

  getTile(row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return TileType.STEEL;
    return this.grid[row][col];
  }

  setTile(row, col, type) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      this.grid[row][col] = type;
    }
  }

  destroyTile(row, col) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      if (this.grid[row][col] === TileType.BRICK) {
        this.grid[row][col] = TileType.EMPTY;
        return true;
      }
      if (this.grid[row][col] === TileType.BASE) {
        this.grid[row][col] = TileType.EMPTY;
        this.baseAlive = false;
        return true;
      }
    }
    return false;
  }

  isWalkable(row, col) {
    const tile = this.getTile(row, col);
    return tile === TileType.EMPTY || tile === TileType.GRASS;
  }

  draw(ctx) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const tile = this.grid[r][c];

        switch (tile) {
          case TileType.BRICK:
            ctx.fillStyle = '#b5651d';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            // Brick pattern
            for (let i = 0; i < TILE_SIZE; i += 10) {
              ctx.beginPath();
              ctx.moveTo(x, y + i);
              ctx.lineTo(x + TILE_SIZE, y + i);
              ctx.stroke();
            }
            for (let i = (r % 2 === 0 ? 0 : 10); i < TILE_SIZE; i += 20) {
              ctx.beginPath();
              ctx.moveTo(x + i, y);
              ctx.lineTo(x + i, y + TILE_SIZE);
              ctx.stroke();
            }
            break;

          case TileType.STEEL:
            ctx.fillStyle = '#a0a0a0';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.fillStyle = '#808080';
            ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            break;

          case TileType.GRASS:
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#3a7a28';
            for (let i = 0; i < 5; i++) {
              const gx = x + randomInt(2, TILE_SIZE - 6);
              const gy = y + randomInt(2, TILE_SIZE - 6);
              ctx.fillRect(gx, gy, 4, 8);
            }
            break;

          case TileType.WATER:
            ctx.fillStyle = '#1a5276';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#2e86c1';
            ctx.fillRect(x, y + 10, TILE_SIZE, 4);
            ctx.fillRect(x + 10, y + 25, TILE_SIZE - 10, 4);
            break;

          case TileType.BASE:
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
            break;
        }
      }
    }
  }
}

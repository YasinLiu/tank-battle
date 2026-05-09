class Bullet {
  constructor(x, y, direction, speed, owner) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = speed;
    this.owner = owner; // 'player' or 'enemy'
    this.size = 6;
    this.alive = true;
  }

  update(gameMap) {
    switch (this.direction) {
      case Direction.UP: this.y -= this.speed; break;
      case Direction.DOWN: this.y += this.speed; break;
      case Direction.LEFT: this.x -= this.speed; break;
      case Direction.RIGHT: this.x += this.speed; break;
    }

    // Out of bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.alive = false;
      return;
    }

    // Check map collision
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor(this.y / TILE_SIZE);
    const tile = gameMap.getTile(row, col);

    if (tile === TileType.BRICK) {
      gameMap.destroyTile(row, col);
      this.alive = false;
    } else if (tile === TileType.STEEL) {
      this.alive = false;
    } else if (tile === TileType.BASE) {
      gameMap.destroyTile(row, col);
      this.alive = false;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.owner === 'player' ? '#ffff00' : '#ff6600';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect
    ctx.fillStyle = this.owner === 'player' ? 'rgba(255,255,0,0.3)' : 'rgba(255,102,0,0.3)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  getRect() {
    return { x: this.x - this.size / 2, y: this.y - this.size / 2, w: this.size, h: this.size };
  }
}

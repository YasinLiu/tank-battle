class Bullet {
  constructor(x, y, dx, dy, fromPlayer) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = 6;
    this.fromPlayer = fromPlayer;
    this.alive = true;
    this.r = 3;
  }

  update(map) {
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;

    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) {
      this.alive = false;
      return;
    }

    const c = Math.floor(this.x / TILE);
    const r = Math.floor(this.y / TILE);
    const tile = map.grid[r] && map.grid[r][c];
    if (tile === TILE_BRICK) { map.hit(r, c); this.alive = false; }
    else if (tile === TILE_STEEL) { this.alive = false; }
    else if (tile === TILE_BASE) { map.hit(r, c); this.alive = false; }
  }

  draw(ctx) {
    ctx.fillStyle = this.fromPlayer ? '#ff0' : '#f80';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.fromPlayer ? 'rgba(255,255,0,0.3)' : 'rgba(255,128,0,0.3)';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r + 3, 0, Math.PI * 2); ctx.fill();
  }

  getRect() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
}

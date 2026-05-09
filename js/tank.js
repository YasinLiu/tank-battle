class Tank {
  constructor(x, y, color, isPlayer) {
    this.x = x;
    this.y = y;
    this.w = TILE - 4;
    this.h = TILE - 4;
    this.color = color;
    this.dir = DIR.U;
    this.speed = isPlayer ? 3 : 1.5;
    this.isPlayer = isPlayer;
    this.alive = true;
    this.hp = isPlayer ? 3 : 1;
    this.cooldown = 0;
    this.maxCooldown = isPlayer ? 12 : 60;
    this.inv = isPlayer ? 90 : 0;
  }

  update() {
    if (this.cooldown > 0) this.cooldown--;
    if (this.inv > 0) this.inv--;
  }

  canMoveTo(nx, ny, map, tanks) {
    // Boundary check
    if (nx < 0 || ny < 0 || nx + this.w > W || ny + this.h > H) return false;

    // Tile collision: check all 4 corners with 1px inset
    const m = 1;
    const corners = [
      [Math.floor((ny + m) / TILE), Math.floor((nx + m) / TILE)],
      [Math.floor((ny + m) / TILE), Math.floor((nx + this.w - 1 - m) / TILE)],
      [Math.floor((ny + this.h - 1 - m) / TILE), Math.floor((nx + m) / TILE)],
      [Math.floor((ny + this.h - 1 - m) / TILE), Math.floor((nx + this.w - 1 - m) / TILE)]
    ];
    for (const [r, c] of corners) {
      if (!map.isWalkable(r, c)) return false;
    }

    // Tank collision
    const rect = { x: nx, y: ny, w: this.w, h: this.h };
    for (const t of tanks) {
      if (t === this || !t.alive) continue;
      if (overlap(rect, t.getRect())) return false;
    }
    return true;
  }

  move(dir, map, tanks) {
    this.dir = dir;
    let dx = 0, dy = 0;
    if (dir === DIR.U) dy = -this.speed;
    else if (dir === DIR.D) dy = this.speed;
    else if (dir === DIR.L) dx = -this.speed;
    else if (dir === DIR.R) dx = this.speed;

    // Move X first, then Y (allows wall sliding)
    if (dx !== 0) {
      const nx = clamp(this.x + dx, 0, W - this.w);
      if (this.canMoveTo(nx, this.y, map, tanks)) this.x = nx;
    }
    if (dy !== 0) {
      const ny = clamp(this.y + dy, 0, H - this.h);
      if (this.canMoveTo(this.x, ny, map, tanks)) this.y = ny;
    }
  }

  shoot() {
    if (this.cooldown > 0) return null;
    this.cooldown = this.maxCooldown;
    const bx = this.x + this.w / 2;
    const by = this.y + this.h / 2;
    let bdx = 0, bdy = 0;
    if (this.dir === DIR.U) bdy = -1;
    else if (this.dir === DIR.D) bdy = 1;
    else if (this.dir === DIR.L) bdx = -1;
    else if (this.dir === DIR.R) bdx = 1;
    return new Bullet(bx, by, bdx, bdy, this.isPlayer);
  }

  hit() {
    if (this.inv > 0) return false;
    this.hp--;
    if (this.hp <= 0) { this.alive = false; return true; }
    if (this.isPlayer) this.inv = 90;
    return false;
  }

  getRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  draw(ctx) {
    if (!this.alive) return;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    const flick = this.inv > 0 && Math.floor(Date.now() / 100) % 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.dir * Math.PI / 2);

    // Body
    ctx.fillStyle = flick ? '#fff' : this.color;
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

    // Tracks
    ctx.fillStyle = flick ? '#ddd' : darken(this.color, 40);
    ctx.fillRect(-this.w / 2, -this.h / 2, 5, this.h);
    ctx.fillRect(this.w / 2 - 5, -this.h / 2, 5, this.h);

    // Turret
    ctx.fillStyle = flick ? '#eee' : lighten(this.color, 30);
    ctx.beginPath(); ctx.arc(0, 0, this.w / 4, 0, Math.PI * 2); ctx.fill();

    // Barrel
    ctx.fillStyle = flick ? '#ccc' : darken(this.color, 20);
    ctx.fillRect(-2.5, -this.h / 2 - 5, 5, this.h / 2 + 5);

    ctx.restore();

    // HP bar for player
    if (this.isPlayer && this.hp < 3) {
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x, this.y - 8, this.w, 4);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.x, this.y - 8, this.w * (this.hp / 3), 4);
    }
  }
}

class EnemyTank extends Tank {
  constructor(x, y) {
    const colors = ['#c0392b', '#e67e22', '#8e44ad', '#2980b9'];
    super(x, y, colors[rand(0, colors.length - 1)], false);
    this.moveTimer = 0;
    this.moveInterval = rand(40, 100);
    this.curDir = DIR.D;
    this.shootTimer = rand(30, 80);
  }

  ai(map, player, tanks) {
    this.moveTimer++;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.moveInterval = rand(40, 100);
      if (Math.random() < 0.35 && player.alive) {
        const dx = player.x - this.x, dy = player.y - this.y;
        this.curDir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? DIR.R : DIR.L)
          : (dy > 0 ? DIR.D : DIR.U);
      } else {
        this.curDir = rand(0, 3);
      }
    }
    this.move(this.curDir, map, tanks);

    this.shootTimer--;
    if (this.shootTimer <= 0) {
      this.shootTimer = rand(30, 80);
      return this.shoot();
    }
    return null;
  }
}

// Helpers
function darken(hex, n) {
  const v = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (v >> 16) - n);
  const g = Math.max(0, ((v >> 8) & 0xff) - n);
  const b = Math.max(0, (v & 0xff) - n);
  return `rgb(${r},${g},${b})`;
}
function lighten(hex, n) {
  const v = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (v >> 16) + n);
  const g = Math.min(255, ((v >> 8) & 0xff) + n);
  const b = Math.min(255, (v & 0xff) + n);
  return `rgb(${r},${g},${b})`;
}

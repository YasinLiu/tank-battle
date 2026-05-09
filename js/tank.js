class Tank {
  constructor(x, y, color, isPlayer = false) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE - 4;
    this.height = TILE_SIZE - 4;
    this.color = color;
    this.direction = Direction.UP;
    this.speed = 3;
    this.isPlayer = isPlayer;
    this.alive = true;
    this.hp = isPlayer ? 3 : 1;
    this.shootCooldown = 0;
    this.shootDelay = isPlayer ? 15 : 60;
    this.invincible = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(gameMap) {
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.invincible > 0) this.invincible--;
    this.animTimer++;
    if (this.animTimer >= 10) {
      this.animFrame = (this.animFrame + 1) % 2;
      this.animTimer = 0;
    }
  }

  move(direction, gameMap, tanks) {
    this.direction = direction;
    let newX = this.x;
    let newY = this.y;
    const moveSpeed = this.speed;

    switch (direction) {
      case Direction.UP: newY -= moveSpeed; break;
      case Direction.DOWN: newY += moveSpeed; break;
      case Direction.LEFT: newX -= moveSpeed; break;
      case Direction.RIGHT: newX += moveSpeed; break;
    }

    // Boundary check
    newX = clamp(newX, 0, CANVAS_WIDTH - this.width);
    newY = clamp(newY, 0, CANVAS_HEIGHT - this.height);

    // Tile collision check
    const checkCorners = (x, y) => {
      const corners = [
        { r: Math.floor(y / TILE_SIZE), c: Math.floor(x / TILE_SIZE) },
        { r: Math.floor(y / TILE_SIZE), c: Math.floor((x + this.width - 1) / TILE_SIZE) },
        { r: Math.floor((y + this.height - 1) / TILE_SIZE), c: Math.floor(x / TILE_SIZE) },
        { r: Math.floor((y + this.height - 1) / TILE_SIZE), c: Math.floor((x + this.width - 1) / TILE_SIZE) }
      ];
      return corners.every(c => gameMap.isWalkable(c.r, c.c));
    };

    if (checkCorners(newX, newY)) {
      // Check collision with other tanks
      const newRect = { x: newX, y: newY, w: this.width, h: this.height };
      const collidesWithTank = tanks.some(t => t !== this && t.alive && rectCollision(newRect, t.getRect()));
      if (!collidesWithTank) {
        this.x = newX;
        this.y = newY;
      }
    }
  }

  shoot() {
    if (this.shootCooldown > 0) return null;
    this.shootCooldown = this.shootDelay;

    let bulletX = this.x + this.width / 2;
    let bulletY = this.y + this.height / 2;

    switch (this.direction) {
      case Direction.UP: bulletY -= this.height / 2; break;
      case Direction.DOWN: bulletY += this.height / 2; break;
      case Direction.LEFT: bulletX -= this.width / 2; break;
      case Direction.RIGHT: bulletX += this.width / 2; break;
    }

    const bulletSpeed = this.isPlayer ? 5 : 4;
    return new Bullet(bulletX, bulletY, this.direction, bulletSpeed, this.isPlayer ? 'player' : 'enemy');
  }

  takeDamage() {
    if (this.invincible > 0) return false;
    this.hp--;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    if (this.isPlayer) {
      this.invincible = 120; // 2 seconds invincibility
    }
    return false;
  }

  getRect() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  draw(ctx) {
    if (!this.alive) return;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((this.direction * Math.PI) / 2);

    // Tank body
    const flicker = this.invincible > 0 && this.animFrame === 0;
    ctx.fillStyle = flicker ? '#ffffff' : this.color;

    // Main body
    drawRoundedRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 3);
    ctx.fill();

    // Track lines
    ctx.fillStyle = flicker ? '#cccccc' : this.darken(this.color, 30);
    ctx.fillRect(-this.width / 2, -this.height / 2, 6, this.height);
    ctx.fillRect(this.width / 2 - 6, -this.height / 2, 6, this.height);

    // Turret
    ctx.fillStyle = flicker ? '#eeeeee' : this.lighten(this.color, 30);
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
    ctx.fill();

    // Barrel
    ctx.fillStyle = flicker ? '#dddddd' : this.darken(this.color, 15);
    ctx.fillRect(-3, -this.height / 2 - 6, 6, this.height / 2 + 6);

    ctx.restore();

    // HP bar for player
    if (this.isPlayer) {
      const barWidth = this.width;
      const barHeight = 4;
      const barY = this.y - 8;
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x, barY, barWidth, barHeight);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.x, barY, barWidth * (this.hp / 3), barHeight);
    }
  }

  darken(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
  }

  lighten(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }
}

class EnemyTank extends Tank {
  constructor(x, y) {
    const colors = ['#c0392b', '#e67e22', '#8e44ad', '#2980b9'];
    super(x, y, colors[randomInt(0, colors.length - 1)], false);
    this.moveTimer = 0;
    this.moveInterval = randomInt(30, 90);
    this.currentDir = Direction.DOWN;
    this.shootDelay = randomInt(40, 80);
  }

  aiUpdate(gameMap, player, tanks) {
    this.moveTimer++;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.moveInterval = randomInt(30, 90);

      // Decide direction: sometimes aim towards player
      if (Math.random() < 0.4 && player.alive) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          this.currentDir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
        } else {
          this.currentDir = dy > 0 ? Direction.DOWN : Direction.UP;
        }
      } else {
        this.currentDir = randomInt(0, 3);
      }
    }

    this.move(this.currentDir, gameMap, tanks);

    // Shoot randomly or when facing player
    if (Math.random() < 0.02) {
      return this.shoot();
    }
    return null;
  }
}

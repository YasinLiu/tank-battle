class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.state = 'menu'; // menu, playing, paused, gameover, victory
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.enemiesKilled = 0;
    this.enemiesPerLevel = 8;
    this.maxEnemiesOnScreen = 4;
    this.enemySpawnTimer = 0;
    this.enemySpawnDelay = 120;

    this.gameMap = new GameMap();
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.keys = {};
    this.effects = [];

    this.setupControls();
    this.showMenu();
    this.gameLoop();
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
    document.getElementById('menuBtn').addEventListener('click', () => this.showMenu());
  }

  showMenu() {
    this.state = 'menu';
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
  }

  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.enemiesKilled = 0;

    document.getElementById('menu').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    this.initLevel();
  }

  initLevel() {
    this.gameMap.generateLevel(this.level);
    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.effects = [];
    this.enemiesKilled = 0;
    this.enemySpawnTimer = 0;
    this.enemiesPerLevel = Math.min(6 + this.level * 2, 20);
    this.maxEnemiesOnScreen = Math.min(3 + this.level, 6);

    // Spawn player
    this.player = new Tank(
      (COLS / 2 - 2) * TILE_SIZE,
      (ROWS - 2) * TILE_SIZE,
      '#27ae60',
      true
    );
    this.player.invincible = 60;
  }

  spawnEnemy() {
    if (this.enemies.length >= this.maxEnemiesOnScreen) return;
    if (this.enemiesKilled + this.enemies.length >= this.enemiesPerLevel) return;

    const spawnPoints = [
      { x: 0, y: 0 },
      { x: (COLS / 2) * TILE_SIZE, y: 0 },
      { x: (COLS - 1) * TILE_SIZE, y: 0 }
    ];
    const point = spawnPoints[randomInt(0, spawnPoints.length - 1)];

    // Check if spawn point is clear
    const rect = { x: point.x, y: point.y, w: TILE_SIZE, h: TILE_SIZE };
    const blocked = [this.player, ...this.enemies].some(t => t.alive && rectCollision(rect, t.getRect()));
    if (blocked) return;

    const enemy = new EnemyTank(point.x, point.y);
    this.enemies.push(enemy);
  }

  update() {
    if (this.state !== 'playing') return;

    // Player movement
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      this.player.move(Direction.UP, this.gameMap, [this.player, ...this.enemies]);
    }
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      this.player.move(Direction.DOWN, this.gameMap, [this.player, ...this.enemies]);
    }
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.player.move(Direction.LEFT, this.gameMap, [this.player, ...this.enemies]);
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.player.move(Direction.RIGHT, this.gameMap, [this.player, ...this.enemies]);
    }
    if (this.keys[' ']) {
      const bullet = this.player.shoot();
      if (bullet) this.bullets.push(bullet);
    }

    this.player.update(this.gameMap);

    // Enemy spawning
    this.enemySpawnTimer++;
    if (this.enemySpawnTimer >= this.enemySpawnDelay) {
      this.enemySpawnTimer = 0;
      this.spawnEnemy();
    }

    // Enemy AI
    const allTanks = [this.player, ...this.enemies];
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.update(this.gameMap);
      const bullet = enemy.aiUpdate(this.gameMap, this.player, allTanks);
      if (bullet) this.bullets.push(bullet);
    }

    // Update bullets
    for (const bullet of this.bullets) {
      if (!bullet.alive) continue;
      bullet.update(this.gameMap);

      // Bullet-tank collision
      if (bullet.owner === 'player') {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          if (rectCollision(bullet.getRect(), enemy.getRect())) {
            bullet.alive = false;
            if (enemy.takeDamage()) {
              this.score += 100;
              this.enemiesKilled++;
              this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            }
            break;
          }
        }
      } else {
        if (this.player.alive && rectCollision(bullet.getRect(), this.player.getRect())) {
          bullet.alive = false;
          if (this.player.takeDamage()) {
            this.lives--;
            this.addExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
            if (this.lives <= 0) {
              this.gameOver();
            } else {
              this.player = new Tank(
                (COLS / 2 - 2) * TILE_SIZE,
                (ROWS - 2) * TILE_SIZE,
                '#27ae60',
                true
              );
              this.player.invincible = 120;
            }
          }
        }
      }

      // Bullet-bullet collision
      for (const other of this.bullets) {
        if (other === bullet || !other.alive) continue;
        if (bullet.owner !== other.owner && rectCollision(bullet.getRect(), other.getRect())) {
          bullet.alive = false;
          other.alive = false;
        }
      }
    }

    // Clean up
    this.bullets = this.bullets.filter(b => b.alive);
    this.enemies = this.enemies.filter(e => e.alive);

    // Update explosions
    for (const exp of this.explosions) {
      exp.timer++;
    }
    this.explosions = this.explosions.filter(e => e.timer < e.duration);

    // Check base
    if (!this.gameMap.baseAlive) {
      this.gameOver();
    }

    // Check level complete
    if (this.enemiesKilled >= this.enemiesPerLevel && this.enemies.length === 0) {
      this.level++;
      this.score += 500;
      this.addEffect('LEVEL ' + this.level, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      setTimeout(() => {
        if (this.state === 'playing') this.initLevel();
      }, 1500);
    }

    // Update HUD
    this.updateHUD();
  }

  gameOver() {
    this.state = 'gameover';
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('finalLevel').textContent = this.level;
    document.getElementById('gameOver').classList.remove('hidden');
  }

  addExplosion(x, y) {
    this.explosions.push({ x, y, timer: 0, duration: 30 });
  }

  addEffect(text, x, y) {
    this.effects.push({ text, x, y, timer: 0, duration: 90 });
  }

  updateHUD() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('lives').textContent = this.lives;
    document.getElementById('level').textContent = this.level;
    document.getElementById('enemies').textContent = this.enemiesPerLevel - this.enemiesKilled;
  }

  draw() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.state === 'menu') return;

    // Draw map (except grass - draw grass on top)
    this.gameMap.draw(this.ctx);

    // Draw tanks
    if (this.player.alive) this.player.draw(this.ctx);
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx);
    }

    // Draw bullets
    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }

    // Draw grass on top (overlay)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.gameMap.grid[r][c] === TileType.GRASS) {
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;
          this.ctx.fillStyle = 'rgba(45, 90, 30, 0.7)';
          this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.ctx.fillStyle = 'rgba(58, 122, 40, 0.8)';
          for (let i = 0; i < 5; i++) {
            this.ctx.fillRect(x + (i * 7 + 3) % TILE_SIZE, y + (i * 5 + 2) % TILE_SIZE, 4, 8);
          }
        }
      }
    }

    // Draw explosions
    for (const exp of this.explosions) {
      const progress = exp.timer / exp.duration;
      const radius = 15 + progress * 25;
      const alpha = 1 - progress;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#ff6600';
      this.ctx.beginPath();
      this.ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.beginPath();
      this.ctx.arc(exp.x, exp.y, radius * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(exp.x, exp.y, radius * 0.3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Draw text effects
    for (const effect of this.effects) {
      const progress = effect.timer / effect.duration;
      const alpha = 1 - progress;
      const y = effect.y - progress * 50;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = 'bold 28px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(effect.text, effect.x, y);
      this.ctx.restore();
    }

    // Paused overlay
    if (this.state === 'paused') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start the game
window.addEventListener('load', () => {
  new Game();
});

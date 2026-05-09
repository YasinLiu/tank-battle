class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = W;
    this.canvas.height = H;

    this.state = 'menu';
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.killed = 0;
    this.totalEnemies = 8;
    this.maxOnScreen = 4;
    this.spawnTimer = 0;
    this.spawnDelay = 120;

    this.map = new GameMap();
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.booms = [];
    this.texts = [];
    this.keys = {};

    this.setupInput();
    this.showMenu();
    this.loop();
  }

  // Player spawn position: column bc (left of base), row br-2 (above base protection)
  playerSpawnPos() {
    const bc = Math.floor(COLS / 2) - 1;
    return { x: bc * TILE, y: (ROWS - 4) * TILE };
  }

  setupInput() {
    document.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    });
    document.addEventListener('keyup', e => { this.keys[e.key] = false; });
    document.getElementById('startBtn').onclick = () => this.start();
    document.getElementById('restartBtn').onclick = () => this.start();
    document.getElementById('menuBtn').onclick = () => this.showMenu();
  }

  showMenu() {
    this.state = 'menu';
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
  }

  start() {
    this.state = 'playing';
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.killed = 0;
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    this.initLevel();
  }

  initLevel() {
    this.map.generate(this.level);
    this.bullets = [];
    this.enemies = [];
    this.booms = [];
    this.texts = [];
    this.killed = 0;
    this.spawnTimer = 0;
    this.totalEnemies = Math.min(6 + this.level * 2, 20);
    this.maxOnScreen = Math.min(3 + this.level, 6);
    this.spawnPlayer();
  }

  spawnPlayer() {
    const pos = this.playerSpawnPos();
    this.player = new Tank(pos.x, pos.y, '#27ae60', true);
    this.player.dir = DIR.U;
  }

  spawnEnemy() {
    if (this.enemies.length >= this.maxOnScreen) return;
    if (this.killed + this.enemies.length >= this.totalEnemies) return;

    const spots = [
      { x: 0, y: 0 },
      { x: Math.floor(COLS / 2) * TILE, y: 0 },
      { x: (COLS - 1) * TILE, y: 0 }
    ];
    const spot = spots[rand(0, spots.length - 1)];
    const rect = { x: spot.x, y: spot.y, w: TILE, h: TILE };
    const blocked = [this.player, ...this.enemies].some(t => t && t.alive && overlap(rect, t.getRect()));
    if (blocked) return;
    this.enemies.push(new EnemyTank(spot.x, spot.y));
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  update() {
    if (this.state !== 'playing') return;

    // Player input
    const p = this.player;
    if (p && p.alive) {
      if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) p.move(DIR.U, this.map, this.allTanks());
      if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) p.move(DIR.D, this.map, this.allTanks());
      if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) p.move(DIR.L, this.map, this.allTanks());
      if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) p.move(DIR.R, this.map, this.allTanks());
      if (this.keys[' ']) {
        const b = p.shoot();
        if (b) this.bullets.push(b);
      }
      p.update();
    }

    // Spawn enemies
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnDelay) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Enemy AI
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.update();
      const b = e.ai(this.map, this.player, this.allTanks());
      if (b) this.bullets.push(b);
    }

    // Bullets
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.update(this.map);
      if (!b.alive) continue;

      // Bullet hits tank
      if (b.fromPlayer) {
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (overlap(b.getRect(), e.getRect())) {
            b.alive = false;
            if (e.hit()) {
              this.score += 100;
              this.killed++;
              this.boom(e.x + e.w / 2, e.y + e.h / 2);
            }
            break;
          }
        }
      } else {
        if (p && p.alive && overlap(b.getRect(), p.getRect())) {
          b.alive = false;
          if (p.hit()) {
            this.lives--;
            this.boom(p.x + p.w / 2, p.y + p.h / 2);
            if (this.lives <= 0) {
              this.gameOver();
            } else {
              this.spawnPlayer();
            }
          }
        }
      }

      // Bullet-bullet
      for (const o of this.bullets) {
        if (o === b || !o.alive) continue;
        if (b.fromPlayer !== o.fromPlayer && overlap(b.getRect(), o.getRect())) {
          b.alive = false; o.alive = false;
        }
      }
    }

    this.bullets = this.bullets.filter(b => b.alive);
    this.enemies = this.enemies.filter(e => e.alive);
    this.booms = this.booms.filter(b => b.t < b.dur);
    this.texts = this.texts.filter(t => t.t < t.dur);

    if (!this.map.baseAlive) this.gameOver();

    if (this.killed >= this.totalEnemies && this.enemies.length === 0) {
      this.level++;
      this.score += 500;
      this.texts.push({ text: 'LEVEL ' + this.level, x: W / 2, y: H / 2, t: 0, dur: 90 });
      setTimeout(() => { if (this.state === 'playing') this.initLevel(); }, 1500);
    }

    this.updateHUD();
  }

  allTanks() {
    return [this.player, ...this.enemies].filter(t => t && t.alive);
  }

  boom(x, y) { this.booms.push({ x, y, t: 0, dur: 25 }); }

  gameOver() {
    this.state = 'gameover';
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('finalLevel').textContent = this.level;
    document.getElementById('gameOver').classList.remove('hidden');
  }

  updateHUD() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('lives').textContent = this.lives;
    document.getElementById('level').textContent = this.level;
    document.getElementById('enemies').textContent = this.totalEnemies - this.killed;
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
    if (this.state === 'menu') return;

    this.map.draw(ctx);

    // Grass overlay
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map.grid[r][c] === TILE_GRASS) {
          ctx.fillStyle = 'rgba(45,90,30,0.6)';
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          ctx.fillStyle = 'rgba(58,122,40,0.7)';
          for (let i = 0; i < 4; i++) {
            ctx.fillRect(c * TILE + (i * 9 + 2) % TILE, r * TILE + (i * 7 + 3) % TILE, 3, 7);
          }
        }
      }
    }

    if (this.player && this.player.alive) this.player.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);

    // Explosions
    for (const b of this.booms) {
      const p = b.t / b.dur, rad = 10 + p * 20;
      ctx.save(); ctx.globalAlpha = 1 - p;
      ctx.fillStyle = '#f60'; ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fc0'; ctx.beginPath(); ctx.arc(b.x, b.y, rad * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, rad * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Text effects
    for (const t of this.texts) {
      const p = t.t / t.dur;
      ctx.save(); ctx.globalAlpha = 1 - p;
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center'; ctx.fillText(t.text, t.x, t.y - p * 40);
      ctx.restore();
    }

    // Advance timers
    for (const b of this.booms) b.t++;
    for (const t of this.texts) t.t++;
  }
}

window.onload = () => new Game();

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A classic tank battle game built with HTML5 Canvas and vanilla JavaScript. No build tools, frameworks, or dependencies. Open `index.html` in a browser to run.

## Running

Open `index.html` directly in a browser — no server required. There is no build step, no package.json, no test suite, and no linter configured.

## Architecture

All source files are in `js/` and must be loaded in dependency order (as specified in `index.html`):

1. **js/utils.js** — Global constants and helpers. Defines `TILE_SIZE` (40), `CANVAS_WIDTH` (800), `CANVAS_HEIGHT` (600), `COLS`/`ROWS`, `Direction` enum (UP=0, RIGHT=1, DOWN=2, LEFT=3), `TileType` enum (EMPTY=0 through BASE=5), and utility functions (`rectCollision`, `clamp`, `randomInt`, `drawRoundedRect`). Every other file depends on these globals.

2. **js/map.js** — `GameMap` class. Manages a 2D grid of tiles. Procedurally generates levels with increasing obstacle density. Handles tile destruction (brick only) and base destruction (triggers game over).

3. **js/bullet.js** — `Bullet` class. Simple projectile with direction, speed, and owner ('player'/'enemy'). Handles tile collision on update.

4. **js/tank.js** — `Tank` base class and `EnemyTank` subclass. `Tank` handles movement (with tile and tank-to-tank collision), shooting with cooldown, damage/invincibility frames, and procedural canvas drawing. `EnemyTank` adds simple AI: periodic random direction changes with a 40% chance to aim toward the player.

5. **js/game.js** — `Game` class. Owns the game loop (`requestAnimationFrame`), all entity arrays (`player`, `enemies[]`, `bullets[]`, `explosions[]`, `effects[]`), keyboard input, state machine (`menu`/`playing`/`paused`/`gameover`), HUD updates, spawning logic, and all collision resolution. Instantiated on `window.load`.

## Rendering

All graphics are drawn procedurally with Canvas 2D API calls — no sprite sheets or image assets. Grass is drawn as a semi-transparent overlay on top of tanks/bullets to create a cover effect.

## Game State

State is managed entirely in memory within the `Game` instance. There is no persistence (localStorage, etc.). Levels are procedurally generated with `Math.random()`, so they are not reproducible.

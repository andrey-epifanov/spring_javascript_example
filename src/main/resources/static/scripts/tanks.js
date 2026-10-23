const CELL = 40;
const COLS = 24;
const ROWS = 15;
const SIZE = 34;

const canvas = document.getElementById('tankCanvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('scoreText');
const livesText = document.getElementById('livesText');
const enemiesText = document.getElementById('enemiesText');
const statusText = document.getElementById('tankStatusText');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const restartBtn = document.getElementById('restartBtn');

const DIRS = {
    up: {x: 0, y: -1},
    down: {x: 0, y: 1},
    left: {x: -1, y: 0},
    right: {x: 1, y: 0}
};
const DIR_ANGLE = {up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2};
const SPAWN_POINTS = [
    {x: 1, y: 1},
    {x: COLS - 2, y: 1},
    {x: 1, y: ROWS - 2},
    {x: COLS - 2, y: ROWS - 2}
];

const MAP = [
    '........................',
    '..####....####....####..',
    '..####....####....####..',
    '........................',
    '....######....######....',
    '....######....######....',
    '........................',
    '..##....########....##..',
    '..##....########....##..',
    '........................',
    '....######....######....',
    '....######....######....',
    '........................',
    '..####....####....####..',
    '........................'
];

let bricks = [];
let player = null;
let enemies = [];
let bullets = [];
let score = 0;
let lives = 3;
let kills = 0;
let gameOver = false;
let spawnTimer = 0;
let spawnIndex = 0;
let playerShootCooldown = 0;
const keys = new Set();

function loadMap() {
    bricks = [];
    MAP.forEach((rowStr, row) => {
        [...rowStr].forEach((ch, col) => {
            if (ch === '#') {
                bricks.push({row, col});
            }
        });
    });
}

function brickAt(row, col) {
    return bricks.some(brick => brick.row === row && brick.col === col);
}

function removeBrick(row, col) {
    bricks = bricks.filter(brick => !(brick.row === row && brick.col === col));
}

function spawnPlayer() {
    player = {x: CELL, y: (ROWS - 2) * CELL, dir: 'up', speed: 150, invuln: 2.5};
}

function reset() {
    loadMap();
    score = 0;
    lives = 3;
    kills = 0;
    gameOver = false;
    spawnTimer = 0;
    spawnIndex = 0;
    playerShootCooldown = 0;
    bullets = [];
    enemies = [];
    spawnPlayer();
    updateHud();
    overlay.classList.add('hidden');
    statusText.textContent = '';
    restartBtn.blur();
}

function trySpawnEnemy() {
    if (enemies.length >= 4) {
        return;
    }
    const point = SPAWN_POINTS[spawnIndex++ % SPAWN_POINTS.length];
    if (brickAt(point.y, point.x)) {
        return;
    }
    const playerCol = Math.floor(player.x / CELL);
    const playerRow = Math.floor(player.y / CELL);
    if (Math.abs(point.x - playerCol) < 2 && Math.abs(point.y - playerRow) < 2) {
        return;
    }
    if (enemies.some(enemy => Math.floor(enemy.x / CELL) === point.x && Math.floor(enemy.y / CELL) === point.y)) {
        return;
    }
    enemies.push({
        x: point.x * CELL,
        y: point.y * CELL,
        dir: 'down',
        speed: 90,
        shootTimer: 1 + Math.random() * 2,
        retargetTimer: 0
    });
    updateHud();
}

function moveEntity(entity, dt, vec) {
    const dist = entity.speed * dt;
    if (vec.x !== 0) {
        const dir = vec.x > 0 ? 1 : -1;
        let nx = entity.x + dir * dist;
        const edge = nx + (dir > 0 ? SIZE : 0);
        const col = Math.floor(edge / CELL);
        const row = Math.floor((entity.y + SIZE / 2) / CELL);
        if (col < 0 || col >= COLS) {
            nx = dir > 0 ? COLS * CELL - SIZE : 0;
        } else if (brickAt(row, col)) {
            nx = dir > 0 ? col * CELL - SIZE : (col + 1) * CELL;
        }
        entity.x = nx;
    } else {
        const dir = vec.y > 0 ? 1 : -1;
        let ny = entity.y + dir * dist;
        const edge = ny + (dir > 0 ? SIZE : 0);
        const row = Math.floor(edge / CELL);
        const col = Math.floor((entity.x + SIZE / 2) / CELL);
        if (row < 0 || row >= ROWS) {
            ny = dir > 0 ? ROWS * CELL - SIZE : 0;
        } else if (brickAt(row, col)) {
            ny = dir > 0 ? row * CELL - SIZE : (row + 1) * CELL;
        }
        entity.y = ny;
    }
}

function shoot(tank, fromPlayer) {
    const vec = DIRS[tank.dir];
    bullets.push({
        x: tank.x + SIZE / 2 + vec.x * (SIZE / 2 + 4) - 4,
        y: tank.y + SIZE / 2 + vec.y * (SIZE / 2 + 4) - 4,
        dx: vec.x,
        dy: vec.y,
        speed: fromPlayer ? 340 : 220,
        fromPlayer
    });
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function updatePlayer(dt) {
    let moveDir = null;
    if (keys.has('ArrowUp') || keys.has('KeyW')) {
        moveDir = 'up';
    } else if (keys.has('ArrowDown') || keys.has('KeyS')) {
        moveDir = 'down';
    } else if (keys.has('ArrowLeft') || keys.has('KeyA')) {
        moveDir = 'left';
    } else if (keys.has('ArrowRight') || keys.has('KeyD')) {
        moveDir = 'right';
    }

    if (moveDir) {
        player.dir = moveDir;
        moveEntity(player, dt, DIRS[moveDir]);
    }
    if (player.invuln > 0) {
        player.invuln -= dt;
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        enemy.retargetTimer -= dt;
        if (enemy.retargetTimer <= 0) {
            const dirs = ['up', 'down', 'left', 'right'];
            enemy.dir = dirs[Math.floor(Math.random() * dirs.length)];
            enemy.retargetTimer = 0.6 + Math.random() * 1.4;
        }

        const beforeX = enemy.x;
        const beforeY = enemy.y;
        moveEntity(enemy, dt, DIRS[enemy.dir]);
        if (enemy.x === beforeX && enemy.y === beforeY) {
            enemy.retargetTimer = 0;
        }

        enemy.shootTimer -= dt;
        if (enemy.shootTimer <= 0) {
            shoot(enemy, false);
            enemy.shootTimer = 1.2 + Math.random() * 2.2;
        }
    }
}

function updateBullets(dt) {
    for (const bullet of bullets) {
        bullet.x += bullet.dx * bullet.speed * dt;
        bullet.y += bullet.dy * bullet.speed * dt;
    }

    bullets = bullets.filter(bullet => {
        const centerX = bullet.x + 4;
        const centerY = bullet.y + 4;
        if (centerX < -8 || centerX > COLS * CELL + 8 || centerY < -8 || centerY > ROWS * CELL + 8) {
            return false;
        }

        const col = Math.floor(centerX / CELL);
        const row = Math.floor(centerY / CELL);
        if (brickAt(row, col)) {
            removeBrick(row, col);
            return false;
        }

        if (bullet.fromPlayer) {
            const target = enemies.find(enemy => rectsOverlap(bullet.x, bullet.y, 8, 8, enemy.x, enemy.y, SIZE, SIZE));
            if (target) {
                killEnemy(target);
                return false;
            }
        } else if (!gameOver && player.invuln <= 0
            && rectsOverlap(bullet.x, bullet.y, 8, 8, player.x, player.y, SIZE, SIZE)) {
            hitPlayer();
            return false;
        }
        return true;
    });
}

function killEnemy(target) {
    enemies = enemies.filter(enemy => enemy !== target);
    score += 100;
    kills += 1;
    statusText.textContent = 'Уничтожено противников: ' + kills;
    updateHud();
}

function hitPlayer() {
    lives -= 1;
    bullets = bullets.filter(bullet => bullet.fromPlayer);
    updateHud();
    if (lives <= 0) {
        endGame();
    } else {
        spawnPlayer();
    }
}

function endGame() {
    gameOver = true;
    overlayTitle.textContent = 'Игра окончена';
    overlayText.textContent = 'Счёт: ' + score + ' · Уничтожено противников: ' + kills;
    overlay.classList.remove('hidden');
    restartBtn.focus();
}

function updateHud() {
    scoreText.textContent = score;
    livesText.textContent = lives;
    enemiesText.textContent = enemies.length;
}

function drawBrick(row, col) {
    const x = col * CELL;
    const y = row * CELL;
    ctx.fillStyle = '#a16207';
    ctx.fillRect(x, y, CELL, CELL);
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.beginPath();
    ctx.moveTo(x, y + CELL / 2);
    ctx.lineTo(x + CELL, y + CELL / 2);
    ctx.moveTo(x + CELL / 2, y);
    ctx.lineTo(x + CELL / 2, y + CELL / 2);
    ctx.moveTo(x + CELL / 4, y + CELL / 2);
    ctx.lineTo(x + CELL / 4, y + CELL);
    ctx.moveTo(x + 3 * CELL / 4, y + CELL / 2);
    ctx.lineTo(x + 3 * CELL / 4, y + CELL);
    ctx.stroke();
}

function drawTank(tank, bodyColor, darkColor) {
    ctx.save();
    ctx.translate(tank.x + SIZE / 2, tank.y + SIZE / 2);
    ctx.rotate(DIR_ANGLE[tank.dir]);
    if (tank.invuln > 0 && Math.floor(tank.invuln * 8) % 2 === 0) {
        ctx.globalAlpha = 0.3;
    }

    const half = SIZE / 2;
    ctx.fillStyle = darkColor;
    ctx.fillRect(-half, -half, 7, SIZE);
    ctx.fillRect(half - 7, -half, 7, SIZE);

    ctx.fillStyle = bodyColor;
    ctx.fillRect(-half + 4, -half + 2, SIZE - 8, SIZE - 4);

    ctx.fillStyle = darkColor;
    ctx.fillRect(-3, -half - 6, 6, half + 4);

    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.restore();
}

function draw() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let col = 1; col < COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * CELL, 0);
        ctx.lineTo(col * CELL, canvas.height);
        ctx.stroke();
    }
    for (let row = 1; row < ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * CELL);
        ctx.lineTo(canvas.width, row * CELL);
        ctx.stroke();
    }

    for (const brick of bricks) {
        drawBrick(brick.row, brick.col);
    }

    for (const bullet of bullets) {
        ctx.fillStyle = bullet.fromPlayer ? '#fde047' : '#fb923c';
        ctx.fillRect(bullet.x, bullet.y, 8, 8);
    }

    if (!gameOver && player) {
        drawTank(player, '#22c55e', '#166534');
    }
    for (const enemy of enemies) {
        drawTank(enemy, '#ef4444', '#991b1b');
    }
}

function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (!gameOver) {
        playerShootCooldown -= dt;
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            trySpawnEnemy();
            spawnTimer = 2;
        }
        updatePlayer(dt);
        updateEnemies(dt);
        updateBullets(dt);
    }

    draw();
    requestAnimationFrame(loop);
}

let lastTime = performance.now();

window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault();
    }
    if (event.code === 'Space' && !event.repeat && !gameOver && playerShootCooldown <= 0) {
        shoot(player, true);
        playerShootCooldown = 0.35;
    }
    keys.add(event.code);
});

window.addEventListener('keyup', event => {
    keys.delete(event.code);
});

window.addEventListener('blur', () => {
    keys.clear();
});

restartBtn.addEventListener('click', reset);

reset();
requestAnimationFrame(loop);

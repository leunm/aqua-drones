// Upgraded Game Controller for Aqua Drones with Difficulty Modes, Lives System, and Falling Powerups

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Logical resolution
        this.width = 540;
        this.height = 720;
        
        // State variables
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('aqua_drones_highscore')) || 0;
        this.isGameOver = false;
        this.isPlaying = false;
        this.gameTimer = 0; 
        this.difficultyMultiplier = 1.0;
        this.dronesSplashed = 0;
        this.bossesCleared = 0;

        // Difficulty Modes
        this.selectedDifficulty = 'easy'; // Default
        this.maxLives = 3;
        this.currentLives = 3;
        this.selectedSeason = 'autumn'; // Default season (Autumn is default now)
        this.isPaused = false;
        this.plantSwayTimer = 0;

        // Day-Night Celestial Settings
        this.celestialTime = 0; 
        this.celestialCycleDuration = 80;
        this.stars = [];
        this.generateStars(50);
        this.generateScenery(); // Generate background mountains, lake, hills, clouds

        // Powerups States
        this.activePowerup = null; // 'rapid', 'rocket'
        this.powerupTimer = 0; // 0 to 7.0 seconds
        this.powerupDuration = 7.0;

        // Entities arrays
        this.player = null;
        this.projectiles = [];
        this.enemies = [];
        this.bosses = [];
        this.particles = [];
        this.powerups = []; // Falling powerup bubbles

        // Timers
        this.droneSpawnTimer = 0;
        this.droneSpawnInterval = 1.8;
        this.bossCheckTimer = 12.0; 
        this.powerupSpawnTimer = 6.0; // Spawn first powerup at 6s
        
        // Boss Cycling State
        this.bossOrder = ['kuromi', 'kitty', 'melody', 'purin'];
        this.currentBossIndex = 0;

        // Shake screen effects
        this.shakeTime = 0;
        this.shakeIntensity = 0;

        // Input
        this.keys = {};
        
        // HTML UI Elements
        this.ui = {
            score: document.getElementById('scoreVal'),
            highScore: document.getElementById('highScoreVal'),
            livesVal: document.getElementById('livesVal'),
            time: document.getElementById('timeVal'),
            startScreen: document.getElementById('startScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            startBtn: document.getElementById('startBtn'),
            restartBtn: document.getElementById('restartBtn'),
            bossAlert: document.getElementById('bossAlert'),
            powerupToast: document.getElementById('powerupToast'),
            powerupLabel: document.getElementById('powerupLabel'),
            powerupBarFill: document.getElementById('powerupBarFill'),
            endScore: document.getElementById('endScore'),
            endTime: document.getElementById('endTime'),
            endDrones: document.getElementById('endDrones'),
            endBosses: document.getElementById('endBosses'),
            pauseScreen: document.getElementById('pauseScreen'),
            resumeBtn: document.getElementById('resumeBtn'),
            quitBtn: document.getElementById('quitBtn'),
            container: document.querySelector('.canvas-container')
        };

        // Delta time tracking
        this.lastTime = performance.now();

        this.initEvents();
        this.updateHUD();

        // Start the loop immediately to animate title screen underwater background!
        requestAnimationFrame((time) => this.loop(time));
    }

    generateStars(count) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.55),
                size: 0.5 + Math.random() * 2,
                twinkleSpeed: 2 + Math.random() * 4,
                twinkleOffset: Math.random() * 10
            });
        }
    }

    generateScenery() {
        this.scenery = {
            mountainsDist: [
                { x: 0, y: 520 },
                { x: this.width * 0.15, y: 380 },
                { x: this.width * 0.32, y: 480 },
                { x: this.width * 0.52, y: 320 },
                { x: this.width * 0.72, y: 450 },
                { x: this.width * 0.88, y: 360 },
                { x: this.width, y: 520 }
            ],
            mountainsClose: [
                { x: 0, y: 560 },
                { x: this.width * 0.22, y: 440 },
                { x: this.width * 0.45, y: 530 },
                { x: this.width * 0.65, y: 410 },
                { x: this.width * 0.85, y: 500 },
                { x: this.width, y: 560 }
            ],
            flowers: [],
            clouds: [],
            planets: [
                { type: 'saturn', x: this.width * 0.22, y: 140, r: 20, color: '#fde047', ringColor: '#fbbf24' },
                { type: 'giant', x: this.width * 0.78, y: 90, r: 26, color: '#f472b6', stripeColor: '#fbcfe8' }
            ],
            menuFish: [],
            seaweed: [
                { x: this.width * 0.06, h: 90, color: '#059669' },
                { x: this.width * 0.11, h: 110, color: '#047857' },
                { x: this.width * 0.18, h: 80, color: '#065f46' },
                { x: this.width * 0.82, h: 70, color: '#065f46' },
                { x: this.width * 0.89, h: 100, color: '#047857' },
                { x: this.width * 0.94, h: 85, color: '#059669' }
            ]
        };

        // Pre-generate clouds drifting in sky
        for (let i = 0; i < 5; i++) {
            this.scenery.clouds.push({
                x: Math.random() * this.width,
                y: 60 + Math.random() * 120,
                scale: 0.6 + Math.random() * 0.7,
                speed: 10 + Math.random() * 15
            });
        }

        // Flower colors based on season
        let flowerColors = ['#fb7185', '#fef08a', '#f43f5e', '#ffffff', '#c084fc', '#38bdf8']; // summer colors default
        if (this.selectedSeason === 'spring') {
            flowerColors = ['#fbcfe8', '#f472b6', '#fb7185', '#ffffff', '#fda4af', '#f43f5e']; // cherry blossom hues
        } else if (this.selectedSeason === 'autumn') {
            flowerColors = ['#ea580c', '#f97316', '#fbbf24', '#f59e0b', '#dc2626', '#b45309']; // copper gold/orange/red leaves
        } else if (this.selectedSeason === 'winter') {
            flowerColors = ['#ffffff', '#cbd5e1', '#93c5fd', '#38bdf8', '#e2e8f0', '#0284c7']; // snowflake ice blues/whites
        }

        // Pre-generate flower coordinates on rolling hills (scaled for 720px height)
        for (let i = 0; i < 60; i++) {
            this.scenery.flowers.push({
                x: Math.random() * this.width,
                y: 560 + Math.random() * 140,
                size: 2.0 + Math.random() * 2.5,
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
            });
        }

        // Pre-generate menu swimming fish
        for (let i = 0; i < 6; i++) {
            this.scenery.menuFish.push({
                x: Math.random() * this.width,
                y: 150 + Math.random() * 320,
                size: 8 + Math.random() * 8,
                speed: 30 + Math.random() * 40,
                color: ['#f472b6', '#38bdf8', '#fb7185', '#fbbf24', '#c084fc', '#67e8f9'][Math.floor(Math.random() * 6)],
                dir: Math.random() < 0.5 ? 1 : -1,
                wigglePhase: Math.random() * 10,
                wiggleSpeed: 8 + Math.random() * 6
            });
        }
    }

    initEvents() {
        window.addEventListener('keydown', (e) => {
            if (['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (this.isPlaying) e.preventDefault();
            }
            if (e.key === 'Escape' || e.key === 'Esc') {
                if (this.isPlaying && !this.isGameOver) {
                    this.togglePause();
                }
            }
            this.keys[e.code] = true;
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            if (['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (this.isPlaying) e.preventDefault();
            }
            
            if ((e.code === 'Space' || e.key === ' ' || e.code === 'KeyJ' || e.key === 'j' || e.key === 'J') && this.isPlaying && this.player) {
                if (this.player.isCharging) {
                    this.fireProjectile();
                }
            }

            this.keys[e.code] = false;
            this.keys[e.key] = false;
        });

        // UI Buttons
        this.ui.startBtn.addEventListener('click', () => this.startGame());
        this.ui.restartBtn.addEventListener('click', () => this.startGame());
        this.ui.resumeBtn.addEventListener('click', () => this.togglePause());
        this.ui.quitBtn.addEventListener('click', () => this.quitToTitle());

        // Segmented Difficulty Buttons
        const diffBtns = document.querySelectorAll('.diff-btn');
        diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                diffBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedDifficulty = btn.dataset.diff;
            });
        });

        // Segmented Season Buttons
        const seasonBtns = document.querySelectorAll('.season-btn');
        seasonBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                seasonBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedSeason = btn.dataset.season;
            });
        });

        // Mobile Virtual Controls touch and mouse click bindings
        const touchLeft = document.getElementById('touchLeft');
        const touchRight = document.getElementById('touchRight');
        const touchShoot = document.getElementById('touchShoot');

        if (touchLeft && touchRight && touchShoot) {
            // Helper functions for Left button
            const moveLeftStart = (e) => {
                e.preventDefault();
                this.keys['ArrowLeft'] = true;
            };
            const moveLeftEnd = (e) => {
                e.preventDefault();
                this.keys['ArrowLeft'] = false;
            };
            touchLeft.addEventListener('touchstart', moveLeftStart);
            touchLeft.addEventListener('touchend', moveLeftEnd);
            touchLeft.addEventListener('mousedown', moveLeftStart);
            touchLeft.addEventListener('mouseup', moveLeftEnd);
            touchLeft.addEventListener('mouseleave', moveLeftEnd);

            // Helper functions for Right button
            const moveRightStart = (e) => {
                e.preventDefault();
                this.keys['ArrowRight'] = true;
            };
            const moveRightEnd = (e) => {
                e.preventDefault();
                this.keys['ArrowRight'] = false;
            };
            touchRight.addEventListener('touchstart', moveRightStart);
            touchRight.addEventListener('touchend', moveRightEnd);
            touchRight.addEventListener('mousedown', moveRightStart);
            touchRight.addEventListener('mouseup', moveRightEnd);
            touchRight.addEventListener('mouseleave', moveRightEnd);

            // Helper functions for Shoot button
            const shootStart = (e) => {
                e.preventDefault();
                this.keys['Space'] = true;
                if (this.isPlaying && this.player && !this.player.isCharging) {
                    this.player.isCharging = true;
                    if (window.sounds) window.sounds.startCharge();
                }
            };
            const shootEnd = (e) => {
                e.preventDefault();
                this.keys['Space'] = false;
                if (this.isPlaying && this.player && this.player.isCharging) {
                    this.fireProjectile();
                }
            };
            touchShoot.addEventListener('touchstart', shootStart);
            touchShoot.addEventListener('touchend', shootEnd);
            touchShoot.addEventListener('mousedown', shootStart);
            touchShoot.addEventListener('mouseup', shootEnd);
            touchShoot.addEventListener('mouseleave', shootEnd);
        }
    }

    updateHUD() {
        this.ui.score.textContent = String(Math.round(this.score)).padStart(5, '0');
        this.ui.highScore.textContent = String(this.highScore).padStart(5, '0');
        this.ui.time.textContent = `${this.gameTimer.toFixed(1)}s`;
        this.updateLivesHUD();
    }

    updateLivesHUD() {
        this.ui.livesVal.textContent = '❤️'.repeat(this.currentLives) || '💀';
    }

    startGame() {
        if (window.sounds) {
            window.sounds.resume();
            window.sounds.playStart();
        }

        this.ui.startScreen.classList.add('hidden');
        this.ui.gameOverScreen.classList.add('hidden');
        this.ui.bossAlert.classList.remove('active');
        this.ui.powerupToast.classList.add('hidden');

        // Apply Difficulty selection
        if (this.selectedDifficulty === 'medium') {
            this.maxLives = 2;
            this.currentLives = 2;
        } else if (this.selectedDifficulty === 'hard') {
            this.maxLives = 1;
            this.currentLives = 1;
        } else {
            this.maxLives = 3;
            this.currentLives = 3;
        }

        this.player = new WaterGun(this.width, this.height);
        this.projectiles = [];
        this.enemies = [];
        this.bosses = [];
        this.particles = [];
        this.powerups = [];

        this.score = 0;
        this.gameTimer = 0;
        this.celestialTime = 10; 
        this.difficultyMultiplier = 1.0;
        this.dronesSplashed = 0;
        this.bossesCleared = 0;
        this.currentBossIndex = 0; 
        this.activePowerup = null;
        this.powerupTimer = 0;
        
        this.isGameOver = false;
        this.isPlaying = true;
        this.lastTime = performance.now();

        // Re-generate background scenery to apply chosen season flower colors
        this.generateScenery();

        this.droneSpawnTimer = 0.5; 
        this.droneSpawnInterval = 1.8;
        this.bossCheckTimer = 12.0; 
        this.powerupSpawnTimer = 6.0; // Spawn first powerup at 6s

        this.isPaused = false;
        this.ui.pauseScreen.classList.add('hidden');
        this.ui.container.classList.add('game-active'); // Enable virtual control visibility inside container
        this.updateHUD();
    }

    fireProjectile() {
        const muzzleX = this.player.x + this.player.width / 2;
        const muzzleY = this.player.y - 8;
        
        const isRocket = (this.activePowerup === 'rocket');
        
        if (this.activePowerup === 'spread') {
            const speed = (600 - this.player.chargeLevel * 150) * (isRocket ? 1.35 : 1.0);
            const angle = 15 * Math.PI / 180; // 15 degrees spread
            
            const projCenter = new WaterProjectile(muzzleX, muzzleY, this.player.chargeLevel, isRocket, 0, -speed);
            const projLeft = new WaterProjectile(muzzleX, muzzleY, this.player.chargeLevel, isRocket, -speed * Math.sin(angle), -speed * Math.cos(angle));
            const projRight = new WaterProjectile(muzzleX, muzzleY, this.player.chargeLevel, isRocket, speed * Math.sin(angle), -speed * Math.cos(angle));
            
            this.projectiles.push(projCenter, projLeft, projRight);
        } else {
            const proj = new WaterProjectile(muzzleX, muzzleY, this.player.chargeLevel, isRocket);
            this.projectiles.push(proj);
        }

        if (window.sounds) {
            window.sounds.playShoot(this.player.chargeLevel);
        }

        const pCount = 5 + Math.round(this.player.chargeLevel * 10);
        for (let i = 0; i < pCount; i++) {
            const p = new Particle(muzzleX, muzzleY, 'splash', isRocket ? '#f97316' : '#00f0ff');
            p.vy = -150 - Math.random() * 100;
            p.vx = (Math.random() - 0.5) * 120;
            this.particles.push(p);
        }

        if (window.sounds) window.sounds.stopCharge();
        this.player.chargeLevel = 0;
        this.player.isCharging = false;
    }

    triggerScreenShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    spawnDrone() {
        const rand = Math.random();
        let type = 'standard';
        
        if (rand < 0.20) {
            type = 'swerve';
        } else if (rand < 0.35) {
            type = 'fast';
        } else if (rand < 0.50) {
            type = 'armored';
        }

        const drone = new Drone(this.width, type);
        this.enemies.push(drone);
    }

    spawnBoss() {
        const bossType = this.bossOrder[this.currentBossIndex];
        this.currentBossIndex = (this.currentBossIndex + 1) % this.bossOrder.length;

        let attempts = 0;
        let spawnedX = 0;
        let overlap = true;
        const radius = 38;

        while (overlap && attempts < 15) {
            spawnedX = radius + Math.random() * (this.width - radius * 2);
            overlap = false;
            
            for (const b of this.bosses) {
                if (Math.abs(spawnedX - b.x) < radius * 2.5) {
                    overlap = true;
                    break;
                }
            }
            attempts++;
        }

        const boss = new Boss(this.width, this.gameTimer, bossType);
        if (!overlap) {
            boss.x = spawnedX;
            boss.startX = spawnedX;
        }

        this.bosses.push(boss);

        const alertText = this.ui.bossAlert.querySelector('.boss-alert-text');
        if (alertText) {
            alertText.textContent = `Warning: ${bossType.charAt(0).toUpperCase() + bossType.slice(1)} Detected!`;
        }

        this.ui.bossAlert.classList.add('active');
        setTimeout(() => {
            this.ui.bossAlert.classList.remove('active');
        }, 3500);
    }

    spawnPowerup() {
        const powerup = new Powerup(this.width);
        this.powerups.push(powerup);
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;
        
        if (window.sounds) {
            window.sounds.stopCharge();
            window.sounds.playGameOver();
        }

        if (this.score > this.highScore) {
            this.highScore = Math.round(this.score);
            localStorage.setItem('aqua_drones_highscore', this.highScore);
        }

        this.ui.endScore.textContent = Math.round(this.score);
        this.ui.endTime.textContent = `${this.gameTimer.toFixed(1)}s`;
        this.ui.endDrones.textContent = this.dronesSplashed;
        this.ui.endBosses.textContent = this.bossesCleared;
        
        this.ui.gameOverScreen.classList.remove('hidden');
        this.ui.container.classList.remove('game-active'); // Hide virtual controls on Game Over
        this.updateHUD();
    }

    loop(time) {
        // Run loop continuously to drive background ocean scenery animations (fish/seaweed)
        const dt = Math.min(0.1, (time - this.lastTime) / 1000); 
        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        // Update background scenery elements (clouds, swimming fish, plant sway)
        this.updateSceneryAnimation(dt);

        // Decay screen shake when active (freezes on pause, but decays on menu screen if quit)
        if (!this.isPaused && this.shakeTime > 0) {
            this.shakeTime = Math.max(0, this.shakeTime - dt);
        }

        if (!this.isPlaying || this.isPaused) {
            return;
        }

        this.gameTimer += dt;
        this.celestialTime = (this.celestialTime + dt) % this.celestialCycleDuration;
        this.difficultyMultiplier = 1.0 + this.gameTimer * 0.015;

        // Apply powerup weapon characteristics (rapid fire removed)
        this.player.chargeSpeed = 0.8; // default charge speed

        // Background bubbles (rising from bottom)
        if (Math.random() < 0.12) {
            const bubbleX = Math.random() * this.width;
            const bubbleY = this.height + 10;
            this.particles.push(new Particle(bubbleX, bubbleY, 'bubble'));
        }

        // Seasonal background particles (falling from top)
        if (Math.random() < 0.08) {
            const x = Math.random() * this.width;
            const y = -10;
            
            let pType = null;
            let pColor = '#ffffff';
            
            if (this.selectedSeason === 'spring') {
                pType = 'petal';
                pColor = ['#fbcfe8', '#f472b6', '#fb7185'][Math.floor(Math.random() * 3)];
            } else if (this.selectedSeason === 'autumn') {
                pType = 'leaf';
                pColor = ['#f97316', '#ea580c', '#fbbf24'][Math.floor(Math.random() * 3)];
            } else if (this.selectedSeason === 'winter') {
                pType = 'snow';
                pColor = '#ffffff';
            }
            
            if (pType) {
                const p = new Particle(x, y, pType, pColor);
                this.particles.push(p);
            }
        }

        // Spawning Drones
        this.droneSpawnTimer -= dt;
        if (this.droneSpawnTimer <= 0) {
            this.spawnDrone();
            const scaledInterval = Math.max(0.45, 1.8 / Math.sqrt(this.difficultyMultiplier));
            this.droneSpawnTimer = scaledInterval * (0.8 + Math.random() * 0.4); 
        }

        // Spawning Bosses
        this.bossCheckTimer -= dt;
        if (this.bossCheckTimer <= 0) {
            if (Math.random() < 0.65) {
                this.spawnBoss();
                this.bossCheckTimer = 16.0;
            } else {
                this.bossCheckTimer = 5.0;
            }
        }

        // Spawning Powerups
        this.powerupSpawnTimer -= dt;
        if (this.powerupSpawnTimer <= 0) {
            this.spawnPowerup();
            // Reset: spawn next powerup in 8 to 14 seconds (much more frequent!)
            this.powerupSpawnTimer = 8.0 + Math.random() * 6.0;
        }

        // Update active powerup timer
        if (this.powerupTimer > 0) {
            this.powerupTimer -= dt;
            
            // Sync HUD active powerup toast panel
            this.ui.powerupToast.classList.remove('hidden');
            const fillPct = (this.powerupTimer / this.powerupDuration) * 100;
            this.ui.powerupBarFill.style.width = `${fillPct}%`;
            
            let pLabel = 'ACTIVE POWERUP';
            if (this.activePowerup === 'rocket') pLabel = 'EXPLOSIVE ROCKETS';
            else if (this.activePowerup === 'spread') pLabel = 'SPREAD BLASTER';
            
            this.ui.powerupLabel.textContent = `${pLabel}: ${this.powerupTimer.toFixed(1)}s`;
            
            // Adjust HUD colors depending on type
            if (this.activePowerup === 'rocket') {
                this.ui.powerupLabel.style.color = 'var(--neon-pink)';
                this.ui.powerupLabel.style.textShadow = '0 0 8px rgba(255, 0, 127, 0.4)';
                this.ui.powerupBarFill.style.background = 'linear-gradient(90deg, var(--neon-pink), #f97316)';
            } else if (this.activePowerup === 'spread') {
                this.ui.powerupLabel.style.color = '#10b981'; // emerald green
                this.ui.powerupLabel.style.textShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
                this.ui.powerupBarFill.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
            } else {
                this.ui.powerupLabel.style.color = 'var(--neon-blue)';
                this.ui.powerupLabel.style.textShadow = '0 0 8px rgba(0, 240, 255, 0.4)';
                this.ui.powerupBarFill.style.background = 'linear-gradient(90deg, var(--neon-blue), var(--neon-purple))';
            }

            if (this.powerupTimer <= 0) {
                this.activePowerup = null;
                this.ui.powerupToast.classList.add('hidden');
            }
        }

        // Update Entities
        this.player.update(dt, this.keys, this.width);

        // Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt);
            if (p.isOffscreen(this.width)) {
                this.projectiles.splice(i, 1);
            }
        }

        // Falling Powerup bubbles
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.update(dt);
            if (p.isOffscreen(this.height)) {
                this.powerups.splice(i, 1); // No penalty for dropping a powerup
            }
        }

        // Drones reaching bottom boundary (Loss of Life)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const drone = this.enemies[i];
            drone.update(dt, this.difficultyMultiplier);

            if (drone.y + drone.radius >= this.height) {
                this.enemies.splice(i, 1); // Remove drone
                this.handleBaseBreached();
                if (this.isGameOver) return;
            }
        }

        // Bosses reaching bottom boundary (Loss of Life)
        for (let i = this.bosses.length - 1; i >= 0; i--) {
            const boss = this.bosses[i];
            boss.update(dt, this.difficultyMultiplier);

            if (boss.y + boss.radius >= this.height) {
                this.bosses.splice(i, 1); // Remove boss
                this.handleBaseBreached();
                if (this.isGameOver) return;
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const part = this.particles[i];
            part.update(dt);
            if (part.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Collision checks
        this.handleCollisions();

        // Screen Shake decay has been moved to the top of update(dt) to prevent freeze bugs

        this.updateHUD();
    }

    handleBaseBreached() {
        this.currentLives--;
        this.updateLivesHUD();
        
        // Shake screen heavily
        this.triggerScreenShake(10, 0.35);

        // Play alert warning/metallic punch sound
        if (window.sounds) {
            window.sounds.playBossHit();
        }

        // Spawn red warning smoke particles at bottom
        for (let s = 0; s < 18; s++) {
            const p = new Particle(Math.random() * this.width, this.height - 10, 'explosion', 'rgba(239, 68, 68, 0.8)');
            p.vy = -50 - Math.random() * 80;
            p.vx = (Math.random() - 0.5) * 50;
            this.particles.push(p);
        }

        if (this.currentLives <= 0) {
            this.gameOver();
        }
    }

    handleCollisions() {
        // Projectile vs. Powerups
        for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
            const proj = this.projectiles[pIdx];

            for (let pwIdx = this.powerups.length - 1; pwIdx >= 0; pwIdx--) {
                const power = this.powerups[pwIdx];

                const dx = proj.x - power.x;
                const dy = proj.y - power.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < proj.radius + power.radius) {
                    // Collect Powerup!
                    if (window.sounds) window.sounds.playHit(); // play bubble pop

                    // Splash particles
                    for (let s = 0; s < 12; s++) {
                        this.particles.push(new Particle(power.x, power.y, 'splash', '#ffffff'));
                    }

                    if (power.type === 'heart') {
                        // Restore life up to mode limits
                        this.currentLives = Math.min(this.maxLives, this.currentLives + 1);
                        this.updateLivesHUD();
                        
                        // Spawn pink hearts
                        for (let s = 0; s < 8; s++) {
                            this.particles.push(new Particle(power.x, power.y, 'explosion', '#ff007f'));
                        }
                    } else {
                        // Activate timed buff
                        this.activePowerup = power.type;
                        this.powerupTimer = this.powerupDuration;
                    }

                    // Remove bullet and powerup
                    this.powerups.splice(pwIdx, 1);
                    this.projectiles.splice(pIdx, 1);
                    break;
                }
            }
        }

        // Projectile vs Drones
        for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
            if (!this.projectiles[pIdx]) continue;
            const proj = this.projectiles[pIdx];

            for (let dIdx = this.enemies.length - 1; dIdx >= 0; dIdx--) {
                const drone = this.enemies[dIdx];
                
                const dx = proj.x - drone.x;
                const dy = proj.y - drone.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = proj.radius + drone.radius;

                if (dist < minDist) {
                    // Collision!
                    if (proj.isRocket) {
                        this.triggerExplosiveBlast(proj.x, proj.y, proj.damage);
                        this.projectiles.splice(pIdx, 1);
                    } else {
                        // Standard water bullet
                        if (drone.type === 'armored') {
                            drone.hp -= proj.damage;
                            this.projectiles.splice(pIdx, 1);

                            for (let s = 0; s < 6; s++) {
                                this.particles.push(new Particle(proj.x, proj.y, 'splash', '#cbd5e1'));
                            }

                            if (drone.hp <= 0) {
                                this.score += Math.round(300 * this.difficultyMultiplier);
                                this.dronesSplashed++;
                                if (window.sounds) window.sounds.playExplode();
                                for (let e = 0; e < 15; e++) {
                                    this.particles.push(new Particle(drone.x, drone.y, 'explosion', '#94a3b8'));
                                }
                                this.enemies.splice(dIdx, 1);
                            } else {
                                if (window.sounds) window.sounds.playBossHit();
                            }
                        } else {
                            this.score += Math.round((drone.type === 'fast' ? 200 : 100) * this.difficultyMultiplier);
                            this.dronesSplashed++;
                            if (window.sounds) window.sounds.playHit();

                            for (let s = 0; s < 12; s++) {
                                this.particles.push(new Particle(drone.x, drone.y, 'splash', '#00f0ff'));
                            }
                            for (let e = 0; e < 8; e++) {
                                this.particles.push(new Particle(drone.x, drone.y, 'explosion', drone.style.accent));
                            }
                            this.enemies.splice(dIdx, 1);
                            this.projectiles.splice(pIdx, 1);
                        }
                    }
                    break; 
                }
            }
        }

        // Projectile vs. Bosses
        for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
            if (!this.projectiles[pIdx]) continue;
            const proj = this.projectiles[pIdx];

            for (let bIdx = this.bosses.length - 1; bIdx >= 0; bIdx--) {
                const boss = this.bosses[bIdx];

                const dx = proj.x - boss.x;
                const dy = proj.y - boss.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = proj.radius + boss.radius;

                if (dist < minDist) {
                    if (proj.isRocket) {
                        this.triggerExplosiveBlast(proj.x, proj.y, proj.damage);
                        this.projectiles.splice(pIdx, 1);
                    } else {
                        // Standard water bullet
                        boss.currentHp -= proj.damage;
                        this.triggerScreenShake(3 + proj.charge * 6, 0.15);
                        if (window.sounds) window.sounds.playBossHit();

                        const splashCount = 8 + Math.round(proj.charge * 12);
                        for (let s = 0; s < splashCount; s++) {
                            const p = new Particle(proj.x, proj.y, 'splash', '#38bdf8');
                            p.vx = (Math.random() - 0.5) * 200 + (dx * 3);
                            p.vy = (Math.random() - 0.5) * 200 + (dy * 3);
                            this.particles.push(p);
                        }

                        if (boss.currentHp <= 0) {
                            const bonusScore = 1500 + Math.round(boss.maxHp * 150);
                            this.score += bonusScore;
                            this.bossesCleared++;

                            if (window.sounds) window.sounds.playExplode();
                            this.triggerScreenShake(14, 0.45);

                            let explosionColor = '#c026d3';
                            if (boss.bossType === 'kitty') explosionColor = '#ef4444';
                            else if (boss.bossType === 'melody') explosionColor = '#ec4899';
                            else if (boss.bossType === 'purin') explosionColor = '#eab308';

                            for (let s = 0; s < 30; s++) {
                                this.particles.push(new Particle(boss.x, boss.y, 'explosion', explosionColor));
                            }
                            this.bosses.splice(bIdx, 1);
                        }
                        this.projectiles.splice(pIdx, 1);
                    }
                    break; 
                }
            }
        }
    }

    triggerExplosiveBlast(x, y, bulletDamage) {
        if (window.sounds) window.sounds.playExplode();
        this.triggerScreenShake(11, 0.35);

        const radius = 120; // 120px explosion AoE radius
        
        // Explosion fire circles drawing
        for (let s = 0; s < 25; s++) {
            const p = new Particle(x, y, 'explosion', ['#fb923c', '#ff007f', '#f59e0b'][Math.floor(Math.random() * 3)]);
            this.particles.push(p);
        }

        // A. Splash damage to surrounding standard/armored drones
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const drone = this.enemies[i];
            const dx = drone.x - x;
            const dy = drone.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= radius) {
                // Drone is inside AoE
                if (drone.type === 'armored') {
                    // Deal rocket splash damage
                    drone.hp -= Math.max(3, bulletDamage * 0.75);
                    if (drone.hp <= 0) {
                        this.score += Math.round(300 * this.difficultyMultiplier);
                        this.dronesSplashed++;
                        for (let e = 0; e < 10; e++) {
                            this.particles.push(new Particle(drone.x, drone.y, 'explosion', '#94a3b8'));
                        }
                        this.enemies.splice(i, 1);
                    } else {
                        // Spawn light dust particles
                        for (let s = 0; s < 4; s++) {
                            this.particles.push(new Particle(drone.x, drone.y, 'splash', '#cbd5e1'));
                        }
                    }
                } else {
                    // Standard / Fast drones immediately vaporized
                    this.score += Math.round((drone.type === 'fast' ? 200 : 100) * this.difficultyMultiplier);
                    this.dronesSplashed++;
                    for (let e = 0; e < 6; e++) {
                        this.particles.push(new Particle(drone.x, drone.y, 'explosion', drone.style.accent));
                    }
                    this.enemies.splice(i, 1);
                }
            }
        }

        // B. Splash damage to surrounding Bosses
        for (let i = this.bosses.length - 1; i >= 0; i--) {
            const boss = this.bosses[i];
            const dx = boss.x - x;
            const dy = boss.y - y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist <= radius) {
                // Deal heavy explosive splash damage
                boss.currentHp -= Math.max(4, bulletDamage * 0.85);

                for (let s = 0; s < 8; s++) {
                    this.particles.push(new Particle(boss.x, boss.y, 'splash', '#fb923c'));
                }

                if (boss.currentHp <= 0) {
                    const bonusScore = 1500 + Math.round(boss.maxHp * 150);
                    this.score += bonusScore;
                    this.bossesCleared++;

                    let explosionColor = '#c026d3';
                    if (boss.bossType === 'kitty') explosionColor = '#ef4444';
                    else if (boss.bossType === 'melody') explosionColor = '#ec4899';
                    else if (boss.bossType === 'purin') explosionColor = '#eab308';

                    for (let s = 0; s < 20; s++) {
                        this.particles.push(new Particle(boss.x, boss.y, 'explosion', explosionColor));
                    }
                    this.bosses.splice(i, 1);
                }
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();

        if (this.shakeTime > 0 && !this.isPaused) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(dx, dy);
        }

        if (!this.isPlaying) {
            this.drawOceanBackground();
            this.drawUnderwaterScenery();
        } else {
            this.drawCelestialBackground();
            this.drawCelestialStars();
            this.drawCelestialBodies();
        }

        this.particles.forEach(p => {
            if (p.type === 'bubble') p.draw(this.ctx);
        });

        // Draw Powerups
        this.powerups.forEach(p => p.draw(this.ctx));

        // Draw Projectiles
        this.projectiles.forEach(p => p.draw(this.ctx));

        // Draw Drones
        this.enemies.forEach(d => d.draw(this.ctx));

        // Draw Bosses
        this.bosses.forEach(b => b.draw(this.ctx));

        // Draw Particles
        this.particles.forEach(p => {
            if (p.type !== 'bubble') p.draw(this.ctx);
        });

        // Draw Player
        if (this.player) {
            this.player.draw(this.ctx);
            this.drawChargeBar();
        }

        if (this.isPlaying) {
            this.drawAmbientOverlay();
        }
        this.ctx.restore();
    }

    interpolateColor(c1, c2, f) {
        const r1 = parseInt(c1.substring(1,3), 16);
        const g1 = parseInt(c1.substring(3,5), 16);
        const b1 = parseInt(c1.substring(5,7), 16);

        const r2 = parseInt(c2.substring(1,3), 16);
        const g2 = parseInt(c2.substring(3,5), 16);
        const b2 = parseInt(c2.substring(5,7), 16);

        const r = Math.round(r1 + (r2 - r1) * f);
        const g = Math.round(g1 + (g2 - g1) * f);
        const b = Math.round(b1 + (b2 - b1) * f);

        return `rgb(${r}, ${g}, ${b})`;
    }



    drawCelestialBackground() {
        const t = this.celestialTime;
        let topColor, botColor;
        
        const keyframes = [
            { time: 0, top: '#2e1065', bot: '#fdba74' },   
            { time: 20, top: '#0284c7', bot: '#38bdf8' },  
            { time: 40, top: '#7c2d12', bot: '#1e1b4b' },  
            { time: 60, top: '#02020a', bot: '#0b0922' },  
            { time: 80, top: '#2e1065', bot: '#fdba74' }   
        ];

        let i = 0;
        for (; i < keyframes.length - 1; i++) {
            if (t >= keyframes[i].time && t < keyframes[i+1].time) {
                break;
            }
        }

        const k1 = keyframes[i];
        const k2 = keyframes[i+1];
        const factor = (t - k1.time) / (k2.time - k1.time);

        topColor = this.interpolateColor(k1.top, k2.top, factor);
        botColor = this.interpolateColor(k1.bot, k2.bot, factor);

        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, topColor);
        bgGrad.addColorStop(1, botColor);
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Water grid line flow
        const lineSpacing = 60;
        const speed = 25;
        const offset = (this.gameTimer * speed) % lineSpacing;

        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.025)';
        this.ctx.lineWidth = 1;
        for (let y = offset; y < this.height; y += lineSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Draw Clouds in the sky (behind mountains and lake)
        if (this.scenery && this.scenery.clouds) {
            let cloudBaseColor;
            if (t >= 0 && t < 20) {
                cloudBaseColor = this.interpolateColor('#fdba74', '#ffffff', t/20);
            } else if (t >= 20 && t < 40) {
                cloudBaseColor = this.interpolateColor('#ffffff', '#fdba74', (t-20)/20);
            } else if (t >= 40 && t < 60) {
                cloudBaseColor = this.interpolateColor('#fdba74', '#94a3b8', (t-40)/20);
            } else {
                cloudBaseColor = this.interpolateColor('#94a3b8', '#fdba74', (t-60)/20);
            }

            const rgbStr = cloudBaseColor.startsWith('rgb(') ? cloudBaseColor.slice(4, -1) : '255,255,255';
            const cloudAlpha = (t >= 45 && t < 75) ? 0.15 : 0.45; // dimmer at night

            this.ctx.fillStyle = `rgba(${rgbStr}, ${cloudAlpha})`;
            this.scenery.clouds.forEach(cloud => {
                this.ctx.beginPath();
                const cx = cloud.x;
                const cy = cloud.y;
                const r = 24 * cloud.scale;
                this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
                this.ctx.arc(cx - r * 0.8, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
                this.ctx.arc(cx + r * 0.8, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
                this.ctx.closePath();
                this.ctx.fill();
            });
        }

        // Draw Space Planets (during night phase)
        let nightFactor = 0;
        if (t >= 40 && t < 60) {
            nightFactor = (t - 40) / 20;
        } else if (t >= 60 && t < 80) {
            nightFactor = 1 - (t - 60) / 20;
        }

        if (nightFactor > 0 && this.scenery && this.scenery.planets) {
            this.ctx.save();
            this.scenery.planets.forEach(p => {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                
                // Add soft neon glow
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = p.color;

                if (p.type === 'saturn') {
                    // Draw Saturn body
                    const grad = this.ctx.createRadialGradient(-p.r * 0.2, -p.r * 0.2, 0, 0, 0, p.r);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.6, p.color);
                    grad.addColorStop(1, '#d97706');
                    
                    this.ctx.fillStyle = grad;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.r, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Draw rings
                    this.ctx.shadowBlur = 0; 
                    this.ctx.strokeStyle = `rgba(251, 191, 36, ${nightFactor * 0.8})`;
                    this.ctx.lineWidth = 4;
                    this.ctx.save();
                    this.ctx.rotate(-Math.PI / 6);
                    this.ctx.scale(2.2, 0.45);
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.r * 0.9, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.restore();
                } else if (p.type === 'giant') {
                    // Draw Gas Giant stripes
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.r, 0, Math.PI * 2);
                    this.ctx.clip(); 

                    // Draw planet base
                    const grad = this.ctx.createRadialGradient(-p.r * 0.2, -p.r * 0.2, 0, 0, 0, p.r);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.5, p.color);
                    grad.addColorStop(1, '#db2777');
                    this.ctx.fillStyle = grad;
                    this.ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);

                    // Draw stripes
                    this.ctx.fillStyle = p.stripeColor;
                    this.ctx.globalAlpha = nightFactor * 0.6;
                    this.ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.15);
                    this.ctx.fillRect(-p.r, p.r * 0.1, p.r * 2, p.r * 0.2);
                    this.ctx.fillRect(-p.r, p.r * 0.5, p.r * 2, p.r * 0.12);
                }
                
                this.ctx.restore();
            });
            this.ctx.restore();
        }

        // Draw Distant Mountains
        if (this.scenery && this.scenery.mountainsDist) {
            let mtDistColor;
            if (this.selectedSeason === 'spring') {
                if (t >= 0 && t < 20) mtDistColor = this.interpolateColor('#111827', '#93c5fd', t/20); // night-grey to misty blue
                else if (t >= 20 && t < 40) mtDistColor = this.interpolateColor('#93c5fd', '#374151', (t-20)/20); // misty blue to twilight-grey
                else if (t >= 40 && t < 60) mtDistColor = this.interpolateColor('#374151', '#0b0f19', (t-40)/20); // twilight-grey to deep-night
                else mtDistColor = this.interpolateColor('#0b0f19', '#111827', (t-60)/20); // loop back
            } else if (this.selectedSeason === 'autumn') {
                if (t >= 0 && t < 20) mtDistColor = this.interpolateColor('#451a03', '#fdba74', t/20); 
                else if (t >= 20 && t < 40) mtDistColor = this.interpolateColor('#fdba74', '#3b1200', (t-20)/20);
                else if (t >= 40 && t < 60) mtDistColor = this.interpolateColor('#3b1200', '#140500', (t-40)/20);
                else mtDistColor = this.interpolateColor('#140500', '#451a03', (t-60)/20);
            } else if (this.selectedSeason === 'winter') {
                if (t >= 0 && t < 20) mtDistColor = this.interpolateColor('#ffe4e6', '#ffffff', t/20); // rose white to pure snow white
                else if (t >= 20 && t < 40) mtDistColor = this.interpolateColor('#ffffff', '#fbcfe8', (t-20)/20); // snow white to pink-rose white
                else if (t >= 40 && t < 60) mtDistColor = this.interpolateColor('#fbcfe8', '#bfdbfe', (t-40)/20); // pink-rose white to luminous light blue
                else mtDistColor = this.interpolateColor('#bfdbfe', '#ffe4e6', (t-60)/20); // loop back
            } else {
                if (t >= 0 && t < 20) mtDistColor = this.interpolateColor('#311432', '#7dd3fc', t/20);
                else if (t >= 20 && t < 40) mtDistColor = this.interpolateColor('#7dd3fc', '#3b1a20', (t-20)/20);
                else if (t >= 40 && t < 60) mtDistColor = this.interpolateColor('#3b1a20', '#0b0518', (t-40)/20);
                else mtDistColor = this.interpolateColor('#0b0518', '#311432', (t-60)/20);
            }

            this.ctx.fillStyle = mtDistColor;
            this.ctx.beginPath();
            const peaks = this.scenery.mountainsDist;
            this.ctx.moveTo(peaks[0].x, peaks[0].y);
            for (let idx = 1; idx < peaks.length; idx++) {
                this.ctx.lineTo(peaks[idx].x, peaks[idx].y);
            }
            this.ctx.lineTo(this.width, this.height);
            this.ctx.lineTo(0, this.height);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Draw Closer Mountains
        if (this.scenery && this.scenery.mountainsClose) {
            let mtCloseColor;
            if (this.selectedSeason === 'spring') {
                if (t >= 0 && t < 20) mtCloseColor = this.interpolateColor('#030712', '#60a5fa', t/20); // night to spring blue
                else if (t >= 20 && t < 40) mtCloseColor = this.interpolateColor('#60a5fa', '#1f2937', (t-20)/20); // spring blue to sunset grey-blue
                else if (t >= 40 && t < 60) mtCloseColor = this.interpolateColor('#1f2937', '#02040a', (t-40)/20); // grey-blue to deep night
                else mtCloseColor = this.interpolateColor('#02040a', '#030712', (t-60)/20); // loop back
            } else if (this.selectedSeason === 'autumn') {
                if (t >= 0 && t < 20) mtCloseColor = this.interpolateColor('#361100', '#f97316', t/20); 
                else if (t >= 20 && t < 40) mtCloseColor = this.interpolateColor('#f97316', '#2b0b00', (t-20)/20);
                else if (t >= 40 && t < 60) mtCloseColor = this.interpolateColor('#2b0b00', '#0a0200', (t-40)/20);
                else mtCloseColor = this.interpolateColor('#0a0200', '#361100', (t-60)/20);
            } else if (this.selectedSeason === 'winter') {
                if (t >= 0 && t < 20) mtCloseColor = this.interpolateColor('#ffd1d9', '#f0f9ff', t/20); // light pink reflection to glacier white-blue
                else if (t >= 20 && t < 40) mtCloseColor = this.interpolateColor('#f0f9ff', '#f472b6', (t-20)/20); // glacier white-blue to soft cherry blossom pink
                else if (t >= 40 && t < 60) mtCloseColor = this.interpolateColor('#f472b6', '#60a5fa', (t-40)/20); // pink to glowing sky-blue
                else mtCloseColor = this.interpolateColor('#60a5fa', '#ffd1d9', (t-60)/20); // loop back
            } else {
                if (t >= 0 && t < 20) mtCloseColor = this.interpolateColor('#26092b', '#38bdf8', t/20);
                else if (t >= 20 && t < 40) mtCloseColor = this.interpolateColor('#38bdf8', '#240a1b', (t-20)/20);
                else if (t >= 40 && t < 60) mtCloseColor = this.interpolateColor('#240a1b', '#04020a', (t-40)/20);
                else mtCloseColor = this.interpolateColor('#04020a', '#26092b', (t-60)/20);
            }

            this.ctx.fillStyle = mtCloseColor;
            this.ctx.beginPath();
            const peaks = this.scenery.mountainsClose;
            this.ctx.moveTo(peaks[0].x, peaks[0].y);
            for (let idx = 1; idx < peaks.length; idx++) {
                this.ctx.lineTo(peaks[idx].x, peaks[idx].y);
            }
            this.ctx.lineTo(this.width, this.height);
            this.ctx.lineTo(0, this.height);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Draw Scenic Sparkling Lake
        let lakeColor;
        if (t >= 0 && t < 20) lakeColor = this.interpolateColor('#0f3b5c', '#075985', t/20); 
        else if (t >= 20 && t < 40) lakeColor = this.interpolateColor('#075985', '#0b2d47', (t-20)/20); 
        else if (t >= 40 && t < 60) lakeColor = this.interpolateColor('#0b2d47', '#03001e', (t-40)/20); 
        else lakeColor = this.interpolateColor('#03001e', '#0f3b5c', (t-60)/20);

        this.ctx.fillStyle = lakeColor;
        this.ctx.fillRect(0, 520, this.width, 90);

        // Sparkling lake wave highlights catching sky reflection tones
        let waveStrokeColor = 'rgba(56, 189, 248, 0.35)'; 
        if (t >= 0 && t < 20) {
            waveStrokeColor = this.interpolateColor('#fdba74', '#38bdf8', t/20); 
        } else if (t >= 20 && t < 40) {
            waveStrokeColor = this.interpolateColor('#38bdf8', '#fb923c', (t-20)/20); 
        } else if (t >= 40 && t < 60) {
            waveStrokeColor = this.interpolateColor('#fb923c', '#c084fc', (t-40)/20); 
        } else {
            waveStrokeColor = this.interpolateColor('#c084fc', '#fdba74', (t-60)/20);
        }

        const waveAlpha = (t >= 45 && t < 75) ? 0.25 : 0.4;
        const rgbMatch = waveStrokeColor.match(/\d+/g);
        this.ctx.strokeStyle = rgbMatch ? `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, ${waveAlpha})` : waveStrokeColor;
        this.ctx.lineWidth = 1.5;
        const shineY = [535, 550, 565, 580, 595];
        shineY.forEach((y, idx) => {
            const waveOffset = Math.sin(this.gameTimer * 2 + idx) * 30;
            this.ctx.beginPath();
            this.ctx.moveTo(this.width * 0.08 + waveOffset, y);
            this.ctx.lineTo(this.width * 0.30 + waveOffset, y);
            this.ctx.moveTo(this.width * 0.44 - waveOffset, y + 5);
            this.ctx.lineTo(this.width * 0.69 - waveOffset, y + 5);
            this.ctx.moveTo(this.width * 0.75 + waveOffset, y - 5);
            this.ctx.lineTo(this.width * 0.95 + waveOffset, y - 5);
            this.ctx.stroke();
        });

        // Draw Rolling Green Hills (split into hillColor1 and hillColor2 for depth)
        let hillColor1, hillColor2;
        if (this.selectedSeason === 'spring') {
            if (t >= 0 && t < 20) {
                hillColor1 = this.interpolateColor('#0f351b', '#4ade80', t/20);
                hillColor2 = this.interpolateColor('#0a2914', '#22c55e', t/20);
            } else if (t >= 20 && t < 40) {
                hillColor1 = this.interpolateColor('#4ade80', '#16a34a', (t-20)/20);
                hillColor2 = this.interpolateColor('#22c55e', '#15803d', (t-20)/20);
            } else if (t >= 40 && t < 60) {
                hillColor1 = this.interpolateColor('#16a34a', '#0d2414', (t-40)/20);
                hillColor2 = this.interpolateColor('#15803d', '#081a0d', (t-40)/20);
            } else {
                hillColor1 = this.interpolateColor('#0d2414', '#0f351b', (t-60)/20);
                hillColor2 = this.interpolateColor('#081a0d', '#0a2914', (t-60)/20);
            }
        } else if (this.selectedSeason === 'autumn') {
            if (t >= 0 && t < 20) {
                hillColor1 = this.interpolateColor('#4c1c04', '#b45309', t/20);
                hillColor2 = this.interpolateColor('#3f1502', '#9a3412', t/20);
            } else if (t >= 20 && t < 40) {
                hillColor1 = this.interpolateColor('#b45309', '#3a1202', (t-20)/20);
                hillColor2 = this.interpolateColor('#9a3412', '#2c0d01', (t-20)/20);
            } else if (t >= 40 && t < 60) {
                hillColor1 = this.interpolateColor('#3a1202', '#1e0801', (t-40)/20);
                hillColor2 = this.interpolateColor('#2c0d01', '#160500', (t-40)/20);
            } else {
                hillColor1 = this.interpolateColor('#1e0801', '#4c1c04', (t-60)/20);
                hillColor2 = this.interpolateColor('#160500', '#3f1502', (t-60)/20);
            }
        } else if (this.selectedSeason === 'winter') {
            if (t >= 0 && t < 20) {
                hillColor1 = this.interpolateColor('#ffedd5', '#ffffff', t/20); // warm apricot white to pure snowy white
                hillColor2 = this.interpolateColor('#fed7aa', '#e0f2fe', t/20); // warm gold-peach to glacier blue-white
            } else if (t >= 20 && t < 40) {
                hillColor1 = this.interpolateColor('#ffffff', '#ffe4e6', (t-20)/20); // pure white to soft rose-white
                hillColor2 = this.interpolateColor('#e0f2fe', '#fbcfe8', (t-20)/20); // glacier white-blue to rose reflection
            } else if (t >= 40 && t < 60) {
                hillColor1 = this.interpolateColor('#ffe4e6', '#dbeafe', (t-40)/20); // rose-white to bright ice-blue white
                hillColor2 = this.interpolateColor('#fbcfe8', '#93c5fd', (t-40)/20); // rose-pink to bright sky-blue
            } else {
                hillColor1 = this.interpolateColor('#dbeafe', '#ffedd5', (t-60)/20);
                hillColor2 = this.interpolateColor('#93c5fd', '#fed7aa', (t-60)/20);
            }
        } else {
            if (t >= 0 && t < 20) {
                hillColor1 = this.interpolateColor('#0f2d1e', '#15803d', t/20);
                hillColor2 = this.interpolateColor('#0a2215', '#166534', t/20);
            } else if (t >= 20 && t < 40) {
                hillColor1 = this.interpolateColor('#15803d', '#14351f', (t-20)/20);
                hillColor2 = this.interpolateColor('#166534', '#0f2817', (t-20)/20);
            } else if (t >= 40 && t < 60) {
                hillColor1 = this.interpolateColor('#14351f', '#021a11', (t-40)/20);
                hillColor2 = this.interpolateColor('#0f2817', '#01150a', (t-40)/20);
            } else {
                hillColor1 = this.interpolateColor('#021a11', '#0f2d1e', (t-60)/20);
                hillColor2 = this.interpolateColor('#01150a', '#0a2215', (t-60)/20);
            }
        }

        // Hill 1
        this.ctx.fillStyle = hillColor1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 600);
        this.ctx.quadraticCurveTo(this.width * 0.35, 500, this.width, 630);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.closePath();
        this.ctx.fill();

        // Hill 2
        this.ctx.fillStyle = hillColor2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 650);
        this.ctx.quadraticCurveTo(this.width * 0.67, 540, this.width, 680);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw flower coordinates
        if (this.scenery && this.scenery.flowers) {
            this.scenery.flowers.forEach(flower => {
                this.ctx.save();
                this.ctx.fillStyle = flower.color;
                
                // Bioluminescent glows at night
                if (t >= 45 && t < 75) {
                    this.ctx.shadowBlur = 4;
                    this.ctx.shadowColor = flower.color;
                }
                
                this.ctx.beginPath();
                this.ctx.arc(flower.x, flower.y, flower.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Tiny gold flower centers for bigger ones
                if (flower.size > 3.2) {
                    this.ctx.shadowBlur = 0;
                    this.ctx.fillStyle = '#fbbf24';
                    this.ctx.beginPath();
                    this.ctx.arc(flower.x, flower.y, flower.size * 0.3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.restore();
            });
        }

    }

    drawCelestialStars() {
        const t = this.celestialTime;
        let nightFactor = 0;

        if (t >= 40 && t < 60) {
            nightFactor = (t - 40) / 20;
        } else if (t >= 60 && t < 80) {
            nightFactor = 1 - (t - 60) / 20;
        }

        if (nightFactor <= 0) return;

        this.ctx.save();
        this.stars.forEach(star => {
            const twinkle = Math.sin(this.gameTimer * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${nightFactor * twinkle})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    updateSceneryAnimation(dt) {
        // Progress clouds
        if (this.scenery && this.scenery.clouds) {
            this.scenery.clouds.forEach(cloud => {
                cloud.x += cloud.speed * dt;
                if (cloud.x > this.width + 100) {
                    cloud.x = -100;
                    cloud.y = 60 + Math.random() * 120;
                }
            });
        }

        // Progress menu fish
        if (this.scenery && this.scenery.menuFish) {
            this.scenery.menuFish.forEach(fish => {
                fish.x += fish.speed * fish.dir * dt;
                fish.wigglePhase += dt * fish.wiggleSpeed;
                if (fish.dir > 0 && fish.x > this.width + 50) {
                    fish.x = -50;
                    fish.y = 150 + Math.random() * 300;
                } else if (fish.dir < 0 && fish.x < -50) {
                    fish.x = this.width + 50;
                    fish.y = 150 + Math.random() * 300;
                }
            });
        }

        // Sway seaweed
        this.plantSwayTimer = (this.plantSwayTimer || 0) + dt * 2.2;
    }

    drawUnderwaterScenery() {
        const ctx = this.ctx;
        
        // 1. Sandy bottom bed
        ctx.fillStyle = '#eab308'; // Golden sand
        ctx.beginPath();
        ctx.moveTo(0, 680);
        ctx.quadraticCurveTo(this.width * 0.5, 660, this.width, 680);
        ctx.lineTo(this.width, 720);
        ctx.lineTo(0, 720);
        ctx.closePath();
        ctx.fill();

        // Sandy highlights/waves
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.width * 0.12, 690);
        ctx.quadraticCurveTo(this.width * 0.25, 685, this.width * 0.38, 690);
        ctx.moveTo(this.width * 0.62, 695);
        ctx.quadraticCurveTo(this.width * 0.75, 690, this.width * 0.88, 695);
        ctx.stroke();

        // 2. Coral bushes on the sides
        // Left Pink Coral
        ctx.fillStyle = '#fb7185';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#fb7185';
        ctx.beginPath();
        ctx.arc(30, 690, 24, 0, Math.PI * 2);
        ctx.arc(60, 700, 18, 0, Math.PI * 2);
        ctx.arc(15, 710, 15, 0, Math.PI * 2);
        ctx.fill();

        // Right Mint Coral
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#34d399';
        ctx.beginPath();
        ctx.arc(this.width - 30, 690, 22, 0, Math.PI * 2);
        ctx.arc(this.width - 60, 700, 16, 0, Math.PI * 2);
        ctx.arc(this.width - 15, 710, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // 3. Swaying Seaweed
        if (this.scenery && this.scenery.seaweed) {
            const swayTimer = this.plantSwayTimer || 0;
            this.scenery.seaweed.forEach(plant => {
                ctx.save();
                ctx.strokeStyle = plant.color;
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(plant.x, 720);
                
                const segments = 5;
                const segmentHeight = plant.h / segments;
                let currentX = plant.x;
                let currentY = 720;
                
                for (let i = 0; i < segments; i++) {
                    const sway = Math.sin(swayTimer + i * 0.4 + plant.x) * 4;
                    const nextY = currentY - segmentHeight;
                    const nextX = currentX + sway;
                    ctx.quadraticCurveTo(currentX, currentY - segmentHeight * 0.5, nextX, nextY);
                    currentX = nextX;
                    currentY = nextY;
                }
                ctx.stroke();
                ctx.restore();
            });
        }

        // 4. Swimming Menu Fish (draw in background)
        if (this.scenery && this.scenery.menuFish) {
            this.scenery.menuFish.forEach(fish => {
                ctx.save();
                ctx.translate(fish.x, fish.y);
                if (fish.dir < 0) {
                    ctx.scale(-1, 1);
                }
                
                ctx.fillStyle = fish.color;
                ctx.strokeStyle = fish.color;
                
                // Tail wiggle
                const wiggle = Math.sin(fish.wigglePhase) * 6;

                // Tail fin
                ctx.beginPath();
                ctx.moveTo(-fish.size, 0);
                ctx.lineTo(-fish.size - 8, -6 + wiggle);
                ctx.lineTo(-fish.size - 5, wiggle);
                ctx.lineTo(-fish.size - 8, 6 + wiggle);
                ctx.closePath();
                ctx.fill();

                // Body
                ctx.beginPath();
                ctx.ellipse(0, 0, fish.size, fish.size * 0.65, 0, 0, Math.PI * 2);
                ctx.fill();

                // Dorsal / Pectoral Fin
                ctx.beginPath();
                ctx.moveTo(0, -fish.size * 0.6);
                ctx.quadraticCurveTo(-fish.size * 0.5, -fish.size * 1.1, -fish.size * 0.8, -fish.size * 0.4);
                ctx.closePath();
                ctx.fill();

                // Eye
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(fish.size * 0.5, -fish.size * 0.15, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(fish.size * 0.55, -fish.size * 0.15, 0.9, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            });
        }
    }

    togglePause() {
        if (!this.isPlaying || this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.ui.pauseScreen.classList.remove('hidden');
            if (this.player && this.player.isCharging) {
                this.player.isCharging = false;
            }
            if (window.sounds) {
                window.sounds.stopCharge();
            }
        } else {
            this.ui.pauseScreen.classList.add('hidden');
            this.lastTime = performance.now(); // reset timer to prevent frame skips
        }
    }

    quitToTitle() {
        this.isPaused = false;
        this.isPlaying = false;
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        
        // Clear all active gameplay entities so the main menu background is clean
        this.player = null;
        this.projectiles = [];
        this.enemies = [];
        this.bosses = [];
        this.particles = [];
        this.powerups = [];

        this.ui.pauseScreen.classList.add('hidden');
        this.ui.startScreen.classList.remove('hidden');
        this.ui.gameOverScreen.classList.add('hidden');
        this.ui.bossAlert.classList.remove('active');
        this.ui.powerupToast.classList.add('hidden');
        this.ui.container.classList.remove('game-active'); // Hide virtual controls on Title return
        this.activePowerup = null;
        this.powerupTimer = 0;
        this.updateHUD();
    }

    drawOceanBackground() {
        const ctx = this.ctx;
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        oceanGrad.addColorStop(0, '#020617'); // Dark deep blue top
        oceanGrad.addColorStop(0.4, '#075985'); // Indigo-blue mid
        oceanGrad.addColorStop(1, '#0c4a6e'); // Teal-blue bottom
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Atmospheric light rays shining down
        ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
        ctx.beginPath();
        ctx.moveTo(150, 0);
        ctx.lineTo(250, 0);
        ctx.lineTo(350, this.height);
        ctx.lineTo(100, this.height);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(450, 0);
        ctx.lineTo(580, 0);
        ctx.lineTo(700, this.height);
        ctx.lineTo(380, this.height);
        ctx.closePath();
        ctx.fill();
    }

    drawCelestialBodies() {
        const t = this.celestialTime;
        
        if (t >= 0 && t < 45) {
            const sunProgress = t / 45; 
            const sunX = sunProgress * (this.width + 100) - 50;
            const sunY = 220 - 160 * Math.sin(sunProgress * Math.PI); 

            this.ctx.save();
            this.ctx.shadowBlur = 40;
            this.ctx.shadowColor = 'rgba(251, 146, 60, 0.4)';
            
            const sunGrad = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 30);
            sunGrad.addColorStop(0, '#ffffff');
            sunGrad.addColorStop(0.3, '#fef08a'); 
            sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');

            this.ctx.fillStyle = sunGrad;
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        if (t >= 40 && t < 80) {
            const moonProgress = (t - 40) / 40; 
            const moonX = moonProgress * (this.width + 100) - 50;
            const moonY = 220 - 150 * Math.sin(moonProgress * Math.PI);

            this.ctx.save();
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = 'rgba(186, 230, 253, 0.35)';

            ctxTranslateMoon(this.ctx, moonX, moonY);
            this.ctx.restore();
        }
    }

    drawAmbientOverlay() {
        const t = this.celestialTime;
        let overlayColor = null;

        if (t >= 55 && t < 65) {
            overlayColor = 'rgba(13, 12, 45, 0.1)';
        } else if (t >= 45 && t < 55) {
            const strength = (t - 45) / 10 * 0.1;
            overlayColor = `rgba(13, 12, 45, ${strength})`;
        } else if (t >= 65 && t < 75) {
            const strength = (1 - (t - 65) / 10) * 0.1;
            overlayColor = `rgba(13, 12, 45, ${strength})`;
        }

        if (overlayColor) {
            this.ctx.fillStyle = overlayColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    drawChargeBar() {
        if (!this.player.isCharging || this.player.chargeLevel <= 0) return;

        const barWidth = 80;
        const barHeight = 8;
        const x = this.player.x + this.player.width / 2 - barWidth / 2;
        const y = this.player.y - 45; 

        this.ctx.save();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00f0ff';
        
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, barWidth, barHeight, 4);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.shadowBlur = 0; 

        const fillWidth = barWidth * (this.player.chargeLevel / this.player.maxCharge);
        
        const fillGrad = this.ctx.createLinearGradient(x, 0, x + barWidth, 0);
        fillGrad.addColorStop(0, '#00f0ff'); 
        fillGrad.addColorStop(0.5, '#38bdf8'); 
        fillGrad.addColorStop(1, '#a855f7'); 

        this.ctx.fillStyle = fillGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, fillWidth, barHeight, 4);
        this.ctx.fill();

        if (this.player.chargeLevel >= this.player.maxCharge) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 8px Orbitron, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MAX POWER', this.player.x + this.player.width / 2, y - 6);
        }

        this.ctx.restore();
    }
}

function ctxTranslateMoon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 6);
    
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7, -3, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

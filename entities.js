// Upgraded Entities for Aqua Drones with multiple drone types and Sanrio bosses

class WaterGun {
    constructor(canvasWidth, canvasHeight) {
        this.width = 70;
        this.height = 40;
        this.x = canvasWidth / 2 - this.width / 2;
        this.y = canvasHeight - this.height - 20; // 20px off bottom
        this.speed = 500; // Pixels per second (faster for wider screen!)
        this.chargeLevel = 0; // 0 to 1
        this.maxCharge = 1;
        this.chargeSpeed = 0.8; // Takes ~1.25s to full charge
        this.isCharging = false;
        
        // Visual variables
        this.color = '#3b82f6';
        this.pulseTime = 0;
    }

    update(dt, keys, canvasWidth) {
        // Horizontal Movement
        let moveDir = 0;
        if (keys['ArrowLeft'] || keys['KeyA'] || keys['a'] || keys['A']) {
            moveDir -= 1;
        }
        if (keys['ArrowRight'] || keys['KeyD'] || keys['d'] || keys['D']) {
            moveDir += 1;
        }

        this.x += moveDir * this.speed * dt;
        
        // Keep in bounds
        if (this.x < 10) this.x = 10;
        if (this.x > canvasWidth - this.width - 10) this.x = canvasWidth - this.width - 10;

        // Handle Charging logic
        if (keys['Space'] || keys[' '] || keys['KeyJ'] || keys['j'] || keys['J']) {
            if (!this.isCharging) {
                this.isCharging = true;
                if (window.sounds) window.sounds.startCharge();
            }
            this.chargeLevel = Math.min(this.maxCharge, this.chargeLevel + this.chargeSpeed * dt);
            if (window.sounds) window.sounds.updateCharge(this.chargeLevel);
        } else {
            if (this.isCharging) {
                this.isCharging = false;
                if (window.sounds) window.sounds.stopCharge();
            }
        }

        this.pulseTime += dt * 5;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Draw futuristic tank base shadow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';

        // 1. Tank Base (Metallic dark grey)
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -5, this.width, this.height / 2 + 5, 8);
        ctx.fill();
        ctx.stroke();

        // 2. Wheels
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-this.width / 2 + 4, 10, 10, 8);
        ctx.fillRect(this.width / 2 - 14, 10, 10, 8);
        
        // 3. Water Tank
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.beginPath();
        ctx.roundRect(-this.width / 3, -15, (this.width / 3) * 2, 12, 4);
        ctx.fill();
        ctx.stroke();

        // Water level inside tank based on charge
        if (this.chargeLevel > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(-this.width / 3 + 2, -13, ((this.width / 3) * 2 - 4), 8, 2);
            ctx.clip();
            
            const grad = ctx.createLinearGradient(-this.width / 3, 0, this.width / 3, 0);
            grad.addColorStop(0, '#22d3ee');
            grad.addColorStop(0.5, '#06b6d4');
            grad.addColorStop(1, '#0891b2');
            
            ctx.fillStyle = grad;
            const waterWidth = ((this.width / 3) * 2 - 4) * this.chargeLevel;
            ctx.fillRect(-this.width / 3 + 2, -15, waterWidth, 15);
            ctx.restore();
        }

        // 4. Cannon Barrel
        let barrelColor = '#475569';
        let strokeColor = '#94a3b8';
        let glowSize = 0;
        
        if (this.chargeLevel > 0) {
            glowSize = this.chargeLevel * 20;
            ctx.shadowBlur = glowSize;
            ctx.shadowColor = '#00f0ff';
            
            const r = Math.floor(71 + (6 - 71) * this.chargeLevel);
            const g = Math.floor(85 + (182 - 85) * this.chargeLevel);
            const b = Math.floor(105 + (212 - 105) * this.chargeLevel);
            barrelColor = `rgb(${r}, ${g}, ${b})`;
            strokeColor = '#22d3ee';
        }

        ctx.fillStyle = barrelColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        ctx.roundRect(-8, -25, 16, 12, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-6, -28, 12, 4);

        if (this.chargeLevel > 0) {
            ctx.beginPath();
            ctx.arc(0, -28, 4 + this.chargeLevel * 12, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.1 + this.chargeLevel * 0.4})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, -28, 2 + this.chargeLevel * 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class WaterProjectile {
    constructor(x, y, chargeLevel, isRocket = false, vx = 0, vy = null, isLaser = false) {
        this.x = x;
        this.y = y;
        
        this.charge = chargeLevel;
        this.radius = 6 + chargeLevel * 14; 
        this.damage = 1 + chargeLevel * 8; // 1 to 9 damage
        this.speed = 600 - chargeLevel * 150; 
        this.isRocket = isRocket;
        this.isLaser = isLaser;
        this.hitTargets = []; // Stores references of enemies/bosses already hit to support piercing
        
        // Speed up rocket bullets
        if (this.isRocket) {
            this.speed *= 1.35;
        }

        // Projectile direction speeds
        this.vx = vx;
        this.vy = vy !== null ? vy : -this.speed;

        this.color = '#38bdf8';
        this.trail = [];
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.trail.push({ x: this.x, y: this.y, r: this.radius });
        if (this.trail.length > 8) {
            this.trail.shift();
        }
    }

    draw(ctx) {
        ctx.save();
        
        if (this.isLaser) {
            // Draw neon laser trail
            this.trail.forEach((pos, idx) => {
                const opacity = idx / this.trail.length;
                const size = pos.r * (0.4 + 0.6 * (idx / this.trail.length));
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 204, ${opacity * 0.45})`; 
                ctx.fill();
            });

            // Main laser bolt capsule
            ctx.translate(this.x, this.y);
            ctx.shadowBlur = 15 + this.charge * 20;
            ctx.shadowColor = '#00ffcc';

            const height = this.radius * 2.8;
            const width = this.radius * 0.9;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.roundRect(-width / 2, -height / 2, width, height, width / 2);
            ctx.fill();
            ctx.stroke();

        } else if (this.isRocket) {
            // Draw rocket tail fire trail
            this.trail.forEach((pos, idx) => {
                const opacity = idx / this.trail.length;
                const size = pos.r * (0.3 + 0.7 * (idx / this.trail.length));
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(249, 115, 22, ${opacity * 0.45})`; 
                ctx.fill();
            });

            // Main rocket shape
            ctx.translate(this.x, this.y);
            ctx.shadowBlur = 12 + this.charge * 15;
            ctx.shadowColor = '#f97316'; 

            // Fins
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.6, this.radius);
            ctx.lineTo(-this.radius, this.radius * 1.5);
            ctx.lineTo(-this.radius * 0.4, this.radius * 1.5);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(this.radius * 0.4, this.radius * 1.5);
            ctx.lineTo(this.radius, this.radius * 1.5);
            ctx.lineTo(this.radius * 0.6, this.radius);
            ctx.closePath();
            ctx.fill();

            // Rocket Body Cylinder
            const bodyGrad = ctx.createLinearGradient(-this.radius * 0.5, 0, this.radius * 0.5, 0);
            bodyGrad.addColorStop(0, '#f8fafc'); 
            bodyGrad.addColorStop(0.5, '#cbd5e1');
            bodyGrad.addColorStop(1, '#94a3b8');
            ctx.fillStyle = bodyGrad;
            
            ctx.beginPath();
            ctx.roundRect(-this.radius * 0.5, -this.radius * 0.8, this.radius, this.radius * 1.8, [this.radius * 0.5, this.radius * 0.5, 2, 2]);
            ctx.fill();

            // Rocket Red Nose Cone tip
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -this.radius * 0.8, this.radius * 0.5, Math.PI, 0);
            ctx.fill();

            // Fire nozzle flame details
            ctx.fillStyle = '#fbbf24'; 
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.25, this.radius);
            ctx.lineTo(0, this.radius + this.radius * (0.8 + Math.random() * 0.6));
            ctx.lineTo(this.radius * 0.25, this.radius);
            ctx.closePath();
            ctx.fill();

        } else {
            // Draw standard water bullet
            this.trail.forEach((pos, idx) => {
                const opacity = idx / this.trail.length;
                const size = pos.r * (0.3 + 0.7 * (idx / this.trail.length));
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(56, 189, 248, ${opacity * 0.35})`;
                ctx.fill();
            });

            ctx.shadowBlur = 10 + this.charge * 15;
            ctx.shadowColor = '#00f0ff';
            
            const grad = ctx.createRadialGradient(
                this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.1,
                this.x, this.y, this.radius
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, '#38bdf8');
            grad.addColorStop(1, '#0284c7');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    isOffscreen(canvasWidth = 800) {
        return this.y < -this.radius || this.x < -this.radius || this.x > canvasWidth + this.radius;
    }
}

class Drone {
    constructor(canvasWidth, type = 'standard') {
        this.canvasWidth = canvasWidth;
        this.type = type; // 'standard', 'fast', 'armored'
        
        const pastelColors = [
            { body: '#fecdd3', ears: '#fda4af', accent: '#e11d48' }, // Pink
            { body: '#e0f2fe', ears: '#bae6fd', accent: '#0284c7' }, // Blue
            { body: '#fef9c3', ears: '#fef08a', accent: '#ca8a04' }, // Yellow
            { body: '#f3e8ff', ears: '#e9d5ff', accent: '#9333ea' }  // Purple
        ];
        
        this.style = pastelColors[Math.floor(Math.random() * pastelColors.length)];
        this.radius = 20 + Math.random() * 5; 
        
        this.x = this.radius + Math.random() * (canvasWidth - this.radius * 2);
        this.y = -this.radius - 10;
        
        // Base Speed setup
        const baseSpeed = 80 + Math.random() * 50;
        
        if (this.type === 'fast') {
            this.speed = baseSpeed * 1.6; // 60% faster
            this.hp = 1;
        } else if (this.type === 'armored') {
            this.speed = baseSpeed * 0.85; // Slightly slower
            this.hp = 3; // 3 health points
        } else if (this.type === 'swerve') {
            this.speed = baseSpeed * 1.05; 
            this.hp = 1;
            this.swerveTimer = Math.random() * 100;
            this.swerveSpeed = 3.5 + Math.random() * 1.8;
            this.swerveAmplitude = 100 + Math.random() * 60;
            this.startX = this.x;
            this.style = { body: '#a7f3d0', ears: '#6ee7b7', accent: '#059669' }; // Custom mint green
        } else {
            this.speed = baseSpeed;
            this.hp = 1;
        }
        
        this.maxHp = this.hp;
        this.wingTimer = Math.random() * 100;
    }

    update(dt, difficultyMultiplier) {
        this.y += this.speed * difficultyMultiplier * dt;
        
        if (this.type === 'swerve') {
            this.swerveTimer += dt * this.swerveSpeed;
            this.x = this.startX + Math.sin(this.swerveTimer) * this.swerveAmplitude;
            // Keep inside screen bounds
            if (this.x < this.radius + 10) this.x = this.radius + 10;
            if (this.x > this.canvasWidth - this.radius - 10) this.x = this.canvasWidth - this.radius - 10;
        }

        this.wingTimer += dt * (this.type === 'fast' ? 24 : 15);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Tilt swerving drone into direction of movement
        if (this.type === 'swerve') {
            const tilt = Math.cos(this.swerveTimer) * 0.22; // tilt radians
            ctx.rotate(tilt);
        }

        // 1. Draw visual effects for Speed Buff (Lightning trail behind drone)
        if (this.type === 'fast') {
            ctx.save();
            ctx.strokeStyle = '#facc15'; // Solid bright yellow
            ctx.shadowColor = '#fef08a'; // Neon yellow glow
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2.5;
            
            // Left Lightning Bolt
            ctx.beginPath();
            ctx.moveTo(-10, -this.radius);
            ctx.lineTo(-14, -this.radius - 12);
            ctx.lineTo(-7, -this.radius - 9);
            ctx.lineTo(-12, -this.radius - 22);
            ctx.stroke();

            // Right Lightning Bolt
            ctx.beginPath();
            ctx.moveTo(10, -this.radius);
            ctx.lineTo(6, -this.radius - 12);
            ctx.lineTo(13, -this.radius - 9);
            ctx.lineTo(8, -this.radius - 22);
            ctx.stroke();
            ctx.restore();
        }

        // 2. Wings (Flapping propellers)
        const wingOffset = Math.sin(this.wingTimer) * 12;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeStyle = this.style.ears;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.ellipse(-this.radius - 4, -4 + wingOffset / 3, 12, 6, -Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(this.radius + 4, -4 - wingOffset / 3, 12, 6, Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3. Ears
        ctx.fillStyle = this.style.ears;
        ctx.beginPath();
        ctx.ellipse(-this.radius + 2, -2, 10, 15, Math.PI / 8, 0, Math.PI * 2);
        ctx.ellipse(this.radius - 2, -2, 10, 15, -Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();

        // 4. Main Body
        ctx.fillStyle = this.style.body;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; 

        // Inner ears highlight
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-this.radius + 2, -1, 5, 8, Math.PI / 8, 0, Math.PI * 2);
        ctx.ellipse(this.radius - 2, -1, 5, 8, -Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();

        // 5. Face (Cute Sanrio eyes and nose)
        ctx.fillStyle = '#374151';
        const eyeOffset = this.radius * 0.35;
        ctx.beginPath();
        ctx.arc(-eyeOffset, 0, 2.5, 0, Math.PI * 2);
        ctx.arc(eyeOffset, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-eyeOffset - 0.7, -0.7, 0.8, 0, Math.PI * 2);
        ctx.arc(eyeOffset - 0.7, -0.7, 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(251, 113, 133, 0.5)';
        ctx.beginPath();
        ctx.arc(-eyeOffset - 4, 4, 3.5, 0, Math.PI * 2);
        ctx.arc(eyeOffset + 4, 4, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // 6. Draw visual effects for Health Buff (Translucent Energy Shield Bubble)
        if (this.type === 'armored') {
            ctx.save();
            
            let shieldColor = 'rgba(0, 240, 255, 0.75)'; // Cyan (Full)
            let fillColor = 'rgba(0, 240, 255, 0.12)';
            
            if (this.hp === 2) {
                shieldColor = 'rgba(234, 179, 8, 0.75)'; // Yellow (Damaged)
                fillColor = 'rgba(234, 179, 8, 0.12)';
            } else if (this.hp === 1) {
                shieldColor = 'rgba(239, 68, 68, 0.75)'; // Red (Critical)
                fillColor = 'rgba(239, 68, 68, 0.12)';
            }

            ctx.shadowBlur = 12;
            ctx.shadowColor = shieldColor;
            ctx.strokeStyle = shieldColor;
            ctx.fillStyle = fillColor;
            ctx.lineWidth = 2.5;

            // Draw bubble energy sphere slightly larger than the drone body
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw mini shield generator pads on wings
            ctx.shadowBlur = 0; 
            ctx.fillStyle = '#94a3b8';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            
            // Left pad
            ctx.fillRect(-this.radius - 8, -5, 4, 10);
            ctx.strokeRect(-this.radius - 8, -5, 4, 10);
            
            // Right pad
            ctx.fillRect(this.radius + 4, -5, 4, 10);
            ctx.strokeRect(this.radius + 4, -5, 4, 10);

            ctx.restore();
        }

        ctx.restore();
    }
}

class Boss {
    constructor(canvasWidth, gameTimer, bossType = 'kuromi') {
        this.bossType = bossType; // 'kuromi', 'kitty', 'melody', 'purin'
        this.radius = 38; 
        
        this.x = this.radius + Math.random() * (canvasWidth - this.radius * 2);
        this.y = -this.radius - 30;
        
        this.baseSpeed = 40;
        this.speed = this.baseSpeed + Math.min(60, gameTimer * 0.4); 

        // Adjust health points and speed based on character identity
        let hpMultiplier = 1.0;
        if (bossType === 'purin') {
            hpMultiplier = 1.4; // Purin has more health
            this.speed *= 0.8;
        } else if (bossType === 'kitty') {
            hpMultiplier = 0.85; // Kitty is slightly softer
            this.speed *= 1.25; // Kitty is faster
        }

        this.maxHp = Math.round((6 + gameTimer * 0.12) * hpMultiplier);
        this.currentHp = this.maxHp;

        // Custom theme colors for each boss
        switch (bossType) {
            case 'kuromi':
                this.primaryColor = '#0f0e17'; // Black
                this.accentColor = '#c026d3';  // Hot pink
                break;
            case 'kitty':
                this.primaryColor = '#ffffff'; // White
                this.accentColor = '#ef4444';  // Red bow
                break;
            case 'melody':
                this.primaryColor = '#f472b6'; // Pink hood
                this.accentColor = '#fdf2f8';  // Light cream face
                break;
            case 'purin':
                this.primaryColor = '#fef08a'; // Golden yellow body
                this.accentColor = '#78350f';  // Brown beret
                break;
        }
        
        this.wingTimer = 0;
        this.bobTimer = Math.random() * 100;
        this.bobSpeed = 2 + Math.random() * 2;
        this.bobAmplitude = 45; // Widespread sway on wider screen
        this.startX = this.x;
        this.canvasWidth = canvasWidth;
    }

    update(dt, difficultyMultiplier) {
        this.y += this.speed * difficultyMultiplier * dt;
        
        // Float side to side (bobbing)
        this.bobTimer += dt * this.bobSpeed;
        this.x = this.startX + Math.sin(this.bobTimer) * this.bobAmplitude;
        
        if (this.x < this.radius + 15) this.x = this.radius + 15;
        if (this.x > this.canvasWidth - this.radius - 15) this.x = this.canvasWidth - this.radius - 15;

        this.wingTimer += dt * 18;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const wingAngle = Math.sin(this.wingTimer) * 0.45;
        ctx.lineWidth = 2.5;

        // 1. Draw character specific wings & features
        if (this.bossType === 'kuromi') {
            // Kuromi bat wings
            ctx.fillStyle = '#0f0e17';
            ctx.strokeStyle = '#c026d3';
            
            [-1, 1].forEach(side => {
                ctx.save();
                ctx.translate(side * (this.radius - 5), 0);
                ctx.rotate(side * -wingAngle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(side * 15, -25, side * 35, -20, side * 40, -5);
                ctx.bezierCurveTo(side * 30, 5, side * 20, 5, side * 15, 12);
                ctx.bezierCurveTo(side * 10, 5, side * 5, 5, 0, 0);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            });
        } else if (this.bossType === 'kitty') {
            // Kitty angel white feather wings
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.strokeStyle = '#93c5fd'; // Light blue outline
            
            [-1, 1].forEach(side => {
                ctx.save();
                ctx.translate(side * (this.radius - 5), 5);
                ctx.rotate(side * -wingAngle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(side * 20, -18, side * 35, -15, side * 38, 2);
                ctx.bezierCurveTo(side * 28, 12, side * 18, 8, side * 12, 18);
                ctx.bezierCurveTo(side * 8, 8, side * 4, 6, 0, 0);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            });
        } else if (this.bossType === 'melody') {
            // My Melody butterfly wings (gradient pinks)
            const wingGrad = ctx.createLinearGradient(0, -15, 0, 15);
            wingGrad.addColorStop(0, '#f472b6');
            wingGrad.addColorStop(1, '#fbcfe8');
            ctx.fillStyle = wingGrad;
            ctx.strokeStyle = '#ec4899';
            
            [-1, 1].forEach(side => {
                ctx.save();
                ctx.translate(side * (this.radius - 6), 5);
                ctx.rotate(side * -wingAngle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(side * 25, -22, side * 35, -12, side * 32, 5);
                ctx.bezierCurveTo(side * 28, 14, side * 16, 8, 0, 0);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            });
        } else if (this.bossType === 'purin') {
            // Purin small fairy gold wings
            ctx.fillStyle = 'rgba(253, 224, 71, 0.75)';
            ctx.strokeStyle = '#eab308';
            
            [-1, 1].forEach(side => {
                ctx.save();
                ctx.translate(side * (this.radius - 6), 0);
                ctx.rotate(side * -wingAngle);
                ctx.beginPath();
                ctx.ellipse(side * 18, -4, 16, 8, side * Math.PI/12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            });
        }

        // 2. Draw Main Character Head Shape & Accessories
        if (this.bossType === 'kuromi') {
            // Kuromi Hood Jester Ears
            ctx.fillStyle = '#0f0e17';
            ctx.strokeStyle = '#c026d3';
            
            // Left ear
            ctx.beginPath();
            ctx.moveTo(-this.radius + 5, -5);
            ctx.quadraticCurveTo(-this.radius - 10, -this.radius - 15, -this.radius - 8, -this.radius - 22);
            ctx.quadraticCurveTo(-this.radius + 10, -this.radius - 5, -2, -this.radius + 15);
            ctx.fill(); ctx.stroke();
            // Right ear
            ctx.beginPath();
            ctx.moveTo(this.radius - 5, -5);
            ctx.quadraticCurveTo(this.radius + 10, -this.radius - 15, this.radius + 8, -this.radius - 22);
            ctx.quadraticCurveTo(this.radius - 10, -this.radius - 5, 2, -this.radius + 15);
            ctx.fill(); ctx.stroke();
            // Pom-poms
            ctx.fillStyle = '#c026d3';
            ctx.beginPath();
            ctx.arc(-this.radius - 8, -this.radius - 23, 6, 0, Math.PI * 2);
            ctx.arc(this.radius + 8, -this.radius - 23, 6, 0, Math.PI * 2);
            ctx.fill();

            // Head shape
            ctx.fillStyle = '#0f0e17';
            ctx.beginPath();
            ctx.arc(0, 5, this.radius, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // White face shape
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 7, this.radius * 0.75, this.radius * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();

            // Collar
            ctx.fillStyle = '#c026d3';
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.6, this.radius * 0.6);
            ctx.lineTo(-this.radius * 0.3, this.radius * 0.9);
            ctx.lineTo(0, this.radius * 0.6);
            ctx.lineTo(this.radius * 0.3, this.radius * 0.9);
            ctx.lineTo(this.radius * 0.6, this.radius * 0.6);
            ctx.closePath();
            ctx.fill();

            // Slanted Eyes
            ctx.fillStyle = '#0f0e17';
            [-1, 1].forEach(side => {
                ctx.save();
                ctx.translate(side * 12, 4);
                ctx.rotate(side * Math.PI / 10);
                ctx.beginPath();
                ctx.ellipse(0, 0, 3.5, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            ctx.fillStyle = '#c026d3';
            ctx.beginPath();
            ctx.arc(-11, 0, 1.2, 0, Math.PI * 2);
            ctx.arc(15, 0, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Cute Smirk
            ctx.strokeStyle = '#0f0e17';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 9, 3, 0, Math.PI);
            ctx.stroke();

            // Forehead Skull Logo
            ctx.fillStyle = '#c026d3';
            ctx.beginPath();
            ctx.arc(0, -10, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-3, -5, 6, 3);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-1.5, -10, 1, 0, Math.PI * 2);
            ctx.arc(1.5, -10, 1, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.bossType === 'kitty') {
            // Hello Kitty
            // Main Head
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#64748b';
            ctx.beginPath();
            ctx.ellipse(0, 4, this.radius, this.radius * 0.8, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Cat Ears
            ctx.beginPath();
            ctx.moveTo(-this.radius + 8, -this.radius * 0.4);
            ctx.lineTo(-this.radius + 3, -this.radius - 2);
            ctx.lineTo(-this.radius + 20, -this.radius * 0.6);
            ctx.fill(); ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.radius - 8, -this.radius * 0.4);
            ctx.lineTo(this.radius - 3, -this.radius - 2);
            ctx.lineTo(this.radius - 20, -this.radius * 0.6);
            ctx.fill(); ctx.stroke();

            // Huge Red Bow (Left Ear Base)
            ctx.fillStyle = '#ef4444';
            ctx.strokeStyle = '#7f1d1d';
            
            // Left loop
            ctx.beginPath();
            ctx.ellipse(-this.radius + 8, -this.radius * 0.7, 11, 8, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            // Right loop
            ctx.beginPath();
            ctx.ellipse(-this.radius + 24, -this.radius * 0.7, 11, 8, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            // Center knot
            ctx.beginPath();
            ctx.arc(-this.radius + 16, -this.radius * 0.7, 5, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Eyes (Vertical Ovals)
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.ellipse(-12, 4, 3, 4.5, 0, 0, Math.PI * 2);
            ctx.ellipse(12, 4, 3, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Nose (Small Yellow Horizontal Oval)
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.ellipse(0, 9, 3.5, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Whiskers (3 lines on each side)
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.0;
            // Left whiskers
            [-4, 0, 4].forEach(offset => {
                ctx.beginPath();
                ctx.moveTo(-this.radius + 4, 6 + offset);
                ctx.lineTo(-this.radius - 8, 6 + offset * 1.5);
                ctx.stroke();
            });
            // Right whiskers
            [-4, 0, 4].forEach(offset => {
                ctx.beginPath();
                ctx.moveTo(this.radius - 4, 6 + offset);
                ctx.lineTo(this.radius + 8, 6 + offset * 1.5);
                ctx.stroke();
            });

        } else if (this.bossType === 'melody') {
            // My Melody
            // Hood outline circle
            ctx.fillStyle = '#f472b6'; // Hot Pink Hood
            ctx.strokeStyle = '#db2777';
            ctx.beginPath();
            ctx.arc(0, 6, this.radius, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Long floppy rabbit ears
            // Left Ear (straight)
            ctx.beginPath();
            ctx.ellipse(-14, -this.radius + 4, 11, 24, Math.PI / 16, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            
            // Right Ear (bent down)
            ctx.save();
            ctx.translate(14, -this.radius + 10);
            ctx.beginPath();
            ctx.ellipse(0, -10, 10, 16, -Math.PI / 8, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            ctx.restore();

            // Inner ears highlight
            ctx.fillStyle = '#fbcfe8';
            ctx.beginPath();
            ctx.ellipse(-14, -this.radius + 4, 5, 16, Math.PI / 16, 0, Math.PI * 2);
            ctx.fill();

            // White face cutout
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 10, this.radius * 0.72, this.radius * 0.58, 0, 0, Math.PI * 2);
            ctx.fill();

            // Yellow nose and small eyes
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(-11, 8, 2.5, 0, Math.PI * 2);
            ctx.arc(11, 8, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.ellipse(0, 12, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Flower accessory on hood (near right ear base)
            ctx.save();
            ctx.translate(22, -this.radius + 22);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#db2777';
            ctx.lineWidth = 1;
            // Petals
            for (let i = 0; i < 5; i++) {
                ctx.rotate((Math.PI * 2) / 5);
                ctx.beginPath();
                ctx.arc(0, -4, 4, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
            }
            // Flower Center
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

        } else if (this.bossType === 'purin') {
            // Pompompurin
            // Main round body (slightly oval)
            ctx.fillStyle = '#fef08a'; // Golden yellow body
            ctx.strokeStyle = '#ca8a04';
            ctx.beginPath();
            ctx.ellipse(0, 4, this.radius + 2, this.radius * 0.9, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Floppy ears on sides
            ctx.beginPath();
            ctx.ellipse(-this.radius + 1, 0, 9, 14, Math.PI / 6, 0, Math.PI * 2);
            ctx.ellipse(this.radius - 1, 0, 9, 14, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Brown Beret Hat on head top
            ctx.fillStyle = '#78350f';
            ctx.strokeStyle = '#451a03';
            ctx.beginPath();
            ctx.ellipse(0, -this.radius + 4, 15, 6, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            // Small stem
            ctx.fillRect(-1.5, -this.radius - 6, 3, 5);

            // Simple cute eyes and mouth (・3・)
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(-11, 4, 2.5, 0, Math.PI * 2);
            ctx.arc(11, 4, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Nose/Mouth loop
            ctx.lineWidth = 2.0;
            ctx.strokeStyle = '#78350f';
            ctx.beginPath();
            ctx.moveTo(0, 6);
            ctx.quadraticCurveTo(-3, 8, -4, 10);
            ctx.moveTo(0, 6);
            ctx.quadraticCurveTo(3, 8, 4, 10);
            ctx.stroke();

            // Cheeks
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.beginPath();
            ctx.arc(-15, 9, 4, 0, Math.PI * 2);
            ctx.arc(15, 9, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // 3. Health Bar (Drawn ABOVE the boss)
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        const barWidth = 60;
        const barHeight = 6;
        const x = this.x - barWidth / 2;
        const y = this.y - this.radius - 20;

        ctx.save();

        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
        ctx.stroke();

        const pct = Math.max(0, this.currentHp / this.maxHp);
        const fillWidth = barWidth * pct;

        const fillGrad = ctx.createLinearGradient(x, 0, x + barWidth, 0);
        if (pct > 0.5) {
            fillGrad.addColorStop(0, '#c026d3'); 
            fillGrad.addColorStop(1, '#ec4899'); 
        } else {
            fillGrad.addColorStop(0, '#f43f5e'); 
            fillGrad.addColorStop(1, '#c026d3'); 
        }

        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, fillWidth, barHeight, 3);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 8px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        // Capitalize boss type name
        const bossName = this.bossType.toUpperCase();
        ctx.fillText(`${bossName}: ${Math.ceil(this.currentHp)}/${this.maxHp}`, this.x, y - 5);

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, type, color = '#38bdf8') {
        this.x = x;
        this.y = y;
        this.type = type; 
        this.color = color;
        
        const angle = Math.random() * Math.PI * 2;
        
        if (type === 'bubble') {
            this.vx = (Math.random() - 0.5) * 15;
            this.vy = -10 - Math.random() * 40; 
            this.radius = 1 + Math.random() * 5;
            this.alpha = 0.1 + Math.random() * 0.4;
            this.life = 4 + Math.random() * 6; 
            this.maxLife = this.life;
        } else if (type === 'splash') {
            const speed = 100 + Math.random() * 150;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 50; 
            this.radius = 2 + Math.random() * 4;
            this.alpha = 1.0;
            this.life = 0.3 + Math.random() * 0.3; 
            this.maxLife = this.life;
        } else if (type === 'snow' || type === 'leaf' || type === 'petal') {
            this.vx = (Math.random() - 0.5) * 45;
            this.vy = 40 + Math.random() * 60; 
            this.radius = 2 + Math.random() * 4;
            this.alpha = 0.4 + Math.random() * 0.4;
            this.life = 12 + Math.random() * 4; 
            this.maxLife = this.life;
        } else {
            const speed = 150 + Math.random() * 250;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = 3 + Math.random() * 5;
            this.alpha = 1.0;
            this.life = 0.5 + Math.random() * 0.4;
            this.maxLife = this.life;
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        if (this.type === 'splash') {
            this.vy += 400 * dt; 
        }

        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        if (this.type === 'bubble') {
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'snow') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'leaf') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.y * 0.02 + this.x * 0.01);
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 1.5, this.radius * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (this.type === 'petal') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.y * 0.015 - this.x * 0.015);
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 1.3, this.radius * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (this.type === 'splash') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Powerup {
    constructor(canvasWidth) {
        this.radius = 18;
        this.x = this.radius + Math.random() * (canvasWidth - this.radius * 2);
        this.y = -this.radius - 10;
        this.speed = 120;
        
        // Distribution: 30% explosive rocket, 30% spread shotgun, 25% piercing laser, 15% heart recovery
        const rand = Math.random();
        if (rand < 0.30) {
            this.type = 'rocket';
        } else if (rand < 0.60) {
            this.type = 'spread';
        } else if (rand < 0.85) {
            this.type = 'laser';
        } else {
            this.type = 'heart';
        }

        this.pulseAngle = 0;
    }

    update(dt) {
        this.y += this.speed * dt;
        this.pulseAngle += dt * 5;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Core glow sizing
        const glowPulse = Math.sin(this.pulseAngle) * 4;
        const finalRadius = this.radius + glowPulse * 0.5;

        // Custom shadow colors depending on type
        let glowColor = '#00f0ff';
        let innerColor = '#e0f7fa';
        let strokeColor = '#0891b2';
        
        if (this.type === 'rocket') {
            glowColor = '#f97316';
            innerColor = '#ffedd5';
            strokeColor = '#ea580c';
        } else if (this.type === 'spread') {
            glowColor = '#10b981'; // emerald green
            innerColor = '#d1fae5';
            strokeColor = '#047857';
        } else if (this.type === 'laser') {
            glowColor = '#00ffcc'; // neon green/cyan
            innerColor = '#e6fffa';
            strokeColor = '#0d9488';
        } else if (this.type === 'heart') {
            glowColor = '#ff007f';
            innerColor = '#ffe4e6';
            strokeColor = '#e11d48';
        }

        ctx.shadowBlur = 15 + glowPulse;
        ctx.shadowColor = glowColor;
        ctx.lineWidth = 2.5;

        // Draw bubble shell
        const bubbleGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, finalRadius);
        bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        bubbleGrad.addColorStop(0.3, innerColor + '40'); // translucent
        bubbleGrad.addColorStop(1, glowColor + '80'); 

        ctx.fillStyle = bubbleGrad;
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(0, 0, finalRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Specular bubble highlights for realistic glossy glass look
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(-finalRadius * 0.35, -finalRadius * 0.35, finalRadius * 0.45, Math.PI, Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(finalRadius * 0.35, finalRadius * 0.35, finalRadius * 0.45, 0, Math.PI * 0.5);
        ctx.stroke();

        ctx.shadowBlur = 0; 

        // Draw center icon symbol
        ctx.fillStyle = strokeColor;
        
        if (this.type === 'rocket') {
            // Draw Rocket shape capsule
            ctx.beginPath();
            ctx.roundRect(-4, -9, 8, 14, [4, 4, 1, 1]);
            ctx.fill();
            // fins
            ctx.beginPath();
            ctx.moveTo(-4, 1); ctx.lineTo(-8, 5); ctx.lineTo(-4, 5);
            ctx.moveTo(4, 1); ctx.lineTo(8, 5); ctx.lineTo(4, 5);
            ctx.fill();
            // fire tail
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(-2.5, 5); ctx.lineTo(0, 9); ctx.lineTo(2.5, 5);
            ctx.fill();
        } else if (this.type === 'spread') {
            // Draw Shotgun Spread icon (3 small circles spreading)
            ctx.fillStyle = strokeColor;
            ctx.beginPath();
            ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
            ctx.arc(-6, 3, 2.5, 0, Math.PI * 2);
            ctx.arc(6, 3, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 8); ctx.lineTo(0, -3.5);
            ctx.moveTo(0, 8); ctx.lineTo(-4.5, 1.5);
            ctx.moveTo(0, 8); ctx.lineTo(4.5, 1.5);
            ctx.stroke();
        } else if (this.type === 'laser') {
            // Draw piercing laser bolt icon (vertical line with two upward arrowheads)
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(0, 9);
            ctx.stroke();

            ctx.fillStyle = strokeColor;
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(-4, -5);
            ctx.lineTo(4, -5);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, -3);
            ctx.lineTo(-4, 1);
            ctx.lineTo(4, 1);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'heart') {
            // Draw Heart shape
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.bezierCurveTo(-5, -9, -9, -5, -9, 0);
            ctx.bezierCurveTo(-9, 4, -5, 8, 0, 11.5);
            ctx.bezierCurveTo(5, 8, 9, 4, 9, 0);
            ctx.bezierCurveTo(9, -5, 5, -9, 0, -4);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    isOffscreen(height) {
        return this.y > height + this.radius;
    }
}

// Attach classes to window
window.WaterGun = WaterGun;
window.WaterProjectile = WaterProjectile;
window.Drone = Drone;
window.Boss = Boss;
window.Particle = Particle;
window.Powerup = Powerup;

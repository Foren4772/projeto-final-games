let gameState = "menu";
let buttonStart, buttonAbout, buttonBack, buttonPrestige;
let player;
let particles = [];
let stars = [];
let autoClickTimer = 0;
let prestigeOrbs = [];
let upgrades = [];
let sounds = {};

// Configurações
const CLICK_RADIUS = 80;
const UPGRADE_X_POS = 20;
const UPGRADE_START_Y = 400;
const UPGRADE_HEIGHT = 30;
const UPGRADE_SPACING = 10;
const UPGRADE_WIDTH = 300;
const MAIN_CLICK_ELLIPSE_SIZE = 160;
const PRESTIGE_ORB_RADIUS = 120;
const AUTO_CLICK_FPS = 60;


let mainOrbRotation = 0;
let mainOrbPulse = 0;
let mainOrbPulsing = false;
let prestigeParticles = [];

function preload() {
    sounds.click = loadSound('assets/sounds/click.wav');
    sounds.buy = loadSound('assets/sounds/buy.wav');
    sounds.prestige = loadSound('assets/sounds/prestige.wav');
    sounds.error = loadSound('assets/sounds/error.wav');
}

function setup() {
    createCanvas(900, 600);
    buttonStart = new Button(width / 2 - 75, height / 2 - 20, 150, 40, "Start Game");
    buttonAbout = new Button(width / 2 - 75, height / 2 + 40, 150, 40, "About");
    buttonBack = new Button(width / 2 - 75, height - 60, 150, 40, "Back");
    buttonPrestige = new Button(width - 170, height - 60, 150, 40, "Prestige");

    player = new Game();

    upgrades = [
        new Upgrade("Click Power", 50, 1, 1.15, "Click +1"),
        new Upgrade("Auto-Click", 100, 1, 1.2, "+1/s"),
        new Upgrade("Mega Click", 500, 5, 1.25, "Click +5"),
        new Upgrade("Time Booster", 1000, 5, 1.3, "+5/s"),
        new Upgrade("Galaxy Booster", 5000, 2, 1.5, "x2 Total")
    ];

    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
}

function draw() {
    background(10);
    
    for (let s of stars) {
        s.update();
        s.show();
    }

    if (gameState === "menu") {
        drawMenu();
    } else if (gameState === "about") {
        drawAbout();
    } else if (gameState === "game") {
        player.update();
        player.show();
        autoClick();
        buttonPrestige.show();
        drawPrestigeOrbs();

        for (let i = prestigeParticles.length - 1; i >= 0; i--) {
            prestigeParticles[i].update();
            if (prestigeParticles[i].finished()) {
                prestigeParticles.splice(i, 1);
            } else {
                prestigeParticles[i].show();
            }
        }

        let gainedOnPrestige = floor(sqrt(player.totalScore) / 100);
        fill(255);
        textSize(18);
        textAlign(RIGHT);
        text(`Next Prestige: ${formatNumber(gainedOnPrestige)} pts`, width - 20, height - 110);
        textAlign(LEFT);
    }
}

function drawMenu() {
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text("🌌 Cosmic Clicker 🌌", width / 2, 100);
    buttonStart.show();
    buttonAbout.show();
}

function drawAbout() {
    fill(255);
    textAlign(CENTER);
    textSize(24);
    text("Sobre o Jogo", width / 2, 100);
    textSize(16);
    text("Criado por:\n Vinicius Wamser\n Lucas Gabriel\nDisciplina:Jogos\n2025", width / 2, 180);
    buttonBack.show();
}

function mousePressed() {
    if (gameState === "menu") {
        if (buttonStart.clicked(mouseX, mouseY)) {
            gameState = "game";
        }
        if (buttonAbout.clicked(mouseX, mouseY)) gameState = "about";
    } else if (gameState === "about") {
        if (buttonBack.clicked(mouseX, mouseY)) gameState = "menu";
    } else if (gameState === "game") {
        
        if (dist(mouseX, mouseY, width / 2, height / 2) < CLICK_RADIUS) {
            let clickPower = getClickPower();
            player.score += clickPower;
            player.totalScore += clickPower;
            
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(mouseX, mouseY));
            }
            sounds.click.play();
            
            mainOrbPulsing = true;
            mainOrbPulse = 10;
        }

        
        if (buttonPrestige.clicked(mouseX, mouseY)) {
            let gained = floor(sqrt(player.totalScore) / 100);
            if (gained > 0) {
                player.prestigePoints += gained;
                
                for (let i = 0; i < gained; i++) {
                    prestigeOrbs.push(new PrestigeOrb(random(100, 200), random(100, 200), random(200, 255), random(10, 25)));
                }
                
                for (let i = 0; i < 50; i++) {
                    prestigeParticles.push(new Particle(width / 2, height / 2, color(100, 200, 255), random(2, 5)));
                }

                player.reset();
                sounds.prestige.play();

            }
        }

        
        for (let up of upgrades) {
            let upgradeY = UPGRADE_START_Y + upgrades.indexOf(up) * (UPGRADE_HEIGHT + UPGRADE_SPACING);
            if (mouseX > UPGRADE_X_POS && mouseX < UPGRADE_X_POS + UPGRADE_WIDTH &&
                mouseY > upgradeY && mouseY < upgradeY + UPGRADE_HEIGHT) {

                if (player.score >= up.price) {
                    player.score -= up.price;
                    up.purchase();
                    sounds.buy.play();

                } else {
                    
                    sounds.error.play();
                    up.flashRed = true; 
                    setTimeout(() => up.flashRed = false, 200);
                }
            }
        }
    }
}

function autoClick() {
    autoClickTimer++;
    if (autoClickTimer >= AUTO_CLICK_FPS) {
        let income = getAutoIncome();
        player.score += income;
        player.totalScore += income;
        autoClickTimer = 0;
    }
}

function getClickPower() {
    let power = 1;
    power += upgrades[0].quantity * upgrades[0].effect; 
    power += upgrades[2].quantity * upgrades[2].effect; 
    power *= Math.pow(upgrades[4].effect, upgrades[4].quantity); 
    power *= 1 + player.prestigePoints * 0.05; 
    return power;
}

function getAutoIncome() {
    let income = 0;
    income += upgrades[1].quantity * upgrades[1].effect; 
    income += upgrades[3].quantity * upgrades[3].effect; 
    income *= Math.pow(upgrades[4].effect, upgrades[4].quantity); 
    income *= 1 + player.prestigePoints * 0.05; 
    return income;
}


function drawPrestigeOrbs() {

    let angleStep = TWO_PI / Math.max(prestigeOrbs.length, 1);
    for (let i = 0; i < prestigeOrbs.length; i++) {
        let orb = prestigeOrbs[i];
        let angle = frameCount * 0.01 + angleStep * i;
        let x = width / 2 + cos(angle) * PRESTIGE_ORB_RADIUS;
        let y = height / 2 + sin(angle) * PRESTIGE_ORB_RADIUS;
        orb.show(x, y);
    }
}


function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toString();
    const units = ["K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "D"];
    let unitIndex = 0;
    while (num >= 1000 && unitIndex < units.length) {
        num /= 1000;
        unitIndex++;
    }
    return num.toFixed(2) + units[unitIndex - 1];
}


// --- CLASSES ---

class PrestigeOrb {
    constructor(r, g, b, size) {
        this.color = color(r, g, b);
        this.size = size;
        this.angleOffset = random(TWO_PI); // Pequeno offset para variação
    }

    show(x, y) {
        push();
        translate(x, y);
        rotate(frameCount * 0.02 + this.angleOffset); 

        
        noStroke();
        fill(this.color, 100);
        ellipse(0, 0, this.size * 1.5); 

        fill(this.color);
        ellipse(0, 0, this.size); 

        
        for (let i = 0; i < 4; i++) {
            rotate(PI / 2); 
            triangle(0, -this.size / 2, -this.size / 4, 0, this.size / 4, 0);
        }
        pop();
    }
}

class Star {
    constructor() {
        this.x = random(width);
        this.y = random(height);
        this.size = random(1, 3);
        this.speed = random(0.1, 0.5);
    }
    update() {
        this.y += this.speed;
        if (this.y > height) {
            this.y = 0;
            this.x = random(width);
        }
    }
    show() {
        fill(255);
        noStroke();
        ellipse(this.x, this.y, this.size);
    }
}

class Button {
    constructor(x, y, w, h, label) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.label = label;
    }

    show() {
        push();
        translate(this.x, this.y);

        let hovering = this.isHover(mouseX, mouseY);
        let pressed = hovering && mouseIsPressed;

        
        let baseColor = color(50, 150, 255);
        let hoverColor = color(80, 180, 255);
        let currentColor = hovering ? hoverColor : baseColor;

        
        if (!pressed) {
            fill(0, 0, 0, 80);
            noStroke();
            rect(4, 4, this.w, this.h, 15);
        }

        
        fill(currentColor);
        stroke(255, 150);
        strokeWeight(2);
        rect(pressed ? 2 : 0, pressed ? 2 : 0, this.w, this.h, 15);

        
        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(18);
        text(this.label, this.w / 2 + (pressed ? 2 : 0), this.h / 2 + (pressed ? 2 : 0));

        pop();
    }

    clicked(mx, my) {
        return this.isHover(mx, my);
    }

    isHover(mx, my) {
        return mx > this.x && mx < this.x + this.w &&
               my > this.y && my < this.y + this.h;
    }
}

class Game {
    constructor() {
        this.score = 0;
        this.totalScore = 0;
        this.prestigePoints = 0;
    }
    update() {
        
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].finished()) {
                particles.splice(i, 1);
            }
        }

        
        if (mainOrbPulsing) {
            mainOrbPulse *= 0.9; 
            if (mainOrbPulse < 0.5) {
                mainOrbPulsing = false;
                mainOrbPulse = 0;
            }
        }

        
        mainOrbRotation += 0.005; 
    }
    show() {
        fill(255);
        textSize(24);
        textAlign(LEFT);
        text(`Score: ${formatNumber(this.score)}`, 20, 30);
        text(`Prestige: ${this.prestigePoints}`, 20, 60);

        
        push(); 
        translate(width / 2, height / 2); 
        rotate(mainOrbRotation); 

        let currentSize = MAIN_CLICK_ELLIPSE_SIZE + mainOrbPulse;
        
        for (let i = 0; i < currentSize / 2; i++) {
            let lerpColorFactor = map(i, 0, currentSize / 2, 0, 1);
            let c = lerpColor(color(200, 100, 255), color(50, 0, 100), lerpColorFactor);
            stroke(c);
            noFill();
            ellipse(0, 0, currentSize - i * 2, currentSize - i * 2);
        }
        noStroke();
        fill(200, 100, 255); 
        ellipse(0, 0, currentSize, currentSize); 

        pop();

        
        for (let p of particles) {
            p.show();
        }


        for (let i = 0; i < upgrades.length; i++) {
            let upgradeY = UPGRADE_START_Y + i * (UPGRADE_HEIGHT + UPGRADE_SPACING);
            upgrades[i].show(UPGRADE_X_POS, upgradeY, this.score);
        }
    }
    reset() {
        this.score = 0;
        this.totalScore = 0;
        upgrades.forEach(u => {
            u.price = u.basePrice;
            u.quantity = 0;
            u.flashRed = false;
        });
    }

}

class Particle {
    constructor(x, y, pColor = color(255), pSize = 8) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(1, 3));
        this.alpha = 255;
        this.color = pColor;
        this.size = pSize;
    }
    update() {
        this.pos.add(this.vel);
        this.alpha -= 5;
    }
    finished() {
        return this.alpha < 0;
    }
    show() {
        noStroke();
        fill(this.color, this.alpha);
        ellipse(this.pos.x, this.pos.y, this.size);
    }
}

class Upgrade {
    constructor(name, price, effect, priceMultiplier, description) {
        this.name = name;
        this.basePrice = price;
        this.price = price;
        this.effect = effect;
        this.priceMultiplier = priceMultiplier;
        this.description = description;
        this.quantity = 0;
        this.flashRed = false; 
    }
    show(x, y, playerScore) {
        let canAfford = playerScore >= this.price;

       
        if (this.flashRed) { 
            fill(255, 0, 0); 
        } else if (this.isMouseOver(mouseX, mouseY, x, y, UPGRADE_WIDTH, UPGRADE_HEIGHT)) {
            
            if (canAfford) {
                fill(50, 220, 50); 
            } else {
                fill(150, 50, 50); 
            }
        } else {
            
            if (canAfford) {
                fill(0, 200, 0); 
            } else {
                fill(100, 0, 0); 
            }
        }

        rect(x, y, UPGRADE_WIDTH, UPGRADE_HEIGHT, 8);
        fill(255);
        textSize(14);
        textAlign(LEFT, CENTER);
        text(`${this.name} (${this.description})`, x + 10, y + UPGRADE_HEIGHT / 2);
        textAlign(RIGHT);
        text(`Qtd: ${this.quantity} | $${formatNumber(this.price)}`, x + UPGRADE_WIDTH - 10, y + UPGRADE_HEIGHT / 2); 
    }
    isMouseOver(mx, my, x, y, w, h) {
        return mx > x && mx < x + w && my > y && my < y + h;
    }
    purchase() {
        this.quantity++;
        this.price *= this.priceMultiplier;
    }
}
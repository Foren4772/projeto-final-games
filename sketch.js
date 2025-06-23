
let gameState = "menu";
let buttonStart, buttonAbout, buttonBack, buttonPrestige;
let player;
let particles = [];
let stars = [];
let autoClickTimer = 0;
let prestigeOrbs = [];

let upgrades = [];
let sounds = {};

function preload() {
  sounds.click = loadSound('assets/sounds/click.wav');
  sounds.buy = loadSound('assets/sounds/buy.wav');
  sounds.prestige = loadSound('assets/sounds/prestige.wav');
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
    new Upgrade("Galaxy Booster", 5000, 2, 1.5, "x2 Total"),
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
  text("Criado por: Seu Nome Aqui\nDisciplina: Programação de Jogos\n2025", width / 2, 180);
  buttonBack.show();
}

function mousePressed() {
  if (gameState === "menu") {
    if (buttonStart.clicked(mouseX, mouseY)) gameState = "game";
    if (buttonAbout.clicked(mouseX, mouseY)) gameState = "about";
  } else if (gameState === "about") {
    if (buttonBack.clicked(mouseX, mouseY)) gameState = "menu";
  } else if (gameState === "game") {
    if (dist(mouseX, mouseY, width/2, height/2) < 80) {
      let clickPower = getClickPower();
      player.score += clickPower;
      for (let i = 0; i < 10; i++) {
        particles.push(new Particle(mouseX, mouseY));
      }
      sounds.click.play();
    }

    if (buttonPrestige.clicked(mouseX, mouseY)) {
      let gained = floor(sqrt(player.totalScore) / 100);
      if (gained > 0) {
        player.prestigePoints += gained;
        prestigeOrbs.push(...Array(gained).fill().map(()=>new PrestigeOrb()));
        player.reset();
        sounds.prestige.play();
      }
    }

    for (let up of upgrades) {
      if (up.isMouseOver(mouseX, mouseY)) {
        if (player.score >= up.price) {
          player.score -= up.price;
          up.purchase();
          sounds.buy.play();
        }
      }
    }
  }
}

function autoClick() {
  autoClickTimer++;
  if (autoClickTimer > 60) {
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
  let count = prestigeOrbs.length;
  let grouped = groupOrbs(prestigeOrbs);
  let angleStep = TWO_PI / grouped.length;
  for (let i = 0; i < grouped.length; i++) {
    let angle = frameCount * 0.01 + angleStep * i;
    let x = width/2 + cos(angle) * 120;
    let y = height/2 + sin(angle) * 120;
    fill(grouped[i].color);
    ellipse(x, y, grouped[i].size, grouped[i].size);
  }
}

function groupOrbs(orbs) {
  let groups = [];
  let count = orbs.length;
  let level = 0;
  while (count >= 5) {
    count = floor(count/5);
    level++;
  }
  for (let i = 0; i < count; i++) {
    groups.push({color: color(100 + level*30, 100, 255 - level*30), size: 15 + level*5});
  }
  for (let i = 0; i < orbs.length % 5; i++) {
    groups.push({color: color(150,150,255), size:15});
  }
  return groups;
}

class PrestigeOrb {
  constructor() {}
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
    fill(50, 150, 255);
    rect(this.x, this.y, this.w, this.h, 10);
    fill(255);
    textAlign(CENTER, CENTER);
    text(this.label, this.x + this.w/2, this.y + this.h/2);
  }
  clicked(mx, my) {
    return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
  }
}

class Game {
  constructor() {
    this.score = 0;
    this.totalScore = 0;
    this.prestigePoints = 0;
  }
  update() {
    for (let i = particles.length -1; i >=0; i--) {
      particles[i].update();
      if (particles[i].finished()) {
        particles.splice(i, 1);
      }
    }
  }
  show() {
    fill(255);
    textSize(24);
    textAlign(LEFT);
    text("Score: " + Math.floor(this.score), 20, 30);
    text("Prestige: " + this.prestigePoints, 20, 60);

    fill(200, 100, 255);
    ellipse(width/2, height/2, 160, 160);

    for (let i = 0; i < upgrades.length; i++) {
      upgrades[i].show(20, 400 + i * 40);
    }

    for (let p of particles) {
      p.show();
    }
  }
  reset() {
    this.score = 0;
    upgrades.forEach(u => {
      u.price = u.basePrice;
      u.quantity = 0;
    });
    this.totalScore = 0;
  }
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 3));
    this.alpha = 255;
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
    fill(255, this.alpha);
    ellipse(this.pos.x, this.pos.y, 8);
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
  }
  show(x, y) {
    fill(0, 200, 0);
    rect(x, y, 300, 30, 8);
    fill(255);
    textSize(14);
    textAlign(LEFT, CENTER);
    text(`${this.name} (${this.description})`, x + 10, y + 10);
    textAlign(RIGHT);
    text(`Qtd: ${this.quantity} | $${Math.floor(this.price)}`, x + 290, y + 10);
  }
  isMouseOver(mx, my) {
    return mx > 20 && mx < 320 && my > 400 + upgrades.indexOf(this) * 40 && my < 430 + upgrades.indexOf(this) * 40;
  }
  purchase() {
    this.quantity++;
    this.price *= this.priceMultiplier;
  }
}

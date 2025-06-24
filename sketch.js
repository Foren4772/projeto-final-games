let gameState = "menu";
let buttonStart, buttonAbout, buttonBack, buttonPrestige;
let player;
let particles = [];
let stars = [];
let prestigeOrbs = [];
let upgrades = [];
let autoClickTimer = 0;
let phase = 1;
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

// Pré-carrega os assets
function preload() {
    
    sounds.buy = loadSound('assets/sounds/buy.wav');
    sounds.click = loadSound('assets/sounds/click.wav');
    sounds.error = loadSound('assets/sounds/error.wav');
    sounds.prestige = loadSound('assets/sounds/prestige.wav');
}


function setup() {
    createCanvas(900, 600);
    // Criação dos botões de menu
    buttonStart = new Button(width / 2 - 75, height / 2 - 20, 150, 40, "Start Game");
    buttonAbout = new Button(width / 2 - 75, height / 2 + 40, 150, 40, "About");
    buttonBack = new Button(width / 2 - 75, height - 60, 150, 40, "Back");
    buttonPrestige = new Button(width - 170, height - 60, 150, 40, "Prestige");

    // Inicializa o objeto Game que gerencia o estado do jogador
    player = new Game();

    // Configura os upgrades iniciais
    setupUpgrades();


    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
}

function setupUpgrades() {
    upgrades = [
        new Upgrade("Click Power", 50, 1, 1.15, "Click +1"),
        new Upgrade("Auto-Click", 100, 1, 1.2, "+1/s"),
        new Upgrade("Mega Click", 500, 5, 1.25, "Click +5"),
        new Upgrade("Time Booster", 1000, 5, 1.3, "+5/s"),
        new Upgrade("Galaxy Booster", 5000, 2, 1.5, "x2 Total")
    ];
    // Adiciona upgrades extras na fase 2
    if (phase === 2) {
        upgrades.push(new Upgrade("Quantum Clicker", 20000, 10, 1.4, "Click +10"));
        upgrades.push(new Upgrade("Nebula Factory", 50000, 20, 1.5, "+20/s"));
    }
}

function draw() {
    background(10);
    stars.forEach(s => { s.update(); s.show(); });

    if (gameState === "menu") {
        drawMenu();
    } else if (gameState === "about") {
        drawAbout();
    } else if (gameState === "game") {
        player.update(); // Atualiza o estado do jogador e partículas
        player.show();   // Exibe o jogador, score, upgrades, etc
        autoClick();     // Gerencia o auto-clique

        buttonPrestige.show();
        drawPrestigeOrbs(); 

        prestigeParticles.forEach(p => p.update());
        prestigeParticles.forEach(p => p.show());
        prestigeParticles = prestigeParticles.filter(p => !p.finished());
        let currentGainedPrestigeBasedOnCurrentScore = floor(sqrt(player.score) / 1000);
        let targetGainedPrestige = currentGainedPrestigeBasedOnCurrentScore + 1;
        let scoreNeededForNextPrestigePoint = Math.pow(targetGainedPrestige * 1000, 2);

        let remaining = scoreNeededForNextPrestigePoint - player.score;

        while (remaining <= 0 && player.score > 0) { 
             targetGainedPrestige++;
             scoreNeededForNextPrestigePoint = Math.pow(targetGainedPrestige * 1000, 2);
             remaining = scoreNeededForNextPrestigePoint - player.score;
        }

        if (player.score === 0) {
            targetGainedPrestige = 1;
            scoreNeededForNextPrestigePoint = Math.pow(targetGainedPrestige * 1000, 2);
            remaining = scoreNeededForNextPrestigePoint;
        }


        fill(255);
        textSize(18);
        textAlign(RIGHT);
        text(`Next Prestige: ${formatNumber(remaining)} pts (for ${targetGainedPrestige} PP)`, width - 20, height - 110);
    }
}

// Desenha a tela de menu principal
function drawMenu() {
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text("🌌 Cosmic Clicker 🌌", width / 2, 100);
    buttonStart.show();
    buttonAbout.show();
}

// Desenha a tela "Sobre"
function drawAbout() {
    fill(255);
    textAlign(CENTER);
    textSize(24);
    text("Sobre o Jogo", width / 2, 100);
    textSize(16);
    text("Criado por: Vinicius Wamser \n Lucas Gabriel\nDisciplina: Jogos\n2025", width / 2, 180);
    buttonBack.show();
}

// Função chamada quando o mouse é clicado
function mousePressed() {
    if (gameState === "menu") {
        if (buttonStart.clicked(mouseX, mouseY)) {
            gameState = "game";
        }
        if (buttonAbout.clicked(mouseX, mouseY)) {
            gameState = "about";
        }
    } else if (gameState === "about") {
        if (buttonBack.clicked(mouseX, mouseY)) {
            gameState = "menu";
        }
    } else if (gameState === "game") {
        // Verifica clique na orbe principal
        if (dist(mouseX, mouseY, width / 2, height / 2) < CLICK_RADIUS) {
            let clickPower = getClickPower();
            player.score += clickPower;
            player.totalScore += clickPower;
            // Cria partículas ao clicar
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(mouseX, mouseY));
            }
            // Ativa o efeito de pulso na orbe
            mainOrbPulsing = true;
            mainOrbPulse = 10;
            // Toca o som de clique
            if (sounds.click) {
                sounds.click.play();
            }
        }

        if (buttonPrestige.clicked(mouseX, mouseY)) {
            let gained = floor(sqrt(player.highestScoreThisPrestige) / 1000);
            
            if (gained > 0) {
                player.prestigePoints += gained;
                for (let i = 0; i < gained; i++) {
                    prestigeOrbs.push(new PrestigeOrb(random(100, 200), random(100, 200), random(200, 255), random(10, 25)));
                }
                for (let i = 0; i < 50; i++) {
                    prestigeParticles.push(new Particle(width / 2, height / 2, color(100, 200, 255), random(2, 5)));
                }

                if (player.prestigePoints >= 10 && phase === 1) {
                    phase = 2;
                }

                player.reset();
                setupUpgrades();

                if (sounds.prestige) {
                    sounds.prestige.play();
                }
            } else {
                
                if (sounds.error) {
                    sounds.error.play();
                }
            }
        }

        // Verifica clique nos upgrades
        upgrades.forEach((up, index) => {
            let y = UPGRADE_START_Y + index * (UPGRADE_HEIGHT + UPGRADE_SPACING);
            if (mouseX > UPGRADE_X_POS && mouseX < UPGRADE_X_POS + UPGRADE_WIDTH &&
                mouseY > y && mouseY < y + UPGRADE_HEIGHT) {
                if (player.score >= up.price) {
                    player.score -= up.price;
                    up.purchase();
                    
                    if (sounds.buy) {
                        sounds.buy.play();
                    }
                } else {
                    
                    up.flashRed = true;
                    setTimeout(() => up.flashRed = false, 200); 
                    if (sounds.error) {
                        sounds.error.play();
                    }
                }
            }
        });
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
    upgrades.forEach(up => {
        if (up.name.includes("Click")) {
            power += up.quantity * up.effect;
        }
    });

    power *= Math.pow(upgrades.find(u => u.name.includes("Galaxy"))?.effect || 1,
                        upgrades.find(u => u.name.includes("Galaxy"))?.quantity || 0);

    power *= 1 + player.prestigePoints * 0.2;
    return power;
}

function getAutoIncome() {
    let income = 0;
    upgrades.forEach(up => {
        if (up.name.includes("Auto") || up.name.includes("Time") || up.name.includes("Factory")) {
            income += up.quantity * up.effect;
        }
    });
    // Aplica multiplicador do upgrade "Galaxy Booster"
    income *= Math.pow(upgrades.find(u => u.name.includes("Galaxy"))?.effect || 1,
                        upgrades.find(u => u.name.includes("Galaxy"))?.quantity || 0);
    // Aplica bônus dos pontos de prestígio
    income *= 1 + player.prestigePoints * 0.2;
    return income;
}

function drawPrestigeOrbs() {
    let angleStep = TWO_PI / Math.max(prestigeOrbs.length, 1);
    prestigeOrbs.forEach((orb, i) => {
        let angle = frameCount * 0.01 + angleStep * i; 
        let x = width / 2 + cos(angle) * PRESTIGE_ORB_RADIUS;
        let y = height / 2 + sin(angle) * PRESTIGE_ORB_RADIUS;
        orb.show(x, y);
    });
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

// ------------------ CLASSES ------------------

class PrestigeOrb {
    constructor(r, g, b, size) {
        this.color = color(r, g, b); // Cor da orbe
        this.size = size;           // Tamanho da orbe
        this.angleOffset = random(TWO_PI);
    }
    show(x, y) {
        push(); // Salva o estado atual da transformação
        translate(x, y); // Move o centro para a posição da orbe
        rotate(frameCount * 0.02 + this.angleOffset); // Rotação contínua da orbe
        noStroke();
        fill(this.color, 100); // Fundo mais translúcido
        ellipse(0, 0, this.size * 1.5);
        fill(this.color); // Orbe principal
        ellipse(0, 0, this.size);
        // Desenha as "pontas" da orbe para efeito visual
        for (let i = 0; i < 4; i++) {
            rotate(PI / 2); // Rotaciona para desenhar 4 pontas
            triangle(0, -this.size / 2, -this.size / 4, 0, this.size / 4, 0);
        }
        pop(); // Restaura o estado de transformação anterior
    }
}

class Star {
    constructor() {
        this.x = random(width);  // Posição X aleatória
        this.y = random(height); // Posição Y aleatória
        this.size = random(1, 3); // Tamanho aleatório
        this.speed = random(0.1, 0.5); // Velocidade de queda aleatória
    }
    update() {
        this.y += this.speed; // Move a estrela para baixo
        if (this.y > height) { // Se sair da tela, reseta no topo
            this.y = 0;
            this.x = random(width);
        }
    }
    show() {
        fill(255); // Cor branca para as estrelas
        noStroke();
        ellipse(this.x, this.y, this.size); // Desenha a estrela como um círculo
    }
}

class Button {
    constructor(x, y, w, h, label) {
        this.x = x;     // Posição X do botão
        this.y = y;     // Posição Y do botão
        this.w = w;     // Largura do botão
        this.h = h;     // Altura do botão
        this.label = label; // Texto do botão
    }
    show() {
        push();
        translate(this.x, this.y); // Move o centro para a posição do botão
        let hovering = this.isHover(mouseX, mouseY); // Verifica se o mouse está sobre o botão
        let pressed = hovering && mouseIsPressed;   // Verifica se o botão está pressionado
        let baseColor = color(50, 150, 255); // Cor base do botão
        let hoverColor = color(80, 180, 255); // Cor ao passar o mouse
        let currentColor = hovering ? hoverColor : baseColor; // Define a cor atual

        // Efeito de sombra para o botão
        if (!pressed) {
            fill(0, 0, 0, 80);
            noStroke();
            rect(4, 4, this.w, this.h, 15); // Desenha a sombra
        }
        fill(currentColor);
        stroke(255, 150);
        strokeWeight(2);
        // Desenha o botão, com um pequeno deslocamento se estiver pressionado
        rect(pressed ? 2 : 0, pressed ? 2 : 0, this.w, this.h, 15);

        noStroke();
        fill(255); // Cor do texto
        textAlign(CENTER, CENTER);
        textSize(18);
        // Desenha o texto do botão, com o mesmo deslocamento se estiver pressionado
        text(this.label, this.w / 2 + (pressed ? 2 : 0), this.h / 2 + (pressed ? 2 : 0));
        pop();
    }
    // Verifica se o clique está dentro dos limites do botão
    clicked(mx, my) {
        return this.isHover(mx, my);
    }
    // Verifica se as coordenadas do mouse estão sobre o botão
    isHover(mx, my) {
        return mx > this.x && mx < this.x + this.w &&
               my > this.y && my < this.y + this.h;
    }
}

class Game {
    constructor() {
        this.score = 0;      // Score atual do jogador
        this.totalScore = 0; // Score total acumulado (usado para registro geral ou outras lógicas)
        this.prestigePoints = 0; // Pontos de prestígio ganhos
        this.highestScoreThisPrestige = 0; // Maior score alcançado durante o ciclo atual de prestígio
    }
    update() {
        // Atualiza e remove partículas de clique que já desapareceram
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].finished()) {
                particles.splice(i, 1);
            }
        }
        // Animação de pulso da orbe principal
        if (mainOrbPulsing) {
            mainOrbPulse *= 0.9; // Diminui o pulso gradualmente
            if (mainOrbPulse < 0.5) {
                mainOrbPulsing = false;
                mainOrbPulse = 0;
            }
        }
        mainOrbRotation += 0.005; // Rotação contínua da orbe principal

        // Atualiza o maior score atingido neste ciclo para a lógica de prestígio
        if (this.score > this.highestScoreThisPrestige) {
            this.highestScoreThisPrestige = this.score;
        }
    }
    show() {
        fill(255);
        textSize(24);
        textAlign(LEFT);
        text(`Score: ${formatNumber(this.score)}`, 20, 30);      // Exibe o score
        text(`Prestige: ${this.prestigePoints}`, 20, 60); // Exibe os pontos de prestígio

        // Desenho da Bola Central (Orbe Principal)
        push();
        translate(width / 2, height / 2); // Move o centro para o meio da tela
        rotate(mainOrbRotation);          // Aplica a rotação

        let currentSize = MAIN_CLICK_ELLIPSE_SIZE + mainOrbPulse; // Tamanho com efeito de pulso

        // Desenha múltiplas camadas concêntricas para um efeito de brilho ou aura
        for (let i = 0; i < currentSize / 2; i++) {
            let lerpColorFactor = map(i, 0, currentSize / 2, 0, 1);
            // Altera a cor da orbe baseada na fase
            let c = phase === 1
                ? lerpColor(color(200, 100, 255), color(50, 0, 100), lerpColorFactor) // Roxo-azulado
                : lerpColor(color(255, 200, 50), color(255, 100, 0), lerpColorFactor); // Laranja-dourado
            stroke(c);
            noFill();
            ellipse(0, 0, currentSize - i * 2, currentSize - i * 2);
        }
        noStroke();
        // Desenha a orbe principal sólida
        fill(phase === 1 ? color(200, 100, 255) : color(255, 180, 50));
        ellipse(0, 0, currentSize, currentSize);
        pop();

        // Exibe as partículas de clique
        particles.forEach(p => p.show());
        // Exibe os upgrades
        upgrades.forEach((up, i) => {
            let y = UPGRADE_START_Y + i * (UPGRADE_HEIGHT + UPGRADE_SPACING);
            up.show(UPGRADE_X_POS, y, this.score);
        });
    }
    // Reseta o estado do jogo após um prestígio
    reset() {
        this.score = 0;
        this.totalScore = 0;
        this.highestScoreThisPrestige = 0; // Zera o maior score alcançado para o novo ciclo
        prestigeOrbs = []; // Limpa as orbes visuais de prestígio
        upgrades = []; // Limpa os upgrades para que `setupUpgrades` os recrie com base na fase atual
    }
}

class Particle {
    constructor(x, y, pColor = color(255), pSize = 8) {
        this.pos = createVector(x, y); // Posição (usando vetor p5.js)
        this.vel = p5.Vector.random2D().mult(random(1, 3)); // Velocidade aleatória em qualquer direção
        this.alpha = 255; // Opacidade inicial
        this.color = pColor; // Cor da partícula
        this.size = pSize;   // Tamanho da partícula
    }
    update() {
        this.pos.add(this.vel); // Move a partícula
        this.alpha -= 5;        // Diminui a opacidade (fazendo-a desaparecer)
    }
    finished() {
        return this.alpha < 0; // Retorna true se a partícula já desapareceu
    }
    show() {
        noStroke();
        fill(this.color, this.alpha); // Desenha a partícula com sua cor e opacidade
        ellipse(this.pos.x, this.pos.y, this.size);
    }
}

class Upgrade {
    constructor(name, price, effect, priceMultiplier, description) {
        this.name = name;           // Nome do upgrade
        this.basePrice = price;     // Preço base (para referência)
        this.price = price;         // Preço atual
        this.effect = effect;       // Efeito do upgrade
        this.priceMultiplier = priceMultiplier; // Multiplicador do preço para cada compra
        this.description = description;         // Descrição do efeito
        this.quantity = 0;                      // Quantidade comprada
        this.flashRed = false;                  // Flag para efeito visual de "não pode comprar"
    }
    show(x, y, playerScore) {
        let canAfford = playerScore >= this.price; // Verifica se o jogador pode comprar

        // Define a cor do fundo do upgrade
        if (this.flashRed) {
            fill(255, 0, 0); // Vermelho se não puder comprar e tentar
        } else if (this.isMouseOver(mouseX, mouseY, x, y, UPGRADE_WIDTH, UPGRADE_HEIGHT)) {
            fill(canAfford ? color(50, 220, 50) : color(150, 50, 50)); // Verde/vermelho ao passar o mouse
        } else {
            fill(canAfford ? color(0, 200, 0) : color(100, 0, 0)); // Verde/vermelho padrão
        }
        rect(x, y, UPGRADE_WIDTH, UPGRADE_HEIGHT, 8); // Desenha o retângulo do upgrade

        fill(255); // Cor do texto
        textSize(14);
        textAlign(LEFT, CENTER);
        text(`${this.name} (${this.description})`, x + 10, y + UPGRADE_HEIGHT / 2); // Nome e descrição
        textAlign(RIGHT);
        text(`Qtd: ${this.quantity} | $${formatNumber(this.price)}`, x + UPGRADE_WIDTH - 10, y + UPGRADE_HEIGHT / 2); // Quantidade e preço
    }
    // Verifica se o mouse está sobre o upgrade
    isMouseOver(mx, my, x, y, w, h) {
        return mx > x && mx < x + w && my > y && my < y + h;
    }
    // Lógica de compra do upgrade
    purchase() {
        this.quantity++;                 // Aumenta a quantidade
        this.price *= this.priceMultiplier; // Aumenta o preço para a próxima compra
    }
}
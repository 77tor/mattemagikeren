// Hente lagrede data
let diamonds = parseInt(localStorage.getItem('mats_magician_diamonds')) || 0;
let highscore = parseInt(localStorage.getItem('mats_magician_highscore')) || 0;
let totalScore = parseInt(localStorage.getItem('mats_magician_totalscore')) || 0;

// Oppgraderinger (butikk-data)
let upgrades = JSON.parse(localStorage.getItem('mats_magician_upgrades')) || {
    wandLevel: 0,
    shieldBought: false,
    hpBought: false,
    timeBought: false
};

// Spillvariabler
let maxPlayerHp = 100;
let playerHp = 100;
let score = 0; // Runde-poeng
let streak = 0;
let currentMonsterIndex = 0;
let monsterSolvedTasks = 0;
let lastDiamondThreshold = 0;

// Holde styr på ALLE forsinkelsestimere for trygg kansellering
let actionTimeout = null;

// Innstillinger
let currentMode = 'add';
let selectedMaxNum = 10;
let baseTimeLimit = 10; 
let timeLimit = 10;
let selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let correctAnswer = 0;
let timerInterval = null;
let timeLeft = 100;

// Fiende-konfigurasjon
const monsters = [
    { id: "slim", name: "Slim", requiredTasks: 3 },
    { id: "goblin", name: "Goblin", requiredTasks: 4 },
    { id: "skjelett", name: "Skjelett", requiredTasks: 5 },
    { id: "varulv", name: "Varulv", requiredTasks: 6 },
    { id: "drage", name: "Drage", requiredTasks: 7 }
];

// Dynamisk validering av helte-avatar ut fra butikkjøp
function getPlayerAvatarId() {
    const hasWand = upgrades.wandLevel > 0;
    const hasShield = upgrades.shieldBought;

    if (hasWand && hasShield) return "magiker_skjold_tryllestav";
    if (hasWand) return "magiker_tryllestav";
    if (hasShield) return "magiker_skjold";
    return "magiker";
}

function setMode(mode, e) {
    currentMode = mode;
    setActiveButton(e.target);

    const tablesSection = document.getElementById('multiplicationTablesSection');
    if (mode === 'mul') {
        tablesSection.classList.remove('hidden');
    } else {
        tablesSection.classList.add('hidden');
    }
}

function toggleTable(num, e) {
    const btn = e.target;
    if (selectedTables.includes(num)) {
        if (selectedTables.length > 1) {
            selectedTables = selectedTables.filter(t => t !== num);
            btn.classList.remove('selected');
        }
    } else {
        selectedTables.push(num);
        btn.classList.add('selected');
    }
    updateAllTablesBtnState();
}

function toggleAllTables(e) {
    const buttons = document.querySelectorAll('.tables-grid .table-btn');
    if (selectedTables.length === 10) {
        selectedTables = [2];
        buttons.forEach(b => b.classList.remove('selected'));
        buttons[2].classList.add('selected');
    } else {
        selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        buttons.forEach(b => b.classList.add('selected'));
    }
    updateAllTablesBtnState();
}

function updateAllTablesBtnState() {
    const allBtn = document.querySelectorAll('.tables-grid .table-btn')[0];
    if (selectedTables.length === 10) {
        allBtn.classList.add('selected');
    } else {
        allBtn.classList.remove('selected');
    }
}

function setMaxNum(max, e) {
    selectedMaxNum = max;
    setActiveButton(e.target);
}

function setTimeLimit(seconds, e) {
    baseTimeLimit = seconds;
    setActiveButton(e.target);
}

function setActiveButton(element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

function updateMenuDisplay() {
    document.getElementById('menuHighscoreDisplay').innerText = `🏆 REKORD: ${highscore} pt | 💎 ${diamonds}`;
    renderAvatar(getPlayerAvatarId(), '#titleAvatar');
}

/* BUTIKK FUNKSJONER */
function openShop() {
    renderShop();
    document.getElementById('shopScreen').classList.remove('hidden');
}

function closeShop() {
    document.getElementById('shopScreen').classList.add('hidden');
    updateMenuDisplay();
}

function updateBuffIcons() {
    let buffsHTML = '';
    
    if (upgrades.hpBought) {
        buffsHTML += `<span class="buff-icon" title="Helse-eliksir (+20 HP)">🧪</span>`;
    }
    if (upgrades.timeBought) {
        buffsHTML += `<span class="buff-icon" title="Tids-amulett (+2 sek)">⏳</span>`;
    }

    const menuBuffs = document.getElementById('menuBuffs');
    const gameBuffs = document.getElementById('gameBuffs');
    const summaryBuffs = document.getElementById('summaryBuffs');
    const gameOverBuffs = document.getElementById('gameOverBuffs');

    if (menuBuffs) menuBuffs.innerHTML = buffsHTML;
    if (gameBuffs) gameBuffs.innerHTML = buffsHTML;
    if (summaryBuffs) summaryBuffs.innerHTML = buffsHTML;
    if (gameOverBuffs) gameOverBuffs.innerHTML = buffsHTML;
}


function renderShop() {
    document.getElementById('shopDiamondsDisplay').innerText = diamonds;

    // --- TRYLESTAV ---
    const wandCost = 5 * (upgrades.wandLevel + 1);
    document.getElementById('wandDesc').innerText = upgrades.wandLevel > 0 
        ? `Nivå ${upgrades.wandLevel}: Gir +${upgrades.wandLevel * 10}% ekstra poeng.` 
        : `Gir +10% ekstra poeng per nivå.`;
    
    const btnWand = document.getElementById('btnBuyWand');
    btnWand.innerText = `Kjøp (${wandCost} 💎)`;
    btnWand.disabled = diamonds < wandCost;

    // Legg til selg-knapp for tryllestav om du har minst 1 nivå
    let btnSellWand = document.getElementById('btnSellWand');
    if (btnSellWand) {
        btnSellWand.style.display = upgrades.wandLevel > 0 ? 'inline-block' : 'none';
        btnSellWand.innerText = `Selg (-1 niv: +${5 * upgrades.wandLevel} 💎)`;
    }

    // --- SKJOLD ---
    const btnShield = document.getElementById('btnBuyShield');
    let btnSellShield = document.getElementById('btnSellShield');
    if (upgrades.shieldBought) {
        document.getElementById('shieldDesc').innerText = "Kjøpt! Tar 20% mindre skade.";
        btnShield.style.display = 'none';
        if (btnSellShield) btnSellShield.style.display = 'inline-block';
    } else {
        document.getElementById('shieldDesc').innerText = "Tar 20% mindre skade fra feilsvar.";
        btnShield.style.display = 'inline-block';
        btnShield.innerText = "8 💎";
        btnShield.disabled = diamonds < 8;
        if (btnSellShield) btnSellShield.style.display = 'none';
    }

    // --- HP ---
    const btnHp = document.getElementById('btnBuyHp');
    let btnSellHp = document.getElementById('btnSellHp');
    if (upgrades.hpBought) {
        document.getElementById('hpDesc').innerText = "Kjøpt! Du starter med 120 HP.";
        btnHp.style.display = 'none';
        if (btnSellHp) btnSellHp.style.display = 'inline-block';
    } else {
        document.getElementById('hpDesc').innerText = "Start med 120 HP i stedet for 100.";
        btnHp.style.display = 'inline-block';
        btnHp.innerText = "10 💎";
        btnHp.disabled = diamonds < 10;
        if (btnSellHp) btnSellHp.style.display = 'none';
    }

    // --- TID ---
    const btnTime = document.getElementById('btnBuyTime');
    let btnSellTime = document.getElementById('btnSellTime');
    if (upgrades.timeBought) {
        document.getElementById('timeDesc').innerText = "Kjøpt! +2 sekunder på oppgaver.";
        btnTime.style.display = 'none';
        if (btnSellTime) btnSellTime.style.display = 'inline-block';
    } else {
        document.getElementById('timeDesc').innerText = "+2 sekunder ekstra per oppgave.";
        btnTime.style.display = 'inline-block';
        btnTime.innerText = "12 💎";
        btnTime.disabled = diamonds < 12;
        if (btnSellTime) btnSellTime.style.display = 'none';
    }
}

function sellUpgrade(type) {
    if (type === 'wand' && upgrades.wandLevel > 0) {
        const refund = 5 * upgrades.wandLevel;
        diamonds += refund;
        upgrades.wandLevel--;
    } else if (type === 'shield' && upgrades.shieldBought) {
        diamonds += 8;
        upgrades.shieldBought = false;
    } else if (type === 'hp' && upgrades.hpBought) {
        diamonds += 10;
        upgrades.hpBought = false;
    } else if (type === 'time' && upgrades.timeBought) {
        diamonds += 12;
        upgrades.timeBought = false;
    }

    saveData();
    renderShop();
    updateMenuDisplay();
    updateBuffIcons(); // <-- Legg til denne!
}

function buyUpgrade(type) {
    if (type === 'wand') {
        const wandCost = 5 * (upgrades.wandLevel + 1);
        if (diamonds >= wandCost) {
            diamonds -= wandCost;
            upgrades.wandLevel++;
        }
    } else if (type === 'shield' && !upgrades.shieldBought && diamonds >= 8) {
        diamonds -= 8;
        upgrades.shieldBought = true;
    } else if (type === 'hp' && !upgrades.hpBought && diamonds >= 10) {
        diamonds -= 10;
        upgrades.hpBought = true;
    } else if (type === 'time' && !upgrades.timeBought && diamonds >= 12) {
        diamonds -= 12;
        upgrades.timeBought = true;
    }

    saveData();
    renderShop();
    updateBuffIcons(); // <-- Legg til denne!
}

function saveData() {
    localStorage.setItem('mats_magician_diamonds', diamonds);
    localStorage.setItem('mats_magician_highscore', highscore);
    localStorage.setItem('mats_magician_totalscore', totalScore);
    localStorage.setItem('mats_magician_upgrades', JSON.stringify(upgrades));
}

function openModalSettings() {
    document.getElementById('modalDiamonds').innerText = diamonds;
    document.getElementById('modalHighscore').innerText = highscore;
    document.getElementById('settingsModalScreen').classList.remove('hidden');
}

function closeModalSettings() {
    document.getElementById('settingsModalScreen').classList.add('hidden');
}

function resetAllData() {
    if (confirm("Er du sikker på at du vil slette alt? (Poeng, diamanter og butikkjøp slettes)")) {
        diamonds = 0;
        highscore = 0;
        totalScore = 0;
        upgrades = { wandLevel: 0, shieldBought: false, hpBought: false, timeBought: false };
        localStorage.clear();
        
        updateStats();
        updateMenuDisplay();
        closeModalSettings();
    }
}

// HJELPEFUNKSJON FOR Å DREPE ALLE AKTUELLE TIMERE OG FORSINKELSER
function stopAllGameTimers() {
    // 1. Stopp tidsur og forsinkelser
    clearInterval(timerInterval);
    timerInterval = null;

    if (actionTimeout) {
        clearTimeout(actionTimeout);
        actionTimeout = null;
    }

    clearConfetti();

    // 2. Skjul popup-er
    const defeatPopup = document.getElementById('defeatPopup');
    if (defeatPopup) defeatPopup.classList.add('hidden');

    // 3. Stopp risting på spritene
    document.getElementById('playerSprite')?.classList.remove('shake');
    document.getElementById('monsterSprite')?.classList.remove('shake');

    // 4. NULLSTILL OG STOPP POPUP-ANIMASJONER (+35 pt, -10 pt, Diamant-pop)
    const plusPop = document.getElementById('plusPointsPop');
    if (plusPop) plusPop.classList.remove('animate');

    const minusPop = document.getElementById('minusPointsPop');
    if (minusPop) minusPop.classList.remove('animate');

    const diamondPop = document.getElementById('diamondBonusPop');
    if (diamondPop) diamondPop.classList.remove('animate');

    // 5. Fjern eventuelle stjerner/partikler/stråler som flyr i arenaen
    const arena = document.getElementById('arenaContainer');
    if (arena) {
        const particles = arena.querySelectorAll('.effect-particle');
        particles.forEach(p => p.remove());
    }

    const enemyRay = document.getElementById('enemyRay');
    if (enemyRay) enemyRay.classList.remove('active');
}

function openSettings() {
    // 1. Drep alle aktive tidsur/sekvenser
    stopAllGameTimers();

    // 2. Skjul alle spillskjermer
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('victoryScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('shopScreen')?.classList.add('hidden');
    document.getElementById('settingsModalScreen')?.classList.add('hidden');
    document.getElementById('gameScreen')?.classList.add('hidden');

    // 3. Vis startskjermen
    document.getElementById('startScreen').classList.remove('hidden');
    updateMenuDisplay();
}

function pauseGame() {
    clearInterval(timerInterval);
    if (actionTimeout) clearTimeout(actionTimeout);
    document.getElementById('pauseScreen').classList.remove('hidden');
}

function resumeGame() {
    document.getElementById('pauseScreen').classList.add('hidden');
    runTimer(); 
}

function startGame() {
    // Stopp og nullstill alt av timere, effekter og hengende CSS-animasjoner
    stopAllGameTimers();

    // Sett opp helse, tid og spillstatus
    maxPlayerHp = upgrades.hpBought ? 120 : 100;
    playerHp = maxPlayerHp;
    timeLimit = baseTimeLimit + (upgrades.timeBought ? 2 : 0);

    score = 0; // Nullstill runde-poeng
    streak = 0;
    currentMonsterIndex = 0;
    monsterSolvedTasks = 0; // Nullstill fremgang på monster
    lastDiamondThreshold = 0;

    renderAvatar(getPlayerAvatarId(), '#playerAvatar');
    updateBuffIcons(); // <-- LEGG TIL DENNE LINJEN HER!

    // Vis/skjul riktige skjermer
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('victoryScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    // Start på helt ny runde
    renderTracker();
    updateStats();
    spawnMonster();
    nextQuestion();
}

function renderTracker() {
    const tracker = document.getElementById('monsterTracker');
    tracker.innerHTML = '';
    monsters.forEach((m, index) => {
        const node = document.createElement('div');
        node.className = 'tracker-node';
        node.innerHTML = getAvatarSvg(m.id);
        node.id = `tracker-node-${index}`;
        tracker.appendChild(node);
    });
}

function updateTracker() {
    monsters.forEach((m, index) => {
        const node = document.getElementById(`tracker-node-${index}`);
        if (node) {
            node.className = 'tracker-node';
            if (index < currentMonsterIndex) {
                node.classList.add('defeated');
            } else if (index === currentMonsterIndex) {
                node.classList.add('active');
            }
        }
    });
}

function addScore(points) {
    const wandBonusMultiplier = 1 + (upgrades.wandLevel * 0.1);
    const finalPoints = Math.round(points * wandBonusMultiplier);

    score += finalPoints;

    const currentThreshold = Math.floor(score / 10000);
    if (currentThreshold > lastDiamondThreshold) {
        const diamondsToAdd = currentThreshold - lastDiamondThreshold;
        diamonds += diamondsToAdd;
        lastDiamondThreshold = currentThreshold;
        
        saveData();
        showDiamondBonusPop();
    }

    updateStats();
    return finalPoints;
}

function showDiamondBonusPop() {
    const pop = document.getElementById('diamondBonusPop');
    pop.classList.remove('animate');
    void pop.offsetWidth;
    pop.classList.add('animate');
}

function updateStats() {
    document.getElementById('diamondDisplay').innerText = `💎 ${diamonds}`;
    document.getElementById('scoreDisplay').innerText = score;
    document.getElementById('streakDisplay').innerText = streak;
    
    const hpPct = Math.max(0, (playerHp / maxPlayerHp) * 100);
    document.getElementById('playerHpBar').style.width = hpPct + '%';
    
    // Oppdater personlig rekord om gjeldende runde slår den
    if (score > highscore) {
        highscore = score;
        saveData();
    }
}

function spawnMonster() {
    monsterSolvedTasks = 0;
    const currentMonster = monsters[currentMonsterIndex];
    
    const avatarEl = document.getElementById('monsterAvatar');
    renderAvatar(currentMonster.id, avatarEl);
    avatarEl.style.opacity = '1';

    document.getElementById('monsterName').innerText = currentMonster.name;
    document.getElementById('monsterStep').innerText = `Fiende ${currentMonsterIndex + 1} av ${monsters.length}`;
    
    updateMonsterHpBar();
    updateTracker();
}

function updateMonsterHpBar() {
    const currentMonster = monsters[currentMonsterIndex];
    const remainingTasks = currentMonster.requiredTasks - monsterSolvedTasks;
    const percentage = (remainingTasks / currentMonster.requiredTasks) * 100;
    
    document.getElementById('monsterHpBar').style.width = percentage + '%';
    document.getElementById('monsterProgressText').innerText = `${monsterSolvedTasks} / ${currentMonster.requiredTasks} oppgaver`;

    const opacityRatio = remainingTasks / currentMonster.requiredTasks;
    const opacityVal = Math.max(0.15, opacityRatio);
    document.getElementById('monsterAvatar').style.opacity = opacityVal;
}

function generateMathProblem() {
    let op = currentMode;
    if (op === 'mix') {
        const ops = ['add', 'sub', 'mul', 'div'];
        op = ops[Math.floor(Math.random() * ops.length)];
    }

    let num1, num2;
    const max = selectedMaxNum;

    if (op === 'add') {
        num1 = Math.floor(Math.random() * max) + 1;
        num2 = Math.floor(Math.random() * max) + 1;
        correctAnswer = num1 + num2;
        document.getElementById('questionDisplay').innerText = `${num1} + ${num2}`;
    } else if (op === 'sub') {
        num1 = Math.floor(Math.random() * max) + 1;
        num2 = Math.floor(Math.random() * max) + 1;
        if (num1 < num2) [num1, num2] = [num2, num1];
        correctAnswer = num1 - num2;
        document.getElementById('questionDisplay').innerText = `${num1} - ${num2}`;
    } else if (op === 'mul') {
        num1 = selectedTables[Math.floor(Math.random() * selectedTables.length)];
        num2 = Math.floor(Math.random() * 10) + 1;
        if (Math.random() < 0.5) [num1, num2] = [num2, num1];

        correctAnswer = num1 * num2;
        document.getElementById('questionDisplay').innerText = `${num1} × ${num2}`;
    } else if (op === 'div') {
        let divMax = max <= 20 ? max : (max === 100 ? 15 : 25);
        num2 = Math.floor(Math.random() * 10) + 1; 
        correctAnswer = Math.floor(Math.random() * divMax) + 1;
        num1 = correctAnswer * num2;
        document.getElementById('questionDisplay').innerText = `${num1} ÷ ${num2}`;
    }

    generateOptions();
}

function generateOptions() {
    let options = [correctAnswer];

    while (options.length < 4) {
        let offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        let wrongAnswer = correctAnswer + offset;

        if (wrongAnswer >= 0 && !options.includes(wrongAnswer)) {
            options.push(wrongAnswer);
        }
    }

    options.sort(() => Math.random() - 0.5);

    const optionButtons = document.querySelectorAll('.btn-option');
    optionButtons.forEach((btn, index) => {
        btn.innerText = options[index];
        btn.disabled = false;
    });
}

function startTimer() {
    timeLeft = 100;
    runTimer();
}

function runTimer() {
    clearInterval(timerInterval);
    const timerBar = document.getElementById('timerBar');
    const tickRate = 50;
    const decrement = (100 / (timeLimit * 1000)) * tickRate;

    timerInterval = setInterval(() => {
        timeLeft -= decrement;
        const currentPct = Math.max(0, timeLeft);
        timerBar.style.width = currentPct + '%';

        let hue;
        if (currentPct >= 85) {
            hue = 120;
        } else if (currentPct >= 50) {
            hue = 60 + ((currentPct - 50) / 35) * 60;
        } else if (currentPct >= 25) {
            hue = ((currentPct - 25) / 25) * 60;
        } else {
            hue = 0;
        }
        
        timerBar.style.backgroundColor = `hsl(${hue}, 100%, 45%)`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeOut();
        }
    }, tickRate);
}

function nextQuestion() {
    generateMathProblem();
    startTimer();
}

function triggerMagicStarsEffect() {
    const arena = document.getElementById('arenaContainer');
    const starSymbols = ['✨', '⭐', '🌟', '✦', '🔮'];

    for (let i = 0; i < 7; i++) {
        const star = document.createElement('div');
        star.className = 'effect-particle';
        star.innerText = starSymbols[Math.floor(Math.random() * starSymbols.length)];
        
        star.style.left = '90px';
        star.style.top = (30 + (Math.random() * 20 - 10)) + 'px';

        const targetX = 180 + Math.random() * 60;
        const targetY = (Math.random() * 60 - 30);
        
        star.style.setProperty('--target-x', `${targetX}px`);
        star.style.setProperty('--target-y', `${targetY}px`);

        arena.appendChild(star);
        setTimeout(() => star.remove(), 600);
    }
}

function triggerEnemyRayEffect() {
    const ray = document.getElementById('enemyRay');
    ray.classList.remove('active');
    void ray.offsetWidth;
    ray.classList.add('active');

    const arena = document.getElementById('arenaContainer');
    const sparkSymbols = ['⚡', '💥', '🔥'];

    for (let i = 0; i < 4; i++) {
        const spark = document.createElement('div');
        spark.className = 'effect-particle';
        spark.innerText = sparkSymbols[Math.floor(Math.random() * sparkSymbols.length)];
        
        spark.style.right = '90px';
        spark.style.top = (40 + (Math.random() * 30 - 15)) + 'px';

        const targetX = -(160 + Math.random() * 50);
        const targetY = (Math.random() * 50 - 25);

        spark.style.setProperty('--target-x', `${targetX}px`);
        spark.style.setProperty('--target-y', `${targetY}px`);

        arena.appendChild(spark);
        setTimeout(() => spark.remove(), 600);
    }
}

function showPlusPointsAnim(earnedPoints) {
    const plusPop = document.getElementById('plusPointsPop');
    plusPop.innerText = `+${earnedPoints} pt`;
    plusPop.classList.remove('animate');
    void plusPop.offsetWidth;
    plusPop.classList.add('animate');
}

function showMinusPointsAnim() {
    const minusPop = document.getElementById('minusPointsPop');
    minusPop.classList.remove('animate');
    void minusPop.offsetWidth; 
    minusPop.classList.add('animate');
}

function checkAnswer(selectedButton) {
    clearInterval(timerInterval);
    const selectedValue = parseInt(selectedButton.innerText);

    if (selectedValue === correctAnswer) {
        streak++;
        monsterSolvedTasks++;
        
        const timeBonus = Math.floor((Math.max(0, timeLeft) / 100) * 20);
        const basePoints = 10 + (streak * 2) + timeBonus;
        
        const finalEarned = addScore(basePoints);

        triggerMagicStarsEffect();
        showPlusPointsAnim(finalEarned);

        const monsterSprite = document.getElementById('monsterSprite');
        monsterSprite.classList.remove('shake');
        void monsterSprite.offsetWidth;
        monsterSprite.classList.add('shake');

        updateMonsterHpBar();

        const currentMonster = monsters[currentMonsterIndex];

        if (monsterSolvedTasks >= currentMonster.requiredTasks) {
            const defeatAvatarEl = document.getElementById('defeatPopupAvatar');
            renderAvatar(currentMonster.id, defeatAvatarEl);
            
            const nextMonster = monsters[currentMonsterIndex + 1];
            
            if (nextMonster) {
                document.getElementById('defeatPopupText').innerHTML = 
                    `Du beseiret <strong>${currentMonster.name}</strong>!<br>` +
                    `<span style="color: #ffd700; font-size: 0.95rem; display: inline-block; margin-top: 8px;">Neste utfordrer: <strong>${nextMonster.name}</strong> ⚔️</span>`;
            } else {
                document.getElementById('defeatPopupText').innerHTML = 
                    `Du beseiret <strong>${currentMonster.name}</strong>!<br>` +
                    `<span style="color: #38b000; font-size: 0.95rem; display: inline-block; margin-top: 8px;">Siste fiende er nedkjempet! 🏆</span>`;
            }
            
            const defeatPopup = document.getElementById('defeatPopup');
            defeatPopup.classList.remove('hidden');

            actionTimeout = setTimeout(() => {
                defeatPopup.classList.add('hidden');

                currentMonsterIndex++;
                
                if (currentMonsterIndex >= monsters.length) {
                    updateTracker();
                    winGame();
                } else {
                    spawnMonster();
                    updateStats();
                    nextQuestion();
                }
            }, 3000);

        } else {
            updateStats();
            actionTimeout = setTimeout(nextQuestion, 500);
        }

    } else {
        handleWrongAnswer();
    }
}

function handleTimeOut() {
    handleWrongAnswer();
}

function handleWrongAnswer() {
    streak = 0;
    
    const damage = upgrades.shieldBought ? 16 : 20;
    playerHp -= damage;

    score = Math.max(0, score - 10);
    showMinusPointsAnim();

    triggerEnemyRayEffect();

    const playerSprite = document.getElementById('playerSprite');
    playerSprite.classList.remove('shake');
    void playerSprite.offsetWidth;
    playerSprite.classList.add('shake');

    updateStats();

    if (playerHp <= 0) {
        actionTimeout = setTimeout(endGame, 500);
    } else {
        actionTimeout = setTimeout(nextQuestion, 600);
    }
}

function spawnConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';
    const colors = ['#38b000', '#7b2cbf', '#ffd700', '#ff4d6d', '#00b4d8'];

    for (let i = 0; i < 35; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 2) + 's';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        container.appendChild(piece);
    }
}

function clearConfetti() {
    document.getElementById('confettiContainer').innerHTML = '';
}

/* SEIER (KUN HER LEGGES RUNDE-POENG TIL TOTALEN) */
function winGame() {
    stopAllGameTimers();
    
    totalScore += score;
    diamonds++;
    saveData();

    document.getElementById('gameScreen').classList.add('hidden');

    renderAvatar(getPlayerAvatarId(), '#victoryAvatarContainer');
    updateBuffIcons(); // <-- Kjøres her så ikonene teppes opp på seiersskjermen

    const defeatedIcons = monsters.map(m => `<span class="defeated-icon">${getAvatarSvg(m.id)}</span>`).join('');
    document.getElementById('victoryDefeatedList').innerHTML = defeatedIcons;
    document.getElementById('victoryRoundScore').innerText = `${score} pt`;
    document.getElementById('victoryTotalScore').innerText = `${totalScore} pt`;
    document.getElementById('victoryTotalDiamonds').innerText = `${diamonds} 💎`;

    spawnConfetti();
    document.getElementById('victoryScreen').classList.remove('hidden');
}

/* GAME OVER (RUNDE-POENG BLIR IKKE LAGT TIL TOTALEN) */
function endGame() {
    stopAllGameTimers();
    
    document.getElementById('gameScreen').classList.add('hidden');
    
    const defeatedIcons = monsters.slice(0, currentMonsterIndex).map(m => `<span class="defeated-icon">${getAvatarSvg(m.id)}</span>`).join('') || "Ingen";
    const currentMonster = monsters[currentMonsterIndex];

    document.getElementById('gameOverDefeatedList').innerHTML = defeatedIcons;
    document.getElementById('gameOverStoppedBy').innerHTML = `<span class="stopped-by-icon">${getAvatarSvg(currentMonster.id)}</span> ${currentMonster.name}`;
    document.getElementById('gameOverRoundScore').innerText = `${score} pt`;
    document.getElementById('gameOverHighscore').innerText = `${highscore} pt`;

    // Tegn opp magikeren og oppdater buff-ikonene (🧪 ⏳) på Game Over-skjermen:
    renderAvatar(getPlayerAvatarId(), '#gameOverAvatarContainer');
    updateBuffIcons();

    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Eksponer funksjoner til globalt scope
Object.assign(window, {
    setMode,
    toggleTable,
    toggleAllTables,
    setMaxNum,
    setTimeLimit,
    openShop,
    closeShop,
    buyUpgrade,
    sellUpgrade, // <-- Legg til denne!
    openModalSettings,
    closeModalSettings,
    resetAllData,
    openSettings,
    pauseGame,
    resumeGame,
    startGame,
    checkAnswer
});

// Initiell kjøring
updateStats();
updateMenuDisplay();
updateBuffIcons(); // <-- Legg til denne!
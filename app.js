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

// Konfigurasjon for kartet
const worldLocations = [
    { id: 1, name: "Fiskerlandsbyen", req: 1000, desc: "Du har reddet kysten!", x: 23, y: 28, zoomX: 5, zoomY: 5, img: "Bilder/01.fisk.png" },
    { id: 2, name: "Den Mørke Skogen", req: 8000, desc: "Skogen er befridd!", x: 34, y: 61, zoomX: 20, zoomY: 50, img: "Bilder/02.skog.png" },
    { id: 3, name: "Tåkefjellet", req: 14000, desc: "Fjellet er trygt!", x: 50, y: 19, zoomX: 65, zoomY: 1, img: "Bilder/03.fjell.png" },
    { id: 4, name: "Dragegrotten", req: 21000, desc: "Grotten er renset!", x: 77, y: 42, zoomX: 100, zoomY: 25, img: "Bilder/04.grotte.png" },
    { id: 5, name: "Kongens Slott", req: 29000, desc: "Slottet er reddet!", x: 78, y: 73, zoomX: 100, zoomY: 80, img: "Bilder/05.slott.png" }
];


// Åpne kartet
function showMapScreen() {
    stopAllGameTimers();

    // Oppdater rekord, total og diamanter på kartet
    updateMenuDisplay();

    // Nullstill kart-zoom når kartet åpnes
    const wrapper = document.querySelector('.interactive-map-wrapper');
    const infoBanner = document.getElementById('mapInfoBanner');
    if (wrapper) wrapper.classList.remove('zoomed', 'locked-zoom');
    if (infoBanner) infoBanner.classList.add('hidden');

    document.getElementById('startScreen')?.classList.add('hidden');
    document.getElementById('gameScreen')?.classList.add('hidden');
    document.getElementById('victoryScreen')?.classList.add('hidden');
    document.getElementById('gameOverScreen')?.classList.add('hidden');

    const mapScreen = document.getElementById('mapScreen');
    if (mapScreen) mapScreen.classList.remove('hidden');

    renderMap();
}



function renderMap() {
    const container = document.getElementById('mapNodesContainer');
    if (!container) return;
    
    container.innerHTML = ''; 

    worldLocations.forEach(loc => {
        const isUnlocked = totalScore >= loc.req;
        const clickableArea = document.createElement('div');
        
        clickableArea.className = `map-click-target ${isUnlocked ? 'unlocked' : 'locked'}`;
        clickableArea.style.left = `${loc.x}%`;
        clickableArea.style.top = `${loc.y}%`;
        
        if (!isUnlocked) {
            clickableArea.innerHTML = `<span class="lock-icon">🔒</span>`;
        }
        
        clickableArea.onclick = (e) => {
            e.stopPropagation();
            zoomToLocation(loc, isUnlocked);
        };

        container.appendChild(clickableArea);
    });
}


// Viser seiersskjermen for et opplåst/befridd sted
function showUnlockedLocationScreen(location, currentPoints) {
    const screen = document.getElementById('locationUnlockedScreen');
    const imgEl = document.getElementById('unlockedLocationImg');
    const titleEl = document.getElementById('unlockedLocationTitle');
    const textEl = document.getElementById('unlockedLocationText');

    if (!screen) return;

    if (imgEl) imgEl.src = location.img;
    if (titleEl) titleEl.textContent = location.name;
    if (textEl) {
        textEl.innerHTML = `Gratulerer! Du har nådd <strong>${currentPoints} poeng</strong>.<br>${location.desc}`;
    }

    screen.classList.remove('hidden');
}

// Lukker pop-upen og returnerer til kartet
function closeUnlockedScreen() {
    document.getElementById('locationUnlockedScreen')?.classList.add('hidden');
    showMapScreen();
}

// ZOOM-FUNKSJON MED KLIKKBAR TEKST FOR ÅPNE STEDER
function zoomToLocation(location, isUnlocked) {
    const wrapper = document.querySelector('.interactive-map-wrapper');
    const mapImg = document.querySelector('.map-image');
    const infoBanner = document.getElementById('mapInfoBanner');

    if (!wrapper || !mapImg) return;

    // Sett zoom-punktet direkte fra zoomX og zoomY
    mapImg.style.transformOrigin = `${location.zoomX}% ${location.zoomY}%`;
    void mapImg.offsetHeight; // Tvinger oppdatering

    wrapper.classList.add('zoomed');

    if (!isUnlocked) {
        wrapper.classList.add('locked-zoom');
        if (infoBanner) {
            infoBanner.innerHTML = `🔒 <strong>${location.name}</strong> er låst! Du må samle <span class="req-highlight">${location.req} poeng</span>.`;
            infoBanner.classList.remove('hidden');
        }
    } else {
        wrapper.classList.remove('locked-zoom');
        if (infoBanner) {
            // Kall handleOpenSettings i stedet for openSettings direkte
            infoBanner.innerHTML = `⚔️ <strong>${location.name}</strong> er åpen! <span class="start-link" onclick="handleOpenSettings(event)">Klikk her for å starte! ▶</span>`;
            infoBanner.classList.remove('hidden');
        }
    }
}

// Ny hjelpefunksjon som zoomer ut FØR menyen åpnes
function handleOpenSettings(event) {
    if (event) event.stopPropagation();

    const wrapper = document.querySelector('.interactive-map-wrapper');
    const infoBanner = document.getElementById('mapInfoBanner');

    // 1. Zoom ut kartet og skjul tekstbanneret
    if (wrapper) wrapper.classList.remove('zoomed', 'locked-zoom');
    if (infoBanner) infoBanner.classList.add('hidden');

    // 2. Vent til utzoomingen er ferdig (800ms) før openSettings() kjøres
    setTimeout(() => {
        openSettings();
    }, 800);
}

// Funksjon som kalles når brukeren klikker på teksten for et åpent sted
function handleWorldClick(locationId, event) {
    if (event) event.stopPropagation(); // Hindrer at kartet zoomer ut ved klikk på teksten
    
    const wrapper = document.querySelector('.interactive-map-wrapper');
    const infoBanner = document.getElementById('mapInfoBanner');

    // Tilbakestiller kartvisningen
    if (wrapper) wrapper.classList.remove('zoomed', 'locked-zoom');
    if (infoBanner) infoBanner.classList.add('hidden');

    // Starter spillet/banen (eller åpner menyen)
    startWorldLevel(locationId);
}

// Global lytter: Zoom ut dersom man klikker på selve kartbildet (men IKKE på tekstbanneret)
document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.interactive-map-wrapper');
    const infoBanner = document.getElementById('mapInfoBanner');

    if (wrapper && wrapper.classList.contains('zoomed')) {
        // Hvis klikket var inne i wrapperen, men IKKE på infoBanner
        if (wrapper.contains(e.target) && !e.target.closest('#mapInfoBanner')) {
            wrapper.classList.remove('zoomed', 'locked-zoom');
            if (infoBanner) infoBanner.classList.add('hidden');
        }
    }
});

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
let baseTimeLimit = 4; 
let timeLimit = 4;
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
    if (tablesSection) {
        if (mode === 'mul') {
            tablesSection.classList.remove('hidden');
        } else {
            tablesSection.classList.add('hidden');
        }
    }
}

function toggleTable(num, e) {
    const btn = e.target.closest('button');
    if (!btn) return;

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
        if (buttons[1]) buttons[1].classList.add('selected');
    } else {
        selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        buttons.forEach(b => b.classList.add('selected'));
    }
    updateAllTablesBtnState();
}

function updateAllTablesBtnState() {
    const allBtn = document.querySelectorAll('.tables-grid .table-btn')[0];
    if (allBtn) {
        if (selectedTables.length === 10) {
            allBtn.classList.add('selected');
        } else {
            allBtn.classList.remove('selected');
        }
    }
}

function setMaxNum(max, e) {
    selectedMaxNum = max;

    const btn = e ? (e.target.closest('button') || e.target) : null;
    if (btn) {
        setActiveButton(btn);
    }

    const noTimeBtn = document.getElementById('noTimeBtn') || document.getElementById('noTimeOptionSection');
    
    if (noTimeBtn) {
        if (max >= 100) {
            noTimeBtn.classList.remove('hidden');
            noTimeBtn.style.display = ''; 
        } else {
            noTimeBtn.classList.add('hidden');
            noTimeBtn.style.display = 'none';

            if (baseTimeLimit === 0 || timeLimit === 0) {
                baseTimeLimit = 4;
                timeLimit = 4;
                const firstTimeBtn = document.querySelector('.time-options button');
                if (firstTimeBtn) setActiveButton(firstTimeBtn);
            }
        }
    }
}

function setTimeLimit(seconds, e) {
    baseTimeLimit = seconds;
    timeLimit = seconds;
    setActiveButton(e.target);
}

function setActiveButton(element) {
    const btn = element.closest('button');
    if (!btn) return;
    const parent = btn.parentElement;
    if (parent) {
        parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');
}

function updateMenuDisplay() {
    const displayText = `🏆 REKORD: ${highscore} pt | ⭐ TOTAL: ${totalScore} pt | 💎 ${diamonds}`;

    const menuDisplay = document.getElementById('menuHighscoreDisplay');
    if (menuDisplay) {
        menuDisplay.innerText = displayText;
    }

    // LEGG TIL DISSE TO LINJENE:
    const mapDisplay = document.getElementById('mapHighscoreDisplay');
    if (mapDisplay) {
        mapDisplay.innerText = displayText;
    }

    renderAvatar(getPlayerAvatarId(), '#titleAvatar');
}

/* BUTIKK FUNKSJONER */
function openShop() {
    renderShop();
    document.getElementById('shopScreen')?.classList.remove('hidden');
}

function closeShop() {
    document.getElementById('shopScreen')?.classList.add('hidden');
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

    ['menuBuffs', 'gameBuffs', 'summaryBuffs', 'gameOverBuffs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = buffsHTML;
    });
}

function renderShop() {
    const diamondsEl = document.getElementById('shopDiamondsDisplay');
    if (diamondsEl) diamondsEl.innerText = diamonds;

    // --- TRYLESTAV ---
    const wandCost = 5 * (upgrades.wandLevel + 1);
    const wandDesc = document.getElementById('wandDesc');
    if (wandDesc) {
        wandDesc.innerText = upgrades.wandLevel > 0 
            ? `Nivå ${upgrades.wandLevel}: Gir +${upgrades.wandLevel * 10}% ekstra poeng.` 
            : `Gir +10% ekstra poeng per nivå.`;
    }
    
    const btnWand = document.getElementById('btnBuyWand');
    if (btnWand) {
        btnWand.innerText = `Kjøp (${wandCost} 💎)`;
        btnWand.disabled = diamonds < wandCost;
    }

    let btnSellWand = document.getElementById('btnSellWand');
    if (btnSellWand) {
        btnSellWand.style.display = upgrades.wandLevel > 0 ? 'inline-block' : 'none';
        btnSellWand.innerText = `Selg (-1 niv: +${5 * upgrades.wandLevel} 💎)`;
    }

    // --- SKJOLD ---
    const btnShield = document.getElementById('btnBuyShield');
    let btnSellShield = document.getElementById('btnSellShield');
    const shieldDesc = document.getElementById('shieldDesc');
    
    if (upgrades.shieldBought) {
        if (shieldDesc) shieldDesc.innerText = "Kjøpt! Tar 20% mindre skade.";
        if (btnShield) btnShield.style.display = 'none';
        if (btnSellShield) btnSellShield.style.display = 'inline-block';
    } else {
        if (shieldDesc) shieldDesc.innerText = "Tar 20% mindre skade fra feilsvar.";
        if (btnShield) {
            btnShield.style.display = 'inline-block';
            btnShield.innerText = "8 💎";
            btnShield.disabled = diamonds < 8;
        }
        if (btnSellShield) btnSellShield.style.display = 'none';
    }

    // --- HP ---
    const btnHp = document.getElementById('btnBuyHp');
    let btnSellHp = document.getElementById('btnSellHp');
    const hpDesc = document.getElementById('hpDesc');
    
    if (upgrades.hpBought) {
        if (hpDesc) hpDesc.innerText = "Kjøpt! Du starter med 120 HP.";
        if (btnHp) btnHp.style.display = 'none';
        if (btnSellHp) btnSellHp.style.display = 'inline-block';
    } else {
        if (hpDesc) hpDesc.innerText = "Start med 120 HP i stedet for 100.";
        if (btnHp) {
            btnHp.style.display = 'inline-block';
            btnHp.innerText = "10 💎";
            btnHp.disabled = diamonds < 10;
        }
        if (btnSellHp) btnSellHp.style.display = 'none';
    }

    // --- TID ---
    const btnTime = document.getElementById('btnBuyTime');
    let btnSellTime = document.getElementById('btnSellTime');
    const timeDesc = document.getElementById('timeDesc');
    
    if (upgrades.timeBought) {
        if (timeDesc) timeDesc.innerText = "Kjøpt! +2 sekunder på oppgaver.";
        if (btnTime) btnTime.style.display = 'none';
        if (btnSellTime) btnSellTime.style.display = 'inline-block';
    } else {
        if (timeDesc) timeDesc.innerText = "+2 sekunder ekstra per oppgave.";
        if (btnTime) {
            btnTime.style.display = 'inline-block';
            btnTime.innerText = "12 💎";
            btnTime.disabled = diamonds < 12;
        }
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
    updateBuffIcons();
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
    updateBuffIcons();
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
        updateBuffIcons();
        closeModalSettings();
    }
}

function stopAllGameTimers() {
    clearInterval(timerInterval);
    timerInterval = null;

    if (actionTimeout) {
        clearTimeout(actionTimeout);
        actionTimeout = null;
    }

    clearConfetti();

    const defeatPopup = document.getElementById('defeatPopup');
    if (defeatPopup) defeatPopup.classList.add('hidden');

    document.getElementById('playerSprite')?.classList.remove('shake');
    document.getElementById('monsterSprite')?.classList.remove('shake');

    document.getElementById('plusPointsPop')?.classList.remove('animate');
    document.getElementById('minusPointsPop')?.classList.remove('animate');
    document.getElementById('diamondBonusPop')?.classList.remove('animate');

    const arena = document.getElementById('arenaContainer');
    if (arena) {
        const particles = arena.querySelectorAll('.effect-particle');
        particles.forEach(p => p.remove());
    }

    const enemyRay = document.getElementById('enemyRay');
    if (enemyRay) enemyRay.classList.remove('active');
}

function openSettings() {
    stopAllGameTimers();

    // 1. Nullstill poeng og framgang fra den avbrutte runden
    score = 0;
    streak = 0;
    monsterSolvedTasks = 0;

    // 2. Nullstill kart-zoomen og skjul tekstbanneret
    const wrapper = document.querySelector('.interactive-map-wrapper');
    const infoBanner = document.getElementById('mapInfoBanner');
    
    if (wrapper) wrapper.classList.remove('zoomed', 'locked-zoom');
    if (infoBanner) infoBanner.classList.add('hidden');

    // 3. Skjul alle andre skjermer (inkludert kartet og pausevisningen)
    document.getElementById('mapScreen')?.classList.add('hidden');
    document.getElementById('pauseScreen')?.classList.add('hidden');
    document.getElementById('victoryScreen')?.classList.add('hidden');
    document.getElementById('gameOverScreen')?.classList.add('hidden');
    document.getElementById('shopScreen')?.classList.add('hidden');
    document.getElementById('settingsModalScreen')?.classList.add('hidden');
    document.getElementById('gameScreen')?.classList.add('hidden');

    // 4. Vis startmenyen og oppdater visningen
    document.getElementById('startScreen')?.classList.remove('hidden');
    updateMenuDisplay();
}



function pauseGame() {
    clearInterval(timerInterval);
    if (actionTimeout) clearTimeout(actionTimeout);
    document.getElementById('pauseScreen')?.classList.remove('hidden');
}

function resumeGame() {
    document.getElementById('pauseScreen')?.classList.add('hidden');
    runTimer(); 
}

// Ta imot worldId som argument (f.eks. 1 for Fiskerlandsbyen)
function startGame(worldId = 1) {
    stopAllGameTimers();

    // 1. Lagre den valgte verdenen så spilleskjermen vet hva som skal lastes
    currentWorldId = worldId;

    maxPlayerHp = upgrades.hpBought ? 120 : 100;
    playerHp = maxPlayerHp;
    timeLimit = baseTimeLimit + (upgrades.timeBought ? 2 : 0);

    score = 0; 
    streak = 0;
    currentMonsterIndex = 0;
    monsterSolvedTasks = 0; 
    lastDiamondThreshold = 0;

    renderAvatar(getPlayerAvatarId(), '#playerAvatar');
    updateBuffIcons();

    // 2. Skjul kartskjermen i tillegg til de andre skjermene
    document.getElementById('startScreen')?.classList.add('hidden');
    document.getElementById('mapScreen')?.classList.add('hidden'); // Sørg for at kartet skjules
    document.getElementById('gameOverScreen')?.classList.add('hidden');
    document.getElementById('victoryScreen')?.classList.add('hidden');
    
    document.getElementById('gameScreen')?.classList.remove('hidden');

    renderTracker();
    updateStats();
    spawnMonster();
    nextQuestion();
}

function getAvatarSvgSafe(id) {
    if (typeof getAvatarSvg === 'function') {
        return getAvatarSvg(id);
    }
    return '👾';
}

function renderTracker() {
    const tracker = document.getElementById('monsterTracker');
    if (!tracker) return;
    tracker.innerHTML = '';
    monsters.forEach((m, index) => {
        const node = document.createElement('div');
        node.className = 'tracker-node';
        node.innerHTML = getAvatarSvgSafe(m.id);
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
    if (pop) {
        pop.classList.remove('animate');
        void pop.offsetWidth;
        pop.classList.add('animate');
    }
}

function updateStats() {
    const diaEl = document.getElementById('diamondDisplay');
    if (diaEl) diaEl.innerText = `💎 ${diamonds}`;
    
    const scoreEl = document.getElementById('scoreDisplay');
    if (scoreEl) scoreEl.innerText = score;
    
    const streakEl = document.getElementById('streakDisplay');
    if (streakEl) streakEl.innerText = streak;
    
    const hpBar = document.getElementById('playerHpBar');
    if (hpBar) {
        const hpPct = Math.max(0, (playerHp / maxPlayerHp) * 100);
        hpBar.style.width = hpPct + '%';
    }
    
    if (score > highscore) {
        highscore = score;
        saveData();
    }
}

function spawnMonster() {
    monsterSolvedTasks = 0;
    const currentMonster = monsters[currentMonsterIndex];
    
    const avatarEl = document.getElementById('monsterAvatar');
    if (avatarEl) {
        renderAvatar(currentMonster.id, avatarEl);
        avatarEl.style.opacity = '1';
    }

    const nameEl = document.getElementById('monsterName');
    if (nameEl) nameEl.innerText = currentMonster.name;

    const stepEl = document.getElementById('monsterStep');
    if (stepEl) stepEl.innerText = `Fiende ${currentMonsterIndex + 1} av ${monsters.length}`;
    
    updateMonsterHpBar();
    updateTracker();
}

function updateMonsterHpBar() {
    const currentMonster = monsters[currentMonsterIndex];
    const remainingTasks = currentMonster.requiredTasks - monsterSolvedTasks;
    const percentage = (remainingTasks / currentMonster.requiredTasks) * 100;
    
    const bar = document.getElementById('monsterHpBar');
    if (bar) bar.style.width = percentage + '%';

    const text = document.getElementById('monsterProgressText');
    if (text) text.innerText = `${monsterSolvedTasks} / ${currentMonster.requiredTasks} oppgaver`;

    const avatarEl = document.getElementById('monsterAvatar');
    if (avatarEl) {
        const opacityRatio = remainingTasks / currentMonster.requiredTasks;
        avatarEl.style.opacity = Math.max(0.15, opacityRatio);
    }
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
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    if (timeLimit === 0) {
        const timerBar = document.getElementById('timerBar');
        if (timerBar) {
            timerBar.style.width = '100%';
        }
        return; 
    }

    timeLeft = 100;
    runTimer();
}

function runTimer() {
    clearInterval(timerInterval);
    const timerBar = document.getElementById('timerBar');
    if (!timerBar) return;

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
    if (!arena) return;

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
    if (ray) {
        ray.classList.remove('active');
        void ray.offsetWidth;
        ray.classList.add('active');
    }

    const arena = document.getElementById('arenaContainer');
    if (!arena) return;

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
    if (plusPop) {
        plusPop.innerText = `+${earnedPoints} pt`;
        plusPop.classList.remove('animate');
        void plusPop.offsetWidth;
        plusPop.classList.add('animate');
    }
}

function showMinusPointsAnim() {
    const minusPop = document.getElementById('minusPointsPop');
    if (minusPop) {
        minusPop.classList.remove('animate');
        void minusPop.offsetWidth; 
        minusPop.classList.add('animate');
    }
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
        if (monsterSprite) {
            monsterSprite.classList.remove('shake');
            void monsterSprite.offsetWidth;
            monsterSprite.classList.add('shake');
        }

        updateMonsterHpBar();

        const currentMonster = monsters[currentMonsterIndex];

        if (monsterSolvedTasks >= currentMonster.requiredTasks) {
            const defeatAvatarEl = document.getElementById('defeatPopupAvatar');
            renderAvatar(currentMonster.id, defeatAvatarEl);
            
            const nextMonster = monsters[currentMonsterIndex + 1];
            const defeatText = document.getElementById('defeatPopupText');
            
            if (defeatText) {
                if (nextMonster) {
                    defeatText.innerHTML = 
                        `Du beseiret <strong>${currentMonster.name}</strong>!<br>` +
                        `<span style="color: #ffd700; font-size: 0.95rem; display: inline-block; margin-top: 8px;">Neste utfordrer: <strong>${nextMonster.name}</strong> ⚔️</span>`;
                } else {
                    defeatText.innerHTML = 
                        `Du beseiret <strong>${currentMonster.name}</strong>!<br>` +
                        `<span style="color: #38b000; font-size: 0.95rem; display: inline-block; margin-top: 8px;">Siste fiende er nedkjempet! 🏆</span>`;
                }
            }
            
            const defeatPopup = document.getElementById('defeatPopup');
            if (defeatPopup) defeatPopup.classList.remove('hidden');

            actionTimeout = setTimeout(() => {
                if (defeatPopup) defeatPopup.classList.add('hidden');

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
    if (playerSprite) {
        playerSprite.classList.remove('shake');
        void playerSprite.offsetWidth;
        playerSprite.classList.add('shake');
    }

    updateStats();

    if (playerHp <= 0) {
        actionTimeout = setTimeout(endGame, 500);
    } else {
        actionTimeout = setTimeout(nextQuestion, 600);
    }
}

function spawnConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
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
    const container = document.getElementById('confettiContainer');
    if (container) container.innerHTML = '';
}

/* SEIER */
function winGame() {
    stopAllGameTimers();
    
    const prevTotal = totalScore;
    totalScore += score;
    diamonds++;
    saveData();

    document.getElementById('gameScreen')?.classList.add('hidden');

    if (checkNewAreaUnlocked(prevTotal)) {
        return; 
    }

    renderAvatar(getPlayerAvatarId(), '#victoryAvatarContainer');
    updateBuffIcons();

    const defeatedIcons = monsters.map(m => `<span class="defeated-icon">${getAvatarSvgSafe(m.id)}</span>`).join('');
    
    const listEl = document.getElementById('victoryDefeatedList');
    if (listEl) listEl.innerHTML = defeatedIcons;
    
    document.getElementById('victoryRoundScore').innerText = `${score} pt`;
    document.getElementById('victoryTotalScore').innerText = `${totalScore} pt`;
    document.getElementById('victoryTotalDiamonds').innerText = `${diamonds} 💎`;

    spawnConfetti();
    document.getElementById('victoryScreen')?.classList.remove('hidden');
}

/* GAME OVER */
function endGame() {
    stopAllGameTimers();
    
    const prevTotal = totalScore;
    totalScore += score;
    saveData();
    
    document.getElementById('gameScreen')?.classList.add('hidden');

    if (checkNewAreaUnlocked(prevTotal)) {
        return; 
    }
    
    const defeatedIcons = monsters.slice(0, currentMonsterIndex).map(m => `<span class="defeated-icon">${getAvatarSvgSafe(m.id)}</span>`).join('') || "Ingen";
    const currentMonster = monsters[currentMonsterIndex];

    const listEl = document.getElementById('gameOverDefeatedList');
    if (listEl) listEl.innerHTML = defeatedIcons;

    const stoppedByEl = document.getElementById('gameOverStoppedBy');
    if (stoppedByEl) stoppedByEl.innerHTML = `<span class="stopped-by-icon">${getAvatarSvgSafe(currentMonster.id)}</span> ${currentMonster.name}`;

    document.getElementById('gameOverRoundScore').innerText = `${score} pt`;
    const highscoreEl = document.getElementById('gameOverHighscore');
    if (highscoreEl) highscoreEl.innerText = `${highscore} pt`;

    renderAvatar(getPlayerAvatarId(), '#gameOverAvatarContainer');
    updateBuffIcons();

    document.getElementById('gameOverScreen')?.classList.remove('hidden');
}

function checkNewAreaUnlocked(previousTotal) {
    const newlyUnlocked = worldLocations.find(loc => previousTotal < loc.req && totalScore >= loc.req);
    
    if (newlyUnlocked) {
        // Kaller din nye, styled seiersskjerm i stedet for alert
        showUnlockedLocationScreen(newlyUnlocked, totalScore);
        return true;
    }
    return false;
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
    sellUpgrade,
    openModalSettings,
    closeModalSettings,
    resetAllData,
    openSettings,
    pauseGame,
    resumeGame,
    startGame,
    checkAnswer,
    showMapScreen
});

// Initialisering ved lasting av skjermen
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    showMapScreen();
    updateBuffIcons();
});
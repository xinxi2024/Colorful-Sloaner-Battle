let currentLevel = null;
let board = [];
let score = 0;
let movesLeft = 0;
let isAnimating = false;
let timer = null;
let timeLeft = 0;
let currentUser = null;
let lastPageState = null;
let comboCount = 0;
let lastEliminateTime = 0;

// 音频相关
const audioFiles = {
    background: new Audio('assets/audio/background.mp3'),
    match: new Audio('assets/audio/match.mp3'),
    swap: new Audio('assets/audio/swap.mp3'),
    levelComplete: new Audio('assets/audio/level-complete.mp3'),
    achievement: new Audio('assets/audio/achievement.mp3')
};

// 设置背景音乐循环播放
audioFiles.background.loop = true;

// 初始化音频
function initAudio() {
    // 设置所有音频的音量
    Object.values(audioFiles).forEach(audio => {
        audio.volume = 0.5;
    });
    // 背景音乐音量稍微调低
    audioFiles.background.volume = 0.3;
}

// 播放音效
function playSound(soundName) {
    if (audioFiles[soundName]) {
        // 如果是背景音乐，直接播放
        if (soundName === 'background') {
            audioFiles.background.play().catch(e => console.log('Audio play failed:', e));
            return;
        }
        
        // 如果是其他音效，不影响背景音乐
        const sound = audioFiles[soundName];
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

// 更新成就系统
const achievements = {
    novice: {
        id: 'novice',
        name: '初出茅庐',
        description: '完成第一个关卡',
        icon: '🌟'
    },
    expert: {
        id: 'expert',
        name: '消除专家',
        description: '在一次消除中连接5个或更多方块',
        icon: '⭐'
    },
    master: {
        id: 'master',
        name: '消除大师',
        description: '完成10个关卡',
        icon: '👑'
    },
    speedster: {
        id: 'speedster',
        name: '闪电手',
        description: '在30秒内完成一个关卡',
        icon: '⚡'
    },
    perfectionist: {
        id: 'perfectionist',
        name: '完美主义者',
        description: '获得3个满分关卡',
        icon: '💎'
    },
    persistent: {
        id: 'persistent',
        name: '百折不挠',
        description: '在同一关卡尝试5次后成功',
        icon: '🔥'
    },
    collector: {
        id: 'collector',
        name: '收藏家',
        description: '解锁所有成就',
        icon: '🏆'
    },
    combo_master: {
        id: 'combo_master',
        name: '连击大师',
        description: '在一次移动中触发3次以上的消除',
        icon: '⚡'
    },
    time_lord: {
        id: 'time_lord',
        name: '时间领主',
        description: '完成所有限时关卡',
        icon: '⌛'
    },
    explorer: {
        id: 'explorer',
        name: '探索者',
        description: '尝试每个区域的至少一个关卡',
        icon: '🗺️'
    },
    veteran: {
        id: 'veteran',
        name: '老玩家',
        description: '游戏时间超过1小时',
        icon: '👴'
    },
    strategist: {
        id: 'strategist',
        name: '战略家',
        description: '使用最少的步数完成一个关卡',
        icon: '🎯'
    }
};

// 在文件开头添加
function showStartScreen() {
    document.getElementById('start-screen').style.display = 'flex';
    document.getElementById('level-select').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    
    // 添加成就按钮
    if (!document.querySelector('.achievements-btn')) {
        const achievementsBtn = document.createElement('button');
        achievementsBtn.className = 'achievements-btn';
        achievementsBtn.innerHTML = '🏆 成就';
        achievementsBtn.addEventListener('click', showAchievementsPanel);
        document.querySelector('.start-content').appendChild(achievementsBtn);
    }
    
    // 清除页面状态
    localStorage.removeItem('lastPageState');
}

function showLevelSelect() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('level-select').style.display = 'block';
    document.getElementById('game-screen').style.display = 'none';
    
    // 保存页面状态
    localStorage.setItem('lastPageState', 'level-select');
    
    // 清空并重新初始化关卡列表
    const levelsGrid = document.getElementById('levels-grid');
    levelsGrid.innerHTML = '';
    initLevelSelect();

    // 显示当前区域
    const currentGroup = localStorage.getItem('currentGroup') || '1';
    const tabs = document.querySelectorAll('.level-tab');
    const targetTab = document.querySelector(`.level-tab[data-group="${currentGroup}"]`);
    if (targetTab) {
        tabs.forEach(t => t.classList.remove('active'));
        targetTab.classList.add('active');
        
        const groups = document.querySelectorAll('.level-group');
        groups.forEach(g => g.classList.remove('active'));
        document.querySelector(`.level-group[data-group="${currentGroup}"]`).classList.add('active');
    }
}

// 修改关卡选择界面初始化
function initLevelSelect() {
    const levelsGrid = document.getElementById('levels-grid');
    levelsGrid.innerHTML = '';
    
    const backButton = document.createElement('button');
    backButton.className = 'back-to-home';
    backButton.innerHTML = '返回主页';
    backButton.addEventListener('click', showStartScreen);
    levelsGrid.appendChild(backButton);
    
    // 创建关卡选择容器
    const levelSelectionContainer = document.createElement('div');
    levelSelectionContainer.innerHTML = `
        <div class="level-tabs">
            <div class="level-tab active" data-group="1">新手区 1-10 <span class="level-count">10关</span></div>
            <div class="level-tab" data-group="2">进阶区 11-20 <span class="level-count">10关</span></div>
            <div class="level-tab" data-group="3">挑战区 21-30 <span class="level-count">10关</span></div>
            <div class="level-tab" data-group="4">大师区 31-40 <span class="level-count">10关</span></div>
            <div class="level-tab" data-group="5">传说区 41-50 <span class="level-count">10关</span></div>
        </div>
        <div class="level-groups"></div>
    `;
    levelsGrid.appendChild(levelSelectionContainer);

    let userData = loadUserData();
    if (!userData) {
        userData = initUser();
    }
    
    const levelGroups = document.querySelector('.level-groups');
    const groupedLevels = {};
    levels.forEach(level => {
        const groupIndex = Math.floor((level.id - 1) / 10) + 1;
        if (!groupedLevels[groupIndex]) {
            groupedLevels[groupIndex] = [];
        }
        groupedLevels[groupIndex].push(level);
    });

    // 特殊方块说明
    const specialBlocksInfo = {
        2: {
            title: '🎉 解锁新特殊方块：💣 炸弹方块',
            description: '在进阶区首次出现，可以消除3x3范围内的所有方块'
        },
        3: {
            title: '🎉 解锁新特殊方块：⚡ 闪电方块',
            description: '在挑战区首次出现，可以消除整行和整列的方块'
        },
        4: {
            title: '🎉 解锁新特殊方块：🌈 彩虹方块',
            description: '在大师区首次出现，可以消除所有相同颜色的方块'
        },
        5: {
            title: '🎉 解锁新特殊方块：✨ 魔法方块',
            description: '在传说区首次出现，可以与任意方块交换位置'
        }
    };

    // 添加道具说明
    const itemsInfo = {
        2: {
            type: ITEMS.SHUFFLE,
            title: '🔄 洗牌道具',
            description: '重新排列所有方块，在没有可消除组合时特别有用'
        },
        3: {
            type: ITEMS.COLOR_BOMB,
            title: '🎨 彩色炸弹',
            description: '选择一种颜色，消除场上所有相同颜色的方块'
        },
        4: {
            type: ITEMS.HAMMER,
            title: '🔨 锤子',
            description: '点击任意方块将其消除'
        },
        5: {
            type: ITEMS.CROSS,
            title: '✚ 十字消除',
            description: '点击任意位置，消除该位置的横竖线上的所有方块'
        }
    };

    Object.keys(groupedLevels).forEach(groupIndex => {
        const group = document.createElement('div');
        group.className = `level-group ${groupIndex === '1' ? 'active' : ''}`;
        group.dataset.group = groupIndex;

        // 添加特殊方块说明
        if (specialBlocksInfo[groupIndex]) {
            const specialBlockInfo = document.createElement('div');
            // 检查是否解锁了该区域（完成了上一个区域的最后一关）
            const lastLevelOfPreviousGroup = (parseInt(groupIndex) - 1) * 10;
            const isUnlocked = userData.completedLevels.includes(lastLevelOfPreviousGroup);
            
            specialBlockInfo.className = `special-block-info ${isUnlocked ? '' : 'locked'}`;
            if (isUnlocked) {
                specialBlockInfo.innerHTML = `
                    <div class="special-block-title">${specialBlocksInfo[groupIndex].title}</div>
                    <div class="special-block-description">${specialBlocksInfo[groupIndex].description}</div>
                `;
            } else {
                specialBlockInfo.innerHTML = `
                    <div class="special-block-title">🔒 特殊方块未解锁</div>
                    <div class="special-block-description">完成上一区域所有关卡以解锁</div>
                `;
            }
            group.appendChild(specialBlockInfo);
        }

        // 添加道具说明
        if (itemsInfo[groupIndex]) {
            const itemInfo = document.createElement('div');
            const lastLevelOfPreviousGroup = (parseInt(groupIndex) - 1) * 10;
            const isUnlocked = userData.completedLevels.includes(lastLevelOfPreviousGroup);
            
            itemInfo.className = `special-block-info ${isUnlocked ? '' : 'locked'}`;
            if (isUnlocked) {
                itemInfo.innerHTML = `
                    <div class="special-block-title">🎁 解锁新道具：${itemsInfo[groupIndex].title}</div>
                    <div class="special-block-description">${itemsInfo[groupIndex].description}</div>
                    <div class="special-block-description">完成本区域关卡可获得更多道具</div>
                `;
            } else {
                itemInfo.innerHTML = `
                    <div class="special-block-title">🔒 新道具未解锁</div>
                    <div class="special-block-description">完成上一区域所有关卡以解锁</div>
                `;
            }
            group.appendChild(itemInfo);
        }

        groupedLevels[groupIndex].forEach(level => {
            const isCompleted = userData.completedLevels.includes(level.id);
            const isLocked = level.id > 1 && !userData.completedLevels.includes(level.id - 1);
            const highScore = userData.highScores[level.id] || 0;
            
            const levelCard = document.createElement('div');
            levelCard.className = `level-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
            levelCard.innerHTML = `
                <span class="level-difficulty difficulty-${Math.ceil(level.id / 10)}">难度 ${Math.ceil(level.id / 10)}</span>
                <h3>${level.name}</h3>
                <div class="level-info">
                    <p>目标分数: ${level.target}</p>
                    <p>${level.timeLimit ? `时间限制: ${level.timeLimit}秒` : `步数限制: ${level.moves}`}</p>
                    <p>颜色数量: ${level.colors.length}</p>
                    <p>棋盘大小: ${level.gridSize}x${level.gridSize}</p>
                </div>
                <div class="level-stats">
                    <div>最高分: <span class="high-score">${highScore}</span></div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (highScore / level.target) * 100)}%"></div>
                    </div>
                </div>
            `;

            if (!isLocked) {
                levelCard.addEventListener('click', () => startLevel(level));
            }
            
            group.appendChild(levelCard);
        });

        levelGroups.appendChild(group);
    });

    const tabs = document.querySelectorAll('.level-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const groups = document.querySelectorAll('.level-group');
            groups.forEach(g => g.classList.remove('active'));
            document.querySelector(`.level-group[data-group="${tab.dataset.group}"]`).classList.add('active');
        });
    });
}

// 开始指定关卡
function startLevel(level) {
    currentLevel = level;
    score = 0;
    movesLeft = level.moves;
    timeLeft = level.timeLimit || 0;
    
    // 重置当前关卡可用的道具数量
    const levelGroup = Math.ceil(level.id / 10);
    let userData = loadUserData();
    if (!userData.items) userData.items = {};
    if (!userData.usedItems) userData.usedItems = {};
    
    // 重置所有可用道具的数量为1（包括之前区域的道具）
    if (levelGroup > 1) {
        for (let i = 2; i <= levelGroup; i++) {
            if (itemsInfo[i]) {
                userData.items[itemsInfo[i].type] = 1;
            }
        }
    }
    
    // 重置已使用道具记录
    userData.usedItems[level.id] = [];
    
    saveUserData(userData);
    
    // 播放背景音乐
    playSound('background');
    
    // 更新UI
    document.getElementById('level-select').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('level-name').textContent = level.name;
    
    // 初始化道具栏
    initItemsBar();
    
    updateGameInfo();
    initBoard();
    
    if (level.timeLimit) {
        startTimer();
    }
}

// 更新游戏信息显示
function updateGameInfo() {
    const movesElement = document.getElementById('moves');
    if (currentLevel.timeLimit) {
        movesElement.textContent = `剩余时间: ${timeLeft}秒`;
    } else {
        movesElement.textContent = `剩余步数: ${movesLeft}`;
    }
    document.getElementById('score').textContent = `得分: ${score} / ${currentLevel.target}`;
}

// 检查游戏是否结束
function checkGameEnd() {
    const timeSpent = currentLevel.timeLimit ? currentLevel.timeLimit - timeLeft : null;
    const currentGroup = Math.ceil(currentLevel.id / 10);
    
    if (score >= currentLevel.target) {
        // 立即停止所有游戏操作
        isAnimating = true;
        stopTimer();
        
        // 停止背景音乐并播放胜利音效
        audioFiles.background.pause();
        playSound('levelComplete');
        
        // 更新用户进度
        updateUserProgress(currentLevel.id, score, true);
        
        // 获取最新的用户数据并检查成就
        const userData = loadUserData();
        checkAchievements(userData, currentLevel.id, score, timeSpent);
        
        // 清除存档
        clearSavedGame();
        
        // 设置状态
        localStorage.setItem('lastPageState', 'level-select');
        localStorage.setItem('currentGroup', currentGroup.toString());
        
        // 显示通关提示并刷新页面
        setTimeout(() => {
            alert('恭喜通关！');
            window.location.reload();
        }, 300);
        return true;
    } else if (movesLeft <= 0 && !currentLevel.timeLimit) {
        // 立即停止所有游戏操作
        isAnimating = true;
        stopTimer();
        
        // 停止背景音乐
        audioFiles.background.pause();
        
        // 更新用户进度
        updateUserProgress(currentLevel.id, score, false);
        
        // 更新尝试次数
        const userData = loadUserData();
        userData.levelAttempts[currentLevel.id] = (userData.levelAttempts[currentLevel.id] || 0) + 1;
        saveUserData(userData);
        
        // 清除存档
        clearSavedGame();
        
        // 设置状态
        localStorage.setItem('currentGroup', currentGroup.toString());
        
        // 显示失败提示并刷新页面
        setTimeout(() => {
            alert('步数用完了，游戏结束！');
            window.location.reload();
        }, 300);
        return true;
    }
    return false;
}

// 返回关卡选择
function returnToLevelSelect() {
    // 停止背景音乐
    audioFiles.background.pause();
    audioFiles.background.currentTime = 0;
    
    // 停止计时器
    stopTimer();
    
    // 清除游戏状态
    timeLeft = 0;
    currentLevel = null;
    
    // 切换界面显示
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('level-select').style.display = 'block';
    
    // 重新初始化关卡选择界面以更新数据显示
    initLevelSelect();
}

// 添加特殊方块类型
const SPECIAL_BLOCKS = {
    BOMB: 'bomb',      // 炸弹方块
    LIGHTNING: 'lightning',  // 闪电方块
    RAINBOW: 'rainbow',    // 彩虹方块
    MAGIC: 'magic'       // 魔法方块
};

// 添加道具类型定义
const ITEMS = {
    SHUFFLE: 'shuffle',      // 重新排列所有方块
    COLOR_BOMB: 'colorBomb', // 消除所有指定颜色的方块
    HAMMER: 'hammer',        // 消除任意一个方块
    CROSS: 'cross'          // 十字消除
};

// 道具信息
const itemsInfo = {
    2: {
        type: ITEMS.SHUFFLE,
        title: '🔄 洗牌道具',
        description: '重新排列所有方块，在没有可消除组合时特别有用'
    },
    3: {
        type: ITEMS.COLOR_BOMB,
        title: '🎨 彩色炸弹',
        description: '选择一种颜色，消除场上所有相同颜色的方块'
    },
    4: {
        type: ITEMS.HAMMER,
        title: '🔨 锤子',
        description: '点击任意方块将其消除'
    },
    5: {
        type: ITEMS.CROSS,
        title: '✚ 十字消除',
        description: '点击任意位置，消除该位置的横竖线上的所有方块'
    }
};

// 修改 initBoard 函数
function initBoard() {
    const size = currentLevel.gridSize;
    board = [];
    const levelGroup = Math.ceil(currentLevel.id / 10);
    
    // 根据关卡组调整特殊方块出现概率和类型
    let specialBlockChance = 0;
    let availableSpecialBlocks = [];
    
    switch(levelGroup) {
        case 2: // 进阶区
            specialBlockChance = 0.03; // 3%概率
            availableSpecialBlocks = [SPECIAL_BLOCKS.BOMB];
            break;
        case 3: // 挑战区
            specialBlockChance = 0.04; // 4%概率
            availableSpecialBlocks = [SPECIAL_BLOCKS.BOMB, SPECIAL_BLOCKS.LIGHTNING];
            break;
        case 4: // 大师区
            specialBlockChance = 0.045; // 4.5%概率
            availableSpecialBlocks = [SPECIAL_BLOCKS.BOMB, SPECIAL_BLOCKS.LIGHTNING, SPECIAL_BLOCKS.RAINBOW];
            break;
        case 5: // 传说区
            specialBlockChance = 0.05; // 5%概率
            availableSpecialBlocks = [SPECIAL_BLOCKS.BOMB, SPECIAL_BLOCKS.LIGHTNING, SPECIAL_BLOCKS.RAINBOW, SPECIAL_BLOCKS.MAGIC];
            break;
    }
    
    // 根据关卡组调整颜色数量
    let colors = [...currentLevel.colors];
    if (levelGroup >= 2) {
        // 进阶区开始增加颜色数量，但每个区域最多只增加一种新颜色
        const additionalColors = [
            '#800000', // 深红
            '#008080', // 青色
            '#4B0082', // 靛蓝
            '#556B2F'  // 暗橄榄绿
        ];
        const extraColors = additionalColors.slice(0, Math.min(levelGroup - 1, 1));
        colors = [...colors, ...extraColors];
    }
    
    for (let i = 0; i < size; i++) {
        board[i] = [];
        for (let j = 0; j < size; j++) {
            const randomIndex = Math.floor(Math.random() * colors.length);
            
            // 检查是否生成特殊方块
            if (Math.random() < specialBlockChance) {
                switch(levelGroup) {
                    case 2:
                        board[i][j] = { type: SPECIAL_BLOCKS.BOMB, color: colors[randomIndex] };
                        break;
                    case 3:
                        board[i][j] = { type: SPECIAL_BLOCKS.LIGHTNING, color: colors[randomIndex] };
                        break;
                    case 4:
                        board[i][j] = { type: SPECIAL_BLOCKS.RAINBOW, color: colors[randomIndex] };
                        break;
                    case 5:
                        board[i][j] = { type: SPECIAL_BLOCKS.MAGIC, color: colors[randomIndex] };
                        break;
                    default:
                        board[i][j] = colors[randomIndex];
                }
            } else {
                board[i][j] = colors[randomIndex];
            }
        }
    }
    
    // 检查初始棋盘是否有可消除的组合
    while (checkMatches()) {
        // 如果有可消除的组合，重新生成棋盘
        initBoard();
        return;
    }
    
    renderBoard();
}

// 修改 renderBoard 函数中的方块渲染部分
function renderBoard() {
    const boardElement = document.getElementById('board');
    const fragment = document.createDocumentFragment();
    const size = currentLevel.gridSize;
    
    // 设置网格大小和方块大小
    boardElement.style.setProperty('--grid-size', size);
    const defaultBlockSize = 60;
    let blockSize = defaultBlockSize;
    
    if (currentLevel.blockSize) {
        if (typeof currentLevel.blockSize === 'number') {
            blockSize = currentLevel.blockSize;
        } else if (typeof currentLevel.blockSize === 'object') {
            if (currentLevel.blockSize.dynamic) {
                blockSize = defaultBlockSize;
            } else {
                blockSize = Math.floor((currentLevel.blockSize.max + currentLevel.blockSize.min) / 2);
            }
        }
    }
    
    boardElement.style.setProperty('--block-size', `${blockSize}px`);
    boardElement.innerHTML = '';
    
    board.forEach((row, i) => {
        row.forEach((cell, j) => {
            const cellElement = document.createElement('div');
            cellElement.className = 'cell';
            
            // 处理null值和特殊方块
            if (!cell) {
                cellElement.dataset.value = '';
                cellElement.style.backgroundColor = 'transparent';
            } else if (typeof cell === 'object' && cell.type) {
                cellElement.dataset.value = cell.color;
                cellElement.dataset.special = cell.type;
                cellElement.style.backgroundColor = cell.color;
                
                const specialIcon = document.createElement('div');
                specialIcon.className = 'special-icon';
                switch(cell.type) {
                    case SPECIAL_BLOCKS.BOMB:
                        specialIcon.textContent = '💣';
                        break;
                    case SPECIAL_BLOCKS.LIGHTNING:
                        specialIcon.textContent = '⚡';
                        break;
                    case SPECIAL_BLOCKS.RAINBOW:
                        specialIcon.textContent = '🌈';
                        break;
                    case SPECIAL_BLOCKS.MAGIC:
                        specialIcon.textContent = '✨';
                        break;
                }
                cellElement.appendChild(specialIcon);
            } else {
                cellElement.dataset.value = cell;
                cellElement.style.backgroundColor = cell;
            }
            
            cellElement.dataset.row = i;
            cellElement.dataset.col = j;
            
            // 添加特效类
            if (currentLevel.features) {
                Object.keys(currentLevel.features).forEach(feature => {
                    if (currentLevel.features[feature]) {
                        cellElement.classList.add(feature);
                    }
                });
            }
            
            // 处理不规则大小
            if (currentLevel.blockSize && typeof currentLevel.blockSize === 'object') {
                if (currentLevel.blockSize.dynamic) {
                    cellElement.classList.add('dynamic');
                } else {
                    const randomSize = Math.floor(
                        Math.random() * 
                        (currentLevel.blockSize.max - currentLevel.blockSize.min) + 
                        currentLevel.blockSize.min
                    );
                    cellElement.style.setProperty('--block-size', `${randomSize}px`);
                }
            }
            
            cellElement.style.setProperty('--block-index', i * size + j);
            cellElement.addEventListener('click', handleCellClick);
            fragment.appendChild(cellElement);
        });
    });
    
    requestAnimationFrame(() => {
        boardElement.appendChild(fragment);
    });
}

// 添加检查相邻方块的函数
function isAdjacent(row1, col1, row2, col2) {
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
}

let selectedCells = [];

function handleCellClick(event) {
    if (isAnimating || (!currentLevel.timeLimit && movesLeft <= 0)) return;
    
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    if (selectedCells.length === 0) {
        // 第一次选中
        cell.classList.add('selected');
        selectedCells.push({ row, col, element: cell });
    } else {
        const firstCell = selectedCells[0];
        // 检查是否相邻
        if (isAdjacent(firstCell.row, firstCell.col, row, col)) {
            // 播放交换音效
            playSound('swap');
            
            // 交换方块
            swapCells(firstCell.row, firstCell.col, row, col).then(() => {
                // 更新步数
                if (!currentLevel.timeLimit) {
                    movesLeft--;
                }
                updateGameInfo();
                
                // 检查是否有可消除的方块
                if (checkMatches()) {
                    // 播放消除音效
                    playSound('match');
                    eliminateMatches();
                    setTimeout(() => fillBoard(), 300);
                }
            });
        }
        // 清除选中状态
        firstCell.element.classList.remove('selected');
        selectedCells = [];
    }
}

async function swapCells(row1, col1, row2, col2) {
    isAnimating = true;
    
    const cell1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
    const cell2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
    
    if (!cell1 || !cell2) return;
    
    // 保存原始位置
    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();
    
    // 计算位移
    const deltaX = rect2.left - rect1.left;
    const deltaY = rect2.top - rect1.top;
    
    // 应用动画
    cell1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    cell2.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
    
    // 等待动画完成
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 交换数据
    const temp = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = temp;
    
    // 使用 requestAnimationFrame 优化渲染
    requestAnimationFrame(() => {
        renderBoard();
        isAnimating = false;
    });
}

function checkMatches() {
    const size = currentLevel.gridSize;
    // 横向检测
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size - 2; j++) {
            if (board[i][j] && board[i][j] === board[i][j+1] && board[i][j] === board[i][j+2]) {
                return true;
            }
        }
    }
    // 纵向检测
    for (let j = 0; j < size; j++) {
        for (let i = 0; i < size - 2; i++) {
            if (board[i][j] && board[i][j] === board[i+1][j] && board[i][j] === board[i+2][j]) {
                return true;
            }
        }
    }
    return false;
}

function eliminateMatches() {
    let toEliminate = new Set();
    const size = currentLevel.gridSize;
    const now = Date.now();
    
    // 检查是否为连击（2秒内的消除视为连击）
    if (now - lastEliminateTime < 2000) {
        comboCount++;
    } else {
        comboCount = 0;
    }
    lastEliminateTime = now;
    
    // 处理特殊方块
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const cell = board[i][j];
            if (typeof cell === 'object' && cell.type) {
                switch(cell.type) {
                    case SPECIAL_BLOCKS.BOMB:
                        // 消除3x3范围，基础分数更高
                        for (let di = -1; di <= 1; di++) {
                            for (let dj = -1; dj <= 1; dj++) {
                                const ni = i + di;
                                const nj = j + dj;
                                if (ni >= 0 && ni < size && nj >= 0 && nj < size) {
                                    toEliminate.add(`${ni},${nj}`);
                                }
                            }
                        }
                        break;
                    case SPECIAL_BLOCKS.LIGHTNING:
                        // 消除整行和整列，基础分数最高
                        for (let k = 0; k < size; k++) {
                            toEliminate.add(`${i},${k}`); // 整行
                            toEliminate.add(`${k},${j}`); // 整列
                        }
                        break;
                    case SPECIAL_BLOCKS.RAINBOW:
                        // 消除所有相同颜色的方块
                        const targetColor = cell.color;
                        for (let ni = 0; ni < size; ni++) {
                            for (let nj = 0; nj < size; nj++) {
                                const neighborCell = board[ni][nj];
                                const neighborColor = typeof neighborCell === 'object' ? neighborCell.color : neighborCell;
                                if (neighborColor === targetColor) {
                                    toEliminate.add(`${ni},${nj}`);
                                }
                            }
                        }
                        break;
                }
            }
        }
    }
    
    // 原有的消除检测逻辑
    // 横向检测
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size - 2; j++) {
            const cell1 = board[i][j];
            const cell2 = board[i][j+1];
            const cell3 = board[i][j+2];
            const color1 = typeof cell1 === 'object' ? cell1.color : cell1;
            const color2 = typeof cell2 === 'object' ? cell2.color : cell2;
            const color3 = typeof cell3 === 'object' ? cell3.color : cell3;
            
            if (color1 && color1 === color2 && color1 === color3) {
                toEliminate.add(`${i},${j}`);
                toEliminate.add(`${i},${j+1}`);
                toEliminate.add(`${i},${j+2}`);
            }
        }
    }
    
    // 纵向检测
    for (let j = 0; j < size; j++) {
        for (let i = 0; i < size - 2; i++) {
            const cell1 = board[i][j];
            const cell2 = board[i+1][j];
            const cell3 = board[i+2][j];
            const color1 = typeof cell1 === 'object' ? cell1.color : cell1;
            const color2 = typeof cell2 === 'object' ? cell2.color : cell2;
            const color3 = typeof cell3 === 'object' ? cell3.color : cell3;
            
            if (color1 && color1 === color2 && color1 === color3) {
                toEliminate.add(`${i},${j}`);
                toEliminate.add(`${i+1},${j}`);
                toEliminate.add(`${i+2},${j}`);
            }
        }
    }
    
    if (toEliminate.size > 0) {
        // 播放消除音效
        playSound('match');
        
        // 计算基础分数（每个方块2分）
        let basePoints = toEliminate.size * 2;
        
        // 计算连击加成（每次连击增加10%，最高1.3倍）
        const comboBonus = comboCount > 0 ? Math.min(comboCount * 0.1, 0.3) : 0;
        
        // 计算最终得分
        const finalPoints = Math.floor(basePoints * (1 + comboBonus));
        
        // 显示加分动画
        const centerCoord = Array.from(toEliminate)[Math.floor(toEliminate.size / 2)];
        const [centerRow, centerCol] = centerCoord.split(',').map(Number);
        
        // 显示连击文字
        if (comboCount > 0) {
            showComboAnimation(comboCount, centerRow, centerCol);
        }
        
        // 显示得分动画
        showScoreAnimation(finalPoints, centerRow, centerCol);
        
        toEliminate.forEach(coord => {
            const [row, col] = coord.split(',').map(Number);
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('matched');
            }
            board[row][col] = null;
        });
        
        score += finalPoints;
        updateGameInfo();
        checkGameEnd();
    } else {
        // 如果没有可消除的方块，重置连击计数
        comboCount = 0;
    }
}

// 添加连击动画显示函数
function showComboAnimation(combo, row, col) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    const comboElement = document.createElement('div');
    comboElement.className = 'combo-popup';
    comboElement.innerHTML = `
        <span class="combo-count">${combo}</span>
        <span class="combo-text">连击！</span>
    `;
    
    // 获取方块的位置
    const rect = cell.getBoundingClientRect();
    
    // 设置连击显示的初始位置
    comboElement.style.left = `${rect.left + rect.width / 2}px`;
    comboElement.style.top = `${rect.top - 30}px`;
    
    document.body.appendChild(comboElement);
    
    // 添加动画效果
    requestAnimationFrame(() => {
        comboElement.style.transform = 'translateY(-30px) scale(1.2)';
        comboElement.style.opacity = '0';
    });
    
    // 动画结束后移除元素
    setTimeout(() => {
        comboElement.remove();
    }, 1000);
}

// 添加分数动画显示函数
function showScoreAnimation(points, row, col) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    const scoreElement = document.createElement('div');
    scoreElement.className = 'score-popup';
    scoreElement.textContent = `+${points}`;
    
    // 获取方块的位置
    const rect = cell.getBoundingClientRect();
    
    // 设置分数显示的初始位置
    scoreElement.style.left = `${rect.left + rect.width / 2}px`;
    scoreElement.style.top = `${rect.top + rect.height / 2}px`;
    
    document.body.appendChild(scoreElement);
    
    // 添加动画效果
    requestAnimationFrame(() => {
        scoreElement.style.transform = 'translateY(-50px)';
        scoreElement.style.opacity = '0';
    });
    
    // 动画结束后移除元素
    setTimeout(() => {
        scoreElement.remove();
    }, 1000);
}

async function fillBoard() {
    isAnimating = true;
    const size = currentLevel.gridSize;
    const boardElement = document.getElementById('board');
    
    // 记录需要填充的空位置
    const emptyPositions = [];
    const fallingBlocks = [];
    
    // 第一步：收集所有空位置和可以下落的方块
    for (let j = 0; j < size; j++) {
        for (let i = size - 1; i >= 0; i--) {
            if (board[i][j] === null) {
                // 从当前位置向上查找可以下落的方块
                let foundBlock = false;
                for (let k = i - 1; k >= 0; k--) {
                    if (board[k][j] !== null) {
                        fallingBlocks.push({
                            fromRow: k,
                            fromCol: j,
                            toRow: i,
                            toCol: j,
                            value: board[k][j]
                        });
                        board[k][j] = null;
                        foundBlock = true;
                        break;
                    }
                }
                if (!foundBlock) {
                    emptyPositions.push({ row: i, col: j });
                }
            }
        }
    }
    
    // 第二步：更新数据，但还不渲染
    fallingBlocks.forEach(block => {
        board[block.toRow][block.toCol] = block.value;
    });
    
    // 第三步：填充新方块
    emptyPositions.forEach(pos => {
        const randomIndex = Math.floor(Math.random() * currentLevel.colors.length);
        board[pos.row][pos.col] = currentLevel.colors[randomIndex];
    });
    
    // 第四步：渲染新的棋盘状态
    renderBoard();
    
    // 第五步：检查是否有可消除的组合
    setTimeout(() => {
        isAnimating = false;
        if (checkMatches()) {
            eliminateMatches();
            setTimeout(() => fillBoard(), 300);
        }
    }, 300);
}

// 修改初始化代码（文件末尾）
document.addEventListener('DOMContentLoaded', () => {
    // 检查上次的页面状态
    const lastState = localStorage.getItem('lastPageState');
    if (lastState === 'level-select') {
        showLevelSelect();
    } else {
        showStartScreen();
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    initUser(); // 初始化用户数据
    
    // 检查是否有存档
    if (loadGame()) {
        const continueGame = confirm('检测到游戏存档，是否继续上次的游戏？');
        if (continueGame) {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            return;
        } else {
            clearSavedGame();
        }
    }
    showLevelSelect();
});
document.getElementById('restart-btn').addEventListener('click', () => startLevel(currentLevel));
document.getElementById('back-btn').addEventListener('click', returnToLevelSelect);

// 用户系统相关函数
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function initUser() {
    currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        currentUser = generateUserId();
        localStorage.setItem('currentUser', currentUser);
    }
    
    let userData = loadUserData();
    if (!userData) {
        userData = {
            completedLevels: [],
            highScores: {},
            lastPlayedLevel: null,
            achievements: {},
            levelAttempts: {},
            perfectLevels: 0,
            totalPlayTime: 0,
            items: {},        // 新增：用户拥有的道具
            unlockedItems: [] // 新增：已解锁的道具类型
        };
        saveUserData(userData);
    }
    return userData;
}

function loadUserData() {
    const userData = localStorage.getItem(`userData_${currentUser}`);
    return userData ? JSON.parse(userData) : null;
}

function saveUserData(data) {
    localStorage.setItem(`userData_${currentUser}`, JSON.stringify(data));
}

function updateUserProgress(levelId, score, completed) {
    let userData = loadUserData();
    if (!userData) {
        userData = {
            completedLevels: [],
            highScores: {},
            lastPlayedLevel: null,
            achievements: {},
            levelAttempts: {},
            perfectLevels: 0,
            totalPlayTime: 0
        };
    }

    // 更新完成状态
    if (completed && !userData.completedLevels.includes(levelId)) {
        userData.completedLevels.push(levelId);
        userData.completedLevels.sort((a, b) => a - b); // 保持有序
    }

    // 更新最高分
    if (!userData.highScores[levelId] || score > userData.highScores[levelId]) {
        userData.highScores[levelId] = score;
    }

    // 更新最后玩过的关卡
    userData.lastPlayedLevel = levelId;

    // 保存更新后的数据
    saveUserData(userData);
}

// 修改存档系统
function saveGame() {
    const gameState = {
        currentLevel: currentLevel,
        board: board,
        score: score,
        movesLeft: movesLeft,
        timeLeft: timeLeft
    };
    localStorage.setItem(`savedGame_${currentUser}`, JSON.stringify(gameState));
}

function loadGame() {
    const savedGame = localStorage.getItem(`savedGame_${currentUser}`);
    if (savedGame) {
        const gameState = JSON.parse(savedGame);
        currentLevel = gameState.currentLevel;
        board = gameState.board;
        score = gameState.score;
        movesLeft = gameState.movesLeft;
        timeLeft = gameState.timeLeft;
        
        updateGameInfo();
        renderBoard();
        
        if (currentLevel.timeLimit) {
            startTimer();
        }
        
        return true;
    }
    return false;
}

function clearSavedGame() {
    localStorage.removeItem(`savedGame_${currentUser}`);
}

// 启动计时器
function startTimer() {
    timeLeft = currentLevel.timeLimit;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        if (timeLeft > 0 && currentLevel) {  // 添加currentLevel检查
            timeLeft--;
            updateGameInfo();
            if (timeLeft <= 0) {
                stopTimer();
                // 停止背景音乐
                audioFiles.background.pause();
                setTimeout(() => {
                    alert('时间到！游戏结束！');
                    returnToLevelSelect();
                }, 300);
            }
        } else {
            stopTimer();  // 如果不在游戏中，停止计时器
        }
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

// 添加成就显示UI
function showAchievement(achievement) {
    const achievementElement = document.createElement('div');
    achievementElement.className = 'achievement-notification';
    achievementElement.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-content">
            <div class="achievement-title">解锁成就：${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
        </div>
    `;
    document.body.appendChild(achievementElement);
    
    // 自动移除通知
    setTimeout(() => {
        achievementElement.classList.add('fade-out');
        setTimeout(() => achievementElement.remove(), 500);
    }, 3000);
}

// 检查并更新成就
function checkAchievements(userData, levelId, score, timeSpent) {
    // 确保 userData 和其属性存在
    if (!userData || !userData.completedLevels || !userData.achievements) {
        userData = {
            completedLevels: [],
            achievements: {},
            levelAttempts: {},
            perfectLevels: 0,
            highScores: {}
        };
    }
    
    const newAchievements = [];
    
    // 检查"初出茅庐"成就
    if (!userData.achievements.novice && userData.completedLevels.length > 0) {
        userData.achievements.novice = true;
        newAchievements.push(achievements.novice);
    }
    
    // 检查"消除大师"成就
    if (!userData.achievements.master && userData.completedLevels.length >= 10) {
        userData.achievements.master = true;
        newAchievements.push(achievements.master);
    }
    
    // 检查"闪电手"成就
    if (!userData.achievements.speedster && timeSpent && timeSpent <= 30) {
        userData.achievements.speedster = true;
        newAchievements.push(achievements.speedster);
    }
    
    // 检查"完美主义者"成就
    if (score === currentLevel.target) {
        userData.perfectLevels = (userData.perfectLevels || 0) + 1;
        if (!userData.achievements.perfectionist && userData.perfectLevels >= 3) {
            userData.achievements.perfectionist = true;
            newAchievements.push(achievements.perfectionist);
        }
    }
    
    // 检查"百折不挠"成就
    if (!userData.levelAttempts[levelId]) {
        userData.levelAttempts[levelId] = 0;
    }
    if (!userData.achievements.persistent && userData.levelAttempts[levelId] >= 5) {
        userData.achievements.persistent = true;
        newAchievements.push(achievements.persistent);
    }
    
    // 保存更新后的用户数据
    saveUserData(userData);
    
    // 显示新解锁的成就
    newAchievements.forEach(achievement => showAchievement(achievement));
}

// 添加成就展示界面
function showAchievementsPanel() {
    const userData = loadUserData() || { achievements: {} };  // 确保有默认值
    const achievementsPanel = document.createElement('div');
    achievementsPanel.className = 'achievements-panel';
    achievementsPanel.innerHTML = `
        <div class="achievements-header">
            <h2>我的成就</h2>
            <button class="close-btn">×</button>
        </div>
        <div class="achievements-list">
            ${Object.values(achievements).map(achievement => `
                <div class="achievement-item ${userData.achievements[achievement.id] ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-desc">${achievement.description}</div>
                    </div>
                    ${userData.achievements[achievement.id] ? '<div class="achievement-unlocked">✓</div>' : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    document.body.appendChild(achievementsPanel);
    
    achievementsPanel.querySelector('.close-btn').addEventListener('click', () => {
        achievementsPanel.remove();
    });
}

// 修改 initItemsBar 函数
function initItemsBar() {
    const gameScreen = document.getElementById('game-screen');
    const board = document.getElementById('board');
    
    // 移除旧的道具栏
    const oldItemsBar = document.querySelector('.items-bar-container');
    if (oldItemsBar) {
        oldItemsBar.remove();
    }

    const levelGroup = Math.ceil(currentLevel.id / 10);
    
    // 新手区不显示道具栏
    if (levelGroup === 1) {
        return;
    }

    // 初始化用户数据
    let userData = loadUserData();
    if (!userData) {
        userData = {
            items: {},
            usedItems: {}
        };
    }

    // 确保必要的属性存在
    if (!userData.items) userData.items = {};
    if (!userData.usedItems) userData.usedItems = {};
    if (!userData.usedItems[currentLevel.id]) {
        userData.usedItems[currentLevel.id] = [];
    }

    const itemsBarContainer = document.createElement('div');
    itemsBarContainer.className = 'items-bar-container';
    
    // 添加道具区标题
    const itemsTitle = document.createElement('div');
    itemsTitle.className = 'items-title';
    itemsTitle.textContent = '🎁 道具区';
    itemsBarContainer.appendChild(itemsTitle);

    const itemsBar = document.createElement('div');
    itemsBar.className = 'items-bar';
    
    // 显示所有已解锁的道具（当前区域及之前区域的道具）
    for (let i = 2; i <= levelGroup; i++) {
        const item = itemsInfo[i];
        if (item) {
            const itemCount = userData.items[item.type] || 0;
            const isUsed = userData.usedItems[currentLevel.id].includes(item.type);
            const itemButton = document.createElement('button');
            itemButton.className = `item-button ${itemCount === 0 || isUsed ? 'disabled' : ''}`;
            itemButton.innerHTML = `
                ${item.title.split(' ')[0]}
                <span class="item-count">${itemCount}</span>
                <span class="item-tooltip">${item.title} - ${item.description}</span>
            `;
            
            if (itemCount > 0 && !isUsed) {
                itemButton.addEventListener('click', () => useItem(item.type));
            }
            
            itemsBar.appendChild(itemButton);
        }
    }
    
    itemsBarContainer.appendChild(itemsBar);
    board.parentNode.insertBefore(itemsBarContainer, board.nextSibling);
}

// 修改 useItem 函数
function useItem(itemType) {
    const userData = loadUserData();
    if (!userData.items[itemType] || userData.items[itemType] <= 0) return;
    
    // 检查是否已在本关使用过该道具
    if (!userData.usedItems[currentLevel.id]) {
        userData.usedItems[currentLevel.id] = [];
    }
    if (userData.usedItems[currentLevel.id].includes(itemType)) {
        return;
    }
    
    const board = document.getElementById('board');
    board.classList.add('using-item');
    
    // 移除之前的所有道具点击事件
    const cells = board.getElementsByClassName('cell');
    Array.from(cells).forEach(cell => {
        cell.removeEventListener('click', handleItemClick);
    });
    
    // 根据道具类型添加不同的点击效果
    switch(itemType) {
        case ITEMS.SHUFFLE:
            shuffleBoard();
            finishItemUse(itemType);
            break;
            
        case ITEMS.COLOR_BOMB:
        case ITEMS.HAMMER:
        case ITEMS.CROSS:
            Array.from(cells).forEach(cell => {
                cell.addEventListener('click', handleItemClick);
            });
            break;
    }
    
    // 标记道具为已使用
    userData.usedItems[currentLevel.id].push(itemType);
    saveUserData(userData);
    
    // 保存当前使用的道具类型
    board.dataset.usingItem = itemType;
}

// 添加道具点击处理函数
function handleItemClick(e) {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const itemType = document.getElementById('board').dataset.usingItem;
    
    switch(itemType) {
        case ITEMS.COLOR_BOMB:
            const color = typeof board[row][col] === 'object' ? board[row][col].color : board[row][col];
            if (color) {
                eliminateColor(color);
                finishItemUse(itemType);
            }
            break;
            
        case ITEMS.HAMMER:
            eliminateCell(row, col);
            finishItemUse(itemType);
            break;
            
        case ITEMS.CROSS:
            eliminateCross(row, col);
            finishItemUse(itemType);
            break;
    }
}

// 添加道具效果完成函数
function finishItemUse(itemType) {
    const board = document.getElementById('board');
    board.classList.remove('using-item');
    board.removeAttribute('data-using-item');
    
    // 更新道具数量
    const userData = loadUserData();
    userData.items[itemType]--;
    saveUserData(userData);
    
    // 重新初始化道具栏
    initItemsBar();
    
    // 检查并填充空缺
    setTimeout(() => fillBoard(), 300);
}

// 添加各种道具效果函数
function eliminateColor(color) {
    const size = currentLevel.gridSize;
    let toEliminate = new Set();
    
    // 收集所有匹配颜色的方块
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const cell = board[i][j];
            const cellColor = typeof cell === 'object' ? cell.color : cell;
            if (cellColor === color) {
                toEliminate.add(`${i},${j}`);
            }
        }
    }
    
    if (toEliminate.size > 0) {
        // 计算得分
        let basePoints = toEliminate.size * 2;
        const finalPoints = Math.floor(basePoints);
        
        // 显示得分动画
        const firstCoord = Array.from(toEliminate)[0];
        const [centerRow, centerCol] = firstCoord.split(',').map(Number);
        showScoreAnimation(finalPoints, centerRow, centerCol);
        
        // 先标记要消除的方块
        toEliminate.forEach(coord => {
            const [row, col] = coord.split(',').map(Number);
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('matched');
            }
        });
        
        // 等待消除动画完成后再更新棋盘
        setTimeout(() => {
            // 更新board数组
            toEliminate.forEach(coord => {
                const [row, col] = coord.split(',').map(Number);
                board[row][col] = null;
            });
            
            score += finalPoints;
            updateGameInfo();
            
            // 播放消除音效
            playSound('match');
            
            // 渲染并填充棋盘
            renderBoard();
            setTimeout(fillBoard, 300);
            checkGameEnd();
        }, 300);
    }
}

function eliminateCell(row, col) {
    if (board[row][col]) {
        board[row][col] = null;
        renderBoard();
        playSound('match');
    }
}

function eliminateCross(row, col) {
    const size = currentLevel.gridSize;
    let eliminated = false;
    
    // 消除同行
    for (let j = 0; j < size; j++) {
        if (board[row][j]) {
            board[row][j] = null;
            eliminated = true;
        }
    }
    
    // 消除同列
    for (let i = 0; i < size; i++) {
        if (board[i][col]) {
            board[i][col] = null;
            eliminated = true;
        }
    }
    
    if (eliminated) {
        renderBoard();
        playSound('match');
    }
}

// 添加洗牌函数
function shuffleBoard() {
    const size = currentLevel.gridSize;
    const flatBoard = [];
    
    // 收集所有非空方块
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j]) {
                flatBoard.push(board[i][j]);
            }
        }
    }
    
    // 打乱方块顺序
    for (let i = flatBoard.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flatBoard[i], flatBoard[j]] = [flatBoard[j], flatBoard[i]];
    }
    
    // 重新填充棋盘
    let index = 0;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j]) {
                board[i][j] = flatBoard[index++];
            }
        }
    }
    
    // 重新渲染棋盘
    renderBoard();
}



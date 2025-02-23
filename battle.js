class BattleMode {
    constructor() {
        this.ws = null;
        this.roomId = null;
        this.playerId = null;
        this.isHost = false;
        this.gameStarted = false;
        this.timeLeft = 60;
        this.timer = null;
        this.score = 0;

        // 游戏核心属性
        this.selectedCell = null;
        this.board = [];
        this.isAnimating = false;
        this.combo = 0;
        this.maxCombo = 0;

        // 道具系统
        this.items = {
            hammer: { count: 1, name: '锤子', description: '消除任意一个方块' },
            bomb: { count: 1, name: '炸弹', description: '消除3x3范围内的方块' },
            refresh: { count: 1, name: '刷新', description: '重新排列所有方块' },
            colorBomb: { count: 1, name: '同色炸弹', description: '消除所有相同颜色的方块' }
        };

        // 特殊方块概率
        this.specialBlockChance = 0.1; // 10%概率生成特殊方块
        this.specialTypes = ['rainbow', 'bomb', 'lightning', 'star'];

        // 音效系统
        this.sounds = {
            match: new Audio('./assets/audio/match.mp3'),
            swap: new Audio('./assets/audio/swap.mp3'),
            special: new Audio('./assets/audio/match.mp3'),  // 暂时用match.mp3代替
            combo: new Audio('./assets/audio/match.mp3')     // 暂时用match.mp3代替
        };

        // 预加载音效并处理错误
        Object.entries(this.sounds).forEach(([key, sound]) => {
            sound.addEventListener('error', (e) => {
                console.warn(`无法加载音效: ${key}`, e);
                // 移除失败的音效
                this.sounds[key] = null;
            });
            sound.volume = 0.3;
            // 预加载
            sound.load();
        });

        this.initializeWebSocket();
        this.setupEventListeners();

        // 添加必要的CSS样式
        const style = document.createElement('style');
        style.textContent = `
            .cell.swapping {
                transition: transform 0.08s ease-in-out;
                z-index: 2;
            }
            
            .cell.falling {
                transition: transform 0.05s ease-in-out;
                z-index: 1;
            }
            
            .cell.new-block {
                animation: cellAppear 0.05s ease-out;
            }
            
            .cell.matched {
                animation: eliminate 0.08s ease-out;
            }
            
            @keyframes cellAppear {
                from {
                    transform: scale(0) rotate(-180deg);
                    opacity: 0;
                }
                to {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }
            
            @keyframes eliminate {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.3) rotate(15deg);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(0) rotate(-45deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        // 成就系统
        this.achievements = {
            // 对战相关成就
            firstWin: { name: '初次胜利', description: '在对战中首次获胜', icon: '🏆', unlocked: false },
            winStreak3: { name: '三连胜', description: '在对战中连续获胜3次', icon: '🔥', unlocked: false },
            perfectWin: { name: '完美胜利', description: '在对战中以超过200分的优势获胜', icon: '👑', unlocked: false },
            
            // 连击相关成就
            combo5: { name: '连击大师', description: '在一局游戏中达成5连击', icon: '⚡', unlocked: false },
            combo8: { name: '连击王者', description: '在一局游戏中达成8连击', icon: '💫', unlocked: false },
            combo10: { name: '连击传说', description: '在一局游戏中达成10连击', icon: '🌟', unlocked: false },
            
            // 特殊方块相关成就
            specialMaster: { name: '特殊方块大师', description: '在一局游戏中使用5个特殊方块', icon: '🎯', unlocked: false },
            rainbowKing: { name: '彩虹之王', description: '在一局游戏中使用3个彩虹方块', icon: '🌈', unlocked: false },
            bombExpert: { name: '爆破专家', description: '在一局游戏中使用3个炸弹方块', icon: '💣', unlocked: false },
            
            // 道具相关成就
            itemMaster: { name: '道具大师', description: '在一局游戏中使用所有类型的道具', icon: '🎁', unlocked: false },
            colorBombPro: { name: '同色炸弹专家', description: '使用同色炸弹消除超过15个方块', icon: '🎨', unlocked: false },
            
            // 分数相关成就
            score300: { name: '300分达人', description: '在一局游戏中获得300分', icon: '🎯', unlocked: false },
            score500: { name: '500分高手', description: '在一局游戏中获得500分', icon: '🏅', unlocked: false },
            score1000: { name: '1000分大师', description: '在一局游戏中获得1000分', icon: '🎖️', unlocked: false }
        };

        // 游戏统计数据
        this.stats = {
            gamesPlayed: 0,
            wins: 0,
            currentWinStreak: 0,
            maxCombo: 0,
            specialBlocksUsed: 0,
            rainbowBlocksUsed: 0,
            bombBlocksUsed: 0,
            itemsUsed: new Set(),
            maxColorBombEliminated: 0
        };

        // 从localStorage加载成就数据
        this.loadAchievements();
        
        // 设置成就按钮事件监听
        this.setupAchievementsUI();
    }

    initializeWebSocket() {
        // 获取当前页面的主机名
        const host = window.location.hostname;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // 使用相对路径，让服务器处理端口
        this.ws = new WebSocket(`${wsProtocol}//${host}`);

        this.ws.onopen = () => {
            console.log('Connected to battle server');
        };

        this.ws.onclose = () => {
            console.log('Disconnected from battle server');
            // 可选：添加重连逻辑
            setTimeout(() => this.initializeWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };
    }

    setupEventListeners() {
        // 主菜单按钮
        document.getElementById('battle-btn').addEventListener('click', () => {
            this.showBattleScreen();
        });

        // 创建房间按钮
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.createRoom();
        });

        // 加入房间按钮
        document.getElementById('join-room-btn').addEventListener('click', () => {
            const roomNumber = document.getElementById('room-number-input').value;
            if (roomNumber.length === 6) {
                this.joinRoom(roomNumber);
            } else {
                alert('请输入6位房间号');
            }
        });

        // 返回主菜单按钮
        document.getElementById('back-to-main-btn').addEventListener('click', () => {
            this.showStartScreen();
        });

        // 退出对战按钮
        document.getElementById('battle-quit-btn').addEventListener('click', () => {
            this.quitBattle();
        });

        // 房间号输入框只允许输入数字
        document.getElementById('room-number-input').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });

        // 游戏规则按钮
        document.querySelector('.rules-btn').addEventListener('click', () => {
            document.querySelector('.rules-panel').style.display = 'block';
        });

        // 规则面板关闭按钮
        document.querySelector('.rules-panel .close-btn').addEventListener('click', () => {
            document.querySelector('.rules-panel').style.display = 'none';
        });
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'room_created':
                this.roomId = data.roomId;
                this.showWaitingScreen(data.roomId);
                break;

            case 'game_start':
                this.roomId = data.roomId;
                this.playerId = data.playerId;
                this.isHost = data.isHost;
                this.startBattleGame();
                break;

            case 'opponent_score':
                this.updateOpponentScore(data.score);
                break;

            case 'opponent_left':
                this.handleOpponentLeft();
                break;

            case 'error':
                alert(data.message);
                break;
        }
    }

    showBattleScreen() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('battle-screen').style.display = 'flex';
        document.getElementById('waiting-screen').style.display = 'none';
        document.getElementById('battle-game-screen').style.display = 'none';
    }

    showStartScreen() {
        document.getElementById('battle-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        document.getElementById('waiting-screen').style.display = 'none';
        document.getElementById('battle-game-screen').style.display = 'none';
    }

    showWaitingScreen(roomId) {
        document.getElementById('waiting-screen').style.display = 'block';
        document.getElementById('current-room-number').textContent = roomId;
    }

    createRoom() {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'create_room'
            }));
        } else {
            alert('正在连接服务器，请稍后再试...');
            // 可选：等待连接建立后自动重试
            this.ws.onopen = () => {
                this.createRoom();
            };
        }
    }

    joinRoom(roomId) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'join_room',
                roomId: roomId
            }));
        } else {
            alert('正在连接服务器，请稍后再试...');
            // 可选：等待连接建立后自动重试
            this.ws.onopen = () => {
                this.joinRoom(roomId);
            };
        }
    }

    startBattleGame() {
        document.getElementById('battle-screen').style.display = 'none';
        document.getElementById('waiting-screen').style.display = 'none';
        document.getElementById('battle-game-screen').style.display = 'block';
        
        this.gameStarted = true;
        this.score = 0;
        this.timeLeft = 60;
        
        // 初始化游戏板
        this.initializeGameBoard();
        
        // 启动计时器
        this.startTimer();
    }

    initializeGameBoard() {
        const board = document.getElementById('player-board');
        board.innerHTML = '';
        board.style.setProperty('--grid-size', '10');
        this.board = [];
        
        // 初始化道具栏
        this.initializeItems();

        // 创建10x10的游戏板
        for (let i = 0; i < 10; i++) {
            this.board[i] = [];
            for (let j = 0; j < 10; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // 生成基础或特殊方块
                const isSpecial = Math.random() < this.specialBlockChance;
                if (isSpecial) {
                    const specialType = this.specialTypes[Math.floor(Math.random() * this.specialTypes.length)];
                    cell.dataset.special = specialType;
                    cell.innerHTML = this.getSpecialBlockIcon(specialType);
                    // 给特殊方块一个随机颜色值
                    const colorValue = Math.floor(Math.random() * 4) + 1;
                    cell.dataset.value = colorValue;
                } else {
                    const colorValue = Math.floor(Math.random() * 4) + 1;
                    cell.dataset.value = colorValue;
                }
                
                board.appendChild(cell);
                this.board[i][j] = cell;
            }
        }

        // 添加事件监听器
        board.addEventListener('click', (e) => {
            if (!this.isAnimating && e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });
    }

    initializeItems() {
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'items-bar-container';
        itemsContainer.innerHTML = `
            <div class="items-title">道具</div>
            <div class="items-bar">
                ${Object.entries(this.items).map(([key, item]) => `
                    <button class="item-button" data-item="${key}">
                        ${this.getItemIcon(key)}
                        <span class="item-count">${item.count}</span>
                        <span class="item-tooltip">${item.name}: ${item.description}</span>
                    </button>
                `).join('')}
            </div>
        `;

        document.querySelector('.player-board').insertBefore(
            itemsContainer,
            document.getElementById('player-board')
        );

        // 添加道具点击事件
        itemsContainer.querySelectorAll('.item-button').forEach(button => {
            button.addEventListener('click', () => this.useItem(button.dataset.item));
        });
    }

    getSpecialBlockIcon(type) {
        const icons = {
            rainbow: '🌈',
            bomb: '💣',
            lightning: '⚡',
            star: '⭐'
        };
        return `<span class="special-icon">${icons[type]}</span>`;
    }

    getItemIcon(type) {
        const icons = {
            hammer: '🔨',
            bomb: '💣',
            refresh: '🔄',
            colorBomb: '🎨'
        };
        return icons[type];
    }

    handleCellClick(cell) {
        if (this.isAnimating) return;

        if (!this.selectedCell) {
            // 第一次选择
            cell.classList.add('selected');
            this.selectedCell = cell;
        } else {
            // 第二次选择
            const row1 = parseInt(this.selectedCell.dataset.row);
            const col1 = parseInt(this.selectedCell.dataset.col);
            const row2 = parseInt(cell.dataset.row);
            const col2 = parseInt(cell.dataset.col);

            // 检查是否相邻
            if (this.isAdjacent(row1, col1, row2, col2)) {
                this.swapCells(this.selectedCell, cell);
            }

            this.selectedCell.classList.remove('selected');
            this.selectedCell = null;
        }
    }

    isAdjacent(row1, col1, row2, col2) {
        return (Math.abs(row1 - row2) === 1 && col1 === col2) ||
               (Math.abs(col1 - col2) === 1 && row1 === row2);
    }

    async swapCells(cell1, cell2) {
        this.isAnimating = true;
        this.playSound('swap');

        // 保存原始状态
        const cell1Value = cell1.dataset.value;
        const cell1Special = cell1.dataset.special;
        const cell1Html = cell1.innerHTML;
        const cell2Value = cell2.dataset.value;
        const cell2Special = cell2.dataset.special;
        const cell2Html = cell2.innerHTML;

        // 添加交换动画类
        cell1.classList.add('swapping');
        cell2.classList.add('swapping');

        // 计算位置差异
        const rect1 = cell1.getBoundingClientRect();
        const rect2 = cell2.getBoundingClientRect();
        const deltaX = rect2.left - rect1.left;
        const deltaY = rect2.top - rect1.top;

        // 应用动画变换
        cell1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        cell2.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;

        // 等待动画完成
        await new Promise(resolve => setTimeout(resolve, 50));

        // 交换数据
        cell1.dataset.value = cell2Value;
        cell1.dataset.special = cell2Special;
        cell1.innerHTML = cell2Html;
        cell2.dataset.value = cell1Value;
        cell2.dataset.special = cell1Special;
        cell2.innerHTML = cell1Html;

        // 重置动画状态
        cell1.classList.remove('swapping');
        cell2.classList.remove('swapping');
        cell1.style.transform = '';
        cell2.style.transform = '';

        // 检查是否有特殊方块
        let specialActivated = false;
        let matches = this.findMatches();

        // 如果有匹配，或者其中一个是特殊方块，就进行消除
        if (matches.length > 0 || cell1.dataset.special || cell2.dataset.special) {
            // 如果有特殊方块，先处理特殊方块
            if (cell1.dataset.special) {
                await this.handleSpecialBlock(cell1);
                specialActivated = true;
            }
            if (cell2.dataset.special) {
                await this.handleSpecialBlock(cell2);
                specialActivated = true;
            }

            // 如果有普通匹配，处理普通匹配
            if (matches.length > 0) {
                await this.eliminateMatches(matches);
            }

            await this.handleFalling();
            await this.fillNewBlocks();
            await this.checkForChainReaction();
        } else {
            // 如果没有匹配也没有特殊方块效果，交换回来
            cell1.dataset.value = cell1Value;
            cell1.dataset.special = cell1Special;
            cell1.innerHTML = cell1Html;
            cell2.dataset.value = cell2Value;
            cell2.dataset.special = cell2Special;
            cell2.innerHTML = cell2Html;
        }

        this.isAnimating = false;
    }

    findMatches() {
        const matches = new Set();

        // 检查行
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 8; j++) {
                const value = this.board[i][j].dataset.value;
                if (value &&
                    value === this.board[i][j+1].dataset.value &&
                    value === this.board[i][j+2].dataset.value) {
                    matches.add(this.board[i][j]);
                    matches.add(this.board[i][j+1]);
                    matches.add(this.board[i][j+2]);
                }
            }
        }

        // 检查列
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 10; j++) {
                const value = this.board[i][j].dataset.value;
                if (value &&
                    value === this.board[i+1][j].dataset.value &&
                    value === this.board[i+2][j].dataset.value) {
                    matches.add(this.board[i][j]);
                    matches.add(this.board[i+1][j]);
                    matches.add(this.board[i+2][j]);
                }
            }
        }

        return Array.from(matches);
    }

    async eliminateMatches(matches) {
        this.playSound('match');
        
        // 收集所有需要消除的方块，包括特殊方块
        const allAffectedCells = new Set(matches);
        
        // 检查匹配方块周围的特殊方块
        for (const cell of matches) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // 检查周围八个方向的方块
            const directions = [
                [-1,-1], [-1,0], [-1,1],
                [0,-1],          [0,1],
                [1,-1],  [1,0],  [1,1]
            ];
            
            for (const [dx, dy] of directions) {
                const newRow = row + dx;
                const newCol = col + dy;
                
                // 确保坐标在有效范围内
                if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
                    const adjacentCell = this.board[newRow][newCol];
                    if (adjacentCell.dataset.special && !allAffectedCells.has(adjacentCell)) {
                        allAffectedCells.add(adjacentCell);
                        // 触发特殊方块效果
                        await this.handleSpecialBlock(adjacentCell);
                    }
                }
            }
        }
        
        // 计算基础分数（每个方块10分）
        const baseScore = allAffectedCells.size * 10;
        
        // 计算连击倍数（最大3倍）
        this.combo++;
        const comboMultiplier = Math.min(1 + (this.combo - 1) * 0.2, 3);
        
        // 计算最终分数
        const finalScore = Math.floor(baseScore * comboMultiplier);
        
        // 更新分数
        this.updateScore(this.score + finalScore);
        
        // 显示连击效果
        if (this.combo > 1) {
            this.playSound('combo');
            this.showComboEffect(this.combo);
        }
        
        // 更新最大连击
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        // 消除动画
        for (const cell of allAffectedCells) {
            cell.classList.add('matched');
        }

        // 等待消除动画完成
        await new Promise(resolve => setTimeout(resolve, 50));

        // 清除数据
        for (const cell of allAffectedCells) {
            cell.classList.remove('matched');
            cell.dataset.value = '';
            cell.dataset.special = '';
            cell.innerHTML = '';
        }
    }

    async handleFalling() {
        let hasFalling;
        do {
            hasFalling = false;
            for (let i = 8; i >= 0; i--) {
                for (let j = 0; j < 10; j++) {
                    const upper = this.board[i][j];
                    const lower = this.board[i+1][j];
                    
                    if ((upper.dataset.value || upper.dataset.special) && 
                        !lower.dataset.value && !lower.dataset.special) {
                        upper.classList.add('falling');
                        
                        [upper.dataset.value, lower.dataset.value] = [lower.dataset.value, upper.dataset.value];
                        [upper.dataset.special, lower.dataset.special] = [lower.dataset.special, upper.dataset.special];
                        [upper.innerHTML, lower.innerHTML] = [lower.innerHTML, upper.innerHTML];
                        
                        hasFalling = true;
                        
                        await new Promise(resolve => setTimeout(resolve, 20));
                        upper.classList.remove('falling');
                    }
                }
            }
        } while (hasFalling);
    }

    async fillNewBlocks() {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const cell = this.board[i][j];
                if (!cell.dataset.value && !cell.dataset.special) {
                    const isSpecial = Math.random() < this.specialBlockChance;
                    cell.classList.add('new-block');
                    
                    if (isSpecial) {
                        const specialType = this.specialTypes[Math.floor(Math.random() * this.specialTypes.length)];
                        cell.dataset.special = specialType;
                        cell.innerHTML = this.getSpecialBlockIcon(specialType);
                        const colorValue = Math.floor(Math.random() * 4) + 1;
                        cell.dataset.value = colorValue;
                    } else {
                        const colorValue = Math.floor(Math.random() * 4) + 1;
                        cell.dataset.value = colorValue;
                        cell.dataset.special = '';
                        cell.innerHTML = '';
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 10));
                    cell.classList.remove('new-block');
                }
            }
        }
    }

    async checkForChainReaction() {
        const matches = this.findMatches();
        if (matches.length > 0) {
            await this.eliminateMatches(matches);
            await this.handleFalling();
            await this.fillNewBlocks();
            await this.checkForChainReaction();
        } else {
            this.combo = 0;
        }
    }

    useItem(itemType) {
        if (this.items[itemType].count > 0) {
            this.stats.itemsUsed.add(itemType);
            this.items[itemType].count--;
            this.updateItemCount(itemType);
            
            switch (itemType) {
                case 'hammer':
                    this.activateHammer();
                    break;
                case 'bomb':
                    this.activateBomb();
                    break;
                case 'refresh':
                    this.refreshBoard();
                    break;
                case 'colorBomb':
                    this.activateColorBomb();
                    break;
            }
            this.checkAchievements();
        }
    }

    updateItemCount(itemType) {
        const button = document.querySelector(`[data-item="${itemType}"] .item-count`);
        button.textContent = this.items[itemType].count;
        if (this.items[itemType].count === 0) {
            button.parentElement.classList.add('disabled');
        }
    }

    showComboEffect(combo) {
        const effect = document.createElement('div');
        effect.className = 'combo-popup';
        effect.innerHTML = `
            <div class="combo-count">${combo}</div>
            <div class="combo-text">COMBO!</div>
        `;
        
        document.getElementById('player-board').appendChild(effect);
        
        setTimeout(() => effect.remove(), 1000);
    }

    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (!sound) return; // 如果音效不存在或加载失败，直接返回
        
        try {
            const newSound = sound.cloneNode();
            newSound.volume = 0.3;
            newSound.play().catch(() => {
                // 忽略播放错误
            });
        } catch (error) {
            // 忽略所有音效相关错误
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.querySelector('.time-left').textContent = `剩余时间: ${this.timeLeft}`;

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateScore(newScore) {
        this.score = newScore;
        document.querySelector('.player-score').textContent = `得分: ${this.score}`;

        // 发送分数更新到服务器
        this.ws.send(JSON.stringify({
            type: 'game_action',
            roomId: this.roomId,
            score: this.score
        }));
    }

    updateOpponentScore(score) {
        document.querySelector('.opponent-score').textContent = `得分: ${score}`;
    }

    endGame() {
        clearInterval(this.timer);
        this.gameStarted = false;

        // 更新游戏统计
        this.stats.gamesPlayed++;
        
        // 显示游戏结果
        const opponentScore = parseInt(document.querySelector('.opponent-score').textContent.split(': ')[1]);
        const scoreDiff = this.score - opponentScore;
        
        if (this.score > opponentScore) {
            this.stats.wins++;
            this.stats.currentWinStreak++;
            this.unlockAchievement('firstWin');
            
            if (this.stats.currentWinStreak >= 3) {
                this.unlockAchievement('winStreak3');
            }
            
            if (scoreDiff >= 200) {
                this.unlockAchievement('perfectWin');
            }
        } else {
            this.stats.currentWinStreak = 0;
        }
        
        const result = this.score > opponentScore ? '胜利！' : 
                      this.score < opponentScore ? '失败！' : '平局！';
        
        alert(`游戏结束！\n你的得分：${this.score}\n对手得分：${opponentScore}\n${result}`);
        
        this.saveAchievements();
        
        // 返回主菜单
        this.quitBattle();
    }

    handleOpponentLeft() {
        if (this.gameStarted) {
            alert('对手已离开游戏！');
            this.endGame();
        }
    }

    quitBattle() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        if (this.roomId) {
            this.ws.send(JSON.stringify({
                type: 'leave_room',
                roomId: this.roomId
            }));
        }

        this.roomId = null;
        this.playerId = null;
        this.isHost = false;
        this.gameStarted = false;
        
        document.getElementById('battle-game-screen').style.display = 'none';
        document.getElementById('waiting-screen').style.display = 'none';
        document.getElementById('battle-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
    }

    // 道具实现
    activateHammer() {
        const board = document.getElementById('player-board');
        board.classList.add('using-item');
        
        const handleClick = async (e) => {
            if (e.target.classList.contains('cell')) {
                board.classList.remove('using-item');
                board.removeEventListener('click', handleClick);
                
                this.playSound('special');
                e.target.classList.add('matched');
                e.target.dataset.value = '';
                e.target.dataset.special = '';
                e.target.innerHTML = '';
                
                await this.handleFalling();
                await this.fillNewBlocks();
                this.checkForChainReaction();
            }
        };
        
        board.addEventListener('click', handleClick);
    }

    activateBomb() {
        const board = document.getElementById('player-board');
        board.classList.add('using-item');
        
        const handleClick = async (e) => {
            if (e.target.classList.contains('cell')) {
                board.classList.remove('using-item');
                board.removeEventListener('click', handleClick);
                
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                this.playSound('special');
                
                // 消除3x3范围内的方块
                for (let i = Math.max(0, row - 1); i <= Math.min(9, row + 1); i++) {
                    for (let j = Math.max(0, col - 1); j <= Math.min(9, col + 1); j++) {
                        const cell = this.board[i][j];
                        cell.classList.add('matched');
                        cell.dataset.value = '';
                        cell.dataset.special = '';
                        cell.innerHTML = '';
                    }
                }
                
                await this.handleFalling();
                await this.fillNewBlocks();
                this.checkForChainReaction();
            }
        };
        
        board.addEventListener('click', handleClick);
    }

    async refreshBoard() {
        this.playSound('special');
        
        // 收集所有方块的值
        const values = [];
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (this.board[i][j].dataset.value) {
                    values.push(this.board[i][j].dataset.value);
                }
            }
        }
        
        // 随机打乱
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [values[i], values[j]] = [values[j], values[i]];
        }
        
        // 重新分配
        let index = 0;
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (this.board[i][j].dataset.value) {
                    this.board[i][j].dataset.value = values[index++];
                }
            }
        }
        
        // 检查新的匹配
        await this.checkForChainReaction();
    }

    activateColorBomb() {
        const board = document.getElementById('player-board');
        board.classList.add('using-item');
        
        const handleClick = async (e) => {
            if (e.target.classList.contains('cell') && e.target.dataset.value) {
                board.classList.remove('using-item');
                board.removeEventListener('click', handleClick);
                
                const targetValue = e.target.dataset.value;
                this.playSound('special');
                
                // 消除所有相同颜色的方块
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 10; j++) {
                        const cell = this.board[i][j];
                        if (cell.dataset.value === targetValue) {
                            cell.classList.add('matched');
                            cell.dataset.value = '';
                            cell.dataset.special = '';
                            cell.innerHTML = '';
                        }
                    }
                }
                
                await this.handleFalling();
                await this.fillNewBlocks();
                this.checkForChainReaction();
            }
        };
        
        board.addEventListener('click', handleClick);
    }

    // 特殊方块效果
    async handleSpecialBlock(cell) {
        const specialType = cell.dataset.special;
        if (!specialType) return false;

        this.stats.specialBlocksUsed++;
        if (specialType === 'rainbow') this.stats.rainbowBlocksUsed++;
        if (specialType === 'bomb') this.stats.bombBlocksUsed++;
        
        this.playSound('special');
        
        // 清除特殊方块的标记，防止重复触发
        cell.dataset.special = '';
        cell.innerHTML = '';

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = cell.dataset.value;
        const affectedCells = new Set();
        
        switch (specialType) {
            case 'rainbow':
                // 消除所有方块
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 10; j++) {
                        affectedCells.add(this.board[i][j]);
                    }
                }
                break;

            case 'bomb':
                // 消除3x3范围
                for (let i = Math.max(0, row - 1); i <= Math.min(9, row + 1); i++) {
                    for (let j = Math.max(0, col - 1); j <= Math.min(9, col + 1); j++) {
                        affectedCells.add(this.board[i][j]);
                    }
                }
                break;

            case 'lightning':
                // 消除同一行和同一列
                for (let i = 0; i < 10; i++) {
                    affectedCells.add(this.board[row][i]); // 行
                    affectedCells.add(this.board[i][col]); // 列
                }
                break;

            case 'star':
                // 消除相同颜色的方块
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 10; j++) {
                        if (this.board[i][j].dataset.value === value) {
                            affectedCells.add(this.board[i][j]);
                        }
                    }
                }
                break;
        }

        // 统一处理消除效果
        for (const target of affectedCells) {
            target.classList.add('matched');
            await new Promise(resolve => setTimeout(resolve, 10));
            target.dataset.value = '';
            target.dataset.special = '';
            target.innerHTML = '';
        }

        // 更新分数
        const score = affectedCells.size * 10;
        this.updateScore(this.score + score);

        await this.handleFalling();
        await this.fillNewBlocks();
        this.checkAchievements();
        return true;
    }

    setupAchievementsUI() {
        const achievementsBtn = document.querySelector('.achievements-btn');
        const achievementsPanel = document.querySelector('.achievements-panel');
        const closeBtn = document.querySelector('.close-btn');
        
        achievementsBtn.addEventListener('click', () => {
            this.showAchievements();
            achievementsPanel.style.display = 'block';
        });
        
        closeBtn.addEventListener('click', () => {
            achievementsPanel.style.display = 'none';
        });
    }

    showAchievements() {
        const achievementsList = document.querySelector('.achievements-list');
        achievementsList.innerHTML = '';
        
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            const achievementItem = document.createElement('div');
            achievementItem.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            achievementItem.innerHTML = `
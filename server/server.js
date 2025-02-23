const WebSocket = require('ws');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const os = require('os');

// 获取局域网IP地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        // 优先查找无线网卡和以太网卡
        if (name.toLowerCase().includes('wlan') || name.toLowerCase().includes('ethernet') || name.toLowerCase().includes('本地连接') || name.toLowerCase().includes('以太网')) {
            for (const interface of interfaces[name]) {
                // 跳过内部IP和非IPv4地址
                if (!interface.internal && interface.family === 'IPv4') {
                    // 确保是真实局域网IP（192.168.x.x 或 10.x.x.x 或 172.16.x.x - 172.31.x.x）
                    const ip = interface.address;
                    if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
                        (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)) {
                        return ip;
                    }
                }
            }
        }
    }
    return 'localhost';
}

const app = express();
const port = process.env.PORT || 10000;

// 创建HTTP服务器
const server = app.listen(port, () => {
    const localIP = getLocalIP();
    console.log('服务器已启动:');
    console.log(`- 本地访问: http://localhost:${port}`);
    console.log(`- 局域网访问: http://${localIP}:${port}`);
    console.log('WebSocket服务已启动:');
    console.log(`- 本地WebSocket: ws://localhost:${port}/ws`);
    console.log(`- 局域网WebSocket: ws://${localIP}:${port}/ws`);
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ 
    server,
    path: '/ws',
    clientTracking: true
});

// 添加CORS支持
app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 忽略favicon请求
app.get('/favicon.ico', (req, res) => res.status(204));

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '..'), {
    setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// 设置根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 存储房间信息
const rooms = new Map();
// 存储客户端连接
const clients = new Map();

// 生成6位随机房间号
function generateRoomNumber() {
    let roomNumber;
    do {
        roomNumber = Math.floor(100000 + Math.random() * 900000).toString();
    } while (rooms.has(roomNumber));
    return roomNumber;
}

// WebSocket连接处理
wss.on('connection', (ws, request) => {
    const clientIp = request.socket.remoteAddress;
    console.log(`新客户端连接 - IP: ${clientIp}`);
    
    const clientId = uuidv4();
    clients.set(ws, { id: clientId });

    // 处理消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log(`收到消息 [${clientId}]:`, data);
            
            switch (data.type) {
                case 'create_room':
                    handleCreateRoom(ws);
                    break;
                case 'join_room':
                    handleJoinRoom(ws, data);
                    break;
                case 'game_action':
                    handleGameAction(ws, data);
                    break;
                case 'leave_room':
                    handleLeaveRoom(ws);
                    break;
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: '服务器错误，请重试'
            }));
        }
    });

    // 处理断开连接
    ws.on('close', () => {
        console.log(`客户端断开连接 [${clientId}]`);
        handleLeaveRoom(ws);
        clients.delete(ws);
    });

    // 处理错误
    ws.on('error', (error) => {
        console.error(`WebSocket错误 [${clientId}]:`, error);
    });

    // 发送欢迎消息
    ws.send(JSON.stringify({
        type: 'welcome',
        message: '已连接到服务器'
    }));
});

// 创建房间
function handleCreateRoom(ws) {
    const roomId = generateRoomNumber();
    const client = clients.get(ws);
    
    rooms.set(roomId, {
        id: roomId,
        host: client.id,
        players: [client.id],
        status: 'waiting',
        scores: {}
    });

    ws.send(JSON.stringify({
        type: 'room_created',
        roomId: roomId
    }));
}

// 加入房间
function handleJoinRoom(ws, data) {
    const room = rooms.get(data.roomId);
    const client = clients.get(ws);

    if (!room) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '房间不存在'
        }));
        return;
    }

    if (room.players.length >= 2) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '房间已满'
        }));
        return;
    }

    room.players.push(client.id);
    room.status = 'playing';
    room.scores[client.id] = 0;

    // 通知房间内所有玩家游戏开始
    room.players.forEach(playerId => {
        const playerWs = [...clients.entries()]
            .find(([_, c]) => c.id === playerId)[0];
        
        playerWs.send(JSON.stringify({
            type: 'game_start',
            roomId: data.roomId,
            playerId: playerId,
            isHost: playerId === room.host
        }));
    });
}

// 处理游戏动作
function handleGameAction(ws, data) {
    const room = rooms.get(data.roomId);
    const client = clients.get(ws);

    if (!room) return;

    // 更新分数
    room.scores[client.id] = data.score;

    // 广播分数更新给对手
    const opponent = room.players.find(id => id !== client.id);
    if (opponent) {
        const opponentWs = [...clients.entries()]
            .find(([_, c]) => c.id === opponent)[0];
        
        opponentWs.send(JSON.stringify({
            type: 'opponent_score',
            score: data.score
        }));
    }
}

// 离开房间
function handleLeaveRoom(ws) {
    const client = clients.get(ws);
    if (!client) return;

    // 查找并清理玩家所在的房间
    for (const [roomId, room] of rooms.entries()) {
        const playerIndex = room.players.indexOf(client.id);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            
            if (room.players.length === 0) {
                rooms.delete(roomId);
            } else {
                // 通知剩余玩家
                const remainingPlayer = [...clients.entries()]
                    .find(([_, c]) => c.id === room.players[0])[0];
                
                remainingPlayer.send(JSON.stringify({
                    type: 'opponent_left'
                }));
            }
            break;
        }
    }
}

// 处理WebSocket升级
server.on('upgrade', (request, socket, head) => {
    // 验证WebSocket连接路径
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    
    if (pathname !== '/ws') {
        socket.destroy();
        return;
    }

    // 添加错误处理
    socket.on('error', (err) => {
        console.error('Socket error:', err);
        socket.destroy();
    });

    try {
        wss.handleUpgrade(request, socket, head, (ws) => {
            // 添加心跳检测
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            
            // 设置较大的缓冲区大小
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    console.log('Received message:', message);
                    // 处理消息...
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            
            wss.emit('connection', ws, request);
        });
    } catch (err) {
        console.error('WebSocket upgrade error:', err);
        socket.destroy();
    }
});

// 添加WebSocket服务器心跳检测
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log('Client timeout, terminating connection');
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(() => {});
    });
}, 30000);

// 清理定时器
wss.on('close', () => {
    clearInterval(interval);
});
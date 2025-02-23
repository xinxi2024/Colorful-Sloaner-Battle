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
const port = process.env.PORT || 3000;

// 添加CORS支持
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '..')));

// 设置根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ noServer: true });

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

// 处理WebSocket连接
wss.on('connection', (ws) => {
    const clientId = uuidv4();
    clients.set(ws, { id: clientId });

    // 处理消息
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
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
    });

    // 处理断开连接
    ws.on('close', () => {
        handleLeaveRoom(ws);
        clients.delete(ws);
    });
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

// 启动服务器
const server = app.listen(port, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`服务器已启动:`);
    console.log(`- 本地访问: http://localhost:${port}`);
    console.log(`- 局域网访问: http://${localIP}:${port}`);
});

// 处理WebSocket升级
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
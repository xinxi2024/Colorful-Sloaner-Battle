const levels = [
    // 新手区 (1-10) - 基础方块大小 60x60
    {
        id: 1,
        name: "1、新手教程",
        target: 50,
        moves: 15,
        colors: [1, 2, 3],
        gridSize: 6,
        blockSize: 60,  // 基础大小
        description: "适合初学者的简单关卡",
        timeLimit: null,
        features: {
            basic: true  // 基础方块
        }
    },
    {
        id: 2,
        name: "2、基础训练",
        target: 80,
        moves: 16,
        colors: [1, 2, 3],
        gridSize: 6,
        description: "继续熟悉游戏规则",
        timeLimit: null
    },
    {
        id: 3,
        name: "3、颜色扩展",
        target: 100,
        moves: 18,
        colors: [1, 2, 3, 4],
        gridSize: 6,
        description: "引入新的颜色",
        timeLimit: null
    },
    {
        id: 4,
        name: "4、初级挑战",
        target: 120,
        moves: 20,
        colors: [1, 2, 3, 4],
        gridSize: 6,
        description: "稍微提高难度",
        timeLimit: null
    },
    {
        id: 5,
        name: "5、时间初体验",
        target: 100,
        moves: 999,
        colors: [1, 2, 3],
        gridSize: 6,
        description: "首个限时关卡",
        timeLimit: 60
    },
    {
        id: 6,
        name: "6、网格扩展",
        target: 150,
        moves: 22,
        colors: [1, 2, 3, 4],
        gridSize: 7,
        description: "更大的游戏区域",
        timeLimit: null
    },
    {
        id: 7,
        name: "7、五彩缤纷",
        target: 150,
        moves: 30,
        colors: [1, 2, 3, 4, 5],
        gridSize: 7,
        description: "引入第五种颜色",
        timeLimit: null
    },
    {
        id: 8,
        name: "8、计分挑战",
        target: 200,
        moves: 25,
        colors: [1, 2, 3, 4],
        gridSize: 7,
        description: "更高的目标分数",
        timeLimit: null
    },
    {
        id: 9,
        name: "9、时间压力",
        target: 150,
        moves: 999,
        colors: [1, 2, 3, 4],
        gridSize: 7,
        description: "限时关卡",
        timeLimit: 45
    },
    {
        id: 10,
        name: "10、新手毕业",
        target: 250,
        moves: 30,
        colors: [1, 2, 3, 4, 5],
        gridSize: 7,
        description: "新手区最终关卡",
        timeLimit: null
    },

    // 进阶区 (11-20) - 方块大小 50x50，7x7 网格
    {
        id: 11,
        name: "11、进阶入门",
        target: 180,
        moves: 25,
        colors: [1, 2, 3, 4, 5],
        gridSize: 7,
        blockSize: 50,
        description: "进入进阶区，更紧凑的布局",
        timeLimit: null,
        features: {
            basic: true,
            shrink: true
        }
    },
    {
        id: 12,
        name: "12、六色挑战",
        target: 200,
        moves: 28,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 7,
        description: "引入第六种颜色",
        timeLimit: null
    },
    {
        id: 13,
        name: "13、时间大师",
        target: 190,
        moves: 999,
        colors: [1, 2, 3, 4, 5],
        gridSize: 7,
        description: "限时关卡",
        timeLimit: 40
    },
    {
        id: 14,
        name: "14、扩展空间",
        target: 220,
        moves: 30,
        colors: [1, 2, 3, 4, 5],
        gridSize: 7,
        description: "更高的目标分数",
        timeLimit: null
    },
    {
        id: 15,
        name: "15、分数竞赛",
        target: 240,
        moves: 32,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 7,
        description: "六色方块的挑战",
        timeLimit: null
    },
    {
        id: 16,
        name: "16、时间与技巧",
        target: 230,
        moves: 999,
        colors: [1, 2, 3, 4, 5],
        gridSize: 7,
        description: "限时关卡的进阶挑战",
        timeLimit: 35
    },
    {
        id: 17,
        name: "17、全色挑战",
        target: 260,
        moves: 35,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 7,
        description: "使用所有颜色的挑战",
        timeLimit: null
    },
    {
        id: 18,
        name: "18、极限计时",
        target: 250,
        moves: 999,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 7,
        description: "更短的时间限制",
        timeLimit: 30
    },
    {
        id: 19,
        name: "19、步数挑战",
        target: 280,
        moves: 38,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 7,
        description: "高分数，有限步数",
        timeLimit: null
    },
    {
        id: 20,
        name: "20、进阶终极",
        target: 300,
        moves: 40,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 7,
        description: "进阶区最终关卡",
        timeLimit: null
    },

    // 挑战区 (21-30) - 方块大小不规则 45x45 到 55x55，8x8 网格
    {
        id: 21,
        name: "21、挑战开始",
        target: 320,
        moves: 35,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        blockSize: {
            min: 45,
            max: 55
        },
        description: "进入挑战区，更大的棋盘",
        timeLimit: null,
        features: {
            basic: true,
            shrink: true,
            irregular: true
        }
    },
    {
        id: 22,
        name: "22、闪电速度",
        target: 220,
        moves: 999,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        description: "超快速限时挑战",
        timeLimit: 25
    },
    {
        id: 23,
        name: "23、高分追求",
        target: 250,
        moves: 40,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        description: "追求更高分数",
        timeLimit: null
    },
    {
        id: 24,
        name: "24、精准控制",
        target: 230,
        moves: 35,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        description: "有限步数下的高分挑战",
        timeLimit: null
    },
    {
        id: 25,
        name: "25、双重压力",
        target: 240,
        moves: 40,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        description: "平衡时间和分数",
        timeLimit: 30
    },
    {
        id: 26,
        name: "26、战术大师",
        target: 260,
        moves: 42,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        description: "需要战术性思维",
        timeLimit: null
    },
    {
        id: 27,
        name: "27、极限时刻",
        target: 220,
        moves: 999,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        description: "最短时间限制",
        timeLimit: 20
    },
    {
        id: 28,
        name: "28、完美配合",
        target: 280,
        moves: 45,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        description: "需要完美的配合",
        timeLimit: null
    },
    {
        id: 29,
        name: "29、挑战大师",
        target: 300,
        moves: 48,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        description: "真正的挑战",
        timeLimit: 35
    },
    {
        id: 30,
        name: "30、挑战之巅",
        target: 320,
        moves: 50,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 8,
        description: "挑战区最终关卡",
        timeLimit: null
    },

    // 大师区 (31-40) - 方块大小 40x40，9x9 网格
    {
        id: 31,
        name: "31、大师之路",
        target: 350,
        moves: 45,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        blockSize: 40,
        description: "进入大师区，9x9网格",
        timeLimit: null,
        features: {
            basic: true,
            shrink: true,
            irregular: true,
            rotate: true,
            pulse: true
        }
    },
    {
        id: 32,
        name: "32、大师试炼",
        target: 380,
        moves: 48,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        description: "大师级别的挑战",
        timeLimit: 40
    },
    {
        id: 33,
        name: "33、完美节奏",
        target: 400,
        moves: 50,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        description: "需要完美的节奏感",
        timeLimit: null
    },
    {
        id: 34,
        name: "34、超速挑战",
        target: 350,
        moves: 999,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        description: "极限速度挑战",
        timeLimit: 15
    },
    {
        id: 35,
        name: "35、策略为王",
        target: 420,
        moves: 52,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        description: "策略性思维的终极测试",
        timeLimit: null
    },
    {
        id: 36,
        name: "36、时间掌控",
        target: 380,
        moves: 999,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        description: "时间管理的艺术",
        timeLimit: 25
    },
    {
        id: 37,
        name: "37、大师风范",
        target: 450,
        moves: 55,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        description: "展现大师风范",
        timeLimit: null
    },
    {
        id: 38,
        name: "38、极限突破",
        target: 400,
        moves: 50,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        description: "突破自己的极限",
        timeLimit: null
    },
    {
        id: 39,
        name: "39、超越巅峰",
        target: 480,
        moves: 58,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        description: "超越巅峰的挑战",
        timeLimit: null
    },
    {
        id: 40,
        name: "40、大师之巅",
        target: 500,
        moves: 60,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 9,
        description: "大师区最终关卡",
        timeLimit: null
    },

    // 传说区 (41-50) - 方块大小动态变化 35x35 到 60x60，10x10 网格
    {
        id: 41,
        name: "41、传说之始",
        target: 550,
        moves: 55,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        blockSize: {
            min: 35,
            max: 60,
            dynamic: true
        },
        description: "进入传说区，10x10网格",
        timeLimit: null,
        features: {
            basic: true,
            shrink: true,
            irregular: true,
            rotate: true,
            pulse: true,
            dynamic: true,
            fade: true
        }
    },
    {
        id: 42,
        name: "42、传说试炼",
        target: 580,
        moves: 58,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        description: "传说级别的挑战",
        timeLimit: 30
    },
    {
        id: 43,
        name: "43、超越极限",
        target: 600,
        moves: 60,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        description: "超越所有极限",
        timeLimit: null
    },
    {
        id: 44,
        name: "44、时空掌控",
        target: 550,
        moves: 999,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        description: "最严峻的时间挑战",
        timeLimit: 20
    },
    {
        id: 45,
        name: "45、传说之力",
        target: 650,
        moves: 65,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        description: "展现传说之力",
        timeLimit: null
    },
    {
        id: 46,
        name: "46、完美传说",
        target: 700,
        moves: 70,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        description: "追求完美的传说",
        timeLimit: null
    },
    {
        id: 47,
        name: "47、超越传说",
        target: 600,
        moves: 999,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        description: "超越传说的境界",
        timeLimit: 25
    },
    {
        id: 48,
        name: "48、永恒传说",
        target: 750,
        moves: 75,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        description: "永恒不朽的传说",
        timeLimit: null
    },
    {
        id: 49,
        name: "49、传说之巅",
        target: 800,
        moves: 80,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        description: "传说的最高峰",
        timeLimit: null
    },
    {
        id: 50,
        name: "50、最终传说",
        target: 850,
        moves: 85,
        colors: [1, 2, 3, 4, 5, 6],
        gridSize: 10,
        description: "游戏的最终关卡",
        timeLimit: null
    }
]; 
# Colorful Sloaner Battle Server

对战模式服务器端代码。

## 技术栈

- Node.js
- Express
- WebSocket (ws)
- UUID

## 安装

```bash
npm install
```

## 启动服务器

```bash
npm start
```

服务器将在端口10000上启动。

## API 端点

### WebSocket

WebSocket服务器处理以下事件：

- `createRoom`: 创建新房间
- `joinRoom`: 加入现有房间
- `gameAction`: 处理游戏动作
- `leaveRoom`: 离开房间

## 环境变量

- `NODE_ENV`: 运行环境 (`development` 或 `production`)
- `PORT`: 服务器端口号（默认：10000）

## 部署

### Render部署步骤

1. 确保`package.json`中的脚本正确配置：
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

2. 确保`render.yaml`配置正确：
```yaml
services:
  - type: web
    name: colorful-sloaner-battle
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

## 开发说明

1. 本地开发时使用：
```bash
npm start
```

2. 测试WebSocket连接：
```javascript
const ws = new WebSocket('ws://localhost:10000');
```

## 错误处理

服务器实现了以下错误处理：

- 房间不存在
- 房间已满
- 无效的游戏动作
- 连接断开

## 维护

定期检查：

- 服务器日志
- 内存使用情况
- 连接状态
- 房间状态 
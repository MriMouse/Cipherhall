require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const WebSocketServer = require('./src/websocket');

// 初始化Express应用
const app = express();
const port = process.env.PORT || 3000;

// 允许CORS
app.use(cors());
app.use(express.json());

// 设置基本的HTTP路由
app.get('/', (req, res) => {
  res.send('密語軒 (Cipherhall) WebSocket 服务器运行中...');
});

// API健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化WebSocket服务器
const wss = new WebSocketServer(server);

// 启动服务器
server.listen(port, () => {
  console.log(`服务器已启动，监听端口 ${port}`);
  console.log(`WebSocket服务可通过 ws://localhost:${port} 访问`);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('服务器正在关闭...');
  wss.closeAllConnections();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

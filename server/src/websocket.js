const WebSocket = require('ws');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const RoomManager = require('./rooms');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.roomManager = new RoomManager();
    
    this.setupWebSocketServer();
    console.log('WebSocket服务器已初始化');
  }
  
  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      // 解析URL参数
      const parameters = url.parse(req.url, true).query;
      const roomId = parameters.roomId || 'default';
      const userId = parameters.userId || uuidv4();
      const userName = parameters.userName || `用户${userId.substring(0, 4)}`;
      
      console.log(`新用户连接: ${userName} (${userId}) -> 聊天室: ${roomId}`);
      
      // 设置WebSocket属性
      ws.isAlive = true;
      ws.id = userId;
      ws.name = userName;
      ws.roomId = roomId;
      
      // 将用户添加到聊天室
      this.roomManager.addUserToRoom(roomId, {
        id: userId,
        name: userName,
        ws: ws
      });
      
      // 向新用户发送当前聊天室用户列表
      const roomUsers = this.roomManager.getRoomUsers(roomId).map(user => ({
        id: user.id,
        name: user.name,
        publicKey: user.publicKey
      }));
      
      this.sendToClient(ws, {
        type: 'user-list',
        users: roomUsers
      });
      
      // 通知聊天室内其他用户有新用户加入
      this.broadcastToRoom(roomId, {
        type: 'user-join',
        user: {
          id: userId,
          name: userName
        }
      }, userId);
      
      // 处理消息
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('消息处理出错:', error);
        }
      });
      
      // 处理连接关闭
      ws.on('close', () => {
        console.log(`用户断开连接: ${userName} (${userId})`);
        this.handleUserDisconnect(ws);
      });
      
      // 处理错误
      ws.on('error', (error) => {
        console.error(`WebSocket错误 (${userId}):`, error);
      });
      
      // 心跳检测
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });
    
    // 设置定时心跳检测
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log(`用户 ${ws.name} (${ws.id}) 心跳超时，关闭连接`);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }
  
  handleMessage(ws, message) {
    const { type } = message;
    const userId = ws.id;
    const roomId = ws.roomId;
    
    console.log(`收到消息类型: ${type} 来自用户: ${ws.name} (${userId})`);
    
    switch (type) {
      case 'register':
        // 注册用户的公钥
        if (message.publicKey) {
          this.roomManager.updateUserPublicKey(roomId, userId, message.publicKey);
          console.log(`用户 ${ws.name} (${userId}) 注册了公钥`);
        }
        break;
        
      case 'message':
        // 处理加密消息转发
        if (message.recipientId) {
          // 定向消息
          const recipient = this.roomManager.getUser(roomId, message.recipientId);
          if (recipient) {
            this.sendToClient(recipient.ws, {
              id: uuidv4(),
              type: 'message',
              content: message.content,
              sender: ws.name,
              senderId: userId,
              timestamp: message.timestamp || new Date().toISOString(),
              language: message.language || 'zh-CN'
            });
          }
        } else {
          // 广播消息 (自动为每个用户单独加密，见前端实现)
          console.log(`用户 ${ws.name} (${userId}) 发送了消息`);
        }
        break;
        
      case 'typing':
        // 用户正在输入
        this.broadcastToRoom(roomId, {
          type: 'typing',
          userId: userId,
          userName: ws.name,
          isTyping: message.isTyping
        }, userId);
        break;
        
      default:
        console.log(`未知消息类型: ${type}`);
    }
  }
  
  handleUserDisconnect(ws) {
    const userId = ws.id;
    const roomId = ws.roomId;
    
    // 从聊天室移除用户
    this.roomManager.removeUserFromRoom(roomId, userId);
    
    // 通知聊天室其他用户该用户已离开
    this.broadcastToRoom(roomId, {
      type: 'user-leave',
      userId: userId,
      userName: ws.name
    });
    
    // 如果聊天室为空，删除聊天室
    if (this.roomManager.isRoomEmpty(roomId)) {
      this.roomManager.removeRoom(roomId);
      console.log(`聊天室 ${roomId} 已删除 (无用户)`);
    }
  }
  
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  broadcastToRoom(roomId, message, excludeUserId = null) {
    const roomUsers = this.roomManager.getRoomUsers(roomId);
    
    roomUsers.forEach(user => {
      if (!excludeUserId || user.id !== excludeUserId) {
        this.sendToClient(user.ws, message);
      }
    });
  }
  
  closeAllConnections() {
    clearInterval(this.heartbeatInterval);
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    
    console.log('所有WebSocket连接已关闭');
  }
}

module.exports = WebSocketServer;

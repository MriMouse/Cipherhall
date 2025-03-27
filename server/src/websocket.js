const WebSocket = require("ws");
const url = require("url");
const { v4: uuidv4 } = require("uuid");
const RoomManager = require("./rooms");
const database = require("./database");

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: "/ws" });
    this.roomManager = new RoomManager();

    this.setupWebSocketServer();
    console.log("WebSocket服务器已初始化");
  }

  setupWebSocketServer() {
    this.wss.on("connection", async (ws, req) => {
      // 解析URL参数
      const parameters = url.parse(req.url, true).query;
      const roomId = parameters.roomId || "default";
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
        ws: ws,
      });

      // 向新用户发送当前聊天室用户列表
      const roomUsers = this.roomManager.getRoomUsers(roomId).map((user) => ({
        id: user.id,
        name: user.name,
        publicKey: user.publicKey,
      }));

      this.sendToClient(ws, {
        type: "userList",
        users: roomUsers,
      });

      // 发送历史消息
      try {
        const historyMessages = await this.roomManager.getRoomMessages(roomId);
        // 为历史消息添加 isMine 字段
        const messagesWithOwnership = historyMessages.map((msg) => ({
          ...msg,
          isMine: msg.sender_id === userId,
        }));
        this.sendToClient(ws, {
          type: "history",
          messages: messagesWithOwnership,
        });
      } catch (error) {
        console.error("获取历史消息失败:", error);
      }

      // 通知聊天室内其他用户有新用户加入
      this.broadcastToRoom(
        roomId,
        {
          type: "userJoin",
          user: {
            id: userId,
            name: userName,
          },
        },
        userId
      );

      // 处理消息
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("消息处理出错:", error);
        }
      });

      // 处理连接关闭
      ws.on("close", () => {
        console.log(`用户断开连接: ${userName} (${userId})`);
        this.handleUserDisconnect(ws);
      });

      // 处理错误
      ws.on("error", (error) => {
        console.error(`WebSocket错误 (${userId}):`, error);
      });

      // 心跳检测
      ws.on("pong", () => {
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

  async handleMessage(ws, message) {
    const { type, content, recipientId, language } = message;

    switch (type) {
      case "register":
        // 处理用户注册（更新公钥）
        this.roomManager.updateUserPublicKey(
          ws.roomId,
          ws.id,
          message.publicKey
        );
        break;

      case "text":
      case "image":
        // 创建消息对象
        const messageObj = {
          id: uuidv4(),
          type,
          content,
          language,
          sender: ws.name,
          senderId: ws.id,
          timestamp: new Date().toISOString(),
          recipientId,
          isMine: false, // 添加这个字段，让前端知道是否是自己的消息
        };

        // 保存消息到聊天室
        try {
          await this.roomManager.addMessageToRoom(ws.roomId, messageObj);

          // 广播消息给聊天室所有用户
          const roomUsers = this.roomManager.getRoomUsers(ws.roomId);
          roomUsers.forEach((user) => {
            // 为每个用户创建消息副本，设置 isMine 字段
            const userMessage = {
              ...messageObj,
              isMine: user.id === ws.id,
            };
            this.sendToClient(user.ws, userMessage);
          });
        } catch (error) {
          console.error("处理消息失败:", error);
        }
        break;

      case "typing":
        // 用户正在输入
        this.broadcastToRoom(
          ws.roomId,
          {
            type: "typing",
            userId: ws.id,
            userName: ws.name,
            isTyping: message.isTyping,
          },
          ws.id
        );
        break;

      default:
        console.warn(`未知消息类型: ${type}`);
    }
  }

  handleUserDisconnect(ws) {
    const roomId = ws.roomId;
    const userId = ws.id;
    const userName = ws.name;

    // 从聊天室移除用户
    this.roomManager.removeUserFromRoom(roomId, userId);

    // 通知聊天室内其他用户
    this.broadcastToRoom(roomId, {
      type: "userLeave",
      userId,
    });

    console.log(`用户 ${userId} 已从聊天室移除 ${roomId}`);
    console.log(
      `聊天室 ${roomId} 现有 ${
        this.roomManager.getRoomUsers(roomId).length
      } 名用户`
    );

    // 如果聊天室没有用户了，删除聊天室
    if (this.roomManager.getRoomUsers(roomId).length === 0) {
      this.roomManager.deleteRoom(roomId);
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

    roomUsers.forEach((user) => {
      if (!excludeUserId || user.id !== excludeUserId) {
        this.sendToClient(user.ws, message);
      }
    });
  }

  closeAllConnections() {
    clearInterval(this.heartbeatInterval);

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    // 关闭数据库连接
    database
      .close()
      .then(() => {
        console.log("所有连接已关闭");
      })
      .catch((error) => {
        console.error("关闭数据库连接失败:", error);
      });
  }
}

module.exports = WebSocketServer;

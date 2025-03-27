/**
 * WebSocket通信工具
 * 连接到后端Serverless服务
 */

// 声明环境变量类型
interface ImportMetaEnv {
  VITE_WS_URL: string;
}

// 假设我们有一个Serverless WebSocket服务的URL
const WS_BASE_URL =
  (import.meta as any).env?.VITE_WS_URL || "wss://api.cipherhall.com/ws";

import type { WebSocketMessage, Message, User } from "../types/message";

interface WebSocketConfig {
  roomId: string;
  userId: string;
  userName: string;
  publicKey: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onMessage: (message: Message) => Promise<void>;
  onUserJoin: (user: User) => void;
  onUserLeave: (userId: string) => void;
  onUserList: (users: User[]) => void;
  onHistory: (history: { messages: Message[] }) => void;
}

interface WebSocketController {
  send: (data: WebSocketMessage) => boolean;
  disconnect: () => void;
}

/**
 * 设置WebSocket连接
 * @param config - WebSocket配置
 * @returns WebSocket控制器
 */
export const setupWebSocket = (config: WebSocketConfig) => {
  const ws = new WebSocket(
    `ws://localhost:3000/ws?roomId=${config.roomId}&userId=${config.userId}&userName=${config.userName}`
  );

  ws.onopen = () => {
    console.log("WebSocket连接已建立");
    // 发送用户公钥
    ws.send(
      JSON.stringify({
        type: "register",
        publicKey: config.publicKey,
      })
    );
    config.onConnect();
  };

  ws.onclose = () => {
    console.log("WebSocket连接已关闭");
    config.onDisconnect();
  };

  ws.onerror = (error) => {
    console.error("WebSocket错误:", error);
  };

  ws.onmessage = async (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case "userList":
          config.onUserList(message.users || []);
          break;
        case "userJoin":
          if (message.user) {
            config.onUserJoin(message.user);
          }
          break;
        case "userLeave":
          if (message.userId) {
            config.onUserLeave(message.userId);
          }
          break;
        case "history":
          if (message.messages) {
            config.onHistory({ messages: message.messages });
          }
          break;
        case "text":
        case "image":
          await config.onMessage(message as Message);
          break;
        case "typing":
          // 处理输入状态
          break;
        default:
          console.warn(`未知消息类型: ${message.type}`);
      }
    } catch (error) {
      console.error("处理消息失败:", error);
    }
  };

  return {
    send: (message: WebSocketMessage) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        console.error("WebSocket未连接");
      }
    },
    disconnect: () => {
      ws.close();
    },
  };
};

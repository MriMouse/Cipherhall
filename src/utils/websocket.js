/**
 * WebSocket通信工具
 * 连接到后端Serverless服务
 */

// 假设我们有一个Serverless WebSocket服务的URL
const WS_BASE_URL = import.meta.env.VITE_WS_URL || "wss://api.cipherhall.com/ws";

/**
 * 设置WebSocket连接
 * @param {Object} options - WebSocket配置
 * @param {string} options.roomId - 聊天室ID
 * @param {string} options.userId - 用户ID
 * @param {string} options.userName - 用户名
 * @param {string} options.publicKey - 用户公钥
 * @param {Function} options.onConnect - 连接成功回调
 * @param {Function} options.onDisconnect - 断开连接回调
 * @param {Function} options.onMessage - 收到消息回调
 * @param {Function} options.onUserJoin - 用户加入回调
 * @param {Function} options.onUserLeave - 用户离开回调
 * @param {Function} options.onUserList - 用户列表更新回调
 */
export async function setupWebSocket(options) {
  const { 
    roomId, userId, userName, publicKey,
    onConnect, onDisconnect, onMessage, 
    onUserJoin, onUserLeave, onUserList 
  } = options;
  
  // 生成WebSocket连接URL
  const url = `${WS_BASE_URL}?roomId=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;
  
  // 创建WebSocket连接
  const socket = new WebSocket(url);
  
  // 检测是否支持WebSocket
  if (!socket) {
    throw new Error("您的浏览器不支持WebSocket");
  }
  
  // 连接打开
  socket.onopen = () => {
    console.log("WebSocket连接已建立");
    
    // 发送用户公钥
    send({
      type: "register",
      publicKey
    });
    
    // 调用连接成功回调
    if (onConnect) onConnect();
  };
  
  // 连接关闭
  socket.onclose = (event) => {
    console.log("WebSocket连接已关闭:", event.code, event.reason);
    
    // 调用断开连接回调
    if (onDisconnect) onDisconnect();
  };
  
  // 连接错误
  socket.onerror = (error) => {
    console.error("WebSocket错误:", error);
  };
  
  // 收到消息
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      // 根据消息类型处理
      switch (message.type) {
        case "message":
          if (onMessage) onMessage(message);
          break;
        case "user-join":
          if (onUserJoin) onUserJoin(message.user);
          break;
        case "user-leave":
          if (onUserLeave) onUserLeave(message.userId);
          break;
        case "user-list":
          if (onUserList) onUserList(message.users);
          break;
        default:
          console.warn("未知消息类型:", message.type);
      }
    } catch (error) {
      console.error("处理WebSocket消息失败:", error);
    }
  };
  
  // 发送消息函数
  function send(data) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    } else {
      console.warn("WebSocket未连接，消息发送失败");
      return false;
    }
  }
  
  // 断开连接函数
  function disconnect() {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  }
  
  // 返回WebSocket控制器
  return {
    send,
    disconnect
  };
}

// 在实际部署时，需要实现后端Serverless WebSocket服务
// 可以使用AWS API Gateway + Lambda，Azure Functions，Cloudflare Workers等

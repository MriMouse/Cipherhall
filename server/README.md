# 密語軒 (Cipherhall) WebSocket 服务器

这是密語軒聊天应用的后端 WebSocket 服务器，提供实时通信功能。

## 功能特点

- 基于 WebSocket 的实时消息传递
- 聊天室管理
- 用户在线状态管理
- 消息转发
- 支持端到端加密通信

## 本地开发设置

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 文件并重命名为 `.env`，然后根据需要修改设置。

```bash
cp .env.example .env
```

### 启动服务器

开发模式（自动重载）：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

## WebSocket API

服务器在 `/ws` 路径提供 WebSocket 连接。连接时可以提供以下查询参数：

- `roomId`: 聊天室标识符
- `userId`: 用户ID（可选，如果未提供则自动生成）
- `userName`: 用户名（可选，如果未提供则基于userId生成）

### 连接示例

```javascript
const socket = new WebSocket('ws://localhost:3000/ws?roomId=test-room&userId=user-123&userName=测试用户');
```

### 消息类型

客户端可以发送以下类型的消息：

#### 1. 注册用户公钥

```json
{
  "type": "register",
  "publicKey": "用户公钥(JSON字符串)"
}
```

#### 2. 发送加密消息

```json
{
  "type": "message",
  "content": "加密后的消息内容",
  "recipientId": "接收者ID",
  "timestamp": "ISO日期时间字符串",
  "language": "原始语言代码"
}
```

#### 3. 通知正在输入状态

```json
{
  "type": "typing",
  "isTyping": true|false
}
```

### 服务器响应

服务器会发送以下类型的消息：

#### 1. 用户列表

```json
{
  "type": "user-list",
  "users": [
    {
      "id": "用户ID",
      "name": "用户名",
      "publicKey": "用户公钥(如果已注册)"
    }
  ]
}
```

#### 2. 用户加入

```json
{
  "type": "user-join",
  "user": {
    "id": "用户ID",
    "name": "用户名"
  }
}
```

#### 3. 用户离开

```json
{
  "type": "user-leave",
  "userId": "用户ID",
  "userName": "用户名"
}
```

#### 4. 接收消息

```json
{
  "id": "消息ID",
  "type": "message",
  "content": "加密后的消息内容",
  "sender": "发送者名称",
  "senderId": "发送者ID",
  "timestamp": "ISO日期时间字符串",
  "language": "原始语言代码"
}
```

#### 5. 用户正在输入

```json
{
  "type": "typing",
  "userId": "用户ID",
  "userName": "用户名",
  "isTyping": true|false
}
```

## 部署说明

虽然此服务器设计为本地测试使用，但它也可以部署到支持 Node.js 的服务器上。对于生产环境，我们建议使用真正的 Serverless 架构，如：

- AWS API Gateway + Lambda 
- Azure Functions
- Cloudflare Workers

## 许可证

MIT

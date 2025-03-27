export interface Message {
  id: string;
  type: MessageType;
  content: string;
  language: string;
  sender: string;
  senderId: string;
  timestamp: string;
  isMine: boolean;
  translated?: string;
  translationStatus?: TranslationStatus;
  mimeType?: string; // 用于图片消息
  status?: MessageStatus; // 消息发送状态
  isEdited?: boolean; // 是否被编辑
  isRecalled?: boolean; // 是否被撤回
  originalContent?: string; // 原始内容(用于编辑)
  editTimestamp?: string; // 编辑时间
  messageHash?: string; // 消息哈希值
}

export interface User {
  id: string;
  name: string;
  publicKey?: string;
  language?: string;
  isTyping?: boolean; // 是否正在输入
}

export type MessageType =
  | "text" // 普通文本消息
  | "image" // 图片消息
  | "history" // 历史消息
  | "userList" // 用户列表
  | "userJoin" // 用户加入
  | "userLeave" // 用户离开
  | "connect" // 连接成功
  | "disconnect" // 断开连接
  | "translation" // 翻译完成
  | "register" // 用户注册
  | "typing" // 输入状态
  | "edit" // 编辑消息
  | "recall"; // 撤回消息

export type MessageStatus =
  | "sending" // 发送中
  | "sent" // 已发送
  | "delivered" // 已送达
  | "read" // 已读
  | "failed"; // 发送失败

export type TranslationStatus =
  | "pending" // 等待翻译
  | "translating" // 正在翻译
  | "completed" // 翻译完成
  | "failed"; // 翻译失败

export interface WebSocketMessage {
  type: MessageType;
  content?: string;
  recipientId?: string;
  language?: string;
  timestamp?: string;
  user?: User;
  userId?: string;
  users?: User[];
  publicKey?: string;
  messages?: Message[];
  sender?: string;
  senderId?: string;
  isMine?: boolean;
  translationStatus?: TranslationStatus;
  targetLanguage?: string;
  messageHash?: string;
  mimeType?: string; // 用于图片消息
  isTyping?: boolean; // 用于输入状态
  status?: MessageStatus; // 消息状态
  messageId?: string; // 消息ID(用于编辑和撤回)
  originalContent?: string; // 原始内容(用于编辑)
  editTimestamp?: string; // 编辑时间
}

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { encryptMessage, decryptMessage } from '@/utils/encryption'
import { setupWebSocket } from '@/utils/websocket'
import { translateText } from '@/utils/translation'
import type { Message, User, TranslationStatus, MessageType, MessageStatus } from '@/types/message'
import MessageBubble from '@/components/MessageBubble.vue'
import UserList from '@/components/UserList.vue'
import MessageInput from '@/components/MessageInput.vue'
import { Button } from '@/components/ui/button/index'
import { Badge } from '@/components/ui/badge/index'
import { ScrollArea } from '@/components/ui/scroll-area/index'

const props = defineProps<{
  roomName: string
}>()

const router = useRouter()
const messages = ref<Message[]>([])
const users = ref<User[]>([])
const isConnected = ref(false)
const loadingMessages = ref(true)
const userLanguage = ref(navigator.language || 'zh-CN')
const socket = ref<{ send: (message: any) => void; disconnect: () => void } | null>(null)
const typingTimeout = ref<number | null>(null)
const isTyping = ref(false)

// 处理用户注册
const handleRegister = async (publicKey: string) => {
  if (!socket.value || !isConnected.value) return

  try {
    socket.value.send({
      type: 'register',
      publicKey
    })
  } catch (err) {
    console.error('注册失败:', err)
  }
}

// 处理输入状态
const handleTyping = () => {
  if (!socket.value || !isConnected.value) return

  if (!isTyping.value) {
    isTyping.value = true
    socket.value.send({
      type: 'typing',
      isTyping: true
    })
  }

  // 清除之前的超时
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  // 设置新的超时
  typingTimeout.value = window.setTimeout(() => {
    isTyping.value = false
    socket.value?.send({
      type: 'typing',
      isTyping: false
    })
  }, 1000)
}

// 处理消息
const handleMessage = async (message: Message, privateKey: string) => {
  try {
    // 如果是自己的消息，直接显示原始内容
    if (message.isMine) {
      messages.value.push({
        ...message,
        translationStatus: 'completed' as TranslationStatus
      })
      return
    }

    // 尝试解密消息
    const decrypted = await decryptMessage(message.content, privateKey)
    const messageHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(decrypted))
    const hashString = Array.from(new Uint8Array(messageHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // 如果消息语言与用户语言不同，请求翻译
    if (message.language && message.language !== userLanguage.value) {
      message.translationStatus = 'pending' as TranslationStatus
      messages.value.push({
        ...message,
        content: decrypted,
        messageHash: hashString
      })

      // 发送翻译请求
      socket.value?.send({
        type: 'text',
        content: decrypted,
        language: message.language,
        targetLanguage: userLanguage.value,
        messageHash: hashString,
        translationStatus: 'translating' as TranslationStatus
      })
    } else {
      messages.value.push({
        ...message,
        content: decrypted,
        translationStatus: 'completed' as TranslationStatus
      })
    }
  } catch (err) {
    console.error('处理消息失败:', err)
    // 如果是解密失败，可能是历史消息，尝试直接显示
    if (message.isMine) {
      messages.value.push({
        ...message,
        translationStatus: 'completed' as TranslationStatus
      })
    } else {
      messages.value.push({
        ...message,
        content: message.content,
        translationStatus: 'failed' as TranslationStatus
      })
    }
  }
}

// 连接WebSocket
onMounted(async () => {
  const privateKey = localStorage.getItem('privateKey')
  const publicKey = localStorage.getItem('publicKey')

  if (!privateKey || !publicKey) {
    router.push('/')
    return
  }

  try {
    const userId = Math.random().toString(36).substring(2, 10)
    const userName = `用户${userId.substring(0, 4)}`

    socket.value = await setupWebSocket({
      roomId: props.roomName,
      userId,
      userName,
      publicKey,
      onConnect: () => {
        isConnected.value = true
        loadingMessages.value = false
        // 连接成功后注册用户
        handleRegister(publicKey)
      },
      onDisconnect: () => {
        isConnected.value = false
      },
      onUserJoin: (user: User) => {
        users.value = [...users.value, user]
      },
      onUserLeave: (userId: string) => {
        users.value = users.value.filter((user: User) => user.id !== userId)
      },
      onMessage: async (message: Message) => {
        await handleMessage(message, privateKey)
      },
      onUserList: (userList: User[]) => {
        users.value = userList
      },
      onHistory: async (history: { messages: Message[] }) => {
        try {
          const decryptedHistory = await Promise.all(
            history.messages.map(async (message: Message) => {
              await handleMessage(message, privateKey)
              return message
            })
          )
          messages.value = decryptedHistory
          loadingMessages.value = false
        } catch (err) {
          console.error('处理历史消息失败:', err)
          loadingMessages.value = false
        }
      }
    })
  } catch (err) {
    console.error('连接聊天室失败:', err)
    loadingMessages.value = false
  }
})

onBeforeUnmount(() => {
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  socket.value?.disconnect()
})

const handleImageUpload = async (file: File) => {
  if (!socket.value || !isConnected.value) return

  try {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      throw new Error('只支持图片文件')
    }

    // 检查文件大小（限制为 5MB）
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('图片大小不能超过 5MB')
    }

    // 将图片转换为 base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string

      // 发送图片消息
      await sendMessage(base64Image, 'image')
    }
    reader.readAsDataURL(file)
  } catch (err) {
    console.error('处理图片失败:', err)
    alert(err instanceof Error ? err.message : '处理图片失败')
  }
}

// 处理消息编辑
const handleEditMessage = async (messageId: string, content: string) => {
  if (!socket.value || !isConnected.value) return

  try {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) return

    // 更新本地消息
    message.content = content
    message.isEdited = true
    message.editTimestamp = new Date().toISOString()

    // 发送编辑消息
    socket.value.send({
      type: 'edit',
      messageId,
      content,
      editTimestamp: message.editTimestamp
    })
  } catch (err) {
    console.error('编辑消息失败:', err)
  }
}

// 处理消息撤回
const handleRecallMessage = async (messageId: string) => {
  if (!socket.value || !isConnected.value) return

  try {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) return

    // 更新本地消息
    message.isRecalled = true

    // 发送撤回消息
    socket.value.send({
      type: 'recall',
      messageId
    })
  } catch (err) {
    console.error('撤回消息失败:', err)
  }
}

// 更新消息状态
const updateMessageStatus = (messageId: string, status: MessageStatus) => {
  const message = messages.value.find(m => m.id === messageId)
  if (message) {
    message.status = status
  }
}

// 发送消息
const sendMessage = async (content: string, type: MessageType = 'text') => {
  if (!socket.value || !isConnected.value) return

  const messageId = `local-${Date.now()}`
  const currentUserId = localStorage.getItem('userId')
  const currentUserName = localStorage.getItem('userName') || 'me'

  // 创建本地消息
  const message: Message = {
    id: messageId,
    type,
    content,
    language: userLanguage.value,
    sender: currentUserName,
    senderId: currentUserId || '',
    timestamp: new Date().toISOString(),
    isMine: true,
    status: 'sending' as MessageStatus,
    translationStatus: 'completed' as TranslationStatus,
    mimeType: type === 'image' ? 'image/jpeg' : undefined
  }

  // 先添加到本地消息列表
  messages.value.push(message)

  try {
    // 给每个用户发送消息
    for (const user of users.value) {
      // 跳过没有公钥的用户
      if (!user.publicKey) continue

      // 如果是发送者自己，发送原始消息
      if (user.id === currentUserId) {
        socket.value.send({
          type,
          content,
          recipientId: user.id,
          language: userLanguage.value,
          timestamp: message.timestamp,
          mimeType: type === 'image' ? 'image/jpeg' : undefined,
          messageId,
          isMine: true
        })
        continue
      }

      // 给其他用户发送加密消息
      const encryptedContent = await encryptMessage(content, user.publicKey)
      socket.value.send({
        type,
        content: encryptedContent,
        recipientId: user.id,
        language: userLanguage.value,
        timestamp: message.timestamp,
        mimeType: type === 'image' ? 'image/jpeg' : undefined,
        messageId,
        isMine: false
      })
    }

    // 更新消息状态为已发送
    updateMessageStatus(messageId, 'sent')
  } catch (err) {
    console.error('发送消息失败:', err)
    updateMessageStatus(messageId, 'failed')
  }
}

const leaveRoom = () => {
  router.push('/')
}
</script>

<template>
  <div class="flex h-[calc(100vh-180px)] flex-col rounded-lg border bg-card">
    <div class="flex items-center justify-between border-b px-4 py-3">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="leaveRoom">
          ←
        </Button>
        <h2 class="text-lg font-semibold truncate">{{ roomName }}</h2>
      </div>
      <Badge :variant="isConnected ? 'default' : 'destructive'">
        {{ isConnected ? '已连接' : '连接中...' }}
      </Badge>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <ScrollArea class="flex-1 p-4">
        <div v-if="loadingMessages" class="flex h-full items-center justify-center text-muted-foreground">
          加载中...
        </div>
        <div v-else-if="messages.length === 0" class="flex h-full items-center justify-center text-muted-foreground">
          暂无消息，开始聊天吧！
        </div>
        <div v-else class="space-y-4">
          <MessageBubble v-for="message in messages" :key="message.id" :message="message" :is-mine="message.isMine"
            @edit="handleEditMessage" @recall="handleRecallMessage" />
        </div>
      </ScrollArea>

      <div class="w-[250px] border-l">
        <UserList :users="users" />
      </div>
    </div>

    <div class="border-t p-4">
      <MessageInput :disabled="!isConnected" @send="sendMessage" @image-upload="handleImageUpload"
        @typing="handleTyping" />
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
  background-color: var(--card);
  border-radius: 12px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  background-color: rgba(var(--primary), 0.05);
}

.back-button {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
}

.room-title {
  flex: 1;
  margin: 0 1rem;
  font-size: 1.2rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.connection-status {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: #f87171;
  color: white;
}

.connection-status.connected {
  background-color: #4ade80;
}

.chat-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.loading-messages,
.empty-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: rgba(var(--text), 0.6);
}

.sidebar {
  width: 250px;
  border-left: 1px solid var(--border);
  overflow-y: auto;
}

@media (max-width: 768px) {
  .chat-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border);
    height: auto;
    max-height: 200px;
  }
}
</style>

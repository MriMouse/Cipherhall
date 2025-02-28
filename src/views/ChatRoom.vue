<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { encryptMessage, decryptMessage } from '../utils/encryption'
import { setupWebSocket } from '../utils/websocket'
import { translateText } from '../utils/translation'
import MessageBubble from '../components/MessageBubble.vue'
import UserList from '../components/UserList.vue'
import MessageInput from '../components/MessageInput.vue'

const props = defineProps({
  roomName: {
    type: String,
    required: true
  }
})

const router = useRouter()
const messages = ref([])
const users = ref([])
const isConnected = ref(false)
const loadingMessages = ref(true)
const userLanguage = ref(navigator.language || 'zh-CN')
const socket = ref(null)

// 连接WebSocket
onMounted(async () => {
  // 检查用户是否有密钥
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
      },
      onDisconnect: () => {
        isConnected.value = false
      },
      onUserJoin: (user) => {
        users.value.push(user)
      },
      onUserLeave: (userId) => {
        users.value = users.value.filter(u => u.id !== userId)
      },
      onMessage: async (message) => {
        try {
          // 解密消息
          const decrypted = await decryptMessage(message.content, privateKey)
          
          // 翻译消息（如果不是本地语言）
          let translatedContent = decrypted
          if (message.language && message.language !== userLanguage.value) {
            try {
              translatedContent = await translateText(decrypted, message.language, userLanguage.value)
            } catch (err) {
              console.error('翻译失败:', err)
              // 翻译失败使用原文
            }
          }
          
          // 添加消息到聊天列表
          messages.value.push({
            ...message,
            content: decrypted,
            translated: translatedContent !== decrypted ? translatedContent : null
          })
        } catch (err) {
          console.error('处理消息失败:', err)
        }
      },
      onUserList: (userList) => {
        users.value = userList
      }
    })
  } catch (err) {
    console.error('连接聊天室失败:', err)
    loadingMessages.value = false
  }
})

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
})

// 发送消息处理
const sendMessage = async (content, type = 'text') => {
  if (!socket.value || !isConnected.value) return
  
  try {
    // 为每个在线用户加密消息
    for (const user of users.value) {
      if (!user.publicKey) continue
      
      const encryptedContent = await encryptMessage(content, user.publicKey)
      
      // 发送消息
      socket.value.send({
        type,
        content: encryptedContent,
        recipientId: user.id,
        language: userLanguage.value,
        timestamp: new Date().toISOString()
      })
    }
    
    // 添加消息到本地聊天记录
    messages.value.push({
      id: `local-${Date.now()}`,
      type,
      content,
      language: userLanguage.value,
      sender: 'me',
      timestamp: new Date().toISOString(),
      isMine: true
    })
  } catch (err) {
    console.error('发送消息失败:', err)
  }
}

// 离开聊天室
const leaveRoom = () => {
  router.push('/')
}
</script>

<template>
  <div class="chat-container">
    <div class="chat-header">
      <button @click="leaveRoom" class="back-button">← 返回</button>
      <h2 class="room-title">{{ roomName }}</h2>
      <div class="connection-status" :class="{ 'connected': isConnected }">
        {{ isConnected ? '已连接' : '连接中...' }}
      </div>
    </div>
    
    <div class="chat-layout">
      <div class="messages-container">
        <div v-if="loadingMessages" class="loading-messages">
          加载中...
        </div>
        <div v-else-if="messages.length === 0" class="empty-chat">
          暂无消息，开始聊天吧！
        </div>
        <div v-else class="messages-list">
          <MessageBubble
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :is-mine="message.isMine"
          />
        </div>
        
        <MessageInput 
          :disabled="!isConnected" 
          @send="sendMessage"
        />
      </div>
      
      <div class="sidebar">
        <UserList :users="users" />
      </div>
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

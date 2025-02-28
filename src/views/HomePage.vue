<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { generateKeyPair } from '../utils/encryption'

const router = useRouter()
const roomName = ref('')
const loading = ref(false)
const error = ref('')

const joinRoom = async () => {
  if (!roomName.value.trim()) {
    error.value = '请输入聊天室名称'
    return
  }
  
  error.value = ''
  loading.value = true
  
  try {
    // 如果用户没有密钥，则生成新的密钥对
    if (!localStorage.getItem('privateKey') || !localStorage.getItem('publicKey')) {
      const { privateKey, publicKey } = await generateKeyPair()
      localStorage.setItem('privateKey', privateKey)
      localStorage.setItem('publicKey', publicKey)
    }
    
    // 导航到聊天室
    router.push(`/${encodeURIComponent(roomName.value.trim())}`)
  } catch (err) {
    console.error('加入聊天室出错:', err)
    error.value = '加入聊天室失败，请稍后再试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="home-container">
    <div class="welcome-card">
      <h2>欢迎来到密語軒</h2>
      <p class="welcome-desc">加入端到端加密聊天室，跨越语言障碍，安全交流</p>
      
      <form @submit.prevent="joinRoom" class="room-form">
        <div class="input-group">
          <label for="room-name">输入聊天室名称</label>
          <input 
            id="room-name"
            v-model="roomName"
            type="text"
            placeholder="例如：my-secret-room"
            class="room-input"
            :disabled="loading"
          />
          <p v-if="error" class="error-message">{{ error }}</p>
        </div>
        
        <button 
          type="submit" 
          class="join-button"
          :disabled="loading"
        >
          <span v-if="loading">正在加入...</span>
          <span v-else>加入聊天室</span>
        </button>
      </form>
      
      <div class="features">
        <div class="feature">
          <h3>🔒 端到端加密</h3>
          <p>所有消息均经过端到端加密，确保只有聊天参与者可以读取</p>
        </div>
        <div class="feature">
          <h3>🌍 实时翻译</h3>
          <p>自动翻译消息到您的语言，无需语言障碍</p>
        </div>
        <div class="feature">
          <h3>📱 响应式设计</h3>
          <p>在任何设备上都能获得完美体验</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.welcome-card {
  background-color: var(--card);
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.welcome-desc {
  color: rgba(var(--text), 0.8);
  margin-bottom: 2rem;
}

.room-form {
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}

label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.room-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background-color: var(--background);
  color: var(--text);
  font-size: 1rem;
  width: 100%;
}

.room-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
}

.error-message {
  color: #e11d48;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.join-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.join-button:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.join-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.feature {
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(var(--primary), 0.05);
  border: 1px solid var(--border);
}

.feature h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.feature p {
  font-size: 0.9rem;
  color: rgba(var(--text), 0.9);
}
</style>

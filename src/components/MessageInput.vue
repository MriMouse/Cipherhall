<script setup>
import { ref } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send'])

const message = ref('')
const fileInput = ref(null)

const sendMessage = () => {
  if (!message.value.trim() || props.disabled) return
  
  emit('send', message.value, 'text')
  message.value = ''
}

const handleKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const openFileSelector = () => {
  fileInput.value.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件是否为图片
  if (!file.type.startsWith('image/')) {
    alert('只能上传图片文件')
    return
  }
  
  // 检查文件大小 (限制为2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过2MB')
    return
  }
  
  // 转换为base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target.result
    emit('send', base64, 'image')
  }
  reader.readAsDataURL(file)
  
  // 清除文件输入，以便能够再次选择相同文件
  event.target.value = ''
}
</script>

<template>
  <div class="message-input-container">
    <textarea
      v-model="message"
      placeholder="输入消息..."
      class="message-textarea"
      :disabled="disabled"
      @keydown="handleKeydown"
    ></textarea>
    
    <div class="message-actions">
      <button 
        class="action-button" 
        @click="openFileSelector"
        :disabled="disabled"
      >
        📷
      </button>
      <button 
        class="send-button" 
        @click="sendMessage"
        :disabled="disabled || !message.trim()"
      >
        发送
      </button>
    </div>
    
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden-file-input"
      @change="handleFileUpload"
    />
  </div>
</template>

<style scoped>
.message-input-container {
  padding: 1rem;
  border-top: 1px solid var(--border);
  background-color: var(--background);
}

.message-textarea {
  width: 100%;
  min-height: 60px;
  max-height: 150px;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background-color: var(--background);
  color: var(--text);
  resize: vertical;
  font-family: inherit;
  font-size: 0.95rem;
}

.message-textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.message-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
}

.action-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-button:hover:not(:disabled) {
  background-color: rgba(var(--primary), 0.1);
}

.send-button {
  padding: 0.5rem 1rem;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.send-button:disabled, .action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hidden-file-input {
  display: none;
}
</style>

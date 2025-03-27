<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ImageIcon, SendIcon } from 'lucide-vue-next'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'send', message: string): void
  (e: 'image-upload', file: File): void
  (e: 'typing'): void
}>()

const message = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// 监听输入变化
watch(message, () => {
  emit('typing')
})

const handleSubmit = () => {
  if (!message.value.trim() || props.disabled) return
  emit('send', message.value.trim())
  message.value = ''
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

const handleImageUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('image-upload', file)
  }
  // 清空 input，允许重复选择同一文件
  input.value = ''
}
</script>

<template>
  <div class="flex gap-2">
    <div class="relative flex-1">
      <Textarea v-model="message" placeholder="输入消息..." :disabled="disabled" @keydown="handleKeydown"
        class="min-h-[60px] resize-none pr-12" />
      <div class="absolute right-2 top-2 flex gap-2">
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
        <Button type="button" variant="ghost" size="icon" :disabled="disabled" @click="fileInput?.click()">
          <ImageIcon class="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" :disabled="disabled || !message.trim()" @click="handleSubmit">
          <SendIcon class="h-4 w-4" />
        </Button>
      </div>
    </div>
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

.send-button:disabled,
.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hidden-file-input {
  display: none;
}
</style>

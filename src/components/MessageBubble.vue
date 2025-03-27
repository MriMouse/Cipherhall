<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { EditIcon, TrashIcon, CheckIcon, XIcon } from 'lucide-vue-next'
import type { Message, MessageStatus } from '../types/message'

const props = defineProps<{
  message: Message
  isMine: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', messageId: string, content: string): void
  (e: 'recall', messageId: string): void
}>()

const isEditing = ref(false)
const editContent = ref('')

const messageStatus = computed(() => {
  if (props.message.isRecalled) return '已撤回'
  if (props.message.isEdited) return '已编辑'
  if (props.message.status === 'sending') return '发送中...'
  if (props.message.status === 'sent') return '已发送'
  if (props.message.status === 'delivered') return '已送达'
  if (props.message.status === 'read') return '已读'
  if (props.message.status === 'failed') return '发送失败'
  return ''
})

const startEditing = () => {
  editContent.value = props.message.content
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editContent.value = ''
}

const confirmEdit = () => {
  if (editContent.value.trim() && editContent.value !== props.message.content) {
    emit('edit', props.message.id, editContent.value.trim())
  }
  isEditing.value = false
}

const handleRecall = () => {
  emit('recall', props.message.id)
}
</script>

<template>
  <div :class="['flex', isMine ? 'justify-end' : 'justify-start']">
    <div :class="[
      'relative group max-w-[70%] rounded-lg p-3',
      isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'
    ]">
      <!-- 消息内容 -->
      <div v-if="!isEditing">
        <div v-if="message.isRecalled" class="text-muted-foreground italic">
          此消息已撤回
        </div>
        <template v-else>
          <div v-if="message.type === 'image'" class="relative">
            <img :src="message.content" class="max-w-full rounded-lg" alt="图片消息" />
            <div v-if="message.translated" class="mt-2 text-sm opacity-80">
              {{ message.translated }}
            </div>
          </div>
          <template v-else>
            <div class="whitespace-pre-wrap">{{ message.content }}</div>
            <div v-if="message.translated" class="mt-2 text-sm opacity-80">
              {{ message.translated }}
            </div>
          </template>
        </template>
      </div>

      <!-- 编辑模式 -->
      <div v-else class="space-y-2">
        <Textarea v-model="editContent" class="min-h-[100px]" />
        <div class="flex justify-end gap-2">
          <Button variant="ghost" size="sm" @click="cancelEditing">
            <XIcon class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" @click="confirmEdit">
            <CheckIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- 消息状态 -->
      <div v-if="messageStatus" class="text-xs mt-1 opacity-80">
        {{ messageStatus }}
      </div>

      <!-- 操作按钮 -->
      <div v-if="isMine && !message.isRecalled" class="absolute -right-2 -top-2 hidden group-hover:flex gap-1">
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="startEditing">
          <EditIcon class="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="handleRecall">
          <TrashIcon class="h-3 w-3" />
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-wrapper {
  margin-bottom: 1rem;
  display: flex;
}

.my-message-wrapper {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 0.75rem;
  border-radius: 8px;
  position: relative;
}

.my-message {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-bottom-right-radius: 2px;
}

.other-message {
  background-color: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  border-bottom-left-radius: 2px;
}

.message-sender {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  opacity: 0.8;
}

.message-content {
  word-wrap: break-word;
}

.message-image {
  max-width: 100%;
  border-radius: 4px;
}

.message-translation {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid hsl(var(--border));
  font-style: italic;
  font-size: 0.9em;
}

.my-message .message-translation {
  border-top-color: hsl(var(--primary-foreground) / 0.2);
}

.other-message .message-translation {
  border-top-color: hsl(var(--secondary-foreground) / 0.2);
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.7;
  text-align: right;
  margin-top: 0.25rem;
}
</style>

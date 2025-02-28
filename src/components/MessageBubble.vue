<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isMine: {
    type: Boolean,
    default: false
  }
})

const formattedTime = computed(() => {
  if (!props.message.timestamp) return ''
  const date = new Date(props.message.timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const isImage = computed(() => {
  return props.message.type === 'image'
})

const messageClasses = computed(() => {
  return {
    'message-bubble': true,
    'my-message': props.isMine,
    'other-message': !props.isMine
  }
})
</script>

<template>
  <div class="message-wrapper" :class="{ 'my-message-wrapper': isMine }">
    <div :class="messageClasses">
      <div class="message-sender" v-if="!isMine">{{ message.sender }}</div>
      
      <div class="message-content">
        <img v-if="isImage" :src="message.content" alt="图片消息" class="message-image" />
        <span v-else>{{ message.content }}</span>
      </div>
      
      <div v-if="message.translated" class="message-translation">
        翻译: {{ message.translated }}
      </div>
      
      <div class="message-time">{{ formattedTime }}</div>
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
  background-color: var(--primary);
  color: white;
  border-bottom-right-radius: 2px;
}

.other-message {
  background-color: rgba(var(--text), 0.1);
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
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-style: italic;
  font-size: 0.9em;
}

.my-message .message-translation {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.other-message .message-translation {
  border-top-color: rgba(0, 0, 0, 0.1);
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.7;
  text-align: right;
  margin-top: 0.25rem;
}
</style>

<script setup>
defineProps({
  users: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <div class="user-list-container">
    <h3 class="user-list-title">在线用户 ({{ users.length }})</h3>
    <div class="user-list">
      <div v-for="user in users" :key="user.id" class="user-item">
        <div class="user-avatar">{{ user.name.substring(0, 2).toUpperCase() }}</div>
        <div class="user-name">{{ user.name }}</div>
      </div>
      <div v-if="users.length === 0" class="no-users">
        暂无其他在线用户
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-list-container {
  padding: 1rem;
}

.user-list-title {
  font-size: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 600;
}

.user-name {
  font-size: 0.9rem;
}

.no-users {
  text-align: center;
  color: rgba(var(--text), 0.6);
  font-size: 0.9rem;
  padding: 1rem 0;
}
</style>
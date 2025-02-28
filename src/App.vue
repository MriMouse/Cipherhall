<script setup>
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">密語軒 | Cipherhall</h1>
      <p class="app-slogan">萬言無界 (Where words know no boundaries)</p>
    </header>
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
:root {
  --primary: #646cff;
  --primary-hover: #747bff;
  --background: #ffffff;
  --card: #f9f9f9;
  --text: #213547;
  --border: #e2e8f0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary: #646cff;
    --primary-hover: #747bff;
    --background: #1a1a1a;
    --card: #242424;
    --text: #ffffff;
    --border: #383838;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: var(--text);
  background-color: var(--background);
  line-height: 1.6;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  text-align: center;
  margin-bottom: 2rem;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.app-slogan {
  opacity: 0.8;
  font-size: 1.2rem;
}

.app-content {
  flex: 1;
}
</style>

<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto px-4 py-6">
        <h1 class="text-4xl font-bold tracking-tight text-foreground">
          密語軒 | Cipherhall
        </h1>
        <p class="mt-2 text-lg text-muted-foreground">
          萬言無界 (Where words know no boundaries)
        </p>
      </div>
    </header>
    <main class="container mx-auto px-4 py-8">
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

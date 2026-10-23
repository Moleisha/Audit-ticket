<template>
  <div class="app-root">
    <AppHeader />
    <main class="app-main shell">
      <router-view />
    </main>
    <footer class="app-footer shell">
      <span>票据风险核查平台 · 任务收集 / 转发 / 结果回显</span>
      <span>风险规则引擎由算法服务提供</span>
    </footer>
  </div>
</template>

<script>
import AppHeader from './components/AppHeader.vue'

export default {
  name: 'App',
  components: { AppHeader }
}
</script>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  padding: 28px 24px 40px;
}

.app-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 24px 26px;
  color: var(--ink-400);
  font-size: 12px;
}
</style>

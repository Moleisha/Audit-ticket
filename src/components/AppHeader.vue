<template>
  <header class="app-header">
    <div class="shell app-header__inner">
      <div class="brand">
        <span class="brand__mark"><a-icon type="safety-certificate" theme="filled" /></span>
        <span class="brand__text">
          <strong class="brand__name">票据风险核查平台</strong>
          <small class="brand__sub">经销商订单 × 发票五要素</small>
        </span>
      </div>

      <div class="header-right">
        <div class="stat glassy">
          <span class="stat__label">任务总数</span>
          <span class="stat__value num">{{ stats.total }}</span>
        </div>
        <div class="stat glassy">
          <span class="stat__label">发现风险</span>
          <span class="stat__value stat__value--danger num">{{ stats.risk }}</span>
        </div>
        <div class="engine glassy" :title="engineTitle">
          <span class="engine__dot" :class="engineDotClass"></span>
          <span class="engine__text">{{ engineText }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { useTasks } from '../composables/useTasks'
import { getHealth } from '../api/tasks'

export default {
  name: 'AppHeader',
  setup() {
    const { stats } = useTasks()
    return { stats }
  },
  data() {
    return { health: null }
  },
  computed: {
    engineText() {
      if (!this.health) return '算法服务检测中'
      return this.health.algorithmMode === 'mock' ? '算法服务：Mock 模式' : '算法服务：已配置'
    },
    engineTitle() {
      if (!this.health) return '正在检测算法服务连接状态'
      return this.health.algorithmMode === 'mock'
        ? '当前使用内置 Mock 结果，配置 ALGORITHM_API_URL 后可切换为真实算法服务'
        : '已配置算法服务地址，任务将转发至风险规则引擎'
    },
    engineDotClass() {
      if (!this.health) return 'engine__dot--idle'
      return this.health.algorithmReachable ? 'engine__dot--ok' : 'engine__dot--warn'
    }
  },
  created() {
    getHealth()
      .then((data) => {
        this.health = data
      })
      .catch(() => {
        this.health = null
      })
  }
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 72px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: #fff;
  font-size: 20px;
  background: linear-gradient(135deg, var(--brand-500), #6d8bff);
  box-shadow: 0 8px 20px -8px rgba(46, 91, 255, 0.8);
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.brand__name {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ink-900);
}

.brand__sub {
  font-size: 11px;
  color: var(--ink-500);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.glassy {
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 4px 12px -4px rgba(31, 38, 135, 0.05);
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 999px;
}

.stat__label {
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-500);
}

.stat__value {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink-900);
}

.stat__value--danger {
  color: var(--danger);
}

.engine {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-700);
  cursor: default;
}

.engine__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ink-400);
}

.engine__dot--ok {
  background: var(--success);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.engine__dot--warn {
  background: var(--warning);
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
}

.engine__dot--idle {
  background: var(--ink-400);
}

@media (max-width: 960px) {
  .stat,
  .engine {
    display: none;
  }
}
</style>

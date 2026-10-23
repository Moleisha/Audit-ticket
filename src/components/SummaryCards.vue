<template>
  <div class="cards">
    <div
      v-for="(item, index) in items"
      :key="item.label"
      class="card surface-hover rise"
      :class="[`card--${item.tone || 'neutral'}`]"
      :style="{ animationDelay: `${index * 0.05}s` }"
    >
      <div class="card__label">{{ item.label }}</div>
      <div class="card__value num">{{ display(item.value) }}</div>
      <div class="card__glow"></div>
    </div>
  </div>
</template>

<script>
import { formatNumber } from '../utils/format'

export default {
  name: 'SummaryCards',
  props: {
    items: { type: Array, default: () => [] }
  },
  methods: {
    display(value) {
      if (value === null || value === undefined || value === '') return '—'
      return typeof value === 'number' ? formatNumber(value) : String(value)
    }
  }
}
</script>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.card {
  position: relative;
  padding: 20px 24px;
  overflow: hidden;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.card__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-500);
  margin-bottom: 6px;
}

.card__value {
  font-size: 28px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--ink-900);
  z-index: 1;
}

.card__glow {
  position: absolute;
  top: -20%;
  right: -20%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.15;
  pointer-events: none;
}

.card--danger .card__glow { background: var(--danger); }
.card--warning .card__glow { background: var(--warning); }
.card--info .card__glow { background: var(--info); }
.card--success .card__glow { background: var(--success); }
.card--neutral .card__glow { background: var(--ink-400); }

.card--danger { border-left: 4px solid var(--danger); }
.card--warning { border-left: 4px solid var(--warning); }
.card--info { border-left: 4px solid var(--info); }
.card--success { border-left: 4px solid var(--success); }
.card--neutral { border-left: 4px solid var(--ink-400); }

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px -8px rgba(31, 38, 135, 0.12);
  border-color: rgba(255, 255, 255, 0.6);
}
</style>

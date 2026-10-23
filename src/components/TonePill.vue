<template>
  <span class="pill pop" :class="[`pill--${tone}`, { 'pill--pulse': pulse }]">
    <span v-if="pulse" class="pill__dot"></span>{{ text }}
  </span>
</template>

<script>
export default {
  name: 'TonePill',
  props: {
    text: { type: [String, Number], default: '' },
    tone: { type: String, default: 'neutral' },
    pulse: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
  border: 1px solid transparent;
}

.pill--danger {
  color: var(--danger);
  background: rgba(229, 72, 77, 0.09);
  border-color: rgba(229, 72, 77, 0.18);
}

.pill--warning {
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.22);
}

.pill--info {
  color: var(--brand-600);
  background: rgba(46, 91, 255, 0.09);
  border-color: rgba(46, 91, 255, 0.18);
}

.pill--success {
  color: #047857;
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
}

.pill--neutral {
  color: var(--ink-500);
  background: #f1f4fa;
  border-color: #e6eaf2;
}

.pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: blink 1.2s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}
</style>

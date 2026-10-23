<template>
  <div class="files">
    <div v-for="item in items" :key="item.kind" class="file">
      <span class="file__icon"><a-icon type="file-excel" /></span>
      <div class="file__body">
        <div class="file__name" :title="item.meta.name">{{ item.meta.name || '—' }}</div>
        <div class="file__meta">
          <span>{{ item.label }}</span>
          <span class="file__dot">·</span>
          <span class="num">{{ formatFileSize(item.meta.size) }}</span>
        </div>
      </div>
    </div>

    <div class="engine">
      <div class="engine__row">
        <span class="engine__label">算法对接模式</span>
        <span class="engine__value num">{{ engineModeText }}</span>
      </div>
      <div class="engine__row">
        <span class="engine__label">分析耗时</span>
        <span class="engine__value num">{{ formatDuration(engineDuration) }}</span>
      </div>
      <div class="engine__row">
        <span class="engine__label">结果文件</span>
        <span class="engine__value">{{ resultFileText }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { formatFileSize, formatDuration } from '../utils/format'

export default {
  name: 'TaskFileInfo',
  props: {
    task: { type: Object, required: true }
  },
  computed: {
    items() {
      const files = this.task.files || {}
      return [
        { kind: 'order', label: '经销商订单信息', meta: files.order || {} },
        { kind: 'invoice', label: '发票五要素', meta: files.invoice || {} }
      ]
    },
    engineDuration() {
      return this.task.engine ? this.task.engine.durationMs : 0
    },
    engineModeText() {
      if (!this.task.engine) return '—'
      return this.task.engine.mode === 'mock' ? 'Mock（内置示例）' : 'HTTP（真实算法服务）'
    },
    resultFileText() {
      const file = this.task.result && this.task.result.resultFile
      if (!file) return '由后端按结果表格实时生成'
      return `${file.name} · ${formatFileSize(file.size)}`
    }
  },
  methods: { formatFileSize, formatDuration }
}
</script>

<style scoped>
.files {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fbfcff;
}

.file__icon {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  font-size: 15px;
  line-height: 32px;
  text-align: center;
  color: var(--success);
  background: rgba(16, 185, 129, 0.1);
}

.file__body {
  min-width: 0;
}

.file__name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file__meta {
  display: flex;
  gap: 6px;
  font-size: 11px;
  color: var(--ink-400);
}

.engine {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 26px;
  padding-top: 4px;
}

.engine__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.engine__label {
  color: var(--ink-400);
}

.engine__value {
  font-weight: 600;
  color: var(--ink-700);
}
</style>

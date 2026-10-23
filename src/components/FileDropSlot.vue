<template>
  <div
    class="slot"
    :class="{ 'slot--dragging': dragging, 'slot--filled': !!file, 'slot--disabled': disabled }"
    @click="pick"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <input ref="input" class="slot__input" type="file" :accept="accept" @change="onChange" />

    <template v-if="!file">
      <div class="slot__main">
        <a-icon class="slot__icon" type="inbox" />
        <div class="slot__title">{{ title }}</div>
        <div class="slot__hint">点击选择或拖拽文件到此处</div>
        <div class="slot__formats">支持 .xlsx / .xls</div>
      </div>
      <div class="slot__footer">
        <div class="slot__desc">{{ desc }}</div>
      </div>
    </template>

    <template v-else>
      <a-icon class="slot__icon slot__icon--ok" type="file-excel" />
      <div class="slot__title slot__title--file">{{ file.name }}</div>
      <div class="slot__hint">{{ sizeText }}</div>
      <div class="slot__actions">
        <a-button type="link" size="small" @click.stop="$emit('preview')">
          <a-icon type="eye" /> 预览内容
        </a-button>
        <a-button class="slot__remove" type="link" size="small" @click.stop="clear">
          移除重传
        </a-button>
      </div>
    </template>
  </div>
</template>

<script>
import { formatFileSize } from '../utils/format'

export default {
  name: 'FileDropSlot',
  props: {
    title: { type: String, required: true },
    desc: { type: String, default: '' },
    file: { type: Object, default: null },
    accept: { type: String, default: '.xlsx,.xls' },
    disabled: { type: Boolean, default: false }
  },
  data() {
    return { dragging: false }
  },
  computed: {
    sizeText() {
      return this.file ? formatFileSize(this.file.size) : ''
    }
  },
  methods: {
    pick() {
      if (this.disabled) return
      this.$refs.input.click()
    },
    onChange(event) {
      const file = event.target.files && event.target.files[0]
      event.target.value = ''
      if (file) this.$emit('select', file)
    },
    onDrop(event) {
      this.dragging = false
      if (this.disabled) return
      const file = event.dataTransfer.files && event.dataTransfer.files[0]
      if (file) this.$emit('select', file)
    },
    clear() {
      this.$emit('clear')
    }
  }
}
</script>

<style scoped>
.slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 180px;
  padding: 24px 20px;
  text-align: center;
  border: 1.5px dashed rgba(205, 215, 238, 0.8);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.slot:hover {
  border-color: var(--brand-500);
  background: rgba(46, 91, 255, 0.04);
  transform: translateY(-2px);
}

.slot--dragging {
  border-color: var(--brand-500);
  border-style: solid;
  background: rgba(46, 91, 255, 0.08);
  transform: scale(1.02);
}

.slot--filled {
  border-style: solid;
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.03);
}

.slot--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.slot__input {
  display: none;
}

.slot__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.slot__icon {
  font-size: 32px;
  color: var(--brand-500);
  margin-bottom: 4px;
}

.slot__icon--ok {
  color: var(--success);
}

.slot__title {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink-900);
}

.slot__title--file {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot__hint {
  font-size: 12px;
  color: var(--ink-500);
}

.slot__formats {
  margin-top: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-500);
  background: var(--brand-50);
  border-radius: 999px;
  display: inline-block;
}

.slot__footer {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(230, 234, 242, 0.5);
  width: 100%;
}

.slot__desc {
  font-size: 11px;
  color: var(--ink-400);
}

.slot__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.slot__remove {
  color: var(--danger) !important;
}

.slot__remove:hover {
  color: #ff7875 !important;
}
</style>

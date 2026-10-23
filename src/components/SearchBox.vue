<template>
  <div class="search">
    <a-icon class="search__icon" type="search" />
    <a-input
      class="search__input"
      :value="value"
      :placeholder="placeholder"
      allow-clear
      @change="onChange"
    />
  </div>
</template>

<script>
export default {
  name: 'SearchBox',
  props: {
    value: { type: String, default: '' },
    placeholder: { type: String, default: '搜索关键词' }
  },
  methods: {
    onChange(event) {
      this.$emit('input', event.target.value)
    }
  }
}
</script>

<style scoped>
.search {
  position: relative;
  width: 320px;
  max-width: 100%;
}

.search__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  color: var(--ink-500);
  font-size: 14px;
}

.search__input >>> input {
  padding-left: 36px !important;
  height: 38px !important;
  font-weight: 600;
  color: var(--ink-900);
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.search__input >>> input:hover,
.search__input >>> input:focus {
  background: rgba(255, 255, 255, 0.7) !important;
  border-color: var(--brand-500) !important;
  box-shadow: 0 4px 12px -4px rgba(31, 38, 135, 0.1);
}

@media (max-width: 720px) {
  .search {
    width: 100%;
  }
}
</style>

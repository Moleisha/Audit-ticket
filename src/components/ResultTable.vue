<template>
  <div class="excel-window">
    <div class="rt__bar">
      <div class="rt__meta">
        <span class="num">{{ filteredRows.length }}</span> 条结果 · 来自算法服务的
        <span class="num">{{ columns.length }}</span> 列定义
      </div>
      <div class="rt__search">
        <a-icon class="rt__search-icon" type="search" />
        <a-input v-model="keyword" size="small" allow-clear placeholder="在结果中检索关键词" />
      </div>
    </div>

    <div v-if="!columns.length" class="rt__empty">
      <a-icon class="rt__empty-icon" type="table" />
      <div>算法服务未返回列定义，暂无可展示的结果表格</div>
    </div>

    <template v-else>
      <div class="excel-container">
        <!-- Excel Header (A, B, C...) -->
        <div class="excel-grid">
          <div class="excel-scroll-area" @scroll="onScroll">
            <table class="rt__table">
              <thead>
                <tr>
                  <th class="rt__index-header"></th>
                  <th
                    v-for="(col, index) in columns"
                    :key="col.key"
                    class="excel-col-header"
                    :class="{ 'is-num': col.type === 'number' }"
                    :style="col.width ? { minWidth: `${col.width}px` } : { minWidth: '120px' }"
                  >
                    <div class="excel-col-letter">{{ getColumnLetter(index) }}</div>
                    <div class="excel-col-title">{{ col.title || col.key }}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in filteredRows" :key="rowIndex" class="excel-row">
                  <td class="rt__index-cell num">{{ rowIndex + 1 }}</td>
                  <td
                    v-for="col in columns"
                    :key="col.key"
                    class="excel-cell"
                    :class="{ 'is-num': col.type === 'number' }"
                  >
                    <span v-if="col.type === 'number'" class="num">{{ formatNumber(row[col.key]) }}</span>
                    <TonePill v-else-if="col.type === 'enum'" :text="row[col.key]" :tone="toneOfValue(row[col.key])" />
                    <span v-else class="rt__text">{{ display(row[col.key]) }}</span>
                  </td>
                </tr>
                <tr v-if="!filteredRows.length">
                  <td :colspan="columns.length + 1" class="rt__none">没有匹配的结果</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="excel-footer">
        <div class="excel-sheet-tab">
          <a-icon type="file-excel" /> 风险明细
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import TonePill from './TonePill.vue'
import { formatNumber } from '../utils/format'
import { toneOfValue } from '../utils/taskMeta'

export default {
  name: 'ResultTable',
  components: { TonePill },
  props: {
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] }
  },
  data() {
    return {
      keyword: '',
      scrollLeft: 0,
      scrollTop: 0
    }
  },
  computed: {
    filteredRows() {
      const keyword = this.keyword.trim().toLowerCase()
      if (!keyword) return this.rows
      return this.rows.filter((row) =>
        this.columns.some((col) => String(row[col.key] == null ? '' : row[col.key]).toLowerCase().includes(keyword))
      )
    }
  },
  methods: {
    formatNumber,
    toneOfValue,
    display(value) {
      if (value === null || value === undefined || value === '') return '—'
      return String(value)
    },
    getColumnLetter(index) {
      let letter = ''
      while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter
        index = Math.floor(index / 26) - 1
      }
      return letter
    },
    onScroll(e) {
      this.scrollLeft = e.target.scrollLeft
      this.scrollTop = e.target.scrollTop
    }
  }
}
</script>

<style scoped>
.excel-window {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.rt__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(248, 250, 255, 0.6);
  border-bottom: 1px solid var(--line);
}

.rt__meta {
  font-size: 12px;
  color: var(--ink-500);
  font-weight: 600;
}

.rt__search {
  position: relative;
  width: 240px;
}

.rt__search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  font-size: 12px;
  color: var(--ink-400);
}

.rt__search >>> input {
  padding-left: 28px;
  border-radius: 6px;
  background: #fff !important;
}

.excel-container {
  position: relative;
  flex: 1;
  min-height: 400px;
  max-height: 600px;
  overflow: hidden;
  background: #f4f6f9;
}

.excel-scroll-area {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
}

.rt__table {
  border-collapse: collapse;
  table-layout: fixed;
  background: #fff;
}

/* Excel Headers */
.rt__index-header {
  position: sticky;
  left: 0;
  top: 0;
  z-index: 10;
  width: 40px;
  height: 44px;
  background: #e9ecf2;
  border: 1px solid #d1d5db;
}

.excel-col-header {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 44px;
  padding: 0;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  text-align: center;
  user-select: none;
}

.excel-col-letter {
  font-size: 10px;
  color: #6b7280;
  line-height: 14px;
  background: #e5e7eb;
  border-bottom: 1px solid #d1d5db;
}

.excel-col-title {
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Excel Body */
.rt__index-cell {
  position: sticky;
  left: 0;
  z-index: 4;
  width: 40px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  text-align: center;
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}

.excel-cell {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  font-size: 13px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: #fff;
}

.excel-row:hover .excel-cell {
  background: #f9fafb;
}

.excel-cell.is-num {
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
}

.rt__text {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.excel-footer {
  height: 32px;
  background: #f3f4f6;
  border-top: 1px solid #d1d5db;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.excel-sheet-tab {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: #fff;
  border-left: 1px solid #d1d5db;
  border-right: 1px solid #d1d5db;
  font-size: 12px;
  font-weight: 700;
  color: #2e5bff;
  gap: 6px;
}

.rt__none,
.rt__empty {
  padding: 40px 0;
  text-align: center;
  color: var(--ink-400);
  background: #fff;
}

.rt__empty-icon {
  display: block;
  margin-bottom: 8px;
  font-size: 32px;
}

/* Custom scrollbar for Excel feel */
.excel-scroll-area::-webkit-scrollbar {
  width: 14px;
  height: 14px;
}

.excel-scroll-area::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.excel-scroll-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border: 3px solid #f1f1f1;
  border-radius: 10px;
}

.excel-scroll-area::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

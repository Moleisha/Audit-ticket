<template>
  <div class="task-table">
    <a-table
      :columns="columns"
      :data-source="pagedTasks"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 920 }"
      row-key="id"
      size="middle"
    >
      <template slot="creator" slot-scope="text, record">
        <div class="creator">
          <span class="creator__avatar">{{ initial(record.creator) }}</span>
          <span class="creator__name">{{ record.creator || '—' }}</span>
        </div>
      </template>

      <template slot="startedAt" slot-scope="text, record">
        <div class="time">
          <span class="time__main num">{{ formatDateTime(record.startedAt) }}</span>
          <span class="time__rel">{{ formatRelative(record.startedAt) }}</span>
        </div>
      </template>

      <template slot="hasRisk" slot-scope="text, record">
        <TonePill :text="riskText(record.hasRisk)" :tone="riskTone(record.hasRisk)" />
      </template>

      <template slot="status" slot-scope="text, record">
        <div class="status">
          <TonePill
            :text="statusMeta(record.status).text"
            :tone="statusMeta(record.status).tone"
            :pulse="record.status === 'running'"
          />
          <a-progress
            v-if="record.status === 'running'"
            class="status__bar"
            :percent="record.progress || 0"
            :show-info="false"
            :stroke-width="5"
            stroke-color="#2E5BFF"
          />
          <a-tooltip v-if="record.status === 'failed' && record.error" :title="record.error">
            <span class="status__error">{{ record.error }}</span>
          </a-tooltip>
        </div>
      </template>

      <template slot="action" slot-scope="text, record">
        <div class="ops">
          <a-button type="link" size="small" :disabled="!canPreview(record)" @click="$emit('preview', record)">
            <a-icon type="eye" /> 预览
          </a-button>
          <a-button type="link" size="small" :disabled="!canDownload(record)" @click="$emit('download', record)">
            <a-icon type="download" /> 下载
          </a-button>
          <a-button
            type="link"
            size="small"
            :disabled="record.status === 'running'"
            @click="$emit('restart', record)"
          >
            <a-icon type="reload" /> 重启任务
          </a-button>
        </div>
      </template>

      <template slot="empty">
        <div class="empty">
          <a-icon class="empty__icon" type="inbox" />
          <div class="empty__title">暂无历史任务</div>
          <div class="empty__desc">上传两类 Excel 并点击「开始分析」后，任务会出现在这里</div>
        </div>
      </template>
    </a-table>

    <div v-if="tasks.length" class="task-table__foot">
      <span class="task-table__total num">共 {{ tasks.length }} 条</span>
      <a-pagination
        :current="current"
        :page-size="pageSize"
        :total="tasks.length"
        size="small"
        show-less-items
        @change="onPageChange"
      />
    </div>
  </div>
</template>

<script>
import TonePill from './TonePill.vue'
import { formatDateTime, formatRelative } from '../utils/format'
import { statusMeta, riskText, riskTone, canPreview, canDownload } from '../utils/taskMeta'

export default {
  name: 'TaskTable',
  components: { TonePill },
  props: {
    tasks: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    pageSize: { type: Number, default: 8 }
  },
  data() {
    return {
      current: 1,
      columns: [
        { title: '发起人', dataIndex: 'creator', key: 'creator', width: 140, scopedSlots: { customRender: 'creator' } },
        {
          title: '任务启动时间',
          dataIndex: 'startedAt',
          key: 'startedAt',
          width: 210,
          scopedSlots: { customRender: 'startedAt' }
        },
        { title: '是否发现风险', key: 'hasRisk', width: 150, scopedSlots: { customRender: 'hasRisk' } },
        { title: '任务状态', key: 'status', width: 180, scopedSlots: { customRender: 'status' } },
        { title: '操作', key: 'action', width: 240, scopedSlots: { customRender: 'action' } }
      ]
    }
  },
  computed: {
    pagedTasks() {
      const start = (this.current - 1) * this.pageSize
      return this.tasks.slice(start, start + this.pageSize)
    }
  },
  watch: {
    tasks() {
      const maxPage = Math.max(1, Math.ceil(this.tasks.length / this.pageSize))
      if (this.current > maxPage) this.current = maxPage
    }
  },
  methods: {
    formatDateTime,
    formatRelative,
    statusMeta,
    riskText,
    riskTone,
    canPreview,
    canDownload,
    initial(name) {
      return name ? String(name).trim().charAt(0) : '—'
    },
    onPageChange(page) {
      this.current = page
    }
  }
}
</script>

<style scoped>
.creator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.creator__avatar {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 24px;
  text-align: center;
  color: var(--brand-600);
  background: var(--brand-50);
}

.creator__name {
  font-weight: 600;
}

.time {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.time__main {
  font-weight: 600;
}

.time__rel {
  font-size: 11px;
  color: var(--ink-400);
}

.status {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.status__bar {
  width: 120px;
}

.status__error {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--danger);
  cursor: help;
}

.ops {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.empty {
  padding: 32px 0 36px;
  text-align: center;
}

.empty__icon {
  font-size: 30px;
  color: var(--ink-400);
}

.empty__title {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
}

.empty__desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ink-400);
}

.task-table__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 16px;
}

.task-table__total {
  font-size: 12px;
  color: var(--ink-400);
}
</style>

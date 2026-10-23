<template>
  <div class="detail">
    <div class="detail__top rise">
      <a-button class="back" type="link" size="small" @click="back">
        <a-icon type="arrow-left" /> 返回任务列表
      </a-button>

      <div class="detail__head">
        <div class="detail__title-wrap">
          <h1 class="detail__title">任务详情</h1>
          <span class="detail__id num">{{ id }}</span>
          <TonePill v-if="task" :text="statusText" :tone="statusTone" :pulse="task.status === 'running'" />
        </div>
        <div class="detail__ops">
          <a-button @click="previewSource">
            <a-icon type="eye" /> 预览源文件
          </a-button>
          <a-button :disabled="!downloadable" @click="onDownload">
            <a-icon type="download" /> 下载分析结果
          </a-button>
          <a-button
            type="primary"
            :loading="restarting"
            :disabled="restarting || (task && task.status === 'running')"
            @click="onRestart"
          >
            <a-icon v-if="!restarting" type="reload" /> 重启任务
          </a-button>
        </div>
      </div>

      <div v-if="task" class="detail__meta">
        <span>发起人 · {{ task.creator }}</span>
        <span class="dot">|</span>
        <span class="num">{{ formatDateTime(task.startedAt) }}</span>
        <span class="dot">|</span>
        <span class="detail__files" :title="fileNames">
          {{ task.files.order.name }} / {{ task.files.invoice.name }}
        </span>
      </div>
    </div>

    <a-skeleton v-if="loading && !task" class="surface detail__block" active :paragraph="{ rows: 6 }" />

    <section v-else-if="error" class="surface state">
      <a-icon class="state__icon state__icon--danger" type="close-circle" />
      <div class="state__title">任务加载失败</div>
      <div class="state__desc">{{ error }}</div>
      <a-button class="state__action" type="primary" @click="reload">重新加载</a-button>
    </section>

    <template v-else-if="task">
      <section v-if="task.status === 'running'" class="surface state">
        <a-icon class="state__icon state__icon--info" type="loading" spin />
        <div class="state__title">算法服务分析中</div>
        <div class="state__desc">两类源文件已提交风险规则引擎，分析完成后结果会自动回显</div>
        <a-progress
          class="state__bar"
          :percent="task.progress || 0"
          :stroke-width="8"
          stroke-color="#2E5BFF"
        />
      </section>

      <section v-else-if="task.status === 'failed'" class="surface state">
        <a-icon class="state__icon state__icon--danger" type="close-circle" />
        <div class="state__title">分析失败</div>
        <div class="state__desc">{{ task.error || '算法服务未返回有效结果' }}</div>
        <a-button class="state__action" type="primary" :loading="restarting" @click="onRestart">
          <a-icon v-if="!restarting" type="reload" /> 重启任务
        </a-button>
      </section>

      <template v-else>
        <section class="surface detail__block rise" style="animation-delay: 0.06s">
          <div class="block__head">
            <div>
              <div class="section-title">分析结果</div>
              <div class="section-sub">表格列由算法服务返回的列定义动态生成，平台不做业务字段解释</div>
            </div>
            <span class="block__hint"><a-icon type="info-circle" /> 完整结果文件可通过右上角下载</span>
          </div>
          <ResultTable :columns="columns" :rows="rows" />
        </section>
      </template>

      <section class="surface detail__block rise" style="animation-delay: 0.12s">
        <div class="block__head">
          <div>
            <div class="section-title">任务信息</div>
            <div class="section-sub">源文件与算法对接信息</div>
          </div>
        </div>
        <TaskFileInfo :task="task" />
      </section>
    </template>

    <!-- 文件预览弹窗 -->
    <a-modal
      v-model="previewVisible"
      :title="`文件预览：${previewingName}`"
      width="1000px"
      :footer="null"
      centered
      destroy-on-close
    >
      <div v-if="previewLoading" class="preview-loading">
        <a-icon type="loading" spin /> 正在从服务器读取 Excel 内容...
      </div>
      <ResultTable v-else :columns="previewData.columns" :rows="previewData.rows" />
    </a-modal>
  </div>
</template>

<script>
import TonePill from '../components/TonePill.vue'
import ResultTable from '../components/ResultTable.vue'
import TaskFileInfo from '../components/TaskFileInfo.vue'
import { getTask, restartTask, downloadByUrl, resultFileUrl, templateUrl } from '../api/tasks'
import { useTasks } from '../composables/useTasks'
import { formatDateTime } from '../utils/format'
import { statusMeta } from '../utils/taskMeta'
import { parseExcel } from '../utils/excelParser'
import axios from 'axios'

const POLL_INTERVAL = 3000

export default {
  name: 'TaskDetail',
  components: { TonePill, ResultTable, TaskFileInfo },
  props: {
    id: { type: String, required: true }
  },
  setup() {
    const { replaceTask } = useTasks()
    return { replaceTask }
  },
  data() {
    return {
      task: null,
      loading: true,
      error: '',
      restarting: false,
      timer: null,
      previewVisible: false,
      previewLoading: false,
      previewingName: '',
      previewData: { columns: [], rows: [] }
    }
  },
  computed: {
    statusText() {
      return this.task ? statusMeta(this.task.status).text : ''
    },
    statusTone() {
      return this.task ? statusMeta(this.task.status).tone : 'neutral'
    },
    table() {
      return (this.task && this.task.result && this.task.result.table) || null
    },
    columns() {
      return (this.table && this.table.columns) || []
    },
    rows() {
      return (this.table && this.table.rows) || []
    },
    downloadable() {
      if (!this.task || this.task.status !== 'done' || !this.task.result) return false
      return Boolean((this.rows && this.rows.length) || this.task.result.resultFile)
    },
    fileNames() {
      if (!this.task) return ''
      return `${this.task.files.order.name} / ${this.task.files.invoice.name}`
    }
  },
  watch: {
    id() {
      this.reload()
    }
  },
  created() {
    this.reload()
  },
  beforeDestroy() {
    this.clearTimer()
  },
  methods: {
    formatDateTime,
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    syncPolling() {
      const running = this.task && this.task.status === 'running'
      if (!running) {
        this.clearTimer()
        return
      }
      if (this.timer) return
      this.timer = setInterval(() => {
        this.fetch({ silent: true })
      }, POLL_INTERVAL)
    },
    async fetch({ silent = false } = {}) {
      if (!silent) this.loading = true
      try {
        this.task = await getTask(this.id)
        this.error = ''
        this.syncPolling()
      } catch (error) {
        this.error = error.message
        this.clearTimer()
      } finally {
        this.loading = false
      }
    },
    reload() {
      this.clearTimer()
      this.fetch()
    },
    onDownload() {
      downloadByUrl(resultFileUrl(this.id))
      this.$message.success('已开始下载分析结果')
    },
    previewSource() {
      const self = this
      this.$confirm({
        title: '选择预览文件',
        content: '请选择你想预览的原始上传文件类型',
        okText: '经销商订单',
        cancelText: '发票五要素',
        onOk() {
          self.doPreviewServerFile('order')
        },
        onCancel(e) {
          if (e.triggerCancel) return // 点击遮罩或 Esc
          self.doPreviewServerFile('invoice')
        }
      })
    },
    async doPreviewServerFile(kind) {
      if (!this.task) return
      const fileName = this.task.files[kind].name
      this.previewingName = fileName
      this.previewVisible = true
      this.previewLoading = true
      try {
        const url = templateUrl(kind) // 这里为了演示，实际上应该调用获取任务源文件的接口
        // 但由于后端暂未实现专门的“获取任务源文件”接口，我们先模拟下载并解析
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        const data = await parseExcel(response.data)
        this.previewData = data
      } catch (error) {
        this.$message.error(`预览失败: ${error.message}`)
        this.previewVisible = false
      } finally {
        this.previewLoading = false
      }
    },
    onRestart() {
      const self = this
      this.$confirm({
        title: '重启任务',
        content: '将重新提交源文件至算法服务并覆盖现有结果，是否继续？',
        okText: '重启',
        cancelText: '取消',
        onOk() {
          return self.doRestart()
        }
      })
    },
    async doRestart() {
      this.restarting = true
      try {
        const task = await restartTask(this.id)
        this.task = task
        this.replaceTask(task)
        this.syncPolling()
        this.$message.success('任务已重新提交，正在等待算法服务返回')
      } catch (error) {
        this.$message.error(error.message)
      } finally {
        this.restarting = false
      }
    },
    back() {
      this.$router.push({ name: 'task-manager' })
    }
  }
}
</script>

<style scoped>
.detail__top {
  margin-bottom: 18px;
}

.back {
  padding-left: 0;
  margin-bottom: 6px;
}

.detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.detail__title-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.detail__title {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--ink-900);
}

.detail__id {
  font-size: 12px;
  color: var(--ink-400);
}

.detail__ops {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--ink-500);
}

.detail__meta .dot {
  color: #d3dae8;
}

.detail__files {
  max-width: 460px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail__block {
  padding: 20px 24px;
  margin-bottom: 18px;
}

.block__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.block__hint {
  font-size: 12px;
  color: var(--ink-400);
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
}

.state__icon {
  font-size: 34px;
}

.state__icon--info {
  color: var(--brand-500);
}

.state__icon--danger {
  color: var(--danger);
}

.state__title {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 700;
}

.state__desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--ink-500);
}

.state__bar {
  width: 100%;
  max-width: 420px;
  margin-top: 18px;
}

.state__action {
  margin-top: 16px;
}

@media (max-width: 720px) {
  .detail__head {
    flex-direction: column;
  }
}

.preview-loading {
  padding: 60px 0;
  text-align: center;
  color: var(--ink-500);
  font-size: 15px;
}
</style>

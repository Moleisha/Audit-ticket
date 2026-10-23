<template>
  <div class="page">
    <div class="page__intro rise">
      <h1 class="page__title">任务管理</h1>
      <p class="page__desc">
        上传经销商订单信息与发票五要素，平台把任务与数据提交风险规则引擎，分析结果自动回显，可预览结果、下载文件或重启任务。
      </p>
    </div>

    <NewTaskPanel class="rise" style="animation-delay: 0.06s" />

    <section class="surface history rise" style="animation-delay: 0.12s">
      <div class="history__head">
        <div>
          <div class="section-title">历史任务</div>
          <div class="section-sub">
            共 {{ state.tasks.length }} 条任务
            <template v-if="hasKeyword">，关键词命中 {{ filteredTasks.length }} 条</template>
          </div>
        </div>
        <div class="history__tools">
          <span v-if="state.autoRefresh" class="auto-tag">
            <a-icon type="sync" spin /> 自动刷新中
          </span>
          <SearchBox v-model="state.keyword" placeholder="搜索发起人 / 时间 / 状态 / 风险结论 / 文件名" />
          <a-tooltip title="刷新列表">
            <a-button class="history__reload" shape="circle" icon="reload" @click="refresh" />
          </a-tooltip>
        </div>
      </div>

      <div v-if="state.error" class="alert">
        <a-icon type="exclamation-circle" /> {{ state.error }}
      </div>

      <TaskTable
        :tasks="filteredTasks"
        :loading="state.loading"
        @preview="onPreview"
        @download="onDownload"
        @restart="onRestart"
      />
    </section>
  </div>
</template>

<script>
import NewTaskPanel from '../components/NewTaskPanel.vue'
import TaskTable from '../components/TaskTable.vue'
import SearchBox from '../components/SearchBox.vue'
import { useTasks } from '../composables/useTasks'
import { downloadByUrl, resultFileUrl } from '../api/tasks'

export default {
  name: 'TaskManager',
  components: { NewTaskPanel, TaskTable, SearchBox },
  setup() {
    const { state, filteredTasks, load, refresh, restart, stopPolling, hasRunning } = useTasks()
    return { state, filteredTasks, load, refresh, restart, stopPolling, hasRunning }
  },
  data() {
    return { restartingId: '' }
  },
  computed: {
    hasKeyword() {
      return Boolean((this.state.keyword || '').trim())
    }
  },
  created() {
    this.load()
  },
  beforeDestroy() {
    this.stopPolling()
  },
  methods: {
    onPreview(task) {
      this.$router.push({ name: 'task-detail', params: { id: task.id } })
    },
    onDownload(task) {
      const table = task.result && task.result.table
      const hasRows = table && table.rows && table.rows.length
      const hasFile = task.result && task.result.resultFile
      if (!hasRows && !hasFile) {
        this.$message.warning('该任务没有可下载的结果文件')
        return
      }
      downloadByUrl(resultFileUrl(task.id))
      this.$message.success('已开始下载分析结果')
    },
    onRestart(task) {
      const self = this
      this.$confirm({
        title: '重启任务',
        content: `将重新提交「${task.id}」的源文件至算法服务，并覆盖现有结果，是否继续？`,
        okText: '重启',
        cancelText: '取消',
        onOk() {
          return self.doRestart(task.id)
        }
      })
    },
    async doRestart(id) {
      this.restartingId = id
      try {
        await this.restart(id)
        this.$message.success('任务已重新提交，正在等待算法服务返回')
      } catch (error) {
        this.$message.error(error.message)
      } finally {
        this.restartingId = ''
      }
    }
  }
}
</script>

<style scoped>
.page__intro {
  margin-bottom: 20px;
}

.page__title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--ink-900);
}

.page__desc {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-500);
}

.history {
  padding: 22px 24px 20px;
}

.history__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
}

.history__tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.auto-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--brand-600);
  background: var(--brand-50);
}

.alert {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--danger);
  background: rgba(229, 72, 77, 0.08);
  border: 1px solid rgba(229, 72, 77, 0.16);
}

@media (max-width: 720px) {
  .history__head {
    flex-direction: column;
  }

  .history__tools {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>

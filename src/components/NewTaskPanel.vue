<template>
  <section class="surface new-task">
    <a-row :gutter="28">
      <a-col :xs="24" :lg="9">
        <div class="intro">
          <div class="intro__badge">新建任务</div>
          <h2 class="intro__title">上传两类 Excel，交由风险规则引擎分析</h2>
          <ul class="steps">
            <li v-for="(step, index) in steps" :key="step">
              <span class="steps__index num">{{ index + 1 }}</span>
              <span>{{ step }}</span>
            </li>
          </ul>
          <div class="templates">
            <span class="templates__label">没有文件？先下载模板</span>
            <div class="templates__links">
              <a-button type="link" size="small" @click="downloadTemplate('order')">
                <a-icon type="download" /> 订单信息模板
              </a-button>
              <a-button type="link" size="small" @click="downloadTemplate('invoice')">
                <a-icon type="download" /> 发票五要素模板
              </a-button>
            </div>
          </div>
        </div>
      </a-col>

      <a-col :xs="24" :lg="15">
        <div class="uploads">
          <a-row :gutter="16">
            <a-col :xs="24" :md="12">
              <FileDropSlot
                title="经销商订单信息"
                desc="需包含订单号、经销商、订单日期、订单金额"
                :file="orderFile"
                :disabled="submitting"
                @select="onSelect('order', $event)"
                @clear="orderFile = null"
                @preview="previewFile(orderFile)"
              />
            </a-col>
            <a-col :xs="24" :md="12">
              <FileDropSlot
                title="发票五要素"
                desc="需包含发票代码、发票号码、开票日期、金额、购买方"
                :file="invoiceFile"
                :disabled="submitting"
                @select="onSelect('invoice', $event)"
                @clear="invoiceFile = null"
                @preview="previewFile(invoiceFile)"
              />
            </a-col>
          </a-row>

          <div class="actions">
            <a-button
              type="primary"
              size="large"
              :loading="submitting"
              :disabled="submitting"
              @click="start"
            >
              <a-icon v-if="!submitting" type="thunderbolt" /> 开始分析
            </a-button>
          </div>
        </div>
      </a-col>
    </a-row>

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
        <a-icon type="loading" spin /> 正在读取 Excel 内容...
      </div>
      <ResultTable v-else :columns="previewData.columns" :rows="previewData.rows" />
    </a-modal>
  </section>
</template>

<script>
import FileDropSlot from './FileDropSlot.vue'
import ResultTable from './ResultTable.vue'
import { useTasks } from '../composables/useTasks'
import { useCurrentUser } from '../composables/useCurrentUser'
import { templateUrl, downloadByUrl } from '../api/tasks'
import { parseExcel } from '../utils/excelParser'

const MAX_SIZE = 20 * 1024 * 1024
const ALLOWED = /\.(xlsx|xls)$/i

export default {
  name: 'NewTaskPanel',
  components: { FileDropSlot, ResultTable },
  setup() {
    const { submit } = useTasks()
    const { currentUser } = useCurrentUser()
    return { submit, currentUser }
  },
  data() {
    return {
      orderFile: null,
      invoiceFile: null,
      submitting: false,
      previewVisible: false,
      previewLoading: false,
      previewingName: '',
      previewData: { columns: [], rows: [] },
      steps: [
        '上传经销商订单信息与发票五要素两类文件',
        '点击开始分析，平台将文件提交至算法服务',
        '分析完成后在历史任务中预览、下载或重启任务'
      ]
    }
  },
  methods: {
    onSelect(kind, file) {
      const message = this.validate(file)
      if (message) {
        this.$message.error(message)
        return
      }
      if (kind === 'order') this.orderFile = file
      else this.invoiceFile = file
    },
    validate(file) {
      if (!ALLOWED.test(file.name)) return `「${file.name}」格式不支持，请上传 .xlsx 或 .xls 文件`
      if (file.size > MAX_SIZE) return `「${file.name}」超过 20MB，请拆分后再上传`
      return ''
    },
    downloadTemplate(kind) {
      downloadByUrl(templateUrl(kind))
    },
    async previewFile(file) {
      if (!file) return
      this.previewingName = file.name
      this.previewVisible = true
      this.previewLoading = true
      try {
        const data = await parseExcel(file)
        this.previewData = data
      } catch (error) {
        this.$message.error(error.message)
        this.previewVisible = false
      } finally {
        this.previewLoading = false
      }
    },
    async start() {
      if (!this.orderFile) {
        this.$message.warning('请先上传经销商订单信息文件')
        return
      }
      if (!this.invoiceFile) {
        this.$message.warning('请先上传发票五要素文件')
        return
      }
      this.submitting = true
      try {
        await this.submit({
          orderFile: this.orderFile,
          invoiceFile: this.invoiceFile,
          creator: this.currentUser.name
        })
        this.orderFile = null
        this.invoiceFile = null
        this.$message.success('任务已提交，分析完成后将在历史任务中自动刷新')
      } catch (error) {
        this.$message.error(error.message)
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.new-task {
  padding: 24px;
  margin-bottom: 20px;
}

.intro__badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--brand-600);
  background: var(--brand-50);
}

.intro__title {
  margin-top: 10px;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.intro__desc {
  margin-top: 8px;
  font-size: 13px;
  color: var(--ink-500);
}

.steps {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.steps li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-700);
}

.steps__index {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  color: var(--brand-600);
  background: var(--brand-50);
}

.templates {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}

.templates__label {
  font-size: 12px;
  color: var(--ink-400);
}

.templates__links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 4px;
}

.uploads {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px dashed var(--line);
}

@media (max-width: 992px) {
  .uploads {
    margin-top: 22px;
  }
}

@media (max-width: 560px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}

.preview-loading {
  padding: 60px 0;
  text-align: center;
  color: var(--ink-500);
  font-size: 15px;
}
</style>

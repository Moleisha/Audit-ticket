import { formatDateTime, formatFileSize } from './format'

/** 任务状态元信息：文案 + 语义色 */
export const STATUS_META = {
  running: { text: '进行中', tone: 'info' },
  done: { text: '已完成', tone: 'success' },
  failed: { text: '失败', tone: 'danger' }
}

export const TONE_CLASS = {
  danger: 'tone-danger',
  warning: 'tone-warning',
  info: 'tone-info',
  success: 'tone-success',
  neutral: 'tone-neutral'
}

export function statusMeta(status) {
  return STATUS_META[status] || { text: status || '未知', tone: 'neutral' }
}

export function riskText(hasRisk) {
  if (hasRisk === true) return '发现风险'
  if (hasRisk === false) return '未发现风险'
  return '—'
}

export function riskTone(hasRisk) {
  if (hasRisk === true) return 'danger'
  if (hasRisk === false) return 'success'
  return 'neutral'
}

/**
 * 根据字段值推断语义色，用于算法返回的等级列（如「高风险」「中风险」「低风险」「无风险」）
 */
export function toneOfValue(value) {
  const text = String(value == null ? '' : value).trim()
  if (!text) return 'neutral'
  if (/^(高|高风险|严重|重大|high|critical)$/i.test(text) || text.includes('高')) return 'danger'
  if (/^(中|中风险|中等|medium|middle)$/i.test(text) || text.includes('中')) return 'warning'
  if (/^(低|低风险|轻微|low)$/i.test(text) || text.includes('低')) return 'info'
  if (/^(无|无风险|正常|通过|成功|是|none|ok|pass)$/i.test(text)) return 'success'
  return 'neutral'
}

export function canPreview(task) {
  return Boolean(task && task.status === 'done' && task.result)
}

export function canDownload(task) {
  return Boolean(task && task.status === 'done' && task.result)
}

/** 关键词检索：覆盖表格所有可见字段 */
export function searchBlob(task) {
  if (!task) return ''
  const status = statusMeta(task.status)
  const parts = [
    task.id,
    task.creator,
    task.startedAt,
    formatDateTime(task.startedAt),
    status.text,
    riskText(task.hasRisk),
    task.error,
    task.files && task.files.order && task.files.order.name,
    task.files && task.files.invoice && task.files.invoice.name,
    task.files && task.files.order && formatFileSize(task.files.order.size),
    task.files && task.files.invoice && formatFileSize(task.files.invoice.size),
    task.engine && task.engine.mode,
    task.engine && `${task.engine.durationMs}`
  ]
  const summary = task.result && task.result.table && task.result.table.summary
  if (Array.isArray(summary)) {
    summary.forEach((item) => {
      parts.push(item.label, String(item.value))
    })
  }
  return parts.filter(Boolean).join(' ').toLowerCase()
}

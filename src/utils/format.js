/** 通用格式化工具，统一页面上的时间、金额、文件体积展示口径 */

function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`
}

export function formatDate(value) {
  return formatDateTime(value).slice(0, 10)
}

export function formatRelative(value) {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  if (Number.isNaN(diff)) return ''
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)} 天前`
  return formatDate(value)
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

export function formatFileSize(bytes) {
  const size = Number(bytes)
  if (!size || size < 0 || Number.isNaN(size)) return '0 KB'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function formatDuration(ms) {
  const value = Number(ms)
  if (!value || Number.isNaN(value)) return '—'
  if (value < 1000) return `${value} ms`
  if (value < 60000) return `${(value / 1000).toFixed(1)} s`
  return `${(value / 60000).toFixed(1)} min`
}

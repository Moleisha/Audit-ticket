import axios from 'axios'
import { config } from '../config.js'

function authHeaders() {
  return config.algorithmApiKey ? { Authorization: `Bearer ${config.algorithmApiKey}` } : {}
}

function toBlobPart(file) {
  return new Blob([file.buffer])
}

/**
 * 归一化算法服务返回的 data 字段，屏蔽算法侧字段命名差异。
 */
function normalize(data) {
  const payload = data || {}
  const columns = Array.isArray(payload.columns) ? payload.columns : []
  const rows = Array.isArray(payload.rows) ? payload.rows : []
  const summary = Array.isArray(payload.summary) ? payload.summary : []

  let hasRisk = payload.hasRisk
  if (typeof hasRisk !== 'boolean') {
    hasRisk = rows.some((row) => {
      const level = String(row.level ?? row.riskLevel ?? '')
      return level.includes('高') || level.includes('中') || level.includes('低')
    })
  }

  let resultFile = null
  if (payload.resultFile && payload.resultFile.contentBase64) {
    resultFile = {
      name: payload.resultFile.name || '算法分析结果.xlsx',
      contentBase64: payload.resultFile.contentBase64
    }
  }

  return { hasRisk, summary, columns, rows, resultFile }
}

/**
 * HTTP 算法客户端：把任务与源文件转发至风险规则引擎，回收结构化结果。
 */
export const httpClient = {
  mode: 'http',

  async health() {
    if (!config.algorithmHealthUrl) {
      return { reachable: false, detail: '未配置 ALGORITHM_API_URL，无法探测算法服务' }
    }
    try {
      const res = await axios.get(config.algorithmHealthUrl, { timeout: 5000, headers: authHeaders() })
      return { reachable: res.status >= 200 && res.status < 300, detail: `算法服务响应 ${res.status}` }
    } catch (error) {
      return { reachable: false, detail: `算法服务不可达：${error.message}` }
    }
  },

  async analyze({ taskId, creator, orderFile, invoiceFile }) {
    if (!config.algorithmApiUrl) {
      throw new Error('未配置 ALGORITHM_API_URL，无法提交至算法服务')
    }

    const form = new FormData()
    form.append('taskId', taskId)
    form.append('creator', creator || '')
    form.append('orderFile', toBlobPart(orderFile), orderFile.name)
    form.append('invoiceFile', toBlobPart(invoiceFile), invoiceFile.name)

    let response
    try {
      response = await axios.post(config.algorithmApiUrl, form, {
        timeout: config.algorithmTimeout,
        headers: authHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      })
    } catch (error) {
      const detail = error.response && error.response.data
      const message = (detail && (detail.message || detail.error)) || error.message
      throw new Error(`调用算法服务失败：${message}`)
    }

    const body = response.data || {}
    if (body.code !== undefined && body.code !== 0) {
      throw new Error(body.message || `算法服务返回错误码 ${body.code}`)
    }

    return normalize(body.data || body)
  }
}

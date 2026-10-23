import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

function resolveStorageDir() {
  const raw = process.env.STORAGE_DIR
  if (!raw) return path.join(here, 'storage')
  return path.isAbsolute(raw) ? raw : path.join(here, raw)
}

function deriveHealthUrl(analyzeUrl) {
  if (!analyzeUrl) return ''
  if (process.env.ALGORITHM_HEALTH_URL) return process.env.ALGORITHM_HEALTH_URL
  return analyzeUrl.replace(/\/analyze\/?$/, '/health')
}

const algorithmApiUrl = process.env.ALGORITHM_API_URL || ''

export const config = {
  port: Number(process.env.PORT || 8787),
  storageDir: resolveStorageDir(),
  /** mock：使用内置示例结果跑通全流程；http：转发到真实算法服务 */
  algorithmMode: (process.env.ALGORITHM_MODE || 'mock').toLowerCase(),
  algorithmApiUrl,
  algorithmHealthUrl: deriveHealthUrl(algorithmApiUrl),
  algorithmApiKey: process.env.ALGORITHM_API_KEY || '',
  algorithmTimeout: Number(process.env.ALGORITHM_TIMEOUT || 180000),
  /** Mock 模式模拟算法耗时，便于观察「进行中」状态与进度条 */
  mockDelayMs: Number(process.env.MOCK_DELAY_MS || 4500),
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 20 * 1024 * 1024)
}

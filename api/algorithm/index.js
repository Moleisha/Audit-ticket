import { config } from '../config.js'
import { mockClient } from './mockClient.js'
import { httpClient } from './httpClient.js'

/**
 * AlgorithmClient 工厂：算法服务契约确定后，只需设置 ALGORITHM_MODE=http
 * 与 ALGORITHM_API_URL，平台侧代码无需改动。
 */
export function getAlgorithmClient() {
  return config.algorithmMode === 'http' ? httpClient : mockClient
}

export async function algorithmHealth() {
  const client = getAlgorithmClient()
  try {
    const info = await client.health()
    return { mode: client.mode, reachable: Boolean(info.reachable), detail: info.detail || '' }
  } catch (error) {
    return { mode: client.mode, reachable: false, detail: error.message }
  }
}

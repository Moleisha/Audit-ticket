import { getAlgorithmClient } from '../algorithm/index.js'
import * as store from '../store/taskStore.js'
import * as fileStore from '../store/fileStore.js'
import { buildResultWorkbook, workbookToBuffer } from '../utils/exportExcel.js'

const PROGRESS_TICK_MS = 900
const tickers = new Map()

/** 对外 DTO：剥离内部存储路径等实现细节 */
function toPublic(task) {
  if (!task) return null
  const files = task.files || {}
  return {
    id: task.id,
    creator: task.creator,
    startedAt: task.startedAt,
    createdAt: task.createdAt,
    finishedAt: task.finishedAt || null,
    status: task.status,
    progress: task.progress || 0,
    hasRisk: typeof task.hasRisk === 'boolean' ? task.hasRisk : null,
    error: task.error || '',
    runCount: task.runCount || 1,
    files: {
      order: { name: files.order ? files.order.name : '', size: files.order ? files.order.size : 0 },
      invoice: { name: files.invoice ? files.invoice.name : '', size: files.invoice ? files.invoice.size : 0 }
    },
    engine: { mode: task.engine ? task.engine.mode : 'mock', durationMs: task.engine ? task.engine.durationMs : 0 },
    result: task.result
      ? {
          table: {
            summary: task.result.table.summary || [],
            columns: task.result.table.columns || [],
            rows: task.result.table.rows || []
          },
          resultFile: task.result.resultFile
            ? { name: task.result.resultFile.name, size: task.result.resultFile.size }
            : null
        }
      : null
  }
}

function startProgressTicker(id) {
  stopProgressTicker(id)
  const timer = setInterval(async () => {
    const task = await store.getTask(id)
    if (!task || task.status !== 'running') {
      stopProgressTicker(id)
      return
    }
    const step = 3 + Math.floor(Math.random() * 9)
    const next = Math.min(92, (task.progress || 0) + step)
    if (next !== task.progress) await store.updateTask(id, { progress: next })
  }, PROGRESS_TICK_MS)
  tickers.set(id, timer)
}

function stopProgressTicker(id) {
  const timer = tickers.get(id)
  if (timer) {
    clearInterval(timer)
    tickers.delete(id)
  }
}

async function materializeResultFile(taskId, output, columns, rows, summary) {
  if (output.resultFile && output.resultFile.contentBase64) {
    const buffer = Buffer.from(output.resultFile.contentBase64, 'base64')
    return fileStore.saveResultBuffer(taskId, output.resultFile.name, buffer)
  }
  const book = buildResultWorkbook({ summary, columns, rows })
  const buffer = workbookToBuffer(book)
  return fileStore.saveResultBuffer(taskId, `${taskId}-风险分析结果.xlsx`, buffer)
}

/** 提交任务至算法服务并回收结果，全程异步，不阻塞接口响应 */
async function runAnalysis(id) {
  const task = await store.getTask(id)
  if (!task) return

  const client = getAlgorithmClient()
  const startedAt = Date.now()
  startProgressTicker(id)

  try {
    const [orderBuffer, invoiceBuffer] = await Promise.all([
      fileStore.readUpload(task.files.order.storedName),
      fileStore.readUpload(task.files.invoice.storedName)
    ])

    const output = await client.analyze({
      taskId: id,
      creator: task.creator,
      orderFile: { buffer: orderBuffer, name: task.files.order.name, size: task.files.order.size },
      invoiceFile: { buffer: invoiceBuffer, name: task.files.invoice.name, size: task.files.invoice.size }
    })

    const columns = Array.isArray(output.columns) ? output.columns : []
    const rows = Array.isArray(output.rows) ? output.rows : []
    const summary = Array.isArray(output.summary) ? output.summary : []

    const resultFile = await materializeResultFile(id, output, columns, rows, summary)

    await store.updateTask(id, {
      status: 'done',
      progress: 100,
      hasRisk: Boolean(output.hasRisk),
      error: '',
      finishedAt: new Date().toISOString(),
      engine: { mode: client.mode, durationMs: Date.now() - startedAt },
      result: { table: { summary, columns, rows }, resultFile }
    })
  } catch (error) {
    await store.updateTask(id, {
      status: 'failed',
      progress: 100,
      error: error.message || '算法服务调用失败',
      finishedAt: new Date().toISOString(),
      engine: { mode: client.mode, durationMs: Date.now() - startedAt }
    })
  } finally {
    stopProgressTicker(id)
  }
}

export async function listTasks() {
  const all = await store.listTasks()
  return all.map(toPublic)
}

export async function getTask(id) {
  return toPublic(await store.getTask(id))
}

export async function createTask({ creator, orderFile, invoiceFile }) {
  const id = await store.nextId()
  const now = new Date().toISOString()

  const [order, invoice] = await Promise.all([
    fileStore.saveUpload(orderFile, 'order'),
    fileStore.saveUpload(invoiceFile, 'invoice')
  ])

  const record = {
    id,
    creator: creator || '匿名用户',
    status: 'running',
    progress: 5,
    hasRisk: null,
    error: '',
    runCount: 1,
    createdAt: now,
    startedAt: now,
    finishedAt: null,
    files: {
      order: { name: order.originalName, size: order.size, storedName: order.storedName },
      invoice: { name: invoice.originalName, size: invoice.size, storedName: invoice.storedName }
    },
    engine: { mode: getAlgorithmClient().mode, durationMs: 0 },
    result: null
  }

  await store.createTask(record)
  void runAnalysis(id)

  return toPublic(record)
}

export async function restartTask(id) {
  const task = await store.getTask(id)
  if (!task) return null

  const updated = await store.updateTask(id, {
    status: 'running',
    progress: 5,
    hasRisk: null,
    error: '',
    finishedAt: null,
    runCount: (task.runCount || 1) + 1,
    startedAt: new Date().toISOString(),
    engine: { mode: getAlgorithmClient().mode, durationMs: 0 },
    result: null
  })

  void runAnalysis(id)
  return toPublic(updated)
}

/** 下载结果文件；算法未直接提供文件时，按结果表格实时生成 */
export async function resolveResultFile(id) {
  const task = await store.getTask(id)
  if (!task) return { status: 404, message: '任务不存在' }
  if (task.status !== 'done' || !task.result) return { status: 409, message: '该任务尚未生成分析结果' }

  const meta = task.result.resultFile
  if (meta && meta.storedName) {
    return { status: 200, path: fileStore.resultPath(meta.storedName), name: meta.name }
  }

  const { summary, columns, rows } = task.result.table
  const book = buildResultWorkbook({ summary, columns, rows })
  const buffer = workbookToBuffer(book)
  const saved = await fileStore.saveResultBuffer(id, `${id}-风险分析结果.xlsx`, buffer)
  await store.updateTask(id, {
    result: { ...task.result, resultFile: { name: saved.name, size: saved.size, storedName: saved.storedName } }
  })
  return { status: 200, path: fileStore.resultPath(saved.storedName), name: saved.name }
}

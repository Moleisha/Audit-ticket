import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'

/**
 * 本期使用 JSON 文件落盘，接口与数据库访问层保持一致，后续可平滑替换为 DB。
 */
const file = () => path.join(config.storageDir, 'tasks.json')

let tasks = null
let writeChain = Promise.resolve()

async function load() {
  if (tasks) return tasks
  try {
    const raw = await fs.readFile(file(), 'utf8')
    const parsed = JSON.parse(raw)
    tasks = Array.isArray(parsed) ? parsed : []
  } catch {
    tasks = []
  }
  return tasks
}

function persist() {
  const snapshot = JSON.stringify(tasks, null, 2)
  writeChain = writeChain
    .then(async () => {
      await fs.mkdir(config.storageDir, { recursive: true })
      await fs.writeFile(file(), snapshot, 'utf8')
    })
    .catch(() => {})
  return writeChain
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
}

function formatId(prefix, seq) {
  return `${prefix}${String(seq).padStart(4, '0')}`
}

export async function nextId() {
  const all = await load()
  const prefix = `TASK-${dateKey()}-`
  let seq = all.filter((item) => item.id.startsWith(prefix)).length + 1
  let id = formatId(prefix, seq)
  while (all.some((item) => item.id === id)) {
    seq += 1
    id = formatId(prefix, seq)
  }
  return id
}

/** 按任务启动时间倒序返回（最新在前） */
export async function listTasks() {
  const all = await load()
  return [...all].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))
}

export async function getTask(id) {
  const all = await load()
  return all.find((item) => item.id === id) || null
}

export async function createTask(record) {
  const all = await load()
  all.push(record)
  await persist()
  return record
}

export async function updateTask(id, patch) {
  const all = await load()
  const index = all.findIndex((item) => item.id === id)
  if (index === -1) return null
  all[index] = { ...all[index], ...patch }
  await persist()
  return all[index]
}

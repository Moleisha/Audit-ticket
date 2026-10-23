import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'

const FILES_DIR = () => path.join(config.storageDir, 'files')
const RESULTS_DIR = () => path.join(config.storageDir, 'results')

export async function ensureDirs() {
  await fs.mkdir(FILES_DIR(), { recursive: true })
  await fs.mkdir(RESULTS_DIR(), { recursive: true })
}

/**
 * multer/busboy 可能以 latin1 解析文件名导致中文乱码，此处做一次兜底还原
 */
export function fixFileName(name) {
  if (!name) return 'file'
  if (!/[\u0080-\u00ff]/.test(name)) return name
  const fixed = Buffer.from(name, 'latin1').toString('utf8')
  return fixed.includes('\uFFFD') ? name : fixed
}

function safeName(name) {
  return String(name || 'file').replace(/[\\/:*?"<>|]/g, '_').trim() || 'file'
}

export async function saveUpload(file, prefix) {
  await ensureDirs()
  const originalName = fixFileName(file.originalname)
  const storedName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName(originalName)}`
  await fs.writeFile(path.join(FILES_DIR(), storedName), file.buffer)
  return { storedName, originalName, size: file.buffer.length }
}

export async function readUpload(storedName) {
  return fs.readFile(path.join(FILES_DIR(), storedName))
}

export async function saveResultBuffer(taskId, fileName, buffer) {
  await ensureDirs()
  const storedName = `${taskId}__${safeName(fileName)}`
  await fs.writeFile(path.join(RESULTS_DIR(), storedName), buffer)
  return { storedName, name: fileName, size: buffer.length }
}

export function resultPath(storedName) {
  return path.join(RESULTS_DIR(), storedName)
}

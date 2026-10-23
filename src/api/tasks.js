import axios from 'axios'

const http = axios.create({ baseURL: '/api', timeout: 300000 })

/** 统一提取后端错误信息，便于页面直接展示 */
function fail(error) {
  const data = error && error.response && error.response.data
  const message = (data && (data.message || data.error)) || error.message || '请求失败'
  const wrapped = new Error(message)
  wrapped.status = error && error.response && error.response.status
  return wrapped
}

export function listTasks() {
  return http
    .get('/tasks')
    .then((res) => res.data)
    .catch((error) => Promise.reject(fail(error)))
}

export function getTask(id) {
  return http
    .get(`/tasks/${id}`)
    .then((res) => res.data)
    .catch((error) => Promise.reject(fail(error)))
}

export function createTask({ orderFile, invoiceFile, creator }) {
  const form = new FormData()
  form.append('orderFile', orderFile)
  form.append('invoiceFile', invoiceFile)
  form.append('creator', creator || '')
  return http
    .post('/tasks', form)
    .then((res) => res.data)
    .catch((error) => Promise.reject(fail(error)))
}

export function restartTask(id) {
  return http
    .post(`/tasks/${id}/restart`)
    .then((res) => res.data)
    .catch((error) => Promise.reject(fail(error)))
}

export function getHealth() {
  return http
    .get('/health')
    .then((res) => res.data)
    .catch((error) => Promise.reject(fail(error)))
}

/** 结果文件与模板走浏览器直连下载，避免大文件经过内存中转 */
export function resultFileUrl(id) {
  return `/api/tasks/${id}/result-file`
}

export function templateUrl(kind) {
  return `/api/templates/${kind}`
}

export function downloadByUrl(url) {
  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

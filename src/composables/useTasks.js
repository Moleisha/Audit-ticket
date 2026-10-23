import { computed, reactive } from 'vue'
import * as api from '../api/tasks'
import { searchBlob } from '../utils/taskMeta'

const POLL_INTERVAL = 3000

const state = reactive({
  tasks: [],
  loading: false,
  loaded: false,
  error: '',
  keyword: '',
  autoRefresh: false
})

let timer = null

const hasRunning = computed(() => state.tasks.some((task) => task.status === 'running'))

const stats = computed(() => ({
  total: state.tasks.length,
  risk: state.tasks.filter((task) => task.status === 'done' && task.hasRisk === true).length,
  running: state.tasks.filter((task) => task.status === 'running').length
}))

const filteredTasks = computed(() => {
  const keyword = (state.keyword || '').trim().toLowerCase()
  if (!keyword) return state.tasks
  return state.tasks.filter((task) => searchBlob(task).includes(keyword))
})

function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  state.autoRefresh = false
}

function syncPolling() {
  if (hasRunning.value) {
    if (!timer) {
      timer = setInterval(() => {
        if (hasRunning.value) refresh()
        else stopPolling()
      }, POLL_INTERVAL)
    }
    state.autoRefresh = true
  } else {
    stopPolling()
  }
}

async function load() {
  state.loading = true
  state.error = ''
  try {
    state.tasks = await api.listTasks()
    state.loaded = true
    syncPolling()
  } catch (error) {
    state.error = error.message
  } finally {
    state.loading = false
  }
}

/** 轮询用的静默刷新：失败时保留旧数据，只记录错误 */
async function refresh() {
  try {
    state.tasks = await api.listTasks()
    syncPolling()
  } catch (error) {
    state.error = error.message
  }
}

async function submit({ orderFile, invoiceFile, creator }) {
  const task = await api.createTask({ orderFile, invoiceFile, creator })
  replaceTask(task)
  syncPolling()
  return task
}

async function restart(id) {
  const task = await api.restartTask(id)
  replaceTask(task)
  syncPolling()
  return task
}

function replaceTask(task) {
  const exists = state.tasks.some((item) => item.id === task.id)
  if (exists) state.tasks = state.tasks.map((item) => (item.id === task.id ? task : item))
  else state.tasks = [task, ...state.tasks]
}

export function useTasks() {
  return {
    state,
    stats,
    filteredTasks,
    hasRunning,
    load,
    refresh,
    submit,
    restart,
    replaceTask,
    stopPolling
  }
}

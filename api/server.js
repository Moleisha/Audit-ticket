import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { config } from './config.js'
import tasksRouter from './routes/tasks.js'
import { ensureDirs } from './store/fileStore.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

// 简易请求日志，便于联调算法服务时排查
app.use((req, res, next) => {
  const startedAt = Date.now()
  res.on('finish', () => {
    console.log(`[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`)
  })
  next()
})

app.use('/api', tasksRouter)

app.use((req, res) => {
  res.status(404).json({ message: `接口不存在：${req.method} ${req.originalUrl}` })
})

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? '单个文件不得超过 20MB，请拆分后再上传' : `文件上传失败：${error.message}`
    res.status(400).json({ message })
    return
  }
  console.error('[api] 未处理异常：', error)
  res.status(error.status || 500).json({ message: error.message || '服务内部错误' })
})

async function bootstrap() {
  await ensureDirs()
  app.listen(config.port, () => {
    console.log(`[api] 任务服务已启动：http://localhost:${config.port}/api`)
    console.log(`[api] 算法对接模式：${config.algorithmMode}${config.algorithmMode === 'http' ? ` → ${config.algorithmApiUrl || '(未配置 ALGORITHM_API_URL)'}` : ''}`)
    console.log(`[api] 存储目录：${config.storageDir}`)
  })
}

bootstrap()

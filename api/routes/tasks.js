import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import * as taskService from '../services/taskService.js'
import { algorithmHealth } from '../algorithm/index.js'
import { buildTemplate } from '../utils/exportExcel.js'

const ALLOWED_EXT = /\.(xlsx|xls)$/i

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize, files: 2 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_EXT.test(file.originalname || '')) {
      const error = new Error(`「${file.originalname}」格式不支持，请上传 .xlsx 或 .xls 文件`)
      error.status = 400
      cb(error)
      return
    }
    cb(null, true)
  }
})

const uploadFields = upload.fields([
  { name: 'orderFile', maxCount: 1 },
  { name: 'invoiceFile', maxCount: 1 }
])

const router = Router()

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

/** 算法服务连接状态，供前端头部指示灯展示 */
router.get(
  '/health',
  asyncRoute(async (req, res) => {
    const health = await algorithmHealth()
    res.json({
      code: 0,
      status: 'ok',
      algorithmMode: health.mode,
      algorithmReachable: health.reachable,
      algorithmDetail: health.detail,
      uptime: Math.round(process.uptime()),
      now: new Date().toISOString()
    })
  })
)

/** 历史任务列表（最新在前） */
router.get(
  '/tasks',
  asyncRoute(async (req, res) => {
    res.json(await taskService.listTasks())
  })
)

/** 任务详情 */
router.get(
  '/tasks/:id',
  asyncRoute(async (req, res) => {
    const task = await taskService.getTask(req.params.id)
    if (!task) {
      res.status(404).json({ message: `任务不存在：${req.params.id}` })
      return
    }
    res.json(task)
  })
)

/** 新建任务：上传经销商订单信息 + 发票五要素，立即返回「进行中」任务 */
router.post(
  '/tasks',
  (req, res, next) => {
    uploadFields(req, res, (error) => {
      if (error) {
        next(error)
        return
      }
      next()
    })
  },
  asyncRoute(async (req, res) => {
    const files = req.files || {}
    const orderFile = files.orderFile && files.orderFile[0]
    const invoiceFile = files.invoiceFile && files.invoiceFile[0]

    if (!orderFile || !invoiceFile) {
      res.status(400).json({ message: '请同时上传「经销商订单信息」与「发票五要素」两类文件' })
      return
    }

    const task = await taskService.createTask({
      creator: req.body && req.body.creator,
      orderFile,
      invoiceFile
    })
    res.status(201).json(task)
  })
)

/** 重启任务：重新提交源文件至算法服务 */
router.post(
  '/tasks/:id/restart',
  asyncRoute(async (req, res) => {
    const task = await taskService.restartTask(req.params.id)
    if (!task) {
      res.status(404).json({ message: `任务不存在：${req.params.id}` })
      return
    }
    res.json(task)
  })
)

/** 下载算法返回的结果文件 */
router.get(
  '/tasks/:id/result-file',
  asyncRoute(async (req, res) => {
    const file = await taskService.resolveResultFile(req.params.id)
    if (file.status !== 200) {
      res.status(file.status).json({ message: file.message })
      return
    }
    res.download(file.path, file.name, (error) => {
      if (error && !res.headersSent) res.status(500).json({ message: `结果文件读取失败：${error.message}` })
    })
  })
)

/** 下载上传模板 */
router.get('/templates/:kind', (req, res) => {
  const template = buildTemplate(req.params.kind)
  if (!template) {
    res.status(404).json({ message: `模板不存在：${req.params.kind}` })
    return
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(template.fileName)}`)
  res.end(template.buffer)
})

export default router

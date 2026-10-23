import { config } from '../config.js'

/**
 * 算法适配层契约（AlgorithmClient）
 *
 * analyze({ taskId, creator, orderFile, invoiceFile })
 *   orderFile / invoiceFile: { buffer: Buffer, name: string, size: number }
 *   返回 {
 *     hasRisk: boolean,
 *     summary: [{ label, value, tone? }],
 *     columns: [{ key, title, type: 'text'|'number'|'enum'|'date', width? }],
 *     rows:    [{ [key]: value }],
 *     resultFile: null | { name, contentBase64 }
 *   }
 *
 * health() 返回 { reachable: boolean, detail: string }
 */

const DEALERS = [
  '华东商贸有限公司',
  '北方电器有限公司',
  '南方日化集团',
  '西部粮油贸易有限公司',
  '中原五金机电有限公司',
  '东海数码科技有限公司',
  '川渝食品有限公司',
  '江南医药连锁有限公司'
]

const RISK_POOL = [
  { level: '高风险', riskType: '金额不一致', desc: '发票金额高于订单金额，差异超出 5% 容差阈值', ratio: 0.12 },
  { level: '高风险', riskType: '发票缺失', desc: '订单已确认但未匹配到对应的发票记录', ratio: 1 },
  { level: '中风险', riskType: '金额不一致', desc: '发票金额低于订单金额，差异处于容差边界', ratio: 0.03 },
  { level: '中风险', riskType: '日期异常', desc: '开票日期早于订单日期，存在时间倒挂', ratio: 0 },
  { level: '低风险', riskType: '购买方不一致', desc: '发票购买方与订单经销商名称存在字符差异，需人工确认', ratio: 0 },
  { level: '无风险', riskType: '通过', desc: '订单与发票五要素比对一致', ratio: 0 }
]

export const COLUMNS = [
  { key: 'index', title: '序号', type: 'number', width: 64 },
  { key: 'orderNo', title: '订单编号', type: 'text', width: 140 },
  { key: 'dealer', title: '经销商', type: 'text', width: 200 },
  { key: 'invoiceNo', title: '发票号码', type: 'text', width: 130 },
  { key: 'level', title: '风险等级', type: 'enum', width: 110 },
  { key: 'riskType', title: '风险类型', type: 'text', width: 130 },
  { key: 'desc', title: '风险说明', type: 'text', width: 360 },
  { key: 'diff', title: '差异金额（元）', type: 'number', width: 130 }
]

function hashSeed(text) {
  let hash = 2166136261
  for (const char of String(text)) {
    hash ^= char.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function makeRandom(seed) {
  let state = seed || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function money(value) {
  return Math.round(value * 100) / 100
}

/**
 * Mock 算法客户端：按 taskId 生成稳定可复现的示例结果，
 * 用于在算法服务契约确定前跑通「提交 → 分析 → 回显 → 下载」全流程。
 */
export const mockClient = {
  mode: 'mock',

  async health() {
    return { reachable: true, detail: '内置 Mock 结果，未配置外部算法服务' }
  },

  async analyze({ taskId, orderFile, invoiceFile }) {
    await new Promise((resolve) => setTimeout(resolve, config.mockDelayMs))

    const seed = hashSeed(`${taskId}|${orderFile.name}|${invoiceFile.name}`)
    const random = makeRandom(seed)
    const total = 12 + Math.floor(random() * 7)

    const rows = []
    let riskyCount = 0
    let highCount = 0
    let diffTotal = 0

    for (let i = 0; i < total; i += 1) {
      const risk = RISK_POOL[Math.floor(random() * RISK_POOL.length)]
      const amount = money(20000 + random() * 180000)
      const isRisky = risk.level !== '无风险'
      if (isRisky) riskyCount += 1
      if (risk.level === '高风险') highCount += 1

      const diff = risk.ratio ? money(amount * risk.ratio) : 0
      diffTotal += diff

      rows.push({
        index: i + 1,
        orderNo: `SO-2026-${1001 + i}`,
        dealer: DEALERS[Math.floor(random() * DEALERS.length)],
        invoiceNo: `2045${1800 + Math.floor(random() * 400)}`,
        level: risk.level,
        riskType: risk.riskType,
        desc: risk.desc,
        diff
      })
    }

    const hasRisk = riskyCount > 0

    return {
      hasRisk,
      summary: [
        { label: '参与比对订单数', value: total, tone: 'info' },
        { label: '命中风险单据数', value: riskyCount, tone: hasRisk ? 'danger' : 'success' },
        { label: '高风险单据数', value: highCount, tone: 'danger' },
        { label: '差异金额合计（元）', value: money(diffTotal), tone: 'warning' },
        { label: '分析结论', value: hasRisk ? '发现风险' : '未发现风险', tone: hasRisk ? 'danger' : 'success' }
      ],
      columns: COLUMNS,
      rows,
      resultFile: null
    }
  }
}

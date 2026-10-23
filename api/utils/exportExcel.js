import XLSX from 'xlsx'

const TEMPLATES = {
  order: {
    fileName: '经销商订单信息-模板.xlsx',
    sheetName: '经销商订单信息',
    header: ['订单编号', '经销商', '订单日期', '订单金额（元）', '商品名称', '数量'],
    rows: [
      ['SO-2026-1001', '华东商贸有限公司', '2026-01-08', 128000, '商用净水器 A3', 40],
      ['SO-2026-1002', '北方电器有限公司', '2026-01-11', 96500.5, '厨房小家电套装', 120]
    ]
  },
  invoice: {
    fileName: '发票五要素-模板.xlsx',
    sheetName: '发票五要素',
    header: ['发票代码', '发票号码', '开票日期', '金额（元）', '购买方名称'],
    rows: [
      ['044001900111', '20451876', '2026-01-09', 128000, '华东商贸有限公司'],
      ['044001900111', '20451877', '2026-01-12', 96000, '北方电器有限公司']
    ]
  }
}

export function templateMeta(kind) {
  return TEMPLATES[kind] || null
}

export function buildTemplate(kind) {
  const meta = TEMPLATES[kind]
  if (!meta) return null
  const sheet = XLSX.utils.aoa_to_sheet([meta.header, ...meta.rows])
  sheet['!cols'] = meta.header.map((text) => ({ wch: Math.max(14, text.length * 2 + 6) }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, meta.sheetName)
  return { fileName: meta.fileName, buffer: XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) }
}

function columnWidth(column) {
  const title = String(column.title || column.key || '')
  const px = Number(column.width)
  if (px > 0) return Math.min(60, Math.max(10, Math.round(px / 8)))
  return Math.min(48, Math.max(12, title.length * 2 + 8))
}

/**
 * 把算法返回的结构化结果（columns/rows/summary）导出为 xlsx，
 * 用于算法服务未直接提供结果文件时的兜底。
 */
export function buildResultWorkbook({ summary = [], columns = [], rows = [] }) {
  const book = XLSX.utils.book_new()

  if (columns.length) {
    const header = columns.map((column) => column.title || column.key)
    const body = rows.map((row) => columns.map((column) => {
      const value = row[column.key]
      return value === null || value === undefined ? '' : value
    }))
    const sheet = XLSX.utils.aoa_to_sheet([header, ...body])
    sheet['!cols'] = columns.map(columnWidth)
    XLSX.utils.book_append_sheet(book, sheet, '风险明细')
  }

  if (summary.length) {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['分析指标', '数值'],
      ...summary.map((item) => [item.label, item.value])
    ])
    sheet['!cols'] = [{ wch: 24 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(book, sheet, '分析概览')
  }

  if (!book.SheetNames.length) {
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['暂无分析结果']]), '分析概览')
  }

  return book
}

export function workbookToBuffer(book) {
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' })
}

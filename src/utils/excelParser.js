import * as XLSX from 'xlsx'

/**
 * 将 Excel 文件对象或 ArrayBuffer 解析为 ResultTable 组件所需的格式
 * @param {File | ArrayBuffer} data
 * @returns {Promise<{ columns: Array, rows: Array }>}
 */
export async function parseExcel(data) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const bstr = e.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })

        // 默认解析第一个 Sheet
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]

        // 转换为 JSON (header: 1 表示返回二维数组)
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 })

        if (!jsonData || jsonData.length === 0) {
          resolve({ columns: [], rows: [] })
          return
        }

        // 第一行作为表头
        const headerRow = jsonData[0]
        const columns = headerRow.map((cell, index) => ({
          key: `col_${index}`,
          title: String(cell || `列 ${index + 1}`),
          type: typeof jsonData[1]?.[index] === 'number' ? 'number' : 'text',
          width: 150
        }))

        // 后续行作为数据
        const rows = jsonData.slice(1).map((row) => {
          const rowData = {}
          columns.forEach((col, index) => {
            rowData[col.key] = row[index]
          })
          return rowData
        })

        resolve({ columns, rows })
      } catch (error) {
        reject(new Error(`Excel 解析失败: ${error.message}`))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))

    if (data instanceof ArrayBuffer) {
      const blob = new Blob([data])
      reader.readAsBinaryString(blob)
    } else {
      reader.readAsBinaryString(data)
    }
  })
}

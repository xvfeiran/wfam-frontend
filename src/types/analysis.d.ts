// 分析时长数据
interface AnalysisDurationData {
  bu: BU
  totalHours: number
}

// 抽样比例数据
interface SamplingRatioData {
  bu: BU
  ratio: number // 0-100 百分比
}

// 售后件柱状图数据（分析模块用收件日期筛选）
interface ReturnOrderData {
  month: string // '2025-01' 格式
  count: number
  receiptDate: string // 收件日期
}

// API 参数
interface AnalysisDurationParams {
  year: number
}

interface SamplingRatioParams {
  year: number
}

interface ReturnOrderParams {
  dateRange: [string, string] | null
  customer: string[] | null
  bu: string[] | null
  productPlatform: string[] | null
  faultMode: string[] | null
  partNo: string[] | null
  bcso: string[] | null
}

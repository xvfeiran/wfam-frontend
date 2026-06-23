// 矩形树图数据
interface ReturnTreemapData {
  bu: string
  customerName: string
  customerId: string
  count: number
}

// 售后件柱状图数据（质量模块用生产日期筛选）
interface ReturnBarData {
  month: string
  count: number
}

// PPM/IPB 折线图数据
interface PpmTrendData {
  mis1: string
  mis3: string
  mis6: string
  mis12: string
  mis24: string
  mis36: string
  mis48: string
  mis60: string
  month: string // '2025-01' 格式
}

// API 参数
interface ReturnBarParams {
  dateRange: [string, string] | null
  customer: string[] | null
  bu: string[] | null
  productPlatform: string[] | null
  faultMode: string[] | null
  partNo: string[] | null
  bcso: string[] | null
  kilometerRange: KilometerRange[] | null
}

interface PpmTrendParams {
  bu?: string[] | null
  dateRange: [string, string] | null
  productPlatform: string[] | null
  customer: string[] | null
  faultMode: string[] | null
  partNo: string[] | null
  bcso: string[] | null
}

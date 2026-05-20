// 售后件总数数据
 interface ReturnQuantityData {
  currentYearCount: number
  previousYearCount: number
  updateDate: string
}

// 矩形树图数据
interface ReturnTreemapData {
  bu: BU
  customer: string
  count: number
}

// 售后件柱状图数据（质量模块用生产日期筛选）
interface ReturnBarData {
  month: string
  count: number
  productionDate: string // 生产日期
}

// PPM/IPB 折线图数据
interface PpmTrendData {
  bu: BU
  mis: MisPeriod
  month: string // '2025-01' 格式
  ppm: number
  ipb: number
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
  bu?: string | null
  dateRange: [string, string] | null
  platform: string[] | null
  customer: string[] | null
  faultMode: string[] | null
  partNo: string[] | null
  bcso: string[] | null
  mis: MisPeriod[] | null
}

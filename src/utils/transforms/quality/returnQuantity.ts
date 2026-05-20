
export interface ReturnQuantityCardData {
  currentCount: number
  previousCount: number
  trendValue: number // YoY 百分比
  updateDate: string
}

/**
 * 转换售后件总数数据为卡片格式
 */
export function transformReturnQuantity(data: ReturnQuantityData): ReturnQuantityCardData {
  const trendValue = data.previousYearCount > 0
    ? Math.round(((data.currentYearCount - data.previousYearCount) / data.previousYearCount) * 100)
    : 0

  return {
    currentCount: data.currentYearCount,
    previousCount: data.previousYearCount,
    trendValue,
    updateDate: data.updateDate
  }
}

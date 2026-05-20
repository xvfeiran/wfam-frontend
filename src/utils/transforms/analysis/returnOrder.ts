export interface ReturnOrderTransformResult {
  xAxisData: string[]
  series: ChartSeries[]
  ytdValue: number
  previousYearSeries?: ChartSeries
}

/**
 * 转换售后件柱状图数据，支持 YTD 和 YoY
 * @param data 当前年份数据
 * @param previousYearData 去年数据（可选）
 * @param currentYear 当前年份（用于 YTD 列命名）
 */
export function transformReturnOrder(
  data: ReturnOrderData[],
  previousYearData?: ReturnOrderData[],
  currentYear: number = new Date().getFullYear(),
): ReturnOrderTransformResult {
  // 按月份排序
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month))
  const xAxisData = sortedData.map((d) => d.month)

  const series: ChartSeries = {
    name: '选中时间数据',
    type: 'bar',
    data: sortedData.map((d) => ({ name: d.month, value: d.count })),
  }
  const currentYtdData = getYTDData(sortedData, 'count')
  series.data.push({ name: 'YTD', value: currentYtdData })
  // 计算 YTD（1月至当前月份累计）
  const currentMonth = new Date().getMonth() + 1 // 1-12
  const ytdValue = sortedData
    .filter((_, idx) => idx < currentMonth)
    .reduce((sum, d) => sum + d.count, 0)

  // YoY 去年数据
  let previousYearSeries: ChartSeries | undefined
  if (previousYearData && previousYearData.length > 0) {
    const sortedPrev = [...previousYearData].sort((a, b) => a.month.localeCompare(b.month))
    previousYearSeries = {
      name: '同比数据',
      type: 'bar',
      data: sortedPrev.map((d) => ({ name: d.month, value: d.count })),
    }

    const previousYtdData = getYTDData(sortedPrev, 'count')
    previousYearSeries.data.push({ name: 'YTD', value: previousYtdData })
  }

  return { xAxisData, series: [series], ytdValue, previousYearSeries }
}

/**
 * 由原有月份的数据生成YTD累计数据
 *
 * @template T
 * @param {T[]} dataList
 * @param {keyof T} vKey
 * @param {boolean} [isAverage=true]
 * @returns {*}
 */
function getYTDData<T>(dataList: T[], vKey: keyof T, isAverage = true) {
  if (!dataList || dataList.length === 0) return 0

  const sum = dataList.reduce((pValue, cValue) => {
    const val = (cValue[vKey] as unknown as number) || 0
    return pValue + val
  }, 0)

  return isAverage ? (sum / dataList.length).toFixed(0) : sum
}

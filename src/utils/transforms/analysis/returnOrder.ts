const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

export interface ReturnOrderTransformResult {
  xAxisData: string[]
  series: ChartSeries[]
  ytdValue: number
  previousYearSeries?: ChartSeries
}

/**
 * 转换售后件柱状图数据，X 轴固定 12 个月，缺失月份不显示
 * @param data 当前年份数据
 * @param previousYearData 去年数据（可选）
 * @param currentYear 当前年份（用于系列命名与 YTD）
 */
export function transformReturnOrder(
  data: ReturnOrderData[],
  previousYearData?: ReturnOrderData[],
  currentYear: number = new Date().getFullYear(),
): ReturnOrderTransformResult {
  const prevYear = currentYear - 1

  const currentMap = new Map<string, number>()
  data.forEach((d) => {
    const month = d.month.slice(5, 7)
    currentMap.set(month, d.count)
  })

  const currentSeries: ChartSeries = {
    name: `${currentYear}年`,
    type: 'bar',
    data: MONTHS.map((m) => ({
      name: `${m}月`,
      value: currentMap.get(m),
    })),
    // 柱状图标签使用月份简化显示
  }

  let previousYearSeries: ChartSeries | undefined
  if (previousYearData && previousYearData.length > 0) {
    const prevMap = new Map<string, number>()
    previousYearData.forEach((d) => {
      const month = d.month.slice(5, 7)
      prevMap.set(month, d.count)
    })

    previousYearSeries = {
      name: `${prevYear}年`,
      type: 'bar',
      data: MONTHS.map((m) => ({
        name: `${m}月`,
        value: prevMap.get(m),
      })),
      itemStyle: { color: '#93c5fd' },
    }
  }

  // YTD = 平均值
  let ytdValue = 0
  const isCurrentYear = currentYear === new Date().getFullYear()
  if (isCurrentYear) {
    const currentMonth = new Date().getMonth() + 1
    const ytdSum = MONTHS
      .slice(0, currentMonth)
      .reduce((sum, m) => sum + (currentMap.get(m) ?? 0), 0)
    ytdValue = Math.round(ytdSum / currentMonth)
  } else {
    const fullSum = data.reduce((sum, d) => sum + d.count, 0)
    const monthCount = data.length || 12
    ytdValue = Math.round(fullSum / monthCount)
  }
  currentSeries.data.push({ name: 'YTD', value: ytdValue })

  if (previousYearSeries) {
    const prevSum = (previousYearData ?? []).reduce((sum, d) => sum + d.count, 0)
    const prevMonthCount = (previousYearData ?? []).length || 12
    previousYearSeries.data.push({ name: 'YTD', value: Math.round(prevSum / prevMonthCount) })
  }

  const xAxisData = [...MONTHS.map((m) => `${m}月`), 'YTD']

  return { xAxisData, series: [currentSeries], ytdValue, previousYearSeries }
}

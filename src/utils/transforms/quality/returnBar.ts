export interface ReturnBarTransformResult {
  xAxisData: string[]
  series: ChartSeries[]
}

/**
 * 转换售后件柱状图数据（质量模块）
 */
export function transformReturnBar(data: ReturnBarData[]): ReturnBarTransformResult {
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month))
  const xAxisData = sortedData.map(d => d.month)

  const series: ChartSeries = {
    name: '售后件数量',
    type: 'bar',
    data: sortedData.map(d => ({ name: d.month, value: d.count }))
  }

  return { xAxisData, series: [series] }
}

import { MIS_PERIODS } from '@/constants/reports'

/**
 * 转换单个 BU 的 PPM/IPB 折线图数据
 */
export function transformPpmTrendSingle(
  data: PpmTrendData[],
  metricType: 'ppm' | 'ipb' = 'ppm'
) {
  // 获取所有月份并排序
  const monthSet = new Set<string>()
  data.forEach(d => monthSet.add(d.month))
  const xAxisData = [...monthSet].sort()

  // 按 MIS 分组
  const series: ChartSeries[] = []

  for (const mis of MIS_PERIODS) {
    const filteredData = data.filter(d => d.mis === mis)
    const sortedData = filteredData.sort((a, b) => a.month.localeCompare(b.month))

    if (sortedData.length > 0) {
      series.push({
        name: mis,
        type: 'line',
        data: sortedData.map(d => ({
          name: d.month,
          value: metricType === 'ppm' ? d.ppm : d.ipb
        }))
      })
    }
  }

  return { series, xAxisData }
}

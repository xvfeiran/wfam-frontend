import { MIS_PERIODS } from '@/constants/reports'

const MIS_KEYS = MIS_PERIODS.map((m) => m.toLowerCase()) as (keyof PpmTrendData)[]

/**
 * 转换单个 BU 的 PPM/IPB 折线图数据
 * 接口返回 PPM 值（string，带3位小数），前端据此计算 PPM 和 IPB
 */
export function transformPpmTrendSingle(
  data: PpmTrendData[],
  metricType: 'ppm' | 'ipb' = 'ppm',
) {
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month))
  const xAxisData = sortedData.map((d) => d.month)

  const series: ChartSeries[] = []

  for (let i = 0; i < MIS_PERIODS.length; i++) {
    const mis = MIS_PERIODS[i]
    const key = MIS_KEYS[i]

    const hasData = sortedData.some((d) => {
      const val = d[key]
      return val != null && val !== ''
    })

    if (hasData) {
      series.push({
        name: mis,
        type: 'line',
        data: sortedData.map((d) => {
          const ppmValue = parseFloat(d[key]) || 0
          // PPM: 取整展示；IPB = PPM × 1000
          const value = metricType === 'ppm' ? Math.round(ppmValue) : ppmValue * 1000
          return { name: d.month, value }
        }),
      })
    }
  }

  return { series, xAxisData }
}

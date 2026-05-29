export interface AnalysisDurationTransformResult {
  xAxisData: string[]
  series: ChartSeries[]
  ytdValue: number
}

/**
 * 转换分析时长数据为 ECharts 柱状图格式
 */
export function transformAnalysisDuration(
  data: AnalysisDurationData[],
): AnalysisDurationTransformResult {
  const dataMap = new Map(data.map((d) => [d.bu, d.avgDays]))
  const xAxisData = [...new Set(data.map((d) => d.bu))]
  const ytdValue = data.reduce((sum, d) => sum + d.avgDays, 0)

  const series: ChartSeries = {
    name: '分析时长',
    type: 'bar',
    data: xAxisData.map((bu) => ({
      name: bu,
      value: dataMap.get(bu) ?? 0,
    })),
  }

  return { xAxisData, series: [series], ytdValue }
}

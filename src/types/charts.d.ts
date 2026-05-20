interface ChartDimension {
  key: string
  label: string
}

interface ChartDataItem {
  name: string
  value: number
  [key: string]: unknown
}

interface ChartSeries {
  name: string
  data: ChartDataItem[]
  type: 'bar' | 'line' | 'pie'
  itemStyle?: Record<string, unknown>
  stack?: string
  barWidth?: string | number
  [key: string]: unknown
}

interface YtdData {
  currentYear: { name: string; value: number }[]
  previousYear: { name: string; value: number }[]
}

import { BU_LIST } from '@/constants/reports'

export interface TreemapNode {
  name: string
  value: number
  children?: TreemapNode[]
}

/**
 * 转换矩形树图数据为 ECharts 层级格式（BU → 客户）
 */
export function transformReturnTreemap(data: ReturnTreemapData[]): TreemapNode[] {
  const buMap = new Map<BU, ReturnTreemapData[]>()

  for (const bu of BU_LIST) {
    buMap.set(bu, [])
  }

  data.forEach((item) => {
    const list = buMap.get(item.bu)
    if (list) {
      list.push(item)
    }
  })

  return BU_LIST.map((bu) => {
    const items = buMap.get(bu) || []
    return {
      name: bu,
      value: items.reduce((sum, d) => sum + d.count, 0),
      children: items.map((item) => ({
        name: item.customer,
        value: item.count,
      })),
    }
  }).filter((node) => node.value > 0)
}

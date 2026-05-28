export interface TreemapNode {
  name: string
  value: number
  children?: TreemapNode[]
}

/**
 * 转换矩形树图数据为 ECharts 层级格式（BU → 客户）
 */
export function transformReturnTreemap(data: ReturnTreemapData[]): TreemapNode[] {
  const buMap = new Map<string, ReturnTreemapData[]>()

  data.forEach((item) => {
    const list = buMap.get(item.bu)
    if (list) {
      list.push(item)
    } else {
      buMap.set(item.bu, [item])
    }
  })

  const buList = [...new Set(data.map((d) => d.bu))]

  return buList.map((bu) => {
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

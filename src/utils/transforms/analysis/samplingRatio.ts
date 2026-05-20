export interface SamplingRatioCardData {
  bu: BU
  ratio: number
}

/**
 * 转换抽样比例数据为卡片格式
 */
export function transformSamplingRatio(data: SamplingRatioData[]): SamplingRatioCardData[] {
  return data.map((item) => ({
    bu: item.bu,
    ratio: item.ratio,
  }))
}

import request from './request'

export const qualityApi = {
  /** 获取售后件总数 */
  async getReturnQuantity(year: string) {
    const res = await request.get<number>('/stat/quality/return-quantity', { baseURL: import.meta.env.VITE_REPORT_API_URL, params: { year } })
    return res.data
  },

  /** 获取矩形树图数据 */
  async getReturnTreemap() {
    const res = await request.get<ReturnTreemapData[]>('/stat/quality/return-treemap', { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  },

  /** 获取售后件柱状图数据（生产日期筛选） */
  async getReturnBarData(params: ReturnBarParams) {
    const body = filterNullParams(params as unknown as Record<string, unknown>)
    const res = await request.post<ReturnBarData[]>('/stat/quality/return-bar', body, { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  },

  /** 获取PPM/IPB折线图数据 */
  async getPpmTrend(params: PpmTrendParams) {
    const body = filterNullParams(params as unknown as Record<string, unknown>)
    const res = await request.post<PpmTrendData[]>('/stat/quality/ppm-trend', body, { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  }
}

function filterNullParams(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v == null || v === '') return false
      if (Array.isArray(v) && v.length === 0) return false
      return true
    }),
  )
}

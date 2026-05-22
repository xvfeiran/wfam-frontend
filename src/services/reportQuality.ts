import request from './request'

export const qualityApi = {
  /** 获取售后件总数 */
  async getReturnQuantity() {
    const res = await request.get<ReturnQuantityData>('/api/quality/return-quantity', { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  },

  /** 获取矩形树图数据 */
  async getReturnTreemap() {
    const res = await request.get<ReturnTreemapData[]>('/api/quality/return-treemap', { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  },

  /** 获取售后件柱状图数据（生产日期筛选） */
  async getReturnBarData(params: ReturnBarParams) {
    const res = await request.get<ReturnBarData[]>('/api/quality/return-bar', { baseURL: import.meta.env.VITE_REPORT_API_URL, params: params as unknown as Record<string, unknown> })
    return res.data
  },

  /** 获取PPM/IPB折线图数据 */
  async getPpmTrend(params: PpmTrendParams) {
    const res = await request.get<PpmTrendData[]>('/api/quality/ppm-trend', { baseURL: import.meta.env.VITE_REPORT_API_URL, params: params as unknown as Record<string, unknown> })
    return res.data
  }
}

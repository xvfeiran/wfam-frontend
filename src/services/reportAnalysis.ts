import request from './request'


export const analysisApi = {
  /** 获取分析时长数据 */
  async getAnalysisDuration(params: AnalysisDurationParams) {
    const res = await request.get<AnalysisDurationData[]>('/api/analysis/duration', { baseURL: import.meta.env.VITE_REPORT_API_URL, params: params as unknown as Record<string, unknown> })
    return res.data
  },

  /** 获取抽样比例数据 */
  async getSamplingRatio(params: SamplingRatioParams) {
    const res = await request.get<SamplingRatioData[]>('/api/analysis/sampling-ratio', { baseURL: import.meta.env.VITE_REPORT_API_URL, params: params as unknown as Record<string, unknown> })
    return res.data
  },

  /** 获取售后件柱状图数据（收件日期筛选） */
  async getReturnOrderData(params: ReturnOrderParams) {
    const res = await request.get<ReturnOrderData[]>('/api/analysis/return-order', { baseURL: import.meta.env.VITE_REPORT_API_URL, params: params as unknown as Record<string, unknown> })
    return res.data
  }
}

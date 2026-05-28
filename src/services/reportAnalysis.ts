import request from './request'


export const analysisApi = {
  /** 获取分析时长数据 */
  async getAnalysisDuration(year: string|number) {
    const res = await request.get<AnalysisDurationData[]>(`/stat/analysis/duration/${year}`, { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  },

  /** 获取抽样比例数据 */
  async getSamplingRatio(year: string|number) {
    const res = await request.get<SamplingRatioData[]>(`/stat/analysis/sampling-ratio/${year}`, { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  },

  /** 获取售后件柱状图数据（收件日期筛选） */
  async getReturnOrderData(params: ReturnOrderParams) {
    const body = filterNullParams(params as unknown as Record<string, unknown>)
    const res = await request.post<ReturnOrderData[]>('/stat/analysis/return-order', body, { baseURL: import.meta.env.VITE_REPORT_API_URL })
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

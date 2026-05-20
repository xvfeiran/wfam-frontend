import request from './request'

export interface OptionItem {
  label: string
  value: string
}

export const optionsApi = {
  /** 获取客户列表 */
  async getCustomerOptions() {
    const res = await request.get<OptionItem[]>('/api/options/customers', { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  },

  /** 获取产品平台列表 */
  async getPlatformOptions() {
    const res = await request.get<OptionItem[]>('/api/options/platforms', { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  },

  /** 获取故障模式列表 */
  async getFaultModeOptions() {
    const res = await request.get<OptionItem[]>('/api/options/fault-modes', { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  },

  /** 获取零件号列表 */
  async getPartNoOptions() {
    const res = await request.get<OptionItem[]>('/api/options/part-nos', { baseURL: import.meta.env.VITE_REPORT_API_URL })
    return res.data
  }
}

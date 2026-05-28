import request from './request'

export interface OptionItem {
  label: string
  value: string
}

export const optionsApi = {
    /** 获取BU列表 */
  async getBuOptions() {
    const res = await request.get<OptionItem[]>('/api/options/bu')
    return res.data
  },

  /** 获取客户列表 */
  async getCustomerOptions() {
    const res = await request.get<OptionItem[]>('/api/options/customers')
    return res.data
  },

  /** 获取产品平台列表 */
  async getPlatformOptions() {
    const res = await request.get<OptionItem[]>('/api/options/platforms', )
    return res.data
  },

  /** 获取故障模式列表 */
  async getFaultModeOptions() {
    const res = await request.get<OptionItem[]>('/api/options/fault-modes')
    return res.data
  },

  /** 获取零件号列表 */
  async getPartNoOptions() {
    const res = await request.get<OptionItem[]>('/api/options/part-nos')
    return res.data
  }
}

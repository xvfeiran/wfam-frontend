import request from './request'

export interface AllOptionsData {
  customers: string[]
  businessUnits: string[]
  productPlatforms: string[]
  productCategories: string[]
  failureTypes: string[]
}

export interface PartNoItem {
  id: string
  partCode: string
  businessUnit: string
  productPlatform: string
}

export interface PartNoPageData {
  data: PartNoItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const BASE = import.meta.env.VITE_REPORT_OPTION_API_URL

export const optionsApi = {
  /** 获取除零件号外的所有下拉选项 */
  async getAllOptions() {
    const res = await request.get<AllOptionsData>('/lookups', { baseURL: BASE })
    return res
  },

  /** 获取零件号列表（分页），partCode 为空则返回前 size 条 */
  async getPartNoOptions(params: { page: number; size: number; partCode?: string }) {
    const { page, size, partCode } = params
    let url = `/part-codes/page?page=${page}&size=${size}`
    if (partCode) url += `&partCode=${encodeURIComponent(partCode)}`
    const res = await request.get<PartNoPageData>(url, { baseURL: BASE })
    return res
  },
}

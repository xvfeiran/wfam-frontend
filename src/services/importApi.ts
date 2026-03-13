import request from './request'
import type { ImportRecord } from '@/types'

export interface ImportListParams {
  type?: string
  page?: number
  pageSize?: number
}

export interface PageResult<T> {
  data: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

export const importApi = {
  importReturnOrders(file: File): Promise<ImportRecord> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/imports/return-orders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getById(id: string): Promise<ImportRecord> {
    return request.get(`/imports/${id}`)
  },

  list(params?: ImportListParams): Promise<PageResult<ImportRecord>> {
    const adaptedParams: any = params ? { ...params } : {}
    if (adaptedParams.page !== undefined) {
      adaptedParams.page = adaptedParams.page - 1
    }
    if (adaptedParams.pageSize !== undefined) {
      adaptedParams.size = adaptedParams.pageSize
      delete adaptedParams.pageSize
    }
    return request.get('/imports', { params: adaptedParams })
  },
}

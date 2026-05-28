import request from './request'
import type { AnalysisOrder } from '@/types'

export interface AnalysisOrderListParams {
  orderNumber?: string
  analyst?: string
  statuses?: string[]
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ascend' | 'descend'
}

export interface PageResult<T> {
  data: T[]
  total: number
}

export const analysisOrderApi = {
  list(params?: AnalysisOrderListParams): Promise<PageResult<AnalysisOrder>> {
    const adapted: any = params ? { ...params } : {}
    if (adapted.page !== undefined) {
      adapted.page = adapted.page - 1  // 1-based → 0-based
    }
    if (adapted.pageSize !== undefined) {
      adapted.size = adapted.pageSize
      delete adapted.pageSize
    }
    if (adapted.sortBy && adapted.sortOrder) {
      adapted.sort = `${adapted.sortBy},${adapted.sortOrder === 'ascend' ? 'asc' : 'desc'}`
      delete adapted.sortBy
      delete adapted.sortOrder
    }
    return request.get('/analysis-orders', { params: adapted }) as unknown as Promise<PageResult<AnalysisOrder>>
  },
  getById(id: string): Promise<AnalysisOrder> {
    return request.get(`/analysis-orders/${id}`) as unknown as Promise<AnalysisOrder>
  },
  sampling(id: string, data: { sampledPartIds: string[] }): Promise<AnalysisOrder> {
    return request.post(`/analysis-orders/${id}/sampling`, data) as unknown as Promise<AnalysisOrder>
  },
  scrap(id: string): Promise<AnalysisOrder> {
    return request.post(`/analysis-orders/${id}/scrap`) as unknown as Promise<AnalysisOrder>
  },
  workonConfirm(id: string): Promise<AnalysisOrder> {
    return request.post(`/analysis-orders/${id}/scrap/workon-confirm`) as unknown as Promise<AnalysisOrder>
  },
}

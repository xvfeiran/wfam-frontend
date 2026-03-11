import request from './request'
import type { ReturnOrder, Part } from '@/types'

export interface OrderListParams {
  orderNumber?: string
  customer?: string
  status?: string
  receiveDateStart?: string
  receiveDateEnd?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ascend' | 'descend'
}

export interface PageResult<T> {
  data: T[]
  total: number
}

export const returnOrderApi = {
  list(params?: OrderListParams): Promise<PageResult<ReturnOrder>> {
    // Convert pagination params for Spring Data (0-based page, 'size' instead of 'pageSize')
    const adaptedParams: any = params ? { ...params } : {}
    if (adaptedParams.page !== undefined) {
      adaptedParams.page = adaptedParams.page - 1 // Convert 1-based to 0-based
    }
    if (adaptedParams.pageSize !== undefined) {
      adaptedParams.size = adaptedParams.pageSize
      delete adaptedParams.pageSize
    }
    // Convert sortBy and sortOrder to Spring Data sort format: `field,direction`
    if (adaptedParams.sortBy && adaptedParams.sortOrder) {
      const direction = adaptedParams.sortOrder === 'ascend' ? 'asc' : 'desc'
      adaptedParams.sort = `${adaptedParams.sortBy},${direction}`
      delete adaptedParams.sortBy
      delete adaptedParams.sortOrder
    } else if (adaptedParams.sortBy) {
      // If only sortBy is provided, use default direction 'asc'
      adaptedParams.sort = `${adaptedParams.sortBy},asc`
      delete adaptedParams.sortBy
      if ('sortOrder' in adaptedParams) {
        delete adaptedParams.sortOrder
      }
    }
    return request.get('/return-orders', { params: adaptedParams }) as unknown as Promise<PageResult<ReturnOrder>>
  },
  getById(id: string): Promise<ReturnOrder> {
    return request.get(`/return-orders/${id}`) as unknown as Promise<ReturnOrder>
  },
  create(data: Partial<ReturnOrder>): Promise<ReturnOrder> {
    return request.post('/return-orders', data) as unknown as Promise<ReturnOrder>
  },
  update(id: string, data: Partial<ReturnOrder>): Promise<ReturnOrder> {
    return request.put(`/return-orders/${id}`, data) as unknown as Promise<ReturnOrder>
  },
  delete(id: string): Promise<void> {
    return request.delete(`/return-orders/${id}`) as unknown as Promise<void>
  },
  getParts(orderId: string): Promise<Part[]> {
    return request.get(`/return-orders/${orderId}/parts`) as unknown as Promise<Part[]>
  },
  submit(id: string): Promise<ReturnOrder> {
    return request.post(`/return-orders/${id}/submit`) as unknown as Promise<ReturnOrder>
  },
  sampling(orderId: string, data: { sampledPartIds: string[] }): Promise<ReturnOrder> {
    return request.post(`/return-orders/${orderId}/sampling`, data) as unknown as Promise<ReturnOrder>
  },
  scrap(id: string): Promise<ReturnOrder> {
    return request.post(`/return-orders/${id}/scrap`) as unknown as Promise<ReturnOrder>
  },
  workonConfirm(id: string): Promise<ReturnOrder> {
    return request.post(`/return-orders/${id}/scrap/workon-confirm`) as unknown as Promise<ReturnOrder>
  },
}

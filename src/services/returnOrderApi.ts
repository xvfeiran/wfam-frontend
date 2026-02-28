import request from './request'
import type { ReturnOrder, Part } from '@/types'

export interface OrderListParams {
  orderNumber?: string
  customer?: string
  status?: string
}

export const returnOrderApi = {
  list(params?: OrderListParams): Promise<ReturnOrder[]> {
    return request.get('/return-orders', { params }) as unknown as Promise<ReturnOrder[]>
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
  sample(orderId: string, data: { sampledPartIds: string[] }): Promise<void> {
    return request.post(`/return-orders/${orderId}/sample`, data) as unknown as Promise<void>
  },
  noSampling(orderId: string): Promise<void> {
    return request.post(`/return-orders/${orderId}/no-sampling`) as unknown as Promise<void>
  },
}

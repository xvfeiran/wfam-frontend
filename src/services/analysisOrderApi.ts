import request from './request'
import type { AnalysisOrder } from '@/types'

export const analysisOrderApi = {
  list(statuses?: string[]): Promise<AnalysisOrder[]> {
    return request.get('/analysis-orders', { params: { statuses } }) as unknown as Promise<AnalysisOrder[]>
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

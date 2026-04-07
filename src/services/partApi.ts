import request from './request'
import type { Part, AnalysisReport, ReportTemplate } from '@/types'

export interface PartListParams {
  orderNumber?: string
  partCode?: string
  businessUnit?: string
  productPlatform?: string
  status?: string
  qcCreated?: string
  analyst?: string
  page?: number
  size?: number
}

export interface PartListResponse {
  data: Part[]
  total: number
  page: number
  size: number
  totalPages: number
}

export const partApi = {
  list(params?: PartListParams): Promise<PartListResponse> {
    return request.get('/parts', { params }) as unknown as Promise<PartListResponse>
  },
  getById(id: string): Promise<Part> {
    return request.get(`/parts/${id}`) as unknown as Promise<Part>
  },
  create(data: Partial<Part>): Promise<Part> {
    return request.post('/parts', data) as unknown as Promise<Part>
  },
  update(id: string, data: Partial<Part>): Promise<Part> {
    return request.put(`/parts/${id}`, data) as unknown as Promise<Part>
  },
  delete(id: string): Promise<void> {
    return request.delete(`/parts/${id}`) as unknown as Promise<void>
  },
  getReports(partId: string): Promise<AnalysisReport[]> {
    return request.get(`/parts/${partId}/reports`) as unknown as Promise<AnalysisReport[]>
  },
  getMatchedTemplate(partId: string): Promise<ReportTemplate> {
    return request.get(`/parts/${partId}/templates`) as unknown as Promise<ReportTemplate>
  },
  updateQcNo(id: string, qcNo: string): Promise<Part> {
    return request.put(`/parts/${id}/qc-no`, { qcNo }) as unknown as Promise<Part>
  },
  submit(id: string): Promise<Part> {
    return request.post(`/parts/${id}/submit`) as unknown as Promise<Part>
  },
}

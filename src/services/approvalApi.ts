import request from './request'
import type { AnalysisApplication } from '@/types'

export interface PageResult<T> {
  data: T[]
  total: number
  page?: number
  size?: number
  totalPages?: number
}

export interface ApprovalListParams {
  page?: number
  pageSize?: number
  status?: string
}

export const approvalApi = {
  getMyApplications(params?: ApprovalListParams): Promise<PageResult<AnalysisApplication>> {
    return request.get('/approvals/my/analysis', { params: adaptPage(params) }) as unknown as Promise<PageResult<AnalysisApplication>>
  },
  getPendingApprovals(): Promise<AnalysisApplication[]> {
    return request.get('/approvals/pending/analysis') as unknown as Promise<AnalysisApplication[]>
  },
  getMyApprovals(params?: ApprovalListParams): Promise<PageResult<AnalysisApplication>> {
    return request.get('/approvals/my-approvals/analysis', { params: adaptPage(params) }) as unknown as Promise<PageResult<AnalysisApplication>>
  },
  approve(id: string): Promise<void> {
    return request.post(`/approvals/${id}/approve`) as unknown as Promise<void>
  },
  reject(id: string, reason: string): Promise<void> {
    return request.post(`/approvals/${id}/reject`, { reason }) as unknown as Promise<void>
  },
  withdraw(id: string): Promise<void> {
    return request.delete(`/approvals/${id}`) as unknown as Promise<void>
  },
}

/** 前端 1-based page → 后端 Spring Pageable 0-based page，并映射 pageSize→size */
function adaptPage(params?: ApprovalListParams): Record<string, any> {
  const p: Record<string, any> = params ? { ...params } : {}
  if (p.page !== undefined) {
    p.page = p.page - 1
  }
  if (p.pageSize !== undefined) {
    p.size = p.pageSize
    delete p.pageSize
  }
  return p
}

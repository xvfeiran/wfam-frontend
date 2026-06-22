import request from './request'
import type { AnalysisApplication } from '@/types'

export const approvalApi = {
  getMyApplications(): Promise<AnalysisApplication[]> {
    return request.get('/approvals/my/analysis') as unknown as Promise<AnalysisApplication[]>
  },
  getPendingApprovals(): Promise<AnalysisApplication[]> {
    return request.get('/approvals/pending/analysis') as unknown as Promise<AnalysisApplication[]>
  },
  getMyApprovals(): Promise<AnalysisApplication[]> {
    return request.get('/approvals/my-approvals/analysis') as unknown as Promise<AnalysisApplication[]>
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

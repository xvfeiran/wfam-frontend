import request from './request'
import type { ScrapApplication, AnalysisApplication } from '@/types'

export const approvalApi = {
  getMyScrapApplications(): Promise<ScrapApplication[]> {
    return request.get('/approvals/my/scrap') as unknown as Promise<ScrapApplication[]>
  },
  getMyAnalysisApplications(): Promise<AnalysisApplication[]> {
    return request.get('/approvals/my/analysis') as unknown as Promise<AnalysisApplication[]>
  },
  getPendingScrapApprovals(): Promise<ScrapApplication[]> {
    return request.get('/approvals/pending/scrap') as unknown as Promise<ScrapApplication[]>
  },
  getPendingAnalysisApprovals(): Promise<AnalysisApplication[]> {
    return request.get('/approvals/pending/analysis') as unknown as Promise<AnalysisApplication[]>
  },
  approve(id: string, type: 'scrap' | 'analysis'): Promise<void> {
    return request.post(`/approvals/${id}/approve`, { type }) as unknown as Promise<void>
  },
  reject(id: string, type: 'scrap' | 'analysis', reason: string): Promise<void> {
    return request.post(`/approvals/${id}/reject`, { type, reason }) as unknown as Promise<void>
  },
  withdraw(id: string): Promise<void> {
    return request.delete(`/approvals/${id}`) as unknown as Promise<void>
  },
}

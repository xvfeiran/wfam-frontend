import request from './request'
import type { ReportTemplate, AnalysisReport } from '@/types'

export interface ChartDataItem {
  name: string
  value: number
}

export interface ProcessingTimeItem {
  stage: string
  avgDays: number
}

export interface TrendDataPoint {
  date: string
  orders: number
  parts: number
}

export const reportsApi = {
  getTrend(days: number = 30): Promise<TrendDataPoint[]> {
    return request.get('/reports/trend', { params: { days } }) as unknown as Promise<TrendDataPoint[]>
  },
  getCustomerRanking(): Promise<ChartDataItem[]> {
    return request.get('/reports/customer-ranking') as unknown as Promise<ChartDataItem[]>
  },
  getFailureModeDistribution(): Promise<ChartDataItem[]> {
    return request.get('/reports/failure-mode-distribution') as unknown as Promise<ChartDataItem[]>
  },
  getBuDistribution(): Promise<ChartDataItem[]> {
    return request.get('/reports/bu-distribution') as unknown as Promise<ChartDataItem[]>
  },
  getProcessingTime(): Promise<ProcessingTimeItem[]> {
    return request.get('/reports/processing-time') as unknown as Promise<ProcessingTimeItem[]>
  },
  getTemplates(): Promise<ReportTemplate[]> {
    return request.get('/reports/templates') as unknown as Promise<ReportTemplate[]>
  },
  submitReport(data: Partial<AnalysisReport>): Promise<AnalysisReport> {
    return request.post('/reports/analysis', data) as unknown as Promise<AnalysisReport>
  },
}

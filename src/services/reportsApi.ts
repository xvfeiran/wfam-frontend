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
    return request.get('/report-templates/enabled') as unknown as Promise<ReportTemplate[]>
  },
  getAllTemplates(): Promise<ReportTemplate[]> {
    return request.get('/report-templates') as unknown as Promise<ReportTemplate[]>
  },
  uploadTemplate(formData: FormData): Promise<ReportTemplate> {
    return request.post('/report-templates/upload', formData) as unknown as Promise<ReportTemplate>
  },
  downloadTemplate(id: string): Promise<Blob> {
    return request.get(`/report-templates/${id}/download`, {
      responseType: 'blob'
    }) as unknown as Promise<Blob>
  },
  deleteTemplate(id: string): Promise<void> {
    return request.delete(`/report-templates/${id}`)
  },
  matchTemplate(productCategory: string, failureType?: string): Promise<ReportTemplate> {
    return request.get('/report-templates/match', {
      params: { productCategory, failureType }
    }) as unknown as Promise<ReportTemplate>
  },
  matchAllTemplates(productCategory: string, failureType?: string): Promise<ReportTemplate[]> {
    return request.get('/report-templates/match-all', {
      params: { productCategory, failureType }
    }) as unknown as Promise<ReportTemplate[]>
  },
  submitReport(data: Partial<AnalysisReport>): Promise<AnalysisReport> {
    return request.post('/analysis-reports', data) as unknown as Promise<AnalysisReport>
  },
  saveReport(data: Partial<AnalysisReport>): Promise<AnalysisReport> {
    return request.post('/analysis-reports', data) as unknown as Promise<AnalysisReport>
  },
  getReport(id: string): Promise<AnalysisReport> {
    return request.get(`/analysis-reports/${id}`) as unknown as Promise<AnalysisReport>
  },
  getReportsByPart(partId: string): Promise<AnalysisReport[]> {
    return request.get(`/analysis-reports/part/${partId}`) as unknown as Promise<AnalysisReport[]>
  },
  getLatestReportByPart(partId: string): Promise<AnalysisReport> {
    return request.get(`/analysis-reports/part/${partId}/latest`) as unknown as Promise<AnalysisReport>
  },
  exportReport(reportId: string): Promise<Blob> {
    return request.get(`/analysis-reports/${reportId}/export`, {
      responseType: 'blob'
    }) as unknown as Promise<Blob>
  },
}

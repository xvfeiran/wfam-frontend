import { useI18n } from 'vue-i18n'
import { ORDER_STATUS_MAP, PART_STATUS_MAP } from '@/types'

/**
 * Composable for getting translated status labels.
 */
export function useStatusLabels() {
  const { t } = useI18n()

  const statusI18nKeyMap: Record<string, string> = {
    draft: 'status.draft',
    submitted: 'status.submitted',
    received: 'status.received',
    in_progress: 'status.inProgress',
    closed: 'status.closed',
    in_initial_analysis: 'status.inInitialAnalysis',
    initial_analysis_completed: 'status.initialAnalysisCompleted',
    in_detailed_analysis: 'status.inDetailedAnalysis',
    analysis_report_submitted: 'status.analysisReportSubmitted',
    pending_approval: 'status.pendingApproval',
    analysis_completed: 'status.analysisCompleted',
    analysis_skipped: 'status.analysisSkipped',
    scrap_in_progress: 'status.scrapInProgress',
    scrapped: 'status.scrapped',
    pending_registration: 'status.pendingRegistration',
    pending_sampling: 'status.pendingSampling',
    sampling_completed: 'status.samplingCompleted',
    approved: 'status.approved',
    pending: 'status.pendingProcessing',
    analyzing: 'status.analyzing',
    analyzed: 'status.analyzed',
    pending_scrap: 'status.pendingScrap',
    completed: 'status.completed',
    registered: 'status.registered',
    pending_detailed_analysis: 'status.pendingDetailedAnalysis',
    workon_scrap_in_progress: 'status.scrapInProgress',
    workon_scrapped: 'status.scrapped',
  }

  const normalizeStatus = (status: string) => status.trim().toLowerCase()

  const getStatusLabel = (status: string) => {
    const normalizedStatus = normalizeStatus(status)
    const key = statusI18nKeyMap[normalizedStatus]
    return key ? t(key) : status
  }

  const getOrderStatusFilters = () =>
    Object.entries(ORDER_STATUS_MAP).map(([key]) => ({
      text: getStatusLabel(key),
      value: key,
    }))

  const getPartStatusFilters = () =>
    Object.entries(PART_STATUS_MAP).map(([key]) => ({
      text: getStatusLabel(key),
      value: key,
    }))

  return {
    normalizeStatus,
    getStatusLabel,
    getOrderStatusFilters,
    getPartStatusFilters,
  }
}

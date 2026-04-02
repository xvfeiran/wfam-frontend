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
    in_initial_analysis: 'status.inInitialAnalysis',
    in_detailed_analysis: 'status.inDetailedAnalysis',
    pending_approval: 'status.pendingApproval',
    analysis_completed: 'status.analysisCompleted',
    scrap_in_progress: 'status.scrapInProgress',
    scrapped: 'status.scrapped',
    pending_registration: 'status.pendingRegistration',
    pending_sampling: 'status.pendingSampling',
    sampling_completed: 'status.samplingCompleted',
    approved: 'status.approved',
    pending_scrap: 'status.pendingScrap',
    completed: 'status.completed',
    registered: 'status.registered',
    pending_detailed_analysis: 'status.pendingDetailedAnalysis',
  }

  const getStatusLabel = (status: string) => {
    const key = statusI18nKeyMap[status]
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
    getStatusLabel,
    getOrderStatusFilters,
    getPartStatusFilters,
  }
}

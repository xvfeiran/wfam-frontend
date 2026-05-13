import { useI18n } from 'vue-i18n'

/**
 * Single source of truth for all status → i18n key mappings.
 * Organized by entity type to avoid duplicate maps scattered across components.
 */
export function useStatusLabels() {
  const { t } = useI18n()

  const normalizeStatus = (status: string) => status.trim().toLowerCase()

  // --- Entity-specific i18n key maps ---

  // 退货单 (Return Order)
  const orderMap: Record<string, string> = {
    draft: 'status.draft',
    submitted: 'status.submitted',
    scrapped: 'status.scrapped',
  }

  // 退货件 (Part)
  const partMap: Record<string, string> = {
    in_initial_analysis: 'status.inInitialAnalysis',
    initial_analysis_completed: 'status.initialAnalysisCompleted',
    in_detailed_analysis: 'status.inDetailedAnalysis',
    analysis_report_submitted: 'status.analysisReportSubmitted',
    pending_approval: 'status.pendingApproval',
    analysis_completed: 'status.analysisCompleted',
    analysis_skipped: 'status.analysisSkipped',
    scrap_in_progress: 'status.scrapInProgress',
    scrapped: 'status.scrapped',
  }

  // 分析单 (Analysis Order) — different translations from part for shared statuses
  const analysisMap: Record<string, string> = {
    pending_sampling: 'analysisOrder.statusPendingSampling',
    in_detailed_analysis: 'analysisOrder.statusInDetailedAnalysis',
    pending_approval: 'analysisOrder.statusPendingApproval',
    analysis_completed: 'analysisOrder.statusAnalysisCompleted',
    workon_scrap_in_progress: 'analysisOrder.statusWorkonScrapInProgress',
    workon_scrapped: 'analysisOrder.statusWorkonScrapped',
  }

  // 审批 (Approval)
  const approvalMap: Record<string, string> = {
    pending: 'status.pending',
    approved: 'status.approved',
    rejected: 'status.rejected',
    withdrawn: 'status.withdrawn',
  }

  const lookup = (map: Record<string, string>, status: string) => {
    const key = map[normalizeStatus(status)]
    return key ? t(key) : status
  }

  // --- Public API ---

  const getOrderLabel = (status: string) => lookup(orderMap, status)
  const getPartLabel = (status: string) => lookup(partMap, status)
  const getAnalysisLabel = (status: string) => lookup(analysisMap, status)
  const getApprovalLabel = (status: string) => lookup(approvalMap, status)

  /** Generic lookup — tries order → part → approval (excludes analysis to avoid translation conflicts) */
  const getStatusLabel = (status: string) => {
    const normalized = normalizeStatus(status)
    const key = orderMap[normalized] || partMap[normalized] || approvalMap[normalized]
    return key ? t(key) : status
  }

  const getOrderStatusFilters = () =>
    Object.keys(orderMap).map((key) => ({
      text: getOrderLabel(key),
      value: key,
    }))

  const getPartStatusFilters = () =>
    Object.keys(partMap).map((key) => ({
      text: getPartLabel(key),
      value: key,
    }))

  return {
    normalizeStatus,
    getOrderLabel,
    getPartLabel,
    getAnalysisLabel,
    getApprovalLabel,
    getStatusLabel,
    getOrderStatusFilters,
    getPartStatusFilters,
  }
}

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useApprovalColumns() {
  const { t } = useI18n()

  const myScrapColumns = computed(() => [
    { title: t('returnOrder.orderNumber'), dataIndex: 'orderNumber', key: 'orderNumber' },
    { title: t('returnPart.partNumber'), dataIndex: 'partNumbers', key: 'partNumbers', ellipsis: true },
    { title: t('approval.quantity'), dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: t('approval.applyTime'), dataIndex: 'applyTime', key: 'applyTime' },
    { title: t('approval.applyReason'), dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: t('approval.approver'), dataIndex: 'approver', key: 'approver' },
    { title: t('common.status'), dataIndex: 'status', key: 'status', width: 100 },
    { title: t('common.operation'), key: 'action', width: 100 },
  ])

  const myAnalysisColumns = computed(() => [
    { title: t('approval.reportNumber'), dataIndex: 'reportNumber', key: 'reportNumber' },
    { title: t('returnPart.partNumber'), dataIndex: 'partNumber', key: 'partNumber' },
    { title: t('returnPart.productPlatform'), dataIndex: 'productPlatform', key: 'productPlatform' },
    { title: t('returnPart.failureType'), dataIndex: 'failureType', key: 'failureType' },
    { title: t('approval.submitTime'), dataIndex: 'submitTime', key: 'submitTime' },
    { title: t('approval.approver'), dataIndex: 'approver', key: 'approver' },
    { title: t('common.status'), dataIndex: 'status', key: 'status', width: 100 },
    { title: t('common.operation'), key: 'action', width: 120 },
  ])

  const approvalScrapColumns = computed(() => [
    { title: t('returnOrder.orderNumber'), dataIndex: 'orderNumber', key: 'orderNumber' },
    { title: t('returnPart.partNumber'), dataIndex: 'partNumbers', key: 'partNumbers', ellipsis: true },
    { title: t('approval.quantity'), dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: t('approval.applicant'), dataIndex: 'applicant', key: 'applicant' },
    { title: t('approval.applyTime'), dataIndex: 'applyTime', key: 'applyTime' },
    { title: t('approval.applyReason'), dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: t('common.status'), dataIndex: 'status', key: 'status', width: 100 },
    { title: t('common.operation'), key: 'action', width: 150 },
  ])

  const approvalAnalysisColumns = computed(() => [
    { title: t('approval.reportNumber'), dataIndex: 'reportNumber', key: 'reportNumber' },
    { title: t('returnPart.partNumber'), dataIndex: 'partNumber', key: 'partNumber' },
    { title: t('returnPart.productPlatform'), dataIndex: 'productPlatform', key: 'productPlatform' },
    { title: t('returnPart.failureType'), dataIndex: 'failureType', key: 'failureType' },
    { title: t('approval.submitter'), dataIndex: 'submitter', key: 'submitter' },
    { title: t('approval.submitTime'), dataIndex: 'submitTime', key: 'submitTime' },
    { title: t('approval.reportSummary'), dataIndex: 'summary', key: 'summary', ellipsis: true },
    { title: t('common.status'), dataIndex: 'status', key: 'status', width: 100 },
    { title: t('common.operation'), key: 'action', width: 100 },
  ])

  return { myScrapColumns, myAnalysisColumns, approvalScrapColumns, approvalAnalysisColumns }
}

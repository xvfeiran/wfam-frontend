import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserNameMap } from './useUserNameMap'

export function useApprovalColumns() {
  const { t } = useI18n()
  const { displayName: userDisplayName } = useUserNameMap()

  const myAnalysisColumns = computed(() => [
    { title: t('approval.reportNumber'), dataIndex: 'reportNumber', key: 'reportNumber' },
    { title: t('returnPart.partNumber'), dataIndex: 'partNumber', key: 'partNumber' },
    { title: t('returnPart.productPlatform'), dataIndex: 'productPlatform', key: 'productPlatform' },
    { title: t('approval.submitTime'), dataIndex: 'submitTime', key: 'submitTime' },
    {
      title: t('approval.approver'),
      dataIndex: 'approver',
      key: 'approver',
      customRender: ({ text }: { text: string }) => userDisplayName(text),
    },
    { title: t('common.status'), dataIndex: 'status', key: 'status', width: 100 },
    { title: t('common.operation'), key: 'action', width: 120 },
  ])

  const approvalAnalysisColumns = computed(() => [
    { title: t('approval.reportNumber'), dataIndex: 'reportNumber', key: 'reportNumber' },
    { title: t('returnPart.partNumber'), dataIndex: 'partNumber', key: 'partNumber' },
    { title: t('returnPart.productPlatform'), dataIndex: 'productPlatform', key: 'productPlatform' },
    {
      title: t('approval.submitter'),
      dataIndex: 'submitter',
      key: 'submitter',
      customRender: ({ text }: { text: string }) => userDisplayName(text),
    },
    { title: t('approval.submitTime'), dataIndex: 'submitTime', key: 'submitTime' },
    { title: t('common.status'), dataIndex: 'status', key: 'status', width: 100 },
    { title: t('common.operation'), key: 'action', width: 100 },
  ])

  return { myAnalysisColumns, approvalAnalysisColumns }
}

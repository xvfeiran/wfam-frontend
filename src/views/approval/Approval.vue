<template>
  <div class="approval-page">
    <a-page-header :title="t('approval.title')" />

    <a-tabs v-model:activeKey="mainTab" type="card" class="main-tabs">
      <!-- 我的申请 - 我提交的申请待别人审批 -->
      <a-tab-pane key="myApplications" :tab="t('approval.myApplications')">
        <a-card>
          <a-table
            :columns="myAnalysisColumns"
            :data-source="myAnalysisApplications"
            :pagination="tablePagination"
            row-key="id"
            size="middle"
            :bordered="false"
            :sticky="true"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusLabel(record.status) }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="handleViewReport(record)">
                    <EyeOutlined /> {{ t('common.view') }}
                  </a-button>
                  <a-button
                    v-if="record.status === ApprovalStatus.PENDING"
                    type="link"
                    size="small"
                    danger
                    @click="handleCancelApplication(record)"
                  >
                    {{ t('common.withdraw') }}
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- 待我审批 - 别人提交的申请待我审批 -->
      <a-tab-pane key="pendingApproval" :tab="t('approval.pendingApproval')">
        <a-card>
          <a-table
            :columns="approvalAnalysisColumns"
            :data-source="pendingAnalysisApprovals"
            :pagination="tablePagination"
            row-key="id"
            size="middle"
            :bordered="false"
            :sticky="true"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusLabel(record.status) }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <template v-if="record.status === ApprovalStatus.PENDING">
                  <a-dropdown>
                    <a-button type="link" size="small">
                      {{ t('approval.operation') }} <DownOutlined />
                    </a-button>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item key="view" @click="handleViewReport(record)">
                          <EyeOutlined /> {{ t('common.view') }}
                        </a-menu-item>
                        <a-menu-item key="approve" @click="handleApprove(record)">
                          <CheckOutlined /> {{ t('common.approve') }}
                        </a-menu-item>
                        <a-menu-item key="reject" danger @click="handleReject(record)">
                          <CloseOutlined /> {{ t('common.reject') }}
                        </a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </template>
                <a-button v-else type="link" size="small" @click="handleViewReport(record)">
                  <EyeOutlined /> {{ t('common.view') }}
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 驳回原因弹窗 -->
    <a-modal
      v-model:open="rejectModalVisible"
      :title="t('approval.rejectTitle')"
      @ok="handleConfirmReject"
      @cancel="rejectModalVisible = false"
      :confirm-loading="rejectDebounce.isDebouncing.value"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('approval.rejectReason')" :rules="[{ required: true, message: t('approval.inputRejectReason') }]">
          <a-textarea
            v-model:value="rejectReason"
            :placeholder="t('approval.inputRejectReason')"
            :rows="4"
            show-count
            :maxlength="200"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 精分析报告查看弹窗 -->
    <a-modal
      v-model:open="reportModalVisible"
      :title="t('approval.reportDetail')"
      width="800px"
      :footer="null"
    >
      <template v-if="currentReport">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item :label="t('approval.reportNumber')">{{ currentReport.reportNumber }}</a-descriptions-item>
          <a-descriptions-item :label="t('returnPart.partNumber')">{{ currentReport.partNumber }}</a-descriptions-item>
          <a-descriptions-item :label="t('returnPart.productPlatform')">{{ currentReport.productPlatform }}</a-descriptions-item>
          <a-descriptions-item :label="t('returnPart.failureType')">{{ currentReport.failureType }}</a-descriptions-item>
          <a-descriptions-item :label="t('approval.submitter')">{{ currentReport.submitter }}</a-descriptions-item>
          <a-descriptions-item :label="t('approval.submitTime')">{{ currentReport.submitTime }}</a-descriptions-item>
          <a-descriptions-item :label="t('approval.reportSummary')" :span="2">{{ currentReport.summary }}</a-descriptions-item>
        </a-descriptions>
        <a-divider>{{ t('approval.reportContent') }}</a-divider>
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item v-for="(value, key) in currentReport.content" :key="key" :label="getFieldLabel(key)">
            {{ value }}
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { CheckOutlined, CloseOutlined, EyeOutlined, DownOutlined } from '@ant-design/icons-vue'
import {
  ApprovalStatus,
  APPROVAL_STATUS_MAP,
  ANALYSIS_FIELD_LABELS,
  type AnalysisApplication,
} from '@/types'
import { approvalApi } from '@/services/approvalApi'
import { useApprovalColumns } from '@/composables/useApprovalColumns'
import { useDebouncedClick } from '@/composables/useDebouncedClick'

const { t } = useI18n()
const route = useRoute()

// Tab状态
const mainTab = ref('myApplications')

// 弹窗状态
const rejectModalVisible = ref(false)
const reportModalVisible = ref(false)
const rejectReason = ref('')
const currentRejectRecord = ref<AnalysisApplication | null>(null)
const currentReport = ref<AnalysisApplication | null>(null)

// 防抖处理
const rejectDebounce = useDebouncedClick({ delay: 1000 })

// 通用分页配置
const tablePagination = {
  pageSize: 10,
  showSizeChanger: true,
  showTotal: (total: number) => t('common.total', { total }),
}

// 我的精分析申请（我提交的）
const myAnalysisApplications = ref<AnalysisApplication[]>([])

// 待我审批的精分析报告（别人提交的）
const pendingAnalysisApprovals = ref<AnalysisApplication[]>([])

onMounted(async () => {
  const [myAnalysis, pendingAnalysis] = await Promise.all([
    approvalApi.getMyApplications(),
    approvalApi.getPendingApprovals(),
  ])
  myAnalysisApplications.value = myAnalysis
  pendingAnalysisApprovals.value = pendingAnalysis

  if (route.query.tab === 'pendingApproval') {
    mainTab.value = 'pendingApproval'
  }

  // 处理从精分析弹窗跳转过来的路由参数
  if (route.query.tab === 'myApplications') {
    mainTab.value = 'myApplications'
    const openPartNumber = route.query.openPartNumber as string | undefined
    if (openPartNumber) {
      const target = myAnalysisApplications.value.find(a => a.partNumber === openPartNumber)
      if (target) {
        handleViewReport(target)
      }
    }
  }
})

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'myApplications' || tab === 'pendingApproval') {
      mainTab.value = tab
    }
  },
)

const { myAnalysisColumns, approvalAnalysisColumns } = useApprovalColumns()

// 状态到i18n键的映射
const statusI18nKeyMap: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: 'status.pending',
  [ApprovalStatus.APPROVED]: 'status.approved',
  [ApprovalStatus.REJECTED]: 'status.rejected',
  [ApprovalStatus.WITHDRAWN]: 'status.withdrawn',
}

// 状态颜色映射
const getStatusColor = (status: ApprovalStatus) => {
  return APPROVAL_STATUS_MAP[status]?.color || 'default'
}

// 状态标签映射
const getStatusLabel = (status: ApprovalStatus) => {
  const key = statusI18nKeyMap[status]
  return key ? t(key) : APPROVAL_STATUS_MAP[status]?.label || status
}

// 字段标签映射
const getFieldLabel = (key: string) => {
  return ANALYSIS_FIELD_LABELS[key] || key
}

// 撤回申请
const handleCancelApplication = (record: AnalysisApplication) => {
  Modal.confirm({
    title: t('approval.confirmWithdrawApplication'),
    content: t('approval.confirmWithdraw'),
    onOk: async () => {
      await approvalApi.withdraw(record.id)
      const item = myAnalysisApplications.value.find(a => a.id === record.id)
      if (item) item.status = ApprovalStatus.WITHDRAWN
      message.success(t('message.withdrawComplete'))
    },
  })
}

// 查看报告
const handleViewReport = (record: AnalysisApplication) => {
  currentReport.value = record
  reportModalVisible.value = true
}

// 审批通过
const handleApprove = (record: AnalysisApplication) => {
  Modal.confirm({
    title: t('approval.confirmApprove'),
    content: t('approval.confirmApprove').replace('{type}', t('approval.analysisReport')),
    onOk: async () => {
      await approvalApi.approve(record.id)
      const item = pendingAnalysisApprovals.value.find(a => a.id === record.id)
      if (item) item.status = ApprovalStatus.APPROVED
      message.success(t('message.approvalComplete'))
    },
  })
}

// 驳回
const handleReject = (record: AnalysisApplication) => {
  currentRejectRecord.value = record
  rejectReason.value = ''
  rejectModalVisible.value = true
}

// 确认驳回
const handleConfirmReject = () => rejectDebounce.execute(async () => {
  if (!rejectReason.value.trim()) {
    message.error(t('approval.inputRejectReason'))
    return
  }

  if (!currentRejectRecord.value) return

  await approvalApi.reject(currentRejectRecord.value.id, rejectReason.value)

  const item = pendingAnalysisApprovals.value.find(a => a.id === currentRejectRecord.value!.id)
  if (item) item.status = ApprovalStatus.REJECTED

  rejectModalVisible.value = false
  message.success(t('message.rejectComplete'))
})
</script>

<style lang="less" scoped>
.approval-page {
  padding: 0;

  .main-tabs {
    :deep(.ant-tabs-nav) {
      margin-bottom: 16px;
    }
  }
}
</style>

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
            :pagination="appsPagination"
            :loading="appsLoading"
            row-key="id"
            size="middle"
            :bordered="false"
            :sticky="true"
            @change="handleAppsTableChange"
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

      <!-- 我的审批 - 我审批过的和待我审批的（仅 QMC Leader 可见） -->
      <a-tab-pane v-if="isQMCLeader" key="myApproval" :tab="t('approval.myApproval')">
        <a-card>
          <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span style="white-space: nowrap;">{{ t('common.status') }}：</span>
            <a-select
              v-model:value="approvalStatusFilter"
              style="width: 160px"
              allow-clear
            >
              <a-select-option value="all">{{ t('common.all') }}</a-select-option>
              <a-select-option v-for="status in approvalStatusOptions" :key="status" :value="status">
                {{ getStatusLabel(status) }}
              </a-select-option>
            </a-select>
          </div>
          <a-table
            :columns="approvalAnalysisColumns"
            :data-source="myApprovalRecords"
            :pagination="approvalsPagination"
            :loading="approvalsLoading"
            row-key="id"
            size="middle"
            :bordered="false"
            :sticky="true"
            @change="handleApprovalsTableChange"
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

    <!-- 精分析报告查看弹窗（复用 AnalysisReportModal） -->
    <AnalysisReportModal
      v-model:visible="reportModalVisible"
      :part="selectedPart"
      :readonly="true"
      @success="handleReportModalSuccess"
    />
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
  type AnalysisApplication,
} from '@/types'
import type { Part } from '@/types'
import { useStatusLabels } from '@/composables/useStatusLabels'
import { usePermissions } from '@/composables/usePermissions'
import { approvalApi } from '@/services/approvalApi'
import { partApi } from '@/services/partApi'
import { useApprovalColumns } from '@/composables/useApprovalColumns'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import { useTableList } from '@/composables/useTableList'
import AnalysisReportModal from '@/views/return-parts/components/AnalysisReportModal.vue'

const { t } = useI18n()
const route = useRoute()
const { isQMCLeader } = usePermissions()

// Tab状态
const mainTab = ref('myApplications')

// 弹窗状态
const rejectModalVisible = ref(false)
const reportModalVisible = ref(false)
const rejectReason = ref('')
const currentRejectRecord = ref<AnalysisApplication | null>(null)
const selectedPart = ref<Part | null>(null)

// 防抖处理
const rejectDebounce = useDebouncedClick({ delay: 1000 })

// 状态筛选
const approvalStatusFilter = ref<string | undefined>('all')
const approvalStatusOptions = [ApprovalStatus.PENDING, ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]

// 我的精分析申请（我提交的）— 服务端分页
const {
  loading: appsLoading,
  items: myAnalysisApplications,
  pagination: appsPagination,
  handleTableChange: handleAppsTableChange,
  loadData: loadApps,
} = useTableList<AnalysisApplication>(async (params) => {
  return approvalApi.getMyApplications({ page: params.page, pageSize: params.pageSize })
})

// 我的审批记录（待审批 + 已审批/已驳回）— 服务端分页 + 服务端状态筛选
const {
  loading: approvalsLoading,
  items: myApprovalRecords,
  pagination: approvalsPagination,
  handleTableChange: handleApprovalsTableChange,
  loadData: loadApprovals,
} = useTableList<AnalysisApplication>(async (params) => {
  return approvalApi.getMyApprovals({
    page: params.page,
    pageSize: params.pageSize,
    status: approvalStatusFilter.value && approvalStatusFilter.value !== 'all' ? approvalStatusFilter.value : undefined,
  })
})

// 状态筛选变化：回到第 1 页并服务端重查
watch(approvalStatusFilter, () => {
  approvalsPagination.current = 1
  loadApprovals()
})

onMounted(async () => {
  await loadApps()

  if (isQMCLeader.value) {
    await loadApprovals()
  }

  if (isQMCLeader.value && (route.query.tab === 'myApproval' || route.query.tab === 'pendingApproval')) {
    mainTab.value = 'myApproval'
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
    if (tab === 'myApplications') {
      mainTab.value = tab
    } else if ((tab === 'myApproval' || tab === 'pendingApproval') && isQMCLeader.value) {
      mainTab.value = 'myApproval'
    }
  },
)

const { myAnalysisColumns, approvalAnalysisColumns } = useApprovalColumns()

const { getApprovalLabel } = useStatusLabels()

// 状态颜色映射
const getStatusColor = (status: ApprovalStatus) => {
  return APPROVAL_STATUS_MAP[status]?.color || 'default'
}

// 状态标签映射
const getStatusLabel = (status: ApprovalStatus) => getApprovalLabel(status)

// 撤回申请
const handleCancelApplication = (record: AnalysisApplication) => {
  Modal.confirm({
    title: t('approval.confirmWithdrawApplication'),
    content: t('approval.confirmWithdraw'),
    onOk: async () => {
      await approvalApi.withdraw(record.id)
      await loadApps()
      message.success(t('message.withdrawComplete'))
    },
  })
}

// 查看报告（通过 partId 加载 Part，复用 AnalysisReportModal）
const handleViewReport = async (record: AnalysisApplication) => {
  try {
    selectedPart.value = await partApi.getById(record.partId)
    reportModalVisible.value = true
  } catch {
    message.error(t('message.operationFailed'))
  }
}

// 报告弹窗操作成功回调
const handleReportModalSuccess = async () => {
  reportModalVisible.value = false
}

// 审批通过
const handleApprove = (record: AnalysisApplication) => {
  Modal.confirm({
    title: t('approval.confirmApprove'),
    content: t('approval.confirmApprove').replace('{type}', t('approval.analysisReport')),
    onOk: async () => {
      await approvalApi.approve(record.id)
      await loadApprovals()
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

  await loadApprovals()

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

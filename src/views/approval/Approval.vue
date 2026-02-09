<template>
  <div class="approval-page">
    <a-page-header :title="t('approval.title')" />

    <a-tabs v-model:activeKey="mainTab" type="card" class="main-tabs">
      <!-- 我的申请 - 我提交的申请待别人审批 -->
      <a-tab-pane key="myApplications" :tab="t('approval.myApplications')">
        <a-tabs v-model:activeKey="mySubTab" tab-position="left" class="sub-tabs">
          <!-- 我的报废申请 -->
          <a-tab-pane key="scrap" :tab="t('approval.scrapApplication')">
            <a-card>
              <a-table
                :columns="myScrapColumns"
                :data-source="myScrapApplications"
                :pagination="tablePagination"
                row-key="id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'status'">
                    <a-tag :color="getStatusColor(record.status)">
                      {{ getStatusLabel(record.status) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <a-button
                      v-if="record.status === ApprovalStatus.PENDING"
                      type="link"
                      size="small"
                      danger
                      @click="handleCancelApplication(record, 'scrap')"
                    >
                      {{ t('common.withdraw') }}
                    </a-button>
                    <span v-else>-</span>
                  </template>
                </template>
              </a-table>
            </a-card>
          </a-tab-pane>

          <!-- 我的精分析申请 -->
          <a-tab-pane key="analysis" :tab="t('approval.analysisReport')">
            <a-card>
              <a-table
                :columns="myAnalysisColumns"
                :data-source="myAnalysisApplications"
                :pagination="tablePagination"
                row-key="id"
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
                        @click="handleCancelApplication(record, 'analysis')"
                      >
                        {{ t('common.withdraw') }}
                      </a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </a-tab-pane>

      <!-- 待我审批 - 别人提交的申请待我审批 -->
      <a-tab-pane key="pendingApproval" :tab="t('approval.pendingApproval')">
        <a-tabs v-model:activeKey="approvalSubTab" tab-position="left" class="sub-tabs">
          <!-- 待审批的报废申请 -->
          <a-tab-pane key="scrap" :tab="t('approval.scrapApplication')">
            <a-card>
              <a-table
                :columns="approvalScrapColumns"
                :data-source="pendingScrapApprovals"
                :pagination="tablePagination"
                row-key="id"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'status'">
                    <a-tag :color="getStatusColor(record.status)">
                      {{ getStatusLabel(record.status) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <a-space v-if="record.status === ApprovalStatus.PENDING">
                      <a-button type="link" size="small" @click="handleApprove(record, 'scrap')">
                        <CheckOutlined /> {{ t('common.approve') }}
                      </a-button>
                      <a-button type="link" size="small" danger @click="handleReject(record, 'scrap')">
                        <CloseOutlined /> {{ t('common.reject') }}
                      </a-button>
                    </a-space>
                    <span v-else>-</span>
                  </template>
                </template>
              </a-table>
            </a-card>
          </a-tab-pane>

          <!-- 待审批的精分析报告 -->
          <a-tab-pane key="analysis" :tab="t('approval.analysisReport')">
            <a-card>
              <a-table
                :columns="approvalAnalysisColumns"
                :data-source="pendingAnalysisApprovals"
                :pagination="tablePagination"
                row-key="id"
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
                            <a-menu-item key="approve" @click="handleApprove(record, 'analysis')">
                              <CheckOutlined /> {{ t('common.approve') }}
                            </a-menu-item>
                            <a-menu-item key="reject" danger @click="handleReject(record, 'analysis')">
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
      </a-tab-pane>
    </a-tabs>

    <!-- 驳回原因弹窗 -->
    <a-modal
      v-model:open="rejectModalVisible"
      :title="t('approval.rejectTitle')"
      @ok="handleConfirmReject"
      @cancel="rejectModalVisible = false"
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { CheckOutlined, CloseOutlined, EyeOutlined, DownOutlined } from '@ant-design/icons-vue'
import {
  ApprovalStatus,
  APPROVAL_STATUS_MAP,
  ANALYSIS_FIELD_LABELS,
  type ScrapApplication,
  type AnalysisApplication,
} from '@/types'

const { t } = useI18n()

type ApplicationType = 'scrap' | 'analysis'

// Tab状态
const mainTab = ref('myApplications')
const mySubTab = ref<ApplicationType>('scrap')
const approvalSubTab = ref<ApplicationType>('scrap')

// 弹窗状态
const rejectModalVisible = ref(false)
const reportModalVisible = ref(false)
const rejectReason = ref('')
const currentRejectRecord = ref<ScrapApplication | AnalysisApplication | null>(null)
const currentRejectType = ref<ApplicationType>('scrap')
const currentReport = ref<AnalysisApplication | null>(null)

// 通用分页配置
const tablePagination = {
  pageSize: 10,
  showSizeChanger: true,
  showTotal: (total: number) => t('common.total', { total }),
}

// 我的报废申请（我提交的）
const myScrapApplications = ref<ScrapApplication[]>([
  { id: '1', orderNumber: 'RO-2026-0001', partNumbers: 'BU1-PLT1-0001, BU1-PLT1-0002', quantity: 2, applyTime: '2026-02-01 10:00', status: ApprovalStatus.PENDING, reason: '零件损坏无法修复', approver: '王五' },
  { id: '2', orderNumber: 'RO-2026-0002', partNumbers: 'BU2-PLT3-0001', quantity: 1, applyTime: '2026-02-02 14:30', status: ApprovalStatus.APPROVED, reason: '客户要求报废处理', approver: '王五', approveTime: '2026-02-02 16:00' },
])

// 我的精分析申请（我提交的）
const myAnalysisApplications = ref<AnalysisApplication[]>([
  { id: '1', reportNumber: 'AR-2026-0001', partNumber: 'BU1-PLT1-0001', productPlatform: 'PLT1', failureType: '噪音', submitTime: '2026-02-01 14:00', status: ApprovalStatus.PENDING, summary: '怠速噪音异常分析报告', approver: '赵六', content: { failureMode: '机械失效', failureDescription: '发动机怠速时产生异常噪音', rootCause: '轴承磨损导致', improvement: '更换新轴承', responsibleDept: '工程部' } },
  { id: '2', reportNumber: 'AR-2026-0002', partNumber: 'BU2-PLT3-0001', productPlatform: 'PLT3', failureType: '渗漏', submitTime: '2026-02-02 10:30', status: ApprovalStatus.APPROVED, summary: '油封渗漏分析报告', approver: '赵六', approveTime: '2026-02-02 15:00', content: { failureMode: '材料失效', failureDescription: '油封老化导致渗漏', rootCause: '材料选型不当', improvement: '更换耐久性更好的油封材料', responsibleDept: '采购部' } },
])

// 待我审批的报废申请（别人提交的）
const pendingScrapApprovals = ref<ScrapApplication[]>([
  { id: '3', orderNumber: 'RO-2026-0003', partNumbers: 'BU3-PLT2-0001', quantity: 1, applicant: '赵六', applyTime: '2026-02-03 09:15', status: ApprovalStatus.PENDING, reason: '超期未处理' },
  { id: '4', orderNumber: 'RO-2026-0004', partNumbers: 'BU1-PLT4-0001', quantity: 1, applicant: '钱七', applyTime: '2026-02-04 08:00', status: ApprovalStatus.PENDING, reason: '质量问题无法使用' },
])

// 待我审批的精分析报告（别人提交的）
const pendingAnalysisApprovals = ref<AnalysisApplication[]>([
  { id: '3', reportNumber: 'AR-2026-0003', partNumber: 'BU3-PLT2-0001', productPlatform: 'PLT2', failureType: '断裂', submitter: '钱七', submitTime: '2026-02-03 16:45', status: ApprovalStatus.PENDING, summary: '连接件断裂分析报告', content: { failureMode: '疲劳断裂', failureDescription: '连接件在长期使用后断裂', rootCause: '设计强度不足', improvement: '增加截面积，提高强度', responsibleDept: '工程部' } },
  { id: '4', reportNumber: 'AR-2026-0004', partNumber: 'BU1-PLT1-0002', productPlatform: 'PLT1', failureType: '异响', submitter: '张三', submitTime: '2026-02-04 09:30', status: ApprovalStatus.PENDING, summary: '异响问题分析报告', content: { failureMode: '机械失效', failureDescription: '运行时产生异响', rootCause: '装配不良', improvement: '改进装配工艺', responsibleDept: '生产部' } },
])

// 我的报废申请列配置
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

// 我的精分析申请列配置
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

// 待审批的报废申请列配置
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

// 待审批的精分析报告列配置
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

// 状态到i18n键的映射
const statusI18nKeyMap: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: 'status.pending',
  [ApprovalStatus.APPROVED]: 'status.approved',
  [ApprovalStatus.REJECTED]: 'status.rejected',
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
const handleCancelApplication = (record: ScrapApplication | AnalysisApplication, type: ApplicationType) => {
  Modal.confirm({
    title: t('approval.confirmWithdrawApplication'),
    content: t('approval.confirmWithdraw'),
    onOk: () => {
      if (type === 'scrap') {
        myScrapApplications.value = myScrapApplications.value.filter(a => a.id !== record.id)
      } else {
        myAnalysisApplications.value = myAnalysisApplications.value.filter(a => a.id !== record.id)
      }
      message.success(t('message.approvalComplete') + ': ' + t('status.withdrawn'))
    },
  })
}

// 查看报告
const handleViewReport = (record: AnalysisApplication) => {
  currentReport.value = record
  reportModalVisible.value = true
}

// 审批通过
const handleApprove = (record: ScrapApplication | AnalysisApplication, type: ApplicationType) => {
  const typeName = type === 'scrap' ? t('approval.scrapApplication') : t('approval.analysisReport')
  Modal.confirm({
    title: t('approval.confirmApprove'),
    content: t('approval.confirmApprove').replace('{type}', typeName),
    onOk: () => {
      if (type === 'scrap') {
        const item = pendingScrapApprovals.value.find(a => a.id === record.id)
        if (item) item.status = ApprovalStatus.APPROVED
      } else {
        const item = pendingAnalysisApprovals.value.find(a => a.id === record.id)
        if (item) item.status = ApprovalStatus.APPROVED
      }
      message.success(t('message.approvalComplete'))
    },
  })
}

// 驳回
const handleReject = (record: ScrapApplication | AnalysisApplication, type: ApplicationType) => {
  currentRejectRecord.value = record
  currentRejectType.value = type
  rejectReason.value = ''
  rejectModalVisible.value = true
}

// 确认驳回
const handleConfirmReject = () => {
  if (!rejectReason.value.trim()) {
    message.error(t('approval.inputRejectReason'))
    return
  }

  if (!currentRejectRecord.value) return

  if (currentRejectType.value === 'scrap') {
    const item = pendingScrapApprovals.value.find(a => a.id === currentRejectRecord.value!.id)
    if (item) item.status = ApprovalStatus.REJECTED
  } else {
    const item = pendingAnalysisApprovals.value.find(a => a.id === currentRejectRecord.value!.id)
    if (item) item.status = ApprovalStatus.REJECTED
  }

  rejectModalVisible.value = false
  message.success(t('message.rejectComplete'))
}
</script>

<style lang="less" scoped>
.approval-page {
  padding: 24px;

  .main-tabs {
    :deep(.ant-tabs-nav) {
      margin-bottom: 16px;
    }
  }

  .sub-tabs {
    :deep(.ant-tabs-nav) {
      width: 120px;
    }

    :deep(.ant-tabs-content-holder) {
      border-left: 1px solid #f0f0f0;
      padding-left: 16px;
    }

    :deep(.ant-tabs-tab) {
      padding: 12px 16px;
      justify-content: flex-start;
    }
  }
}
</style>

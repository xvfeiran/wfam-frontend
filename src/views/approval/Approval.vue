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
            :data-source="filteredMyApprovals"
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
          <a-descriptions-item :label="t('returnPart.failureType')">{{ currentReport.failureType ? t('returnPart.failureTypeLabels.' + currentReport.failureType) : '-' }}</a-descriptions-item>
          <a-descriptions-item :label="t('approval.submitter')">{{ currentReport.submitter }}</a-descriptions-item>
          <a-descriptions-item :label="t('approval.submitTime')">{{ currentReport.submitTime }}</a-descriptions-item>
          <a-descriptions-item :label="t('approval.reportSummary')" :span="2">{{ currentReport.summary }}</a-descriptions-item>
        </a-descriptions>
        <a-divider>{{ t('approval.reportContent') }}</a-divider>
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item v-for="(value, key) in currentReport.content" :key="key" :label="getFieldLabel(key)">
            <!-- 单张照片字段 -->
            <template v-if="isPhotoField(key as string)">
              <a-image
                v-if="value && typeof value === 'string'"
                :src="getFileUrl(value)"
                :width="120"
                style="cursor: zoom-in; border-radius: 4px;"
              />
              <span v-else>-</span>
            </template>
            <!-- 多张照片字段 -->
            <template v-else-if="isPhotoListField(key as string)">
              <a-image-preview-group v-if="Array.isArray(value) && value.length > 0">
                <a-space :size="8" wrap>
                  <a-image
                    v-for="(path, idx) in value"
                    :key="idx"
                    :src="getFileUrl(path)"
                    :width="120"
                    style="cursor: zoom-in; border-radius: 4px;"
                  />
                </a-space>
              </a-image-preview-group>
              <span v-else>-</span>
            </template>
            <!-- 普通文本字段 -->
            <template v-else>
              {{ value ?? '-' }}
            </template>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { CheckOutlined, CloseOutlined, EyeOutlined, DownOutlined } from '@ant-design/icons-vue'
import {
  ApprovalStatus,
  APPROVAL_STATUS_MAP,
  ANALYSIS_FIELD_LABELS,
  type AnalysisApplication,
  type ReportTemplate,
} from '@/types'
import { useStatusLabels } from '@/composables/useStatusLabels'
import { usePermissions } from '@/composables/usePermissions'
import { approvalApi } from '@/services/approvalApi'
import { reportsApi } from '@/services/reportsApi'
import { fileApi } from '@/services/fileApi'
import { useApprovalColumns } from '@/composables/useApprovalColumns'
import { useDebouncedClick } from '@/composables/useDebouncedClick'

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
const currentReport = ref<AnalysisApplication | null>(null)

// 模板缓存：用于判断字段类型（photo / photolist / text 等）
const templateCache = ref<Record<string, ReportTemplate>>({})

/** 构建文件完整 URL */
const getFileUrl = (relativePath: string) => fileApi.getFileUrl(relativePath)

/** 加载模板（带缓存），仅在有 templateId 时调用 */
const loadTemplate = async (templateId: string): Promise<ReportTemplate | null> => {
  if (templateCache.value[templateId]) return templateCache.value[templateId]
  try {
    // 从已启用的模板列表中查找
    const allTemplates = await reportsApi.getTemplates()
    for (const t of allTemplates) {
      templateCache.value[t.id] = t
    }
    return templateCache.value[templateId] || null
  } catch {
    return null
  }
}

/** 判断字段是否为单张照片类型 */
const isPhotoField = (fieldName: string): boolean => {
  if (!currentReport.value?.templateId) return false
  const tmpl = templateCache.value[currentReport.value.templateId]
  if (!tmpl) return false
  const field = tmpl.fields.find(f => f.name === fieldName)
  return field?.type === 'photo'
}

/** 判断字段是否为多张照片类型 */
const isPhotoListField = (fieldName: string): boolean => {
  if (!currentReport.value?.templateId) return false
  const tmpl = templateCache.value[currentReport.value.templateId]
  if (!tmpl) return false
  const field = tmpl.fields.find(f => f.name === fieldName)
  return field?.type === 'photolist'
}

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

// 我的审批记录（待审批 + 已审批/已驳回）
const myApprovalRecords = ref<AnalysisApplication[]>([])

// 状态筛选
const approvalStatusFilter = ref<string | undefined>('all')
const approvalStatusOptions = [ApprovalStatus.PENDING, ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]

// 根据筛选条件过滤审批记录
const filteredMyApprovals = computed(() => {
  if (!approvalStatusFilter.value || approvalStatusFilter.value === 'all') {
    return myApprovalRecords.value
  }
  return myApprovalRecords.value.filter(r => r.status === approvalStatusFilter.value)
})

onMounted(async () => {
  myAnalysisApplications.value = await approvalApi.getMyApplications()

  if (isQMCLeader.value) {
    myApprovalRecords.value = await approvalApi.getMyApprovals()
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
const handleViewReport = async (record: AnalysisApplication) => {
  currentReport.value = record
  reportModalVisible.value = true
  // 如果有 templateId，预加载模板以识别图片字段
  if (record.templateId) {
    await loadTemplate(record.templateId)
  }
}

// 审批通过
const handleApprove = (record: AnalysisApplication) => {
  Modal.confirm({
    title: t('approval.confirmApprove'),
    content: t('approval.confirmApprove').replace('{type}', t('approval.analysisReport')),
    onOk: async () => {
      await approvalApi.approve(record.id)
      const item = myApprovalRecords.value.find(a => a.id === record.id)
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

  const item = myApprovalRecords.value.find(a => a.id === currentRejectRecord.value!.id)
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

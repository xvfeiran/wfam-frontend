<template>
  <div class="part-detail">
    <a-page-header
      :title="t('partDetail.title', { partNumber: part?.partNumber || '-' })"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button v-if="canEditPart" @click="handleEdit">{{ t('common.edit') }}</a-button>
          <a-button type="primary" :disabled="!canAnalysis" @click="handleAnalysis">{{ t('partDetail.analysis') }}</a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- QC No. 录入区（精分析审批/完成及之后状态显示） -->
    <a-card v-if="isQcVisible" class="qc-card" style="margin-bottom: 16px;">
      <a-space>
        <span>{{ t('partDetail.qcNo') }}</span>
        <a-input
          v-model:value="qcNoInput"
          :placeholder="t('partDetail.qcNo')"
          :disabled="!canEditQcNo"
          style="width: 200px"
        />
        <a-button v-if="canEditQcNo" type="primary" @click="handleSubmitQcNo">{{ t('common.submit') }}</a-button>
      </a-space>
    </a-card>

    <a-watermark
      :content="part?.status === PartStatus.SCRAPPED ? t('status.scrapped') : undefined"
      :font="{ color: 'rgba(0,0,0,0.07)', fontSize: 18 }"
    >
    <a-row :gutter="16">
      <!-- 左侧：基本信息 -->
      <a-col :span="16">
        <a-card :title="t('partDetail.basicInfo')" class="info-card">
          <template #extra>
            <span v-if="part?.orderNumber" class="related-order-badge" @click="goToOrder($event)">
              <LinkOutlined />
              <span class="related-order-label">{{ t('partDetail.relatedOrder') }}</span>
              <span class="related-order-number">{{ part.orderNumber }}</span>
            </span>
          </template>
          <a-descriptions :column="2" bordered>
            <a-descriptions-item :label="t('returnPart.partNumber')">
              <a v-if="canEditPart && part?.partNumber" style="color: #1677ff" @click="handleEdit">{{ part.partNumber }}</a>
              <span v-else-if="part?.partNumber" style="color: #1677ff">{{ part.partNumber }}</span>
              <span v-else style="color: #999">-</span>
            </a-descriptions-item>
            <a-descriptions-item :label="t('returnPart.partCode')">{{ part?.partCode }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnPart.businessUnit')">{{ part?.businessUnit }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnPart.productPlatform')">{{ part?.productPlatform }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.partProductionDate')">{{ part?.partProductionDate || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.productionShift')">{{ part?.productionShift || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.customerFailureType')">{{ part?.failureType ? t('returnPart.failureTypeLabels.' + part.failureType) : '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.boschFailureType')">{{ part?.boschFailureType || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.responsibleEngineer')">{{ userDisplayName(part?.responsibleEngineer) }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.analyst')">{{ userDisplayName(part?.analyst) }}</a-descriptions-item>
            <a-descriptions-item v-if="part?.otherInfo" :label="t('partDetail.otherInfo')" :span="2">{{ part.otherInfo }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card :title="t('partDetail.complaintInfo')" class="vehicle-card">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item :label="t('returnPart.repairStation')">
              {{ part?.repairStation || '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('returnPart.complaintLocation')">
              {{ part?.complaintLocation || '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.vehicleProductionDate')">{{ part?.vehicleProductionDate || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.vehiclePurchaseDate')">{{ part?.vehiclePurchaseDate || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.vehicleFailureDate')">{{ part?.vehicleFailureDate || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.vehicleVIN')">{{ part?.vehicleVIN || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.vehicleMileage')" :span="2">{{ part?.vehicleMileage ? `${part.vehicleMileage} km` : '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.customerDescription')" :span="2">{{ part?.customerDescription || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.otherDescription')" :span="2">{{ part?.otherDescription || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card :title="t('partDetail.photoInfo')" class="image-card">
          <a-empty v-if="!part?.images?.length" :description="t('partDetail.noPhotos')" />
          <a-image-preview-group v-else>
            <a-space wrap>
              <a-image
                v-for="(img, index) in part.images"
                :key="index"
                :width="120"
                :height="120"
                :src="getFileUrl(img)"
                style="object-fit: cover; border-radius: 4px;"
              />
            </a-space>
          </a-image-preview-group>
        </a-card>
      </a-col>

      <!-- 右侧：状态追溯 + 精分析报告 -->
      <a-col :span="8">
        <a-card :title="t('partDetail.statusFlow')" class="status-card">
          <a-steps direction="vertical" :current="currentStep" size="small">
            <a-step :title="t('partDetail.stepInitialAnalysis')" :description="getStepDescription(0)" />
            <a-step :title="t('partDetail.stepDetailedAnalysis')" :description="getStepDescription(1)" :status="getStep1Status()" />
            <a-step :title="t('partDetail.stepWorkonScrap')" :description="getStepDescription(2)" />
          </a-steps>
        </a-card>

        <a-card :title="t('partDetail.analysisReport')" class="report-card" v-if="report">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item :label="t('partDetail.template')">{{ getTemplateName(report.templateId) }}</a-descriptions-item>
            <a-descriptions-item :label="t('common.status')">
              <a-tag :color="getReportStatusColor(report.status)">
                {{ getReportStatusLabel(report.status) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.summary')">{{ report.summary || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.submittedTime')">{{ report.submittedAt || '-' }}</a-descriptions-item>
          </a-descriptions>
          <div class="report-actions">
            <a-button type="link" @click="handleViewReport">{{ t('partDetail.viewDetails') }}</a-button>
            <a-button type="link" :disabled="exportDebounce.isDebouncing.value" :loading="exportDebounce.isDebouncing.value" @click="handleExportReport">{{ t('partDetail.exportReport') }}</a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>
    </a-watermark>

    <!-- 精分析报告弹窗 -->
    <AnalysisReportModal
      v-model:visible="analysisVisible"
      :part="part"
      @success="handleAnalysisSuccess"
      @view-approval="handleViewApproval"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { LinkOutlined } from '@ant-design/icons-vue'
import { partApi } from '@/services/partApi'
import { reportsApi } from '@/services/reportsApi'
import { fileApi } from '@/services/fileApi'
import { PartStatus } from '@/types'
import type { Part, AnalysisReport, ReportTemplate } from '@/types'
import { usePermissions } from '@/composables/usePermissions'
import { useUserNameMap } from '@/composables/useUserNameMap'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import AnalysisReportModal from './components/AnalysisReportModal.vue'

const getFileUrl = (relativePath: string) => {
  if (relativePath.startsWith('/api/') || relativePath.startsWith('http')) return relativePath
  return fileApi.getFileUrl(relativePath)
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { canEditSubmittedForm, isQMCLeader } = usePermissions()
const { displayName: userDisplayName, load: loadUserNameMap } = useUserNameMap()
const partId = computed(() => route.params.id as string)
const analysisOrderStatus = computed(() => typeof route.query.analysisOrderStatus === 'string' ? route.query.analysisOrderStatus : undefined)

const part = ref<Part | null>(null)
const report = ref<AnalysisReport | null>(null)
const templates = ref<ReportTemplate[]>([])
const analysisVisible = ref(false)
const exportDebounce = useDebouncedClick({ delay: 1000 })
const qcNoInput = ref('')

const QC_VISIBLE_STATUSES = [PartStatus.PENDING_APPROVAL, PartStatus.ANALYSIS_COMPLETED, PartStatus.ANALYSIS_SKIPPED, PartStatus.SCRAP_IN_PROGRESS, PartStatus.SCRAPPED]
const isQcVisible = computed(() => part.value ? QC_VISIBLE_STATUSES.includes(part.value.status) : false)

/**
 * 检查当前用户是否有权限编辑已提交的售后件
 *
 * 权限角色：
 * - W_RBCC_AEP_WFAM_QMC_Leader（QMC 主管）
 * - W_RBCC_AEP_WFAM_SystemAdmin（系统管理员）
 *
 * @returns {boolean} 是否有权限编辑已提交的售后件
 */
const canEditPart = computed(() => {
  if (!part.value) return false
  // 未提交的单据所有人都可以编辑
  if (!part.value.partNumber) return true
  // 已提交的单据需要检查权限
  return canEditSubmittedForm.value
})

/**
 * 精分析按钮权限：需要分析单已完成抽样（非 pending_sampling 状态）
 * 如果没有分析单状态信息（如从退货单列表进入），默认允许
 */
const canAnalysis = computed(() => {
  if (!analysisOrderStatus.value) return true // 无状态信息时默认允许
  return analysisOrderStatus.value !== 'pending_sampling'
})

/**
 * QC No. 编辑权限：QMC Leader 可以编辑，或者 QC No. 未填写时可以编辑
 */
const canEditQcNo = computed(() => {
  if (!part.value) return false
  // QMC Leader 始终可以编辑
  if (isQMCLeader.value) return true
  // 其他角色：只有 QC No. 未填写时可以编辑
  return !part.value.qcNo
})

const handleSubmitQcNo = async () => {
  if (!qcNoInput.value.trim()) {
    message.warning(t('partDetail.qcNo'))
    return
  }
  const updatedPart = await partApi.updateQcNo(partId.value, qcNoInput.value.trim())
  part.value = updatedPart
  message.success(t('partDetail.qcNoSubmitted'))
}

// 状态步骤映射（3组）
const statusStepMap: Record<PartStatus, number> = {
  [PartStatus.IN_INITIAL_ANALYSIS]: 0,
  [PartStatus.INITIAL_ANALYSIS_COMPLETED]: 0,
  [PartStatus.IN_DETAILED_ANALYSIS]: 1,
  [PartStatus.ANALYSIS_REPORT_SUBMITTED]: 1,
  [PartStatus.PENDING_APPROVAL]: 1,
  [PartStatus.ANALYSIS_COMPLETED]: 1,
  [PartStatus.ANALYSIS_SKIPPED]: 1,
  [PartStatus.SCRAP_IN_PROGRESS]: 2,
  [PartStatus.SCRAPPED]: 2,
}

const currentStep = computed(() => {
  return part.value ? statusStepMap[part.value.status] : 0
})

const getStepDescription = (step: number) => {
  const status = part.value?.status
  if (step === 0) {
    if (currentStep.value > 0 || status === PartStatus.INITIAL_ANALYSIS_COMPLETED) return t('partDetail.completed')
    return t('partDetail.inProgress')
  }
  if (step === 1) {
    if (currentStep.value < 1) return ''
    const status = part.value?.status
    if (status === PartStatus.ANALYSIS_SKIPPED) return t('partDetail.subSkipped')
    if (status === PartStatus.IN_DETAILED_ANALYSIS) return t('partDetail.subInProgress')
    if (status === PartStatus.PENDING_APPROVAL) return t('partDetail.subInApproval')
    if (currentStep.value > 1 || status === PartStatus.ANALYSIS_COMPLETED) return t('partDetail.completed')
    return t('partDetail.inProgress')
  }
  if (step === 2) {
    if (currentStep.value < 2) return ''
    const status = part.value?.status
    if (status === PartStatus.SCRAP_IN_PROGRESS) return t('partDetail.inProgress')
    return t('partDetail.completed')
  }
  return ''
}

// ANALYSIS_SKIPPED 时将精分析步骤强制显示为"已完成"图标，而非"进行中"
const getStep1Status = () => {
  if (part.value?.status === PartStatus.ANALYSIS_SKIPPED) return 'finish'
  return undefined
}

const getTemplateName = (templateId: string) => {
  return templates.value.find(t => t.id === templateId)?.name || '-'
}

const getReportStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    draft: 'default',
    submitted: 'processing',
    approved: 'success',
    rejected: 'error',
  }
  return colorMap[status] || 'default'
}

const getReportStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    draft: t('partDetail.reportDraft'),
    submitted: t('partDetail.reportPending'),
    approved: t('partDetail.reportApproved'),
    rejected: t('partDetail.reportRejected'),
  }
  return labelMap[status] || status
}


onMounted(async () => {
  part.value = await partApi.getById(partId.value)
  qcNoInput.value = part.value?.qcNo || ''
  const [reports, templateData] = await Promise.all([
    partApi.getReports(partId.value),
    reportsApi.getTemplates(),
    loadUserNameMap(),
  ])
  report.value = reports.length > 0 ? reports[0] : null
  templates.value = templateData
})

const handleBack = () => {
  router.back()
}

const handleEdit = () => {
  router.push(`/return-parts/${partId.value}/edit`)
}

const handleAnalysis = () => {
  analysisVisible.value = true
}

const handleAnalysisSuccess = async () => {
  analysisVisible.value = false
  message.success(t('partDetail.reportSubmitSuccess'))
  // 重新加载 part 和 report，刷新状态步骤条和报告卡片
  const [updatedPart, updatedReports] = await Promise.all([
    partApi.getById(partId.value),
    partApi.getReports(partId.value),
  ])
  part.value = updatedPart
  report.value = updatedReports.length > 0 ? updatedReports[0] : null
}

const handleViewApproval = (partNumber: string) => {
  router.push({ path: '/approval', query: { tab: 'myApplications', openPartNumber: partNumber } })
}

const goToOrder = (e?: Event) => {
  e?.preventDefault()
  if (part.value?.orderId) {
    router.push(`/return-orders/${part.value.orderId}`)
  }
}

const handleViewReport = () => {
  analysisVisible.value = true
}

const handleExportReport = () => {
  exportDebounce.execute(async () => {
    if (!report.value?.id) {
      message.warning(t('analysisForm.pleaseSaveFirst'))
      return
    }
    try {
      const blob = await reportsApi.exportReport(report.value.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${part.value?.partNumber}_${Date.now()}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      message.success(t('message.downloadSuccess'))
    } catch {
      message.error(t('message.exportFailed'))
    }
  })
}
</script>

<style lang="less" scoped>
.part-detail {
  padding: 0;

  .qc-card, .info-card, .vehicle-card, .image-card, .status-card, .report-card {
    margin-bottom: 16px;
  }

  .report-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }
}

.related-order-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #f0f5ff;
  border: 1px solid #adc6ff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #2f54eb;
  font-size: 13px;

  &:hover {
    background: #d6e4ff;
    border-color: #2f54eb;
  }

  .related-order-label {
    color: #8c8c8c;
    font-size: 12px;
  }

  .related-order-number {
    font-weight: 600;
    letter-spacing: 0.3px;
  }
}
</style>

<template>
  <div class="part-detail">
    <a-page-header
      :title="t('partDetail.title', { partNumber: part?.partNumber || t('validation.unsubmitted') })"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button v-if="canEditPart" @click="handleEdit">{{ t('common.edit') }}</a-button>
          <a-button type="primary" @click="handleAnalysis">{{ t('partDetail.analysis') }}</a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- QC No. 录入区（精分析审批/完成及之后状态显示） -->
    <a-card v-if="isQcVisible" class="qc-card" style="margin-bottom: 16px;">
      <a-space>
        <span>{{ t('partDetail.qcNo') }}</span>
        <a-input v-model:value="qcNoInput" :placeholder="t('partDetail.qcNo')" style="width: 200px" />
        <a-button type="primary" @click="handleSubmitQcNo">{{ t('common.submit') }}</a-button>
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
          <a-descriptions :column="2" bordered>
            <a-descriptions-item :label="t('returnPart.partNumber')">
              <a v-if="canEditPart && part?.partNumber" style="color: #1890ff" @click="handleEdit">{{ part.partNumber }}</a>
              <span v-else-if="part?.partNumber" style="color: #1890ff">{{ part.partNumber }}</span>
              <span v-else style="color: #999">{{ t('validation.unsubmitted') }}</span>
            </a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.relatedOrder')">
              <a v-if="part?.orderNumber" style="color: #1890ff; cursor: pointer; text-decoration: underline" @click="goToOrder($event)">{{ part.orderNumber }}</a>
              <span v-else style="color: #999">{{ t('validation.unsubmitted') }}</span>
            </a-descriptions-item>
            <a-descriptions-item :label="t('returnPart.partCode')">{{ part?.partCode }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnPart.businessUnit')">{{ part?.businessUnit }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnPart.productPlatform')">{{ part?.productPlatform }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.productionShift')">{{ part?.productionShift || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.customerFailureType')">{{ part?.failureType || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.boschFailureType')">{{ part?.boschFailureType || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.responsibleEngineer')">{{ part?.responsibleEngineer || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.analyst')" :span="2">{{ part?.analyst || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('common.status')" :span="2">
              <a-tag :color="PART_STATUS_MAP[part?.status || 'in_initial_analysis']?.color || 'default'">
                {{ getStatusLabel(part?.status) }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card :title="t('partDetail.complaintInfo')" class="vehicle-card">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item :label="t('partDetail.repairStation')">{{ part?.repairStation || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.complaintLocation')">{{ part?.complaintLocation || '-' }}</a-descriptions-item>
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
                :src="img"
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
            <a-step :title="t('partDetail.stepDetailedAnalysis')" :description="getStepDescription(1)" />
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
            <a-button type="link" @click="handleExportReport">{{ t('partDetail.exportReport') }}</a-button>
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
import { partApi } from '@/services/partApi'
import { reportsApi } from '@/services/reportsApi'
import { PART_STATUS_MAP, PartStatus } from '@/types'
import type { Part, AnalysisReport, ReportTemplate } from '@/types'
import { usePermissions } from '@/composables/usePermissions'
import AnalysisReportModal from './components/AnalysisReportModal.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isQMCManager } = usePermissions()
const partId = computed(() => route.params.id as string)

const part = ref<Part | null>(null)
const report = ref<AnalysisReport | null>(null)
const templates = ref<ReportTemplate[]>([])
const analysisVisible = ref(false)
const qcNoInput = ref('')

const QC_VISIBLE_STATUSES = [PartStatus.ANALYSIS_COMPLETED, PartStatus.SCRAP_IN_PROGRESS, PartStatus.SCRAPPED]
const isQcVisible = computed(() => part.value ? QC_VISIBLE_STATUSES.includes(part.value.status) : false)

/**
 * 检查当前用户是否有权限编辑已提交的售后件
 *
 * 权限角色：
 * - W_RBCC_AEP_WFAM_QMC_Manager（QMC 经理）
 * - W_RBCC_AEP_WFAM_SystemAdmin（系统管理员）
 *
 * @returns {boolean} 是否有权限编辑已提交的售后件
 */
const canEditPart = computed(() => {
  if (!part.value) return false
  // 未提交的单据所有人都可以编辑
  if (!part.value.partNumber) return true
  // 已提交的单据需要检查权限（当前写死返回true）
  return canEditSubmittedPart()
})

/**
 * 检查当前用户是否有"编辑已提交单据"的权限
 */
const canEditSubmittedPart = (): boolean => {
  return isQMCManager.value
}

const handleSubmitQcNo = async () => {
  if (!qcNoInput.value.trim()) {
    message.warning(t('partDetail.qcNo'))
    return
  }
  await partApi.updateQcNo(partId.value, qcNoInput.value.trim())
  message.success(t('message.saveSuccess'))
}

// 状态步骤映射（3组）
const statusStepMap: Record<PartStatus, number> = {
  [PartStatus.IN_INITIAL_ANALYSIS]: 0,
  [PartStatus.IN_DETAILED_ANALYSIS]: 1,
  [PartStatus.PENDING_APPROVAL]: 1,
  [PartStatus.ANALYSIS_COMPLETED]: 1,
  [PartStatus.SCRAP_IN_PROGRESS]: 2,
  [PartStatus.SCRAPPED]: 2,
}

const currentStep = computed(() => {
  return part.value ? statusStepMap[part.value.status] : 0
})

const getStepDescription = (step: number) => {
  if (step === 0) {
    return currentStep.value > 0 ? t('partDetail.completed') : t('partDetail.inProgress')
  }
  if (step === 1) {
    if (currentStep.value < 1) return ''
    const status = part.value?.status
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

const partStatusI18nKeyMap: Record<string, string> = {
  in_initial_analysis: 'inInitialAnalysis',
  in_detailed_analysis: 'inDetailedAnalysis',
  pending_approval: 'pendingApproval',
  analysis_completed: 'analysisCompleted',
  scrap_in_progress: 'scrapInProgress',
  scrapped: 'scrapped',
}

const getStatusLabel = (status?: string) => {
  if (!status) return '-'
  const i18nKey = partStatusI18nKeyMap[status]
  return i18nKey ? t(`status.${i18nKey}`) : status
}

onMounted(async () => {
  part.value = await partApi.getById(partId.value)
  const [reports, templateData] = await Promise.all([
    partApi.getReports(partId.value),
    reportsApi.getTemplates(),
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

const handleAnalysisSuccess = () => {
  analysisVisible.value = false
  message.success(t('partDetail.reportSubmitSuccess'))
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
  message.info(t('partDetail.viewReportDetails'))
}

const handleExportReport = () => {
  message.success(t('partDetail.reportExportSuccess'))
}
</script>

<style lang="less" scoped>
.part-detail {
  padding: 24px;

  .qc-card, .info-card, .vehicle-card, .image-card, .status-card, .report-card {
    margin-bottom: 16px;
  }

  .report-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }
}
</style>

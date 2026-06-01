<template>
  <div class="analysis-order-detail">
    <a-page-header
      :title="t('analysisOrder.detailTitle', { orderNumber: order?.orderNumber || '' })"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button
            v-if="!is0km && order?.status === 'pending_sampling'"
            type="primary"
            @click="handleSampling(false)"
          >
            {{ t('returnOrder.sampling') }}
          </a-button>
          <a-button
            v-if="!is0km && order?.status !== 'pending_sampling'"
            @click="handleSampling(true)"
          >
            {{ t('returnOrder.viewSamplingResult') }}
          </a-button>
          <a-button
            v-if="canScrap"
            danger
            @click="handleScrap"
          >
            {{ t('returnOrder.scrap') }}
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-watermark
      :content="order?.status === AnalysisOrderStatus.WORKON_SCRAPPED ? t('status.scrapped') : undefined"
      :font="{ color: 'rgba(0,0,0,0.07)', fontSize: 18 }"
    >
    <a-alert
      v-if="is0km"
      :message="t('analysisOrder.zeroKmNotice')"
      type="info"
      show-icon
      style="margin-bottom: 16px"
    />
    <a-row :gutter="16">
      <a-col :span="16">
        <a-card :title="t('orderDetail.basicInfo')" class="info-card">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item :label="t('returnOrder.orderNumber')">
              <a v-if="order?.orderId" style="color: #1677ff" @click="router.push(`/return-orders/${order.orderId}`)">{{ returnOrder?.orderNumber || order?.orderNumber || '-' }}</a>
              <span v-else>{{ returnOrder?.orderNumber || order?.orderNumber || '-' }}</span>
            </a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.customer')">{{ returnOrder?.customer || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.receiveDate')">{{ returnOrder?.receiveDate || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.complaintDate')">{{ returnOrder?.complaintDate || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.returnMethod')">{{ getReturnMethodLabel() }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.trackingNumber')">{{ returnOrder?.trackingNumber || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.complaintType')">
              {{ returnOrder?.complaintType || '-' }}
              <a-tag v-if="isAftermarket(returnOrder?.complaintType)" color="blue" style="margin-left: 8px">{{ t('returnOrder.aftermarketPartTag') }}</a-tag>
              <a-tag v-else-if="returnOrder?.complaintType" color="orange" style="margin-left: 8px">{{ t('returnOrder.is0km') }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.detailedAnalysisQuantity')">{{ returnOrder?.detailedAnalysisQuantity ?? '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('common.status')" :span="2">
              <a-tag :color="ANALYSIS_ORDER_STATUS_MAP[order?.status || 'pending_sampling']?.color || 'default'">
                {{ getStatusLabel(order?.status) }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 售后件列表 -->
        <PartsListCard ref="partsListRef" :order-id="order?.orderId || ''" :analyst="order?.analyst" :analysis-order-status="order?.status" />
      </a-col>

      <a-col :span="8">
        <a-card :title="t('orderDetail.statusFlow')" class="status-card">
          <a-steps direction="vertical" :current="currentStep" size="small">
            <a-step :title="t('analysisOrder.stepPendingSampling')" :description="getStepDescription(0)" />
            <a-step :title="t('analysisOrder.stepDetailedAnalysis')" :description="getStepDescription(1)" />
            <a-step :title="t('analysisOrder.stepWorkonScrap')" :description="getStepDescription(2)" />
          </a-steps>
        </a-card>

        <!-- 报废详情卡片（报废中/已报废时显示） -->
        <a-card
          v-if="isScrapStatus"
          :title="t('analysisOrder.scrapDetail')"
          class="scrap-detail-card"
          style="margin-top: 16px"
        >
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item v-if="order?.scrapStartedAt" :label="t('analysisOrder.scrapStartedAt')">
              {{ formatDateTime(order.scrapStartedAt) }}
            </a-descriptions-item>
            <a-descriptions-item v-if="order?.workonScrapNo" :label="t('message.workonScrapNo')">
              {{ order.workonScrapNo }}
            </a-descriptions-item>
            <a-descriptions-item v-if="isScrapped && order?.statusChangedAt" :label="t('analysisOrder.scrapCompletedAt')">
              {{ formatDateTime(order.statusChangedAt) }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    </a-watermark>

    <!-- 抽样弹窗 -->
    <SamplingModal
      :visible="samplingVisible"
      :order="order"
      :read-only="samplingReadOnly"
      @update:visible="samplingVisible = $event"
      @success="handleSamplingSuccess"
      @no-sampling="handleSamplingSuccess"
    />

    <!-- 报废弹窗 -->
    <ScrapModal
      :visible="scrapVisible"
      :order="order"
      :is0km="is0km"
      @update:visible="scrapVisible = $event"
      @success="handleScrapSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { analysisOrderApi } from '@/services/analysisOrderApi'
import { returnOrderApi } from '@/services/returnOrderApi'
import { ANALYSIS_ORDER_STATUS_MAP, AnalysisOrderStatus, PartStatus } from '@/types'
import type { AnalysisOrder, ReturnOrder } from '@/types'
import SamplingModal from './components/SamplingModal.vue'
import ScrapModal from './components/ScrapModal.vue'
import PartsListCard from '@/components/PartsListCard.vue'
import { isAftermarket } from '@/constants/complaintTypes'
import { useStatusLabels } from '@/composables/useStatusLabels'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id as string)

const order = ref<AnalysisOrder | null>(null)
const returnOrder = ref<ReturnOrder | null>(null)
const is0km = computed(() => {
  if (!returnOrder.value?.complaintType) return false
  return !isAftermarket(returnOrder.value.complaintType)
})
const partsListRef = ref<InstanceType<typeof PartsListCard>>()
const samplingVisible = ref(false)
const samplingReadOnly = ref(false)
const scrapVisible = ref(false)

const loadData = async () => {
  try {
    order.value = await analysisOrderApi.getById(orderId.value)
    if (order.value.orderId) {
      returnOrder.value = await returnOrderApi.getById(order.value.orderId)
    }
  } catch {
    message.error(t('message.loadFailed'))
  }
}

const statusStepMap: Record<string, number> = {
  [AnalysisOrderStatus.PENDING_SAMPLING]: 0,
  [AnalysisOrderStatus.IN_DETAILED_ANALYSIS]: 1,
  [AnalysisOrderStatus.PENDING_APPROVAL]: 1,
  [AnalysisOrderStatus.ANALYSIS_COMPLETED]: 1,
  [AnalysisOrderStatus.WORKON_SCRAP_IN_PROGRESS]: 2,
  [AnalysisOrderStatus.WORKON_SCRAPPED]: 2,
}

const currentStep = computed(() => {
  if (!order.value) return 0
  return statusStepMap[order.value.status] ?? 0
})

const isScrapStatus = computed(() => {
  if (!order.value) return false
  return order.value.status === AnalysisOrderStatus.WORKON_SCRAP_IN_PROGRESS
    || order.value.status === AnalysisOrderStatus.WORKON_SCRAPPED
})

const isScrapped = computed(() => {
  return order.value?.status === AnalysisOrderStatus.WORKON_SCRAPPED
})

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const canScrap = computed(() => {
  if (!order.value) return false

  // 已报废不能报废
  if (order.value.status === AnalysisOrderStatus.WORKON_SCRAPPED) {
    return false
  }

  // 0KM：跳过抽样/分析，直接报废
  if (is0km.value) {
    return true
  }

  // 售后件：待抽样状态不能报废
  if (order.value.status === AnalysisOrderStatus.PENDING_SAMPLING) {
    return false
  }

  // 检查抽样件的精分析完成状态
  const parts = order.value.parts || []
  const sampledParts = parts.filter(p => p.isSample === 1)

  // 如果没有抽样件，允许报废
  if (sampledParts.length === 0) {
    return true
  }

  // 所有抽样件都必须是精分析完成或已进入报废流程
  return sampledParts.every(p =>
    p.status === PartStatus.ANALYSIS_COMPLETED ||
    p.status === PartStatus.SCRAP_IN_PROGRESS ||
    p.status === PartStatus.SCRAPPED
  )
})

const { getAnalysisLabel } = useStatusLabels()
const getStatusLabel = (status?: string) => status ? getAnalysisLabel(status) : '-'

const returnMethodI18nKeyMap: Record<string, string> = {
  express: 'returnOrder.methodExpress',
  pickup: 'returnOrder.methodPickup',
  other: 'returnOrder.methodOther',
}

const getReturnMethodLabel = () => {
  const method = returnOrder.value?.returnMethod
  if (!method) return '-'
  const key = returnMethodI18nKeyMap[method]
  return key ? t(key) : method
}

const getStepDescription = (step: number) => {
  if (step === 0) {
    return currentStep.value > 0 ? t('orderDetail.completed') : t('orderDetail.inProgress')
  }
  if (step === 1) {
    if (currentStep.value < 1) return ''
    const status = order.value?.status
    if (status === AnalysisOrderStatus.IN_DETAILED_ANALYSIS) return t('analysisOrder.subInProgress')
    if (status === AnalysisOrderStatus.PENDING_APPROVAL) return t('analysisOrder.subInApproval')
    if (currentStep.value > 1 || status === AnalysisOrderStatus.ANALYSIS_COMPLETED) return t('orderDetail.completed')
    return t('orderDetail.inProgress')
  }
  if (step === 2) {
    if (currentStep.value < 2) return ''
    const status = order.value?.status
    if (status === AnalysisOrderStatus.WORKON_SCRAP_IN_PROGRESS) return t('orderDetail.inProgress')
    return t('orderDetail.completed')
  }
  return ''
}

const handleSampling = (readOnly: boolean) => {
  samplingReadOnly.value = readOnly
  samplingVisible.value = true
}

const handleSamplingSuccess = async () => {
  await loadData()
  partsListRef.value?.refresh()
}

const handleScrap = () => {
  scrapVisible.value = true
}

const handleScrapSuccess = () => loadData()

const handleBack = () => {
  router.back()
}

onMounted(loadData)
</script>

<style lang="less" scoped>
.analysis-order-detail {
  padding: 0;

  .info-card, .parts-card, .status-card {
    margin-bottom: 16px;
  }
}
</style>

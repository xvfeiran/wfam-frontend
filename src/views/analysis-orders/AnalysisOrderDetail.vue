<template>
  <div class="analysis-order-detail">
    <a-page-header
      :title="t('analysisOrder.detailTitle', { orderNumber: order?.orderNumber || '' })"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button
            v-if="order?.status === 'pending_sampling'"
            type="primary"
            @click="handleSampling(false)"
          >
            {{ t('returnOrder.sampling') }}
          </a-button>
          <a-button
            v-if="order?.status !== 'pending_sampling'"
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
          <a-button
            v-if="order?.status === 'workon_scrap_in_progress'"
            type="primary"
            @click="handleWorkonConfirm"
          >
            {{ t('analysisOrder.workonConfirm') }}
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="16">
      <a-col :span="16">
        <a-card :title="t('orderDetail.basicInfo')" class="info-card">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item :label="t('analysisOrder.orderNumber')">
              {{ order?.orderNumber || '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('partDetail.analyst')">
              {{ order?.analyst || '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('common.status')" :span="2">
              <a-tag :color="ANALYSIS_ORDER_STATUS_MAP[order?.status || 'pending_sampling']?.color || 'default'">
                {{ getStatusLabel(order?.status) }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 售后件列表 -->
        <PartsListCard :parts="order?.parts || []" show-sample-status />
      </a-col>

      <a-col :span="8">
        <a-card :title="t('orderDetail.statusFlow')" class="status-card">
          <a-steps direction="vertical" :current="currentStep" size="small">
            <a-step :title="t('analysisOrder.statusPendingSampling')" :description="getStepDescription(0)" />
            <a-step :title="t('analysisOrder.statusInDetailedAnalysis')" :description="getStepDescription(1)" />
            <a-step :title="t('analysisOrder.statusPendingApproval')" :description="getStepDescription(2)" />
            <a-step :title="t('analysisOrder.statusAnalysisCompleted')" :description="getStepDescription(3)" />
            <a-step :title="t('analysisOrder.statusWorkonScrapInProgress')" :description="getStepDescription(4)" />
            <a-step :title="t('analysisOrder.statusWorkonScrapped')" :description="getStepDescription(5)" />
          </a-steps>
        </a-card>
      </a-col>
    </a-row>

    <!-- 抽样弹窗 -->
    <SamplingModal
      :visible="samplingVisible"
      :order="order"
      :read-only="samplingReadOnly"
      @update:visible="samplingVisible = $event"
      @success="handleSamplingSuccess"
      @no-sampling="handleSamplingSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { analysisOrderApi } from '@/services/analysisOrderApi'
import { ANALYSIS_ORDER_STATUS_MAP, AnalysisOrderStatus } from '@/types'
import type { AnalysisOrder } from '@/types'
import SamplingModal from './components/SamplingModal.vue'
import PartsListCard from '@/components/PartsListCard.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id as string)

const order = ref<AnalysisOrder | null>(null)
const samplingVisible = ref(false)
const samplingReadOnly = ref(false)

const statusStepMap: Record<string, number> = {
  [AnalysisOrderStatus.PENDING_SAMPLING]: 0,
  [AnalysisOrderStatus.IN_DETAILED_ANALYSIS]: 1,
  [AnalysisOrderStatus.PENDING_APPROVAL]: 2,
  [AnalysisOrderStatus.ANALYSIS_COMPLETED]: 3,
  [AnalysisOrderStatus.WORKON_SCRAP_IN_PROGRESS]: 4,
  [AnalysisOrderStatus.WORKON_SCRAPPED]: 5,
}

const currentStep = computed(() => {
  if (!order.value) return 0
  if (order.value.status === AnalysisOrderStatus.WORKON_SCRAPPED) return 6
  return statusStepMap[order.value.status] ?? 0
})

const canScrap = computed(() => {
  if (!order.value) return false
  return ![
    AnalysisOrderStatus.WORKON_SCRAP_IN_PROGRESS,
    AnalysisOrderStatus.WORKON_SCRAPPED,
    AnalysisOrderStatus.PENDING_SAMPLING,
  ].includes(order.value.status as AnalysisOrderStatus)
})

const statusKeyMap: Record<string, string> = {
  pending_sampling: 'analysisOrder.statusPendingSampling',
  in_detailed_analysis: 'analysisOrder.statusInDetailedAnalysis',
  pending_approval: 'analysisOrder.statusPendingApproval',
  analysis_completed: 'analysisOrder.statusAnalysisCompleted',
  workon_scrap_in_progress: 'analysisOrder.statusWorkonScrapInProgress',
  workon_scrapped: 'analysisOrder.statusWorkonScrapped',
}

const getStatusLabel = (status?: string) => {
  if (!status) return '-'
  const key = statusKeyMap[status]
  return key ? t(key) : status
}

const getStepDescription = (step: number) => {
  if (step < currentStep.value) return t('orderDetail.completed')
  if (step === currentStep.value) return t('orderDetail.inProgress')
  return ''
}

const handleSampling = (readOnly: boolean) => {
  samplingReadOnly.value = readOnly
  samplingVisible.value = true
}

const handleSamplingSuccess = async () => {
  try {
    order.value = await analysisOrderApi.getById(orderId.value)
  } catch {
    message.error(t('message.loadFailed'))
  }
}

const handleScrap = async () => {
  try {
    order.value = await analysisOrderApi.scrap(orderId.value)
    message.success(t('message.scrapSubmitted'))
  } catch {
    message.error(t('message.scrapFailed'))
  }
}

const handleWorkonConfirm = async () => {
  try {
    order.value = await analysisOrderApi.workonConfirm(orderId.value)
    message.success(t('message.scrapStatusMarked'))
  } catch {
    message.error(t('message.saveFailed'))
  }
}

const handleBack = () => {
  router.back()
}

onMounted(async () => {
  try {
    order.value = await analysisOrderApi.getById(orderId.value)
  } catch {
    message.error(t('message.loadFailed'))
  }
})
</script>

<style lang="less" scoped>
.analysis-order-detail {
  padding: 24px;

  .info-card, .parts-card, .status-card {
    margin-bottom: 16px;
  }
}
</style>

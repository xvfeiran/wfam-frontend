<template>
  <div class="order-detail">
    <a-page-header
      :title="t('orderDetail.title', { orderNumber: order?.orderNumber })"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="handleEdit">{{ t('common.edit') }}</a-button>
          <a-button v-if="order?.status === 'draft'" type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
          <a-button v-if="order?.status === 'in_initial_analysis'" type="primary" @click="handleSampling">{{ t('returnOrder.sampling') }}</a-button>
          <a-button v-if="order?.status === 'analysis_completed'" danger @click="handleScrap">
            <StopOutlined /> {{ t('returnOrder.scrap') }}
          </a-button>
          <a-button v-if="order?.status === 'scrap_in_progress'" type="primary" @click="handleWorkonConfirm">{{ t('orderDetail.stepScrapped') }}</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="16">
      <!-- 左侧：基本信息 -->
      <a-col :span="16">
        <a-card :title="t('orderDetail.basicInfo')" class="info-card">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item :label="t('returnOrder.orderNumber')">{{ order?.orderNumber }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.customer')">{{ order?.customer }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.receiveDate')">{{ order?.receiveDate }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.complaintDate')">{{ order?.complaintDate }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.returnMethod')">{{ getReturnMethodLabel() }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.trackingNumber')">{{ order?.trackingNumber || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.returnQuantity')">{{ order?.returnQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.detailedAnalysisQuantity')">{{ order?.detailedAnalysisQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.scrappedQuantity')">{{ order?.scrappedQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.qcCreatedQuantity')">{{ order?.qcCreatedQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.qcNotCreatedQuantity')">{{ order?.qcNotCreatedQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('common.status')" :span="2">
              <a-tag :color="ORDER_STATUS_MAP[order?.status || 'draft']?.color || 'default'">
                {{ getStatusLabel() }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 售后件列表 -->
        <a-card :title="t('orderDetail.partsList')" class="parts-card">
          <a-table
            :columns="partColumns"
            :data-source="parts"
            :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total: number) => t('common.total', { total }) }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'partNumber'">
                <a @click="goToPartDetail(record.id)">{{ record.partNumber }}</a>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="PART_STATUS_MAP[record.status]?.color || 'default'">
                  {{ getStatusLabel(record.status) }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <!-- 右侧：状态追溯 -->
      <a-col :span="8">
        <a-card :title="t('orderDetail.statusFlow')" class="status-card">
          <a-steps direction="vertical" :current="currentStep" size="small">
            <a-step :title="t('orderDetail.stepDraft')" :description="getStepDescription(0)" />
            <a-step :title="t('orderDetail.stepInInitialAnalysis')" :description="getStepDescription(1)" />
            <a-step :title="t('orderDetail.stepInDetailedAnalysis')" :description="getStepDescription(2)" />
            <a-step :title="t('orderDetail.stepPendingApproval')" :description="getStepDescription(3)" />
            <a-step :title="t('orderDetail.stepAnalysisCompleted')" :description="getStepDescription(4)" />
            <a-step :title="t('orderDetail.stepScrapInProgress')" :description="getStepDescription(5)" />
            <a-step :title="t('orderDetail.stepScrapped')" :description="getStepDescription(6)" />
          </a-steps>
        </a-card>
      </a-col>
    </a-row>

    <!-- 抽样弹窗 -->
    <SamplingModal
      v-model:visible="samplingVisible"
      :order="order"
      @success="handleSamplingSuccess"
      @no-sampling="handleNoSamplingSuccess"
    />

    <!-- 报废弹窗 -->
    <ScrapModal
      v-model:visible="scrapVisible"
      :selected-ids="order ? [order.id] : []"
      @success="handleScrapSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { StopOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { ORDER_STATUS_MAP, PART_STATUS_MAP, RETURN_METHOD_MAP, OrderStatus } from '@/types'
import type { ReturnOrder, Part } from '@/types'
import SamplingModal from './components/SamplingModal.vue'
import ScrapModal from './components/ScrapModal.vue'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id as string)

const order = ref<ReturnOrder | null>(null)
const parts = ref<Part[]>([])
const samplingVisible = ref(false)
const scrapVisible = ref(false)

// 状态步骤映射
const statusStepMap: Record<OrderStatus, number> = {
  [OrderStatus.DRAFT]: 0,
  [OrderStatus.IN_INITIAL_ANALYSIS]: 1,
  [OrderStatus.IN_DETAILED_ANALYSIS]: 2,
  [OrderStatus.PENDING_APPROVAL]: 3,
  [OrderStatus.ANALYSIS_COMPLETED]: 4,
  [OrderStatus.SCRAP_IN_PROGRESS]: 5,
  [OrderStatus.SCRAPPED]: 6,
}

const currentStep = computed(() => {
  return order.value ? statusStepMap[order.value.status] : 0
})

const partColumns = computed(() => [
  { title: t('returnPart.partNumber'), dataIndex: 'partNumber', key: 'partNumber' },
  { title: t('returnPart.partCode'), dataIndex: 'partCode', key: 'partCode' },
  { title: t('returnPart.businessUnit'), dataIndex: 'businessUnit', key: 'businessUnit' },
  { title: t('returnPart.productPlatform'), dataIndex: 'productPlatform', key: 'productPlatform' },
  { title: t('common.status'), dataIndex: 'status', key: 'status' },
])

// 状态到i18n键的映射
const returnOrderStatusI18nKeyMap: Record<string, string> = {
  draft: 'status.draft',
  in_initial_analysis: 'status.inInitialAnalysis',
  in_detailed_analysis: 'status.inDetailedAnalysis',
  pending_approval: 'status.pendingApproval',
  analysis_completed: 'status.analysisCompleted',
  scrap_in_progress: 'status.scrapInProgress',
  scrapped: 'status.scrapped',
}

// 获取翻译后的状态标签（退货单）
const getStatusLabel = (status?: string) => {
  const key = returnOrderStatusI18nKeyMap[status || order.value?.status || 'draft']
  return key ? t(key) : status || order.value?.status || ''
}

// 退回方式到i18n键的映射
const returnMethodI18nKeyMap: Record<string, string> = {
  express: 'returnOrder.methodExpress',
  pickup: 'returnOrder.methodPickup',
  other: 'returnOrder.methodOther',
}

// 获取翻译后的退回方式标签
const getReturnMethodLabel = () => {
  const method = order.value?.returnMethod || 'express'
  const key = returnMethodI18nKeyMap[method]
  return key ? t(key) : RETURN_METHOD_MAP[method]
}

const getStepDescription = (step: number) => {
  if (step < currentStep.value) {
    return t('orderDetail.completed')
  } else if (step === currentStep.value) {
    return t('orderDetail.inProgress')
  }
  return ''
}

onMounted(async () => {
  // 加载退货单数据
  order.value = await returnOrderApi.getById(orderId.value)
  if (order.value) {
    parts.value = await returnOrderApi.getParts(orderId.value)
  }
})

const handleBack = () => {
  router.back()
}

const handleEdit = () => {
  router.push(`/return-orders/${orderId.value}/edit`)
}

const handleSubmit = async () => {
  try {
    order.value = await returnOrderApi.submit(orderId.value)
    message.success(t('message.submitSuccess'))
  } catch {
    message.error(t('message.submitSuccess'))
  }
}

const handleSampling = () => {
  samplingVisible.value = true
}

const handleSamplingSuccess = async () => {
  message.success(t('message.samplingComplete'))
  order.value = await returnOrderApi.getById(orderId.value)
}

const handleNoSamplingSuccess = async () => {
  message.success(t('message.noSamplingSuccess'))
  order.value = await returnOrderApi.getById(orderId.value)
}

const handleScrap = () => {
  scrapVisible.value = true
}

const handleScrapSuccess = async () => {
  scrapVisible.value = false
  message.success(t('message.scrapStatusMarked'))
  order.value = await returnOrderApi.getById(orderId.value)
}

const handleWorkonConfirm = async () => {
  try {
    order.value = await returnOrderApi.workonConfirm(orderId.value)
    message.success(t('message.scrapStatusMarked'))
  } catch {
    message.error(t('message.scrapStatusMarked'))
  }
}

const goToPartDetail = (id: string) => {
  router.push(`/return-parts/${id}`)
}
</script>

<style lang="less" scoped>
.order-detail {
  padding: 24px;

  .info-card, .parts-card, .status-card {
    margin-bottom: 16px;
  }
}
</style>

<template>
  <div class="order-detail">
    <a-page-header
      :title="t('orderDetail.title', { orderNumber: order?.orderNumber })"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="handleEdit">{{ t('common.edit') }}</a-button>
          <a-button type="primary" @click="handleSampling">{{ t('returnOrder.sampling') }}</a-button>
          <a-button danger @click="handleScrap">
            <StopOutlined /> {{ t('returnOrder.scrap') }}
          </a-button>
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
            <a-descriptions-item :label="t('returnOrder.initialAnalysisQuantity')">{{ order?.initialAnalysisQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.detailedAnalysisQuantity')">{{ order?.detailedAnalysisQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.scrappedQuantity')">{{ order?.scrappedQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.qcCreatedQuantity')">{{ order?.qcCreatedQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.qcNotCreatedQuantity')">{{ order?.qcNotCreatedQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('common.status')" :span="2">
              <a-tag :color="ORDER_STATUS_MAP[order?.status || 'pending_registration'].color">
                {{ getStatusLabel() }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.description')" :span="2">{{ order?.description || '-' }}</a-descriptions-item>
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
                <a-tag :color="PART_STATUS_MAP[record.status].color">
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
            <a-step :title="t('orderDetail.stepRegistered')" :description="getStepDescription(0)" />
            <a-step :title="t('orderDetail.stepPendingInitialAnalysis')" :description="getStepDescription(1)" />
            <a-step :title="t('orderDetail.stepPendingSampling')" :description="getStepDescription(2)" />
            <a-step :title="t('orderDetail.stepPendingDetailedAnalysis')" :description="getStepDescription(3)" />
            <a-step :title="t('orderDetail.stepInDetailedAnalysis')" :description="getStepDescription(4)" />
            <a-step :title="t('orderDetail.stepPendingApproval')" :description="getStepDescription(5)" />
            <a-step :title="t('orderDetail.stepCompleted')" :description="getStepDescription(6)" />
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
  [OrderStatus.PENDING_REGISTRATION]: 0,
  [OrderStatus.PENDING_INITIAL_ANALYSIS]: 1,
  [OrderStatus.PENDING_SAMPLING]: 2,
  [OrderStatus.SAMPLING_COMPLETED]: 3,
  [OrderStatus.PENDING_DETAILED_ANALYSIS]: 3,
  [OrderStatus.IN_DETAILED_ANALYSIS]: 4,
  [OrderStatus.PENDING_APPROVAL]: 5,
  [OrderStatus.APPROVED]: 6,
  [OrderStatus.PENDING_SCRAP]: 6,
  [OrderStatus.SCRAPPED]: 6,
  [OrderStatus.COMPLETED]: 6,
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
  pending_registration: 'status.pendingRegistration',
  pending_initial_analysis: 'status.pendingInitialAnalysis',
  pending_sampling: 'status.pendingSampling',
  sampling_completed: 'status.samplingCompleted',
  pending_detailed_analysis: 'status.pendingDetailedAnalysis',
  in_detailed_analysis: 'status.inDetailedAnalysis',
  pending_approval: 'status.pendingApproval',
  approved: 'status.approved',
  pending_scrap: 'status.pendingScrap',
  scrapped: 'status.scrapped',
  completed: 'status.completed',
}

// 获取翻译后的状态标签（退货单）
const getStatusLabel = (status?: string) => {
  const key = returnOrderStatusI18nKeyMap[status || order.value?.status || 'pending_registration']
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

const handleScrapSuccess = () => {
  scrapVisible.value = false
  message.success(t('message.scrapStatusMarked'))
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

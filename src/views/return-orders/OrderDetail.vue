<template>
  <div class="order-detail">
    <a-page-header
      :title="t('orderDetail.title', { orderNumber: order?.orderNumber || t('validation.unsubmitted') })"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button v-if="canShowEditButton && order?.status !== 'scrapped'" @click="handleEdit">{{ t('common.edit') }}</a-button>
          <a-button v-if="order?.status === 'draft'" type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-alert
      v-if="order?.status === 'scrapped'"
      type="error"
      :message="t('returnOrder.scrappedSummary', { scrapped: scrappedSummary.scrapped, total: scrappedSummary.total })"
      show-icon
      style="margin-bottom: 16px"
    />

    <a-row :gutter="16">
      <!-- 左侧：基本信息 -->
      <a-col :span="16">
        <a-card :title="t('orderDetail.basicInfo')" class="info-card">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item :label="t('returnOrder.orderNumber')">
              <span v-if="order?.orderNumber">{{ order.orderNumber }}</span>
              <span v-else style="color: #999">{{ t('validation.unsubmitted') }}</span>
            </a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.customer')">{{ order?.customer }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.receiveDate')">{{ order?.receiveDate }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.complaintDate')">{{ order?.complaintDate }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.returnMethod')">{{ getReturnMethodLabel() }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.trackingNumber')">{{ order?.trackingNumber || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.returnQuantity')">{{ order?.returnQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('returnOrder.complaintType')">
              {{ order?.complaintType || '-' }}
              <a-tag v-if="isAftermarket(order?.complaintType)" color="blue" style="margin-left: 8px">{{ t('returnOrder.aftermarketPartTag') }}</a-tag>
              <a-tag v-else-if="order?.complaintType" color="orange" style="margin-left: 8px">{{ t('returnOrder.is0km') }}</a-tag>
            </a-descriptions-item>
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
        <PartsListCard ref="partsListRef" :order-id="orderId" :from-order-detail="true">
          <template #headerExtra>
            <a-button v-if="canAddPart" type="primary" size="small" @click="handleAddPart">
              <PlusOutlined /> {{ t('common.create') }}
            </a-button>
          </template>
        </PartsListCard>
      </a-col>

      <!-- 右侧：状态追溯 -->
      <a-col :span="8">
        <a-card :title="t('orderDetail.statusFlow')" class="status-card">
          <a-steps direction="vertical" :current="currentStep" size="small">
            <a-step :title="t('orderDetail.stepDraft')" :description="getStepDescription(0)" />
            <a-step :title="t('orderDetail.stepSubmitted')" :description="getStepDescription(1)" />
          </a-steps>
        </a-card>
      </a-col>
    </a-row>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { ORDER_STATUS_MAP, RETURN_METHOD_MAP, OrderStatus } from '@/types'
import type { ReturnOrder } from '@/types'
import { usePermissions } from '@/composables/usePermissions'
import { useStatusLabels } from '@/composables/useStatusLabels'
import { isAftermarket } from '@/constants/complaintTypes'
import PartsListCard from '@/components/PartsListCard.vue'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id as string)

const order = ref<ReturnOrder | null>(null)
const isMounted = ref(true)
const partsListRef = ref<InstanceType<typeof PartsListCard>>()
const scrappedSummary = ref({ total: 0, scrapped: 0 })

// 刷新数据的函数（用于从子页面返回时调用）
const refreshData = async () => {
  try {
    if (orderId.value && isMounted.value) {
      order.value = await returnOrderApi.getById(orderId.value)
      if (order.value.status === 'scrapped') {
        try {
          scrappedSummary.value = await returnOrderApi.getScrappedSummary(orderId.value)
        } catch (error) {
          console.error('Failed to fetch scrapped summary:', error)
        }
      }
      partsListRef.value?.refresh()
    }
  } catch (error) {
    if (isMounted.value) {
      console.error('Failed to refresh data:', error)
    }
  }
}

// 状态步骤映射（v3.1 添加已报废状态）
const statusStepMap: Record<string, number> = {
  [OrderStatus.DRAFT]: 0,
  [OrderStatus.SUBMITTED]: 1,
  [OrderStatus.SCRAPPED]: 1,
}

const currentStep = computed(() => {
  if (!order.value) return 0
  if (order.value.status === OrderStatus.SUBMITTED) {
    return 2 // 比最大步骤索引1大1，显示为"已完成"
  }
  return statusStepMap[order.value.status] ?? 0
})

// Permission check for edit button
const { canEditSubmittedForm } = usePermissions()

// Edit button visibility logic:
// - Draft orders (no orderNumber): visible to everyone
// - Submitted orders (has orderNumber): only visible to QMC Leader
const canShowEditButton = computed(() => {
  if (!order.value?.orderNumber) return true
  return canEditSubmittedForm.value
})

// Add part button visibility logic:
// - Only draft and submitted status can add parts (scrapped orders cannot add parts)
const canAddPart = computed(() => {
  if (!order.value) return false
  return order.value.status === 'draft' || order.value.status === 'submitted'
})

const { getOrderLabel } = useStatusLabels()
const getStatusLabel = (status?: string) => {
  const s = status || order.value?.status || 'draft'
  return s ? getOrderLabel(s) : ''
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
  try {
    order.value = await returnOrderApi.getById(orderId.value)
    if (order.value.status === 'scrapped') {
      try {
        scrappedSummary.value = await returnOrderApi.getScrappedSummary(orderId.value)
      } catch (error) {
        console.error('Failed to fetch scrapped summary:', error)
      }
    }
  } catch (error) {
    console.error('Error during component mount:', error)
  }
})

onUnmounted(() => {
  isMounted.value = false
})

// 监听路由变化，从新建售后件页面返回时刷新数据
watch(orderId, async () => {
  if (!isMounted.value) return
  order.value = await returnOrderApi.getById(orderId.value)
})

// 监听路由参数变化（如从新建售后件返回）
watch(() => route.fullPath, async () => {
  if (isMounted.value && route.name === 'ReturnOrderDetail') {
    await refreshData()
  }
})

const handleBack = () => {
  router.back()
}

const handleEdit = () => {
  router.push(`/return-orders/${orderId.value}/edit`)
}

const confirmSubmit = () => {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: t('common.tip'),
      content: t('message.submitConfirmWarning'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}

const handleSubmit = async () => {
  const confirmed = await confirmSubmit()
  if (!confirmed) return

  try {
    order.value = await returnOrderApi.submit(orderId.value)
    message.success(t('message.submitSuccess'))
  } catch {
    message.error(t('message.submitSuccess'))
  }
}

const handleAddPart = () => {
  router.push({
    path: '/return-parts/new',
    query: { orderId: orderId.value, fromOrderDetail: 'true' }
  })
}
</script>

<style lang="less" scoped>
.order-detail {
  padding: 0;

  .info-card, .status-card {
    margin-bottom: 16px;
  }
}
</style>

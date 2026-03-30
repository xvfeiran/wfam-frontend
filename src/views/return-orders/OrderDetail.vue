<template>
  <div class="order-detail">
    <a-page-header
      :title="t('orderDetail.title', { orderNumber: order?.orderNumber || t('validation.unsubmitted') })"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button v-if="canShowEditButton" @click="handleEdit">{{ t('common.edit') }}</a-button>
          <a-button v-if="order?.status === 'draft'" type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
        </a-space>
      </template>
    </a-page-header>

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
              <a-tag v-if="order?.complaintType === 'BA40'" color="blue" style="margin-left: 8px">{{ t('returnOrder.aftermarketPartTag') }}</a-tag>
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
        <PartsListCard :parts="parts" :loading="loadingParts">
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
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { ORDER_STATUS_MAP, RETURN_METHOD_MAP, OrderStatus } from '@/types'
import type { ReturnOrder, Part } from '@/types'
import { usePermissions } from '@/composables/usePermissions'
import PartsListCard from '@/components/PartsListCard.vue'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id as string)

const order = ref<ReturnOrder | null>(null)
const parts = ref<Part[]>([])
const loadingParts = ref(false)
const isMounted = ref(true)

// 加载订单的售后件列表（全量加载，搜索/排序/分页由 PartsListCard 处理）
const loadParts = async () => {
  if (!orderId.value) return
  loadingParts.value = true
  try {
    const result = await returnOrderApi.getParts(orderId.value)
    if (isMounted.value) {
      parts.value = result
    }
  } catch (error) {
    if (isMounted.value) {
      console.error('Failed to load parts:', error)
      message.error(t('message.loadFailed'))
    }
  } finally {
    if (isMounted.value) {
      loadingParts.value = false
    }
  }
}

// 刷新数据的函数（用于从子页面返回时调用）
const refreshData = async () => {
  try {
    if (orderId.value && isMounted.value) {
      order.value = await returnOrderApi.getById(orderId.value)
      if (order.value && isMounted.value) {
        await loadParts()
      }
    }
  } catch (error) {
    if (isMounted.value) {
      console.error('Failed to refresh data:', error)
    }
  }
}

// 状态步骤映射（v3.0 简化为 2 步）
const statusStepMap: Record<string, number> = {
  [OrderStatus.DRAFT]: 0,
  [OrderStatus.SUBMITTED]: 1,
}

const currentStep = computed(() => {
  if (!order.value) return 0
  if (order.value.status === OrderStatus.SUBMITTED) {
    return 2 // 比最大步骤索引1大1，显示为"已完成"
  }
  return statusStepMap[order.value.status] ?? 0
})

// Permission check for edit button
const { isQMCManager } = usePermissions()

// Edit button visibility logic:
// - Draft orders (no orderNumber): visible to everyone
// - Submitted orders (has orderNumber): only visible to QMC Manager
const canShowEditButton = computed(() => {
  if (!order.value?.orderNumber) return true
  return isQMCManager.value
})

// Add part button visibility logic:
// - Only draft and submitted status can add parts
const canAddPart = computed(() => {
  if (!order.value) return false
  return order.value.status === 'draft' || order.value.status === 'submitted'
})

// 状态到i18n键的映射
const returnOrderStatusI18nKeyMap: Record<string, string> = {
  draft: 'status.draft',
  submitted: 'status.submitted',
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
  try {
    order.value = await returnOrderApi.getById(orderId.value)
    if (order.value) {
      await loadParts()
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
  if (order.value && isMounted.value) {
    await loadParts()
  }
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

const handleSubmit = async () => {
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
  padding: 24px;

  .info-card, .status-card {
    margin-bottom: 16px;
  }
}
</style>

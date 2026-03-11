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
        <a-card class="parts-card">
          <template #title>
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span>{{ t('orderDetail.partsList') }}</span>
              <a-button type="primary" size="small" @click="handleAddPart">
                <PlusOutlined /> {{ t('common.create') }}
              </a-button>
            </div>
          </template>
          <a-table
            :columns="partColumns"
            :data-source="paginatedParts"
            :pagination="partsPagination"
            row-key="id"
            :custom-row="customPartRow"
            @change="handlePartsTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="PART_STATUS_MAP[record.status]?.color || 'default'">
                  {{ getPartStatusLabel(record.status) }}
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
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { StopOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { partApi } from '@/services/partApi'
import { ORDER_STATUS_MAP, PART_STATUS_MAP, RETURN_METHOD_MAP, OrderStatus } from '@/types'
import type { ReturnOrder, Part } from '@/types'
import SamplingModal from './components/SamplingModal.vue'
import ScrapModal from './components/ScrapModal.vue'
import { usePermissions } from '@/composables/usePermissions'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id as string)

const order = ref<ReturnOrder | null>(null)
const parts = ref<Part[]>([])
const samplingVisible = ref(false)
const scrapVisible = ref(false)

// 售后件列表分页配置
const partsPagination = ref({
  current: 1,
  pageSize: 10,
  total: parts.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => t('common.total', { total }),
})

// 售后件列表排序配置
const partsSorter = ref<{
  columnKey?: string
  order?: 'ascend' | 'descend' | null
}>({
  columnKey: undefined,
  order: null,
})

// 排序后的售后件数据
const sortedParts = computed(() => {
  if (!partsSorter.value.columnKey || !partsSorter.value.order) {
    return parts.value
  }

  const { columnKey, order } = partsSorter.value
  const sorted = [...parts.value].sort((a: any, b: any) => {
    const aVal = a[columnKey] || ''
    const bVal = b[columnKey] || ''

    // 处理特殊字段
    if (columnKey === 'partNumber') {
      // 未提交的排在最后
      const aHasNumber = !!a.partNumber
      const bHasNumber = !!b.partNumber
      if (!aHasNumber && bHasNumber) return 1
      if (aHasNumber && !bHasNumber) return -1
    }

    const result = String(aVal).localeCompare(String(bVal))
    return order === 'ascend' ? result : -result
  })

  return sorted
})

// 分页后的售后件数据（前端分页）
const paginatedParts = computed(() => {
  const { current, pageSize } = partsPagination.value
  const start = (current - 1) * pageSize
  const end = start + pageSize
  return sortedParts.value.slice(start, end)
})

// 售后件表格变化处理
const handlePartsTableChange = (pagination: any, filters: any, sorter: any) => {
  partsPagination.value.pageSize = pagination.pageSize

  // 检查排序是否发生变化
  const sortChanged = (sorter.columnKey !== partsSorter.value.columnKey) ||
                      (sorter.order !== partsSorter.value.order)

  // 更新排序状态
  partsSorter.value = {
    columnKey: sorter.columnKey,
    order: sorter.order,
  }

  // 如果排序发生变化，重置到第一页；否则使用传入的页码
  if (sortChanged) {
    partsPagination.value.current = 1
  } else {
    partsPagination.value.current = pagination.current
  }
}

// 刷新数据的函数（用于从子页面返回时调用）
const refreshData = async () => {
  if (orderId.value) {
    order.value = await returnOrderApi.getById(orderId.value)
    if (order.value) {
      parts.value = await returnOrderApi.getParts(orderId.value)
      partsPagination.value.total = parts.value.length
      // 检查当前页是否超出范围
      const maxPage = Math.ceil(partsPagination.value.total / partsPagination.value.pageSize) || 1
      if (partsPagination.value.current > maxPage) {
        partsPagination.value.current = maxPage
      }
    }
  }
}

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

// Permission check for edit button
const { isQMCManager } = usePermissions()

// Edit button visibility logic:
// - Draft orders (no orderNumber): visible to everyone
// - Submitted orders (has orderNumber): only visible to QMC Manager
const canShowEditButton = computed(() => {
  // Draft orders can be edited by everyone
  if (!order.value?.orderNumber) return true
  // Submitted orders only visible to QMC Manager
  return isQMCManager.value
})

const partColumns = computed(() => [
  {
    title: t('returnPart.partNumber'),
    dataIndex: 'partNumber',
    key: 'partNumber',
    sorter: (a: Part, b: Part) => {
      const aVal = a.partNumber || ''
      const bVal = b.partNumber || ''
      return aVal.localeCompare(bVal)
    },
    customRender: ({ record }: { record: Part }) => {
      const text = record.partNumber || t('validation.unsubmitted')
      if (!record.partNumber) {
        return h('span', { style: { color: '#999' } }, text)
      }
      return h('a', {
        style: { color: '#1890ff' },
        onClick: (e: Event) => {
          e.stopPropagation()
          goToPartDetail(record.id)
        }
      }, text)
    }
  },
  {
    title: t('returnPart.partCode'),
    dataIndex: 'partCode',
    key: 'partCode',
    sorter: (a: Part, b: Part) => (a.partCode || '').localeCompare(b.partCode || ''),
  },
  {
    title: t('returnPart.businessUnit'),
    dataIndex: 'businessUnit',
    key: 'businessUnit',
    sorter: (a: Part, b: Part) => (a.businessUnit || '').localeCompare(b.businessUnit || ''),
  },
  {
    title: t('returnPart.productPlatform'),
    dataIndex: 'productPlatform',
    key: 'productPlatform',
    sorter: (a: Part, b: Part) => (a.productPlatform || '').localeCompare(b.productPlatform || ''),
  },
  {
    title: t('common.status'),
    dataIndex: 'status',
    key: 'status',
    sorter: (a: Part, b: Part) => (a.status || '').localeCompare(b.status || ''),
  },
  {
    title: t('common.operation'),
    key: 'action',
    width: 150,
    customRender: ({ record }: { record: Part }) => {
      // 未提交的售后件显示编辑和删除按钮
      if (!record.partNumber) {
        return h('span', { style: { fontSize: '12px' } }, [
          h('a', {
            style: { color: '#1890ff', marginRight: '8px' },
            onClick: (e: Event) => {
              e.stopPropagation()
              handleEditPart(record.id)
            }
          }, t('common.edit')),
          h('a', {
            style: { color: '#ff4d4f' },
            onClick: (e: Event) => {
              e.stopPropagation()
              // 直接删除，不需要确认
              handleDeletePart(record.id)
            }
          }, t('common.delete'))
        ])
      }
      return h('span', { style: { color: '#999' } }, '-')
    }
  },
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

// 获取翻译后的状态标签（售后件）
const getPartStatusLabel = (status?: string) => {
  if (!status) return ''
  const key = statusKeyMap[status]
  return key ? t(`status.${key}`) : status
}

// 售后件状态映射
const statusKeyMap: Record<string, string> = {
  in_initial_analysis: 'inInitialAnalysis',
  in_detailed_analysis: 'inDetailedAnalysis',
  pending_approval: 'pendingApproval',
  analysis_completed: 'analysisCompleted',
  scrap_in_progress: 'scrapInProgress',
  scrapped: 'scrapped',
}

// 整行点击进入售后件详情
const customPartRow = (record: Part) => ({
  onClick: () => goToPartDetail(record.id),
  style: { cursor: 'pointer' },
})

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
    // 更新分页总数
    partsPagination.value.total = parts.value.length
  }
})

// 监听路由变化，从新建售后件页面返回时刷新数据
watch(orderId, async () => {
  order.value = await returnOrderApi.getById(orderId.value)
  if (order.value) {
    parts.value = await returnOrderApi.getParts(orderId.value)
    partsPagination.value.total = parts.value.length
    // 重置分页到第一页
    partsPagination.value.current = 1
  }
})

// 监听路由参数变化（如从新建售后件返回）
watch(() => route.fullPath, async () => {
  if (route.name === 'ReturnOrderDetail') {
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

const handleSampling = () => {
  samplingVisible.value = true
}

const handleSamplingSuccess = async () => {
  message.success(t('message.samplingComplete'))
  order.value = await returnOrderApi.getById(orderId.value)
  // 更新售后件列表和分页
  parts.value = await returnOrderApi.getParts(orderId.value)
  partsPagination.value.total = parts.value.length
}

const handleNoSamplingSuccess = async () => {
  message.success(t('message.noSamplingSuccess'))
  order.value = await returnOrderApi.getById(orderId.value)
  // 更新售后件列表和分页
  parts.value = await returnOrderApi.getParts(orderId.value)
  partsPagination.value.total = parts.value.length
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

const handleAddPart = () => {
  router.push({
    path: '/return-parts/new',
    query: { orderId: orderId.value, fromOrderDetail: 'true' }
  })
}

const handleEditPart = (partId: string) => {
  router.push(`/return-parts/${partId}/edit`)
}

const handleDeletePart = async (partId: string) => {
  try {
    await partApi.delete(partId)
    message.success(t('message.deleteSuccess'))
    // 重新加载售后件列表
    parts.value = await returnOrderApi.getParts(orderId.value)
    partsPagination.value.total = parts.value.length
  } catch {
    message.error(t('message.deleteFailed'))
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

  :deep(.parts-card .ant-table-tbody > tr:hover > td) {
    cursor: pointer;
  }

  :deep(.parts-card .ant-card-head-title) {
    width: 100%;
  }
}
</style>

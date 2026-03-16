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
          <!-- 初分析中和精分析中：所有用户都可以点击"抽样"按钮，但BA20（0km）订单除外 -->
          <a-button
            v-if="(order?.status === 'in_initial_analysis' || order?.status === 'in_detailed_analysis') && order?.failureType !== 'BA20'"
            type="primary"
            @click="handleSampling"
          >
            {{ t('returnOrder.sampling') }}
          </a-button>
          <!-- BA20（0km）订单提示 -->
          <a-tooltip v-if="(order?.status === 'in_initial_analysis' || order?.status === 'in_detailed_analysis') && order?.failureType === 'BA20'">
            <template #title>{{ t('message.failureTypeBA20CannotSample') }}</template>
            <a-button disabled>{{ t('returnOrder.sampling') }}</a-button>
          </a-tooltip>
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
            <a-descriptions-item :label="t('returnOrder.failureType')">
              {{ order?.failureType || '-' }}
              <a-tag v-if="order?.failureType === 'BA20'" color="red" style="margin-left: 8px">{{ t('returnOrder.is0km') }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.detailedAnalysisQuantity')">{{ order?.detailedAnalysisQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.scrappedQuantity')">{{ order?.scrappedQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.qcCreatedQuantity')">{{ order?.qcCreatedQuantity }}</a-descriptions-item>
            <a-descriptions-item :label="t('orderDetail.qcNotCreatedQuantity')" :span="2">{{ order?.qcNotCreatedQuantity }}</a-descriptions-item>
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
          <!-- 搜索区域 -->
          <div class="parts-search">
            <a-row :gutter="12" align="middle">
              <a-col :span="5">
                <a-input
                  v-model:value="partSearch.partNumber"
                  :placeholder="t('returnPart.partNumber')"
                  allow-clear
                />
              </a-col>
              <a-col :span="4">
                <a-select
                  v-model:value="partSearch.businessUnit"
                  :placeholder="t('returnPart.businessUnit')"
                  allow-clear
                  style="width: 100%"
                  :loading="loadingLookup"
                >
                  <a-select-option v-for="bu in lookupData.businessUnits" :key="bu" :value="bu">
                    {{ bu }}
                  </a-select-option>
                </a-select>
              </a-col>
              <a-col :span="4">
                <a-select
                  v-model:value="partSearch.productPlatform"
                  :placeholder="t('returnPart.productPlatform')"
                  allow-clear
                  style="width: 100%"
                  :loading="loadingLookup"
                >
                  <a-select-option v-for="pp in lookupData.productPlatforms" :key="pp" :value="pp">
                    {{ pp }}
                  </a-select-option>
                </a-select>
              </a-col>
              <a-col :span="4">
                <a-select
                  v-model:value="partSearch.status"
                  :placeholder="t('common.status')"
                  allow-clear
                  style="width: 100%"
                >
                  <a-select-option value="in_initial_analysis">{{ t('status.inInitialAnalysis') }}</a-select-option>
                  <a-select-option value="in_detailed_analysis">{{ t('status.inDetailedAnalysis') }}</a-select-option>
                  <a-select-option value="pending_approval">{{ t('status.pendingApproval') }}</a-select-option>
                  <a-select-option value="analysis_completed">{{ t('status.analysisCompleted') }}</a-select-option>
                  <a-select-option value="scrap_in_progress">{{ t('status.scrapInProgress') }}</a-select-option>
                  <a-select-option value="scrapped">{{ t('status.scrapped') }}</a-select-option>
                </a-select>
              </a-col>
              <a-col :span="4">
                <a-space>
                  <a-button type="primary" :loading="loadingParts" @click="handlePartSearch">
                    {{ t('common.search') }}
                  </a-button>
                  <a-button @click="handlePartReset">
                    {{ t('common.reset') }}
                  </a-button>
                </a-space>
              </a-col>
            </a-row>
          </div>
          <a-table
            :columns="partColumns"
            :data-source="paginatedParts"
            :pagination="partsPagination"
            :loading="loadingParts"
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
      :read-only="samplingReadOnly"
      @success="handleSamplingSuccess"
      @no-sampling="handleNoSamplingSuccess"
    />

    <!-- 报废弹窗 -->
    <ScrapModal
      v-model:visible="scrapVisible"
      :order="order"
      @success="handleScrapSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { StopOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { partApi } from '@/services/partApi'
import { lookupApi } from '@/services/lookupApi'
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
const samplingReadOnly = ref(false) // 抽样只读模式标志
const loadingParts = ref(false) // 加载售后件列表的loading状态
const loadingLookup = ref(false) // 加载字典数据的loading状态
const isMounted = ref(true) // 组件是否已挂载标志，用于防止异步操作在组件卸载后更新状态

// 字典数据
const lookupData = ref({
  businessUnits: [] as string[],
  productPlatforms: [] as string[]
})

// 售后件搜索条件
const partSearch = ref({
  partNumber: '',
  businessUnit: undefined as string | undefined,
  productPlatform: undefined as string | undefined,
  status: undefined as string | undefined
})

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

// 加载订单的售后件列表
const loadParts = async () => {
  if (!orderId.value) return
  loadingParts.value = true
  try {
    // 构建搜索参数，只包含有值的字段
    const params: any = {}
    if (partSearch.value.partNumber) {
      params.partNumber = partSearch.value.partNumber
    }
    if (partSearch.value.businessUnit) {
      params.businessUnit = partSearch.value.businessUnit
    }
    if (partSearch.value.productPlatform) {
      params.productPlatform = partSearch.value.productPlatform
    }
    if (partSearch.value.status) {
      params.status = partSearch.value.status
    }
    const result = await returnOrderApi.getParts(orderId.value, Object.keys(params).length > 0 ? params : undefined)
    if (isMounted.value) {
      parts.value = result
      partsPagination.value.total = result.length
      // 搜索时重置到第一页
      partsPagination.value.current = 1
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

// 搜索处理函数
const handlePartSearch = () => {
  loadParts().catch(error => {
    console.error('Search failed:', error)
  })
}

// 重置搜索条件
const handlePartReset = () => {
  partSearch.value = {
    partNumber: '',
    businessUnit: undefined,
    productPlatform: undefined,
    status: undefined
  }
  loadParts().catch(error => {
    console.error('Reset failed:', error)
  })
}

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
  if (!order.value) return 0
  // 已报废是最终状态，应设置为比最大步骤索引更大的值，使其显示为"已完成"
  if (order.value.status === OrderStatus.SCRAPPED) {
    return 7 // 比最大步骤索引6大1
  }
  return statusStepMap[order.value.status]
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
  try {
    // 加载退货单数据
    order.value = await returnOrderApi.getById(orderId.value)
    if (order.value) {
      await loadParts()
    }
    // 加载字典数据
    await loadLookupData()
  } catch (error) {
    console.error('Error during component mount:', error)
  }
})

onUnmounted(() => {
  isMounted.value = false
})

// 加载字典数据
const loadLookupData = async () => {
  loadingLookup.value = true
  try {
    // 使用 partApi.list 获取所有售后件，从中提取业务单元和产品平台
    const allParts = await partApi.list({})
    if (isMounted.value) {
      if (Array.isArray(allParts)) {
        const businessUnits = new Set(allParts.map(p => p.businessUnit).filter(Boolean))
        const productPlatforms = new Set(allParts.map(p => p.productPlatform).filter(Boolean))
        lookupData.value.businessUnits = Array.from(businessUnits).sort()
        lookupData.value.productPlatforms = Array.from(productPlatforms).sort()
      } else {
        lookupData.value.businessUnits = []
        lookupData.value.productPlatforms = []
      }
    }
  } catch (error) {
    if (isMounted.value) {
      console.error('Failed to load lookup data:', error)
      // 失败时使用空数组，不影响主要功能
      lookupData.value.businessUnits = []
      lookupData.value.productPlatforms = []
    }
  } finally {
    if (isMounted.value) {
      loadingLookup.value = false
    }
  }
}

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

const handleSampling = () => {
  // 初分析中状态：打开可编辑模式
  // 精分析中状态：打开只读模式（弹窗内QMC Manager可切换到可编辑模式）
  samplingReadOnly.value = order.value?.status === 'in_detailed_analysis'
  samplingVisible.value = true
}

const handleSamplingSuccess = async () => {
  message.success(t('message.samplingComplete'))
  order.value = await returnOrderApi.getById(orderId.value)
  // 更新售后件列表
  await loadParts()
}

const handleNoSamplingSuccess = async () => {
  message.success(t('message.noSamplingSuccess'))
  order.value = await returnOrderApi.getById(orderId.value)
  // 更新售后件列表
  await loadParts()
}

const handleScrap = () => {
  scrapVisible.value = true
}

const handleScrapSuccess = async () => {
  scrapVisible.value = false
  message.success(t('message.scrapStatusMarked'))
  order.value = await returnOrderApi.getById(orderId.value)
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
    await loadParts()
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

  .parts-search {
    margin-bottom: 16px;
  }
}
</style>

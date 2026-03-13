<template>
  <div class="order-list">
    <a-page-header :title="t('returnOrder.title')" />

    <!-- 查询条件区 -->
    <OrderListFilters
      v-model:filters="filters"
      :customers="customers"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 操作区 -->
    <OrderListActions
      :selected-count="selectedRowKeys.length"
      :can-edit="canEditSelectedOrder"
      :can-delete="canDeleteSelectedOrder"
      @create="handleCreate"
      @import="handleImport"
      @export="handleExport"
      @edit="handleEdit"
      @delete="handleBatchDeleteWrapper"
      @sampling="handleSampling"
      @scrap="handleScrap"
    />

    <!-- 列表区 -->
    <OrderTable
      :orders="filteredOrders"
      :selected-row-keys="selectedRowKeys"
      :pagination="paginationConfig"
      :loading="loading"
      :sort-state="sortState"
      :customers="customers"
      @selection-change="onSelectChange"
      @table-change="handleTableChange"
      @view="handleView"
    />

    <!-- 抽样弹窗 -->
    <SamplingModal
      v-model:visible="samplingVisible"
      :order="currentOrder"
      @success="handleSamplingSuccess"
    />

    <!-- 报废弹窗 -->
    <ScrapModal
      v-model:visible="scrapVisible"
      :selected-ids="selectedRowKeys"
      @success="handleScrapSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { returnOrderApi } from '@/services/returnOrderApi'
import { customerApi } from '@/services/customerApi'
import { usePermissions } from '@/composables/usePermissions'
import type { Customer } from '@/services/customerApi'
import type { ReturnOrder } from '@/types'
import { useTableList } from '@/composables/useTableList'
import OrderListFilters from './components/OrderListFilters.vue'
import OrderListActions from './components/OrderListActions.vue'
import OrderTable from './components/OrderTable.vue'
import SamplingModal from './components/SamplingModal.vue'
import ScrapModal from './components/ScrapModal.vue'

const { t } = useI18n()
const router = useRouter()
const { isQMCManager } = usePermissions()

const customers = ref<Customer[]>([])
const filters = ref({
  orderNumber: '',
  customerId: undefined as string | undefined,
  receiveDate: null as any,
})

const {
  loading,
  items: orders,
  selectedRowKeys,
  filteredItems: filteredOrders,
  pagination: paginationConfig,
  onSelectChange,
  handleTableChange,
  loadData,
  handleBatchDelete,
  sortState,
} = useTableList<ReturnOrder>(async (params) => {
  const apiParams: any = {
    ...params,
  }
  if (filters.value.orderNumber) apiParams.orderNumber = filters.value.orderNumber
  if (filters.value.customerId) apiParams.customer = filters.value.customerId
  // Handle date range - convert array to start/end parameters and format to ISO
  if (filters.value.receiveDate && Array.isArray(filters.value.receiveDate)) {
    apiParams.receiveDateStart = dayjs(filters.value.receiveDate[0]).format('YYYY-MM-DD')
    apiParams.receiveDateEnd = dayjs(filters.value.receiveDate[1]).format('YYYY-MM-DD')
  }
  return await returnOrderApi.list(apiParams)
})

const samplingVisible = ref(false)
const currentOrder = ref<ReturnOrder | null>(null)
const scrapVisible = ref(false)

// Check if the selected order can be edited
// Draft orders (no orderNumber) can be edited by anyone
// Submitted orders (has orderNumber) can only be edited by QMC Manager
const canEditSelectedOrder = computed(() => {
  if (selectedRowKeys.value.length !== 1) return false
  const selectedOrder = orders.value.find(o => o.id === selectedRowKeys.value[0])
  if (!selectedOrder) return false
  // Draft orders can be edited by anyone
  if (!selectedOrder.orderNumber) return true
  // Submitted orders require QMC Manager role
  return isQMCManager.value
})

// Check if the selected order can be deleted
// Draft orders (no orderNumber) can be deleted by anyone
// Submitted orders (has orderNumber) can only be deleted by QMC Manager
const canDeleteSelectedOrder = computed(() => {
  if (selectedRowKeys.value.length === 0) return false
  // Check if any selected order is submitted
  const hasSubmittedOrder = selectedRowKeys.value.some(id => {
    const order = orders.value.find(o => o.id === id)
    return order?.orderNumber
  })
  // If all are draft orders, anyone can delete
  if (!hasSubmittedOrder) return true
  // If any submitted order is selected, only QMC Manager can delete
  return isQMCManager.value
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadData(),
      (async () => {
        customers.value = await customerApi.list()
      })(),
    ])
  } finally {
    loading.value = false
  }
})

const handleSearch = async () => {
  paginationConfig.current = 1 // Reset to first page when searching
  await loadData()
  message.success(t('message.searchComplete'))
}

const handleReset = async () => {
  filters.value = {
    orderNumber: '',
    customerId: undefined,
    receiveDate: null,
  }
  sortState.value = {}
  paginationConfig.current = 1 // Reset to first page
  await loadData()
}

const handleCreate = () => {
  router.push('/return-orders/new')
}

const handleView = (id: string) => {
  router.push(`/return-orders/${id}`)
}

const handleEdit = () => {
  if (selectedRowKeys.value.length !== 1) return

  const selectedId = selectedRowKeys.value[0]
  const selectedOrder = orders.value.find(o => o.id === selectedId)
  if (!selectedOrder) return

  // Check permission for editing submitted orders
  if (selectedOrder.orderNumber && !isQMCManager.value) {
    message.warning(t('validation.noPermissionToEdit'))
    return
  }

  router.push(`/return-orders/${selectedId}/edit`)
}

const handleExport = async () => {
  try {
    const params: Record<string, string> = {}
    if (filters.value.orderNumber) params.orderNumber = filters.value.orderNumber
    if (filters.value.customerId)  params.customer = filters.value.customerId
    if (filters.value.receiveDate && Array.isArray(filters.value.receiveDate)) {
      params.receiveDateStart = dayjs(filters.value.receiveDate[0]).format('YYYY-MM-DD')
      params.receiveDateEnd   = dayjs(filters.value.receiveDate[1]).format('YYYY-MM-DD')
    }

    const blob = await returnOrderApi.exportExcel(params)

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    link.download = `ReturnOrders_${today}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
    message.success(t('message.exportSuccess'))
  } catch (e: any) {
    // axios blob 响应时，错误体需从 blob 中读取
    let errMsg = t('message.exportFailed')
    try {
      const raw = e?.response?.data
      if (raw instanceof Blob) {
        const text = await raw.text()
        const body = JSON.parse(text)
        if (body?.message) errMsg = body.message
      } else if (raw?.message) {
        errMsg = raw.message
      }
    } catch { /* 解析失败，使用默认提示 */ }
    message.error(errMsg, 6)
  }
}

const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch('/api/v1/return-orders/import', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Import failed')
      const result = await response.json()
      message.success(t('message.importSuccess', { success: result.success, fail: result.fail }))
      await loadData()
    } catch {
      message.error(t('message.importFailed'))
    }
  }
  input.click()
}

const handleSampling = () => {
  if (selectedRowKeys.value.length === 1) {
    currentOrder.value = orders.value.find(o => o.id === selectedRowKeys.value[0]) || null
    samplingVisible.value = true
  }
}

const handleSamplingSuccess = () => {
  samplingVisible.value = false
  message.success(t('message.samplingComplete'))
}

const handleScrap = () => {
  scrapVisible.value = true
}

const handleScrapSuccess = () => {
  scrapVisible.value = false
  selectedRowKeys.value = []
  message.success(t('message.scrapSubmitted'))
}

const handleBatchDeleteWrapper = async () => {
  if (selectedRowKeys.value.length === 0) return

  const idsToDelete = [...selectedRowKeys.value]

  // Step 1: Pre-check parts count for all orders
  const ordersWithParts: Array<{ orderId: string; orderNumber: string; partsCount: number }> = []

  for (const id of idsToDelete) {
    try {
      const response = await returnOrderApi.getPartsCount(id)
      if (response.partsCount > 0) {
        const order = orders.value.find((o) => o.id === id)
        ordersWithParts.push({
          orderId: id,
          orderNumber: order?.orderNumber || t('common.unknown'),
          partsCount: response.partsCount,
        })
      }
    } catch (error) {
      console.error('Failed to check parts count for order:', id, error)
    }
  }

  // Step 2: Show appropriate confirmation dialog
  if (ordersWithParts.length === 0) {
    showSimpleDeleteConfirm(idsToDelete)
  } else {
    showCascadeDeleteConfirm(idsToDelete, ordersWithParts)
  }
}

const showSimpleDeleteConfirm = (ids: string[]) => {
  Modal.confirm({
    title: t('returnOrder.confirmDelete'),
    content: t('returnOrder.confirmDeleteSimple', { count: ids.length }),
    okText: t('common.confirm'),
    okType: 'danger',
    cancelText: t('common.cancel'),
    onOk: async () => {
      await executeDelete(ids, false)
    },
  })
}

const showCascadeDeleteConfirm = (
  allIds: string[],
  ordersWithParts: Array<{ orderId: string; orderNumber: string; partsCount: number }>,
) => {
  const totalParts = ordersWithParts.reduce((sum, item) => sum + item.partsCount, 0)

  // Build detailed content
  let content = t('returnOrder.cascadeDeleteWarning')
  content += '\n\n'
  content += t('returnOrder.ordersWithParts', { count: ordersWithParts.length })
  content += '\n'

  if (ordersWithParts.length <= 5) {
    ordersWithParts.forEach((item) => {
      content += `\n• ${item.orderNumber}: ${t('returnOrder.partsCount', { count: item.partsCount })}`
    })
  } else {
    content += t('returnOrder.totalPartsCount', { count: totalParts })
  }

  Modal.confirm({
    title: t('returnOrder.confirmDeleteWithParts'),
    content,
    okButtonProps: { style: { display: 'none' } },
    cancelText: t('common.cancel'),
    icon: () => h(ExclamationCircleOutlined),
    width: 500,
  })
}

const executeDelete = async (ids: string[], cascade: boolean) => {
  let successCount = 0
  let failCount = 0

  for (const id of ids) {
    try {
      await returnOrderApi.delete(id, cascade)
      successCount++
    } catch (error: any) {
      failCount++
      const order = orders.value.find((o) => o.id === id)
      const orderNumber = order?.orderNumber || id
      message.error(t('message.deleteFailed', { orderNumber }))
    }
  }

  selectedRowKeys.value = []
  await loadData()

  if (failCount === 0) {
    message.success(t('message.deleteSuccess'))
  } else if (successCount === 0) {
    message.error(t('message.deleteAllFailed'))
  } else {
    message.warning(t('message.deletePartialSuccess', { success: successCount, fail: failCount }))
  }
}
</script>

<style lang="less" scoped>
.order-list {
  padding: 24px;
}
</style>

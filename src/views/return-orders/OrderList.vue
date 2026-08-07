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
      :export-loading="exportLoading"
      @create="handleCreate"
      @import="handleImport"
      @export="handleExport"
      @edit="handleEdit"
      @delete="handleBatchDeleteWrapper"
    />

    <!-- 列表区 (Card wrapping per DESIGN.md §2.2) -->
    <a-card :body-style="{ padding: 0 }">
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
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { canEditSubmittedForm } = usePermissions()

const customers = ref<Customer[]>([])
const filters = ref({
  orderNumber: '',
  customerId: undefined as string | undefined,
  receiveDate: null as any,
  status: undefined as string | undefined,
  returnMethod: undefined as string | undefined,
  createdAt: null as any,
  complaintDate: null as any,
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
  sortState,
} = useTableList<ReturnOrder>(async (params) => {
  const apiParams: any = {
    ...params,
  }
  if (filters.value.orderNumber) apiParams.orderNumber = filters.value.orderNumber
  if (filters.value.customerId) apiParams.customer = filters.value.customerId
  if (filters.value.status) apiParams.status = filters.value.status
  if (filters.value.returnMethod) apiParams.returnMethod = filters.value.returnMethod
  // Handle date range - convert array to start/end parameters and format to ISO
  if (filters.value.receiveDate && Array.isArray(filters.value.receiveDate)) {
    apiParams.receiveDateStart = dayjs(filters.value.receiveDate[0]).format('YYYY-MM-DD')
    apiParams.receiveDateEnd = dayjs(filters.value.receiveDate[1]).format('YYYY-MM-DD')
  }
  if (filters.value.createdAt && Array.isArray(filters.value.createdAt)) {
    apiParams.createdAtStart = dayjs(filters.value.createdAt[0]).format('YYYY-MM-DD')
    apiParams.createdAtEnd = dayjs(filters.value.createdAt[1]).format('YYYY-MM-DD')
  }
  if (filters.value.complaintDate && Array.isArray(filters.value.complaintDate)) {
    apiParams.complaintDateStart = dayjs(filters.value.complaintDate[0]).format('YYYY-MM-DD')
    apiParams.complaintDateEnd = dayjs(filters.value.complaintDate[1]).format('YYYY-MM-DD')
  }
  return await returnOrderApi.list(apiParams)
})

// 默认按更新时间降序排列
sortState.value = { field: 'updatedAt', order: 'descend' }

const exportLoading = ref(false)

// Check if the selected order can be edited
// Draft orders (no orderNumber) can be edited by anyone
// Submitted orders (has orderNumber) can only be edited by QMC Leader
const canEditSelectedOrder = computed(() => {
  if (selectedRowKeys.value.length !== 1) return false
  const selectedOrder = orders.value.find(o => o.id === selectedRowKeys.value[0])
  if (!selectedOrder) return false
  // Draft orders can be edited by anyone
  if (!selectedOrder.orderNumber) return true
  // Submitted orders require QMC Leader role
  return canEditSubmittedForm.value
})

// Check if the selected order can be deleted
// Draft orders (no orderNumber) can be deleted by anyone
// Submitted orders (has orderNumber) can only be deleted by QMC Leader
const canDeleteSelectedOrder = computed(() => {
  if (selectedRowKeys.value.length === 0) return false
  // Check if any selected order is submitted
  const hasSubmittedOrder = selectedRowKeys.value.some(id => {
    const order = orders.value.find(o => o.id === id)
    return order?.orderNumber
  })
  // If all are draft orders, anyone can delete
  if (!hasSubmittedOrder) return true
  // If any submitted order is selected, only QMC Leader can delete
  return canEditSubmittedForm.value
})

onMounted(async () => {
  applyTaskFiltersFromQuery()
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
    status: undefined,
    returnMethod: undefined,
    createdAt: null,
    complaintDate: null,
  }
  sortState.value = {}
  paginationConfig.current = 1 // Reset to first page
  await loadData()
}

function applyTaskFiltersFromQuery() {
  const status = typeof route.query.status === 'string' ? route.query.status : undefined
  const fromTask = typeof route.query.fromTask === 'string' ? route.query.fromTask : undefined

  if (status) {
    filters.value.status = status
  }

  if (fromTask) {
    message.info(t('dashboard.taskFilterApplied'))
  }
}

watch(
  () => route.query,
  async () => {
    applyTaskFiltersFromQuery()
    paginationConfig.current = 1
    await loadData()
  },
)

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
  if (selectedOrder.orderNumber && !canEditSubmittedForm.value) {
    message.warning(t('validation.noPermissionToEdit'))
    return
  }

  router.push(`/return-orders/${selectedId}/edit`)
}

const handleExport = async () => {
  if (exportLoading.value) return
  exportLoading.value = true
  try {
    const params: Record<string, string> = {}
    if (filters.value.orderNumber) params.orderNumber = filters.value.orderNumber
    if (filters.value.customerId)  params.customer = filters.value.customerId
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.returnMethod) params.returnMethod = filters.value.returnMethod
    if (filters.value.receiveDate && Array.isArray(filters.value.receiveDate)) {
      params.receiveDateStart = dayjs(filters.value.receiveDate[0]).format('YYYY-MM-DD')
      params.receiveDateEnd   = dayjs(filters.value.receiveDate[1]).format('YYYY-MM-DD')
    }
    if (filters.value.createdAt && Array.isArray(filters.value.createdAt)) {
      params.createdAtStart = dayjs(filters.value.createdAt[0]).format('YYYY-MM-DD')
      params.createdAtEnd   = dayjs(filters.value.createdAt[1]).format('YYYY-MM-DD')
    }
    if (filters.value.complaintDate && Array.isArray(filters.value.complaintDate)) {
      params.complaintDateStart = dayjs(filters.value.complaintDate[0]).format('YYYY-MM-DD')
      params.complaintDateEnd   = dayjs(filters.value.complaintDate[1]).format('YYYY-MM-DD')
    }

    const blob = await returnOrderApi.exportExcel(params)

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const today = dayjs.tz().format('YYYYMMDD')
    link.download = `退件明细_${today}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
    message.success(t('message.exportSuccess'))
  } catch (e: any) {
    // 尝试从错误响应中提取后端消息
    let errMsg = ''
    try {
      const raw = e?.response?.data
      if (raw && typeof raw.text === 'function') {
        // responseType:'blob' 时错误体也是 Blob
        const text = await raw.text()
        const body = JSON.parse(text)
        errMsg = body?.message || ''
      } else if (raw?.message) {
        errMsg = raw.message
      }
    } catch { /* 解析失败，使用默认提示 */ }

    // 400 = 导出超限，使用专门的提示；其他错误用通用提示
    if (e?.response?.status === 400) {
      Modal.warning({
        title: t('returnOrder.exportLimitTitle'),
        content: errMsg || t('returnOrder.exportLimitContent'),
      })
    } else {
      message.error(t('message.exportFailed'))
    }
  } finally {
    exportLoading.value = false
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
    // 含退件信息的退货单不允许删除，仅弹出警告框（只有「取消」按钮）
    showCannotDeleteWarning(ordersWithParts)
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

const showCannotDeleteWarning = (
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

  // 含退件信息的退货单被拦截：使用 Modal.warning 只显示单个「取消」按钮，不执行任何删除
  Modal.warning({
    title: t('returnOrder.confirmDeleteWithParts'),
    content,
    okText: t('common.cancel'),
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
  padding: 0;
}
</style>

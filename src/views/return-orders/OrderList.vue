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
      @create="handleCreate"
      @import="handleImport"
      @export="handleExport"
      @edit="handleEdit"
      @delete="handleBatchDelete"
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
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
const { canEditSubmittedForm } = usePermissions()

const customers = ref<Customer[]>([])
const filters = ref({
  orderNumber: '',
  customer: undefined as string | undefined,
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
  if (filters.value.customer) apiParams.customer = filters.value.customer
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
// Submitted orders (has orderNumber) can only be edited by QMC Manager or System Admin
const canEditSelectedOrder = computed(() => {
  if (selectedRowKeys.value.length !== 1) return false
  const selectedOrder = orders.value.find(o => o.id === selectedRowKeys.value[0])
  if (!selectedOrder) return false
  // Draft orders can be edited by anyone
  if (!selectedOrder.orderNumber) return true
  // Submitted orders require data correction permission
  return canEditSubmittedForm.value
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
    customer: undefined,
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
  if (selectedOrder.orderNumber && !canEditSubmittedForm.value) {
    message.warning(t('validation.noPermissionToEdit'))
    return
  }

  router.push(`/return-orders/${selectedId}/edit`)
}

const handleExport = async () => {
  try {
    const params = new URLSearchParams()
    if (filters.value.orderNumber) params.append('orderNumber', filters.value.orderNumber)
    if (filters.value.customer) params.append('customer', filters.value.customer)
    // Handle date range - convert array to start/end parameters and format to ISO
    if (filters.value.receiveDate && Array.isArray(filters.value.receiveDate)) {
      params.append('receiveDateStart', dayjs(filters.value.receiveDate[0]).format('YYYY-MM-DD'))
      params.append('receiveDateEnd', dayjs(filters.value.receiveDate[1]).format('YYYY-MM-DD'))
    }
    const url = `/api/v1/return-orders/export${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    link.download = `ReturnOrders_${today}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
    message.success(t('message.exportSuccess'))
  } catch {
    message.error(t('message.exportFailed'))
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
</script>

<style lang="less" scoped>
.order-list {
  padding: 24px;
}
</style>

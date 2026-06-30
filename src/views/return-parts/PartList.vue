<template>
  <div class="part-list">
    <a-page-header :title="t('returnPart.title')" />

    <!-- 查询条件区 -->
    <PartListFilters
      v-model:filters="filters"
      :business-units="businessUnits"
      :product-platforms="productPlatforms"
      :analysts="analysts"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 操作区 -->
    <PartListActions
      :selected-count="selectedRowKeys.length"
      :can-edit="canEditSelectedPart"
      :can-delete="canDeleteSelectedPart"
      :export-loading="exportLoading"
      @create="handleCreate"
      @export="handleExport"
      @edit="handleEdit"
      @delete="handleBatchDeleteWrapper"
    />

    <!-- 列表区 -->
    <a-card :body-style="{ padding: 0 }">
    <PartTable
      :parts="filteredParts"
      :selected-row-keys="selectedRowKeys"
      :pagination="pagination"
      :loading="loading"
      :sort-state="sortState"
      @selection-change="onSelectChange"
      @table-change="handleTableChange"
      @view="handleView"
      @go-to-order="goToOrder"
    />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import { navigateTo } from '@/services/navigationService'
import { partApi } from '@/services/partApi'
import { lookupApi } from '@/services/lookupApi'
import { userApi } from '@/services/userApi'
import type { Part } from '@/types'
import { useTableList } from '@/composables/useTableList'
import { usePermissions } from '@/composables/usePermissions'
import { useUserNameMap } from '@/composables/useUserNameMap'

import PartListFilters from './components/PartListFilters.vue'
import PartListActions from './components/PartListActions.vue'
import PartTable from './components/PartTable.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { canEditSubmittedForm, isAnalyst, currentUserUsername } = usePermissions()
const { load: loadUserNameMap } = useUserNameMap()

const businessUnits = ref<string[]>([])
const productPlatforms = ref<string[]>([])
const analysts = ref<{ id: string; loginName: string; displayName: string }[]>([])

const filters = ref({
  orderNumber: '',
  partCode: '',
  businessUnit: undefined as string | undefined,
  productPlatform: undefined as string | undefined,
  status: undefined as string | undefined,
  alertType: undefined as string | undefined,
  qcCreated: undefined as string | undefined,
  // 分析师用户默认选择自己
  analyst: isAnalyst.value ? currentUserUsername.value : undefined as string | undefined,
  partProductionDateRange: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
  vehicleMileageMin: undefined as number | undefined,
  vehicleMileageMax: undefined as number | undefined,
})

const {
  loading,
  items: parts,
  selectedRowKeys,
  filteredItems: filteredParts,
  pagination,
  onSelectChange,
  handleTableChange,
  loadData,
  handleBatchDelete,
  sortState,
} = useTableList<Part>(async (tableParams) => {
  const params: any = {
    page: (tableParams.page ?? 1) - 1,  // useTableList 用1-based，后端用0-based
    size: tableParams.pageSize ?? 20,
  }
  if (tableParams.sortBy) {
    params.sortBy = tableParams.sortBy
    params.sortOrder = tableParams.sortOrder
  }
  if (filters.value.orderNumber) params.orderNumber = filters.value.orderNumber
  if (filters.value.partCode) params.partCode = filters.value.partCode
  if (filters.value.businessUnit) params.businessUnit = filters.value.businessUnit
  if (filters.value.productPlatform) params.productPlatform = filters.value.productPlatform
  if (filters.value.status) params.status = filters.value.status
  if (filters.value.alertType) params.alertType = filters.value.alertType
  if (filters.value.qcCreated) params.qcCreated = filters.value.qcCreated
  if (filters.value.analyst) params.analyst = filters.value.analyst
  if (filters.value.partProductionDateRange) {
    params.partProductionDateFrom = filters.value.partProductionDateRange[0].format('YYYY-MM-DD')
    params.partProductionDateTo = filters.value.partProductionDateRange[1].format('YYYY-MM-DD')
  }
  if (filters.value.vehicleMileageMin != null) params.vehicleMileageFrom = filters.value.vehicleMileageMin
  if (filters.value.vehicleMileageMax != null) params.vehicleMileageTo = filters.value.vehicleMileageMax

  const result = await partApi.list(params)
  return { data: result.data, total: result.total }
})

// 默认按更新时间降序排列
sortState.value = { field: 'updatedAt', order: 'descend' }

// 检查选中的售后件是否可以编辑
const canEditSelectedPart = computed(() => {
  if (selectedRowKeys.value.length !== 1) return false
  const selectedPart = parts.value.find(p => p.id === selectedRowKeys.value[0])
  if (!selectedPart) return false
  // 未提交的售后件都可以编辑
  if (!selectedPart.partNumber) return true
  // 信息录入/进行中状态的退件所有人都可以编辑
  if (selectedPart.status === 'in_initial_analysis') return true
  // 已提交的售后件需要 QMC Leader 权限
  return canEditSubmittedForm.value
})

// 检查选中的售后件是否可以删除
const canDeleteSelectedPart = computed(() => {
  if (selectedRowKeys.value.length === 0) return false
  // 检查是否有已提交的售后件
  const hasSubmittedPart = selectedRowKeys.value.some(id => {
    const part = parts.value.find(p => p.id === id)
    return part?.partNumber
  })
  // 如果全部是未提交的售后件，任何人都可以删除
  if (!hasSubmittedPart) return true
  // 如果有已提交的售后件被选中，只有 QMC Leader 可以删除
  return canEditSubmittedForm.value
})

onMounted(async () => {
  applyTaskFiltersFromQuery()
  const [lookups, analystsData] = await Promise.all([
    lookupApi.getAll(),
    userApi.listAnalysts(),
    loadData(),
    loadUserNameMap(),
  ])
  businessUnits.value = lookups.businessUnits
  productPlatforms.value = lookups.productPlatforms
  analysts.value = analystsData
})

const handleSearch = async () => {
  await loadData()
  message.success(t('message.searchComplete'))
}

const handleReset = async () => {
  filters.value = {
    orderNumber: '',
    partCode: '',
    businessUnit: undefined,
    productPlatform: undefined,
    status: undefined,
    alertType: undefined,
    qcCreated: undefined,
    // 分析师重置时仍然选择自己，其他角色重置为未选择
    analyst: isAnalyst.value ? currentUserUsername.value : undefined,
    partProductionDateRange: undefined,
    vehicleMileageMin: undefined,
    vehicleMileageMax: undefined,
  }
  sortState.value = {}
  await loadData()
}

const exportLoading = ref(false)

const handleExport = async () => {
  if (exportLoading.value) return
  exportLoading.value = true
  try {
    const params: Record<string, string> = {}
    if (filters.value.orderNumber) params.orderNumber = filters.value.orderNumber
    if (filters.value.partCode) params.partCode = filters.value.partCode
    if (filters.value.businessUnit) params.businessUnit = filters.value.businessUnit
    if (filters.value.productPlatform) params.productPlatform = filters.value.productPlatform
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.qcCreated) params.qcCreated = filters.value.qcCreated
    if (filters.value.analyst) params.analyst = filters.value.analyst
    if (filters.value.partProductionDateRange) {
      params.partProductionDateFrom = filters.value.partProductionDateRange[0].format('YYYY-MM-DD')
      params.partProductionDateTo = filters.value.partProductionDateRange[1].format('YYYY-MM-DD')
    }
    if (filters.value.vehicleMileageMin != null) params.vehicleMileageFrom = String(filters.value.vehicleMileageMin)
    if (filters.value.vehicleMileageMax != null) params.vehicleMileageTo = String(filters.value.vehicleMileageMax)

    const blob = await partApi.exportExcel(params)

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const today = dayjs.tz().format('YYYYMMDD')
    link.download = `售后件明细_${today}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
    message.success(t('message.exportSuccess'))
  } catch (e: any) {
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
    } catch { /* use default message */ }
    Modal.warning({
      title: t('returnOrder.exportLimitTitle') || '导出数量超限',
      content: errMsg,
    })
  } finally {
    exportLoading.value = false
  }
}

const handleCreate = () => {
  router.push('/return-parts/new')
}

const handleView = (id: string) => {
  router.push(`/return-parts/${id}`)
}

const handleEdit = () => {
  if (selectedRowKeys.value.length !== 1) return
  const id = selectedRowKeys.value[0]
  router.push(`/return-parts/${id}/edit`)
}

const handleBatchDeleteWrapper = async () => {
  await handleBatchDelete(partApi.delete)
}

const goToOrder = (orderId: string) => {
  navigateTo(`/return-orders/${orderId}`)
}

function applyTaskFiltersFromQuery() {
  const status = typeof route.query.status === 'string' ? route.query.status : undefined
  const alert = typeof route.query.alert === 'string' ? route.query.alert : undefined
  const fromTask = typeof route.query.fromTask === 'string' ? route.query.fromTask : undefined

  if (status) {
    filters.value.status = status
  }

  if (alert) {
    filters.value.alertType = alert
  }

  if (fromTask) {
    message.info(t('dashboard.taskFilterApplied'))
  }
}

watch(
  () => route.query,
  async () => {
    applyTaskFiltersFromQuery()
    pagination.current = 1
    await loadData()
  },
)
</script>

<style lang="less" scoped>
.part-list {
  padding: 0;
}
</style>

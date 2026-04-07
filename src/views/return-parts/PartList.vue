<template>
  <div class="part-list">
    <a-page-header :title="t('returnPart.title')" />

    <!-- 查询条件区 -->
    <PartListFilters
      v-model:filters="filters"
      :business-units="businessUnits"
      :product-platforms="productPlatforms"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 操作区 -->
    <PartListActions
      :selected-count="selectedRowKeys.length"
      :can-edit="canEditSelectedPart"
      :can-delete="canDeleteSelectedPart"
      @create="handleCreate"
      @edit="handleEdit"
      @delete="handleBatchDeleteWrapper"
    />

    <!-- 列表区 -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { partApi } from '@/services/partApi'
import { lookupApi } from '@/services/lookupApi'
import type { Part } from '@/types'
import { useTableList } from '@/composables/useTableList'
import { usePermissions } from '@/composables/usePermissions'
import PartListFilters from './components/PartListFilters.vue'
import PartListActions from './components/PartListActions.vue'
import PartTable from './components/PartTable.vue'

const { t } = useI18n()
const router = useRouter()
const { canEditSubmittedForm } = usePermissions()

const businessUnits = ref<string[]>([])
const productPlatforms = ref<string[]>([])

const filters = ref({
  orderNumber: '',
  partCode: '',
  businessUnit: undefined as string | undefined,
  productPlatform: undefined as string | undefined,
  status: undefined as string | undefined,
  qcCreated: undefined as string | undefined,
  analyst: '',
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
  if (filters.value.orderNumber) params.orderNumber = filters.value.orderNumber
  if (filters.value.partCode) params.partCode = filters.value.partCode
  if (filters.value.businessUnit) params.businessUnit = filters.value.businessUnit
  if (filters.value.productPlatform) params.productPlatform = filters.value.productPlatform
  if (filters.value.status) params.status = filters.value.status
  if (filters.value.qcCreated) params.qcCreated = filters.value.qcCreated
  if (filters.value.analyst.trim()) params.analyst = filters.value.analyst.trim()

  const result = await partApi.list(params)
  return { data: result.data, total: result.total }
})

// 检查选中的售后件是否可以编辑
const canEditSelectedPart = computed(() => {
  if (selectedRowKeys.value.length !== 1) return false
  const selectedPart = parts.value.find(p => p.id === selectedRowKeys.value[0])
  if (!selectedPart) return false
  // 未提交的售后件都可以编辑
  if (!selectedPart.partNumber) return true
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
  const [lookups] = await Promise.all([
    lookupApi.getAll(),
    loadData(),
  ])
  businessUnits.value = lookups.businessUnits
  productPlatforms.value = lookups.productPlatforms
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
    qcCreated: undefined,
    analyst: '',
  }
  sortState.value = {}
  await loadData()
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
  router.push(`/return-orders/${orderId}`)
}
</script>

<style lang="less" scoped>
.part-list {
  padding: 24px;
}
</style>

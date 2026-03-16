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
      @detailed-analysis="handleDetailedAnalysis"
      @analysis="handleAnalysis"
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

    <!-- 精分析报告弹窗 -->
    <AnalysisReportModal
      v-model:visible="analysisVisible"
      :part="currentPart"
      @success="handleAnalysisSuccess"
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
import AnalysisReportModal from './components/AnalysisReportModal.vue'

const { t } = useI18n()
const router = useRouter()
const { isQMCManager } = usePermissions()

const businessUnits = ref<string[]>([])
const productPlatforms = ref<string[]>([])

const filters = ref({
  orderNumber: '',
  partCode: '',
  businessUnit: undefined as string | undefined,
  productPlatform: undefined as string | undefined,
  status: undefined as string | undefined,
  qcCreated: undefined as string | undefined,
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
} = useTableList<Part>(async () => {
  const params: any = {}
  if (filters.value.orderNumber) params.orderNumber = filters.value.orderNumber
  if (filters.value.partCode) params.partCode = filters.value.partCode
  if (filters.value.businessUnit) params.businessUnit = filters.value.businessUnit
  if (filters.value.productPlatform) params.productPlatform = filters.value.productPlatform
  if (filters.value.status) params.status = filters.value.status

  const result = await partApi.list(Object.keys(params).length > 0 ? params : undefined)

  // QC created status filter on frontend
  let filteredData = result
  if (filters.value.qcCreated === 'yes') {
    filteredData = result.filter(p => (p as any).qcNo)
  } else if (filters.value.qcCreated === 'no') {
    filteredData = result.filter(p => !(p as any).qcNo)
  }

  // Return in the format expected by useTableList
  return {
    data: filteredData,
    total: filteredData.length
  }
})

const analysisVisible = ref(false)
const currentPart = ref<Part | null>(null)

// 检查选中的售后件是否可以编辑
const canEditSelectedPart = computed(() => {
  if (selectedRowKeys.value.length !== 1) return false
  const selectedPart = parts.value.find(p => p.id === selectedRowKeys.value[0])
  if (!selectedPart) return false
  // 未提交的售后件都可以编辑
  if (!selectedPart.partNumber) return true
  // 已提交的售后件需要 QMC Manager 权限
  return isQMCManager.value
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
  // 如果有已提交的售后件被选中，只有 QMC Manager 可以删除
  return isQMCManager.value
})

onMounted(async () => {
  loading.value = true
  try {
    const [partsData, lookups] = await Promise.all([
      partApi.list(),
      lookupApi.getAll(),
    ])
    parts.value = partsData
    businessUnits.value = lookups.businessUnits
    productPlatforms.value = lookups.productPlatforms
  } finally {
    loading.value = false
  }
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

const handleDetailedAnalysis = () => {
  if (selectedRowKeys.value.length === 1) {
    router.push(`/return-parts/${selectedRowKeys.value[0]}/analysis`)
  }
}

const handleAnalysis = () => {
  if (selectedRowKeys.value.length === 1) {
    currentPart.value = parts.value.find(p => p.id === selectedRowKeys.value[0]) || null
    analysisVisible.value = true
  }
}

const handleAnalysisSuccess = () => {
  analysisVisible.value = false
  message.success(t('message.reportSubmitted'))
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

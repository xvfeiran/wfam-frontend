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
      @create="handleCreate"
      @edit="handleEdit"
      @delete="handleBatchDelete"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { partApi } from '@/services/partApi'
import { lookupApi } from '@/services/lookupApi'
import type { Part } from '@/types'
import { useTableList } from '@/composables/useTableList'
import PartListFilters from './components/PartListFilters.vue'
import PartListActions from './components/PartListActions.vue'
import PartTable from './components/PartTable.vue'
import AnalysisReportModal from './components/AnalysisReportModal.vue'

const { t } = useI18n()
const router = useRouter()

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
  if (filters.value.qcCreated === 'yes') {
    return result.filter(p => (p as any).qcNo)
  } else if (filters.value.qcCreated === 'no') {
    return result.filter(p => !(p as any).qcNo)
  }

  return result
})

const analysisVisible = ref(false)
const currentPart = ref<Part | null>(null)

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

const handleEdit = (id: string) => {
  router.push(`/return-parts/${id}/edit`)
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

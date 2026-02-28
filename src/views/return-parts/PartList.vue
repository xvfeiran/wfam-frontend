<template>
  <div class="part-list">
    <a-page-header :title="t('returnPart.title')" />

    <!-- 查询条件区 -->
    <a-card class="filter-card">
      <a-form :model="filters">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.partNumber')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
              <a-input v-model:value="filters.partNumber" :placeholder="t('validation.required')" allowClear />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnPart.partCode')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
              <a-input v-model:value="filters.partCode" :placeholder="t('validation.inputPartCode')" allowClear />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.businessUnit')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
              <a-select v-model:value="filters.businessUnit" :placeholder="t('validation.selectBusinessUnit')" allowClear>
                <a-select-option v-for="bu in businessUnits" :key="bu" :value="bu">{{ bu }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnPart.productPlatform')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
              <a-select v-model:value="filters.productPlatform" :placeholder="t('validation.selectProductPlatform')" allowClear>
                <a-select-option v-for="pp in productPlatforms" :key="pp" :value="pp">{{ pp }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('common.status')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
              <a-select v-model:value="filters.status" :placeholder="t('validation.pleaseSelect')" allowClear>
                <a-select-option v-for="(info, key) in PART_STATUS_MAP" :key="key" :value="key">
                  {{ getStatusLabel(key) }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="24" class="filter-buttons">
            <a-space>
              <a-button type="primary" @click="handleSearch">
                <SearchOutlined /> {{ t('common.search') }}
              </a-button>
              <a-button @click="handleReset">
                <ReloadOutlined /> {{ t('common.reset') }}
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 操作区 -->
    <div class="action-bar">
      <a-space>
        <a-button type="primary" @click="handleCreate">
          <PlusOutlined /> {{ t('common.create') }}
        </a-button>
        <a-button type="primary" :disabled="selectedRowKeys.length !== 1" @click="handleEdit(selectedRowKeys[0])">
          <EditOutlined /> {{ t('common.edit') }}
        </a-button>
        <a-popconfirm :title="t('returnPart.confirmDelete')" @confirm="handleBatchDelete" :disabled="selectedRowKeys.length === 0">
          <a-button danger :disabled="selectedRowKeys.length === 0">
            <DeleteOutlined /> {{ t('common.delete') }}
          </a-button>
        </a-popconfirm>
        <a-button :disabled="selectedRowKeys.length !== 1" @click="handleDetailedAnalysis">
          <ExperimentOutlined /> {{ t('returnPart.detailedAnalysis') }}
        </a-button>
        <a-button :disabled="selectedRowKeys.length !== 1" @click="handleAnalysis">
          <FileSearchOutlined /> {{ t('returnPart.analysisReport') }}
        </a-button>
      </a-space>
    </div>

    <!-- 列表区 -->
    <a-table
      :columns="columns"
      :data-source="filteredParts"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      :pagination="pagination"
      row-key="id"
      :loading="loading"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'partNumber'">
          <a @click="handleView(record.id)">{{ record.partNumber }}</a>
        </template>
        <template v-else-if="column.key === 'orderNumber'">
          <a @click="goToOrder(record.orderId)">{{ record.orderNumber }}</a>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="PART_STATUS_MAP[record.status].color">
            {{ getStatusLabel(record.status) }}
          </a-tag>
        </template>
      </template>
    </a-table>

    <!-- 精分析报告弹窗 -->
    <AnalysisReportModal
      v-model:visible="analysisVisible"
      :part="currentPart"
      @success="handleAnalysisSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
} from '@ant-design/icons-vue'
import { partApi } from '@/services/partApi'
import { lookupApi } from '@/services/lookupApi'
import { PART_STATUS_MAP } from '@/types'
import type { Part } from '@/types'
import AnalysisReportModal from './components/AnalysisReportModal.vue'

const { t } = useI18n()
const router = useRouter()
const loading = ref(false)
const parts = ref<Part[]>([])
const selectedRowKeys = ref<string[]>([])
const businessUnits = ref<string[]>([])
const productPlatforms = ref<string[]>([])

// 映射 PartStatus 蛇形命名到 i18n 驼峰命名
const statusKeyMap: Record<string, string> = {
  registered: 'registered',
  pending_initial_analysis: 'pendingInitialAnalysis',
  initial_analysis_completed: 'initialAnalysisCompleted',
  pending_detailed_analysis: 'pendingDetailedAnalysis',
  in_detailed_analysis: 'inDetailedAnalysis',
  analysis_completed: 'analysisCompleted',
  pending_scrap: 'pendingScrap',
  scrapped: 'scrapped',
}

// 获取状态标签
const getStatusLabel = (status?: string) => {
  if (!status) return PART_STATUS_MAP['registered'].label
  const i18nKey = statusKeyMap[status] || status
  const fullKey = `status.${i18nKey}`
  return t(fullKey) || PART_STATUS_MAP[status]?.label || status
}

// 筛选条件
const filters = ref({
  partNumber: '',
  partCode: '',
  businessUnit: undefined as string | undefined,
  productPlatform: undefined as string | undefined,
  status: undefined as string | undefined,
})

// 分页
const pagination = computed(() => ({
  current: 1,
  pageSize: 10,
  total: filteredParts.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => t('common.total', { total }),
}))

// 精分析弹窗
const analysisVisible = ref(false)
const currentPart = ref<Part | null>(null)

// 表格列定义
const columns = computed(() => [
  { title: t('returnPart.partNumber'), dataIndex: 'partNumber', key: 'partNumber', sorter: true },
  { title: t('returnPart.relatedOrder'), dataIndex: 'orderNumber', key: 'orderNumber' },
  { title: t('returnPart.partCode'), dataIndex: 'partCode', key: 'partCode', sorter: true },
  { title: t('returnPart.businessUnit'), dataIndex: 'businessUnit', key: 'businessUnit', sorter: true },
  { title: t('returnPart.productPlatform'), dataIndex: 'productPlatform', key: 'productPlatform' },
  { title: t('common.status'), dataIndex: 'status', key: 'status' },
])

// 筛选后的数据
const filteredParts = computed(() => {
  let result = parts.value
  if (filters.value.partNumber) {
    result = result.filter(p => p.partNumber.includes(filters.value.partNumber))
  }
  if (filters.value.partCode) {
    result = result.filter(p => p.partCode.includes(filters.value.partCode))
  }
  if (filters.value.businessUnit) {
    result = result.filter(p => p.businessUnit === filters.value.businessUnit)
  }
  if (filters.value.productPlatform) {
    result = result.filter(p => p.productPlatform === filters.value.productPlatform)
  }
  if (filters.value.status) {
    result = result.filter(p => p.status === filters.value.status)
  }
  return result
})

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys
}

const handleSearch = async () => {
  loading.value = true
  try {
    parts.value = await partApi.list({
      partNumber: filters.value.partNumber || undefined,
      partCode: filters.value.partCode || undefined,
      businessUnit: filters.value.businessUnit,
      productPlatform: filters.value.productPlatform,
      status: filters.value.status,
    })
    message.success(t('message.searchComplete'))
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  filters.value = {
    partNumber: '',
    partCode: '',
    businessUnit: undefined,
    productPlatform: undefined,
    status: undefined,
  }
}

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

const handleCreate = () => {
  router.push('/return-parts/new')
}

const handleView = (id: string) => {
  router.push(`/return-parts/${id}`)
}

const handleEdit = (id: string) => {
  router.push(`/return-parts/${id}/edit`)
}

const handleDelete = (id: string) => {
  parts.value = parts.value.filter(p => p.id !== id)
  message.success(t('message.deleteSuccess'))
}

const handleBatchDelete = () => {
  parts.value = parts.value.filter(p => !selectedRowKeys.value.includes(p.id))
  selectedRowKeys.value = []
  message.success(t('message.deleteSuccess'))
}

const handleDetailedAnalysis = () => {
  if (selectedRowKeys.value.length === 1) {
    // 跳转到精分析表单页面
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

  .filter-card {
    margin-bottom: 16px;

    .filter-buttons {
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  }

  .action-bar {
    margin-bottom: 16px;
  }

  .danger-link {
    color: #ff4d4f;
  }
}
</style>

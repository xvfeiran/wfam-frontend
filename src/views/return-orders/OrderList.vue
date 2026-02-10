<template>
  <div class="order-list">
    <a-page-header :title="t('returnOrder.title')" />

    <!-- 查询条件区 -->
    <a-card class="filter-card">
      <a-form :model="filters">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.orderNumber')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
              <a-input v-model:value="filters.orderNumber" :placeholder="t('validation.inputOrderNumber')" allowClear />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.customer')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
              <a-select v-model:value="filters.customer" :placeholder="t('validation.selectCustomer')" allowClear>
                <a-select-option v-for="c in customers" :key="c" :value="c">{{ c }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.receiveDate')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
              <a-range-picker v-model:value="filters.receiveDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.returnMethod')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
              <a-select v-model:value="filters.returnMethod" :placeholder="t('validation.pleaseSelect')" allowClear>
                <a-select-option value="express">{{ t('returnOrder.methodExpress') }}</a-select-option>
                <a-select-option value="pickup">{{ t('returnOrder.methodPickup') }}</a-select-option>
                <a-select-option value="other">{{ t('returnOrder.methodOther') }}</a-select-option>
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
        <a-button @click="handleImport">
          <UploadOutlined /> {{ t('common.import') }}
        </a-button>
        <a-button @click="handleExport">
          <DownloadOutlined /> {{ t('common.export') }}
        </a-button>
        <a-button :disabled="selectedRowKeys.length !== 1" @click="handleEdit(selectedRowKeys[0])">
          <EditOutlined /> {{ t('common.edit') }}
        </a-button>
        <a-popconfirm :title="t('returnOrder.confirmDelete')" @confirm="handleBatchDelete" :disabled="selectedRowKeys.length === 0">
          <a-button danger :disabled="selectedRowKeys.length === 0">
            <DeleteOutlined /> {{ t('common.delete') }}
          </a-button>
        </a-popconfirm>
        <a-button :disabled="selectedRowKeys.length !== 1" @click="handleSampling">
          <ExperimentOutlined /> {{ t('returnOrder.sampling') }}
        </a-button>
        <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleScrap">
          <StopOutlined /> {{ t('returnOrder.scrap') }}
        </a-button>
      </a-space>
    </div>

    <!-- 列表区 -->
    <a-table
      :columns="columns"
      :data-source="filteredOrders"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      :pagination="paginationConfig"
      row-key="id"
      :loading="loading"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'orderNumber'">
          <a @click="handleView(record.id)">{{ record.orderNumber }}</a>
        </template>
        <template v-else-if="column.key === 'returnMethod'">
          {{ getReturnMethodLabel(record.returnMethod) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="ORDER_STATUS_MAP[record.status].color">
            {{ getStatusLabel(record.status) }}
          </a-tag>
        </template>
      </template>
    </a-table>

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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'

const { t } = useI18n()
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  DeleteOutlined,
  EditOutlined,
  StopOutlined,
} from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { lookupApi } from '@/services/lookupApi'
import { ORDER_STATUS_MAP } from '@/types'
import type { ReturnOrder } from '@/types'
import SamplingModal from './components/SamplingModal.vue'
import ScrapModal from './components/ScrapModal.vue'

const router = useRouter()
const loading = ref(false)
const orders = ref<ReturnOrder[]>([])
const selectedRowKeys = ref<string[]>([])
const customers = ref<string[]>([])

// 筛选条件
const filters = ref({
  orderNumber: '',
  customer: undefined as string | undefined,
  receiveDate: null as any,
  returnMethod: undefined as string | undefined,
})

// 分页
const paginationConfig = computed(() => ({
  current: 1,
  pageSize: 10,
  total: filteredOrders.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => t('common.total', { total }),
}))

// 抽样弹窗
const samplingVisible = ref(false)
const currentOrder = ref<ReturnOrder | null>(null)

// 报废弹窗
const scrapVisible = ref(false)

// 列过滤状态
const columnFilters = ref<Record<string, string[] | null>>({})

// 状态到i18n键的映射
const statusI18nKeyMap: Record<string, string> = {
  pending_registration: 'status.pendingRegistration',
  pending_initial_analysis: 'status.pendingInitialAnalysis',
  pending_sampling: 'status.pendingSampling',
  sampling_completed: 'status.samplingCompleted',
  pending_detailed_analysis: 'status.pendingDetailedAnalysis',
  in_detailed_analysis: 'status.inDetailedAnalysis',
  pending_approval: 'status.pendingApproval',
  approved: 'status.approved',
  pending_scrap: 'status.pendingScrap',
  scrapped: 'status.scrapped',
  completed: 'status.completed',
}

// 获取翻译后的状态标签
const getStatusLabel = (status: string) => {
  const key = statusI18nKeyMap[status]
  return key ? t(key) : status
}

// 退回方式到i18n键的映射
const returnMethodI18nKeyMap: Record<string, string> = {
  express: 'returnOrder.methodExpress',
  pickup: 'returnOrder.methodPickup',
  other: 'returnOrder.methodOther',
}

// 获取翻译后的退回方式标签
const getReturnMethodLabel = (method: string) => {
  const key = returnMethodI18nKeyMap[method]
  return key ? t(key) : method
}

// 状态过滤选项
const statusFilters = computed(() =>
  Object.entries(ORDER_STATUS_MAP).map(([key]) => ({
    text: getStatusLabel(key),
    value: key,
  }))
)

// 表格列定义（带过滤功能）
const columns = computed(() => [
  { title: t('returnOrder.orderNumber'), dataIndex: 'orderNumber', key: 'orderNumber', sorter: true },
  {
    title: t('returnOrder.customer'),
    dataIndex: 'customer',
    key: 'customer',
    sorter: true,
    filters: customers.value.map(c => ({ text: c, value: c })),
    filteredValue: columnFilters.value.customer || null,
    onFilter: (value: string, record: ReturnOrder) => record.customer === value,
  },
  { title: t('returnOrder.receiveDate'), dataIndex: 'receiveDate', key: 'receiveDate', sorter: true },
  { title: t('returnOrder.complaintDate'), dataIndex: 'complaintDate', key: 'complaintDate', sorter: true },
  {
    title: t('returnOrder.returnMethod'),
    dataIndex: 'returnMethod',
    key: 'returnMethod',
    filters: [
      { text: t('returnOrder.methodExpress'), value: 'express' },
      { text: t('returnOrder.methodPickup'), value: 'pickup' },
      { text: t('returnOrder.methodOther'), value: 'other' },
    ],
    filteredValue: columnFilters.value.returnMethod || null,
    onFilter: (value: string, record: ReturnOrder) => record.returnMethod === value,
  },
  { title: t('returnOrder.returnQuantity'), dataIndex: 'returnQuantity', key: 'returnQuantity', sorter: true },
  {
    title: t('common.status'),
    dataIndex: 'status',
    key: 'status',
    filters: statusFilters.value,
    filteredValue: columnFilters.value.status || null,
    onFilter: (value: string, record: ReturnOrder) => record.status === value,
  },
])

// 表格变化处理（分页、筛选、排序）
const handleTableChange = (_pagination: any, filters: Record<string, string[] | null>) => {
  columnFilters.value = filters
}

// 筛选后的数据
const filteredOrders = computed(() => {
  let result = orders.value
  if (filters.value.orderNumber) {
    result = result.filter(o => o.orderNumber.includes(filters.value.orderNumber))
  }
  if (filters.value.customer) {
    result = result.filter(o => o.customer === filters.value.customer)
  }
  if (filters.value.returnMethod) {
    result = result.filter(o => o.returnMethod === filters.value.returnMethod)
  }
  return result
})

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys
}

const handleSearch = async () => {
  loading.value = true
  try {
    orders.value = await returnOrderApi.list({
      orderNumber: filters.value.orderNumber || undefined,
      customer: filters.value.customer || undefined,
    })
    message.success(t('message.searchComplete'))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    orders.value = await returnOrderApi.list()
    const lookups = await lookupApi.getAll()
    customers.value = lookups.customers
  } finally {
    loading.value = false
  }
})

const handleReset = () => {
  filters.value = {
    orderNumber: '',
    customer: undefined,
    receiveDate: null,
    returnMethod: undefined,
  }
}

const handleCreate = () => {
  router.push('/return-orders/new')
}

const handleView = (id: string) => {
  router.push(`/return-orders/${id}`)
}

const handleEdit = (id: string) => {
  router.push(`/return-orders/${id}/edit`)
}

const handleDelete = (id: string) => {
  orders.value = orders.value.filter(o => o.id !== id)
  message.success(t('message.deleteSuccess'))
}

const handleBatchDelete = () => {
  orders.value = orders.value.filter(o => !selectedRowKeys.value.includes(o.id))
  selectedRowKeys.value = []
  message.success(t('message.deleteSuccess'))
}

const handleImport = () => {
  message.info(t('message.importInProgress'))
}

const handleExport = () => {
  message.success(t('message.exportSuccess'))
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

  .filter-card {
    margin-bottom: 16px;

    .filter-buttons {
      text-align: right;
      padding-top: 4px;
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

<template>
  <div class="analysis-order-list">
    <a-page-header :title="t('menu.analysisOrders')" />

    <!-- 搜索条件 -->
    <a-card class="search-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item :label="t('analysisOrder.orderNumber')">
          <a-input
            v-model:value="searchForm.orderNumber"
            :placeholder="t('analysisOrder.orderNumber')"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item :label="t('partDetail.analyst')">
          <a-input
            v-model:value="searchForm.analyst"
            :placeholder="t('partDetail.analyst')"
            allow-clear
            style="width: 150px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item :label="t('common.status')">
          <a-select
            v-model:value="searchForm.status"
            :placeholder="t('common.all')"
            allow-clear
            style="width: 160px"
          >
            <a-select-option v-for="(v, k) in ANALYSIS_ORDER_STATUS_MAP" :key="k" :value="k">
              {{ getStatusLabel(k) }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">{{ t('common.search') }}</a-button>
            <a-button @click="handleReset">{{ t('common.reset') }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="filteredOrders"
        :loading="loading"
        row-key="id"
        :custom-row="customRow"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="ANALYSIS_ORDER_STATUS_MAP[record.status]?.color || 'default'">
              {{ getStatusLabel(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" @click.stop="goToDetail(record.id)">{{ t('common.view') }}</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { TableProps } from 'ant-design-vue'
import { analysisOrderApi } from '@/services/analysisOrderApi'
import { ANALYSIS_ORDER_STATUS_MAP } from '@/types'
import type { AnalysisOrder } from '@/types'

const { t } = useI18n()
const router = useRouter()
const allOrders = ref<AnalysisOrder[]>([])
const loading = ref(false)

const searchForm = reactive({
  orderNumber: '',
  analyst: '',
  status: undefined as string | undefined,
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => t('common.total', { total }),
  pageSizeOptions: ['10', '20', '50'],
})

const statusKeyMap: Record<string, string> = {
  pending_sampling: 'analysisOrder.statusPendingSampling',
  in_detailed_analysis: 'analysisOrder.statusInDetailedAnalysis',
  pending_approval: 'analysisOrder.statusPendingApproval',
  analysis_completed: 'analysisOrder.statusAnalysisCompleted',
  workon_scrap_in_progress: 'analysisOrder.statusWorkonScrapInProgress',
  workon_scrapped: 'analysisOrder.statusWorkonScrapped',
}

const getStatusLabel = (status: string) => {
  const key = statusKeyMap[status]
  return key ? t(key) : status
}

// 应用中搜索过滤
const filteredOrders = computed(() => {
  let result = allOrders.value
  if (searchForm.orderNumber.trim()) {
    const kw = searchForm.orderNumber.trim().toLowerCase()
    result = result.filter(o => (o.orderNumber || '').toLowerCase().includes(kw))
  }
  if (searchForm.analyst.trim()) {
    const kw = searchForm.analyst.trim().toLowerCase()
    result = result.filter(o => (o.analyst || '').toLowerCase().includes(kw))
  }
  if (searchForm.status) {
    result = result.filter(o => o.status === searchForm.status)
  }
  return result
})

const columns: TableProps['columns'] = [
  {
    title: t('analysisOrder.orderNumber'),
    dataIndex: 'orderNumber',
    key: 'orderNumber',
    sorter: (a: AnalysisOrder, b: AnalysisOrder) =>
      (a.orderNumber || '').localeCompare(b.orderNumber || ''),
  },
  {
    title: t('partDetail.analyst'),
    dataIndex: 'analyst',
    key: 'analyst',
    sorter: (a: AnalysisOrder, b: AnalysisOrder) =>
      (a.analyst || '').localeCompare(b.analyst || ''),
  },
  {
    title: t('common.status'),
    dataIndex: 'status',
    key: 'status',
    sorter: (a: AnalysisOrder, b: AnalysisOrder) =>
      (a.status || '').localeCompare(b.status || ''),
  },
  {
    title: t('common.operation'),
    key: 'action',
    width: 80,
  },
]

const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  searchForm.orderNumber = ''
  searchForm.analyst = ''
  searchForm.status = undefined
  pagination.current = 1
}

const handleTableChange: TableProps['onChange'] = (pag) => {
  pagination.current = pag.current ?? 1
  pagination.pageSize = pag.pageSize ?? 10
}

const customRow = (record: AnalysisOrder) => ({
  onClick: () => goToDetail(record.id),
  style: { cursor: 'pointer' },
})

const goToDetail = (id: string) => {
  router.push(`/analysis-orders/${id}`)
}

onMounted(async () => {
  loading.value = true
  try {
    allOrders.value = await analysisOrderApi.list()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="less" scoped>
.analysis-order-list {
  padding: 24px;

  .search-card {
    margin-bottom: 16px;
  }
}
</style>

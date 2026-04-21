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
        <a-form-item v-if="!isAnalyst" :label="t('partDetail.analyst')">
          <a-select
            v-model:value="searchForm.analyst"
            :placeholder="t('validation.pleaseSelect')"
            allow-clear
            style="width: 160px"
          >
            <a-select-option v-for="u in analysts" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('common.status')">
          <a-select
            v-model:value="searchForm.statuses"
            mode="multiple"
            :placeholder="t('common.all')"
            allow-clear
            style="width: 200px"
          >
            <a-select-option v-for="status in statusOptions" :key="status" :value="status">
              {{ getStatusLabel(status) }}
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
        size="middle"
        :bordered="false"
        :sticky="true"
        :custom-row="customRow"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-button type="link" @click.stop="goToDetail(record.id)">{{ t('common.view') }}</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, h, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { Tag } from 'ant-design-vue'
import type { TableProps } from 'ant-design-vue'
import { analysisOrderApi } from '@/services/analysisOrderApi'
import { userApi } from '@/services/userApi'
import { ANALYSIS_ORDER_STATUS_MAP, AnalysisOrderStatus } from '@/types'
import type { AnalysisOrder } from '@/types'
import { usePermissions } from '@/composables/usePermissions'
import { useDevUserStore } from '@/stores/devUser'

const { t } = useI18n()
const { isAnalyst } = usePermissions()
const devUserStore = useDevUserStore()
const router = useRouter()
const route = useRoute()
const allOrders = ref<AnalysisOrder[]>([])
const analysts = ref<{ id: string; loginName: string; displayName: string }[]>([])
const loading = ref(false)

const DEFAULT_EXCLUDED_STATUS = AnalysisOrderStatus.WORKON_SCRAPPED

const defaultStatuses = computed(() =>
  Object.values(AnalysisOrderStatus).filter(s => s !== DEFAULT_EXCLUDED_STATUS)
)

const searchForm = reactive({
  orderNumber: '',
  // 分析师用户默认选择自己
  analyst: isAnalyst ? devUserStore.currentUser.ntAccount : undefined as string | undefined,
  statuses: [...defaultStatuses.value],
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => t('common.total', { total }),
  pageSizeOptions: ['10', '20', '50'],
})

const statusKeyMap: Record<AnalysisOrderStatus, string> = {
  pending_sampling: 'analysisOrder.statusPendingSampling',
  in_detailed_analysis: 'analysisOrder.statusInDetailedAnalysis',
  pending_approval: 'analysisOrder.statusPendingApproval',
  analysis_completed: 'analysisOrder.statusAnalysisCompleted',
  workon_scrap_in_progress: 'analysisOrder.statusWorkonScrapInProgress',
  workon_scrapped: 'analysisOrder.statusWorkonScrapped',
}

const statusOptions = Object.values(AnalysisOrderStatus)

const normalizeStatus = (status: AnalysisOrderStatus | string | null | undefined) => (status || '').trim().toLowerCase()

const getStatusLabel = (status: AnalysisOrderStatus | string) => {
  const normalizedStatus = normalizeStatus(status)
  const key = normalizedStatus in statusKeyMap
    ? statusKeyMap[normalizedStatus as AnalysisOrderStatus]
    : undefined
  return key ? t(key) : status
}

const getStatusColor = (status: AnalysisOrderStatus | string) => {
  const normalizedStatus = normalizeStatus(status)
  return normalizedStatus in ANALYSIS_ORDER_STATUS_MAP
    ? ANALYSIS_ORDER_STATUS_MAP[normalizedStatus as AnalysisOrderStatus].color
    : 'default'
}

// 应用中搜索过滤
const filteredOrders = computed(() => {
  let result = allOrders.value
  if (searchForm.orderNumber.trim()) {
    const kw = searchForm.orderNumber.trim().toLowerCase()
    result = result.filter(o => (o.orderNumber || '').toLowerCase().includes(kw))
  }
  if (searchForm.analyst) {
    result = result.filter(o => o.analyst === searchForm.analyst)
  }
  return result
})

const columns = computed<TableProps['columns']>(() => [
  {
    title: t('analysisOrder.orderNumber'),
    dataIndex: 'orderNumber',
    key: 'orderNumber',
    sorter: (a: AnalysisOrder, b: AnalysisOrder) =>
      (a.orderNumber || '').localeCompare(b.orderNumber || ''),
    customRender: ({ text }: { text: string }) => text || '-'
  },
  {
    title: t('partDetail.analyst'),
    dataIndex: 'analyst',
    key: 'analyst',
    sorter: (a: AnalysisOrder, b: AnalysisOrder) =>
      (a.analyst || '').localeCompare(b.analyst || ''),
    customRender: ({ text }: { text: string }) => {
      if (!text || text === '导入数据无此字段') return '-'
      return text
    },
  },
  {
    title: t('common.status'),
    dataIndex: 'status',
    key: 'status',
    sorter: (a: AnalysisOrder, b: AnalysisOrder) =>
      (a.status || '').localeCompare(b.status || ''),
    customRender: ({ record }: { record: AnalysisOrder }) => {
      return h(Tag, { color: getStatusColor(record.status) }, () => getStatusLabel(record.status))
    },
  },
  {
    title: t('analysisOrder.createdAt'),
    dataIndex: 'createdAt',
    key: 'createdAt',
    sorter: (a: AnalysisOrder, b: AnalysisOrder) =>
      (a.createdAt || '').localeCompare(b.createdAt || ''),
    customRender: ({ text }: { text: string }) => text ? text.replace('T', ' ').substring(0, 19) : '-',
  },
  {
    title: t('analysisOrder.updatedAt'),
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    sorter: (a: AnalysisOrder, b: AnalysisOrder) =>
      (a.updatedAt || '').localeCompare(b.updatedAt || ''),
    customRender: ({ text }: { text: string }) => text ? text.replace('T', ' ').substring(0, 19) : '-',
  },
  {
    title: t('common.operation'),
    key: 'action',
    width: 80,
  },
])

const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  searchForm.orderNumber = ''
  searchForm.analyst = undefined as any
  searchForm.statuses = [...defaultStatuses.value]
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
  applyTaskFiltersFromQuery()
  loading.value = true
  try {
    const [ordersData, analystsData] = await Promise.all([
      analysisOrderApi.list(searchForm.statuses),
      userApi.listAnalysts(),
    ])
    allOrders.value = ordersData
    analysts.value = analystsData
    handleSearch()
  } finally {
    loading.value = false
  }
})

function applyTaskFiltersFromQuery() {
  const status = typeof route.query.status === 'string' ? route.query.status : undefined
  const fromTask = typeof route.query.fromTask === 'string' ? route.query.fromTask : undefined

  if (status && Object.values(AnalysisOrderStatus).includes(status as AnalysisOrderStatus)) {
    searchForm.statuses = [status as AnalysisOrderStatus]
  }
  if (fromTask) {
    message.info(t('dashboard.taskFilterApplied'))
  }
}

watch(
  () => searchForm.statuses,
  (newStatuses) => {
    loading.value = true
    analysisOrderApi.list(newStatuses)
      .then(data => {
        allOrders.value = data
      })
      .finally(() => {
        loading.value = false
      })
  },
  { deep: true }
)

watch(
  () => route.query,
  () => {
    applyTaskFiltersFromQuery()
    handleSearch()
  },
)
</script>

<style lang="less" scoped>
.analysis-order-list {
  padding: 0;

  .search-card {
    margin-bottom: 16px;
  }
}
</style>

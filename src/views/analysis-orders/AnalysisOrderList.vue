<template>
  <div class="analysis-order-list">
    <a-page-header :title="t('menu.analysisOrders')" />

    <!-- 搜索条件 -->
    <a-card class="search-card">
      <a-form layout="inline" :model="filters">
        <a-form-item :label="t('analysisOrder.orderNumber')">
          <a-input
            v-model:value="filters.orderNumber"
            :placeholder="t('analysisOrder.orderNumber')"
            allow-clear
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item :label="t('partDetail.analyst')">
          <a-select
            v-model:value="filters.analyst"
            :placeholder="t('validation.pleaseSelect')"
            allow-clear
            style="width: 160px"
          >
            <a-select-option v-for="u in analysts" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('common.status')">
          <a-select
            v-model:value="filters.statuses"
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
        :data-source="filteredItems"
        :loading="loading"
        row-key="id"
        size="middle"
        :bordered="false"
        :sticky="true"
        :custom-row="customRow"
        :pagination="pagination"
        @change="handleTableChange"
      />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, watch } from 'vue'
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
import { useStatusLabels } from '@/composables/useStatusLabels'
import { useUserNameMap } from '@/composables/useUserNameMap'
import { useTableList } from '@/composables/useTableList'

const { t } = useI18n()
const { isAnalyst, currentUserUsername } = usePermissions()
const { displayName: userDisplayName, load: loadUserNameMap } = useUserNameMap()
const router = useRouter()
const route = useRoute()
const analysts = ref<{ id: string; loginName: string; displayName: string }[]>([])

const filters = ref({
  orderNumber: '',
  analyst: isAnalyst.value ? currentUserUsername.value : undefined as string | undefined,
  statuses: [] as string[],
})

const { getAnalysisLabel, normalizeStatus } = useStatusLabels()
const statusOptions = Object.values(AnalysisOrderStatus)
const getStatusLabel = (status: AnalysisOrderStatus | string) => getAnalysisLabel(status)

const getStatusColor = (status: AnalysisOrderStatus | string) => {
  const normalizedStatus = normalizeStatus(status)
  return normalizedStatus in ANALYSIS_ORDER_STATUS_MAP
    ? ANALYSIS_ORDER_STATUS_MAP[normalizedStatus as AnalysisOrderStatus].color
    : 'default'
}

const {
  loading,
  filteredItems,
  pagination,
  handleTableChange,
  loadData,
  sortState,
} = useTableList<AnalysisOrder>(async (tableParams) => {
  const params: any = {
    page: tableParams.page ?? 1,
    pageSize: tableParams.pageSize ?? 10,
  }
  if (tableParams.sortBy) {
    params.sortBy = tableParams.sortBy
    params.sortOrder = tableParams.sortOrder
  }
  if (filters.value.orderNumber?.trim()) params.orderNumber = filters.value.orderNumber.trim()
  if (filters.value.analyst) params.analyst = filters.value.analyst
  if (filters.value.statuses?.length) params.statuses = filters.value.statuses
  return await analysisOrderApi.list(params)
})

// 默认按更新时间降序
sortState.value = { field: 'updatedAt', order: 'descend' }

const columns = computed<TableProps['columns']>(() => [
  {
    title: t('analysisOrder.orderNumber'),
    dataIndex: 'orderNumber',
    key: 'orderNumber',
    sorter: true,
    sortOrder: sortState.value.field === 'orderNumber' ? sortState.value.order : null,
    customRender: ({ text }: { text: string }) => text || '-',
  },
  {
    title: t('partDetail.analyst'),
    dataIndex: 'analyst',
    key: 'analyst',
    sorter: true,
    sortOrder: sortState.value.field === 'analyst' ? sortState.value.order : null,
    customRender: ({ text }: { text: string }) => {
      if (!text || text === '导入数据无此字段') return '-'
      return userDisplayName(text)
    },
  },
  {
    title: t('common.status'),
    dataIndex: 'status',
    key: 'status',
    sorter: true,
    sortOrder: sortState.value.field === 'status' ? sortState.value.order : null,
    customRender: ({ record }: { record: AnalysisOrder }) => {
      return h(Tag, { color: getStatusColor(record.status) }, () => getStatusLabel(record.status))
    },
  },
])

const handleSearch = async () => {
  pagination.current = 1
  await loadData()
}

const handleReset = async () => {
  filters.value = {
    orderNumber: '',
    analyst: isAnalyst.value ? currentUserUsername.value : undefined,
    statuses: [],
  }
  sortState.value = { field: 'updatedAt', order: 'descend' }
  pagination.current = 1
  await loadData()
}

const customRow = (record: AnalysisOrder) => ({
  onClick: () => router.push(`/analysis-orders/${record.id}`),
  style: { cursor: 'pointer' },
})

function applyTaskFiltersFromQuery() {
  const status = typeof route.query.status === 'string' ? route.query.status : undefined
  const fromTask = typeof route.query.fromTask === 'string' ? route.query.fromTask : undefined
  if (status && Object.values(AnalysisOrderStatus).includes(status as AnalysisOrderStatus)) {
    filters.value.statuses = [status as AnalysisOrderStatus]
  }
  if (fromTask) {
    message.info(t('dashboard.taskFilterApplied'))
  }
}

onMounted(async () => {
  applyTaskFiltersFromQuery()
  const [analystsData] = await Promise.all([
    userApi.listAnalysts(),
    loadUserNameMap(),
    loadData(),
  ])
  analysts.value = analystsData
})

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
.analysis-order-list {
  padding: 0;

  .search-card {
    margin-bottom: 16px;
  }
}
</style>

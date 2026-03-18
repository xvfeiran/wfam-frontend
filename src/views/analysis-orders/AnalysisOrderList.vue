<template>
  <div class="analysis-order-list">
    <a-page-header :title="t('menu.analysisOrders')" />

    <a-card>
      <a-table
        :columns="columns"
        :data-source="orders"
        :loading="loading"
        row-key="id"
        :custom-row="customRow"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="ANALYSIS_ORDER_STATUS_MAP[record.status]?.color || 'default'">
              {{ getStatusLabel(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" @click="goToDetail(record.id)">{{ t('common.view') }}</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { analysisOrderApi } from '@/services/analysisOrderApi'
import { ANALYSIS_ORDER_STATUS_MAP } from '@/types'
import type { AnalysisOrder } from '@/types'

const { t } = useI18n()
const router = useRouter()
const orders = ref<AnalysisOrder[]>([])
const loading = ref(false)

const columns = [
  { title: t('analysisOrder.orderNumber'), dataIndex: 'orderNumber', key: 'orderNumber' },
  { title: t('partDetail.analyst'), dataIndex: 'analyst', key: 'analyst' },
  { title: t('common.status'), dataIndex: 'status', key: 'status' },
  { title: t('common.operation'), key: 'action' },
]

const getStatusLabel = (status: string) => {
  const statusKeyMap: Record<string, string> = {
    pending_sampling: 'analysisOrder.statusPendingSampling',
    in_detailed_analysis: 'analysisOrder.statusInDetailedAnalysis',
    pending_approval: 'analysisOrder.statusPendingApproval',
    analysis_completed: 'analysisOrder.statusAnalysisCompleted',
    workon_scrap_in_progress: 'analysisOrder.statusWorkonScrapInProgress',
    workon_scrapped: 'analysisOrder.statusWorkonScrapped',
  }
  const key = statusKeyMap[status]
  return key ? t(key) : status
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
    orders.value = await analysisOrderApi.list()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="less" scoped>
.analysis-order-list {
  padding: 24px;
}
</style>

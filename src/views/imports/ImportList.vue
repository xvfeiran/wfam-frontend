<template>
  <div class="import-list">
    <div class="toolbar">
      <a-button type="primary" @click="showModal = true">
        <template #icon><import-outlined /></template>
        {{ t('importModule.createImport') }}
      </a-button>
    </div>

    <a-table
      :data-source="records"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      size="middle"
      :bordered="false"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'importType'">
          {{ record.importType === 'return_order' ? t('importModule.returnOrder') : t('importModule.part') }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">
            <LoadingOutlined v-if="record.status === 'processing'" style="margin-right: 4px" />
            {{ statusLabel(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'counts'">
          {{ record.totalCount }} / {{ record.successCount }} / {{ record.failCount }}
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDateTime(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button
            type="link"
            size="small"
            @click="goDetail(record.id)"
          >
            {{ t('importModule.viewDetail') }}
          </a-button>
        </template>
      </template>
    </a-table>

    <ImportModal
      v-model:visible="showModal"
      @success="handleImportSuccess"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { ImportOutlined, LoadingOutlined } from '@ant-design/icons-vue'
import { importApi } from '@/services/importApi'
import type { ImportRecord } from '@/types'
import ImportModal from './components/ImportModal.vue'

const { t } = useI18n()
const router = useRouter()

const records = ref<ImportRecord[]>([])
const loading = ref(false)
const showModal = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
let pollTimer: ReturnType<typeof setTimeout> | null = null

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showTotal: (t_: number) => `共 ${t_} 条`,
}))

const columns = computed(() => [
  { title: t('importModule.importType'), key: 'importType', dataIndex: 'importType' },
  { title: t('importModule.fileName'), key: 'fileName', dataIndex: 'fileName', ellipsis: true },
  { title: t('common.status'), key: 'status', dataIndex: 'status', width: 90 },
  {
    title: `${t('importModule.totalCount')} / ${t('importModule.successCount')} / ${t('importModule.failCount')}`,
    key: 'counts',
    width: 150,
  },
  { title: t('importModule.createdBy'), key: 'createdBy', dataIndex: 'createdBy', width: 120 },
  { title: t('importModule.createdAt'), key: 'createdAt', dataIndex: 'createdAt', width: 160 },
  { title: t('common.operation'), key: 'action', width: 100 },
])

function formatDateTime(raw: string | undefined): string {
  if (!raw) return '—'
  try {
    const d = new Date(raw)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch {
    return raw
  }
}

function statusColor(status: string): string {
  if (status === 'completed') return 'success'
  if (status === 'processing') return 'processing'
  if (status === 'deleting') return 'warning'
  if (status === 'timeout') return 'error'
  if (status === 'rolled_back') return 'default'
  return 'default'
}

function statusLabel(status: string): string {
  if (status === 'processing') return t('importModule.statusImporting')
  if (status === 'deleting') return t('importModule.statusDeleting')
  if (status === 'timeout') return t('importModule.statusTimeout')
  if (status === 'rolled_back') return t('importModule.statusDeleted')
  return t('importModule.statusFinished')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await importApi.list({ page: currentPage.value, pageSize: pageSize.value })
    records.value = res.data
    total.value = res.total
    schedulePollIfNeeded()
  } catch (error: any) {
    records.value = []
    total.value = 0
    stopPoll()
    const errMsg = error?.response?.data?.message || error?.message || t('common.failed')
    message.error(errMsg)
  } finally {
    loading.value = false
  }
}

function schedulePollIfNeeded() {
  stopPoll()
  if (!records.value.some(record => record.status === 'processing')) {
    return
  }
  pollTimer = setTimeout(() => {
    fetchData()
  }, 3000)
}

function stopPoll() {
  if (pollTimer !== null) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function handleTableChange(pag: any) {
  currentPage.value = pag.current
  pageSize.value = pag.pageSize
  fetchData()
}

function handleImportSuccess() {
  currentPage.value = 1
  fetchData()
}

function goDetail(id: string) {
  router.push(`/imports/${id}`)
}

onMounted(async () => {
  await fetchData()
})

onUnmounted(() => {
  stopPoll()
})
</script>

<style scoped>
.import-list {
  padding: 0;
}
.toolbar {
  margin-bottom: 16px;
}
</style>

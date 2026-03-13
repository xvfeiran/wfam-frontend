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
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'importType'">
          {{ record.importType === 'return_order' ? t('importModule.returnOrder') : t('importModule.part') }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">
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
            v-if="record.failCount > 0"
            type="link"
            size="small"
            @click="viewLogs(record)"
          >
            {{ t('importModule.viewLogs') }}
          </a-button>
        </template>
      </template>
    </a-table>

    <ImportModal
      v-model:visible="showModal"
      @success="handleImportSuccess"
    />

    <!-- 失败日志弹窗 -->
    <a-modal
      v-model:open="logsVisible"
      :title="t('importModule.failLogs')"
      :footer="null"
      width="640px"
    >
      <a-table
        :data-source="currentFailLogs"
        :columns="failLogColumns"
        :pagination="false"
        size="small"
        row-key="row"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ImportOutlined } from '@ant-design/icons-vue'
import { importApi } from '@/services/importApi'
import type { ImportRecord } from '@/types'
import ImportModal from './components/ImportModal.vue'

const { t } = useI18n()

const records = ref<ImportRecord[]>([])
const loading = ref(false)
const showModal = ref(false)
const logsVisible = ref(false)
const currentFailLogs = ref<Array<{ row: number; error: string }>>([])

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

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

const failLogColumns = computed(() => [
  { title: t('importModule.rowNum'), dataIndex: 'row', key: 'row', width: 80 },
  { title: t('importModule.errorMsg'), dataIndex: 'error', key: 'error' },
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
  return 'error'
}

function statusLabel(status: string): string {
  if (status === 'completed') return t('common.success')
  if (status === 'processing') return t('importModule.uploading')
  return t('common.failed')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await importApi.list({ page: currentPage.value, pageSize: pageSize.value })
    records.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
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

function viewLogs(record: ImportRecord) {
  try {
    currentFailLogs.value = JSON.parse(record.failLogs || '[]')
  } catch {
    currentFailLogs.value = []
  }
  logsVisible.value = true
}

onMounted(fetchData)
</script>

<style scoped>
.import-list {
  padding: 24px;
}
.toolbar {
  margin-bottom: 16px;
}
</style>

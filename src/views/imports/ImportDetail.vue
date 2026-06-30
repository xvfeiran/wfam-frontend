<template>
  <div class="import-detail">
    <div class="header">
      <a-button @click="goBack">{{ t('common.back') }}</a-button>
      <div class="title">{{ t('importModule.importDetail') }} #{{ record?.id || '' }}</div>
      <a-button
        v-if="record?.status === 'processing'"
        :loading="summaryLoading || filesLoading || logsLoading"
        @click="fetchDetail"
      >
        {{ t('common.refresh') }}
      </a-button>
      <a-button
        danger
        :loading="deleteLoading"
        :disabled="!record || !canDelete(record.status) || deleteCompleted"
        @click="handleDeleteImportedData"
      >
        {{ t('importModule.deleteImportedData') }}
      </a-button>
    </div>

    <a-card :bordered="false" class="summary-card" :loading="summaryLoading">
      <a-descriptions v-if="record" :column="4" size="small" bordered>
        <a-descriptions-item :label="t('importModule.fileName')">{{ record.fileName }}</a-descriptions-item>
        <a-descriptions-item :label="t('importModule.importType')">
          {{ record.importType === 'return_order' ? t('importModule.returnOrder') : t('importModule.part') }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('common.status')">
          <a-tag :color="statusColor(record.status)">
            <LoadingOutlined v-if="record.status === 'processing'" style="margin-right: 4px" />
            {{ statusLabel(record.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('importModule.totalCount')">{{ record.totalCount }}</a-descriptions-item>
        <a-descriptions-item :label="t('importModule.successCount')">{{ record.successCount }}</a-descriptions-item>
        <a-descriptions-item :label="t('importModule.failCount')">{{ record.failCount }}</a-descriptions-item>
        <a-descriptions-item :label="t('importModule.createdBy')">{{ userDisplayName(record.createdBy) }}</a-descriptions-item>
        <a-descriptions-item :label="t('importModule.createdAt')">{{ formatDateTime(record.createdAt) }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card
      v-if="record"
      :bordered="false"
      class="errors-card"
      size="small"
    >
      <a-collapse v-model:active-key="errorsPanelKey" ghost>
        <a-collapse-panel key="errors">
          <template #header>
            <span class="errors-card-title">
              {{ t('importModule.errorLogSummary') }}
              <a-tag v-if="errorsTotal > 0" color="error" style="margin-left: 8px">
                {{ t('importModule.errorLogTotalCount', { count: errorsTotal }) }}
              </a-tag>
              <a-tag v-else color="success" style="margin-left: 8px">
                {{ t('importModule.errorLogEmpty') }}
              </a-tag>
            </span>
          </template>
          <div class="errors-hint">{{ t('importModule.errorLogSummaryHint') }}</div>
          <a-table
            :loading="errorsLoading"
            :data-source="errors"
            :columns="errorColumns"
            :pagination="errorsPagination"
            size="small"
            row-key="_key"
            :scroll="{ x: 1000 }"
            @change="handleErrorsTableChange"
          >
            <template #bodyCell="{ column, record: row }">
              <template v-if="column.key === 'rawData'">
                <a-tooltip v-if="row.rawData" placement="topLeft">
                  <template #title>
                    <pre class="raw-data-pre">{{ formatRawData(row.rawData) }}</pre>
                  </template>
                  <a-button type="link" size="small">{{ t('importModule.rawData') }}</a-button>
                </a-tooltip>
                <span v-else>-</span>
              </template>
            </template>
          </a-table>
        </a-collapse-panel>
      </a-collapse>
    </a-card>

    <a-row :gutter="16" class="body-row">
      <a-col :span="7">
        <a-card :title="t('importModule.fileTree')" size="small" :loading="filesLoading">
          <a-tree
            :tree-data="treeData"
            :selected-keys="selectedTreeKeys"
            default-expand-all
            @select="handleTreeSelect"
          />
        </a-card>
      </a-col>
      <a-col :span="17">
        <a-card :title="activeFileTitle" size="small">
          <a-table
            :loading="logsLoading"
            :data-source="logs"
            :columns="columns"
            :pagination="logsPagination"
            size="small"
            row-key="_key"
            :scroll="{ x: 900 }"
            @change="handleLogsTableChange"
          >
            <template #bodyCell="{ column, record: row }">
              <template v-if="column.key === 'status'">
                <a-tag :color="row.status === 'success' ? 'success' : 'error'">
                  {{ row.status === 'success' ? t('common.success') : t('common.failed') }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Modal, message } from 'ant-design-vue'
import { LoadingOutlined } from '@ant-design/icons-vue'
import { importApi, type ImportFileSummary } from '@/services/importApi'
import type { ImportRecord, ImportLogEntry } from '@/types'
import { useUserNameMap } from '@/composables/useUserNameMap'
import { formatShanghai } from '@/utils/dayjs'

type ViewLogEntry = ImportLogEntry & { _key: string; _fileName: string }

const { t } = useI18n()
const { displayName: userDisplayName } = useUserNameMap()
const route = useRoute()
const router = useRouter()

const record = ref<ImportRecord | null>(null)
const fileSummaries = ref<ImportFileSummary[]>([])
const logs = ref<ViewLogEntry[]>([])
const selectedFile = ref<string>('')
const summaryLoading = ref(false)
const filesLoading = ref(false)
const logsLoading = ref(false)
const logsPage = ref(1)
const logsPageSize = ref(20)
const logsTotal = ref(0)
const deleteLoading = ref(false)
const deleteCompleted = ref(false)

const errors = ref<Array<Record<string, any> & { _key: string }>>([])
const errorsPage = ref(1)
const errorsPageSize = ref(20)
const errorsTotal = ref(0)
const errorsLoading = ref(false)
const errorsPanelKey = ref<string[]>([])

const selectedTreeKeys = computed(() => [selectedFile.value])

const logsPagination = computed(() => ({
  current: logsPage.value,
  pageSize: logsPageSize.value,
  total: logsTotal.value,
  size: 'small' as const,
  showSizeChanger: true,
}))

const treeData = computed(() => {
  const byFolder = new Map<string, Array<{ file: string; success: number; fail: number; total: number }>>()

  for (const summary of fileSummaries.value) {
    const normalized = summary.fileName.replace(/\\/g, '/')
    const idx = normalized.lastIndexOf('/')
    const folder = idx >= 0 ? normalized.substring(0, idx) : '/'
    if (!byFolder.has(folder)) byFolder.set(folder, [])
    byFolder.get(folder)!.push({ file: summary.fileName, success: summary.successCount, fail: summary.failCount, total: summary.totalCount })
  }

  const folderNodes = Array.from(byFolder.entries()).map(([folder, files]) => ({
    title: `${folder} (${files.length})`,
    key: `FOLDER:${folder}`,
    selectable: false,
    children: files.map(f => ({
      title: `${f.file.replace(/\\/g, '/').split('/').pop()} (${f.success}/${f.total})`,
      key: f.file,
      isLeaf: true,
    })),
  }))

  return [
    ...folderNodes,
  ]
})

const activeFileTitle = computed(() => {
  if (!selectedFile.value) return t('importModule.currentFile')
  return `${t('importModule.currentFile')}: ${selectedFile.value}`
})

const columns = computed(() => [
  { title: t('importModule.fileName'), dataIndex: '_fileName', key: 'fileName', width: 220, ellipsis: true },
  { title: t('importModule.rowNum'), dataIndex: 'row', key: 'row', width: 80 },
  { title: t('common.status'), dataIndex: 'status', key: 'status', width: 90 },
  { title: t('importModule.errorCode'), dataIndex: 'errorCode', key: 'errorCode', width: 170 },
  { title: t('importModule.errorMsg'), dataIndex: 'error', key: 'error', ellipsis: true },
  { title: t('importModule.orderNumber'), dataIndex: 'orderNumber', key: 'orderNumber', width: 130 },
  { title: t('importModule.partCode'), dataIndex: 'partCode', key: 'partCode', width: 130 },
  { title: t('importModule.partNumber'), dataIndex: 'partNumber', key: 'partNumber', width: 140 },
])

const errorColumns = computed(() => [
  { title: t('importModule.fileName'), dataIndex: 'fileName', key: 'fileName', width: 260, ellipsis: true },
  { title: t('importModule.rowNum'), dataIndex: 'row', key: 'row', width: 80 },
  { title: t('importModule.errorCode'), dataIndex: 'errorCode', key: 'errorCode', width: 180 },
  { title: t('importModule.errorMsg'), dataIndex: 'error', key: 'error', ellipsis: true },
  { title: t('importModule.rawData'), dataIndex: 'rawData', key: 'rawData', width: 110 },
])

const errorsPagination = computed(() => ({
  current: errorsPage.value,
  pageSize: errorsPageSize.value,
  total: errorsTotal.value,
  size: 'small' as const,
  showSizeChanger: true,
  showTotal: (total: number) => t('importModule.errorLogTotalCount', { count: total }),
}))

function statusLabel(status: string): string {
  if (status === 'processing') return t('importModule.statusImporting')
  if (status === 'deleting') return t('importModule.statusDeleting')
  if (status === 'timeout') return t('importModule.statusTimeout')
  if (status === 'rolled_back') return t('importModule.statusDeleted')
  return t('importModule.statusFinished')
}

function statusColor(status: string): string {
  if (status === 'completed') return 'success'
  if (status === 'processing') return 'processing'
  if (status === 'deleting') return 'warning'
  if (status === 'timeout') return 'error'
  if (status === 'rolled_back') return 'default'
  return 'default'
}

function canDelete(status: string): boolean {
  return status === 'completed' || status === 'timeout'
}

function formatDateTime(raw: string | undefined): string {
  if (!raw) return '-'
  return formatShanghai(raw)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function pollDeleteUntilDone(id: string) {
  for (let i = 0; i < 120; i++) {
    const latest = await importApi.getById(id)
    record.value = latest
    if (latest.status === 'rolled_back') {
      deleteCompleted.value = true
      return
    }
    if (latest.status !== 'deleting') {
      throw new Error(t('importModule.deleteImportedDataFailed'))
    }
    await sleep(1000)
  }
  throw new Error(t('importModule.deleteImportedDataTimeout'))
}

function handleTreeSelect(keys: string[]) {
  if (!keys || keys.length === 0) return
  const key = keys[0]
  if (key.startsWith('FOLDER:')) return
  selectedFile.value = key
  logsPage.value = 1
  fetchLogsByFile()
}

function handleLogsTableChange(pagination: any) {
  logsPage.value = pagination.current
  logsPageSize.value = pagination.pageSize
  fetchLogsByFile()
}

function handleErrorsTableChange(pagination: any) {
  errorsPage.value = pagination.current
  errorsPageSize.value = pagination.pageSize
  fetchErrors()
}

function formatRawData(raw: any): string {
  if (!raw) return ''
  if (typeof raw === 'string') return raw
  try {
    return JSON.stringify(raw, null, 2)
  } catch {
    return String(raw)
  }
}

function goBack() {
  router.push('/imports')
}

function handleDeleteImportedData() {
  const id = String(route.params.id || '')
  if (!id || !record.value) return

  const confirmRef = Modal.confirm({
    title: t('importModule.deleteImportedDataConfirmTitle'),
    content: t('importModule.deleteImportedDataConfirmContent'),
    okType: 'danger',
    onOk: async () => {
      deleteLoading.value = true
      try {
        const res = await importApi.deleteImportedData(id)
        record.value = res
        confirmRef.destroy()
        message.info(t('importModule.deleteImportedDataStarted'))
        await pollDeleteUntilDone(id)
        message.success(t('importModule.deleteImportedDataSuccess'))
        await fetchDetail()
      } catch (error: any) {
        const errMsg = error?.response?.data?.message || error?.message || t('common.failed')
        message.error(errMsg)
      } finally {
        deleteLoading.value = false
      }
    },
  })
}

async function fetchDetail() {
  const id = String(route.params.id || '')
  if (!id) return
  summaryLoading.value = true
  filesLoading.value = true
  try {
    const [detail, files] = await Promise.all([
      importApi.getById(id),
      importApi.listFiles(id),
    ])
    record.value = detail
    fileSummaries.value = files
    summaryLoading.value = false
    filesLoading.value = false

    if (fileSummaries.value.length > 0) {
      selectedFile.value = fileSummaries.value[0].fileName
      fetchLogsByFile()
    } else {
      logs.value = []
      logsTotal.value = 0
    }

    fetchErrors()
  } finally {
    summaryLoading.value = false
    filesLoading.value = false
  }
}

async function fetchErrors() {
  const id = String(route.params.id || '')
  if (!id) return

  errorsLoading.value = true
  try {
    const res = await importApi.listErrors(id, {
      page: errorsPage.value,
      pageSize: errorsPageSize.value,
    })
    const rows = (res.data || []) as Array<Record<string, any>>
    errors.value = rows.map((row, idx) => ({
      ...row,
      _key: `${row.fileName || ''}-${row.row}-${idx}`,
    }))
    errorsTotal.value = res.total || 0
    if (errorsTotal.value > 0 && errorsPanelKey.value.length === 0) {
      errorsPanelKey.value = ['errors']
    }
  } finally {
    errorsLoading.value = false
  }
}

async function fetchLogsByFile() {
  const id = String(route.params.id || '')
  if (!id || !selectedFile.value) return

  logsLoading.value = true
  try {
    const res = await importApi.listLogsByFile(id, {
      fileName: selectedFile.value,
      page: logsPage.value,
      pageSize: logsPageSize.value,
    })
    const parsed = (res.data || []) as ImportLogEntry[]
    logs.value = parsed.map((row, idx) => ({
      ...row,
      _fileName: row.fileName || selectedFile.value,
      _key: `${row.fileName || selectedFile.value}-${row.row}-${idx}`,
    }))
    logsTotal.value = res.total || 0
  } finally {
    logsLoading.value = false
  }
}

onMounted(fetchDetail)
</script>

<style scoped>
.import-detail {
  padding: 0;
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.summary-card {
  margin-bottom: 12px;
}
.errors-card {
  margin-bottom: 12px;
}
.errors-card-title {
  font-weight: 600;
}
.errors-hint {
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  margin-bottom: 8px;
}
.raw-data-pre {
  max-width: 480px;
  max-height: 320px;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

<template>
  <a-modal
    :open="visible"
    :title="t('importModule.createImport')"
    :footer="null"
    :closable="phase !== 'select' || !uploading"
    :mask-closable="false"
    width="760px"
    @cancel="handleClose"
  >
    <!-- 步骤 1：选择文件 -->
    <div v-if="phase === 'select'">
      <a-form layout="vertical">
        <a-form-item :label="t('importModule.importType')">
          <a-select v-model:value="importType" :placeholder="t('importModule.selectType')" style="width: 100%">
            <a-select-option value="part">{{ t('importModule.part') }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('importModule.fileName')">
          <a-upload :before-upload="handleBeforeUpload" :show-upload-list="false" accept=".zip">
            <a-button>
              <template #icon><upload-outlined /></template>
              {{ selectedFile ? selectedFile.name : t('importModule.selectFile') }}
            </a-button>
          </a-upload>
          <div v-if="selectedFile" style="margin-top: 4px; color: #888; font-size: 12px;">
            {{ selectedFile.name }} — {{ (selectedFile.size / 1024).toFixed(1) }} KB
          </div>
        </a-form-item>
      </a-form>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
        <a-button @click="handleClose">{{ t('common.cancel') }}</a-button>
        <a-button
          type="primary"
          :loading="uploadDebounce.isDebouncing.value"
          :disabled="!importType || !selectedFile"
          @click="handleUpload"
        >
          {{ uploadDebounce.isDebouncing.value ? t('importModule.uploading') : t('common.confirm') }}
        </a-button>
      </div>
    </div>

    <!-- 步骤 2：处理中 -->
    <div v-else-if="phase === 'processing'" style="text-align: center; padding: 40px 0;">
      <a-spin size="large" />
      <div style="margin-top: 16px; font-size: 15px;">{{ t('importModule.processing') }}</div>
      <div style="margin-top: 8px; color: #999; font-size: 12px;">{{ t('importModule.processingHint') }}</div>
      <div style="margin-top: 16px;">
        <a-button @click="handleClose">{{ t('importModule.closeAndContinue') }}</a-button>
      </div>
    </div>

    <!-- 步骤 3：结果 -->
    <div v-else-if="phase === 'result' && result">
      <!-- 统计摘要 -->
      <a-result
        :status="result.status === 'failed' ? 'error' : result.failCount === 0 ? 'success' : 'warning'"
        style="padding: 16px 0 8px"
      >
        <template #title>
          <span v-if="result.status === 'failed'">{{ t('importModule.importFailed') }}</span>
          <span v-else>
            {{ t('importModule.resultSuccess', { success: result.successCount }) }}
            <span v-if="result.failCount > 0" style="color: #faad14; margin-left: 8px;">
              {{ t('importModule.resultFail', { fail: result.failCount }) }}
            </span>
          </span>
        </template>
      </a-result>

      <!-- 完整明细表 -->
      <div v-if="importLogEntries.length > 0">
        <a-divider style="margin: 8px 0 12px">{{ t('importModule.importDetail') }}</a-divider>
        <a-table
          :data-source="importLogEntries"
          :columns="importLogColumns"
          :pagination="{ pageSize: 8, size: 'small', showSizeChanger: false }"
          size="small"
          row-key="row"
          :row-class-name="(r: any) => r.status === 'failed' ? 'row-failed' : 'row-success'"
        >
          <template #bodyCell="{ column, record: r }">
            <template v-if="column.key === 'status'">
              <a-tag :color="r.status === 'success' ? 'success' : 'error'">
                {{ r.status === 'success' ? t('common.success') : t('common.failed') }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'orderNumber'">
              <span style="font-family: monospace;">{{ r.orderNumber ?? '—' }}</span>
            </template>
            <template v-else-if="column.key === 'error'">
              <span v-if="r.error" style="color: #ff4d4f;">{{ r.error }}</span>
              <span v-else-if="r.rawData" style="color: #999; font-size: 11px;">
                {{ Object.entries(r.rawData).map(([k,v]) => `${k}: ${v ?? '空'}`).join(' | ') }}
              </span>
            </template>
          </template>
        </a-table>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <a-button type="primary" @click="handleDone">{{ t('common.confirm') }}</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { importApi } from '@/services/importApi'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import type { ImportRecord, ImportLogEntry } from '@/types'

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS  = 5 * 60 * 1000

defineProps<{ visible: boolean }>()
const emit  = defineEmits(['update:visible', 'success'])
const { t } = useI18n()

type Phase = 'select' | 'processing' | 'result'

const phase        = ref<Phase>('select')
const importType   = ref<string | undefined>('part')
const selectedFile = ref<File | null>(null)
const uploading    = ref(false)
const polling      = ref(false)
const result       = ref<ImportRecord | null>(null)
const shouldRefreshOnClose = ref(false)

	// 防抖处理
	const uploadDebounce = useDebouncedClick({ delay: 1000 })

let pollTimer: ReturnType<typeof setTimeout> | null = null
let pollStart = 0

const importLogEntries = computed<ImportLogEntry[]>(() => {
  if (!result.value?.importLogs) return []
  try { return JSON.parse(result.value.importLogs) } catch { return [] }
})

const importLogColumns = computed(() => {
  const baseColumns = [
    { title: t('importModule.rowNum'), key: 'row', dataIndex: 'row', width: 60 },
    { title: t('common.status'), key: 'status', dataIndex: 'status', width: 80 },
  ]

  if (importType.value === 'return_order') {
    return [
      ...baseColumns,
      { title: t('importModule.fileName'), key: 'fileName', dataIndex: 'fileName', width: 180 },
      { title: t('importModule.orderNumber'), key: 'orderNumber', dataIndex: 'orderNumber', width: 120 },
      { title: t('importModule.receiveDate'), key: 'receiveDate', dataIndex: 'receiveDate', width: 100 },
      { title: t('importModule.trackingNumber'), key: 'trackingNumber', dataIndex: 'trackingNumber', width: 130 },
      { title: t('importModule.errorOrData'), key: 'error', dataIndex: 'error', ellipsis: true },
    ]
  } else if (importType.value === 'part') {
    return [
      ...baseColumns,
      { title: t('importModule.fileName'), key: 'fileName', dataIndex: 'fileName', width: 180 },
      { title: t('importModule.orderNumber'), key: 'orderNumber', dataIndex: 'orderNumber', width: 120 },
      { title: t('importModule.partCode'), key: 'partCode', dataIndex: 'partCode', width: 150 },
      { title: t('importModule.partNumber'), key: 'partNumber', dataIndex: 'partNumber', width: 130 },
      { title: t('importModule.errorOrData'), key: 'error', dataIndex: 'error', ellipsis: true },
    ]
  }
  return baseColumns
})

function handleBeforeUpload(file: File) {
  selectedFile.value = file
  return false
}

async function handleUpload() {
  if (!importType.value) return
  uploadDebounce.execute(async () => {
    try {
      let record
      if (importType.value === 'return_order') {
        if (!selectedFile.value) {
          throw new Error(t('importModule.selectFile'))
        }
        record = await importApi.importReturnOrders(selectedFile.value)
      } else if (importType.value === 'part') {
        if (!selectedFile.value) {
          throw new Error(t('importModule.selectFile'))
        }
        record = await importApi.importParts(selectedFile.value)
      } else {
        throw new Error('不支持的导入类型')
      }
      shouldRefreshOnClose.value = true
      if (record.status !== 'processing') {
        result.value = record
        phase.value = 'result'
      } else {
        phase.value = 'processing'
        polling.value = true
        pollStart = Date.now()
        schedulePoll(record.id)
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || e?.message || t('common.failed'))
    }
  })
}

function schedulePoll(id: string) {
  pollTimer = setTimeout(() => doPoll(id), POLL_INTERVAL_MS)
}

async function doPoll(id: string) {
  if (Date.now() - pollStart > POLL_TIMEOUT_MS) {
    polling.value = false
    result.value = {
      id,
      importType: importType.value || 'part',
      fileName: selectedFile.value?.name ?? '',
      status: 'failed', totalCount: 0, successCount: 0, failCount: 0,
      failLogs: '[]',
      importLogs: JSON.stringify([{ row: 0, status: 'failed', error: '处理超时，请联系管理员查看日志' }]),
      createdBy: '', createdAt: '',
    }
    phase.value = 'result'
    return
  }
  try {
    const record = await importApi.getById(id)
    if (record.status === 'processing') {
      schedulePoll(id)
    } else {
      polling.value = false
      result.value = record
      phase.value = 'result'
    }
  } catch {
    schedulePoll(id) // 网络抖动，继续轮询
  }
}

function stopPoll() {
  if (pollTimer !== null) { clearTimeout(pollTimer); pollTimer = null }
  polling.value = false
}

function handleDone() {
  shouldRefreshOnClose.value = false
  emit('success')
  handleClose()
}

function handleClose() {
  const needsRefresh = shouldRefreshOnClose.value
  stopPoll()
  phase.value = 'select'
  importType.value = 'part'
  selectedFile.value = null
  uploading.value = false
  result.value = null
  shouldRefreshOnClose.value = false
  emit('update:visible', false)
  if (needsRefresh) {
    emit('success')
  }
}

onUnmounted(stopPoll)
</script>

<style scoped>
:deep(.row-failed td) { background: #fff2f0 !important; }
:deep(.row-success td) { background: #f6ffed !important; }
</style>

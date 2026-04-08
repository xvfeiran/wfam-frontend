import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ocrApi } from '@/services/ocrApi'
import type { OcrResult } from '@/services/ocrApi'

export type OcrFieldStatus = 'loading' | 'success' | 'error'

export interface OCRResultItem {
  value: string
  status: OcrFieldStatus
}

const OCR_FIELDS = [
  'vehicleProductionDate',
  'vehiclePurchaseDate',
  'vehicleFailureDate',
  'vehicleVIN',
  'vehicleMileage',
  'customerDescription',
] as const

type OcrField = (typeof OCR_FIELDS)[number]

/** 图片区域的展示状态 */
export type OcrZoneState = 'idle' | 'uploading' | 'processing' | 'success' | 'failed'

export function useOCR(form: Record<string, any>, partId?: string) {
  const { t } = useI18n()

  const zoneState = ref<OcrZoneState>('idle')
  const previewUrl = ref<string>('')
  const ocrResults = reactive<Record<OcrField, OCRResultItem>>(
    Object.fromEntries(OCR_FIELDS.map(f => [f, { value: '', status: 'loading' as OcrFieldStatus }])) as Record<OcrField, OCRResultItem>,
  )

  const ocrLoading = computed(() => zoneState.value === 'uploading' || zoneState.value === 'processing')

  /** 当前 OCR 任务 ID（新建 Part 时提交表单需要传给后端以完成绑定） */
  const ocrTaskId = ref<string | null>(null)

  let pollTimer: ReturnType<typeof setInterval> | null = null

  const handleOCRUpload = async (file: File) => {
    previewUrl.value = URL.createObjectURL(file)
    zoneState.value = 'uploading'
    ocrTaskId.value = null
    resetResults()

    try {
      const task = await ocrApi.createTask(file, partId)
      ocrTaskId.value = task.taskId
      zoneState.value = 'processing'
      startPolling(task.taskId)
    } catch (e) {
      zoneState.value = 'failed'
      message.error(t('ocr.uploadFailed'))
    }

    return false
  }

  const startPolling = (taskId: string) => {
    stopPolling()
    pollTimer = setInterval(async () => {
      try {
        const task = await ocrApi.getTask(taskId)

        if (task.status === 'SUCCESS') {
          stopPolling()
          writeResultsToForm(task.result)
          zoneState.value = 'success'
          message.success(t('ocr.success'))
        } else if (task.status === 'FAILED') {
          stopPolling()
          setAllError()
          zoneState.value = 'failed'
          message.warning(t('ocr.degraded'))
        }
        // CREATED / PROCESSING：继续轮询
      } catch (e) {
        stopPolling()
        setAllError()
        zoneState.value = 'failed'
        message.error(t('ocr.pollError'))
      }
    }, 3000)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const stopOCR = () => {
    stopPolling()
    zoneState.value = 'idle'
  }

  const retake = () => {
    stopPolling()
    previewUrl.value = ''
    resetResults()
    zoneState.value = 'idle'
  }

  // ── 私有辅助 ──────────────────────────────────────────────────

  /** 识别成功后直接写入表单字段（覆盖已有值） */
  function writeResultsToForm(result?: OcrResult) {
    const map: Partial<Record<OcrField, string | number | undefined>> = {
      vehicleProductionDate: result?.vehicleProductionDate,
      vehiclePurchaseDate:   result?.vehiclePurchaseDate,
      vehicleFailureDate:    result?.vehicleFailureDate,
      vehicleVIN:            result?.vehicleVIN,
      vehicleMileage:        result?.vehicleMileage,
      customerDescription:   result?.customerDescription,
    }

    OCR_FIELDS.forEach(field => {
      const val = map[field]
      if (val != null) {
        // 写入表单
        switch (field) {
          case 'vehicleProductionDate':
          case 'vehiclePurchaseDate':
          case 'vehicleFailureDate':
            form[field] = dayjs(val as string)
            break
          case 'vehicleMileage':
            form[field] = Number(val)
            break
          default:
            form[field] = val
        }
        ocrResults[field] = { value: String(val), status: 'success' }
      } else {
        ocrResults[field] = { value: '', status: 'error' }
      }
    })
  }

  function resetResults() {
    OCR_FIELDS.forEach(f => {
      ocrResults[f] = { value: '', status: 'loading' }
    })
  }

  function setAllError() {
    OCR_FIELDS.forEach(f => {
      ocrResults[f] = { value: '', status: 'error' }
    })
  }

  return {
    zoneState,
    previewUrl,
    ocrLoading,
    ocrResults,
    ocrTaskId,
    handleOCRUpload,
    stopOCR,
    retake,
  }
}

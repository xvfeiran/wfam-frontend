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
  'repairStation',
  'complaintLocation',
] as const

type OcrField = (typeof OCR_FIELDS)[number]

/** 图片区域的展示状态 */
export type OcrZoneState = 'idle' | 'uploading' | 'processing' | 'success' | 'failed'

export function useOCR(form: Record<string, any>) {
  const { t } = useI18n()

  const zoneState = ref<OcrZoneState>('idle')
  const previewUrl = ref<string>('')
  const ocrResults = reactive<Record<OcrField, OCRResultItem>>(
    Object.fromEntries(OCR_FIELDS.map(f => [f, { value: '', status: 'loading' as OcrFieldStatus }])) as Record<OcrField, OCRResultItem>,
  )

  const ocrLoading = computed(() => zoneState.value === 'uploading' || zoneState.value === 'processing')

  /** 当前 OCR 任务 ID（新建 Part 时提交表单需要传给后端以完成绑定） */
  const ocrTaskId = ref<string | null>(null)

  /** 前端计时：从上传开始经过的秒数 */
  const elapsedSeconds = ref(0)
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let elapsedTimer: ReturnType<typeof setInterval> | null = null

  const handleOCRUpload = async (file: File) => {
    previewUrl.value = URL.createObjectURL(file)
    zoneState.value = 'uploading'
    ocrTaskId.value = null
    resetResults()
    startElapsed()

    try {
      const task = await ocrApi.createTask(file)
      ocrTaskId.value = task.taskId
      zoneState.value = 'processing'
      startPolling(task.taskId)
    } catch (e) {
      stopElapsed()
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
          stopElapsed()
          writeResultsToForm(task.result)
          zoneState.value = 'success'
          message.success(t('ocr.success'))
        } else if (task.status === 'FAILED') {
          stopPolling()
          stopElapsed()
          setAllError()
          zoneState.value = 'failed'
          message.warning(task.errorMessage || t('ocr.degraded'))
        }
        // CREATED / PROCESSING：继续轮询
      } catch (e) {
        stopPolling()
        stopElapsed()
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

  const startElapsed = () => {
    stopElapsed()
    elapsedSeconds.value = 0
    elapsedTimer = setInterval(() => { elapsedSeconds.value++ }, 1000)
  }

  const stopElapsed = () => {
    if (elapsedTimer) {
      clearInterval(elapsedTimer)
      elapsedTimer = null
    }
  }

  const stopOCR = () => {
    stopPolling()
    stopElapsed()
    zoneState.value = 'idle'
  }

  const retake = () => {
    stopPolling()
    stopElapsed()
    previewUrl.value = ''
    resetResults()
    zoneState.value = 'idle'
  }

  const retryOCR = async () => {
    if (!ocrTaskId.value) {
      message.warning(t('ocr.noRetryTask'))
      return
    }

    try {
      resetResults()
      zoneState.value = 'processing'
      const task = await ocrApi.retryTask(ocrTaskId.value)
      ocrTaskId.value = task.taskId
      startPolling(task.taskId)
      message.info(t('ocr.retrying'))
    } catch {
      zoneState.value = 'failed'
      message.error(t('ocr.retryFailed'))
    }
  }

  // ── 私有辅助 ──────────────────────────────────────────────────

  /** 识别成功后直接写入表单字段（覆盖已有值） */
  function writeResultsToForm(result?: OcrResult, applyToForm = true) {
    const map: Partial<Record<OcrField, string | number | undefined>> = {
      vehicleProductionDate: result?.vehicleProductionDate,
      vehiclePurchaseDate: result?.vehiclePurchaseDate,
      vehicleFailureDate: result?.vehicleFailureDate,
      vehicleVIN: result?.vehicleVIN,
      vehicleMileage: result?.vehicleMileage,
      customerDescription: result?.customerDescription,
      repairStation: result?.repairStation,
      complaintLocation: result?.complaintLocation,
    }

    OCR_FIELDS.forEach(field => {
      const val = map[field]
      if (val != null) {
        if (applyToForm) {
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
        }
        ocrResults[field] = { value: String(val), status: 'success' }
      } else {
        // 本次识别该字段无值：清空表单字段，避免残留上一次识别的内容
        if (applyToForm) {
          switch (field) {
            case 'vehicleProductionDate':
            case 'vehiclePurchaseDate':
            case 'vehicleFailureDate':
            case 'vehicleMileage':
              form[field] = null
              break
            default:
              form[field] = ''
          }
        }
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
    elapsedSeconds,
    handleOCRUpload,
    retryOCR,
    stopOCR,
    retake,
  }
}

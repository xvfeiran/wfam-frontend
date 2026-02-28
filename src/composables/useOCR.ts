import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

interface OCRResultItem {
  value: string
  status: 'loading' | 'success' | 'error'
  confidence?: number
}

const OCR_FIELDS = [
  'vehicleProductionDate',
  'vehiclePurchaseDate',
  'vehicleFailureDate',
  'vehicleVIN',
  'vehicleMileage',
  'customerDescription',
] as const

export function useOCR(form: Record<string, any>) {
  const { t } = useI18n()

  const ocrLoading = ref(false)
  const ocrResults = reactive<Record<string, OCRResultItem>>(
    Object.fromEntries(OCR_FIELDS.map(f => [f, { value: '', status: 'loading' as const }])),
  )

  const hasOCRResults = computed(() => Object.values(ocrResults).some(r => r.status === 'success'))

  const handleOCRUpload = (_file: File) => {
    ocrLoading.value = true
    OCR_FIELDS.forEach(key => {
      ocrResults[key] = { value: '', status: 'loading' }
    })

    // 模拟OCR识别过程
    setTimeout(() => {
      ocrResults.vehicleProductionDate = { value: '2025-06-15', status: 'success', confidence: 0.95 }
      ocrResults.vehiclePurchaseDate = { value: '2025-07-20', status: 'success', confidence: 0.92 }
      ocrResults.vehicleFailureDate = { value: '2026-01-10', status: 'success', confidence: 0.88 }
      ocrResults.vehicleVIN = { value: 'LSVAB2183E2123456', status: 'success', confidence: 0.96 }
      ocrResults.vehicleMileage = { value: '15234', status: 'success', confidence: 0.90 }
      ocrResults.customerDescription = { value: '发动机异响，怠速不稳', status: 'success', confidence: 0.85 }
      ocrLoading.value = false
      message.success(t('ocr.success'))
    }, 2000)

    return false
  }

  const stopOCR = () => {
    ocrLoading.value = false
    OCR_FIELDS.forEach(key => {
      if (ocrResults[key].status === 'loading') {
        ocrResults[key].status = 'error'
      }
    })
  }

  const applyOCR = (field: string) => {
    const result = ocrResults[field]
    if (result.status !== 'success') return

    switch (field) {
      case 'vehicleProductionDate':
      case 'vehiclePurchaseDate':
      case 'vehicleFailureDate':
        form[field] = dayjs(result.value)
        break
      case 'vehicleMileage':
        form[field] = parseInt(result.value)
        break
      default:
        form[field] = result.value
    }
    message.success(t('message.applied'))
  }

  const applyAllOCR = () => {
    OCR_FIELDS.forEach(key => {
      if (ocrResults[key].status === 'success') applyOCR(key)
    })
    message.success(t('message.allApplied'))
  }

  return { ocrLoading, ocrResults, hasOCRResults, handleOCRUpload, stopOCR, applyOCR, applyAllOCR }
}

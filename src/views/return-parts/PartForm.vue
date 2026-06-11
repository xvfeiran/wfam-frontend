<template>
  <div class="part-form">
    <a-page-header
      :title="isEdit ? t('returnPart.editTitle') : t('returnPart.createTitle')"
      @back="handleBack"
    />

    <!-- OCR拍照识别区 - 嵌入客诉信息卡上方 (0km退货单不显示) -->
    <OCRActionBar
      v-if="!is0kmOrder"
      :zone-state="zoneState"
      :preview-url="previewUrl"
      :ocr-results="ocrResults"
      :elapsed-seconds="elapsedSeconds"
      @handle-o-c-r-upload="handleOCRUpload"
      @retry-o-c-r="retryOCR"
      @stop-o-c-r="stopOCR"
      @retake="retake"
      @preview-confirm="handlePreviewConfirm"
    />

    <!-- 基础信息卡片 -->
    <BasicInfoCard
      ref="basicInfoCardRef"
      :form="form"
      :is-edit="isEdit"
      :has-preset-order="hasPresetOrder"
      :orders="orders"
      :business-units="businessUnits"
      :product-platforms="productPlatforms"
      :failure-types="failureTypes"
      :analysts="analysts"
      :cqes="cqes"
      :part-id="isEdit ? partId : undefined"
      :submitted="isSubmitted"
    />

    <!-- 客诉信息卡片 (0km退货单不显示) -->
    <ComplaintInfoCard v-if="!is0kmOrder" :form="form" />

    <!-- 照片上传区 -->
    <PhotoUploadCard
      v-model:image-paths="imagePaths"
    />

    <!-- 底部操作栏 -->
    <div class="form-footer">
      <a-space>
        <a-button @click="handleBack">{{ t('common.cancel') }}</a-button>
        <!-- 草稿状态：显示保存和提交按钮 -->
        <template v-if="!isSubmitted">
          <a-button :disabled="saveDebounce.isDebouncing.value" :loading="saveDebounce.isDebouncing.value" @click="handleSave">{{ t('common.save') }}</a-button>
          <a-button type="primary" :disabled="isOcrProcessing || submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('common.submit') }}</a-button>
        </template>
        <!-- 已提交状态且有权限：只显示提交按钮（不允许暂存） -->
        <template v-else-if="canEditSubmittedPart">
          <a-button type="primary" :disabled="isOcrProcessing || submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('common.submit') }}</a-button>
        </template>
        <!-- 已提交状态且无权限：显示不可编辑提示 -->
        <template v-else>
          <a-tag color="default">{{ t('validation.submittedCannotEdit') }}</a-tag>
        </template>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navigateTo } from '@/services/navigationService'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { returnOrderApi } from '@/services/returnOrderApi'
import { partApi } from '@/services/partApi'
import { lookupApi } from '@/services/lookupApi'
import { userApi } from '@/services/userApi'
import { useOCR } from '@/composables/useOCR'
import { usePermissions } from '@/composables/usePermissions'
import { isAftermarket } from '@/constants/complaintTypes'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import OCRActionBar from './components/OCRActionBar.vue'
import BasicInfoCard from './components/BasicInfoCard.vue'
import ComplaintInfoCard from './components/ComplaintInfoCard.vue'
import PhotoUploadCard from './components/PhotoUploadCard.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { canEditSubmittedForm } = usePermissions()

// 防抖处理
const saveDebounce = useDebouncedClick({ delay: 1000 })
const submitDebounce = useDebouncedClick({ delay: 1000 })

const isEdit = computed(() => !!route.params.id)
const partId = computed(() => route.params.id as string)

// 是否已提交到后端（仅编辑模式下根据后端返回的 partNumber 判断）
const originallySubmitted = ref(false)
const partStatus = ref('')
const isSubmitted = computed(() => isEdit.value && originallySubmitted.value && partStatus.value !== 'in_initial_analysis')

const canEditSubmittedPart = computed(() => {
  if (!isSubmitted.value) return true // 未提交都可以编辑
  return canEditSubmittedForm.value // 已提交需要 QMC Leader 权限
})

const basicInfoCardRef = ref<any>(null)

// 当前所选退货单信息（用于判断是否为0km）
const selectedOrder = ref<any>(null)

// 判断是否为0km退货单（非售后件=0km）
const is0kmOrder = computed(() => {
	if (!selectedOrder.value?.complaintType) return false
	return !isAftermarket(selectedOrder.value.complaintType)
})

const orders = ref<any[]>([])
const businessUnits = ref<string[]>([])
const productPlatforms = ref<string[]>([])
const failureTypes = ref<string[]>([])
const analysts = ref<{ id: string; loginName: string; displayName: string }[]>([])
const cqes = ref<{ id: string; loginName: string; displayName: string }[]>([])

const hasPresetOrder = computed(() => {
  return !!route.query.orderNumber && !isEdit.value
})

// 检查是否从退货单详情页进入（用于返回逻辑）
const fromOrderDetail = computed(() => {
  return !!route.query.fromOrderDetail
})

const form = reactive({
  partNumber: '',
  orderId: undefined as string | undefined,
  partCode: '',
  businessUnit: undefined as string | undefined,
  productPlatform: undefined as string | undefined,
  partProductionDate: null as any | null,
  productionShift: '',
  otherInfo: '',
  complaintType: undefined as string | undefined,
  failureType: undefined as string | undefined,
  responsibleEngineer: undefined as string | undefined,
  analyst: undefined as string | undefined,
  repairStation: '',
  complaintLocation: '',
  vehicleProductionDate: null as Dayjs | null,
  vehiclePurchaseDate: null as Dayjs | null,
  vehicleFailureDate: null as Dayjs | null,
  vehicleVIN: '',
  vehicleMileage: undefined as number | undefined,
  customerDescription: '',
  otherDescription: '',
})

const imagePaths = ref<string[]>([])

const { zoneState, previewUrl, ocrResults, ocrTaskId, elapsedSeconds, handleOCRUpload, retryOCR, stopOCR, retake } = useOCR(form)

const isOcrProcessing = computed(() => zoneState.value === 'uploading' || zoneState.value === 'processing')

onMounted(async () => {
  const [lookups, ordersData, analystsData, cqesData] = await Promise.all([
    lookupApi.getAll(),
    returnOrderApi.list({ statuses: ['submitted'], pageSize: 100 }),
    userApi.listAnalysts(),
    userApi.listCQEs(),
  ])
  businessUnits.value = lookups.businessUnits
  productPlatforms.value = lookups.productPlatforms
  failureTypes.value = lookups.failureTypes
  orders.value = ordersData.data
  analysts.value = analystsData
  cqes.value = cqesData

  if (isEdit.value) {
    const part = await partApi.getById(partId.value)
    if (part) {
      populateForm(part)
    }
  } else if (route.query.orderId && route.query.orderId !== 'new') {
    form.orderId = route.query.orderId as string
  }
})

function populateForm(part: any) {
  originallySubmitted.value = !!part.partNumber
  partStatus.value = part.status || ''
  form.partNumber = part.partNumber
  form.orderId = part.orderId
  form.partCode = part.partCode
  form.businessUnit = part.businessUnit
  form.productPlatform = part.productPlatform
  form.partProductionDate = part.partProductionDate ? dayjs(part.partProductionDate) : null
  form.productionShift = part.productionShift || ''
  form.otherInfo = part.otherInfo || ''
  form.complaintType = part.complaintType || undefined
  form.failureType = part.failureType || undefined
  form.responsibleEngineer = part.responsibleEngineer || undefined
  form.analyst = part.analyst || undefined
  form.repairStation = part.repairStation || ''
  form.complaintLocation = part.complaintLocation || ''
  form.vehicleProductionDate = part.vehicleProductionDate ? dayjs(part.vehicleProductionDate) : null
  form.vehiclePurchaseDate = part.vehiclePurchaseDate ? dayjs(part.vehiclePurchaseDate) : null
  form.vehicleFailureDate = part.vehicleFailureDate ? dayjs(part.vehicleFailureDate) : null
  form.vehicleVIN = part.vehicleVIN || ''
  form.vehicleMileage = part.vehicleMileage
  form.customerDescription = part.customerDescription || ''
  form.otherDescription = part.otherDescription || ''
  imagePaths.value = part.images || []
}

// 监听订单选择变化，获取订单详情以判断是否为0km
watch(
  () => form.orderId,
  async (newOrderId) => {
    if (newOrderId) {
      const order = orders.value.find(o => o.id === newOrderId)
      if (order) {
        selectedOrder.value = order
      } else {
        // 如果列表中找不到（如编辑模式），从API获取
        try {
          const orderDetail = await returnOrderApi.getById(newOrderId)
          selectedOrder.value = orderDetail
        } catch {
          selectedOrder.value = null
        }
      }
    } else {
      selectedOrder.value = null
    }
  },
  { immediate: true }
)

// 处理 OCR 预览确认 - 将编辑后的表单数据同步到主表单
const handlePreviewConfirm = (previewForm: Record<string, any>) => {
  if (previewForm.vehicleProductionDate) {
    form.vehicleProductionDate = previewForm.vehicleProductionDate
  }
  if (previewForm.vehiclePurchaseDate) {
    form.vehiclePurchaseDate = previewForm.vehiclePurchaseDate
  }
  if (previewForm.vehicleFailureDate) {
    form.vehicleFailureDate = previewForm.vehicleFailureDate
  }
  if (previewForm.vehicleVIN !== undefined) {
    form.vehicleVIN = previewForm.vehicleVIN
  }
  if (previewForm.vehicleMileage !== null) {
    form.vehicleMileage = previewForm.vehicleMileage
  }
  if (previewForm.repairStation !== undefined) {
    form.repairStation = previewForm.repairStation
  }
  if (previewForm.complaintLocation !== undefined) {
    form.complaintLocation = previewForm.complaintLocation
  }
  if (previewForm.customerDescription !== undefined) {
    form.customerDescription = previewForm.customerDescription
  }
  message.success(t('ocr.appliedToForm'))
}

const handleBack = () => {
  router.back()
}

const validatePartNumberUnique = async (): Promise<boolean> => {
  if (!form.partNumber || !form.orderId || isSubmitted.value) return true
  try {
    const available = await partApi.checkPartNumberUnique(form.partNumber, form.orderId, isEdit.value ? partId.value : undefined)
    if (!available) {
      message.error(t('validation.partNumberDuplicate'))
      return false
    }
  } catch {
    // 网络错误放行，由后端兜底
  }
  return true
}

const buildPartPayload = () => ({
  orderId: form.orderId,
  partNumber: form.partNumber || undefined,
  partCode: form.partCode,
  businessUnit: form.businessUnit,
  productPlatform: form.productPlatform,
  partProductionDate: form.partProductionDate ? form.partProductionDate.format('YYYY-MM-DD') : undefined,
  productionShift: form.productionShift || undefined,
  otherInfo: form.otherInfo || undefined,
  complaintType: form.complaintType || undefined,
  failureType: form.failureType || undefined,
  responsibleEngineer: form.responsibleEngineer || undefined,
  analyst: form.analyst || undefined,
  repairStation: form.repairStation || undefined,
  complaintLocation: form.complaintLocation || undefined,
  vehicleProductionDate: form.vehicleProductionDate ? form.vehicleProductionDate.format('YYYY-MM-DD') : undefined,
  vehiclePurchaseDate: form.vehiclePurchaseDate ? form.vehiclePurchaseDate.format('YYYY-MM-DD') : undefined,
  vehicleFailureDate: form.vehicleFailureDate ? form.vehicleFailureDate.format('YYYY-MM-DD') : undefined,
  vehicleVIN: form.vehicleVIN || undefined,
  vehicleMileage: form.vehicleMileage || undefined,
  customerDescription: form.customerDescription || undefined,
  otherDescription: form.otherDescription || undefined,
  images: imagePaths.value.length > 0 ? imagePaths.value : undefined,
})

const handleSave = () => saveDebounce.execute(async () => {
  try {
    await basicInfoCardRef.value?.validate()
    if (!await validatePartNumberUnique()) return

    if (isEdit.value) {
      await partApi.update(partId.value, buildPartPayload())
    } else {
      await partApi.create(buildPartPayload(), ocrTaskId.value)
    }
    message.success(t('message.saveSuccess'))

    if (fromOrderDetail.value && form.orderId) {
      navigateTo(`/return-orders/${form.orderId}`)
    } else {
      router.push('/return-parts')
    }
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else if (error?.response?.status === 409) {
      message.error(t('validation.partNumberDuplicate'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
})

const confirmSubmit = () => {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: t('common.tip'),
      content: t('message.submitConfirmWarning'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}

const handleSubmit = () => submitDebounce.execute(async () => {
  if (isOcrProcessing.value) {
    message.warning(t('ocr.submitBlockedWhileProcessing'))
    return
  }

  const confirmed = await confirmSubmit()
  if (!confirmed) return

  try {
    await basicInfoCardRef.value?.validate()
    if (!await validatePartNumberUnique()) return
    let savedId = partId.value
    if (isEdit.value) {
      await partApi.update(savedId, buildPartPayload())
    } else {
      const created = await partApi.create(buildPartPayload(), ocrTaskId.value)
      savedId = created.id
    }
    await partApi.submit(savedId)
    message.success(t('message.submitSuccess'))

    // 如果是从退货单详情页进入，返回到退货单详情页
    if (fromOrderDetail.value && form.orderId) {
      navigateTo(`/return-orders/${form.orderId}`)
    } else {
      router.push('/return-parts')
    }
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.submitFailed'))
    }
  }
})
</script>

<style lang="less" scoped>
.part-form {
  padding: 0;

  .form-footer {
    margin-top: 24px;
    padding: 24px;
    background: #fff;
    text-align: center;
  }
}
</style>

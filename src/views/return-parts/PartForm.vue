<template>
  <div class="part-form">
    <a-page-header
      :title="isEdit ? t('returnPart.editTitle') : t('returnPart.createTitle')"
      @back="handleBack"
    />

    <!-- OCR操作区 - 置顶 -->
    <OCRActionBar
      :ocr-loading="ocrLoading"
      :has-o-c-r-results="hasOCRResults"
      @handle-o-c-r-upload="handleOCRUpload"
      @stop-o-c-r="stopOCR"
      @apply-all-o-c-r="applyAllOCR"
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
      :users="users"
      :analysts="analysts"
    />

    <!-- 客诉信息卡片 -->
    <ComplaintInfoCard :form="form" />

    <!-- 照片上传区 -->
    <PhotoUploadCard
      v-model:image-files="form.imageFiles"
    />

    <!-- 底部操作栏 -->
    <div class="form-footer">
      <a-space>
        <a-button @click="handleBack">{{ t('common.cancel') }}</a-button>
        <!-- 草稿状态：显示保存和提交按钮 -->
        <template v-if="!isSubmitted">
          <a-button @click="handleSave">{{ t('common.save') }}</a-button>
          <a-button type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
        </template>
        <!-- 已提交状态且有权限：只显示提交按钮（不允许暂存） -->
        <template v-else-if="canEditSubmittedPart">
          <a-button type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { returnOrderApi } from '@/services/returnOrderApi'
import { partApi } from '@/services/partApi'
import { lookupApi } from '@/services/lookupApi'
import { userApi } from '@/services/userApi'
import { useOCR } from '@/composables/useOCR'
import { usePermissions } from '@/composables/usePermissions'
import OCRActionBar from './components/OCRActionBar.vue'
import BasicInfoCard from './components/BasicInfoCard.vue'
import ComplaintInfoCard from './components/ComplaintInfoCard.vue'
import PhotoUploadCard from './components/PhotoUploadCard.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { canEditSubmittedForm } = usePermissions()

const isEdit = computed(() => !!route.params.id)
const partId = computed(() => route.params.id as string)
const isSubmitted = computed(() => !!form.partNumber)

const canEditSubmittedPart = computed(() => {
  if (!isSubmitted.value) return true // 未提交都可以编辑
  return canEditSubmittedForm.value // 已提交需要 QMC Leader 权限
})

const basicInfoCardRef = ref<any>(null)

const orders = ref<any[]>([])
const businessUnits = ref<string[]>([])
const productPlatforms = ref<string[]>([])
const failureTypes = ref<string[]>([])
const users = ref<{ id: string; loginName: string; displayName: string }[]>([])
const analysts = ref<{ id: string; loginName: string; displayName: string }[]>([])

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
  productionShift: '',
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
  imageFiles: [] as any[],
})

const { ocrLoading, hasOCRResults, handleOCRUpload, stopOCR, applyAllOCR } = useOCR(form)

onMounted(async () => {
  const [lookups, ordersData, usersData, analystsData] = await Promise.all([
    lookupApi.getAll(),
    returnOrderApi.list(), // 不限制数量
    userApi.list(),
    userApi.listAnalysts(),
  ])
  businessUnits.value = lookups.businessUnits
  productPlatforms.value = lookups.productPlatforms
  failureTypes.value = lookups.failureTypes
  // 只显示草稿或已提交状态的退货单
  const eligibleStatuses = ['draft', 'submitted']
  orders.value = ordersData.data.filter((order: any) => eligibleStatuses.includes(order.status))
  users.value = usersData
  analysts.value = analystsData

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
  form.partNumber = part.partNumber
  form.orderId = part.orderId
  form.partCode = part.partCode
  form.businessUnit = part.businessUnit
  form.productPlatform = part.productPlatform
  form.productionShift = part.productionShift || ''
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
}

const handleBack = () => {
  router.back()
}

const buildPartPayload = () => ({
  orderId: form.orderId,
  partCode: form.partCode,
  businessUnit: form.businessUnit,
  productPlatform: form.productPlatform,
  productionShift: form.productionShift || undefined,
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
})

const handleSave = async () => {
  try {
    await basicInfoCardRef.value?.validate()
    if (isEdit.value) {
      await partApi.update(partId.value, buildPartPayload())
    } else {
      await partApi.create(buildPartPayload())
    }
    message.success(t('message.saveSuccess'))

    // 如果是从退货单详情页进入，返回到退货单详情页
    if (fromOrderDetail.value && form.orderId) {
      router.push(`/return-orders/${form.orderId}`)
    } else {
      router.push('/return-parts')
    }
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
}

const handleSubmit = async () => {
  try {
    await basicInfoCardRef.value?.validate()
    let savedId = partId.value
    if (isEdit.value) {
      await partApi.update(savedId, buildPartPayload())
    } else {
      const created = await partApi.create(buildPartPayload())
      savedId = created.id
    }
    await partApi.submit(savedId)
    message.success(t('message.submitSuccess'))

    // 提交后返回售后件列表页
    router.push('/return-parts')
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.submitFailed'))
    }
  }
}
</script>

<style lang="less" scoped>
.part-form {
  padding: 24px;

  .form-footer {
    margin-top: 24px;
    padding: 24px;
    background: #fff;
    text-align: center;
  }
}
</style>

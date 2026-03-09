<template>
  <div class="part-form">
    <a-page-header
      :title="isEdit ? t('returnPart.editTitle') : t('returnPart.createTitle')"
      @back="handleBack"
    />

    <!-- OCR操作区 - 置顶 -->
    <a-card class="ocr-card">
      <div class="ocr-actions">
        <a-space>
          <a-upload
            :before-upload="handleOCRUpload"
            :show-upload-list="false"
            accept="image/*"
          >
            <a-button type="primary" :loading="ocrLoading">
              <CameraOutlined /> {{ t('returnPart.ocrRecognition') }}
            </a-button>
          </a-upload>
          <a-button v-if="ocrLoading" @click="stopOCR">
            {{ t('returnPart.stopRecognition') }}
          </a-button>
          <a-button v-if="hasOCRResults" @click="applyAllOCR">
            {{ t('common.applyAll') }}
          </a-button>
        </a-space>
        <div class="ocr-status">
          <template v-if="ocrLoading">
            <a-spin size="small" />
            <span class="status-text loading">{{ t('returnPart.ocrLoading') }}</span>
          </template>
          <template v-else-if="hasOCRResults">
            <CheckCircleOutlined class="status-icon success" />
            <span class="status-text success">{{ t('returnPart.ocrComplete') }}</span>
          </template>
          <span v-else class="ocr-tip">{{ t('returnPart.ocrTip') }}</span>
        </div>
      </div>
    </a-card>

    <!-- 基础信息卡片 -->
    <a-card :title="t('returnPart.basicInfo')" class="info-card">
      <a-form
        :model="form"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        ref="formRef"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.partNumber')">
              <a-input
                v-model:value="form.partNumber"
                disabled
                :placeholder="!isEdit ? t('validation.autoGenerateOnSave') : ''"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnPart.relatedOrder')" name="orderId">
              <a-select v-model:value="form.orderId" :placeholder="t('validation.selectOrder')" :disabled="hasPresetOrder">
                <a-select-option v-for="o in orders" :key="o.id" :value="o.id">
                  {{ o.orderNumber }} - {{ o.customer }}
                </a-select-option>
              </a-select>
              <div v-if="hasPresetOrder" class="preset-order-hint">{{ t('returnPart.presetOrderHint') }}</div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.partCode')" name="partCode">
              <a-input v-model:value="form.partCode" :placeholder="t('validation.inputPartCode')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnPart.businessUnit')" name="businessUnit">
              <a-select v-model:value="form.businessUnit" :placeholder="t('validation.selectBusinessUnit')">
                <a-select-option v-for="bu in businessUnits" :key="bu" :value="bu">
                  {{ bu }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.productPlatform')" name="productPlatform">
              <a-select v-model:value="form.productPlatform" :placeholder="t('validation.selectProductPlatform')">
                <a-select-option v-for="pp in productPlatforms" :key="pp" :value="pp">
                  {{ pp }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnPart.productionShift')">
              <a-input v-model:value="form.productionShift" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.returnType')" name="complaintType">
              <a-select v-model:value="form.complaintType" :placeholder="t('validation.pleaseSelect')">
                <a-select-option v-for="ct in complaintTypes" :key="ct.value" :value="ct.value">
                  {{ ct.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnPart.failureType')" name="failureType">
              <a-select v-model:value="form.failureType" :placeholder="t('validation.selectFailureType')">
                <a-select-option v-for="ft in failureTypes" :key="ft" :value="ft">
                  {{ ft }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('partDetail.responsibleEngineer')">
              <a-select v-model:value="form.responsibleEngineer" :placeholder="t('validation.pleaseSelect')" allowClear>
                <a-select-option v-for="u in users" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('partDetail.analyst')">
              <a-select v-model:value="form.analyst" :placeholder="t('validation.pleaseSelect')" allowClear>
                <a-select-option v-for="u in users" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 客诉信息卡片 -->
    <a-card :title="t('partDetail.complaintInfo')" class="info-card">
      <a-form
        :model="form"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('partDetail.repairStation')">
              <a-input v-model:value="form.repairStation" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('partDetail.complaintLocation')">
              <a-input v-model:value="form.complaintLocation" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.vehicleProductionDate')">
              <a-date-picker v-model:value="form.vehicleProductionDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnPart.vehiclePurchaseDate')">
              <a-date-picker v-model:value="form.vehiclePurchaseDate" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.vehicleFailureDate')">
              <a-date-picker v-model:value="form.vehicleFailureDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnPart.vehicleVIN')">
              <a-input v-model:value="form.vehicleVIN" :placeholder="t('returnPart.vinPlaceholder')" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.vehicleMileage')">
              <a-input-number v-model:value="form.vehicleMileage" :min="0" style="width: 100%" suffix="km" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item :label="t('returnPart.customerDescription')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-textarea
                v-model:value="form.customerDescription"
                :placeholder="t('returnPart.customerDescPlaceholder')"
                :rows="3"
                show-count
                :maxlength="500"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item :label="t('returnPart.otherDescription')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-textarea
                v-model:value="form.otherDescription"
                :placeholder="t('returnPart.otherDescPlaceholder')"
                :rows="3"
                show-count
                :maxlength="500"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 照片上传区 -->
    <a-card :title="t('returnPart.photoUpload')" class="upload-card">
      <a-upload
        v-model:file-list="form.imageFiles"
        list-type="picture-card"
        :before-upload="() => false"
        :max-count="20"
        multiple
        @preview="handlePreview"
      >
        <div v-if="(form.imageFiles?.length || 0) < 20">
          <PlusOutlined />
          <div style="margin-top: 8px">{{ t('returnPart.upload') }}</div>
        </div>
      </a-upload>
      <div class="upload-tip">
        {{ t('returnPart.uploadTip') }}
      </div>
    </a-card>

    <!-- 底部操作栏 -->
    <div class="form-footer">
      <a-space>
        <a-button @click="handleBack">{{ t('common.cancel') }}</a-button>
        <!-- 草稿状态：显示保存和提交按钮 -->
        <template v-if="!isSubmitted">
          <a-button @click="handleSave">{{ t('common.save') }}</a-button>
          <a-button type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
        </template>
        <!-- 已提交状态且有数据校订权限：只显示提交按钮（用于更新） -->
        <template v-else-if="canEditSubmittedPart">
          <a-button type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
        </template>
        <!-- 已提交状态且无权限：显示不可编辑提示 -->
        <template v-else>
          <a-tag color="default">{{ t('validation.submittedCannotEdit') }}</a-tag>
        </template>
      </a-space>
    </div>

    <!-- 图片预览 -->
    <a-modal :open="previewVisible" :footer="null" @cancel="previewVisible = false">
      <img :src="previewImage" style="width: 100%" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { CameraOutlined, PlusOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { partApi } from '@/services/partApi'
import { lookupApi } from '@/services/lookupApi'
import { userApi } from '@/services/userApi'
import { useOCR } from '@/composables/useOCR'

// 退货类型（BA代码）列表
const complaintTypes = [
  { value: 'BA10', label: 'BA10 - 0-mlg, provisional rework/accept. back' },
  { value: 'BA20', label: 'BA20 - 0-km, uninstalled' },
  { value: 'BA21', label: 'BA21 - QM01' },
  { value: 'BA30', label: 'BA30 - stock product of AA volume (0-km)' },
  { value: 'BA31', label: 'BA31 - Stock product of IAM Vol.(0-km, uninst)' },
  { value: 'BA35', label: 'BA35 - Logistics complaint original equipment' },
  { value: 'BA40', label: 'BA40 - field product' },
  { value: 'BA41', label: 'BA41 - Field campaign' },
  { value: 'BA42', label: 'BA42 - goodwill' },
  { value: 'BA43', label: 'BA43 - Field product outside partial market' },
  { value: 'BA50', label: 'BA50 - Internal Complaint' },
  { value: 'BA60', label: 'BA60 - commercial processing, 0-km' },
  { value: 'BA61', label: 'BA61 - commercial processing, field' },
  { value: 'BA70', label: 'BA70 - product for exam. w/o warranty claim' },
  { value: 'BA76', label: 'BA76 - Technical sample complaint' },
  { value: 'BA77', label: 'BA77 - Sample product analysis due to contract' },
  { value: 'BA78', label: 'BA78 - Sample product analysis customer request' },
  { value: 'BA79', label: 'BA79 - Logistics sample complaint' },
]

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const formRef = ref()

const isEdit = computed(() => !!route.params.id)
const partId = computed(() => route.params.id as string)
// 是否已提交（有零件编号表示已提交）
const isSubmitted = computed(() => !!form.partNumber)

/**
 * 检查当前用户是否有修改已提交表单的权限（数据校订权）
 *
 * 权限角色：
 * - W_RBCC_AEP_WFAM_QMC_Manager（QMC 经理）
 * - W_RBCC_AEP_WFAM_SystemAdmin（系统管理员）
 *
 * @returns {boolean} 是否有权限修改已提交的表单
 *
 * TODO: 当前返回 true 用于测试，正式环境需要从 HTTP 请求头解析角色信息
 * 实现方式：从 x-authentication-header 或 Authorization 中解析 roleNames 字段，
 * 判断是否包含上述角色之一
 */
const canEditSubmittedPart = computed(() => {
  // TODO: 实现角色权限检查逻辑
  // 示例实现（需要根据实际认证头格式调整）：
  // const authHeader = getAuthHeader() // 从请求拦截器或 store 获取
  // const roleNames = authHeader?.roleNames || ''
  // const hasPermission = roleNames.includes('W_RBCC_AEP_WFAM_QMC_Manager') ||
  //                       roleNames.includes('W_RBCC_AEP_WFAM_SystemAdmin')
  // return hasPermission

  return true // 当前始终返回 true，提供编辑入口用于测试
})

const orders = ref<any[]>([])
const businessUnits = ref<string[]>([])
const productPlatforms = ref<string[]>([])
const failureTypes = ref<string[]>([])
const users = ref<{ id: string; loginName: string; displayName: string }[]>([])

const previewVisible = ref(false)
const previewImage = ref('')

// 是否从退货单页面预设了关联订单
const hasPresetOrder = computed(() => {
  return !!route.query.orderNumber && !isEdit.value
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

const rules = computed(() => ({
  orderId: [{ required: true, message: t('validation.selectOrder') }],
  partCode: [{ required: true, message: t('validation.inputPartCode') }],
  businessUnit: [{ required: true, message: t('validation.selectBusinessUnit') }],
  productPlatform: [{ required: true, message: t('validation.selectProductPlatform') }],
}))

const { ocrLoading, ocrResults, hasOCRResults, handleOCRUpload, stopOCR, applyAllOCR } = useOCR(form)

const handlePreview = (file: any) => {
  previewImage.value = file.url || file.thumbUrl
  previewVisible.value = true
}

onMounted(async () => {
  // Load lookup data, orders and users in parallel
  const [lookups, ordersData, usersData] = await Promise.all([
    lookupApi.getAll(),
    returnOrderApi.list(),
    userApi.list(),
  ])
  businessUnits.value = lookups.businessUnits
  productPlatforms.value = lookups.productPlatforms
  failureTypes.value = lookups.failureTypes
  orders.value = ordersData
  users.value = usersData

  if (isEdit.value) {
    const part = await partApi.getById(partId.value)
    if (part) {
      form.partNumber = part.partNumber
      form.orderId = part.orderId
      form.partCode = part.partCode
      form.businessUnit = part.businessUnit
      form.productPlatform = part.productPlatform
      form.productionShift = part.productionShift || ''
      form.vehicleProductionDate = part.vehicleProductionDate ? dayjs(part.vehicleProductionDate) : null
      form.vehiclePurchaseDate = part.vehiclePurchaseDate ? dayjs(part.vehiclePurchaseDate) : null
      form.vehicleFailureDate = part.vehicleFailureDate ? dayjs(part.vehicleFailureDate) : null
      form.vehicleVIN = part.vehicleVIN || ''
      form.vehicleMileage = part.vehicleMileage
      form.customerDescription = part.customerDescription || ''
      form.otherDescription = part.otherDescription || ''
    }
  } else {
    // 处理从退货单页面跳转过来的情况
    if (route.query.orderId && route.query.orderId !== 'new') {
      form.orderId = route.query.orderId as string
    }
  }
})

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
    await formRef.value?.validate()
    if (isEdit.value) {
      await partApi.update(partId.value, buildPartPayload())
    } else {
      await partApi.create(buildPartPayload())
    }
    message.success(t('message.saveSuccess'))
    router.push('/return-parts')
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
    await formRef.value?.validate()
    let savedId = partId.value
    if (isEdit.value) {
      await partApi.update(savedId, buildPartPayload())
    } else {
      const created = await partApi.create(buildPartPayload())
      savedId = created.id
    }
    await partApi.submit(savedId)
    message.success(t('message.submitSuccess'))
    router.push(`/return-parts/${savedId}`)
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

  .ocr-card {
    margin-bottom: 16px;

    .ocr-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .ocr-status {
        display: flex;
        align-items: center;
        gap: 8px;

        .status-icon {
          font-size: 16px;

          &.success {
            color: #52c41a;
          }
        }

        .status-text {
          font-size: 14px;

          &.loading {
            color: #1890ff;
          }

          &.success {
            color: #52c41a;
          }
        }

        .ocr-tip {
          color: #999;
          font-size: 12px;
        }
      }
    }
  }

  .info-card {
    margin-bottom: 16px;

    .preset-order-hint {
      margin-top: 4px;
      color: #999;
      font-size: 12px;
    }
  }

  .upload-card {
    margin-bottom: 16px;

    .upload-tip {
      margin-top: 8px;
      color: #999;
      font-size: 12px;
    }
  }

  .form-footer {
    margin-top: 24px;
    padding: 24px;
    background: #fff;
    text-align: center;
  }
}
</style>

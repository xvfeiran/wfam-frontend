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
            <a-form-item :label="t('returnPart.failureType')" name="failureType">
              <a-select v-model:value="form.failureType" :placeholder="t('validation.selectFailureType')">
                <a-select-option v-for="ft in failureTypes" :key="ft" :value="ft">
                  {{ ft }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 车辆信息卡片 -->
    <a-card :title="t('returnPart.vehicleInfo')" class="info-card">
      <a-form
        :model="form"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
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
        <a-button @click="handleSave">{{ t('common.save') }}</a-button>
        <a-button type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
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
import { useOCR } from '@/composables/useOCR'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const formRef = ref()

const isEdit = computed(() => !!route.params.id)
const partId = computed(() => route.params.id as string)

const orders = ref<any[]>([])
const businessUnits = ref<string[]>([])
const productPlatforms = ref<string[]>([])
const failureTypes = ref<string[]>([])

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
  failureType: undefined as string | undefined,
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

const generatePartNumber = () => {
  if (form.businessUnit && form.productPlatform) {
    const seq = String(Date.now() % 10000).padStart(4, '0')
    form.partNumber = `${form.businessUnit}-${form.productPlatform}-${seq}`
  }
}

const { ocrLoading, ocrResults, hasOCRResults, handleOCRUpload, stopOCR, applyAllOCR } = useOCR(form)

const handlePreview = (file: any) => {
  previewImage.value = file.url || file.thumbUrl
  previewVisible.value = true
}

onMounted(async () => {
  // Load lookup data and orders in parallel
  const [lookups, ordersData] = await Promise.all([
    lookupApi.getAll(),
    returnOrderApi.list(),
  ])
  businessUnits.value = lookups.businessUnits
  productPlatforms.value = lookups.productPlatforms
  failureTypes.value = lookups.failureTypes
  orders.value = ordersData

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

const handleSave = () => {
  if (!isEdit.value) generatePartNumber()
  message.success(t('message.saveSuccess'))
}

const handleSubmit = async () => {
  try {
    if (!isEdit.value) generatePartNumber()
    await formRef.value?.validate()
    message.success(isEdit.value ? t('message.updateSuccess') : t('message.createSuccess'))
    router.push('/return-parts')
  } catch {
    message.error(t('validation.formError'))
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

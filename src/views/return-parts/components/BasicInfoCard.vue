<template>
  <a-card :title="t('returnPart.basicInfo')" class="info-card">
    <a-form
      :model="form"
      :rules="formRules"
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
            <a-select
              v-model:value="form.orderId"
              :placeholder="t('validation.selectOrder')"
              :disabled="hasPresetOrder"
              :filter-option="filterOrderOption"
              show-search
            >
              <a-select-option v-for="o in orders" :key="o.id" :value="o.id">
                <span style="font-weight: 500">{{ o.orderNumber || `(${t('validation.unsubmitted')})` }}</span>
                <span style="color: #999; margin-left: 8px">{{ o.customer }}</span>
              </a-select-option>
            </a-select>
            <div v-if="hasPresetOrder" class="preset-order-hint">{{ t('returnPart.presetOrderHint') }}</div>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.partCode')" name="partCode">
            <a-select
              v-model:value="form.partCode"
              :placeholder="t('validation.inputPartCode')"
              show-search
              :filter-option="false"
              :not-found-content="partCodeSearching ? undefined : null"
              @search="handlePartCodeSearch"
              @select="handlePartCodeSelect"
              allowClear
            >
              <template v-if="partCodeSearching" #notFoundContent>
                <a-spin size="small" />
              </template>
              <a-select-option v-for="pc in partCodeOptions" :key="pc.partCode" :value="pc.partCode">
                {{ pc.partCode }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.businessUnit')">
            <a-input
              v-model:value="form.businessUnit"
              :placeholder="businessUnitPlaceholder"
              disabled
            />
            <div v-if="businessUnitHint" class="field-disabled-hint">{{ businessUnitHint }}</div>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.productPlatform')">
            <a-input
              v-model:value="form.productPlatform"
              :placeholder="productPlatformPlaceholder"
              disabled
            />
            <div v-if="productPlatformHint" class="field-disabled-hint">{{ productPlatformHint }}</div>
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
          <a-form-item :label="t('returnPart.customerFailureType')" name="failureType">
            <a-select v-model:value="form.failureType" :placeholder="t('validation.selectCustomerFailureType')">
              <a-select-option value="NVH">NVH</a-select-option>
              <a-select-option value="功能">{{ t('returnPart.failureFunctional') }}</a-select-option>
              <a-select-option value="外观">{{ t('returnPart.failureAppearance') }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('partDetail.responsibleEngineer')">
            <a-select v-model:value="form.responsibleEngineer" :placeholder="t('validation.pleaseSelect')" allowClear>
              <a-select-option v-for="u in users" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('partDetail.analyst')" name="analyst">
            <a-select v-model:value="form.analyst" :placeholder="t('validation.pleaseSelect')" allowClear>
              <a-select-option v-for="u in analysts" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { partCodeApi } from '@/services/partCodeApi'

interface Form {
  partNumber: string
  orderId?: string
  partCode: string
  businessUnit?: string
  productPlatform?: string
  productionShift: string
  failureType?: string
  responsibleEngineer?: string
  analyst?: string
}

interface Props {
  form: Form
  isEdit: boolean
  hasPresetOrder: boolean
  orders: any[]
  businessUnits: string[]
  productPlatforms: string[]
  failureTypes: string[]
  users: { id: string; loginName: string; displayName: string }[]
  analysts: { id: string; loginName: string; displayName: string }[]
}

const props = defineProps<Props>()

const { t } = useI18n()

// 零件号选项（用于下拉搜索）
const partCodeOptions = ref<any[]>([])
const partCodeSearching = ref(false)
let partCodeSearchTimer: ReturnType<typeof setTimeout> | null = null

// 零件号是否存在（用于验证）
const partCodeExists = ref(false)

// 业务单元占位符和提示
const businessUnitPlaceholder = computed(() => {
  if (!props.form.partCode) {
    return t('validation.selectBusinessUnit')
  }
  return props.form.businessUnit
    ? t('validation.autoFillFromPartCode')
    : t('validation.notConfiguredInDictionary')
})

const businessUnitHint = computed(() => {
  if (!props.form.partCode) return ''
  if (props.form.businessUnit) return t('validation.autoFillFromPartCode')
  return t('validation.notConfiguredInDictionary')
})

// 产品平台占位符和提示
const productPlatformPlaceholder = computed(() => {
  if (!props.form.partCode) {
    return t('validation.selectProductPlatform')
  }
  return props.form.productPlatform
    ? t('validation.autoFillFromPartCode')
    : t('validation.notConfiguredInDictionary')
})

const productPlatformHint = computed(() => {
  if (!props.form.partCode) return ''
  if (props.form.productPlatform) return t('validation.autoFillFromPartCode')
  return t('validation.notConfiguredInDictionary')
})

// 零件号搜索（左匹配模糊搜索）
const handlePartCodeSearch = (value: string) => {
  // 清空之前的定时器
  if (partCodeSearchTimer) {
    clearTimeout(partCodeSearchTimer)
  }

  if (!value || value.trim() === '') {
    partCodeOptions.value = []
    return
  }

  // 防抖：300ms 后执行搜索
  partCodeSearchTimer = setTimeout(async () => {
    partCodeSearching.value = true
    try {
      const result = await partCodeApi.page({
        partCode: value.trim(),
        pageSize: 50, // 限制返回数量
      })
      partCodeOptions.value = result.data
    } catch (error) {
      console.error('Failed to search part codes:', error)
      partCodeOptions.value = []
    } finally {
      partCodeSearching.value = false
    }
  }, 300)
}

// 零件号选择时自动填充产品类型和BU
const handlePartCodeSelect = async (value: string) => {
  if (!value) {
    // 清空选择
    props.form.businessUnit = undefined
    props.form.productPlatform = undefined
    partCodeExists.value = false
    return
  }

  try {
    const partCodeData = await partCodeApi.getByPartCode(value.trim())
    if (partCodeData) {
      // 找到零件号，自动填充产品和BU
      props.form.businessUnit = partCodeData.businessUnit || undefined
      props.form.productPlatform = partCodeData.productPlatform || undefined
      partCodeExists.value = true
    } else {
      // 未找到零件号，清空产品和BU
      props.form.businessUnit = undefined
      props.form.productPlatform = undefined
      partCodeExists.value = false
      message.warning(t('validation.partCodeNotFoundInDictionary'))
    }
  } catch (error) {
    // 查询失败，不做处理
    console.error('Failed to query part code:', error)
  }
}

// 监听零件号变化（用于编辑模式验证已有零件号是否存在）
watch(() => props.form.partCode, async (newVal) => {
  if (newVal && props.isEdit) {
    // 编辑模式下，验证零件号是否存在
    try {
      const partCodeData = await partCodeApi.getByPartCode(newVal.trim())
      partCodeExists.value = !!partCodeData
    } catch {
      partCodeExists.value = false
    }
  }
}, { immediate: true })

// 订单搜索过滤
const filterOrderOption = (input: string, option: any) => {
  const order = props.orders.find((o) => o.id === option.value)
  if (!order) return false

  const searchText = input.toLowerCase()
  const orderNumber = (order.orderNumber || '').toLowerCase()
  const customer = (order.customer || '').toLowerCase()
  const unsubmitted = t('validation.unsubmitted').toLowerCase()

  // 搜索单号、客户名称或"未提交"
  return orderNumber.includes(searchText) ||
         customer.includes(searchText) ||
         (unsubmitted.includes(searchText) && !order.orderNumber)
}

const formRef = ref()

// 自定义验证器：检查零件号是否存在于数据字典
const validatePartCodeExists = async (_rule: any, value: string) => {
  if (!value || value.trim() === '') {
    return Promise.reject(t('validation.inputPartCode'))
  }
  // 直接查询零件号是否存在，确保获取最新状态
  try {
    const partCodeData = await partCodeApi.getByPartCode(value.trim())
    if (!partCodeData) {
      return Promise.reject(t('validation.partCodeNotFoundInDictionary'))
    }
    // 同步更新 partCodeExists 状态
    partCodeExists.value = true
  } catch (error) {
    // 查询失败时，假设不存在
    return Promise.reject(t('validation.partCodeNotFoundInDictionary'))
  }
  return Promise.resolve()
}

// 表单验证规则
const formRules = computed(() => ({
  orderId: [{ required: true, message: t('validation.selectOrder') }],
  partCode: [{ validator: validatePartCodeExists, trigger: 'change' }],
  analyst: [{ required: true, message: t('validation.selectAnalyst') }],
}))

defineExpose({
  validate: () => formRef.value?.validate(),
  partCodeExists: () => partCodeExists.value
})
</script>

<style lang="less" scoped>
.info-card {
  margin-bottom: 16px;

  .preset-order-hint {
    margin-top: 4px;
    color: #999;
    font-size: 12px;
  }

  .field-disabled-hint {
    margin-top: 4px;
    color: #1890ff;
    font-size: 12px;
  }
}
</style>

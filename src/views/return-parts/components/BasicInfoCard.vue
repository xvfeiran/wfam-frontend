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
          <a-form-item :label="t('returnPart.partNumber')" name="partNumber" :rules="partNumberRules" class="part-number-field">
            <a-input
              v-if="isPartNumberFixed"
              :value="form.partNumber"
              disabled
            />
            <template v-else>
              <div v-if="suggestedSeq !== null" class="suggested-seq-hint">
                {{ t('returnPart.suggestedSequence', { seq: String(suggestedSeq).padStart(4, '0') }) }}
                <a class="apply-seq-btn" @click="applySuggestedSeq"><CheckOutlined /></a>
              </div>
              <a-input
                v-model:value="suffixModel"
                :placeholder="t('validation.partNumberPlaceholder')"
                :maxlength="4"
                :status="partNumberError ? 'error' : undefined"
                @blur="onSuffixBlur"
              >
                <template v-if="partNumberPrefix" #addonBefore>{{ partNumberPrefix }}</template>
              </a-input>
            </template>
            <div v-if="partNumberError" class="part-number-error">{{ partNumberError }}</div>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.relatedOrder')" name="orderId">
            <a-select
              v-model:value="form.orderId"
              :placeholder="t('validation.selectOrder')"
              :disabled="isOrderSelectDisabled"
              :filter-option="filterOrderOption"
              show-search
            >
              <a-select-option v-for="o in orders" :key="o.id" :value="o.id">
                <span style="font-weight: 500">{{ o.orderNumber || `(${t('validation.unsubmitted')})` }}</span>
                <span style="color: #999; margin-left: 8px">{{ o.customer }}</span>
              </a-select-option>
            </a-select>
            <div v-if="hasPresetOrder" class="preset-order-hint">{{ t('returnPart.presetOrderHint') }}</div>
            <div v-if="isCurrentOrderInvalid" class="order-invalid-hint">{{ t('returnPart.orderClosedHint') }}</div>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.partCode')" name="partCode" required>
            <a-select
              v-model:value="form.partCode"
              :placeholder="t('validation.inputPartCode')"
              show-search
              :filter-option="false"
              :not-found-content="partCodeSearching ? undefined : null"
              @search="handlePartCodeSearch"
              @dropdownVisibleChange="handlePartCodeDropdownVisibleChange"
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
          <a-form-item :label="t('returnPart.businessUnit')" name="businessUnit">
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
          <a-form-item :label="t('returnPart.productPlatform')" name="productPlatform">
            <a-input
              v-model:value="form.productPlatform"
              :placeholder="productPlatformPlaceholder"
              disabled
            />
            <div v-if="productPlatformHint" class="field-disabled-hint">{{ productPlatformHint }}</div>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.partProductionDate')">
            <a-date-picker v-model:value="form.partProductionDate" style="width: 100%" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.productionShift')">
            <a-input v-model:value="form.productionShift" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.customerFailureType')" name="failureType">
            <a-select v-model:value="form.failureType" :placeholder="t('validation.selectCustomerFailureType')">
              <a-select-option v-for="ft in props.failureTypes" :key="ft" :value="ft">{{ t('returnPart.failureTypeLabels.' + ft) }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('partDetail.responsibleEngineer')">
            <a-select v-model:value="form.responsibleEngineer" :placeholder="t('validation.pleaseSelect')" allowClear>
              <a-select-option v-for="u in cqes" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('partDetail.analyst')" name="analyst">
            <a-select v-model:value="form.analyst" :placeholder="t('validation.pleaseSelect')" allowClear>
              <a-select-option v-for="u in analysts" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="24">
          <a-form-item :label="t('returnPart.otherInfo')" :label-col="{ span: 3 }" :wrapper-col="{ span: 19 }">
            <a-textarea
              v-model:value="form.otherInfo"
              :maxlength="500"
              :rows="3"
              show-count
            />
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
import { CheckOutlined } from '@ant-design/icons-vue'
import { partCodeApi } from '@/services/partCodeApi'
import { partApi } from '@/services/partApi'

interface Form {
  partNumber: string
  orderId?: string
  partCode: string
  businessUnit?: string
  productPlatform?: string
  partProductionDate: any | null
  productionShift: string
  failureType?: string
  responsibleEngineer?: string
  analyst?: string
  otherInfo?: string
}

interface Props {
  form: Form
  isEdit: boolean
  hasPresetOrder: boolean
  orders: any[]
  businessUnits: string[]
  productPlatforms: string[]
  failureTypes: string[]
  analysts: { id: string; loginName: string; displayName: string }[]
  cqes: { id: string; loginName: string; displayName: string }[]
  partId?: string
  submitted?: boolean
}

const props = defineProps<Props>()

const { t } = useI18n()

// 当前订单是否无效（状态不是 draft/submitted）
const isCurrentOrderInvalid = computed(() => {
  if (!props.form.orderId) return false
  const order = props.orders.find(o => o.id === props.form.orderId)
  return !order
})

// ── 退件编号：前缀 + 用户输入序号 ──
const isPartNumberFixed = computed(() => {
  return !!props.submitted
})

const partNumberPrefix = computed(() => {
  const bu = props.form.businessUnit || ''
  const platform = props.form.productPlatform || ''
  if (!bu && !platform) return ''
  const safeBu = bu || 'BLANK'
  const safePlatform = platform || 'BLANK'
  return `${safeBu}-${safePlatform}-`
})

const partNumberError = ref('')

// ── 建议序号提示 ──
const suggestedSeq = ref<number | null>(null)

watch(
  () => props.form.orderId,
  async (orderId) => {
    if (props.isEdit || isPartNumberFixed.value || !orderId) {
      suggestedSeq.value = null
      return
    }
    try {
      const res = await partApi.getNextSequence(orderId)
      suggestedSeq.value = res.nextSequence
    } catch {
      suggestedSeq.value = null
    }
  },
  { immediate: true },
)

const applySuggestedSeq = () => {
  if (suggestedSeq.value === null) return
  suffixModel.value = String(suggestedSeq.value).padStart(4, '0')
}

// v-model 绑定：只允许数字，同步到 form.partNumber
const suffixModel = computed({
  get: () => {
    if (!props.form.partNumber) return ''
    if (!partNumberPrefix.value) return props.form.partNumber
    if (props.form.partNumber.startsWith(partNumberPrefix.value)) {
      return props.form.partNumber.slice(partNumberPrefix.value.length)
    }
    return props.form.partNumber
  },
  set: (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (!partNumberPrefix.value) {
      props.form.partNumber = digits
    } else {
      props.form.partNumber = digits ? partNumberPrefix.value + digits : ''
    }
  },
})

const onSuffixBlur = () => {
  // nothing extra needed, v-model already synced
}

// BU/Platform 变化时重新拼接 partNumber
watch([() => props.form.businessUnit, () => props.form.productPlatform], (_new, [oldBu, oldPlatform]) => {
  if (isPartNumberFixed.value) return
  const oldPrefix = (oldBu && oldPlatform) ? `${oldBu || 'BLANK'}-${oldPlatform || 'BLANK'}-` : ''
  let suffix: string
  if (oldPrefix) {
    suffix = props.form.partNumber?.startsWith(oldPrefix)
      ? props.form.partNumber.slice(oldPrefix.length)
      : ''
  } else {
    const newPrefix = partNumberPrefix.value
    suffix = (newPrefix && props.form.partNumber?.startsWith(newPrefix))
      ? props.form.partNumber.slice(newPrefix.length)
      : (props.form.partNumber || '')
  }
  if (partNumberPrefix.value && suffix) {
    props.form.partNumber = partNumberPrefix.value + suffix
  } else if (!partNumberPrefix.value) {
    props.form.partNumber = suffix
  }
})

// 下拉是否应被禁用
const isOrderSelectDisabled = computed(() => {
  return props.hasPresetOrder || isCurrentOrderInvalid.value
})

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
const loadPartCodeOptions = async (keyword?: string) => {
  partCodeSearching.value = true
  try {
    const result = await partCodeApi.page({
      partCode: keyword && keyword.trim() ? keyword.trim() : undefined,
      pageSize: 50, // 限制返回数量
    })
    partCodeOptions.value = result.data || []
  } catch (error) {
    console.error('Failed to search part codes:', error)
    partCodeOptions.value = []
  } finally {
    partCodeSearching.value = false
  }
}

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
  partCodeSearchTimer = setTimeout(() => {
    loadPartCodeOptions(value)
  }, 300)
}

const handlePartCodeDropdownVisibleChange = (open: boolean) => {
  if (open && partCodeOptions.value.length === 0) {
    loadPartCodeOptions()
  }
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
  businessUnit: [{ required: true, message: t('validation.selectBusinessUnit') }],
  productPlatform: [{ required: true, message: t('validation.selectProductPlatform') }],
  analyst: [{ required: true, message: t('validation.selectAnalyst') }],
}))

const partNumberRules = computed(() => [{
  required: true,
  validator: async () => {
    if (isPartNumberFixed.value) return Promise.resolve()
    if (!props.form.partNumber) {
      return Promise.reject(t('validation.partNumberRequired'))
    }
    if (partNumberError.value) {
      return Promise.reject(partNumberError.value)
    }
    return Promise.resolve()
  },
  trigger: ['change', 'blur'],
}])

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

  .order-invalid-hint {
    margin-top: 4px;
    color: #fa8c16;
    font-size: 12px;
  }

  .field-disabled-hint {
    margin-top: 4px;
    color: #1677ff;
    font-size: 12px;
  }

  .suggested-seq-hint {
    position: absolute;
    top: -20px;
    left: 0;
    color: #999;
    font-size: 12px;
    white-space: nowrap;

    .apply-seq-btn {
      color: #1677ff;
      margin-left: 6px;
      cursor: pointer;
      font-size: 13px;
      &:hover { color: #4096ff; }
    }
  }

  .part-number-field {
    position: relative;
  }

  .part-number-error {
    margin-top: 4px;
    color: #ff4d4f;
    font-size: 12px;
  }
}
</style>

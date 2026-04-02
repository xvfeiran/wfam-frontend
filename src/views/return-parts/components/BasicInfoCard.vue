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
              <a-select-option v-for="u in users" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
  rules: Record<string, any[]>
}

const props = defineProps<Props>()

const { t } = useI18n()

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

// 表单验证规则
const formRules = computed(() => ({
  orderId: [{ required: true, message: t('validation.selectOrder') }],
  partCode: [{ required: true, message: t('validation.inputPartCode') }],
  businessUnit: [{ required: true, message: t('validation.selectBusinessUnit') }],
  productPlatform: [{ required: true, message: t('validation.selectProductPlatform') }],
  analyst: [{ required: true, message: t('validation.selectAnalyst') }],
}))

defineExpose({
  validate: () => formRef.value?.validate()
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
}
</style>

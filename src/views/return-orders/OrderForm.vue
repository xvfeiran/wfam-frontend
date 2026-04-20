<template>
  <div class="order-form">
    <a-page-header
      :title="isEdit ? t('returnOrder.editTitle') : t('returnOrder.createTitle')"
      @back="handleBack"
    />

    <a-card>
      <a-form
        :model="form"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 14 }"
        ref="formRef"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.orderNumber')" name="orderNumber">
              <a-input
                v-model:value="form.orderNumber"
                disabled
                :placeholder="t('validation.autoGenerateOnSave')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.customer')" name="customerId">
              <a-select v-model:value="form.customerId" :placeholder="t('validation.selectCustomer')">
                <a-select-option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.receiveDate')" name="receiveDate">
              <a-date-picker
                v-model:value="form.receiveDate"
                style="width: 100%"
                :disabled-date="disabledFutureDate"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.complaintDate')" name="complaintDate">
              <a-date-picker
                v-model:value="form.complaintDate"
                style="width: 100%"
                :disabled-date="disabledFutureDate"
                :disabled="form.returnMethod === 'express'"
                :placeholder="form.returnMethod === 'express' ? t('validation.sameAsReceiveDate') : ''"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.returnMethod')" name="returnMethod">
              <a-radio-group v-model:value="form.returnMethod">
                <a-radio value="express">{{ t('returnOrder.methodExpress') }}</a-radio>
                <a-radio value="pickup">{{ t('returnOrder.methodPickup') }}</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="form.returnMethod === 'express'">
            <a-form-item :label="t('returnOrder.trackingNumber')" name="trackingNumber">
              <a-input
                v-model:value="form.trackingNumber"
                :placeholder="t('validation.inputTrackingNumber')"
                :maxlength="50"
                show-count
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.returnQuantity')" name="returnQuantity">
              <a-input-number
                v-model:value="form.returnQuantity"
                :min="1"
                :max="9999"
                :precision="0"
                :controls="true"
                style="width: 100%"
                :placeholder="t('validation.inputReturnQuantity')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.complaintType')" name="complaintType">
              <a-select v-model:value="form.complaintType" :placeholder="t('validation.selectComplaintType')">
                <a-select-option v-for="ct in complaintTypes" :key="ct.code" :value="ct.code">
                  {{ ct.code }} - {{ ct.description }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 底部操作栏 -->
    <div class="form-footer">
      <a-space>
        <a-button @click="handleBack">{{ t('common.cancel') }}</a-button>
        <!-- 草稿状态：显示保存和提交按钮 -->
        <template v-if="!isSubmitted">
          <a-button :disabled="saveDebounce.isDebouncing" :loading="saveDebounce.isDebouncing" @click="handleSave">{{ t('common.save') }}</a-button>
          <a-button type="primary" :disabled="submitDebounce.isDebouncing" :loading="submitDebounce.isDebouncing" @click="handleSubmit">{{ t('common.submit') }}</a-button>
        </template>
        <!-- 已提交状态且有数据校订权限：只显示提交按钮（用于更新） -->
        <template v-else-if="canEditSubmittedOrder">
          <a-button type="primary" :disabled="submitDebounce.isDebouncing" :loading="submitDebounce.isDebouncing" @click="handleSaveForSubmitted">{{ t('common.submit') }}</a-button>
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
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { returnOrderApi } from '@/services/returnOrderApi'
import { customerApi } from '@/services/customerApi'
import { usePermissions } from '@/composables/usePermissions'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import type { Customer } from '@/services/customerApi'

const { t } = useI18n()

// 防抖处理
const saveDebounce = useDebouncedClick({ delay: 1000 })
const submitDebounce = useDebouncedClick({ delay: 1000 })

const route = useRoute()
const router = useRouter()
const formRef = ref()

const isEdit = computed(() => !!route.params.id)
const orderId = computed(() => route.params.id as string)
// 是否已提交（有订单编号表示已提交）
const isSubmitted = computed(() => !!form.orderNumber)

// Permission check for editing submitted orders
const { canEditSubmittedForm } = usePermissions()
const canEditSubmittedOrder = computed(() => {
  // Draft orders can be edited by anyone
  if (!isSubmitted.value) return true
  // Submitted orders can only be edited by QMC Leader
  return canEditSubmittedForm.value
})

const customers = ref<Customer[]>([])

// 投诉类型列表（BA代码）
const complaintTypes = ref([
  { code: 'BA10', description: '0-mlg, provisional rework/accept. back' },
  { code: 'BA20', description: '0-km, uninstalled' },
  { code: 'BA21', description: 'QM01' },
  { code: 'BA30', description: 'stock product of AA volume (0-km)' },
  { code: 'BA31', description: 'Stock product of IAM Vol.(0-km, uninst)' },
  { code: 'BA35', description: 'Logistics complaint original equipment' },
  { code: 'BA40', description: 'field product' },
  { code: 'BA41', description: 'Field campaign' },
  { code: 'BA42', description: 'goodwill' },
  { code: 'BA43', description: 'Field product outside partial market' },
  { code: 'BA50', description: 'Internal Complaint' },
  { code: 'BA60', description: 'commercial processing, 0-km' },
  { code: 'BA61', description: 'commercial processing, field' },
  { code: 'BA70', description: 'product for exam. w/o warranty claim' },
  { code: 'BA76', description: 'Technical sample complaint' },
  { code: 'BA77', description: 'Sample product analysis due to contract' },
  { code: 'BA78', description: 'Sample product analysis customer request' },
  { code: 'BA79', description: 'Logistics sample complaint' },
])

const form = reactive({
  orderNumber: '',
  customerId: undefined as string | undefined,
  customer: undefined as string | undefined, // 用于显示
  receiveDate: null as Dayjs | null,
  complaintDate: null as Dayjs | null,
  returnMethod: 'express',
  trackingNumber: '',
  returnQuantity: 1,
  complaintType: undefined as string | undefined, // 投诉类型（BA代码），必填
})

// Watch returnMethod changes - clear trackingNumber when switching from express to pickup
watch(() => form.returnMethod, (newValue, oldValue) => {
  if (oldValue === 'express' && newValue === 'pickup') {
    form.trackingNumber = ''
  }
  // When switching to express, sync complaintDate with receiveDate
  if (newValue === 'express' && form.receiveDate) {
    form.complaintDate = form.receiveDate
  }
})

// Watch receiveDate changes - sync complaintDate when return method is express
watch(() => form.receiveDate, (newValue) => {
  if (form.returnMethod === 'express' && newValue) {
    form.complaintDate = newValue
  }
})

const rules = computed(() => ({
  // orderNumber is auto-generated and not editable, no validation needed
  customerId: [{ required: true, message: t('validation.selectCustomer') }],
  receiveDate: [{ required: true, message: t('validation.selectReceiveDate') }],
  complaintDate: [{ required: true, message: t('validation.selectComplaintDate') }],
  returnMethod: [{ required: true, message: t('validation.selectReturnMethod') }],
  trackingNumber: form.returnMethod === 'express' ? [
    { required: true, message: t('validation.inputTrackingNumber') },
    { max: 50, message: t('validation.trackingNumberMaxLength', { max: 50 }) }
  ] : [],
  returnQuantity: [
    { required: true, message: t('validation.inputReturnQuantity') },
    { type: 'number', min: 1, max: 9999, message: t('validation.returnQuantityRange', { min: 1, max: 9999 }) }
  ],
  complaintType: [{ required: true, message: t('validation.selectComplaintType') }],
}))

const disabledFutureDate = (current: Dayjs) => {
  return current && current > dayjs().endOf('day')
}

onMounted(async () => {
  // 加载客户列表
  customers.value = await customerApi.list()

  if (isEdit.value) {
    // 加载退货单数据
    const order = await returnOrderApi.getById(orderId.value)
    if (order) {
      // 权限检查：已提交的订单只能由有数据校订权的用户编辑
      if (order.orderNumber && !canEditSubmittedOrder.value) {
        message.warning(t('validation.noPermissionToEdit'))
        router.push('/return-orders')
        return
      }

      form.orderNumber = order.orderNumber
      form.customerId = order.customerId
      form.customer = order.customer // 保留用于显示
      form.receiveDate = dayjs(order.receiveDate)
      form.complaintDate = dayjs(order.complaintDate)
      form.returnMethod = order.returnMethod
      // Only load trackingNumber for express delivery
      form.trackingNumber = (order.returnMethod === 'express' && order.trackingNumber) ? order.trackingNumber : ''
      form.returnQuantity = order.returnQuantity
      form.complaintType = order.complaintType
    }
  }
})

const handleBack = () => {
  router.back()
}

const buildPayload = () => {
  // For express delivery, ensure complaintDate matches receiveDate
  let complaintDate = form.complaintDate
  if (form.returnMethod === 'express' && form.receiveDate) {
    complaintDate = form.receiveDate
  }

  const payload: any = {
    customerId: form.customerId,
    receiveDate: form.receiveDate ? form.receiveDate.format('YYYY-MM-DD') : undefined,
    complaintDate: complaintDate ? complaintDate.format('YYYY-MM-DD') : undefined,
    returnMethod: form.returnMethod,
    returnQuantity: form.returnQuantity,
    complaintType: form.complaintType, // 投诉类型（BA代码），必填
  }
  // Only include trackingNumber for express delivery
  if (form.returnMethod === 'express' && form.trackingNumber) {
    payload.trackingNumber = form.trackingNumber
  }
  return payload
}

const handleSave = () => saveDebounce.execute(async () => {
  try {
    await formRef.value?.validate()
    if (isEdit.value) {
      await returnOrderApi.update(orderId.value, buildPayload())
    } else {
      await returnOrderApi.create(buildPayload())
    }
    message.success(t('message.saveSuccess'))
    router.push('/return-orders')
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
})

// Save handler for submitted orders - only updates, does not call submit again
const handleSaveForSubmitted = () => submitDebounce.execute(async () => {
  try {
    await formRef.value?.validate()
    await returnOrderApi.update(orderId.value, buildPayload())
    message.success(t('message.saveSuccess'))
    router.push(`/return-orders/${orderId.value}`)
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
})

const handleSubmit = () => submitDebounce.execute(async () => {
  try {
    await formRef.value?.validate()
    let savedId = orderId.value
    if (isEdit.value) {
      await returnOrderApi.update(savedId, buildPayload())
    } else {
      const created = await returnOrderApi.create(buildPayload())
      savedId = created.id
    }
    await returnOrderApi.submit(savedId)
    message.success(t('message.submitSuccess'))
    router.push(`/return-orders/${savedId}`)
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
.order-form {
  .form-footer {
    margin-top: 24px;
    padding: 24px;
    background: #fff;
    text-align: center;
  }
}
</style>

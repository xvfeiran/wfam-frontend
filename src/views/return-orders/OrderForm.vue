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
        </a-row>
      </a-form>

      <!-- 售后件列表区（仅在新建模式下显示） -->
      <template v-if="!isEdit">
        <a-divider>{{ t('returnOrder.partsList') }}</a-divider>
        <div class="parts-section">
          <div class="parts-header">
            <a-button type="primary" @click="handleAddPart">
              <PlusOutlined /> {{ t('returnOrder.addPart') }}
            </a-button>
          </div>
          <a-table
            :columns="partColumns"
            :data-source="parts"
            :pagination="partsPagination"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'partNumber'">
                <a @click="handleViewPart(record)">{{ record.partNumber }}</a>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a @click="handleViewPart(record)">{{ t('common.view') }}</a>
                  <a-divider type="vertical" />
                  <a @click="handleEditPart(record)">{{ t('common.edit') }}</a>
                  <a-divider type="vertical" />
                  <a-popconfirm :title="t('returnOrder.confirmDeletePart')" @confirm="handleDeletePart(record.id)">
                    <a class="danger-link">{{ t('common.delete') }}</a>
                </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
      </template>
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
        <template v-else-if="canEditSubmittedOrder">
          <a-button type="primary" @click="handleSaveForSubmitted">{{ t('common.submit') }}</a-button>
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
import { PlusOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { lookupApi } from '@/services/lookupApi'
import { customerApi } from '@/services/customerApi'
import { usePermissions } from '@/composables/usePermissions'
import type { Part } from '@/types'
import type { Customer } from '@/services/customerApi'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const formRef = ref()

const isEdit = computed(() => !!route.params.id)
const orderId = computed(() => route.params.id as string)
// 是否已提交（有订单编号表示已提交）
const isSubmitted = computed(() => !!form.orderNumber)

// Permission check for editing submitted orders
const { isQMCManager } = usePermissions()
const canEditSubmittedOrder = computed(() => {
  // Draft orders can be edited by anyone
  if (!isSubmitted.value) return true
  // Submitted orders can only be edited by QMC Manager
  return isQMCManager.value
})

const customers = ref<Customer[]>([])
const parts = ref<Part[]>([])

const form = reactive({
  orderNumber: '',
  customerId: undefined as string | undefined,
  customer: undefined as string | undefined, // 用于显示
  receiveDate: null as Dayjs | null,
  complaintDate: null as Dayjs | null,
  returnMethod: 'express',
  trackingNumber: '',
  returnQuantity: 1,
})

// Watch returnMethod changes - clear trackingNumber when switching from express to pickup
watch(() => form.returnMethod, (newValue, oldValue) => {
  if (oldValue === 'express' && newValue === 'pickup') {
    form.trackingNumber = ''
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
}))

const partColumns = computed(() => [
  { title: t('returnPart.partNumber'), dataIndex: 'partNumber', key: 'partNumber' },
  { title: t('returnPart.partCode'), dataIndex: 'partCode', key: 'partCode' },
  { title: t('returnPart.businessUnit'), dataIndex: 'businessUnit', key: 'businessUnit' },
  { title: t('returnPart.productPlatform'), dataIndex: 'productPlatform', key: 'productPlatform' },
  { title: t('common.operation'), key: 'action', width: 160 },
])

const partsPagination = computed(() => ({
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => t('common.total', { total }),
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

      // 加载关联的售后件
      parts.value = await returnOrderApi.getParts(order.id)
    }
  }
})

const handleBack = () => {
  router.back()
}

const handleAddPart = () => {
  // 跳转到售后件新建页面，带上退货单编号
  router.push({
    path: '/return-parts/new',
    query: { orderNumber: form.orderNumber, orderId: orderId.value || 'new' }
  })
}

const handleViewPart = (part: Part) => {
  router.push(`/return-parts/${part.id}`)
}

const handleEditPart = (part: Part) => {
  router.push(`/return-parts/${part.id}/edit`)
}

const handleDeletePart = (id: string) => {
  parts.value = parts.value.filter(p => p.id !== id)
  message.success(t('message.deleteSuccess'))
}

const buildPayload = () => {
  const payload: any = {
    customerId: form.customerId,
    receiveDate: form.receiveDate ? form.receiveDate.format('YYYY-MM-DD') : undefined,
    complaintDate: form.complaintDate ? form.complaintDate.format('YYYY-MM-DD') : undefined,
    returnMethod: form.returnMethod,
    returnQuantity: form.returnQuantity,
  }
  // Only include trackingNumber for express delivery
  if (form.returnMethod === 'express' && form.trackingNumber) {
    payload.trackingNumber = form.trackingNumber
  }
  return payload
}

const handleSave = async () => {
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
}

// Save handler for submitted orders - only updates, does not call submit again
const handleSaveForSubmitted = async () => {
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
}

const handleSubmit = async () => {
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
}
</script>

<style lang="less" scoped>
.order-form {
  .parts-section {
    .parts-header {
      margin-bottom: 16px;
    }
  }

  .form-footer {
    margin-top: 24px;
    padding: 24px;
    background: #fff;
    text-align: center;
  }

  .danger-link {
    color: #ff4d4f;
  }
}
</style>

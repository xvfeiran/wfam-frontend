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
              <a-input v-model:value="form.orderNumber" :placeholder="t('validation.inputOrderNumber')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.customer')" name="customer">
              <a-select v-model:value="form.customer" :placeholder="t('validation.selectCustomer')">
                <a-select-option v-for="c in customers" :key="c" :value="c">
                  {{ c }}
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
                <a-radio value="other">{{ t('returnOrder.methodOther') }}</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="form.returnMethod === 'express'">
            <a-form-item :label="t('returnOrder.trackingNumber')" name="trackingNumber">
              <a-input v-model:value="form.trackingNumber" :placeholder="t('validation.inputOrderNumber')" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.returnQuantity')" name="returnQuantity">
              <a-input-number v-model:value="form.returnQuantity" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('returnOrder.initialAnalysisQuantity')">
              <a-input-number v-model:value="form.initialAnalysisQuantity" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item :label="t('returnOrder.description')" name="description" :label-col="{ span: 3 }" :wrapper-col="{ span: 19 }">
              <a-textarea
                v-model:value="form.description"
                :placeholder="t('validation.inputOrderNumber')"
                :rows="4"
                show-count
                :maxlength="500"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <!-- 售后件列表区 -->
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
    </a-card>

    <!-- 底部操作栏 -->
    <div class="form-footer">
      <a-space>
        <a-button @click="handleBack">{{ t('common.cancel') }}</a-button>
        <a-button @click="handleSave">{{ t('common.save') }}</a-button>
        <a-button type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
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
import { PlusOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { lookupApi } from '@/services/lookupApi'
import type { Part } from '@/types'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const formRef = ref()

const isEdit = computed(() => !!route.params.id)
const orderId = computed(() => route.params.id as string)

const customers = ref<string[]>([])
const parts = ref<Part[]>([])

const form = reactive({
  orderNumber: '',
  customer: undefined as string | undefined,
  receiveDate: null as Dayjs | null,
  complaintDate: null as Dayjs | null,
  returnMethod: 'express',
  trackingNumber: '',
  returnQuantity: 1,
  initialAnalysisQuantity: 0,
  description: '',
})

const rules = computed(() => ({
  orderNumber: [{ required: true, message: t('validation.inputOrderNumber') }],
  customer: [{ required: true, message: t('validation.selectCustomer') }],
  receiveDate: [{ required: true, message: t('validation.selectReceiveDate') }],
  complaintDate: [{ required: true, message: t('validation.selectComplaintDate') }],
  returnMethod: [{ required: true, message: t('validation.selectReturnMethod') }],
  returnQuantity: [{ required: true, message: t('validation.inputReturnQuantity') }],
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
  const lookups = await lookupApi.getAll()
  customers.value = lookups.customers

  if (isEdit.value) {
    // 加载退货单数据
    const order = await returnOrderApi.getById(orderId.value)
    if (order) {
      form.orderNumber = order.orderNumber
      form.customer = order.customer
      form.receiveDate = dayjs(order.receiveDate)
      form.complaintDate = dayjs(order.complaintDate)
      form.returnMethod = order.returnMethod
      form.trackingNumber = order.trackingNumber || ''
      form.returnQuantity = order.returnQuantity
      form.initialAnalysisQuantity = order.initialAnalysisQuantity
      form.description = order.description || ''

      // 加载关联的售后件
      parts.value = await returnOrderApi.getParts(order.id)
    }
  } else {
    // 生成新的退货单号（年+QMC+4位码，例：2026QMC0001）
    const year = dayjs().year()
    const allOrders = await returnOrderApi.list()
    form.orderNumber = `${year}QMC${String(allOrders.length + 1).padStart(4, '0')}`
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

const handleSave = () => {
  message.success(t('message.saveSuccess'))
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    message.success(isEdit.value ? t('message.updateSuccess') : t('message.createSuccess'))
    router.push('/return-orders')
  } catch (error) {
    message.error(t('validation.formError'))
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

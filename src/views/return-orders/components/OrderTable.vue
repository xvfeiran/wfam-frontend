<template>
  <a-table
    :columns="columns"
    :data-source="orders"
    :row-selection="{ selectedRowKeys, onChange: handleSelectionChange }"
    :pagination="pagination"
    row-key="id"
    size="middle"
    :bordered="false"
    :sticky="true"
    :loading="loading"
    :custom-row="customRow"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { Tag } from 'ant-design-vue'
import { ORDER_STATUS_MAP, OrderStatus, ReturnMethod } from '@/types'
import type { ReturnOrder } from '@/types'
import type { Customer } from '@/services/customerApi'
import { useStatusLabels } from '@/composables/useStatusLabels'

interface Props {
  orders: ReturnOrder[]
  selectedRowKeys: string[]
  pagination: any
  loading: boolean
  sortState: { field?: string; order?: 'ascend' | 'descend' }
  customers: Customer[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'selection-change', keys: string[]): void
  (e: 'table-change', pagination: any, filters: any, sorter: any): void
  (e: 'view', id: string): void
}>()

const { t } = useI18n()
const { getStatusLabel, normalizeStatus } = useStatusLabels()
const legacyOrderStatusColorMap: Record<string, string> = {
  received: 'default',
  in_progress: 'processing',
  completed: 'success',
  closed: 'default',
}

const getOrderStatusColor = (status: OrderStatus | string) => {
  const normalizedStatus = normalizeStatus(status)
  return normalizedStatus in ORDER_STATUS_MAP
    ? ORDER_STATUS_MAP[normalizedStatus as OrderStatus].color
    : legacyOrderStatusColorMap[normalizedStatus] || 'default'
}

const columns = computed(() => [
  {
    title: t('returnOrder.orderNumber'),
    dataIndex: 'orderNumber',
    key: 'orderNumber',
    sorter: true,
    customRender: ({ record }: { record: ReturnOrder }) => {
      const text = record.orderNumber || t('validation.unsubmitted')
      if (!record.orderNumber) {
        return h('span', { style: { color: '#999' } }, text)
      }
      return h('a', {
        style: { color: '#1677ff' },
        onClick: (e: Event) => {
          e.stopPropagation()
          emit('view', record.id)
        }
      }, text)
    }
  },
  {
    title: t('returnOrder.customer'),
    dataIndex: 'customer',
    key: 'customer',
    sorter: true,
    filters: props.customers.map(c => ({ text: c.code || c.name, value: c.code || c.name })),
  },
  { title: t('returnOrder.receiveDate'), dataIndex: 'receiveDate', key: 'receiveDate', sorter: true },
  { title: t('returnOrder.complaintDate'), dataIndex: 'complaintDate', key: 'complaintDate', sorter: true },
  { title: t('returnOrder.returnQuantity'), dataIndex: 'returnQuantity', key: 'returnQuantity', sorter: true },
  {
    title: t('common.status'),
    dataIndex: 'status',
    key: 'status',
    sorter: true,
    customRender: ({ record }: { record: ReturnOrder }) => {
      return h(Tag, { color: getOrderStatusColor(record.status) }, () => getStatusLabel(record.status))
    },
  },
  {
    title: t('returnOrder.returnMethod'),
    dataIndex: 'returnMethod',
    key: 'returnMethod',
    customRender: ({ record }: { record: ReturnOrder }) => {
      const m = record.returnMethod
      if (m === ReturnMethod.EXPRESS) return t('returnOrder.methodExpress')
      if (m === ReturnMethod.PICKUP) return t('returnOrder.methodPickup')
      if (m === ReturnMethod.OTHER) return t('returnOrder.methodOther')
      return m || '-'
    },
  },
  { title: t('returnOrder.complaintType'), dataIndex: 'complaintType', key: 'complaintType' },
])

const handleSelectionChange = (keys: string[]) => {
  emit('selection-change', keys)
}

const handleChange = (pagination: any, filters: any, sorter: any) => {
  emit('table-change', pagination, filters, sorter)
}

const customRow = (record: ReturnOrder) => ({
  onClick: () => emit('view', record.id),
  style: { cursor: 'pointer' },
})
</script>

<style lang="less" scoped>
:deep(.ant-table-tbody > tr:hover > td) {
  cursor: pointer;
}
</style>

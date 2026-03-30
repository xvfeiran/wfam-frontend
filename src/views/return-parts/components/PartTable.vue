<template>
  <a-table
    :columns="columns"
    :data-source="parts"
    :row-selection="{ selectedRowKeys, onChange: handleSelectionChange }"
    :pagination="pagination"
    row-key="id"
    :loading="loading"
    :custom-row="customRow"
    @change="handleChange"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <a-tag :color="getPartStatusColor(record.status)">
          {{ getStatusLabel(record.status) }}
        </a-tag>
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { PART_STATUS_MAP, PartStatus } from '@/types'
import type { Part } from '@/types'
import { useStatusLabels } from '@/composables/useStatusLabels'

interface Props {
  parts: Part[]
  selectedRowKeys: string[]
  pagination: any
  loading: boolean
  sortState: { field?: string; order?: 'ascend' | 'descend' }
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'selection-change', keys: string[]): void
  (e: 'table-change', pagination: any, filters: any, sorter: any): void
  (e: 'view', id: string): void
  (e: 'go-to-order', orderId: string): void
}>()

const { t } = useI18n()
const { getStatusLabel } = useStatusLabels()

const getPartStatusColor = (status: PartStatus | string) => {
  return status in PART_STATUS_MAP
    ? PART_STATUS_MAP[status as PartStatus].color
    : 'default'
}

const columns = computed(() => [
  {
    title: t('returnPart.partNumber'),
    dataIndex: 'partNumber',
    key: 'partNumber',
    sorter: true,
    customRender: ({ record }: { record: Part }) => {
      const text = record.partNumber || t('validation.unsubmitted')
      if (!record.partNumber) {
        return h('span', { style: { color: '#999' } }, text)
      }
      return h('a', {
        style: { color: '#1890ff' },
        onClick: (e: Event) => {
          e.stopPropagation()
          emit('view', record.id)
        }
      }, text)
    }
  },
  {
    title: t('returnPart.relatedOrder'),
    dataIndex: 'orderNumber',
    key: 'orderNumber',
    sorter: true,
    customRender: ({ record }: { record: Part }) => {
      if (!record.orderNumber) {
        return h('span', { style: { color: '#999' } }, t('validation.unsubmitted'))
      }
      return h('a', {
        style: { color: '#1890ff' },
        onClick: (e: Event) => {
          e.stopPropagation()
          emit('go-to-order', record.orderId)
        }
      }, record.orderNumber)
    }
  },
  { title: t('returnPart.partCode'), dataIndex: 'partCode', key: 'partCode', sorter: true },
  { title: t('returnPart.businessUnit'), dataIndex: 'businessUnit', key: 'businessUnit', sorter: true },
  { title: t('returnPart.productPlatform'), dataIndex: 'productPlatform', key: 'productPlatform', sorter: true },
  { title: t('partDetail.analyst'), dataIndex: 'analyst', key: 'analyst', sorter: true },
  { title: t('common.status'), dataIndex: 'status', key: 'status', sorter: true },
])

const handleSelectionChange = (keys: string[]) => {
  emit('selection-change', keys)
}

const handleChange = (pagination: any, filters: any, sorter: any) => {
  emit('table-change', pagination, filters, sorter)
}

const customRow = (record: Part) => ({
  onClick: () => emit('view', record.id),
  style: { cursor: 'pointer' },
})
</script>

<style lang="less" scoped>
:deep(.ant-table-tbody > tr:hover > td) {
  cursor: pointer;
}
</style>

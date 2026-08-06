<template>
  <a-table
    :columns="columns"
    :data-source="parts"
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
import dayjs from 'dayjs'
import { Tag } from 'ant-design-vue'
import { PART_STATUS_MAP, PartStatus } from '@/types'
import type { Part } from '@/types'
import { useStatusLabels } from '@/composables/useStatusLabels'
import { useUserNameMap } from '@/composables/useUserNameMap'

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
const { getStatusLabel, normalizeStatus } = useStatusLabels()
const { displayName: userDisplayName } = useUserNameMap()
const legacyPartStatusColorMap: Record<string, string> = {
  pending: 'default',
  analyzing: 'processing',
  analyzed: 'success',
  closed: 'default',
}

const getPartStatusColor = (status: PartStatus | string) => {
  const normalizedStatus = normalizeStatus(status)
  return normalizedStatus in PART_STATUS_MAP
    ? PART_STATUS_MAP[normalizedStatus as PartStatus].color
    : legacyPartStatusColorMap[normalizedStatus] || 'default'
}

const columns = computed(() => [
  {
    title: t('returnPart.partNumber'),
    dataIndex: 'partNumber',
    key: 'partNumber',
    sorter: true,
    customRender: ({ record }: { record: Part }) => {
      if (!record.partNumber) {
        return h('span', { style: { color: '#999' } }, '-')
      }
      return h('a', {
        style: { color: '#1677ff' },
        onClick: (e: Event) => {
          e.stopPropagation()
          emit('view', record.id)
        }
      }, record.partNumber)
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
        style: { color: '#1677ff' },
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
  { title: t('partDetail.analyst'), dataIndex: 'analyst', key: 'analyst', sorter: true,
    customRender: ({ text }: { text: string }) => userDisplayName(text) },
  {
    title: t('common.status'),
    dataIndex: 'status',
    key: 'status',
    sorter: true,
    customRender: ({ record }: { record: Part }) => {
      return h(Tag, { color: getPartStatusColor(record.status) }, () => getStatusLabel(record.status))
    },
  },
  {
    title: t('common.createdAt'),
    dataIndex: 'createdAt',
    key: 'createdAt',
    sorter: true,
    customRender: ({ text }: { text: string }) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
  },
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

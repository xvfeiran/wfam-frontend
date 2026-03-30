<template>
  <a-card class="parts-card">
    <template #title>
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span>{{ t('orderDetail.partsList') }}</span>
        <slot name="headerExtra" />
      </div>
    </template>

    <!-- 搜索区域 -->
    <div class="parts-search">
      <a-row :gutter="12" align="middle">
        <a-col :span="5">
          <a-input
            v-model:value="partSearch.partNumber"
            :placeholder="t('returnPart.partNumber')"
            allow-clear
          />
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="partSearch.businessUnit"
            :placeholder="t('returnPart.businessUnit')"
            allow-clear
            style="width: 100%"
            :loading="loadingLookup"
          >
            <a-select-option v-for="bu in lookupData.businessUnits" :key="bu" :value="bu">
              {{ bu }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="partSearch.productPlatform"
            :placeholder="t('returnPart.productPlatform')"
            allow-clear
            style="width: 100%"
            :loading="loadingLookup"
          >
            <a-select-option v-for="pp in lookupData.productPlatforms" :key="pp" :value="pp">
              {{ pp }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="partSearch.status"
            :placeholder="t('common.status')"
            allow-clear
            style="width: 100%"
          >
            <a-select-option v-for="(info, key) in PART_STATUS_MAP" :key="key" :value="key">
              {{ getStatusLabel(key) }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-space>
            <a-button type="primary" :loading="loading" @click="handleSearch">
              {{ t('common.search') }}
            </a-button>
            <a-button @click="handleReset">
              {{ t('common.reset') }}
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <a-table
      :columns="allColumns"
      :data-source="paginatedParts"
      :pagination="partsPagination"
      :loading="loading"
      row-key="id"
      :custom-row="customRow"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="PART_STATUS_MAP[record.status]?.color || 'default'">
            {{ getStatusLabel(record.status) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'isSample'">
          <a-tag :color="record.isSample === 1 ? 'green' : 'default'">
            {{ record.isSample === 1 ? t('analysisOrder.sampled') : t('analysisOrder.unsampled') }}
          </a-tag>
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PART_STATUS_MAP } from '@/types'
import type { Part } from '@/types'
import { lookupApi } from '@/services/lookupApi'
import { useStatusLabels } from '@/composables/useStatusLabels'

const props = defineProps<{
  parts: Part[]
  loading?: boolean
  showSampleStatus?: boolean
}>()

const { t } = useI18n()
const router = useRouter()
const { getStatusLabel } = useStatusLabels()

const loadingLookup = ref(false)
const lookupData = ref({
  businessUnits: [] as string[],
  productPlatforms: [] as string[],
})

const partSearch = ref({
  partNumber: '',
  businessUnit: undefined as string | undefined,
  productPlatform: undefined as string | undefined,
  status: undefined as string | undefined,
})

const partsPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => t('common.total', { total }),
})

const partsSorter = ref<{
  columnKey?: string
  order?: 'ascend' | 'descend' | null
}>({})

// 搜索过滤
const filteredParts = computed(() => {
  let result = props.parts
  if (partSearch.value.partNumber) {
    const kw = partSearch.value.partNumber.toLowerCase()
    result = result.filter(p => (p.partNumber || '').toLowerCase().includes(kw) || (p.partCode || '').toLowerCase().includes(kw))
  }
  if (partSearch.value.businessUnit) {
    result = result.filter(p => p.businessUnit === partSearch.value.businessUnit)
  }
  if (partSearch.value.productPlatform) {
    result = result.filter(p => p.productPlatform === partSearch.value.productPlatform)
  }
  if (partSearch.value.status) {
    result = result.filter(p => p.status === partSearch.value.status)
  }
  partsPagination.value.total = result.length
  return result
})

// 排序
const sortedParts = computed(() => {
  if (!partsSorter.value.columnKey || !partsSorter.value.order) {
    return filteredParts.value
  }
  const { columnKey, order } = partsSorter.value
  return [...filteredParts.value].sort((a: any, b: any) => {
    const aVal = a[columnKey] || ''
    const bVal = b[columnKey] || ''
    if (columnKey === 'partNumber') {
      if (!a.partNumber && b.partNumber) return 1
      if (a.partNumber && !b.partNumber) return -1
    }
    const result = String(aVal).localeCompare(String(bVal))
    return order === 'ascend' ? result : -result
  })
})

// 分页
const paginatedParts = computed(() => {
  const { current, pageSize } = partsPagination.value
  const start = (current - 1) * pageSize
  return sortedParts.value.slice(start, start + pageSize)
})

// 基础列
const baseColumns = computed(() => [
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
          router.push(`/return-parts/${record.id}`)
        }
      }, text)
    }
  },
  {
    title: t('returnPart.partCode'),
    dataIndex: 'partCode',
    key: 'partCode',
    sorter: true,
  },
  {
    title: t('returnPart.businessUnit'),
    dataIndex: 'businessUnit',
    key: 'businessUnit',
    sorter: true,
  },
  {
    title: t('returnPart.productPlatform'),
    dataIndex: 'productPlatform',
    key: 'productPlatform',
    sorter: true,
  },
  {
    title: t('common.status'),
    dataIndex: 'status',
    key: 'status',
    sorter: true,
  },
])

// 完整列（含可选的抽样状态列）
const allColumns = computed(() => {
  const cols = [...baseColumns.value]
  if (props.showSampleStatus) {
    cols.push({
      title: t('analysisOrder.sampleStatus'),
      dataIndex: 'isSample',
      key: 'isSample',
      sorter: true,
    })
  }
  return cols
})

const handleSearch = () => {
  partsPagination.value.current = 1
}

const handleReset = () => {
  partSearch.value = {
    partNumber: '',
    businessUnit: undefined,
    productPlatform: undefined,
    status: undefined,
  }
  partsSorter.value = {}
  partsPagination.value.current = 1
}

const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
  const sortChanged = sorter.columnKey !== partsSorter.value.columnKey ||
                      sorter.order !== partsSorter.value.order
  partsSorter.value = { columnKey: sorter.columnKey, order: sorter.order }
  partsPagination.value.pageSize = pagination.pageSize
  partsPagination.value.current = sortChanged ? 1 : pagination.current
}

const customRow = (record: Part) => ({
  onClick: () => router.push(`/return-parts/${record.id}`),
  style: { cursor: 'pointer' },
})

onMounted(async () => {
  loadingLookup.value = true
  try {
    const data = await lookupApi.getAll()
    lookupData.value.businessUnits = data.businessUnits || []
    lookupData.value.productPlatforms = data.productPlatforms || []
  } catch {
    // 字典加载失败不影响主功能
  } finally {
    loadingLookup.value = false
  }
})
</script>

<style lang="less" scoped>
.parts-search {
  margin-bottom: 16px;
}
</style>

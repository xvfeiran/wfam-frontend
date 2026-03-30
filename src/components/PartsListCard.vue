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
            v-model:value="searchParams.keyword"
            :placeholder="t('returnPart.partNumber')"
            allow-clear
          />
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="searchParams.businessUnit"
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
            v-model:value="searchParams.productPlatform"
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
            v-model:value="searchParams.status"
            :placeholder="t('common.status')"
            allow-clear
            style="width: 100%"
          >
            <a-select-option v-for="status in statusOptions" :key="status" :value="status">
              {{ getStatusLabel(status) }}
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
      :data-source="parts"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      :custom-row="customRow"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getPartStatusColor(record.status)">
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
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { PART_STATUS_MAP, PartStatus } from '@/types'
import type { Part } from '@/types'
import { returnOrderApi } from '@/services/returnOrderApi'
import { lookupApi } from '@/services/lookupApi'
import { useStatusLabels } from '@/composables/useStatusLabels'

const props = defineProps<{
  orderId: string
  analyst?: string
  showSampleStatus?: boolean
}>()

const { t } = useI18n()
const router = useRouter()
const { getStatusLabel } = useStatusLabels()

const loading = ref(false)
const parts = ref<Part[]>([])

const loadingLookup = ref(false)
const lookupData = ref({
  businessUnits: [] as string[],
  productPlatforms: [] as string[],
})

const searchParams = ref({
  keyword: '',
  businessUnit: undefined as string | undefined,
  productPlatform: undefined as string | undefined,
  status: undefined as PartStatus | undefined,
})

const statusOptions = Object.values(PartStatus)

const getPartStatusColor = (status: PartStatus | string) => {
  return status in PART_STATUS_MAP
    ? PART_STATUS_MAP[status as PartStatus].color
    : 'default'
}

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => t('common.total', { total }),
})

const sortState = ref<{ field?: string; order?: 'ascend' | 'descend' }>({})

const loadData = async () => {
  if (!props.orderId) return
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    }
    if (sortState.value.field) {
      params.sortBy = sortState.value.field
      params.sortOrder = sortState.value.order
    }
    if (searchParams.value.keyword) params.keyword = searchParams.value.keyword
    if (searchParams.value.businessUnit) params.businessUnit = searchParams.value.businessUnit
    if (searchParams.value.productPlatform) params.productPlatform = searchParams.value.productPlatform
    if (searchParams.value.status) params.status = searchParams.value.status
    if (props.analyst) params.analyst = props.analyst

    const result = await returnOrderApi.getParts(props.orderId, params)
    parts.value = result.data
    pagination.value.total = result.total
  } catch (error) {
    console.error('Failed to load parts:', error)
    message.error(t('message.loadFailed'))
  } finally {
    loading.value = false
  }
}

defineExpose({ refresh: loadData })

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
  pagination.value.current = 1
  loadData()
}

const handleReset = () => {
  searchParams.value = {
    keyword: '',
    businessUnit: undefined,
    productPlatform: undefined,
    status: undefined,
  }
  sortState.value = {}
  pagination.value.current = 1
  loadData()
}

const handleTableChange = (pag: any, _filters: any, sorter: any) => {
  const prevField = sortState.value.field
  const prevOrder = sortState.value.order

  sortState.value = { field: sorter.columnKey || sorter.field, order: sorter.order }

  const sortChanged = (sorter.columnKey || sorter.field) !== prevField || sorter.order !== prevOrder
  if (sortChanged && (sorter.columnKey || sorter.field)) {
    pagination.value.current = 1
  } else {
    pagination.value.current = pag.current
  }
  pagination.value.pageSize = pag.pageSize
  loadData()
}

const customRow = (record: Part) => ({
  onClick: () => router.push(`/return-parts/${record.id}`),
  style: { cursor: 'pointer' },
})

// 监听 orderId / analyst 变化时重新加载（immediate 确保首次挂载也加载）
watch([() => props.orderId, () => props.analyst], () => {
  if (props.orderId) {
    pagination.value.current = 1
    loadData()
  }
}, { immediate: true })

onMounted(async () => {
  // 加载字典数据
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

<template>
  <div class="part-code-management">
    <a-card :title="t('settings.partCodeManagement')">
      <template #extra>
        <a-space>
          <a-input
            v-model:value="searchPartCode"
            :placeholder="t('settings.partCode')"
            allow-clear
            style="width: 200px"
            @pressEnter="handleSearch"
          />
          <a-input
            v-model:value="searchBusinessUnit"
            :placeholder="t('settings.businessUnit')"
            allow-clear
            style="width: 200px"
            @pressEnter="handleSearch"
          />
          <a-input
            v-model:value="searchProductPlatform"
            :placeholder="t('settings.productPlatform')"
            allow-clear
            style="width: 200px"
            @pressEnter="handleSearch"
          />
          <a-button type="primary" @click="handleSearch">
            <SearchOutlined /> {{ t('common.search') }}
          </a-button>
          <a-button @click="handleReset">
            <ReloadOutlined /> {{ t('common.reset') }}
          </a-button>
          <a-button type="primary" @click="$emit('add-part-code')">
            <PlusOutlined /> {{ t('settings.addPartCode') }}
          </a-button>
        </a-space>
      </template>
      <a-table
        :columns="columns"
        :data-source="partCodes"
        :pagination="paginationConfig"
        :loading="loading"
        row-key="id"
        size="middle"
        :bordered="false"
        :sort-state="sortState"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a @click="$emit('edit-part-code', record)">{{ t('common.edit') }}</a>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import type { PartCode } from '@/services/partCodeApi'

interface Props {
  partCodes: PartCode[]
  loading?: boolean
  total: number
  currentPage: number
  pageSize: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 10,
})

const emit = defineEmits<{
  (e: 'add-part-code'): void
  (e: 'edit-part-code', record: PartCode): void
  (e: 'search', partCode: string, businessUnit: string, productPlatform: string): void
  (e: 'reset'): void
  (e: 'page-change', page: number, pageSize: number): void
  (e: 'sort-change', sortBy: string, sortOrder: 'ascend' | 'descend' | null): void
}>()

const { t } = useI18n()

const searchPartCode = ref('')
const searchBusinessUnit = ref('')
const searchProductPlatform = ref('')

const sortState = ref<{
  field?: string
  order?: 'ascend' | 'descend' | null
}>({
  field: undefined,
  order: null,
})

const columns = computed(() => [
  {
    title: t('settings.partCode'),
    dataIndex: 'partCode',
    key: 'partCode',
    sorter: true,
    sortOrder: sortState.value.field === 'partCode' ? sortState.value.order : undefined,
  },
  {
    title: t('settings.businessUnit'),
    dataIndex: 'businessUnit',
    key: 'businessUnit',
    sorter: true,
    sortOrder: sortState.value.field === 'businessUnit' ? sortState.value.order : undefined,
  },
  {
    title: t('settings.productPlatform'),
    dataIndex: 'productPlatform',
    key: 'productPlatform',
  },
  { title: t('common.operation'), key: 'action', width: 100 },
])

const paginationConfig = computed(() => ({
  current: props.currentPage,
  pageSize: props.pageSize,
  total: props.total,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => t('common.total', { total }),
}))

const handleSearch = () => {
  emit('search', searchPartCode.value, searchBusinessUnit.value, searchProductPlatform.value)
}

const handleReset = () => {
  searchPartCode.value = ''
  searchBusinessUnit.value = ''
  searchProductPlatform.value = ''
  sortState.value = { field: undefined, order: null }
  emit('reset')
}

const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
  sortState.value = {
    field: sorter.field,
    order: sorter.order,
  }
  emit('sort-change', sorter.field, sorter.order)
  emit('page-change', pagination.current, pagination.pageSize)
}
</script>

<style lang="less" scoped>
.part-code-management {
  :deep(.ant-card-extra) {
    display: flex;
    gap: 8px;
  }
}
</style>

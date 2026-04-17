<template>
  <div class="customer-management">
    <a-card :title="t('settings.customerManagement')">
      <template #extra>
        <a-space>
          <a-input
            v-model:value="searchName"
            :placeholder="t('settings.customer')"
            allow-clear
            style="width: 200px"
            @pressEnter="handleSearch"
          />
          <a-input
            v-model:value="searchCode"
            :placeholder="t('settings.customerCode')"
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
          <a-button type="primary" @click="$emit('add-customer')">
            <PlusOutlined /> {{ t('settings.addCustomer') }}
          </a-button>
        </a-space>
      </template>
      <a-table
        :columns="columns"
        :data-source="customers"
        :pagination="paginationConfig"
        :loading="loading"
        row-key="id"
        size="middle"
        :bordered="false"
        :sort-state="sortState"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'customerCode'">
            <a-tag v-if="record.code" color="blue">{{ record.code }}</a-tag>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a @click="$emit('edit-customer', record)">{{ t('common.edit') }}</a>
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
import type { Customer } from '@/services/customerApi'

interface Props {
  customers: Customer[]
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
  (e: 'add-customer'): void
  (e: 'edit-customer', record: Customer): void
  (e: 'search', name: string, code: string): void
  (e: 'reset'): void
  (e: 'page-change', page: number, pageSize: number): void
  (e: 'sort-change', sortBy: string, sortOrder: 'ascend' | 'descend' | null): void
}>()

const { t } = useI18n()

const searchName = ref('')
const searchCode = ref('')

const sortState = ref<{
  field?: string
  order?: 'ascend' | 'descend' | null
}>({
  field: undefined,
  order: null,
})

const columns = computed(() => [
  {
    title: t('settings.customer'),
    dataIndex: 'name',
    key: 'name',
    sorter: true,
    sortOrder: sortState.value.field === 'name' ? sortState.value.order : undefined,
  },
  {
    title: t('settings.customerCode'),
    dataIndex: 'code',
    key: 'customerCode',
    sorter: true,
    sortOrder: sortState.value.field === 'code' ? sortState.value.order : undefined,
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
  emit('search', searchName.value, searchCode.value)
}

const handleReset = () => {
  searchName.value = ''
  searchCode.value = ''
  sortState.value = { field: undefined, order: null }
  emit('reset')
}

const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
  // Update sort state
  sortState.value = {
    field: sorter.field,
    order: sorter.order,
  }
  emit('sort-change', sorter.field, sorter.order)
  emit('page-change', pagination.current, pagination.pageSize)
}
</script>

<style lang="less" scoped>
.customer-management {
  :deep(.ant-card-extra) {
    display: flex;
    gap: 8px;
  }
}
</style>

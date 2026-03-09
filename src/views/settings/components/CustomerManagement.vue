<template>
  <div class="customer-management">
    <a-card :title="t('settings.customerManagement')">
      <template #extra>
        <a-button type="primary" @click="$emit('add-customer')">
          <PlusOutlined /> {{ t('settings.addCustomer') }}
        </a-button>
      </template>
      <a-table :columns="columns" :data-source="customers" :pagination="false" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'customerCode'">
            <a-tag color="blue">{{ record.code }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a @click="$emit('edit-customer', record)">{{ t('common.edit') }}</a>
              <a-divider type="vertical" />
              <a-popconfirm :title="t('settings.confirmDeleteCustomer')" @confirm="$emit('delete-customer', record.id)">
                <a class="danger-link">{{ t('common.delete') }}</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusOutlined } from '@ant-design/icons-vue'

interface Customer {
  id: string
  name: string
  code: string
}

interface Props {
  customers: Customer[]
}

defineProps<Props>()

defineEmits<{
  (e: 'add-customer'): void
  (e: 'edit-customer', record: Customer): void
  (e: 'delete-customer', id: string): void
}>()

const { t } = useI18n()

const columns = computed(() => [
  { title: t('settings.customerName'), dataIndex: 'name', key: 'name' },
  { title: t('settings.customerCode'), dataIndex: 'code', key: 'customerCode' },
  { title: t('common.operation'), key: 'action', width: 150 },
])
</script>

<style lang="less" scoped>
.danger-link {
  color: #ff4d4f;
}
</style>

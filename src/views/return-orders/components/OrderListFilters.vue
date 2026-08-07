<template>
  <a-card class="filter-card">
    <a-form :model="localFilters">
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnOrder.orderNumber')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-input v-model:value="localFilters.orderNumber" :placeholder="t('validation.inputOrderNumber')" allowClear />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnOrder.customer')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.customerId" :placeholder="t('validation.selectCustomer')" allowClear showSearch optionFilterProp="label">
              <a-select-option v-for="c in customers" :key="c.id" :value="c.name" :label="c.name">{{ c.name }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnOrder.receiveDate')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-range-picker v-model:value="localFilters.receiveDate" style="width: 100%" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('common.status')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.status" :placeholder="t('validation.pleaseSelect')" allowClear>
              <a-select-option value="draft">{{ t('returnOrder.status.draft') }}</a-select-option>
              <a-select-option value="submitted">{{ t('returnOrder.status.submitted') }}</a-select-option>
              <a-select-option value="registered">{{ t('returnOrder.status.registered') }}</a-select-option>
              <a-select-option value="scrapped">{{ t('returnOrder.status.scrapped') }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnOrder.returnMethod')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.returnMethod" :placeholder="t('validation.selectReturnMethod')" allowClear>
              <a-select-option value="express">{{ t('returnOrder.methodExpress') }}</a-select-option>
              <a-select-option value="pickup">{{ t('returnOrder.methodPickup') }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('common.createdAt')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-range-picker v-model:value="localFilters.createdAt" style="width: 100%" />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnOrder.complaintDate')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-range-picker v-model:value="localFilters.complaintDate" style="width: 100%" />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="24" class="filter-buttons">
          <a-space>
            <a-button type="primary" @click="$emit('search')">
              <SearchOutlined /> {{ t('common.search') }}
            </a-button>
            <a-button @click="$emit('reset')">
              <ReloadOutlined /> {{ t('common.reset') }}
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import type { Customer } from '@/services/customerApi'

interface Filters {
  orderNumber: string
  customerId?: string
  receiveDate: any
  status?: string
  returnMethod?: string
  createdAt?: any
  complaintDate?: any
}

interface Props {
  filters: Filters
  customers: Customer[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:filters', value: Filters): void
  (e: 'search'): void
  (e: 'reset'): void
}>()

const { t } = useI18n()

const localFilters = computed({
  get: () => props.filters,
  set: (value) => emit('update:filters', value)
})
</script>

<style lang="less" scoped>
.filter-card {
  margin-bottom: 16px;

  .filter-buttons {
    text-align: right;
    padding-top: 4px;
  }
}
</style>

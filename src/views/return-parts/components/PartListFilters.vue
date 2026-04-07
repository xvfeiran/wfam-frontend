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
          <a-form-item :label="t('returnPart.partCode')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-input v-model:value="localFilters.partCode" :placeholder="t('validation.inputPartCode')" allowClear />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.businessUnit')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.businessUnit" :placeholder="t('validation.selectBusinessUnit')" allowClear>
              <a-select-option v-for="bu in businessUnits" :key="bu" :value="bu">{{ bu }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.productPlatform')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.productPlatform" :placeholder="t('validation.selectProductPlatform')" allowClear>
              <a-select-option v-for="pp in productPlatforms" :key="pp" :value="pp">{{ pp }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('common.status')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.status" :placeholder="t('validation.pleaseSelect')" allowClear>
              <a-select-option v-for="status in statusOptions" :key="status" :value="status">
                {{ getStatusLabel(status) }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.qcCreated')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.qcCreated" :placeholder="t('validation.pleaseSelect')" allowClear>
              <a-select-option value="yes">{{ t('returnPart.qcCreatedYes') }}</a-select-option>
              <a-select-option value="no">{{ t('returnPart.qcCreatedNo') }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('partDetail.analyst')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.analyst" :placeholder="t('validation.pleaseSelect')" allowClear>
              <a-select-option v-for="u in analysts" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
            </a-select>
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
import { PartStatus } from '@/types'
import { useStatusLabels } from '@/composables/useStatusLabels'

interface Filters {
  orderNumber: string
  partCode: string
  businessUnit?: string
  productPlatform?: string
  status?: string
  qcCreated?: string
  analyst?: string
}

interface Props {
  filters: Filters
  businessUnits: string[]
  productPlatforms: string[]
  analysts: { id: string; loginName: string; displayName: string }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:filters', value: Filters): void
  (e: 'search'): void
  (e: 'reset'): void
}>()

const { t } = useI18n()
const { getStatusLabel } = useStatusLabels()
const statusOptions = Object.values(PartStatus)

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
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>

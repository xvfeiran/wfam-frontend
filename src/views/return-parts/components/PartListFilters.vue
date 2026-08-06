<template>
  <a-card class="filter-card">
    <a-form :model="localFilters">
      <!-- 标识信息 -->
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnOrder.orderNumber')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-input v-model:value="localFilters.orderNumber" :placeholder="t('validation.inputOrderNumber')" allowClear />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.partCode')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select
              v-model:value="localFilters.partCode"
              :placeholder="t('validation.inputPartCode')"
              show-search
              :filter-option="false"
              :not-found-content="partCodeSearching ? undefined : null"
              @search="handlePartCodeSearch"
              @dropdownVisibleChange="handlePartCodeDropdownVisibleChange"
              allowClear
            >
              <template v-if="partCodeSearching" #notFoundContent>
                <a-spin size="small" />
              </template>
              <a-select-option v-for="pc in partCodeOptions" :key="pc.partCode" :value="pc.partCode">
                {{ pc.partCode }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <!-- 产品分类 -->
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.businessUnit')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.businessUnit" :placeholder="t('validation.selectBusinessUnit')" allowClear showSearch>
              <a-select-option v-for="bu in businessUnits" :key="bu" :value="bu">{{ bu }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.productPlatform')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.productPlatform" :placeholder="t('validation.selectProductPlatform')" allowClear showSearch>
              <a-select-option v-for="pp in productPlatforms" :key="pp" :value="pp">{{ pp }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <!-- 流程管理 -->
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('common.status')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.status" :placeholder="t('validation.pleaseSelect')" allowClear showSearch>
              <a-select-option v-for="status in statusOptions" :key="status" :value="status">
                {{ getStatusLabel(status) }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('partDetail.analyst')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.analyst" :placeholder="t('validation.pleaseSelect')" allowClear showSearch>
              <a-select-option v-for="u in analysts" :key="u.loginName" :value="u.loginName">{{ u.displayName }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <!-- 流程辅助筛选 -->
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.qcCreated')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-select v-model:value="localFilters.qcCreated" :placeholder="t('validation.pleaseSelect')" allowClear>
              <a-select-option value="yes">{{ t('returnPart.qcCreatedYes') }}</a-select-option>
              <a-select-option value="no">{{ t('returnPart.qcCreatedNo') }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.partProductionDateRange')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-range-picker v-model:value="localFilters.partProductionDateRange" style="width: 100%" />
          </a-form-item>
        </a-col>
      </a-row>
      <!-- 物理属性（区间筛选） -->
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('common.createdAt')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-range-picker v-model:value="localFilters.createdAtRange" style="width: 100%" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.vehicleMileageRange')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <div class="mileage-range">
              <div class="mileage-inputs">
                <a-input-number
                  v-model:value="localFilters.vehicleMileageMin"
                  :min="0"
                  :step="1000"
                  :placeholder="t('returnPart.mileageNoLimit')"
                  :formatter="formatMileage"
                  :parser="parseMileage"
                />
                <span class="mileage-separator">~</span>
                <a-input-number
                  v-model:value="localFilters.vehicleMileageMax"
                  :min="0"
                  :step="1000"
                  :placeholder="t('returnPart.mileageNoLimit')"
                  :formatter="formatMileage"
                  :parser="parseMileage"
                />
                <span class="mileage-unit">km</span>
              </div>
              <a-slider
                :value="sliderPositions"
                @change="onSliderChange"
                range
                :min="0"
                :max="100"
                :marks="sliderMarks"
                :tip-formatter="formatSliderTip"
              />
            </div>
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { PartStatus } from '@/types'
import { useStatusLabels } from '@/composables/useStatusLabels'
import { partCodeApi } from '@/services/partCodeApi'

const MAX_MILEAGE = 300000

interface Filters {
  orderNumber: string
  partCode: string
  businessUnit?: string
  productPlatform?: string
  status?: string
  qcCreated?: string
  analyst?: string
  partProductionDateRange?: [dayjs.Dayjs, dayjs.Dayjs]
  createdAtRange?: [dayjs.Dayjs, dayjs.Dayjs]
  vehicleMileageMin?: number
  vehicleMileageMax?: number
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

// 零件号下拉选项（远程搜索）
const partCodeOptions = ref<any[]>([])
const partCodeSearching = ref(false)
let partCodeSearchTimer: ReturnType<typeof setTimeout> | null = null

const loadPartCodeOptions = async (keyword?: string) => {
  partCodeSearching.value = true
  try {
    const result = await partCodeApi.page({
      partCode: keyword && keyword.trim() ? keyword.trim() : undefined,
      pageSize: 50,
    })
    partCodeOptions.value = result.data || []
  } catch (error) {
    console.error('Failed to search part codes:', error)
    partCodeOptions.value = []
  } finally {
    partCodeSearching.value = false
  }
}

const handlePartCodeSearch = (value: string) => {
  if (partCodeSearchTimer) {
    clearTimeout(partCodeSearchTimer)
  }
  if (!value || value.trim() === '') {
    partCodeOptions.value = []
    return
  }
  // 防抖：300ms 后执行搜索
  partCodeSearchTimer = setTimeout(() => {
    loadPartCodeOptions(value)
  }, 300)
}

const handlePartCodeDropdownVisibleChange = (open: boolean) => {
  if (open && partCodeOptions.value.length === 0) {
    loadPartCodeOptions()
  }
}

const localFilters = computed({
  get: () => props.filters,
  set: (value) => emit('update:filters', value)
})

// Quadratic mapping: gives ~58% of slider to 0-100k km range
const toSliderPos = (km: number) => Math.round(Math.sqrt(km / MAX_MILEAGE) * 100)
const toKm = (pos: number) => Math.round(Math.pow(pos / 100, 2) * MAX_MILEAGE)

const sliderPositions = computed<[number, number]>(() => [
  toSliderPos(props.filters.vehicleMileageMin ?? 0),
  toSliderPos(Math.min(props.filters.vehicleMileageMax ?? MAX_MILEAGE, MAX_MILEAGE)),
])

const onSliderChange = ([from, to]: number[]) => {
  emit('update:filters', {
    ...props.filters,
    vehicleMileageMin: from > 0 ? toKm(from) : undefined,
    vehicleMileageMax: to < 100 ? toKm(to) : undefined,
  })
}

const sliderMarks: Record<number, string> = {
  0: '0',
  41: '5万',
  58: '10万',
  82: '20万',
  100: '30万',
}

const formatSliderTip = (val: number | undefined) => {
  if (val == null) return ''
  return toKm(val).toLocaleString() + ' km'
}

const formatMileage = (v: string | number | undefined) => {
  if (v == null || v === '') return ''
  return `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const parseMileage = (v: string) => v.replace(/,/g, '')
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

  .mileage-range {
    .mileage-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .ant-input-number {
        flex: 1;
      }

      .mileage-separator {
        color: #999;
      }

      .mileage-unit {
        color: #666;
        white-space: nowrap;
      }
    }
  }
}
</style>

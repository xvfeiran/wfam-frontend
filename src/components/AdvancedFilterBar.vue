<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Select, DatePicker, Button, Space } from 'ant-design-vue'
import dayjs from 'dayjs'

// ============ Types ============
export interface FilterOption {
  label: string
  value: string | number
}

export interface VisibleFilters {
  dateRange?: boolean
  customer?: boolean
  bu?: boolean
  platform?: boolean
  faultMode?: boolean
  partNo?: boolean
  bcso?: boolean
  mileage?: boolean
}

export interface FilterValues {
  dateRange: [string, string] | null
  customer: string[] | null
  bu: string[] | null
  platform: string[] | null
  faultMode: string[] | null
  partNo: string[] | null
  bcso: string[] | null
  mileage: string[] | null
}

interface Props {
  visibleFilters?: VisibleFilters
  customerOptions?: FilterOption[]
  platformOptions?: FilterOption[]
  faultModeOptions?: FilterOption[]
  partNoOptions?: FilterOption[]
  initialValues?: Partial<FilterValues>
}

interface Emits {
  (e: 'search', values: Partial<FilterValues>): void
  (e: 'reset'): void
  (e: 'update:ytdEnabled', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visibleFilters: () => ({}),
  customerOptions: () => [],
  platformOptions: () => [],
  faultModeOptions: () => [],
  partNoOptions: () => [],
  initialValues: () => ({}),
})

const emit = defineEmits<Emits>()

// ============ Filter Definitions ============
const defaultOptions = {
  bu: [
    { label: 'WS', value: 'WS' },
    { label: 'CA', value: 'CA' },
    { label: 'TS', value: 'TS' },
    { label: 'IB', value: 'IB' },
  ],
  bcso: [
    { label: 'B', value: 'B' },
    { label: 'C', value: 'C' },
    { label: 'S', value: 'S' },
    { label: 'O', value: 'O' },
  ],
  mileage: [
    { label: '0-1000', value: '0-1000' },
    { label: '1000-5000', value: '1000-5000' },
    { label: '5000-10000', value: '5000-10000' },
    { label: '10000-20000', value: '10000-20000' },
    { label: '20000-40000', value: '20000-40000' },
    { label: '40000-60000', value: '40000-60000' },
    { label: '60000-100000', value: '60000-100000' },
    { label: '100000-150000', value: '100000-150000' },
  ],
}

function getOptions(key: string): FilterOption[] {
  switch (key) {
    case 'bu':
      return defaultOptions.bu
    case 'bcso':
      return defaultOptions.bcso
    case 'mileage':
      return defaultOptions.mileage
    case 'customer':
      return props.customerOptions
    case 'platform':
      return props.platformOptions
    case 'faultMode':
      return props.faultModeOptions
    case 'partNo':
      return props.partNoOptions
    default:
      return []
  }
}

// Filter items based on visibility
const filterItems = computed(() => {
  const items: Array<{
    key: string
    label: string
    type: 'date-range' | 'multi-select'
    placeholder?: string
  }> = []
  const vf = props.visibleFilters

  if (vf.dateRange !== false) {
    items.push({ key: 'dateRange', label: '时间范围', type: 'date-range' })
  }
  if (vf.customer !== false) {
    items.push({ key: 'customer', label: '客户', type: 'multi-select', placeholder: '选择客户' })
  }
  if (vf.bu !== false) {
    items.push({ key: 'bu', label: 'BU', type: 'multi-select', placeholder: '选择BU' })
  }
  if (vf.platform !== false) {
    items.push({
      key: 'platform',
      label: '产品平台',
      type: 'multi-select',
      placeholder: '选择产品平台',
    })
  }
  if (vf.faultMode !== false) {
    items.push({
      key: 'faultMode',
      label: '故障模式',
      type: 'multi-select',
      placeholder: '选择故障模式',
    })
  }
  if (vf.partNo !== false) {
    items.push({ key: 'partNo', label: '零件号', type: 'multi-select', placeholder: '选择零件号' })
  }
  if (vf.bcso !== false) {
    items.push({ key: 'bcso', label: 'B/C/S/O', type: 'multi-select', placeholder: '选择B/C/S/O' })
  }
  if (vf.mileage === true) {
    items.push({ key: 'mileage', label: '公里数', type: 'multi-select', placeholder: '选择公里数' })
  }

  return items
})

// 动态计算每行显示几个筛选项
const filterBarRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)

// 每个筛选项的最小宽度
const MIN_ITEM_WIDTH = 280
const GAP = 24

function updateContainerWidth() {
  if (filterBarRef.value) {
    containerWidth.value = filterBarRef.value.offsetWidth
  }
}

// 根据容器宽度计算列数
const columnsCount = computed(() => {
  const availableWidth = containerWidth.value - 32 // 减去 padding
  const possibleColumns = Math.floor((availableWidth + GAP) / (MIN_ITEM_WIDTH + GAP))
  return Math.max(1, Math.min(possibleColumns, 4)) // 最少1列，最多4列
})

// 根据筛选项数量计算行数（每行4个的情况下的行数）
const rowsCount = computed(() => {
  return Math.ceil(filterItems.value.length / columnsCount.value)
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateContainerWidth()

  if (filterBarRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerWidth()
    })
    resizeObserver.observe(filterBarRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// Local values
const isInitialized = ref(false)

const localValues = ref<Partial<FilterValues>>({
  dateRange: null,
  customer: null,
  bu: null,
  platform: null,
  faultMode: null,
  partNo: null,
  bcso: null,
  mileage: null,
})

onMounted(() => {
  if (!isInitialized.value && props.initialValues) {
    const iv = props.initialValues
    if (iv.dateRange) localValues.value.dateRange = iv.dateRange
    if (iv.customer?.length) localValues.value.customer = iv.customer
    if (iv.bu?.length) localValues.value.bu = iv.bu
    if (iv.platform?.length) localValues.value.platform = iv.platform
    if (iv.faultMode?.length) localValues.value.faultMode = iv.faultMode
    if (iv.partNo?.length) localValues.value.partNo = iv.partNo
    if (iv.bcso?.length) localValues.value.bcso = iv.bcso
    if (iv.mileage?.length) localValues.value.mileage = iv.mileage
    isInitialized.value = true
  }
})

const tempSelectDate = ref<dayjs.Dayjs | null>(null)

function handleMultiSelectChange(key: keyof FilterValues, val: string[]) {
  localValues.value[key] = val.length ? val : null
}

function handleDateRangeChange(val: [dayjs.Dayjs, dayjs.Dayjs] | null) {
  if (val && val[0] && val[1]) {
    localValues.value.dateRange = [val[0].format('YYYY-MM'), val[1].format('YYYY-MM')]
  } else {
    localValues.value.dateRange = null
  }
}

function onOpenChange(open: boolean) {
  if (!open) {
    tempSelectDate.value = null
  }
}

function onCalendarChange(dates: [dayjs.Dayjs, dayjs.Dayjs]) {
  tempSelectDate.value = dates[0]
}

function disabledDate(current: dayjs.Dayjs): boolean {
  const today = dayjs()
  const isFuture = current.isAfter(today, 'month')
  if (isFuture) return true
  if (tempSelectDate.value) {
    const isDifYear = current.year() !== tempSelectDate.value.year()
    return isDifYear
  }
  return false
}

function handleSearch() {
  const result: Partial<FilterValues> = {}
  if (localValues.value.dateRange) result.dateRange = localValues.value.dateRange
  if (localValues.value.customer?.length) result.customer = localValues.value.customer
  if (localValues.value.bu?.length) result.bu = localValues.value.bu
  if (localValues.value.platform?.length) result.platform = localValues.value.platform
  if (localValues.value.faultMode?.length) result.faultMode = localValues.value.faultMode
  if (localValues.value.partNo?.length) result.partNo = localValues.value.partNo
  if (localValues.value.bcso?.length) result.bcso = localValues.value.bcso
  if (localValues.value.mileage?.length) result.mileage = localValues.value.mileage
  emit('search', result)
}

function handleReset() {
  localValues.value = {
    dateRange: props.initialValues?.dateRange ?? null,
    customer: null,
    bu: null,
    platform: null,
    faultMode: null,
    partNo: null,
    bcso: null,
    mileage: null,
  }
  emit('reset')
  handleSearch()
}

const dateDisplayValue = computed<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => {
  const range = localValues.value.dateRange
  if (!range || !range[0] || !range[1]) return null
  return [dayjs(range[0], 'YYYY-MM'), dayjs(range[1], 'YYYY-MM')]
})
</script>

<template>
  <div ref="filterBarRef" class="advanced-filter-bar">
    <div
      class="filters-grid"
      :style="{
        gridTemplateColumns: `repeat(${columnsCount}, minmax(${MIN_ITEM_WIDTH}px, 1fr))`,
      }"
    >
      <template v-for="item in filterItems" :key="item.key">
        <div v-if="item.type === 'date-range'" class="filter-item">
          <span class="filter-label">{{ item.label }}</span>
          <DatePicker.RangePicker
            v-model:value="dateDisplayValue"
            picker="month"
            format="YYYY-MM"
            style="width: 100%"
            :disabled-date="disabledDate"
            @change="handleDateRangeChange"
            @calendar-change="onCalendarChange"
            @openChange="onOpenChange"
          />
        </div>

        <div v-else class="filter-item">
          <span class="filter-label">{{ item.label }}</span>
          <Select
            :value="localValues[item.key as keyof FilterValues] ?? []"
            :placeholder="item.placeholder || `选择${item.label}`"
            style="width: 100%"
            mode="multiple"
            @change="
              (val: string[]) => handleMultiSelectChange(item.key as keyof FilterValues, val)
            "
          >
            <Select.Option v-for="opt in getOptions(item.key)" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </Select.Option>
          </Select>
        </div>
      </template>
    </div>

    <div class="actions-row">
      <div class="filter-count">共 {{ filterItems.length }} 个筛选项</div>
      <Space>
        <Button @click="handleReset">重置</Button>
        <Button type="primary" @click="handleSearch">搜索</Button>
      </Space>
    </div>
  </div>
</template>

<style scoped lang="less">
.advanced-filter-bar {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  overflow-x: hidden;
  box-sizing: border-box;
}

.filters-grid {
  display: grid;
  gap: 16px 24px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  .filter-label {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 60px;
  }

  :deep(.ant-select),
  :deep(.ant-picker) {
    flex: 1;
    min-width: 0;
  }
}

.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;

  .filter-count {
    font-size: 12px;
    color: #999;
  }
}
</style>

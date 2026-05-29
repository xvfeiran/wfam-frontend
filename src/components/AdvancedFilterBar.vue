<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Select, DatePicker, Button, Space } from 'ant-design-vue'
import dayjs from 'dayjs'
import { useReportOptionsStore } from '@/stores/reportOptions'

// ============ Types ============
export interface FilterOption {
  label: string
  value: string | number
}

export interface VisibleFilters {
  dateRange?: boolean
  singleYear?: boolean
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
  buOptions?: FilterOption[]
  platformOptions?: FilterOption[]
  faultModeOptions?: FilterOption[]
  partNoOptions?: FilterOption[]
  bcsoOptions?: FilterOption[]
  mileageOptions?: FilterOption[]
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
  buOptions: () => [],
  platformOptions: () => [],
  faultModeOptions: () => [],
  partNoOptions: () => [],
  bcsoOptions: () => [],
  mileageOptions: () => [],
  initialValues: () => ({}),
})

const emit = defineEmits<Emits>()
const optionsStore = useReportOptionsStore()
const partNoLoading = ref(false)

function getOptions(key: string): FilterOption[] {
  switch (key) {
    case 'customer':  return props.customerOptions
    case 'bu':        return props.buOptions
    case 'platform':  return props.platformOptions
    case 'faultMode': return props.faultModeOptions
    case 'partNo':    return props.partNoOptions
    case 'bcso':      return props.bcsoOptions
    case 'mileage':   return props.mileageOptions
    default:          return []
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

  if (vf.dateRange !== false && vf.singleYear) {
    items.push({ key: 'dateRange', label: '年份', type: 'single-year' })
  } else if (vf.dateRange !== false) {
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
  ;(localValues.value as Record<string, string[] | null | undefined>)[key] = val.length ? val : null
}

function handleDateRangeChange(val: [dayjs.Dayjs, dayjs.Dayjs] | null) {
  if (val && val[0] && val[1]) {
    localValues.value.dateRange = [val[0].format('YYYY-MM'), val[1].format('YYYY-MM')]
  } else {
    localValues.value.dateRange = null
  }
}

// ---- 单年选择模式 ----
const selectedYear = computed({
  get: () => {
    const range = localValues.value.dateRange
    if (!range?.[0]) return undefined
    return dayjs(range[0], 'YYYY')
  },
  set: (val: dayjs.Dayjs | undefined) => {
    if (!val) return // 不允许置空
    const year = val.year()
    const currentYear = dayjs().year()
    const currentMonth = dayjs().month() + 1
    if (year === currentYear) {
      localValues.value.dateRange = [`${year}-01`, `${year}-${String(currentMonth).padStart(2, '0')}`]
    } else {
      localValues.value.dateRange = [`${year}-01`, `${year}-12`]
    }
  },
})

function disabledYear(current: dayjs.Dayjs): boolean {
  return current.year() > dayjs().year()
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

async function handlePartNoSearch(keyword: string) {
  partNoLoading.value = true
  try {
    await optionsStore.searchPartNos(keyword)
  } finally {
    partNoLoading.value = false
  }
}

const dateDisplayValue = computed<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(() => {
  const range = localValues.value.dateRange
  if (!range || !range[0] || !range[1]) return undefined
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
        <!-- 单年选择 -->
        <div v-if="item.type === 'single-year'" class="filter-item">
          <span class="filter-label">{{ item.label }}</span>
          <DatePicker
            :value="selectedYear"
            picker="year"
            format="YYYY年"
            placeholder="选择年份"
            style="width: 100%"
            :disabled-date="disabledYear"
            @change="(val: any) => { if (val) selectedYear = val }"
          />
        </div>

        <!-- 日期范围 -->
        <div v-else-if="item.type === 'date-range'" class="filter-item">
          <span class="filter-label">{{ item.label }}</span>
          <DatePicker.RangePicker
            :value="dateDisplayValue as [dayjs.Dayjs, dayjs.Dayjs] | undefined"
            picker="month"
            format="YYYY-MM"
            style="width: 100%"
            :disabled-date="disabledDate"
            @change="(...args: any[]) => handleDateRangeChange(args[0] as [dayjs.Dayjs, dayjs.Dayjs] | null)"
            @calendar-change="(...args: any[]) => onCalendarChange(args[0] as [dayjs.Dayjs, dayjs.Dayjs])"
            @openChange="onOpenChange"
          />
        </div>

        <!-- 零件号：支持远程搜索 + 虚拟列表 -->
        <div v-else-if="item.key === 'partNo'" class="filter-item">
          <span class="filter-label">{{ item.label }}</span>
          <Select
            :value="localValues.partNo ?? []"
            :placeholder="'输入零件号搜索'"
            style="width: 100%"
            mode="multiple"
            show-search
            :filter-option="false"
            :loading="partNoLoading"
            :virtual="true"
            @search="handlePartNoSearch"
            @change="(val: any) => handleMultiSelectChange('partNo', val as string[])"
          >
            <Select.Option v-for="opt in getOptions('partNo')" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 其他多选筛选项 -->
        <div v-else class="filter-item">
          <span class="filter-label">{{ item.label }}</span>
          <Select
            :value="localValues[item.key as keyof FilterValues] ?? []"
            :placeholder="item.placeholder || `选择${item.label}`"
            style="width: 100%"
            mode="multiple"
            show-search
            :filter-option="true"
            :virtual="true"
            @change="
              (val: any) => handleMultiSelectChange(item.key as keyof FilterValues, val as string[])
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

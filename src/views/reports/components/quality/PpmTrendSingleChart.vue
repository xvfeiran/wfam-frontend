<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { Radio } from 'ant-design-vue'
import { useQualityStore } from '@/stores/reportQuality'
import { qualityApi } from '@/services/reportQuality'
import { optionsApi } from '@/services/reportOptions'
import { transformPpmTrendSingle } from '@/utils/transforms/quality/ppmTrendSingle'
import AdvancedFilterBar from '@/components/AdvancedFilterBar.vue'
import type { BU } from '@/constants/reports'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

interface Props {
  bu: BU
}

const props = defineProps<Props>()

const store = useQualityStore()

// 为每个 BU 创建独立的筛选状态
const localFilters = ref({
  dateRange: defaultDateRange as [string, string] | null,
  platform: [] as string[],
  customer: [] as string[],
  bcso: [] as string[],
  faultMode: [] as string[],
  partNo: [] as string[],
})

// 筛选项
const platformOptions = ref<{ label: string; value: string }[]>([])
const customerOptions = ref<{ label: string; value: string }[]>([])
const faultModeOptions = ref<{ label: string; value: string }[]>([])
const partNoOptions = ref<{ label: string; value: string }[]>([])

// 默认时间范围：当年1月到当前月份
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const defaultDateRange: [string, string] = [
  `${currentYear}-01`,
  `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
]

// 加载筛选项
onMounted(async () => {
  try {
    const [platforms, customers, faultModes, partNos] = await Promise.all([
      optionsApi.getPlatformOptions(),
      optionsApi.getCustomerOptions(),
      optionsApi.getFaultModeOptions(),
      optionsApi.getPartNoOptions(),
    ])
    platformOptions.value = platforms.map((p) => ({ label: p.label, value: p.value }))
    customerOptions.value = customers.map((c) => ({ label: c.label, value: c.value }))
    faultModeOptions.value = faultModes.map((f) => ({ label: f.label, value: f.value }))
    partNoOptions.value = partNos.map((p) => ({ label: p.label, value: p.value }))
  } catch (e) {
    console.error('Failed to load filter options:', e)
  }
})

const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const loading = ref(false)

// PPM/IPB 切换
const metricType = ref<'ppm' | 'ipb'>('ppm')

const metricOptions = [
  { label: 'PPM', value: 'ppm' },
  { label: 'IPB', value: 'ipb' },
]

const chartOption = ref<EChartsOption>({})

async function fetchData() {
  loading.value = true
  try {
    const params = {
      bu: props.bu,
      platform: localFilters.value.platform.length ? localFilters.value.platform : null,
      customer: localFilters.value.customer.length ? localFilters.value.customer : null,
      bcso: localFilters.value.bcso.length ? localFilters.value.bcso : null,
      faultMode: localFilters.value.faultMode.length ? localFilters.value.faultMode : null,
      partNo: localFilters.value.partNo.length ? localFilters.value.partNo : null,
    }
    const res = await qualityApi.getPpmTrend(params)
    const { series, xAxisData } = transformPpmTrendSingle(res, metricType.value)

    chartOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { data: series.map((s: any) => s.name), top: 10, type: 'scroll' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value', name: metricType.value.toUpperCase() },
      series,
    }
  } finally {
    loading.value = false
  }
}

watch(metricType, fetchData)

const containerRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  fetchData()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      chartRef.value?.resize()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

function handleFilterSearch(values: any) {
  localFilters.value = {
    platform: values.platform ?? [],
    customer: values.customer ?? [],
    bcso: values.bcso ?? [],
    faultMode: values.faultMode ?? [],
    partNo: values.partNo ?? [],
  }
  fetchData()
}
</script>

<template>
  <div class="ppm-single-chart">
    <div class="chart-header">
      <div class="bu-badge">{{ bu }}</div>
      <Radio.Group v-model:value="metricType" option-type="button" :options="metricOptions" />
    </div>

    <div class="chart-filter">
      <AdvancedFilterBar
        :visible-filters="{
          dateRange: true,
          customer: true,
          bu: false,
          bcso: true,
          platform: true,
          mileage: false,
          faultMode: true,
          partNo: true,
        }"
        :customer-options="customerOptions"
        :platform-options="platformOptions"
        :fault-mode-options="faultModeOptions"
        :part-no-options="partNoOptions"
        :initial-values="{
          customer: localFilters.customer,
          bcso: localFilters.bcso,
          platform: localFilters.platform,
          faultMode: localFilters.faultMode,
          partNo: localFilters.partNo,
          dateRange: defaultDateRange,
        }"
        @search="handleFilterSearch"
      />
    </div>

    <div ref="containerRef" class="chart-wrapper">
      <div v-if="loading" class="chart-loading">加载中...</div>
      <v-chart v-else ref="chartRef" :option="chartOption" autoresize />
    </div>
  </div>
</template>

<style scoped lang="less">
.ppm-single-chart {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;

  .bu-badge {
    font-size: 16px;
    font-weight: 700;
    color: #2563eb;
    padding: 4px 12px;
    background: rgba(37, 99, 235, 0.1);
    border-radius: 6px;
  }
}

.chart-filter {
  padding: 12px 16px;
  background: #fafbfc;
}

.chart-wrapper {
  height: 300px;
  padding: 16px;
}

.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

:deep(.vue-echarts) {
  width: 100% !important;
  height: 100% !important;
}
</style>

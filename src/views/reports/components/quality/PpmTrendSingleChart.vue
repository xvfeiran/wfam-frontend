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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { EChartsOption } from 'echarts'
import { Radio } from 'ant-design-vue'
import { qualityApi } from '@/services/reportQuality'
import { transformPpmTrendSingle } from '@/utils/transforms/quality/ppmTrendSingle'
import { useReportOptionsStore } from '@/stores/reportOptions'
import AdvancedFilterBar from '@/components/AdvancedFilterBar.vue'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

interface Props {
  bu: string
}

const props = defineProps<Props>()
const optionsStore = useReportOptionsStore()

// 默认时间范围：当年1月到当前月份
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const defaultDateRange: [string, string] = [
  `${currentYear}-01`,
  `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
]

// 为每个 BU 创建独立的筛选状态
const localFilters = ref({
  dateRange: defaultDateRange as [string, string] | null,
  platform: [] as string[],
  customer: [] as string[],
  bcso: [] as string[],
  faultMode: [] as string[],
  partNo: [] as string[],
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
    const params: PpmTrendParams = {
      bu: [props.bu],
      dateRange: defaultDateRange,
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
    dateRange: localFilters.value.dateRange,
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
      <h3 class="chart-title">
        <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        {{ bu }} - PPM / IPB 趋势
      </h3>
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
        :customer-options="optionsStore.customerOptions"
        :platform-options="optionsStore.platformOptions"
        :fault-mode-options="optionsStore.faultModeOptions"
        :part-no-options="optionsStore.partNoOptions"
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

  .chart-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;

    .title-icon {
      width: 20px;
      height: 20px;
      color: #10b981;
    }
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

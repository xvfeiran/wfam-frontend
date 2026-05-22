<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { Switch, Space } from 'ant-design-vue'
import type { EChartsOption } from 'echarts'
import { storeToRefs } from 'pinia'
import { useAnalysisStore } from '@/stores/reportAnalysis'
import { analysisApi } from '@/services/reportAnalysis'
import { transformReturnOrder } from '@/utils/transforms/analysis/returnOrder'
import type { ReturnOrderTransformResult } from '@/utils/transforms/analysis/returnOrder'

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const store = useAnalysisStore()
const { filters, previousYearRange } = storeToRefs(store)

const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const loading = ref(false)
const errorMsg = ref<string>('')

// 同比开关 - 纯本地状态，只控制图表是否显示去年数据，不影响请求
const yoyEnabled = ref(true)

const chartOption = ref<EChartsOption>({
  tooltip: { trigger: 'axis' },
  legend: { top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: [],
})

// 构建 API 请求参数
const requestParams = computed(() => ({
  dateRange: filters.value.returnOrderDateRange,
  customer: filters.value.returnOrderCustomer,
  bu: filters.value.returnOrderBu,
  productPlatform: filters.value.returnOrderPlatform,
  faultMode: filters.value.returnOrderFaultMode,
  partNo: filters.value.returnOrderPartNo,
  bcso: filters.value.returnOrderBcso,
}))

async function fetchData() {
  loading.value = true
  errorMsg.value = ''
  try {
    const params = requestParams.value

    // 始终请求去年数据，同比开关只控制图表是否显示
    const [currentRes, previousRes] = await Promise.all([
      analysisApi.getReturnOrderData(params),
      analysisApi.getReturnOrderData({ ...params, dateRange: previousYearRange.value }),
    ])

    const selectedYear = filters.value.analysisDurationYearRange[0] ?? new Date().getFullYear()

    // 存储转换后的数据，供 chartOption computed 使用
    rawData.value = transformReturnOrder(currentRes, previousRes, selectedYear)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : '数据加载失败'
  } finally {
    loading.value = false
  }
}

// 存储转换后的原始数据，独立于图表配置
const rawData = ref<ReturnOrderTransformResult | null>(null)

// chartOption 由 computed 生成，响应 yoyEnabled 变化
const computedChartOption = computed<EChartsOption>((): EChartsOption => {
  if (!rawData.value) return chartOption.value as EChartsOption

  const { xAxisData, series, previousYearSeries } = rawData.value

  const finalSeries: ChartSeries[] = [...series]

  // 同比去年数据 - 仅当开关开启时添加
  if (yoyEnabled.value && previousYearSeries) {
    finalSeries.push({
      ...previousYearSeries,
      itemStyle: { color: '#18f0ff' },
    })
  }

  // xAxisFinalData 在此处计算，不存储
  const xAxisFinalData = [...xAxisData, 'YTD']

  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: finalSeries.map((s) => s.name) },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: xAxisFinalData },
    yAxis: { type: 'value' },
    series: finalSeries,
  } as EChartsOption
})

// 监听筛选条件变化
watch(
  () => [
    filters.value.returnOrderDateRange,
    filters.value.returnOrderCustomer,
    filters.value.returnOrderBu,
    filters.value.returnOrderPlatform,
    filters.value.returnOrderFaultMode,
    filters.value.returnOrderPartNo,
    filters.value.returnOrderBcso,
    filters.value.analysisDurationYearRange,
  ],
  fetchData,
  { immediate: true },
)

const containerRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      chartRef.value?.resize()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  chartRef.value?.dispose()
})
</script>

<template>
  <div ref="containerRef" class="chart-wrapper">
    <!-- 图表控制栏 -->
    <div class="chart-controls">
      <Space>
        <Switch v-model:checked="yoyEnabled" size="small" />
        <span class="control-label">同比</span>
      </Space>
    </div>

    <div v-if="loading" class="chart-loading">加载中...</div>
    <div v-else-if="errorMsg" class="chart-error">{{ errorMsg }}</div>
    <v-chart
      v-else
      ref="chartRef"
      :option="computedChartOption"
      autoresize
      style="width: 100%; height: 320px"
    />
  </div>
</template>

<style scoped lang="less">
.chart-wrapper {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  min-height: 350px;
}

.chart-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;

  .control-label {
    font-size: 13px;
    color: #333;
    font-weight: 500;
  }
}

.chart-loading,
.chart-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320px;
  color: #999;
}
.chart-error {
  color: #ef4444;
}
</style>

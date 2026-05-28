<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { EChartsOption } from 'echarts'
import { storeToRefs } from 'pinia'
import { useAnalysisStore } from '@/stores/reportAnalysis'
import { analysisApi } from '@/services/reportAnalysis'
import { transformAnalysisDuration } from '@/utils/transforms/analysis/analysisDuration'

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const store = useAnalysisStore()
const { filters } = storeToRefs(store)

const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const loading = ref(false)

const chartOption = ref<EChartsOption>({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value', name: '天' },
  series: [],
})

async function fetchData() {
  loading.value = true
  try {
    const yearRange = filters.value.analysisDurationYearRange
    // 并行请求多个年份的数据
    const results = await Promise.all(
      yearRange.map((year) => analysisApi.getAnalysisDuration( year )),
    )

    // 每个年份的数据转换为 series
    const seriesData = yearRange.map((year, index) => {
      const { xAxisData: _xAxisData, series } = transformAnalysisDuration(results[index])
      return {
        year,
        series: {
          ...series[0],
          name: `${year}年`,
          data: series[0].data,
        },
      }
    })

    // X轴 BU 列表：从所有年份数据中动态提取
    const xAxisData = [...new Set(results.flat().map((d) => d.bu))]

    // 构建 series，每个年份一条柱子组
    const series = seriesData.map(({ year, series: s }) => ({
      ...s,
      name: `${year}年`,
      data: xAxisData.map((bu) => {
        const item = s.data.find((d) => d.name === bu)
        return item?.value ?? 0
      }),
    }))

    chartOption.value = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value', name: '天' },
      legend: {
        data: yearRange.map((y:unknown) => `${y}年`),
        bottom: 0,
      },
      series,
    }
  } finally {
    loading.value = false
  }
}

// 监听年份范围变化
watch(() => filters.value.analysisDurationYearRange, fetchData, { deep: true })

// ResizeObserver
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
</script>

<template>
  <div ref="containerRef" class="chart-wrapper">
    <div v-if="loading" class="chart-loading">数据加载中...</div>
    <v-chart v-else ref="chartRef" :option="chartOption" autoresize />
  </div>
</template>

<style scoped lang="less">
.chart-wrapper {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  height: 100%;
  min-height: 280px;
  display: flex;
  flex-direction: column;
}
.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #94a3b8;
  font-size: 14px;
}

:deep(.vue-echarts) {
  flex: 1;
  min-height: 200px;
}
</style>

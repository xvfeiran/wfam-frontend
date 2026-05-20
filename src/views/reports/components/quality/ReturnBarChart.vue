<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { EChartsOption } from 'echarts'
import { storeToRefs } from 'pinia'
import { useQualityStore } from '@/stores/reportQuality.ts'
import { qualityApi } from '@/services/reportQuality'
import { transformReturnBar } from '@/utils/transforms/quality/returnBar'

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent])

const store = useQualityStore()
const { filters } = storeToRefs(store)

const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const loading = ref(false)

const chartOption = ref<EChartsOption>({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: []
})

async function fetchData() {
  loading.value = true
  try {
    const params = {
      dateRange: filters.value.returnBarDateRange,
      customer: filters.value.returnBarCustomer,
      bu: filters.value.returnBarBu,
      productPlatform: filters.value.returnBarPlatform,
      faultMode: filters.value.returnBarFaultMode,
      partNo: filters.value.returnBarPartNo,
      bcso: filters.value.returnBarBcso,
      kilometerRange: filters.value.returnBarKilometer
    }
    const res = await qualityApi.getReturnBarData(params)
    const { xAxisData, series } = transformReturnBar(res)

    chartOption.value = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value' },
      series
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [
    filters.value.returnBarDateRange,
    filters.value.returnBarCustomer,
    filters.value.returnBarBu,
    filters.value.returnBarPlatform,
    filters.value.returnBarFaultMode,
    filters.value.returnBarPartNo,
    filters.value.returnBarBcso,
    filters.value.returnBarKilometer
  ],
  fetchData
)

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
    <div v-if="loading" class="chart-loading">加载中...</div>
    <v-chart v-else ref="chartRef" :option="chartOption" autoresize />
  </div>
</template>

<style scoped lang="less">
.chart-wrapper {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  height: 400px;
}
.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #999;
}

:deep(.vue-echarts) {
  width: 100% !important;
  height: 100% !important;
}
</style>

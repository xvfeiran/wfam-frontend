<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { TreemapChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ref, onMounted, onUnmounted } from 'vue'
import type { EChartsOption } from 'echarts'
import { qualityApi } from '@/services/reportQuality'
import { transformReturnTreemap } from '@/utils/transforms/quality/returnTreemap'

use([CanvasRenderer, TreemapChart, TitleComponent, TooltipComponent, LegendComponent])

const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const loading = ref(false)

const chartOption = ref<EChartsOption>({})

// 蓝色系配色 - 专业温和
const colorPalette = [
  '#3B82F6', // blue-500
  '#60A5FA', // blue-400
  '#2563EB', // blue-600
  '#93C5FD', // blue-300
  '#1D4ED8', // blue-700
  '#BFDBFE', // blue-200
  '#1E40AF', // blue-800
  '#DBEAFE', // blue-100
]

async function fetchData() {
  loading.value = true
  try {
    const res = await qualityApi.getReturnTreemap()
    const treemapData = transformReturnTreemap(res)

    chartOption.value = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const { name, value } = params
          return `${name}<br/>数量: ${value.toLocaleString()}`
        },
      },
      series: [
        {
          type: 'treemap',
          data: treemapData,
          leafDepth: 1,
          label: {
            show: true,
            position: 'inside',
            formatter: `{b} \n \n {@value}`,
            fontSize: 18,
          },
          upperLabel: {
            show: false,
          },
          breadcrumb: { show: true },
          color: colorPalette,
        },
      ],
    }
  } finally {
    loading.value = false
  }
}

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
  height: 100%;
  color: #999;
}
</style>

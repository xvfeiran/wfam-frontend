import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Ref } from 'vue'
import type { ChartDataItem, ProcessingTimeItem, TrendDataPoint } from '@/services/reportsApi'

export function useReportCharts(
  trendData: Ref<TrendDataPoint[]>,
  customerRankingData: Ref<ChartDataItem[]>,
  failureModeData: Ref<ChartDataItem[]>,
  buDistributionData: Ref<ChartDataItem[]>,
  processingTimeData: Ref<ProcessingTimeItem[]>,
) {
  const { t } = useI18n()

  const trendChartOption = computed(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: [t('reports.orders'), t('reports.parts')],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.map(d => d.date),
      axisLabel: {
        formatter: (value: string) => value.slice(5),
      },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: t('reports.orders'),
        type: 'line',
        smooth: true,
        data: trendData.value.map(d => d.orders),
        itemStyle: { color: '#1677ff' },
        areaStyle: { color: 'rgba(22, 119, 255, 0.1)' },
      },
      {
        name: t('reports.parts'),
        type: 'line',
        smooth: true,
        data: trendData.value.map(d => d.parts),
        itemStyle: { color: '#52c41a' },
        areaStyle: { color: 'rgba(82, 196, 26, 0.1)' },
      },
    ],
  }))

  const customerRankingOption = computed(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: customerRankingData.value.map(c => c.name).reverse(),
      axisLabel: { width: 60, overflow: 'truncate' },
    },
    series: [
      {
        type: 'bar',
        data: customerRankingData.value.map(c => c.value).reverse(),
        itemStyle: { color: '#1677ff' },
        label: { show: true, position: 'right' },
      },
    ],
  }))

  const processingTimeOption = computed(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: processingTimeData.value.map(d => d.stage),
    },
    yAxis: {
      type: 'value',
      name: t('reports.days'),
    },
    series: [
      {
        type: 'bar',
        data: processingTimeData.value.map(d => d.avgDays),
        itemStyle: { color: '#722ed1' },
        label: {
          show: true,
          position: 'top',
          formatter: `{c} ${t('reports.days')}`,
        },
      },
    ],
  }))

  const failureModeOption = computed(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: true, formatter: '{b}\n{d}%' },
        data: failureModeData.value.map((d, i) => ({
          ...d,
          itemStyle: {
            color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f'][i],
          },
        })),
      },
    ],
  }))

  const buDistributionOption = computed(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        center: ['60%', '50%'],
        data: buDistributionData.value.map((d, i) => ({
          ...d,
          itemStyle: {
            color: ['#1677ff', '#52c41a', '#722ed1', '#faad14'][i],
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: { formatter: '{b}: {d}%' },
      },
    ],
  }))

  const platformDistributionOption = computed(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['WSA', 'PCE', 'AHC', 'PLT4', 'PLT5'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        data: [85, 72, 58, 45, 32],
        itemStyle: { color: '#52c41a' },
        label: { show: true, position: 'top' },
      },
    ],
  }))

  return {
    trendChartOption,
    customerRankingOption,
    processingTimeOption,
    failureModeOption,
    buDistributionOption,
    platformDistributionOption,
  }
}

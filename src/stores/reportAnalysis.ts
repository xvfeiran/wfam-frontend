import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export interface AnalysisFilters {
  // 分析时长图年份筛选（支持多选）
  analysisDurationYearRange: number[]
  // 平均抽样比例年份筛选
  samplingRatioYear: number
  // 售后件柱状图筛选条件
  returnOrderDateRange: [string, string] | null
  returnOrderCustomer: string[] | null
  returnOrderBu: string[] | null
  returnOrderPlatform: string[] | null
  returnOrderFaultMode: string[] | null
  returnOrderPartNo: string[] | null
  returnOrderBcso: string[] | null
}

export const useAnalysisStore = defineStore('analysis', () => {
  // 筛选状态
  const filters = ref<AnalysisFilters>({
    analysisDurationYearRange: [dayjs().year()],
    samplingRatioYear: dayjs().year(),
    returnOrderDateRange: [dayjs().startOf('year').format('YYYY-MM'), dayjs().format('YYYY-MM')],
    returnOrderCustomer: null,
    returnOrderBu: null,
    returnOrderPlatform: null,
    returnOrderFaultMode: null,
    returnOrderPartNo: null,
    returnOrderBcso: null,
  })

  // 计算属性：当前年份范围（基于分析时长图选择的首个年份，用于售后件柱状图）
  const currentYearRange = computed<[string, string]>(() => {
    const dateRange = filters.value.returnOrderDateRange
    const year = dateRange?.[0] ? dayjs(dateRange[0]).year() : dayjs().year()
    return [`${year}-01`, `${year}-12`]
  })

  // 计算属性：去年年份范围（用于 YoY）
  const previousYearRange = computed<[string, string]>(() => {
    const dateRange = filters.value.returnOrderDateRange
    const year = dateRange?.[0] ? dayjs(dateRange[0]).year() - 1 : dayjs().year() - 1
    return [`${year}-01`, `${year}-12`]
  })

  // 设置筛选值
  function setFilter<K extends keyof AnalysisFilters>(key: K, value: AnalysisFilters[K]) {
    filters.value[key] = value
  }

  // 重置筛选条件
  function resetFilters() {
    filters.value = {
      analysisDurationYearRange: [dayjs().year()],
      samplingRatioYear: dayjs().year(),
      returnOrderDateRange: null,
      returnOrderCustomer: null,
      returnOrderBu: null,
      returnOrderPlatform: null,
      returnOrderFaultMode: null,
      returnOrderPartNo: null,
      returnOrderBcso: null,
    }
  }

  return {
    filters,
    currentYearRange,
    previousYearRange,
    setFilter,
    resetFilters
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import dayjs from 'dayjs'

export interface QualityFilters {
  // 售后件柱状图筛选条件（生产日期）
  returnBarDateRange: [string, string] | null
  returnBarCustomer: string[] | null
  returnBarBu: string[] | null
  returnBarPlatform: string[] | null
  returnBarFaultMode: string[] | null
  returnBarPartNo: string[] | null
  returnBarBcso: string[] | null
  returnBarKilometer: KilometerRange[] | null

  // PPM/IPB 折线图筛选条件
  ppmDateRange: [string, string] | null
  ppmPlatform: string[] | null
  ppmCustomer: string[] | null
  ppmFaultMode: string[] | null
  ppmPartNo: string[] | null
  ppmBcso: string[] | null
  ppmMis: MisPeriod[] | null
  ppmMetricType: 'ppm' | 'ipb'
}

export const useQualityStore = defineStore('quality', () => {
  // 筛选状态
  const filters = ref<QualityFilters>({
    // 售后件柱状图（默认 YTD 时间范围）
    returnBarDateRange: [dayjs.tz().startOf('year').format('YYYY-MM-DD'), dayjs.tz().format('YYYY-MM-DD')],
    returnBarCustomer: null,
    returnBarBu: null,
    returnBarPlatform: null,
    returnBarFaultMode: null,
    returnBarPartNo: null,
    returnBarBcso: null,
    returnBarKilometer: null,

    // PPM/IPB 折线图（默认 YTD 时间范围）
    ppmDateRange: [dayjs.tz().startOf('year').format('YYYY-MM-DD'), dayjs.tz().format('YYYY-MM-DD')],
    ppmPlatform: null,
    ppmCustomer: null,
    ppmFaultMode: null,
    ppmPartNo: null,
    ppmBcso: null,
    ppmMis: null,
    ppmMetricType: 'ppm'
  })

  // 设置筛选值
  function setFilter<K extends keyof QualityFilters>(key: K, value: QualityFilters[K]) {
    filters.value[key] = value
  }

  // 重置筛选条件
  function resetFilters() {
    filters.value = {
      returnBarDateRange: [dayjs.tz().startOf('year').format('YYYY-MM-DD'), dayjs.tz().format('YYYY-MM-DD')],
      returnBarCustomer: null,
      returnBarBu: null,
      returnBarPlatform: null,
      returnBarFaultMode: null,
      returnBarPartNo: null,
      returnBarBcso: null,
      returnBarKilometer: null,
      ppmDateRange: [dayjs.tz().startOf('year').format('YYYY-MM-DD'), dayjs.tz().format('YYYY-MM-DD')],
      ppmPlatform: null,
      ppmCustomer: null,
      ppmFaultMode: null,
      ppmPartNo: null,
      ppmBcso: null,
      ppmMis: null,
      ppmMetricType: 'ppm'
    }
  }

  return {
    filters,
    setFilter,
    resetFilters
  }
})

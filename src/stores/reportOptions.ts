import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { optionsApi } from '@/services/reportOptions'
import type { PartNoItem } from '@/services/reportOptions'
import { BCSO_LIST, MIS_PERIODS, KILOMETER_RANGES } from '@/constants/reports'

export const useReportOptionsStore = defineStore('reportOptions', () => {
  // ---- 动态数据（从接口获取） ----
  const customers = ref<string[]>([])
  const businessUnits = ref<string[]>([])
  const productPlatforms = ref<string[]>([])
  const failureTypes = ref<string[]>([])
  const partNos = ref<PartNoItem[]>([])

  const loading = ref(false)
  const loaded = ref(false)

  // ---- 常量（来自 constants/reports.ts） ----
  const bcsoList = BCSO_LIST
  const misPeriods = MIS_PERIODS
  const kilometerRanges = KILOMETER_RANGES

  // ---- 计算属性：转为 Select 组件需要的 { label, value } 格式 ----
  const customerOptions = computed(() => customers.value.map((v) => ({ label: v, value: v })))
  const buOptions = computed(() => businessUnits.value.map((v) => ({ label: v, value: v })))
  const platformOptions = computed(() => productPlatforms.value.map((v) => ({ label: v, value: v })))
  const faultModeOptions = computed(() => failureTypes.value.map((v) => ({ label: v, value: v })))
  const partNoOptions = computed(() => partNos.value.map((p) => ({ label: p.partCode, value: p.partCode })))
  const bcsoOptions = computed(() => bcsoList.map((v) => ({ label: v, value: v })))
  const misOptions = computed(() => misPeriods.map((v) => ({ label: v, value: v })))
  const kilometerOptions = computed(() => kilometerRanges.map((v) => ({ label: v, value: v })))

  // ---- 方法 ----
  async function fetchOptions() {
    if (loaded.value) return
    loading.value = true
    try {
      const [allOpts, partNoRes] = await Promise.all([
        optionsApi.getAllOptions(),
        optionsApi.getPartNoOptions({ page: 0, size: 100 }),
      ])

      console.log(allOpts)
      console.log(partNoRes)
      console.log('=========================')
      customers.value = allOpts.customers ?? []
      businessUnits.value = allOpts.businessUnits ?? []
      productPlatforms.value = allOpts.productPlatforms ?? []
      failureTypes.value = allOpts.failureTypes ?? []
      partNos.value = partNoRes.data ?? []
      loaded.value = true
    } catch (e) {
      console.error('Failed to load report options:', e)
    } finally {
      loading.value = false
    }
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  async function searchPartNos(keyword: string) {
    if (searchTimer) clearTimeout(searchTimer)
    return new Promise<void>((resolve) => {
      searchTimer = setTimeout(async () => {
        try {
          const res = await optionsApi.getPartNoOptions({ page: 0, size: 100, partCode: keyword })
          partNos.value = res.data ?? []
        } catch (e) {
          console.error('Failed to search part numbers:', e)
        }
        resolve()
      }, 300)
    })
  }

  return {
    // 原始数据
    customers,
    businessUnits,
    productPlatforms,
    failureTypes,
    partNos,
    // Select 选项格式
    customerOptions,
    buOptions,
    platformOptions,
    faultModeOptions,
    partNoOptions,
    bcsoOptions,
    misOptions,
    kilometerOptions,
    // 常量
    bcsoList,
    misPeriods,
    kilometerRanges,
    // 状态 & 方法
    loading,
    loaded,
    fetchOptions,
    searchPartNos,
  }
})

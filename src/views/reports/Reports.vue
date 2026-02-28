<template>
  <div class="reports-page">
    <a-page-header :title="t('reports.title')" />

    <!-- 条件与维度区（可展开） -->
    <a-collapse v-model:activeKey="filterPanelKey" class="filter-collapse">
      <a-collapse-panel key="filter" :header="t('reports.conditionAndDimension')">
        <a-form :model="filters">
          <!-- 条件区 -->
          <a-divider orientation="left">{{ t('reports.filterConditions') }}</a-divider>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item :label="t('reports.productionDate')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                <a-range-picker v-model:value="filters.productionDateRange" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item :label="t('reports.misPeriod')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                <a-select v-model:value="filters.misPeriod" :placeholder="t('validation.pleaseSelect')" allowClear>
                  <a-select-option value="MIS1">MIS1 (1{{ t('reports.month') }})</a-select-option>
                  <a-select-option value="MIS3">MIS3 (3{{ t('reports.month') }})</a-select-option>
                  <a-select-option value="MIS6">MIS6 (6{{ t('reports.month') }})</a-select-option>
                  <a-select-option value="MIS12">MIS12 (12{{ t('reports.month') }})</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item :label="t('reports.customer')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                <a-select
                  v-model:value="filters.customers"
                  mode="multiple"
                  :placeholder="t('validation.selectCustomer')"
                  allowClear
                  :max-tag-count="2"
                >
                  <a-select-option v-for="c in customerOptions" :key="c" :value="c">{{ c }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item :label="t('reports.bu')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                <a-select
                  v-model:value="filters.businessUnits"
                  mode="multiple"
                  :placeholder="t('validation.pleaseSelect')"
                  allowClear
                  :max-tag-count="2"
                >
                  <a-select-option v-for="bu in buOptions" :key="bu" :value="bu">{{ bu }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item :label="t('reports.productPlatform')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                <a-select
                  v-model:value="filters.productPlatforms"
                  mode="multiple"
                  :placeholder="t('validation.selectProductPlatform')"
                  allowClear
                  :max-tag-count="2"
                >
                  <a-select-option v-for="pp in productPlatformOptions" :key="pp" :value="pp">{{ pp }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item :label="t('reports.failureMode')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                <a-select
                  v-model:value="filters.failureModes"
                  mode="multiple"
                  :placeholder="t('validation.selectFailureType')"
                  allowClear
                  :max-tag-count="2"
                >
                  <a-select-option v-for="fm in failureModeOptions" :key="fm" :value="fm">{{ fm }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item :label="t('reports.responsibility')" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                <a-select
                  v-model:value="filters.responsibilities"
                  mode="multiple"
                  :placeholder="t('validation.pleaseSelect')"
                  allowClear
                  :max-tag-count="2"
                >
                  <a-select-option v-for="r in responsibilityOptions" :key="r.value" :value="r.value">
                    {{ t(`reports.responsibility${r.value}`) }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 维度区 -->
          <a-divider orientation="left">{{ t('reports.analysisDimensions') }}</a-divider>
          <a-row :gutter="24">
            <a-col :span="8">
              <a-form-item :label="t('reports.primaryDimension')">
                <a-select
                  v-model:value="primaryDimension"
                  :placeholder="t('reports.selectPrimaryDimension')"
                  allowClear
                  style="width: 100%"
                >
                  <a-select-option
                    v-for="opt in dimensionOptions"
                    :key="opt.value"
                    :value="opt.value"
                    :disabled="opt.value === secondaryDimension"
                  >
                    {{ opt.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="t('reports.secondaryDimension')">
                <a-select
                  v-model:value="secondaryDimension"
                  :placeholder="t('reports.selectSecondaryDimension')"
                  allowClear
                  style="width: 100%"
                >
                  <a-select-option
                    v-for="opt in dimensionOptions"
                    :key="opt.value"
                    :value="opt.value"
                    :disabled="opt.value === primaryDimension"
                  >
                    {{ opt.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <div class="dimension-hint">
                <a-tag v-if="primaryDimension" color="blue">{{ t('reports.primary') }}: {{ getDimensionLabel(primaryDimension) }}</a-tag>
                <a-tag v-if="secondaryDimension" color="green">{{ t('reports.secondary') }}: {{ getDimensionLabel(secondaryDimension) }}</a-tag>
                <span v-if="!primaryDimension && !secondaryDimension" class="no-dimension">{{ t('reports.noDimension') }}</span>
              </div>
            </a-col>
          </a-row>

          <!-- 操作按钮 -->
          <a-row>
            <a-col :span="24" class="filter-buttons">
              <a-space>
                <a-button type="primary" @click="handleSearch">
                  <SearchOutlined /> {{ t('common.search') }}
                </a-button>
                <a-button @click="handleReset">
                  <ReloadOutlined /> {{ t('common.reset') }}
                </a-button>
              </a-space>
            </a-col>
          </a-row>
        </a-form>
      </a-collapse-panel>
    </a-collapse>

    <!-- 图表区 -->
    <a-card :title="t('reports.charts')" class="section-card">
      <a-row :gutter="16" class="chart-row">
        <!-- 趋势图 -->
        <a-col :span="16">
          <a-card :title="t('reports.trendAnalysis')">
            <template #extra>
              <a-radio-group v-model:value="trendTimeRange" size="small">
                <a-radio-button value="week">{{ t('reports.week') }}</a-radio-button>
                <a-radio-button value="month">{{ t('reports.month') }}</a-radio-button>
                <a-radio-button value="quarter">{{ t('reports.quarter') }}</a-radio-button>
                <a-radio-button value="year">{{ t('reports.year') }}</a-radio-button>
              </a-radio-group>
            </template>
            <div class="chart-container">
              <v-chart :option="trendChartOption" autoresize />
            </div>
          </a-card>
        </a-col>

        <!-- 客户排名 -->
        <a-col :span="8">
          <a-card :title="t('reports.customerRanking')">
            <div class="chart-container">
              <v-chart :option="customerRankingOption" autoresize />
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" class="chart-row">
        <!-- 处理时效 -->
        <a-col :span="12">
          <a-card :title="t('reports.processingTime')">
            <div class="chart-container">
              <v-chart :option="processingTimeOption" autoresize />
            </div>
          </a-card>
        </a-col>

        <!-- 失效模式分布 -->
        <a-col :span="12">
          <a-card :title="t('reports.failureModeDistribution')">
            <div class="chart-container">
              <v-chart :option="failureModeOption" autoresize />
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" class="chart-row">
        <!-- 业务单元分布 -->
        <a-col :span="12">
          <a-card :title="t('reports.buDistribution')">
            <div class="chart-container">
              <v-chart :option="buDistributionOption" autoresize />
            </div>
          </a-card>
        </a-col>

        <!-- 产品平台分布 -->
        <a-col :span="12">
          <a-card :title="t('reports.platformDistribution')">
            <div class="chart-container">
              <v-chart :option="platformDistributionOption" autoresize />
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <!-- 底部导出按钮 -->
    <div class="export-section">
      <a-button type="primary" size="large" @click="handleExport">
        <DownloadOutlined /> {{ t('reports.dataExport') }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import VChart from 'vue-echarts'
import { message } from 'ant-design-vue'
import { SearchOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { reportsApi } from '@/services/reportsApi'
import { lookupApi } from '@/services/lookupApi'
import type { ChartDataItem, ProcessingTimeItem, TrendDataPoint } from '@/services/reportsApi'
import { useReportCharts } from '@/composables/useReportCharts'

const { t } = useI18n()

// 筛选选项
const customerOptions = ref<string[]>([])
const buOptions = ref(['WS', 'IB', 'CA'])
const productPlatformOptions = ref(['WSA', 'PCE', 'AHC', 'PLT4', 'PLT5'])
const failureModeOptions = ref(['噪音', '断裂', '变形', '异响', '渗漏'])
const responsibilityOptions = computed(() => [
  { value: 'Bosch', label: t('reports.responsibilityBosch') },
  { value: 'Customer', label: t('reports.responsibilityCustomer') },
  { value: 'Supplier', label: t('reports.responsibilitySupplier') },
  { value: 'Other', label: t('reports.responsibilityOther') },
])

// 维度选项
const dimensionOptions = computed(() => [
  { label: t('reports.misPeriod'), value: 'misPeriod' },
  { label: t('reports.customer'), value: 'customer' },
  { label: t('reports.bu'), value: 'businessUnit' },
  { label: t('reports.productPlatform'), value: 'productPlatform' },
  { label: t('reports.failureMode'), value: 'failureMode' },
  { label: t('reports.responsibility'), value: 'responsibility' },
  { label: t('reports.period') || '周期', value: 'period' },
])

const primaryDimension = ref<string | undefined>(undefined)
const secondaryDimension = ref<string | undefined>(undefined)
const trendTimeRange = ref('month')
const filterPanelKey = ref<string[]>([])

// 获取维度标签
const getDimensionLabel = (value: string) => {
  const opt = dimensionOptions.value.find(o => o.value === value)
  return opt?.label || value
}

// 筛选条件
const filters = reactive({
  productionDateRange: null as any,
  misPeriod: undefined as string | undefined,
  customers: [] as string[],
  businessUnits: [] as string[],
  productPlatforms: [] as string[],
  failureModes: [] as string[],
  responsibilities: [] as string[],
})

const trendData = ref<TrendDataPoint[]>([])
const customerRankingData = ref<ChartDataItem[]>([])
const failureModeData = ref<ChartDataItem[]>([])
const buDistributionData = ref<ChartDataItem[]>([])
const processingTimeData = ref<ProcessingTimeItem[]>([])

const {
  trendChartOption,
  customerRankingOption,
  processingTimeOption,
  failureModeOption,
  buDistributionOption,
  platformDistributionOption,
} = useReportCharts(trendData, customerRankingData, failureModeData, buDistributionData, processingTimeData)

onMounted(async () => {
  const [lookups, trend, ranking, failureMode, buDist, procTime] = await Promise.all([
    lookupApi.getAll(),
    reportsApi.getTrend(30),
    reportsApi.getCustomerRanking(),
    reportsApi.getFailureModeDistribution(),
    reportsApi.getBuDistribution(),
    reportsApi.getProcessingTime(),
  ])
  customerOptions.value = lookups.customers
  trendData.value = trend
  customerRankingData.value = ranking
  failureModeData.value = failureMode
  buDistributionData.value = buDist
  processingTimeData.value = procTime
})

const handleSearch = () => {
  message.success(t('message.searchComplete'))
}

const handleReset = () => {
  filters.productionDateRange = null
  filters.misPeriod = undefined
  filters.customers = []
  filters.businessUnits = []
  filters.productPlatforms = []
  filters.failureModes = []
  filters.responsibilities = []
  primaryDimension.value = undefined
  secondaryDimension.value = undefined
  message.success(t('message.resetComplete'))
}

const handleExport = () => {
  message.success(t('message.exportSuccess'))
}
</script>

<style lang="less" scoped>
.reports-page {
  padding: 24px;

  .filter-collapse {
    margin-bottom: 16px;
    background: #fff;

    :deep(.ant-collapse-content-box) {
      padding: 16px 24px;
    }
  }

  .section-card {
    margin-bottom: 16px;
  }

  .filter-buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }

  .dimension-hint {
    display: flex;
    align-items: center;
    height: 32px;
    gap: 8px;

    .no-dimension {
      color: #999;
      font-size: 14px;
    }
  }

  .chart-row {
    margin-bottom: 16px;

    .chart-container {
      height: 300px;
    }
  }

  .export-section {
    margin-top: 24px;
    padding: 24px;
    background: #fff;
    text-align: center;
    border-radius: 4px;
  }
}
</style>

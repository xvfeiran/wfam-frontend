<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Row, Col, Select } from 'ant-design-vue'
import dayjs from 'dayjs'
import AnalysisDurationChart from './components/analysis/AnalysisDurationChart.vue'
import SamplingRatioCard from './components/analysis/SamplingRatioCard.vue'
import ReturnOrderBarChart from './components/analysis/ReturnOrderBarChart.vue'
import AdvancedFilterBar from '@/components/AdvancedFilterBar.vue'
import type { FilterValues } from '@/components/AdvancedFilterBar.vue'
import { storeToRefs } from 'pinia'
import { useAnalysisStore } from '@/stores/reportAnalysis'
import { optionsApi } from '@/services/reportOptions'

const store = useAnalysisStore()
const { filters } = storeToRefs(store)

// 页面加载动画状态
const isLoaded = ref(false)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

// 分析时长图年份筛选（多选）
const analysisDurationYearOptions = [
  { label: '2024', value: 2024 },
  { label: '2025', value: 2025 },
  { label: '2026', value: 2026 },
]

const pendingAnalysisDurationYears = ref<number[]>([...filters.value.analysisDurationYearRange])

// 售后件柱状图默认时间范围：当前年1月 ~ 当前月
const returnOrderInitialValues = ref<Partial<FilterValues>>({
  dateRange: [dayjs().startOf('year').format('YYYY-MM'), dayjs().format('YYYY-MM')],
})

// 加载筛选选项
const customerOptions = ref<{ label: string; value: string }[]>([])
const platformOptions = ref<{ label: string; value: string }[]>([])

onMounted(async () => {
  try {
    const [customers, platforms] = await Promise.all([
      optionsApi.getCustomerOptions(),
      optionsApi.getPlatformOptions(),
    ])
    customerOptions.value = customers.map((c) => ({ label: c.label, value: c.value }))
    platformOptions.value = platforms.map((p) => ({ label: p.label, value: p.value }))
  } catch (e) {
    console.error('Failed to load filter options:', e)
  }
})


function handleSearch(values: any) {
  store.setFilter('returnOrderCustomer', values.customer ?? null)
  store.setFilter('returnOrderBu', values.bu ?? null)
  store.setFilter('returnOrderBcso', values.bcso ?? null)
  store.setFilter('returnOrderPlatform', values.platform ?? null)
  store.setFilter('returnOrderFaultMode', values.faultMode ?? null)
  store.setFilter('returnOrderPartNo', values.partNo ?? null)
  store.setFilter('returnOrderDateRange', values.dateRange ?? null)
}

// 分析时长图年份筛选变化
function handleAnalysisDurationYearChange(values: number[]) {
  store.setFilter('analysisDurationYearRange', values)
}

function handleReset() {
  store.resetFilters()
}
</script>

<template>
  <div class="analysis-dashboard" :class="{ 'is-loaded': isLoaded }">
    <!-- 背景网格纹理 -->
    <div class="bg-grid"></div>

    <!-- 页面头部 -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="title-group">
          <h1 class="page-title">
            <svg
              class="title-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            分析模块
          </h1>
          <p class="page-subtitle">After-Sales Analysis Dashboard</p>
        </div>
        <div class="header-actions"></div>
      </div>
    </header>

    <!-- 核心指标卡片组 -->
    <section class="metrics-section">
      <div class="section-label">
        <span class="label-line"></span>
        <span class="label-text">核心指标</span>
      </div>
      <Row :gutter="[24, 24]" align="stretch">
        <Col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" style="display: flex">
          <div class="chart-card chart-card--primary" style="flex: 1">
            <div class="card-glow"></div>
            <div class="card-inner">
              <div class="card-header">
                <h3 class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  售后件分析时长
                </h3>
                <span class="card-badge">年度累计</span>
              </div>
              <div class="duration-filter-bar">
                <span class="filter-label">时间范围：</span>
                <Select
                  v-model:value="pendingAnalysisDurationYears"
                  mode="multiple"
                  placeholder="请选择年份"
                  :options="analysisDurationYearOptions"
                  style="min-width: 200px"
                  @change="handleAnalysisDurationYearChange"
                />
              </div>
              <AnalysisDurationChart />
            </div>
          </div>
        </Col>
        <Col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" style="display: flex">
          <div class="chart-card chart-card--secondary" style="flex: 1">
            <div class="card-glow"></div>
            <div class="card-inner">
              <div class="card-header">
                <h3 class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                    />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  平均抽样比例
                </h3>
                <span class="card-badge">BU 分组</span>
              </div>
              <SamplingRatioCard />
            </div>
          </div>
        </Col>
      </Row>
    </section>

    <!-- 售后件柱状图 -->
    <section class="chart-section">
      <div class="section-label">
        <span class="label-line"></span>
        <span class="label-text">售后件分析</span>
      </div>
      <div class="chart-card chart-card--full">
        <div class="card-glow"></div>
        <div class="card-inner">
          <div class="card-header">
            <h3 class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              售后件柱状图
            </h3>
          </div>
          <div class="card-filter">
            <AdvancedFilterBar
              :visible-filters="{
                dateRange: true,
                customer: true,
                bu: true,
                platform: true,
                faultMode: true,
                partNo: true,
                bcso: true
              }"
              :initial-values="returnOrderInitialValues"
              :customer-options="customerOptions"
              :platform-options="platformOptions"
              @search="handleSearch"
              @reset="handleReset"
            />
          </div>
          <div class="chart-container">
            <ReturnOrderBarChart />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="less">
// =============================================
// 浅色系专业企业主题 - Analysis Dashboard
// =============================================

// 主题色彩变量
@bg-page: #f5f7fa;
@bg-card: #ffffff;
@bg-card-hover: #fafbfc;
@accent-primary: #2563eb;
@accent-primary-light: #3b82f6;
@accent-secondary: #0ea5e9;
@accent-success: #10b981;
@accent-warning: #f59e0b;
@accent-danger: #ef4444;
@text-primary: #1e293b;
@text-secondary: #64748b;
@text-muted: #94a3b8;
@border-color: #e2e8f0;
@shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
@shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
@shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
@shadow-primary: 0 4px 16px rgba(37, 99, 235, 0.15);

.analysis-dashboard {
  position: relative;
  min-height: 100vh;
  background: @bg-page;
  padding: 32px;
  overflow-x: hidden;

  // 页面头部
  .dashboard-header {
    position: relative;
    z-index: 1;
    margin-bottom: 40px;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .title-group {
      .page-title {
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 0 0 6px 0;
        font-size: 30px;
        font-weight: 700;
        color: @text-primary;
        letter-spacing: -0.5px;

        .title-icon {
          width: 34px;
          height: 34px;
          padding: 6px;
          background: linear-gradient(135deg, @accent-primary 0%, @accent-secondary 100%);
          border-radius: 10px;
          color: #ffffff;
          box-shadow: @shadow-primary;
        }
      }

      .page-subtitle {
        margin: 0;
        font-size: 13px;
        color: @text-muted;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        font-weight: 500;
      }
    }

    .header-actions {
      .time-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: @bg-card;
        border: 1px solid @border-color;
        border-radius: 10px;
        color: @text-secondary;
        font-size: 13px;
        font-weight: 500;
        box-shadow: @shadow-sm;

        svg {
          width: 16px;
          height: 16px;
          color: @accent-primary;
        }
      }
    }
  }

  // 加载动画
  &.is-loaded {
    .dashboard-header {
      opacity: 1;
      transform: translateY(0);
    }

    .metrics-section {
      opacity: 1;
      transform: translateY(0);
    }

    .chart-section {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 区域标签
  .section-label {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    .label-line {
      width: 36px;
      height: 3px;
      background: linear-gradient(90deg, @accent-primary, @accent-secondary);
      border-radius: 2px;
    }

    .label-text {
      font-size: 12px;
      font-weight: 600;
      color: @text-muted;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
  }

  // 指标区域
  .metrics-section {
    position: relative;
    z-index: 1;
    margin-bottom: 40px;
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
  }

  // 图表区域
  .chart-section {
    position: relative;
    z-index: 1;
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
  }

  // 通用图表卡片
  .chart-card {
    position: relative;
    background: @bg-card;
    border: 1px solid @border-color;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: @shadow-sm;

    .card-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, @accent-primary, @accent-secondary);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .card-inner {
      position: relative;
      z-index: 1;
      padding: 24px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
      flex-shrink: 0;

      .card-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: @text-primary;

        svg {
          width: 20px;
          height: 20px;
          color: @accent-primary;
        }
      }

      .card-badge {
        padding: 5px 12px;
        background: rgba(37, 99, 235, 0.08);
        border: 1px solid rgba(37, 99, 235, 0.15);
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        color: @accent-primary;
        letter-spacing: 0.5px;
      }
    }

    .card-filter {
      margin-bottom: 16px;
    }

    // 卡片悬停效果
    &:hover {
      background: @bg-card-hover;
      border-color: rgba(37, 99, 235, 0.2);
      transform: translateY(-3px);
      box-shadow:
        @shadow-lg,
        0 0 0 1px rgba(37, 99, 235, 0.05);

      .card-glow {
        opacity: 1;
      }
    }

    // 全宽卡片
    &--full {
      .chart-container {
        margin-top: 16px;
      }
    }

    // 全宽卡片
    &--full {
      .chart-container {
        margin-top: 16px;
      }
    }

    // 主色调卡片
    &--primary {
      .card-glow {
        background: linear-gradient(90deg, @accent-primary, @accent-secondary);
      }
      .card-title svg {
        color: @accent-primary;
      }
    }

    // 副色调卡片
    &--secondary {
      .card-glow {
        background: linear-gradient(90deg, @accent-secondary, @accent-success);
      }
      .card-title svg {
        color: @accent-secondary;
      }
      .card-badge {
        background: rgba(14, 165, 233, 0.08);
        border-color: rgba(14, 165, 233, 0.15);
        color: @accent-secondary;
      }
    }
  }

  // 分析时长图筛选栏
  .duration-filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid @border-color;

    .filter-label {
      font-size: 13px;
      font-weight: 500;
      color: @text-secondary;
      white-space: nowrap;
    }

    :deep(.ant-select) {
      .ant-select-selector {
        border-radius: 6px;
      }
    }
  }

  // 卡片控制区
  .card-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    .toggle-group {
      display: flex;
      gap: 12px;

      :deep(.ant-checkbox-wrapper) {
        color: @text-secondary;
        font-size: 13px;
        font-weight: 500;

        &:hover {
          color: @accent-primary;
        }
      }
    }

    .btn-reset {
      background: @bg-card;
      border-color: @border-color;
      color: @text-secondary;
      font-weight: 500;

      &:hover {
        background: #f8fafc;
        border-color: @accent-primary;
        color: @accent-primary;
      }
    }

    .btn-search {
      background: linear-gradient(135deg, @accent-primary 0%, @accent-primary-light 100%);
      border: none;
      box-shadow: @shadow-primary;
      font-weight: 500;

      &:hover {
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.25);
        transform: translateY(-1px);
      }
    }
  }

  .chart-container {
    min-height: 350px;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .analysis-dashboard {
    padding: 16px;

    .dashboard-header {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .page-title {
        font-size: 24px;

        .title-icon {
          width: 28px;
          height: 28px;
        }
      }
    }

    .chart-card {
      .card-inner {
        padding: 16px;
      }

      .card-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .card-controls {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }
    }
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Row, Col } from 'ant-design-vue'
import ReturnQuantityCard from './components/quality/ReturnQuantityCard.vue'
import ReturnTreemapChart from './components/quality/ReturnTreemapChart.vue'
import ReturnBarChart from './components/quality/ReturnBarChart.vue'
import PpmTrendLineChart from './components/quality/PpmTrendLineChart.vue'
import AdvancedFilterBar from '@/components/AdvancedFilterBar.vue'
import { storeToRefs } from 'pinia'
import { useQualityStore } from '@/stores/reportQuality'
import { useReportOptionsStore } from '@/stores/reportOptions'
import type { KilometerRange } from '@/constants/reports'

const store = useQualityStore()
const { filters } = storeToRefs(store)
const optionsStore = useReportOptionsStore()

// 页面加载动画状态
const isLoaded = ref(false)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
  optionsStore.fetchOptions()
})
</script>

<template>
  <div class="quality-dashboard" :class="{ 'is-loaded': isLoaded }">
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            质量模块
          </h1>
          <p class="page-subtitle">Quality Assurance Dashboard</p>
        </div>
        <div class="header-actions"></div>
      </div>
    </header>

    <!-- 概览指标 -->
    <section class="overview-section">
      <div class="section-label">
        <span class="label-line"></span>
        <span class="label-text">概览</span>
      </div>
      <Row :gutter="[24, 24]">
        <!-- 售后件总数 -->
        <Col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
          <ReturnQuantityCard />
        </Col>

        <!-- 矩形树图 -->
        <Col :xs="24" :sm="24" :md="18" :lg="18" :xl="18">
          <div class="chart-card chart-card--treemap">
            <div class="card-glow"></div>
            <div class="card-inner">
              <div class="card-header">
                <h3 class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  售后件分布
                </h3>
              </div>
              <div class="chart-container">
                <ReturnTreemapChart />
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </section>

    <!-- 售后件柱状图 -->
    <section class="chart-section">
      <div class="section-label">
        <span class="label-line"></span>
        <span class="label-text">售后件趋势</span>
      </div>
      <div class="chart-card chart-card--full">
        <div class="card-glow"></div>
        <div class="card-inner">
          <div class="card-header">
            <h3 class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
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
                bcso: true,
                platform: true,
                mileage: true,
                faultMode: true,
                partNo: true,
              }"
              :customer-options="optionsStore.customerOptions"
              :bu-options="optionsStore.buOptions"
              :platform-options="optionsStore.platformOptions"
              :fault-mode-options="optionsStore.faultModeOptions"
              :part-no-options="optionsStore.partNoOptions"
              :bcso-options="optionsStore.bcsoOptions"
              :mileage-options="optionsStore.kilometerOptions"
              :initial-values="{
                dateRange: filters.returnBarDateRange,
                customer: filters.returnBarCustomer ?? [],
                bu: filters.returnBarBu ?? [],
                bcso: filters.returnBarBcso ?? [],
                platform: filters.returnBarPlatform ?? [],
                mileage: filters.returnBarKilometer ?? [],
                faultMode: filters.returnBarFaultMode ?? [],
                partNo: filters.returnBarPartNo ?? [],
              }"
              @search="
                (val) => {
                  store.setFilter('returnBarDateRange', val.dateRange ?? null)
                  store.setFilter('returnBarCustomer', val.customer ?? null)
                  store.setFilter('returnBarBu', val.bu ?? null)
                  store.setFilter('returnBarBcso', val.bcso ?? null)
                  store.setFilter('returnBarPlatform', val.platform ?? null)
                  store.setFilter('returnBarKilometer', (val.mileage ?? null) as KilometerRange[] | null)
                  store.setFilter('returnBarFaultMode', val.faultMode ?? null)
                  store.setFilter('returnBarPartNo', val.partNo ?? null)
                }
              "
            />
          </div>
          <div class="chart-container">
            <ReturnBarChart />
          </div>
        </div>
      </div>
    </section>

    <!-- PPM/IPB 折线图 -->
    <section class="chart-section">
      <div class="section-label">
        <span class="label-line label-line--green"></span>
        <span class="label-text">质量趋势</span>
      </div>
      <PpmTrendLineChart :bu-list="optionsStore.businessUnits" />
    </section>
  </div>
</template>

<style scoped lang="less">
// =============================================
// 浅色系专业企业主题 - Quality Dashboard
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
@shadow-success: 0 4px 16px rgba(16, 185, 129, 0.15);

.quality-dashboard {
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
          background: linear-gradient(135deg, @accent-success 0%, @accent-secondary 100%);
          border-radius: 10px;
          color: #ffffff;
          box-shadow: @shadow-success;
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
      .live-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: @bg-card;
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 10px;
        color: @accent-success;
        font-size: 13px;
        font-weight: 600;
        box-shadow: @shadow-sm;

        .live-dot {
          width: 8px;
          height: 8px;
          background: @accent-success;
          border-radius: 50%;
          animation: pulse 2s infinite;
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

    .overview-section {
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
      background: linear-gradient(90deg, @accent-success, @accent-secondary);
      border-radius: 2px;

      &--blue {
        background: linear-gradient(90deg, @accent-primary, @accent-secondary);
      }

      &--green {
        background: linear-gradient(90deg, @accent-success, @accent-secondary);
      }
    }

    .label-text {
      font-size: 12px;
      font-weight: 600;
      color: @text-muted;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
  }

  // 概览区域
  .overview-section {
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
    margin-bottom: 40px;
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
  }

  // KPI 卡片
  .kpi-card {
    position: relative;
    background: @bg-card;
    border: 1px solid @border-color;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    height: 100%;
    box-shadow: @shadow-sm;

    .kpi-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, @accent-success, @accent-secondary, @accent-success);
      background-size: 200% 100%;
      animation: glow-slide 3s ease infinite;
    }

    .kpi-inner {
      position: relative;
      z-index: 1;
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .kpi-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;

      svg {
        width: 20px;
        height: 20px;
        color: @accent-success;
      }

      .kpi-label {
        font-size: 13px;
        font-weight: 500;
        color: @text-secondary;
        letter-spacing: 0.5px;
      }
    }

    &:hover {
      background: @bg-card-hover;
      border-color: rgba(16, 185, 129, 0.2);
      transform: translateY(-3px);
      box-shadow: @shadow-lg;
    }
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
      background: linear-gradient(90deg, @accent-success, @accent-secondary);
      opacity: 0;
      transition: opacity 0.3s ease;

      &--blue {
        background: linear-gradient(90deg, @accent-primary, @accent-secondary);
      }

      &--green {
        background: linear-gradient(90deg, @accent-success, @accent-secondary);
      }
    }

    .card-inner {
      position: relative;
      z-index: 1;
      padding: 24px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;

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
          color: @accent-success;
        }
      }

      .card-badge {
        padding: 5px 12px;
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.15);
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        color: @accent-success;
        letter-spacing: 0.5px;
      }
    }

    &:hover {
      background: @bg-card-hover;
      border-color: rgba(37, 99, 235, 0.2);
      transform: translateY(-3px);
      box-shadow: @shadow-lg;

      .card-glow {
        opacity: 1;
      }
    }

    &--treemap {
      .card-title svg {
        color: @accent-success;
      }
      .card-badge {
        background: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.15);
        color: @accent-success;
      }
    }

    &--full {
      .chart-container {
        margin-top: 16px;
      }
    }
  }

  .chart-container {
    min-height: 350px;
  }

  .card-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .card-filter {
    margin-bottom: 16px;
  }
}

// 动画
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes glow-slide {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .quality-dashboard {
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

    .chart-card,
    .kpi-card {
      .card-inner {
        padding: 16px;
      }

      .card-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .card-controls {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>

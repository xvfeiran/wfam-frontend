<template>
  <div class="dashboard">
    <!-- 数据统计卡片 -->
    <a-row :gutter="16" class="stat-cards">
      <a-col :span="6">
        <a-card class="stat-card hover-card" @click="goToOrders">
          <a-statistic
            :title="t('dashboard.totalOrders')"
            :value="stats.totalOrders"
            :value-style="{ color: '#0066B2' }"
          >
            <template #prefix>
              <FileTextOutlined />
            </template>
          </a-statistic>
          <div class="trend up">
            <ArrowUpOutlined /> 12% {{ t('dashboard.comparedToLastMonth') }}
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card hover-card" @click="goToParts">
          <a-statistic
            :title="t('dashboard.totalParts')"
            :value="stats.totalParts"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <ToolOutlined />
            </template>
          </a-statistic>
          <div class="trend up">
            <ArrowUpOutlined /> 8% {{ t('dashboard.comparedToLastMonth') }}
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card hover-card">
          <a-statistic
            :title="t('dashboard.pendingTasks')"
            :value="stats.pendingTasks"
            :value-style="{ color: '#faad14' }"
          >
            <template #prefix>
              <ClockCircleOutlined />
            </template>
          </a-statistic>
          <div class="trend down">
            <ArrowDownOutlined /> 5% {{ t('dashboard.comparedToLastMonth') }}
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card hover-card" @click="goToReports">
          <a-statistic
            :title="t('dashboard.completionRate')"
            :value="stats.completionRate"
            suffix="%"
            :value-style="{ color: '#722ed1' }"
          >
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </a-statistic>
          <div class="trend up">
            <ArrowUpOutlined /> 3% {{ t('dashboard.comparedToLastMonth') }}
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 趋势图表 + 任务中心 -->
    <a-row :gutter="16" class="chart-row">
      <a-col :span="16">
        <a-card :title="t('dashboard.quantityTrend')" class="chart-card">
          <template #extra>
            <a-radio-group v-model:value="timeRange" size="small" @change="handleTimeRangeChange">
              <a-radio-button value="day">{{ t('dashboard.day') }}</a-radio-button>
              <a-radio-button value="week">{{ t('dashboard.week') }}</a-radio-button>
              <a-radio-button value="month">{{ t('dashboard.month') }}</a-radio-button>
              <a-radio-button value="year">{{ t('dashboard.year') }}</a-radio-button>
            </a-radio-group>
          </template>
          <div class="chart-container">
            <v-chart :option="trendChartOption" autoresize />
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card :title="t('dashboard.taskCenter')" class="task-card">
          <a-list :data-source="tasks" :split="false">
            <template #renderItem="{ item }">
              <a-list-item class="task-item" @click="handleTaskClick(item)">
                <div class="task-info">
                  <a-badge :status="getTaskBadgeStatus(item.priority)" />
                  <span class="task-title">{{ getTaskTitle(item.type) }}</span>
                </div>
                <a-badge
                  :count="item.count"
                  :number-style="getTaskCountStyle(item.priority)"
                />
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <!-- 快捷跳转 -->
    <a-card :title="t('dashboard.quickLinks')" class="quick-links">
      <a-row :gutter="16">
        <a-col :span="6" v-for="link in quickLinks" :key="link.key">
          <div class="quick-link-item hover-card" @click="handleQuickLink(link)">
            <component :is="link.icon" class="link-icon" />
            <span class="link-text">{{ t(`dashboard.${link.i18nKey || link.key}`) }}</span>
            <LinkOutlined v-if="link.external" class="external-icon" />
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import VChart from 'vue-echarts'
import {
  FileTextOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusCircleOutlined,
  BarChartOutlined,
  ExportOutlined,
  QuestionCircleOutlined,
  LinkOutlined,
  FormOutlined,
  AppstoreOutlined,
} from '@ant-design/icons-vue'
import { MOCK_TASKS, MOCK_ORDERS, MOCK_PARTS, generateTrendData } from '@/services/mockData'
import type { Task } from '@/types'

const { t } = useI18n()
const router = useRouter()
const timeRange = ref('month')

// 统计数据
const stats = computed(() => ({
  totalOrders: MOCK_ORDERS.length,
  totalParts: MOCK_PARTS.length,
  pendingTasks: MOCK_TASKS.reduce((sum, t) => sum + t.count, 0),
  completionRate: 78.5,
}))

// 任务列表
const tasks = ref(MOCK_TASKS)

// 任务标题翻译
const getTaskTitle = (type: string) => {
  const titleMap: Record<string, string> = {
    initial_analysis: 'dashboard.taskInitialAnalysis',
    detailed_analysis: 'dashboard.taskDetailedAnalysis',
    warning: 'dashboard.taskWarning',
    overdue: 'dashboard.taskOverdue',
    approval: 'dashboard.taskApproval',
    scrap_confirm: 'dashboard.taskScrapConfirm',
  }
  return t(titleMap[type] || type)
}

// 趋势图表配置
const trendData = ref(generateTrendData(30))

const trendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  legend: {
    data: [t('dashboard.returnOrders'), t('dashboard.warrantyParts')],
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
      formatter: (value: string) => value.slice(5), // 只显示月-日
    },
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: t('dashboard.returnOrders'),
      type: 'line',
      smooth: true,
      data: trendData.value.map(d => d.orders),
      itemStyle: { color: '#0066B2' },
      areaStyle: { color: 'rgba(0, 102, 178, 0.1)' },
    },
    {
      name: t('dashboard.warrantyParts'),
      type: 'line',
      smooth: true,
      data: trendData.value.map(d => d.parts),
      itemStyle: { color: '#52c41a' },
      areaStyle: { color: 'rgba(82, 196, 26, 0.1)' },
    },
  ],
}))

// 快捷链接
const quickLinks = [
  { key: 'new-order', i18nKey: 'quickRegisterOrder', icon: PlusCircleOutlined, path: '/return-orders/new', external: false },
  { key: 'new-part', i18nKey: 'newPart', icon: FormOutlined, path: '/return-parts/new', external: false },
  { key: 'reports', i18nKey: 'dataStatistics', icon: BarChartOutlined, path: '/reports', external: false },
  { key: 'workon', i18nKey: 'scrapWorkon', icon: ExportOutlined, url: 'https://rb-wam-ap.bosch.com/workon01ap/secure/CreateIssue.jspa?pid=10360&issuetype=162', external: true },
  { key: 'iqis', i18nKey: 'qcIqis', icon: AppstoreOutlined, url: '#', external: true },
  { key: 'sap', i18nKey: 'sap', icon: AppstoreOutlined, url: '#', external: true },
  { key: 'll', i18nKey: 'lessonsLearned', icon: AppstoreOutlined, url: 'https://cng-edlls.apac.bosch.com:10443/www/index.html#/', external: true },
  { key: 'help', i18nKey: 'helpManual', icon: QuestionCircleOutlined, path: '/help', external: false },
]

const handleTimeRangeChange = () => {
  const days = {
    day: 7,
    week: 28,
    month: 30,
    year: 365,
  }[timeRange.value] || 30
  trendData.value = generateTrendData(days)
}

const getTaskBadgeStatus = (priority: string) => {
  const statusMap: Record<string, 'default' | 'processing' | 'warning' | 'error'> = {
    low: 'default',
    medium: 'processing',
    high: 'warning',
    urgent: 'error',
  }
  return statusMap[priority] || 'default'
}

const getTaskCountStyle = (priority: string) => {
  const styleMap: Record<string, { backgroundColor: string }> = {
    low: { backgroundColor: '#d9d9d9' },
    medium: { backgroundColor: '#1890ff' },
    high: { backgroundColor: '#faad14' },
    urgent: { backgroundColor: '#ff4d4f' },
  }
  return styleMap[priority] || { backgroundColor: '#d9d9d9' }
}

const handleTaskClick = (task: Task) => {
  // 根据任务类型跳转到对应页面
  if (task.type === 'initial_analysis' || task.type === 'approval' || task.type === 'scrap_confirm') {
    router.push('/return-orders')
  } else {
    router.push('/return-parts')
  }
}

const handleQuickLink = (link: { path?: string; url?: string; external: boolean }) => {
  if (link.external && link.url) {
    window.open(link.url, '_blank')
  } else if (link.path) {
    router.push(link.path)
  }
}

const goToOrders = () => router.push('/return-orders')
const goToParts = () => router.push('/return-parts')
const goToReports = () => router.push('/reports')
</script>

<style lang="less" scoped>
.dashboard {
  padding: 24px;

  .stat-cards {
    margin-bottom: 16px;

    .stat-card {
      .trend {
        margin-top: 8px;
        font-size: 12px;

        &.up {
          color: #52c41a;
        }

        &.down {
          color: #ff4d4f;
        }
      }
    }
  }

  .chart-row {
    margin-bottom: 16px;

    .chart-card {
      .chart-container {
        height: 300px;
      }
    }

    .task-card {
      height: 100%;

      .task-item {
        cursor: pointer;
        padding: 12px 0;
        transition: background 0.3s;

        &:hover {
          background: #f5f5f5;
        }

        .task-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .task-title {
            font-size: 14px;
          }
        }
      }
    }
  }

  .quick-links {
    .quick-link-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background: #fafafa;
      border-radius: 8px;
      cursor: pointer;
      position: relative;

      .link-icon {
        font-size: 32px;
        color: #0066B2;
        margin-bottom: 12px;
      }

      .link-text {
        font-size: 14px;
        color: #333;
        text-align: center;
      }

      .external-icon {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.hover-card {
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}
</style>

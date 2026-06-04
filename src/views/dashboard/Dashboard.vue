<template>
  <div class="dashboard">
    <!-- 数据统计卡片 -->
    <a-row :gutter="16" class="stat-cards">
      <a-col :span="6">
        <a-card class="stat-card hover-card" :loading="statsLoading" @click="goToOrders">
          <a-statistic
            :title="t('dashboard.totalOrders')"
            :value="stats.totalOrders"
            :value-style="{ color: '#1677ff' }"
          >
            <template #prefix>
              <FileTextOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card hover-card" :loading="statsLoading" @click="goToParts">
          <a-statistic
            :title="t('dashboard.totalParts')"
            :value="stats.totalParts"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <ToolOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card hover-card" :loading="statsLoading">
          <a-statistic
            :value="stats.pendingTasks"
            :value-style="{ color: '#faad14' }"
          >
            <template #title>
              {{ t('dashboard.pendingTasks') }}
              <a-tooltip :title="t('dashboard.pendingTasksTip')">
                <QuestionCircleOutlined style="color: rgba(0,0,0,0.45); margin-left: 4px; cursor: pointer;" />
              </a-tooltip>
            </template>
            <template #prefix>
              <ClockCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card hover-card" :loading="statsLoading" @click="goToReports">
          <a-statistic
            :value="stats.completionRate"
            suffix="%"
            :value-style="{ color: '#722ed1' }"
          >
            <template #title>
              {{ t('dashboard.completionRate') }}
              <a-tooltip :title="t('dashboard.completionRateTip')">
                <QuestionCircleOutlined style="color: rgba(0,0,0,0.45); margin-left: 4px; cursor: pointer;" />
              </a-tooltip>
            </template>
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 趋势图表 + 任务中心 -->
    <a-row :gutter="16" class="chart-row">
      <a-col :span="16">
        <a-card :title="t('dashboard.quantityTrend')" class="chart-card" :loading="trendLoading">
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
        <a-card :title="t('dashboard.taskCenter')" class="task-card" :loading="tasksLoading">
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
        <a-col :xs="12" :sm="8" :lg="8" v-for="link in quickLinks" :key="link.key">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import VChart from 'vue-echarts'
import {
  FileTextOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
  BarChartOutlined,
  ExportOutlined,
  QuestionCircleOutlined,
  LinkOutlined,
  FormOutlined,
  AppstoreOutlined,
} from '@ant-design/icons-vue'
import { dashboardApi } from '@/services/dashboardApi'
import type { DashboardStats } from '@/services/dashboardApi'
import type { Task } from '@/types'

const { t } = useI18n()
const router = useRouter()
const timeRange = ref('month')
const statsLoading = ref(false)
const tasksLoading = ref(false)
const trendLoading = ref(false)

// 统计数据
const stats = ref<DashboardStats>({ totalOrders: 0, totalParts: 0, pendingTasks: 0, completionRate: 0 })

// 任务列表
const tasks = ref<Task[]>([])

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
const trendData = ref<{date: string, orders: number, parts: number}[]>([])

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
      itemStyle: { color: '#1677ff' },
      areaStyle: { color: 'rgba(22, 119, 255, 0.1)' },
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
  { key: 'll', i18nKey: 'lessonsLearned', icon: AppstoreOutlined, url: 'https://cng-edlls.apac.bosch.com:10443/www/index.html#/', external: true },
  { key: 'help', i18nKey: 'helpManual', icon: QuestionCircleOutlined, path: '/help', external: false },
]

const handleTimeRangeChange = async () => {
  const days = {
    day: 1,
    week: 7,
    month: 30,
    year: 365,
  }[timeRange.value] || 30
  trendLoading.value = true
  try {
    trendData.value = await dashboardApi.getTrend(days)
  } catch {
    message.error(t('common.failed'))
  } finally {
    trendLoading.value = false
  }
}

onMounted(async () => {
  statsLoading.value = true
  tasksLoading.value = true
  trendLoading.value = true

  dashboardApi.getStats()
    .then((statsData) => {
      stats.value = statsData
    })
    .catch(() => {
      message.error(t('common.failed'))
    })
    .finally(() => {
      statsLoading.value = false
    })

  dashboardApi.getTasks()
    .then((tasksData) => {
      tasks.value = tasksData
    })
    .catch(() => {
      message.error(t('common.failed'))
    })
    .finally(() => {
      tasksLoading.value = false
    })

  dashboardApi.getTrend(30)
    .then((trend) => {
      trendData.value = trend
    })
    .catch(() => {
      message.error(t('common.failed'))
    })
    .finally(() => {
      trendLoading.value = false
    })
})

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
    medium: { backgroundColor: '#1677ff' },
    high: { backgroundColor: '#faad14' },
    urgent: { backgroundColor: '#ff4d4f' },
  }
  return styleMap[priority] || { backgroundColor: '#d9d9d9' }
}

const handleTaskClick = (task: Task) => {
  if (task.type === 'initial_analysis') {
    router.push({ path: '/return-orders', query: { status: 'submitted', fromTask: task.type } })
    return
  }
  if (task.type === 'detailed_analysis') {
    router.push({ path: '/return-parts', query: { status: 'in_detailed_analysis', fromTask: task.type } })
    return
  }
  if (task.type === 'warning') {
    router.push({ path: '/return-parts', query: { status: 'in_detailed_analysis', alert: 'warning', fromTask: task.type } })
    return
  }
  if (task.type === 'overdue') {
    router.push({ path: '/return-parts', query: { status: 'in_detailed_analysis', alert: 'overdue', fromTask: task.type } })
    return
  }
  if (task.type === 'approval') {
    router.push({ path: '/approval', query: { tab: 'myApproval', fromTask: task.type } })
    return
  }
  if (task.type === 'scrap_confirm') {
    router.push({ path: '/analysis-orders', query: { status: 'workon_scrap_in_progress', fromTask: task.type } })
    return
  }
  router.push('/dashboard')
}

const handleQuickLink = (link: { path?: string; url?: string; external: boolean; i18nKey?: string; key?: string }) => {
  if (link.external && link.url) {
    window.open(link.url, '_blank', 'noopener,noreferrer')
  } else if (link.external && !link.url) {
    const name = t(`dashboard.${link.i18nKey || link.key || ''}`)
    message.warning(t('dashboard.linkNotConfigured', { name }))
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
  padding: 0;

  .stat-cards {
    margin-bottom: 16px;
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
      border-radius: 4px;
      cursor: pointer;
      position: relative;

      .link-icon {
        font-size: 32px;
        color: #1677ff;
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
</style>

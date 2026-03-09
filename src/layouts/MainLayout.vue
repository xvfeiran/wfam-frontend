<template>
  <!-- 子应用模式：无菜单和顶栏 -->
  <router-view v-if="!isDevMode" />

  <!-- 调试模式：完整布局（URL 加 ?dev=1 开启） -->
  <a-layout v-else class="main-layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      width="220"
      theme="dark"
    >
      <div class="logo">
        <img src="@/assets/logo.svg" alt="Logo" class="logo-img" />
        <span v-if="!collapsed" class="logo-text">WFAM</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="/dashboard">
          <template #icon><DashboardOutlined /></template>
          <span>{{ t('menu.home') }}</span>
        </a-menu-item>
        <a-menu-item key="/return-orders">
          <template #icon><FileTextOutlined /></template>
          <span>{{ t('menu.returnOrders') }}</span>
        </a-menu-item>
        <a-menu-item key="/return-parts">
          <template #icon><ToolOutlined /></template>
          <span>{{ t('menu.returnParts') }}</span>
        </a-menu-item>
        <a-menu-item key="/reports">
          <template #icon><BarChartOutlined /></template>
          <span>{{ t('menu.reports') }}</span>
        </a-menu-item>
        <a-menu-item key="/approval">
          <template #icon><AuditOutlined /></template>
          <span>{{ t('menu.approval') }}</span>
        </a-menu-item>
        <a-menu-item key="/settings">
          <template #icon><SettingOutlined /></template>
          <span>{{ t('menu.settings') }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- 顶部导航栏 -->
      <a-layout-header class="header">
        <div class="header-left">
          <component
            :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
            class="trigger"
            @click="collapsed = !collapsed"
          />
          <a-breadcrumb class="breadcrumb">
            <a-breadcrumb-item>
              <router-link to="/">{{ t('menu.home') }}</router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="currentPageTitle">
              {{ currentPageTitle }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-space :size="16">
            <LanguageSwitcher />
            <a-badge :count="37" :offset="[0, 4]">
              <BellOutlined class="header-icon" />
            </a-badge>
            <UserSwitcher />
          </a-space>
        </div>
      </a-layout-header>

      <!-- 主内容区 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDevMode } from '@/composables/useDevMode'
import {
  DashboardOutlined,
  FileTextOutlined,
  ToolOutlined,
  BarChartOutlined,
  AuditOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import UserSwitcher from '@/components/UserSwitcher.vue'

const { t } = useI18n()
const { isDevMode } = useDevMode()
const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const selectedKeys = ref<string[]>(['/dashboard'])

const currentPageTitle = computed(() => {
  const titleMap: Record<string, string> = {
    '/dashboard': 'menu.home',
    '/return-orders': 'menu.returnOrders',
    '/return-orders/new': 'orderDetail.createTitle',
    '/return-orders/:id': 'orderDetail.title',
    '/return-orders/:id/edit': 'orderDetail.editTitle',
    '/return-parts': 'menu.returnParts',
    '/return-parts/new': 'returnPart.createTitle',
    '/return-parts/:id': 'partDetail.title',
    '/return-parts/:id/edit': 'returnPart.editTitle',
    '/return-parts/:id/analysis': 'analysisForm.title',
    '/reports': 'menu.reports',
    '/approval': 'menu.approval',
    '/settings': 'menu.settings',
  }

  // Find matching route by pattern matching
  const path = route.path
  let key: string | undefined

  // Exact match first
  if (titleMap[path]) {
    key = titleMap[path]
  } else {
    // Pattern match for dynamic routes
    for (const [pattern, i18nKey] of Object.entries(titleMap)) {
      if (pattern.includes(':id') && path.match(new RegExp('^' + pattern.replace(':id', '[^/]+') + '$'))) {
        key = i18nKey
        break
      }
    }
  }

  if (key) {
    // For routes with placeholders, get the value from route
    if (key.includes('{')) {
      const partNumber = route.params.id as string
      return t(key, { partNumber })
    }
    return t(key)
  }

  return route.meta?.title as string || ''
})

watch(
  () => route.path,
  (path) => {
    // 根据路由路径设置选中的菜单项
    if (path.startsWith('/return-orders')) {
      selectedKeys.value = ['/return-orders']
    } else if (path.startsWith('/return-parts')) {
      selectedKeys.value = ['/return-parts']
    } else if (path.startsWith('/reports')) {
      selectedKeys.value = ['/reports']
    } else if (path.startsWith('/approval')) {
      selectedKeys.value = ['/approval']
    } else if (path.startsWith('/settings')) {
      selectedKeys.value = ['/settings']
    } else {
      selectedKeys.value = ['/dashboard']
    }
  },
  { immediate: true }
)

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}
</script>

<style lang="less" scoped>
.main-layout {
  min-height: 100vh;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);

  .logo-img {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    letter-spacing: 2px;
  }
}

.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .trigger {
      font-size: 18px;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: #0066B2;
      }
    }

    .breadcrumb {
      margin: 0;
    }
  }

  .header-right {
    .header-icon {
      font-size: 18px;
      cursor: pointer;

      &:hover {
        color: #0066B2;
      }
    }

    .user-info {
      cursor: pointer;

      .username {
        color: #333;
      }
    }
  }
}

.content {
  margin: 24px;
  background: #fff;
  border-radius: 4px;
  min-height: 280px;
}
</style>

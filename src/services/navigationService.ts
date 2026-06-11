import router from '@/router'
import { useDevMode } from '@/composables/useDevMode'

/** AEP 注册信息（通过环境变量区分测试/生产环境） */
const AEP_CONFIG = {
  appName: import.meta.env.VITE_AEP_APP_NAME || 'RBCC_WFAM',
  appId: Number(import.meta.env.VITE_AEP_APP_ID) || 1081,
}

/** 提取一级路由段：'/return-orders/123/edit' → 'return-orders' */
function getFirstSegment(path: string): string {
  return path.replace(/^\//, '').split('/')[0] || 'dashboard'
}

/** 判断目标路径是否和当前路由在同一个 AEP 标签内 */
function isSameTab(targetPath: string): boolean {
  const currentFirst = getFirstSegment(router.currentRoute.value.path)
  const targetFirst = getFirstSegment(targetPath)
  return currentFirst === targetFirst
}

/**
 * 统一导航入口
 *
 * 三种行为：
 * 1. 页面内跳转（列表→详情→编辑）→ router.push
 * 2. 跨标签 + dev=1 模式         → router.push（有侧边栏，正常切换）
 * 3. 跨标签 + AEP 嵌入模式       → jump() 打开新标签
 */
export function navigateTo(
  path: string,
  query?: Record<string, string>,
) {
  // 同标签内（如 /return-orders → /return-orders/123）
  if (isSameTab(path)) {
    router.push({ path, query })
    return
  }

  // 跨标签 + dev=1 模式 → 用 router.push，侧边栏高亮会自动跟着变
  const { isDevMode } = useDevMode()
  if (isDevMode.value) {
    router.push({ path, query })
    return
  }

  // 跨标签 + AEP 嵌入模式 → jump
  if (window.__POWERED_BY_WUJIE__) {
    const jump = window.$wujie?.props?.jump as
      | ((aepPath: string, config: { appName: string; path: string; appId: number }, params?: Record<string, string>) => void)
      | undefined

    if (jump) {
      const segment = getFirstSegment(path)
      jump(
        `/${segment}`,
        {
          appName: AEP_CONFIG.appName,
          path: `/${segment}`,
          appId: AEP_CONFIG.appId,
        },
        query ?? {},
      )
      return
    }
  }

  // 降级兜底
  router.push({ path, query })
}

/** 页面内跳转（明确不需要换标签，如列表→详情） */
export function navigateWithin(path: string, query?: Record<string, string>) {
  router.push({ path, query })
}

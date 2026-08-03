import router from '@/router'
import { useDevMode } from '@/composables/useDevMode'

/** AEP 注册信息（通过环境变量区分测试/生产环境） */
const AEP_CONFIG = {
  /** AEP 中加载微应用的路由（如 /microApp） */
  tabPath: import.meta.env.VITE_AEP_TAB_PATH || '/microApp',
  appName: import.meta.env.VITE_AEP_APP_NAME || 'RBCC_WFAM',
  // appId 测试环境为 1081、生产环境为 881，必须由 .env.test / .env.prod 提供，不在代码里写死兜底
  appId: Number(import.meta.env.VITE_AEP_APP_ID),
}

/** 将 query 对象拼接到 path 上：'/return-orders' + { status: 'submitted' } → '/return-orders?status=submitted' */
function buildPathWithQuery(path: string, query?: Record<string, string>): string {
  if (!query || Object.keys(query).length === 0) return path
  const search = new URLSearchParams(query).toString()
  return `${path}?${search}`
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
  const prefix = '[WFAM navigateTo]'

  // 同标签内（如 /return-orders → /return-orders/123）
  if (isSameTab(path)) {
    console.log(prefix, '同标签跳转 → router.push', { path, query })
    router.push({ path, query })
    return
  }

  // 跨标签 + dev=1 模式 → 用 router.push，侧边栏高亮会自动跟着变
  const { isDevMode } = useDevMode()
  if (isDevMode.value) {
    console.log(prefix, 'dev=1 模式 → router.push', { path, query })
    router.push({ path, query })
    return
  }

  // 跨标签 + AEP 嵌入模式 → jump
  console.log(prefix, '跨标签跳转，检查 wujie 环境...', {
    __POWERED_BY_WUJIE__: window.__POWERED_BY_WUJIE__,
    '$wujie 存在': !!window.$wujie,
    'props 存在': !!window.$wujie?.props,
    'props 所有 key': window.$wujie?.props ? Object.keys(window.$wujie.props) : [],
    'jump 存在': !!window.$wujie?.props?.jump,
    'jump 类型': typeof window.$wujie?.props?.jump,
  })

  if (window.__POWERED_BY_WUJIE__) {
    const jump = window.$wujie?.props?.jump as
      | ((aepPath: string, config: { appName: string; path: string; appId: number }, params?: Record<string, string>) => void)
      | undefined

    if (jump) {
      // 将 query 拼到 path 中，确保子应用加载时能收到路由参数
      const fullPath = buildPathWithQuery(path, query)
      const jumpArgs = {
        aepPath: AEP_CONFIG.tabPath,
        config: {
          appName: AEP_CONFIG.appName,
          path: fullPath,
          appId: AEP_CONFIG.appId,
        },
        params: query ?? {},
      }
      console.log(prefix, '调用 jump()', jumpArgs)

      try {
        jump(jumpArgs.aepPath, jumpArgs.config, jumpArgs.params)
        console.log(prefix, 'jump() 调用完成（无异常）')
      } catch (e) {
        console.error(prefix, 'jump() 调用异常！', e)
        console.log(prefix, '降级 → router.push')
        router.push({ path, query })
      }
      return
    }

    console.warn(prefix, 'wujie 环境但 jump 不可用，降级 router.push')
  } else {
    console.warn(prefix, '非 wujie 环境，降级 router.push')
  }

  // 降级兜底
  router.push({ path, query })
}

/** 页面内跳转（明确不需要换标签，如列表→详情） */
export function navigateWithin(path: string, query?: Record<string, string>) {
  router.push({ path, query })
}

import { ref } from 'vue'
import { userApi, type UserInfo } from '@/services/userApi'

// 模块级共享状态：所有调用 useUserNameMap() 的组件共用同一份 nameMap，
// 避免每个组件各自持有一份空 map 导致 displayName() 回退到 loginName。
const allUsers = ref<UserInfo[]>([])
const nameMap = ref<Record<string, string>>({})
const loaded = ref(false)
let loadingPromise: Promise<void> | null = null

async function ensureLoaded() {
  if (loaded.value) return
  // 并发去重：多次同时触发只发起一次请求
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    try {
      allUsers.value = await userApi.list()
      const map: Record<string, string> = {}
      for (const u of allUsers.value) {
        map[u.loginName] = u.displayName
      }
      nameMap.value = map
      loaded.value = true
    } catch {
      // 查询失败时不阻塞渲染，后续调用会重试
      loadingPromise = null
    }
  })()
  return loadingPromise
}

export function useUserNameMap() {
  function load() {
    return ensureLoaded()
  }

  function displayName(loginName: string | null | undefined): string {
    if (!loginName) return '-'
    // 懒加载：未显式调用 load() 的组件（如 SamplingModal、PartTable）
    // 在首次渲染时也会触发加载，加载完成后响应式刷新为真实用户名。
    if (!loaded.value) ensureLoaded()
    return nameMap.value[loginName] || loginName
  }

  return { nameMap, load, displayName }
}

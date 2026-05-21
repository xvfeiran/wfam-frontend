import { ref } from 'vue'
import { userApi, type UserInfo } from '@/services/userApi'

const allUsers = ref<UserInfo[]>([])
const loaded = ref(false)

async function ensureLoaded() {
  if (loaded.value) return
  try {
    allUsers.value = await userApi.list()
    loaded.value = true
  } catch {
    // 查询失败时不阻塞渲染，后续调用会重试
  }
}

export function useUserNameMap() {
  const nameMap = ref<Record<string, string>>({})

  async function load() {
    await ensureLoaded()
    const map: Record<string, string> = {}
    for (const u of allUsers.value) {
      map[u.loginName] = u.displayName
    }
    nameMap.value = map
  }

  function displayName(loginName: string | null | undefined): string {
    if (!loginName) return '-'
    return nameMap.value[loginName] || loginName
  }

  return { nameMap, load, displayName }
}

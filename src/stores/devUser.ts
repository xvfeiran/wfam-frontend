import { defineStore } from 'pinia'
import { watchEffect } from 'vue'

// 角色定义（参考设计文档）
export type UserRole =
  | 'W_RBCC_AEP_WFAM_Customer_Quality_ENG' // 客户质量工程师
  | 'W_RBCC_AEP_WFAM_Analyst' // 分析员
  | 'W_RBCC_AEP_WFAM_QMC_Leader' // 分析主管
  | 'W_RBCC_AEP_WFAM_QMC_Manager' // QMC 经理（数据校订权）
  | 'R_RBCC_AEP_WFAM_Visitor' // 访客（只读）
  | 'W_RBCC_AEP_WFAM_SystemAdmin' // 系统管理员

// 角色显示名称映射
export const ROLE_LABELS: Record<UserRole, string> = {
  W_RBCC_AEP_WFAM_Customer_Quality_ENG: 'Customer Quality Engineer',
  W_RBCC_AEP_WFAM_Analyst: 'Analyst',
  W_RBCC_AEP_WFAM_QMC_Leader: 'QMC Leader',
  W_RBCC_AEP_WFAM_QMC_Manager: 'QMC Manager',
  R_RBCC_AEP_WFAM_Visitor: 'Visitor',
  W_RBCC_AEP_WFAM_SystemAdmin: 'System Admin',
}

// 用户信息接口
export interface DevUser {
  id: string
  username: string
  displayName: string
  email: string
  department: string
  ntAccount: string
  role: UserRole
}

// 生成请求头的用户信息
export function generateAuthHeader(user: DevUser): string {
  return JSON.stringify({
    loginType: 2,
    createUserName: 'SYSTEM',
    expiresIn: 2051222400000,
    id: parseInt(user.id),
    email: user.email,
    departmentName: user.department,
    isStatementRead: 1,
    isAdmin: user.role === 'W_RBCC_AEP_WFAM_SystemAdmin' ? 1 : 0,
    userId: parseInt(user.id),
    version: 0,
    companyId: 1,
    roleIds: getRoleIds(user.role),
    createTime: 1721982699347,
    passwordPeriod: 2051222400000,
    name: `${user.displayName} (${user.department})`,
    ntAccount: user.ntAccount,
    grantType: 'authorization_code',
    roleNames: user.role,
    username: user.ntAccount,
    status: 1,
    sub: user.ntAccount,
    iat: 1728462541,
    exp: 2051222400,
  })
}

// 角色ID映射（模拟IDM系统返回的角色ID）
function getRoleIds(role: UserRole): string {
  const roleIdsMap: Record<UserRole, string> = {
    W_RBCC_AEP_WFAM_Customer_Quality_ENG: '100',
    W_RBCC_AEP_WFAM_Analyst: '200',
    W_RBCC_AEP_WFAM_QMC_Leader: '300',
    W_RBCC_AEP_WFAM_QMC_Manager: '400',
    R_RBCC_AEP_WFAM_Visitor: '500',
    W_RBCC_AEP_WFAM_SystemAdmin: '99,241,81,242,41,321,365,368,326,366,85,84,405,4,444,4',
  }
  return roleIdsMap[role]
}

// 预定义的模拟用户（使用纯英文避免 HTTP 请求头编码问题）
export const MOCK_USERS: DevUser[] = [
  {
    id: '6181',
    username: 'zhangsan',
    displayName: 'Zhang San',
    email: 'zhangsan@cn.bosch.com',
    department: 'BD/SWD-FSB1',
    ntAccount: 'ZSAN',
    role: 'W_RBCC_AEP_WFAM_Customer_Quality_ENG',
  },
  {
    id: '6182',
    username: 'lisi',
    displayName: 'Li Si',
    email: 'lisi@cn.bosch.com',
    department: 'BD/SWD-FSB2',
    ntAccount: 'LSI',
    role: 'W_RBCC_AEP_WFAM_Analyst',
  },
  {
    id: '6183',
    username: 'wangwu',
    displayName: 'Wang Wu',
    email: 'wangwu@cn.bosch.com',
    department: 'BD/SWD-QMC',
    ntAccount: 'WWU',
    role: 'W_RBCC_AEP_WFAM_QMC_Leader',
  },
  {
    id: '6184',
    username: 'zhaoliu',
    displayName: 'Zhao Liu',
    email: 'zhaoliu@cn.bosch.com',
    department: 'BD/SWD-QMC',
    ntAccount: 'ZLIU',
    role: 'W_RBCC_AEP_WFAM_QMC_Manager',
  },
  {
    id: '6185',
    username: 'guest',
    displayName: 'Guest User',
    email: 'guest@cn.bosch.com',
    department: 'BD/SWD-GUEST',
    ntAccount: 'GUEST',
    role: 'R_RBCC_AEP_WFAM_Visitor',
  },
  {
    id: '6186',
    username: 'admin',
    displayName: 'System Admin',
    email: 'admin@cn.bosch.com',
    department: 'IT/Admin',
    ntAccount: 'ADMIN',
    role: 'W_RBCC_AEP_WFAM_SystemAdmin',
  },
]

// LocalStorage 键名
const STORAGE_KEY = 'wfam-dev-user'

// 从 localStorage 恢复用户
function loadUserFromStorage(): DevUser {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 验证解析后的数据是否是有效的 DevUser
      if (parsed && parsed.id && parsed.username && parsed.role) {
        // 检查是否包含中文字符（旧数据），如果是则重置为默认用户
        const jsonStr = JSON.stringify(parsed)
        if (/[^\x00-\x7F]/.test(jsonStr)) {
          console.warn('[DevUser] Detected non-ASCII characters in stored user data, resetting to default')
          localStorage.removeItem(STORAGE_KEY)
          return MOCK_USERS[1] // 默认分析员
        }
        return parsed as DevUser
      }
    }
  } catch (e) {
    console.error('Failed to load user from localStorage:', e)
  }
  // 默认返回分析员角色
  return MOCK_USERS[1]
}

const useDevUserStore = defineStore('devUser', {
  state: () => ({
    // 从 localStorage 恢复或使用默认值
    currentUser: loadUserFromStorage() as DevUser,
  }),

  getters: {
    authHeader: (state) => generateAuthHeader(state.currentUser),
    currentRoleLabel: (state) => ROLE_LABELS[state.currentUser.role],
  },

  actions: {
    setUser(user: DevUser) {
      this.currentUser = user
    },
  },
})

// 手动实现 localStorage 持久化
export function setupDevUserPersistence() {
  const store = useDevUserStore()

  // 监听状态变化并保存到 localStorage
  watchEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.currentUser))
    } catch (e) {
      console.error('Failed to save user to localStorage:', e)
    }
  })
}

export { useDevUserStore }

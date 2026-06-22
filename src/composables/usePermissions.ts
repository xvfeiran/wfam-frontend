import { computed } from 'vue'
import { useDevMode } from './useDevMode'
import { useDevUserStore, ROLE_LABELS } from '@/stores/devUser'
import { useUserInfoStore } from '@/stores/userInfo'
import type { UserRole } from '@/stores/devUser'

const EDIT_SUBMITTED_ROLE: UserRole = 'W_RBCC_AEP_WFAM_QMC_Leader'

function hasRole(roleNames: string, role: string): boolean {
  const result = roleNames.includes(role)
  // [WFAM-PERM Boundary E] 单次匹配结果
  console.log(
    `[WFAM-PERM E] hasRole("${roleNames}", "${role}") => ${result}`,
  )
  return result
}

export function usePermissions() {
  const { isDevMode } = useDevMode()
  const devUserStore = useDevUserStore()
  const userInfoStore = useUserInfoStore()

  // dev 模式：单角色字符串；wujie 模式：逗号分隔的多角色字符串
  const roleNames = computed(() => {
    let src: 'dev' | 'userInfo'
    let val: string
    if (isDevMode.value) {
      src = 'dev'
      val = devUserStore.currentUser.role
    } else {
      src = 'userInfo'
      val = userInfoStore.roleNames
    }
    // [WFAM-PERM Boundary D] roleNames 来源与值
    console.log(
      `[WFAM-PERM D] roleNames src=${src} | val="${val}" | devUser.role="${devUserStore.currentUser.role}" | userInfo.roleNames="${userInfoStore.roleNames}"`,
    )
    return val
  })

  const currentUserUsername = computed(() => {
    if (isDevMode.value) {
      return devUserStore.currentUser.ntAccount
    }
    return userInfoStore.username
  })

  const canEditSubmittedForm = computed(() => {
    return hasRole(roleNames.value, EDIT_SUBMITTED_ROLE)
  })

  const isQMCLeader = computed(() => {
    return hasRole(roleNames.value, 'W_RBCC_AEP_WFAM_QMC_Leader')
  })

  const isQMCManager = computed(() => {
    return hasRole(roleNames.value, 'W_RBCC_AEP_WFAM_QMC_Manager')
  })

  const isSystemAdmin = computed(() => {
    return hasRole(roleNames.value, 'W_RBCC_AEP_WFAM_SystemAdmin')
  })

  // 分析员：有 Analyst 角色，但不是 Leader/Manager/Admin（与后端逻辑一致）
  const isAnalyst = computed(() => {
    const rn = roleNames.value
    return hasRole(rn, 'W_RBCC_AEP_WFAM_Analyst')
      && !hasRole(rn, 'W_RBCC_AEP_WFAM_QMC_Leader')
      && !hasRole(rn, 'W_RBCC_AEP_WFAM_QMC_Manager')
      && !hasRole(rn, 'W_RBCC_AEP_WFAM_SystemAdmin')
  })

  const canViewAllAnalysisOrders = computed(() => {
    const rn = roleNames.value
    return hasRole(rn, 'W_RBCC_AEP_WFAM_QMC_Leader') ||
      hasRole(rn, 'W_RBCC_AEP_WFAM_QMC_Manager') ||
      hasRole(rn, 'W_RBCC_AEP_WFAM_SystemAdmin')
  })

  const currentRoleLabel = computed(() => {
    if (isDevMode.value) {
      return devUserStore.currentRoleLabel
    }
    // wujie 模式：匹配第一个已知的 WFAM 角色
    const wfamRoles: UserRole[] = [
      'W_RBCC_AEP_WFAM_SystemAdmin',
      'W_RBCC_AEP_WFAM_QMC_Manager',
      'W_RBCC_AEP_WFAM_QMC_Leader',
      'W_RBCC_AEP_WFAM_Analyst',
      'W_RBCC_AEP_WFAM_Customer_Quality',
      'R_RBCC_AEP_WFAM_Visitor',
    ]
    for (const role of wfamRoles) {
      if (hasRole(roleNames.value, role)) {
        return ROLE_LABELS[role]
      }
    }
    return ''
  })

  return {
    canEditSubmittedForm,
    isQMCLeader,
    isQMCManager,
    isSystemAdmin,
    isAnalyst,
    canViewAllAnalysisOrders,
    currentRoleLabel,
    currentUserUsername,
  }
}

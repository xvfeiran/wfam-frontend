import { computed } from 'vue'
import { useDevMode } from './useDevMode'
import { useDevUserStore, ROLE_LABELS } from '@/stores/devUser'
import { useUserInfoStore } from '@/stores/userInfo'
import type { UserRole } from '@/stores/devUser'

const EDIT_SUBMITTED_ROLE: UserRole = 'W_RBCC_AEP_WFAM_QMC_Leader'

export function usePermissions() {
  const { isDevMode } = useDevMode()
  const devUserStore = useDevUserStore()
  const userInfoStore = useUserInfoStore()

  const currentRole = computed<UserRole | ''>(() => {
    if (isDevMode.value) {
      return devUserStore.currentUser.role
    }
    return (userInfoStore.roleNames as UserRole) || ''
  })

  const currentUserUsername = computed(() => {
    if (isDevMode.value) {
      return devUserStore.currentUser.ntAccount
    }
    return userInfoStore.username
  })

  const canEditSubmittedForm = computed(() => {
    return currentRole.value === EDIT_SUBMITTED_ROLE
  })

  const isQMCLeader = computed(() => {
    return currentRole.value === 'W_RBCC_AEP_WFAM_QMC_Leader'
  })

  const isQMCManager = computed(() => {
    return currentRole.value === 'W_RBCC_AEP_WFAM_QMC_Manager'
  })

  const isSystemAdmin = computed(() => {
    return currentRole.value === 'W_RBCC_AEP_WFAM_SystemAdmin'
  })

  const isAnalyst = computed(() => {
    return currentRole.value === 'W_RBCC_AEP_WFAM_Analyst'
  })

  const canViewAllAnalysisOrders = computed(() => {
    const role = currentRole.value
    return role === 'W_RBCC_AEP_WFAM_QMC_Leader' ||
      role === 'W_RBCC_AEP_WFAM_QMC_Manager' ||
      role === 'W_RBCC_AEP_WFAM_SystemAdmin'
  })

  const currentRoleLabel = computed(() => {
    return ROLE_LABELS[currentRole.value as UserRole] || ''
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

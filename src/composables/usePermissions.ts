import { computed } from 'vue'
import { useDevMode } from './useDevMode'
import { useDevUserStore } from '@/stores/devUser'
import { useUserInfoStore } from '@/stores/userInfo'
import type { UserRole } from '@/stores/devUser'

/**
 * Role that can edit submitted forms (non-draft status)
 */
const EDIT_SUBMITTED_ROLE: UserRole = 'W_RBCC_AEP_WFAM_QMC_Manager'

/**
 * Composable for checking user permissions
 */
export function usePermissions() {
  const { isDevMode } = useDevMode()
  const devUserStore = useDevUserStore()
  const userInfoStore = useUserInfoStore()

  /**
   * Check if current user has permission to edit submitted forms (non-draft status)
   * Only QMC Manager can edit submitted forms
   */
  const canEditSubmittedForm = computed(() => {
    if (isDevMode.value) {
      // Dev mode: check dev user role
      return devUserStore.currentUser.role === EDIT_SUBMITTED_ROLE
    } else {
      // Production mode: check from userInfo store
      // TODO: Implement proper role extraction from auth header
      return false
    }
  })

  /**
   * Check if current user is QMC Leader
   */
  const isQMCLeader = computed(() => {
    if (isDevMode.value) {
      return devUserStore.currentUser.role === 'W_RBCC_AEP_WFAM_QMC_Leader'
    }
    return false // TODO: Implement for production mode
  })

  /**
   * Check if current user is QMC Manager
   */
  const isQMCManager = computed(() => {
    if (isDevMode.value) {
      return devUserStore.currentUser.role === 'W_RBCC_AEP_WFAM_QMC_Manager'
    }
    return false // TODO: Implement for production mode
  })

  /**
   * Check if current user is System Admin
   */
  const isSystemAdmin = computed(() => {
    if (isDevMode.value) {
      return devUserStore.currentUser.role === 'W_RBCC_AEP_WFAM_SystemAdmin'
    }
    return false // TODO: Implement for production mode
  })

  /**
   * Get current user's role label
   */
  const currentRoleLabel = computed(() => {
    if (isDevMode.value) {
      return devUserStore.currentRoleLabel
    }
    return '' // TODO: Implement for production mode
  })

  return {
    canEditSubmittedForm,
    isQMCLeader,
    isQMCManager,
    isSystemAdmin,
    currentRoleLabel,
  }
}

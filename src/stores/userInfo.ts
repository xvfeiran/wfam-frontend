import { defineStore } from 'pinia'
import { parseJwtToken } from '@/utils/jwt'

export const useUserInfoStore = defineStore('userInfo', {
  state: () => ({
    accessToken: '',
    roleNames: '',
    username: '',
  }),
  actions: {
    setToken(token: string) {
      this.accessToken = token
    },
    setUserProfileFromToken(token: string) {
      this.accessToken = token
      const payload = parseJwtToken(token)
      // [WFAM-PERM Boundary C] JWT 解析与 claim 读取
      if (payload) {
        const payloadKeys = Object.keys(payload)
        const roleNamesRaw = payload.roleNames
        this.roleNames = (roleNamesRaw as string) || ''
        this.username = (payload.username as string) || (payload.ntAccount as string) || ''
        console.log(
          `[WFAM-PERM C] JWT parsed | keys=[${payloadKeys.join(',')}] | roleNames="${this.roleNames}" | username="${this.username}"`,
        )
        // 若 roleNames 为空，提示可能的字段名不一致
        if (!this.roleNames) {
          console.warn(
            `[WFAM-PERM C] roleNames EMPTY! JWT 中未找到 "roleNames" 字段。候选 keys: ${payloadKeys.join(', ')}`,
          )
        }
      } else {
        console.warn(`[WFAM-PERM C] JWT parse FAILED (tokenLen=${token?.length || 0})`)
      }
    },
  },
})

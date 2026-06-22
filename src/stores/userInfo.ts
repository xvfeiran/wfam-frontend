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
      if (payload) {
        this.roleNames = (payload.roleNames as string) || ''
        this.username = (payload.username as string) || (payload.ntAccount as string) || ''
      }
    },
  },
})

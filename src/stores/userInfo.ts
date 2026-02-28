import { defineStore } from 'pinia'

export const useUserInfoStore = defineStore('userInfo', {
  state: () => ({
    accessToken: '',
  }),
  actions: {
    setToken(token: string) {
      this.accessToken = token
    },
  },
})

import request from './request'
import { useDevMode } from '@/composables/useDevMode'
import { MOCK_USERS, type DevUser } from '@/stores/devUser'

export interface UserInfo {
  id: string
  loginName: string
  displayName: string
  email?: string
}

const { isDevMode } = useDevMode()

function mockUserToUserInfo(user: DevUser): UserInfo {
  return {
    id: user.id,
    loginName: user.ntAccount,
    displayName: user.displayName,
    email: user.email,
  }
}

export const userApi = {
  list(): Promise<UserInfo[]> {
    if (isDevMode.value) {
      return Promise.resolve(MOCK_USERS.map(mockUserToUserInfo))
    }
    return request.get('/users') as unknown as Promise<UserInfo[]>
  },
  listAnalysts(): Promise<UserInfo[]> {
    if (isDevMode.value) {
      return Promise.resolve(
        MOCK_USERS
          .filter(u => u.role === 'W_RBCC_AEP_WFAM_Analyst')
          .map(mockUserToUserInfo),
      )
    }
    return request.get('/users', { params: { role: 'analyst' } }) as unknown as Promise<UserInfo[]>
  },
  listCQEs(): Promise<UserInfo[]> {
    if (isDevMode.value) {
      return Promise.resolve(
        MOCK_USERS
          .filter(u => u.role === 'R_RBCC_AEP_WFAM_Customer_Quality')
          .map(mockUserToUserInfo),
      )
    }
    return request.get('/users', { params: { role: 'cqe' } }) as unknown as Promise<UserInfo[]>
  },
}

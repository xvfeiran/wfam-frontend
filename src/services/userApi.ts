import request from './request'

export interface UserInfo {
  id: string
  loginName: string
  displayName: string
}

export const userApi = {
  list(): Promise<UserInfo[]> {
    return request.get('/users') as unknown as Promise<UserInfo[]>
  },
}

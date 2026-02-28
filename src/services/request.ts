import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'
import { useDevMode } from '@/composables/useDevMode'
import { useUserInfoStore } from '@/stores/userInfo'
import i18n from '@/i18n'

// 开发期间写死的请求头（上线后由中转网关添加）
const DEV_AUTH_HEADER = JSON.stringify({
  loginType: 2,
  createUserName: 'SYSTEM',
  expiresIn: 2051222400000,
  id: 6181,
  email: 'Raven.ZHENG@cn.bosch.com',
  departmentName: 'BD/SWD-FSB2',
  isStatementRead: 1,
  isAdmin: 1,
  userId: 6181,
  version: 0,
  companyId: 1,
  roleIds: '99,241,81,242,41,321,365,368,326,366,85,84,405,4,444,4',
  createTime: 1721982699347,
  passwordPeriod: 2051222400000,
  name: 'ZHENG Raven (BD/SWD-FSB2)',
  ntAccount: 'ZRN7SZH',
  grantType: 'authorization_code',
  roleNames: 'R_RBCC_AEP_Flow_DataReader,W_RBCC_AEP_BDSupport,R_RBCC_AEP_Catalog_DataReader',
  username: 'ZRN7SZH',
  status: 1,
  sub: 'ZRN7SZH',
  iat: 1728462541,
  exp: 2051222400,
})

const { isDevMode } = useDevMode()

const request = axios.create({
  baseURL: isDevMode.value
    ? import.meta.env.VITE_BACKEND_URL
    : import.meta.env.VITE_GATEWAY_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    if (isDevMode.value) {
      // 调试模式：使用写死的认证头直接访问后端
      config.headers['x-authentication-header'] = DEV_AUTH_HEADER
    } else {
      // 子应用模式：从 Pinia store 读取父应用传入的 token，通过网关鉴权
      const { accessToken } = useUserInfoStore()
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器 - 提取数据，处理错误
request.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    const { t } = i18n.global
    const data = error.response?.data

    // 子应用模式下处理网关 401
    if (!isDevMode.value && data?.code === 401) {
      if (data.message === 'Token has expired') {
        message.error(t('auth.tokenExpired'))
        setTimeout(() => {
          window.location.href = import.meta.env.VITE_AEP_LOGIN_URL
        }, 2000)
      } else if (data.message === 'Unauthorized') {
        message.error(t('auth.unauthorized'))
      }
      return Promise.reject(error)
    }

    const errMsg = data?.message || error.message || 'Network Error'
    console.error('[API Error]', errMsg)
    return Promise.reject(error)
  },
)

export default request

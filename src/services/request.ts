import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'
import { useDevMode } from '@/composables/useDevMode'
import { useUserInfoStore } from '@/stores/userInfo'
import { useDevUserStore } from '@/stores/devUser'
import i18n from '@/i18n'

const { isDevMode } = useDevMode()

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8102/aftermarket-parts-management-system/api/v1'
const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || backendBaseUrl

const request = axios.create({
  baseURL: isDevMode.value
    ? backendBaseUrl
    : gatewayBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    if (isDevMode.value) {
      // 调试模式：使用 devUserStore 中选中的用户
      const { authHeader } = useDevUserStore()
      config.headers['x-authentication-header'] = authHeader
    } else {
      // 子应用模式：从 Pinia store 读取父应用传入的 token，通过网关鉴权
      const { accessToken } = useUserInfoStore()
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`
      }
    }

    // 处理 FormData 上传 - 删除默认的 Content-Type，让浏览器自动设置
    if (config.data instanceof FormData && config.headers['Content-Type']) {
      delete config.headers['Content-Type']
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
    if (!(error.config as any)?._silent) {
      console.error('[API Error]', errMsg)
    }

    // SMB 相关错误（503）
    if (error.response?.status === 503) {
      const smbMsg = data?.message
      if (smbMsg === 'SMB_NOT_CONFIGURED') {
        message.error(t('settings.smbNotConfigured'))
      } else if (smbMsg === 'SMB_AUTH_FAILURE') {
        message.error(t('settings.smbAuthFailure'))
      } else if (smbMsg === 'SMB_CONNECTION_ERROR') {
        message.error(t('settings.smbConnectionError'))
      } else {
        message.error(t('settings.smbNotConfigured'))
      }
      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)

export default request

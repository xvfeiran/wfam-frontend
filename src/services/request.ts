import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'
import { useDevMode } from '@/composables/useDevMode'
import { useUserInfoStore } from '@/stores/userInfo'
import { useDevUserStore } from '@/stores/devUser'
import i18n from '@/i18n'

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
      // 调试模式：使用 devUserStore 中选中的用户
      const { authHeader, currentUser } = useDevUserStore()
      // 调试日志：检查认证头是否包含非 ASCII 字符
      console.log('[Dev Mode] Current user:', currentUser)
      console.log('[Dev Mode] Auth header (first 100 chars):', authHeader.substring(0, 100))
      // 检查是否包含非 ASCII 字符
      const hasNonAscii = /[^\x00-\x7F]/.test(authHeader)
      if (hasNonAscii) {
        console.error('[Dev Mode] Auth header contains non-ASCII characters!', authHeader)
      }
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
    console.error('[API Error]', errMsg)
    return Promise.reject(error)
  },
)

export default request

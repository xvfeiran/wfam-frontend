import axios from 'axios'
import type { AxiosResponse } from 'axios'

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

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证头
request.interceptors.request.use(
  (config) => {
    config.headers['x-authentication-header'] = DEV_AUTH_HEADER
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器 - 提取数据，处理错误
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network Error'
    console.error('[API Error]', message)
    return Promise.reject(error)
  },
)

export default request

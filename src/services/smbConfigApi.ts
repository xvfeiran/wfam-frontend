import request from './request'

export interface SmbConfig {
  id?: string
  host: string
  shareName: string
  domain?: string
  user: string
  password: string
  prefix: string
  env: string
  enabled?: boolean
  updatedAt?: string
  updatedBy?: string
}

export interface SmbTestResult {
  status: 'success' | 'error'
  message: string
}

export const smbConfigApi = {
  getConfig(): Promise<SmbConfig | null> {
    return request.get('/smb-configuration') as unknown as Promise<SmbConfig | null>
  },

  saveConfig(data: SmbConfig): Promise<SmbConfig> {
    return request.post('/smb-configuration', data) as unknown as Promise<SmbConfig>
  },

  testConnection(): Promise<SmbTestResult> {
    return request.post('/smb-configuration/test') as unknown as Promise<SmbTestResult>
  },
}

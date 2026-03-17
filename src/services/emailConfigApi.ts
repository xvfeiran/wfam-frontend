import request from './request'

export interface EmailConfig {
  id?: string
  smtpHost: string
  smtpPort: number
  smtpUsername?: string
  smtpDomain?: string
  emailFrom: string
  emailFromDisplayName?: string
  emailPassword: string
  enableSsl?: boolean
  enabled?: boolean
  createdAt?: string
  createdBy?: string
}

export interface TestConnectionResult {
  status: 'success' | 'error'
  message: string
}

export const emailConfigApi = {
  getConfig(): Promise<EmailConfig | null> {
    return request.get('/email-configuration') as unknown as Promise<EmailConfig | null>
  },
  saveConfig(data: EmailConfig): Promise<EmailConfig> {
    return request.post('/email-configuration', data) as unknown as Promise<EmailConfig>
  },
  testConnection(testEmail: string): Promise<TestConnectionResult> {
    return request.post('/email-configuration/test', { testEmail }) as unknown as Promise<TestConnectionResult>
  },
}

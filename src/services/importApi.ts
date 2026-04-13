import request from './request'
import type { ImportRecord } from '@/types'

export interface ImportListParams {
  type?: string
  page?: number
  pageSize?: number
}

export interface PageResult<T> {
  data: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

export interface ImportFileSummary {
  fileName: string
  totalCount: number
  successCount: number
  failCount: number
}

export interface ImportLogsParams {
  fileName: string
  page?: number
  pageSize?: number
}

export const importApi = {
  importReturnOrders(file: File): Promise<ImportRecord> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/imports/return-orders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  importParts(file: File): Promise<ImportRecord> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/imports/parts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  importPartsByFolder(folderPath: string): Promise<ImportRecord> {
    return request.post('/imports/parts/folder', { folderPath })
  },

  getById(id: string): Promise<ImportRecord> {
    return request.get(`/imports/${id}`)
  },

  listFiles(id: string): Promise<ImportFileSummary[]> {
    return request.get(`/imports/${id}/files`)
  },

  listLogsByFile(id: string, params: ImportLogsParams): Promise<PageResult<Record<string, any>>> {
    const adaptedParams: any = { ...params }
    if (adaptedParams.page !== undefined) {
      adaptedParams.page = adaptedParams.page - 1
    }
    if (adaptedParams.pageSize !== undefined) {
      adaptedParams.size = adaptedParams.pageSize
      delete adaptedParams.pageSize
    }
    return request.get(`/imports/${id}/logs`, { params: adaptedParams })
  },

  list(params?: ImportListParams): Promise<PageResult<ImportRecord>> {
    const adaptedParams: any = params ? { ...params } : {}
    if (adaptedParams.page !== undefined) {
      adaptedParams.page = adaptedParams.page - 1
    }
    if (adaptedParams.pageSize !== undefined) {
      adaptedParams.size = adaptedParams.pageSize
      delete adaptedParams.pageSize
    }
    return request.get('/imports', { params: adaptedParams })
  },

  deleteImportedData(id: string): Promise<ImportRecord> {
    return request.delete(`/imports/${id}/records`)
  },
}

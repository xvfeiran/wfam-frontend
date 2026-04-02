import request from './request'

export interface PartCode {
  id?: string
  partCode: string
  businessUnit?: string
  productPlatform?: string
}

export interface PartCodePageParams {
  partCode?: string
  businessUnit?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ascend' | 'descend'
}

export interface PageResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const partCodeApi = {
  list(): Promise<PartCode[]> {
    return request.get('/part-codes') as unknown as Promise<PartCode[]>
  },
  page(params?: PartCodePageParams): Promise<PageResult<PartCode>> {
    const adaptedParams: any = params ? { ...params } : {}
    if (adaptedParams.page !== undefined) {
      adaptedParams.page = adaptedParams.page - 1
    }
    if (adaptedParams.pageSize !== undefined) {
      adaptedParams.size = adaptedParams.pageSize
      delete adaptedParams.pageSize
    }
    if (adaptedParams.sortBy && adaptedParams.sortOrder) {
      const direction = adaptedParams.sortOrder === 'ascend' ? 'asc' : 'desc'
      adaptedParams.sort = `${adaptedParams.sortBy},${direction}`
      delete adaptedParams.sortBy
      delete adaptedParams.sortOrder
    } else if (adaptedParams.sortBy) {
      adaptedParams.sort = `${adaptedParams.sortBy},asc`
      delete adaptedParams.sortBy
      if ('sortOrder' in adaptedParams) {
        delete adaptedParams.sortOrder
      }
    }
    return request.get('/part-codes/page', { params: adaptedParams }) as unknown as Promise<PageResult<PartCode>>
  },
  getById(id: string): Promise<PartCode> {
    return request.get(`/part-codes/${id}`) as unknown as Promise<PartCode>
  },
  create(data: PartCode): Promise<PartCode> {
    return request.post('/part-codes', data) as unknown as Promise<PartCode>
  },
  update(id: string, data: PartCode): Promise<PartCode> {
    return request.put(`/part-codes/${id}`, data) as unknown as Promise<PartCode>
  },
}

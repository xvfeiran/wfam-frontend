import request from './request'

export interface Customer {
  id?: string
  name: string
  code?: string
}

export interface CustomerPageParams {
  name?: string
  code?: string
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

export const customerApi = {
  list(): Promise<Customer[]> {
    return request.get('/customers') as unknown as Promise<Customer[]>
  },
  page(params?: CustomerPageParams): Promise<PageResult<Customer>> {
    const adaptedParams: any = params ? { ...params } : {}
    if (adaptedParams.page !== undefined) {
      adaptedParams.page = adaptedParams.page - 1 // Convert 1-based to 0-based
    }
    if (adaptedParams.pageSize !== undefined) {
      adaptedParams.size = adaptedParams.pageSize
      delete adaptedParams.pageSize
    }
    // Convert sortBy and sortOrder to Spring Data sort format: `field,direction`
    if (adaptedParams.sortBy && adaptedParams.sortOrder) {
      const direction = adaptedParams.sortOrder === 'ascend' ? 'asc' : 'desc'
      adaptedParams.sort = `${adaptedParams.sortBy},${direction}`
      delete adaptedParams.sortBy
      delete adaptedParams.sortOrder
    } else if (adaptedParams.sortBy) {
      // If only sortBy is provided, use default direction 'asc'
      adaptedParams.sort = `${adaptedParams.sortBy},asc`
      delete adaptedParams.sortBy
      if ('sortOrder' in adaptedParams) {
        delete adaptedParams.sortOrder
      }
    }
    return request.get('/customers/page', { params: adaptedParams }) as unknown as Promise<PageResult<Customer>>
  },
  getById(id: string): Promise<Customer> {
    return request.get(`/customers/${id}`) as unknown as Promise<Customer>
  },
  create(data: Customer): Promise<Customer> {
    return request.post('/customers', data) as unknown as Promise<Customer>
  },
  update(id: string, data: Customer): Promise<Customer> {
    return request.put(`/customers/${id}`, data) as unknown as Promise<Customer>
  },
}

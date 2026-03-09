import request from './request'

export interface Customer {
  id?: string
  name: string
  code: string
}

export const customerApi = {
  list(): Promise<Customer[]> {
    return request.get('/customers') as unknown as Promise<Customer[]>
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
  delete(id: string): Promise<void> {
    return request.delete(`/customers/${id}`) as unknown as Promise<void>
  },
}

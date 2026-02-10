import request from './request'

export interface LookupData {
  customers: string[]
  businessUnits: string[]
  productPlatforms: string[]
  failureTypes: string[]
}

export const lookupApi = {
  getAll(): Promise<LookupData> {
    return request.get('/lookups') as unknown as Promise<LookupData>
  },
  getCustomers(): Promise<string[]> {
    return request.get('/lookups/customers') as unknown as Promise<string[]>
  },
  getBusinessUnits(): Promise<string[]> {
    return request.get('/lookups/business-units') as unknown as Promise<string[]>
  },
  getProductPlatforms(): Promise<string[]> {
    return request.get('/lookups/product-platforms') as unknown as Promise<string[]>
  },
  getFailureTypes(): Promise<string[]> {
    return request.get('/lookups/failure-types') as unknown as Promise<string[]>
  },
}

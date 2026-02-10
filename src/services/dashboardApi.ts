import request from './request'
import type { Task } from '@/types'

export interface DashboardStats {
  totalOrders: number
  totalParts: number
  pendingTasks: number
  completionRate: number
}

export interface TrendDataPoint {
  date: string
  orders: number
  parts: number
}

export const dashboardApi = {
  getStats(): Promise<DashboardStats> {
    return request.get('/dashboard/stats') as unknown as Promise<DashboardStats>
  },
  getTasks(): Promise<Task[]> {
    return request.get('/dashboard/tasks') as unknown as Promise<Task[]>
  },
  getTrend(days: number = 30): Promise<TrendDataPoint[]> {
    return request.get('/dashboard/trend', { params: { days } }) as unknown as Promise<TrendDataPoint[]>
  },
}

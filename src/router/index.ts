import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '工作台' },
      },
      // 退货单管理
      {
        path: 'return-orders',
        name: 'ReturnOrders',
        component: () => import('@/views/return-orders/OrderList.vue'),
        meta: { title: '退货单管理' },
      },
      {
        path: 'return-orders/new',
        name: 'ReturnOrderNew',
        component: () => import('@/views/return-orders/OrderForm.vue'),
        meta: { title: '新建退货单' },
      },
      {
        path: 'return-orders/:id',
        name: 'ReturnOrderDetail',
        component: () => import('@/views/return-orders/OrderDetail.vue'),
        meta: { title: '退货单详情' },
      },
      {
        path: 'return-orders/:id/edit',
        name: 'ReturnOrderEdit',
        component: () => import('@/views/return-orders/OrderForm.vue'),
        meta: { title: '编辑退货单' },
      },
      // 售后件管理
      {
        path: 'return-parts',
        name: 'ReturnParts',
        component: () => import('@/views/return-parts/PartList.vue'),
        meta: { title: '售后件管理' },
      },
      {
        path: 'return-parts/new',
        name: 'ReturnPartNew',
        component: () => import('@/views/return-parts/PartForm.vue'),
        meta: { title: '新建售后件' },
      },
      {
        path: 'return-parts/:id',
        name: 'ReturnPartDetail',
        component: () => import('@/views/return-parts/PartDetail.vue'),
        meta: { title: '售后件详情' },
      },
      {
        path: 'return-parts/:id/edit',
        name: 'ReturnPartEdit',
        component: () => import('@/views/return-parts/PartForm.vue'),
        meta: { title: '编辑售后件' },
      },
      {
        path: 'return-parts/:id/analysis',
        name: 'ReturnPartAnalysis',
        component: () => import('@/views/return-parts/AnalysisForm.vue'),
        meta: { title: '精分析表单' },
      },
      // 统计报表
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/Reports.vue'),
        meta: { title: '统计报表' },
      },
      // 审批
      {
        path: 'approval',
        name: 'Approval',
        component: () => import('@/views/approval/Approval.vue'),
        meta: { title: '审批' },
      },
      // 配置
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/Settings.vue'),
        meta: { title: '配置' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

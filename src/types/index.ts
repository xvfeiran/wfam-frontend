// 退货单状态枚举
export enum OrderStatus {
  PENDING_REGISTRATION = 'pending_registration',
  PENDING_INITIAL_ANALYSIS = 'pending_initial_analysis',
  PENDING_SAMPLING = 'pending_sampling',
  SAMPLING_COMPLETED = 'sampling_completed',
  PENDING_DETAILED_ANALYSIS = 'pending_detailed_analysis',
  IN_DETAILED_ANALYSIS = 'in_detailed_analysis',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PENDING_SCRAP = 'pending_scrap',
  SCRAPPED = 'scrapped',
  COMPLETED = 'completed',
}

// 售后件状态枚举
export enum PartStatus {
  REGISTERED = 'registered',
  PENDING_INITIAL_ANALYSIS = 'pending_initial_analysis',
  INITIAL_ANALYSIS_COMPLETED = 'initial_analysis_completed',
  PENDING_DETAILED_ANALYSIS = 'pending_detailed_analysis',
  IN_DETAILED_ANALYSIS = 'in_detailed_analysis',
  ANALYSIS_COMPLETED = 'analysis_completed',
  PENDING_SCRAP = 'pending_scrap',
  SCRAPPED = 'scrapped',
}

// 退回方式枚举
export enum ReturnMethod {
  EXPRESS = 'express',
  PICKUP = 'pickup',
  OTHER = 'other',
}

// 退货单接口
export interface ReturnOrder {
  id: string
  orderNumber: string
  customer: string
  receiveDate: string
  complaintDate: string
  returnMethod: ReturnMethod
  trackingNumber?: string
  returnQuantity: number
  initialAnalysisQuantity: number
  detailedAnalysisQuantity: number
  scrappedQuantity: number
  qcCreatedQuantity: number
  qcNotCreatedQuantity: number
  description?: string
  status: OrderStatus
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
}

// 售后件接口
export interface Part {
  id: string
  partNumber: string
  orderId: string
  orderNumber?: string
  partCode: string
  businessUnit: string
  productPlatform: string
  productionShift?: string
  failureType?: string
  vehicleProductionDate?: string
  vehiclePurchaseDate?: string
  vehicleFailureDate?: string
  vehicleVIN?: string
  vehicleMileage?: number
  customerDescription?: string
  otherDescription?: string
  status: PartStatus
  images: string[]
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
}

// 精分析报告接口
export interface AnalysisReport {
  id: string
  partId: string
  templateId: string
  content: Record<string, any>
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  summary?: string
  attachments?: string[]
  submittedBy?: string
  submittedAt?: string
  approvedBy?: string
  approvedAt?: string
  createdBy: string
  createdAt: string
}

// 任务接口
export interface Task {
  id: string
  type: 'initial_analysis' | 'detailed_analysis' | 'warning' | 'overdue' | 'approval' | 'scrap_confirm'
  title: string
  count: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

// 报表模板接口
export interface ReportTemplate {
  id: string
  name: string
  productPlatform?: string
  failureType?: string
  fields: Array<{
    name: string
    type: 'text' | 'number' | 'date' | 'select' | 'textarea'
    label: string
    required: boolean
    options?: string[]
  }>
}

// 状态日志接口
export interface StatusLog {
  id: string
  entityId: string
  entityType: 'order' | 'part'
  previousStatus: string
  newStatus: string
  operator: string
  operatedAt: string
  comment?: string
}

// 审批状态枚举
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// 审批状态映射
export const APPROVAL_STATUS_MAP: Record<ApprovalStatus, { label: string; color: string }> = {
  [ApprovalStatus.PENDING]: { label: '待审批', color: 'processing' },
  [ApprovalStatus.APPROVED]: { label: '已通过', color: 'success' },
  [ApprovalStatus.REJECTED]: { label: '已驳回', color: 'error' },
}

// 报废申请接口
export interface ScrapApplication {
  id: string
  orderNumber: string
  partNumbers: string
  quantity: number
  applicant?: string
  approver?: string
  applyTime: string
  approveTime?: string
  status: ApprovalStatus
  reason: string
  rejectReason?: string
}

// 精分析申请接口
export interface AnalysisApplication {
  id: string
  reportNumber: string
  partNumber: string
  productPlatform: string
  failureType: string
  submitter?: string
  approver?: string
  submitTime: string
  approveTime?: string
  status: ApprovalStatus
  summary: string
  content: Record<string, string>
}

// 精分析报告字段标签映射
export const ANALYSIS_FIELD_LABELS: Record<string, string> = {
  failureMode: '失效模式',
  failureDescription: '失效现象描述',
  rootCause: '根本原因分析',
  improvement: '改进措施',
  responsibleDept: '责任部门',
}

// 状态显示映射
export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING_REGISTRATION]: { label: '待登记', color: 'default' },
  [OrderStatus.PENDING_INITIAL_ANALYSIS]: { label: '待初分析', color: 'processing' },
  [OrderStatus.PENDING_SAMPLING]: { label: '待抽样', color: 'warning' },
  [OrderStatus.SAMPLING_COMPLETED]: { label: '抽样完成', color: 'success' },
  [OrderStatus.PENDING_DETAILED_ANALYSIS]: { label: '待精分析', color: 'processing' },
  [OrderStatus.IN_DETAILED_ANALYSIS]: { label: '精分析中', color: 'processing' },
  [OrderStatus.PENDING_APPROVAL]: { label: '待审批', color: 'warning' },
  [OrderStatus.APPROVED]: { label: '已审批', color: 'success' },
  [OrderStatus.PENDING_SCRAP]: { label: '待报废', color: 'warning' },
  [OrderStatus.SCRAPPED]: { label: '已报废', color: 'default' },
  [OrderStatus.COMPLETED]: { label: '已完成', color: 'success' },
}

export const PART_STATUS_MAP: Record<PartStatus, { label: string; color: string }> = {
  [PartStatus.REGISTERED]: { label: '已登记', color: 'default' },
  [PartStatus.PENDING_INITIAL_ANALYSIS]: { label: '待初分析', color: 'processing' },
  [PartStatus.INITIAL_ANALYSIS_COMPLETED]: { label: '初分析完成', color: 'success' },
  [PartStatus.PENDING_DETAILED_ANALYSIS]: { label: '待精分析', color: 'processing' },
  [PartStatus.IN_DETAILED_ANALYSIS]: { label: '精分析中', color: 'processing' },
  [PartStatus.ANALYSIS_COMPLETED]: { label: '分析完成', color: 'success' },
  [PartStatus.PENDING_SCRAP]: { label: '待报废', color: 'warning' },
  [PartStatus.SCRAPPED]: { label: '已报废', color: 'default' },
}

export const RETURN_METHOD_MAP: Record<ReturnMethod, string> = {
  [ReturnMethod.EXPRESS]: '快递',
  [ReturnMethod.PICKUP]: '自提',
  [ReturnMethod.OTHER]: '其他',
}

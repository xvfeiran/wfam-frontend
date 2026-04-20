// 退货单状态枚举（v3.0 简化为 2 个状态）
export enum OrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

// 售后件状态枚举（6个状态）
export enum PartStatus {
  IN_INITIAL_ANALYSIS = 'in_initial_analysis',
  IN_DETAILED_ANALYSIS = 'in_detailed_analysis',
  PENDING_APPROVAL = 'pending_approval',
  ANALYSIS_COMPLETED = 'analysis_completed',
  SCRAP_IN_PROGRESS = 'scrap_in_progress',
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
  customerId?: string
  customer: string
  receiveDate: string
  complaintDate: string
  returnMethod: ReturnMethod
  trackingNumber?: string
  returnQuantity: number
  complaintType?: string  // 投诉类型（BA代码，BA40代表售后件）
  initialAnalysisQuantity: number
  detailedAnalysisQuantity: number
  scrappedQuantity: number
  qcCreatedQuantity: number
  qcNotCreatedQuantity: number
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
  failureType?: string        // 客户失效类型（NVH/功能/外观）
  boschFailureType?: string   // 博世失效类型（BA代码）
  responsibleEngineer?: string
  analyst?: string
  repairStationLocation?: string
  vehicleProductionDate?: string
  vehiclePurchaseDate?: string
  vehicleFailureDate?: string
  vehicleVIN?: string
  vehicleMileage?: number
  customerDescription?: string
  otherDescription?: string
  status: PartStatus
  isSample?: number  // 0=未抽样, 1=已抽样
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
  createdBy?: string
  createdAt?: string
  updatedBy?: string
  updatedAt?: string
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
  WITHDRAWN = 'withdrawn',
}

// 审批状态映射
export const APPROVAL_STATUS_MAP: Record<ApprovalStatus, { label: string; color: string }> = {
  [ApprovalStatus.PENDING]: { label: '待审批', color: 'processing' },
  [ApprovalStatus.APPROVED]: { label: '已通过', color: 'success' },
  [ApprovalStatus.REJECTED]: { label: '已驳回', color: 'error' },
  [ApprovalStatus.WITHDRAWN]: { label: '已撤回', color: 'default' },
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

// 分析单状态枚举（6个状态）
export enum AnalysisOrderStatus {
  PENDING_SAMPLING = 'pending_sampling',
  IN_DETAILED_ANALYSIS = 'in_detailed_analysis',
  PENDING_APPROVAL = 'pending_approval',
  ANALYSIS_COMPLETED = 'analysis_completed',
  WORKON_SCRAP_IN_PROGRESS = 'workon_scrap_in_progress',
  WORKON_SCRAPPED = 'workon_scrapped',
}

// 分析单接口
export interface AnalysisOrder {
  id: string
  orderId: string
  orderNumber?: string
  analyst: string
  status: AnalysisOrderStatus
  statusChangedAt?: string
  parts?: Part[]
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
}

// 状态显示映射
export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.DRAFT]: { label: '草稿', color: 'default' },
  [OrderStatus.SUBMITTED]: { label: '已提交', color: 'processing' },
}

export const ANALYSIS_ORDER_STATUS_MAP: Record<AnalysisOrderStatus, { label: string; color: string }> = {
  [AnalysisOrderStatus.PENDING_SAMPLING]: { label: '待抽样', color: 'warning' },
  [AnalysisOrderStatus.IN_DETAILED_ANALYSIS]: { label: '精分析中', color: 'processing' },
  [AnalysisOrderStatus.PENDING_APPROVAL]: { label: '精分析/审批中', color: 'warning' },
  [AnalysisOrderStatus.ANALYSIS_COMPLETED]: { label: '精分析/审批完成', color: 'success' },
  [AnalysisOrderStatus.WORKON_SCRAP_IN_PROGRESS]: { label: 'WorkOn报废中', color: 'error' },
  [AnalysisOrderStatus.WORKON_SCRAPPED]: { label: '已报废', color: 'purple' },
}

export const PART_STATUS_MAP: Record<PartStatus, { label: string; color: string }> = {
  [PartStatus.IN_INITIAL_ANALYSIS]: { label: '信息录入中', color: 'processing' },
  [PartStatus.IN_DETAILED_ANALYSIS]: { label: '精分析中', color: 'processing' },
  [PartStatus.PENDING_APPROVAL]: { label: '精分析/审批中', color: 'warning' },
  [PartStatus.ANALYSIS_COMPLETED]: { label: '精分析/审批完成', color: 'success' },
  [PartStatus.SCRAP_IN_PROGRESS]: { label: 'WorkOn报废中', color: 'warning' },
  [PartStatus.SCRAPPED]: { label: '已报废', color: 'default' },
}

export const RETURN_METHOD_MAP: Record<ReturnMethod, string> = {
  [ReturnMethod.EXPRESS]: '快递',
  [ReturnMethod.PICKUP]: '自提',
  [ReturnMethod.OTHER]: '其他',
}

// 导入记录接口
export interface ImportRecord {
  id: string
  importType: string
  fileName: string
  status: string
  totalCount: number
  successCount: number
  failCount: number
  failLogs: string    // JSON: [{row, status:"failed", error, rawData}]
  importLogs: string  // JSON: 完整日志（成功+失败）
  createdBy: string
  createdAt: string
}

export interface ImportLogEntry {
  fileName?: string
  row: number
  status: 'success' | 'failed'
  errorCode?: string
  // 成功时有
  orderId?: string
  orderNumber?: string
  receiveDate?: string
  trackingNumber?: string
  // 失败时有
  error?: string
  rawData?: Record<string, string>
}

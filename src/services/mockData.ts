import type { ReturnOrder, Part, Task, AnalysisReport, ReportTemplate } from '@/types'
import { OrderStatus, PartStatus, ReturnMethod } from '@/types'

// Mock延迟函数
export const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 客户列表
export const CUSTOMERS = [
  '一汽大众',
  '上汽大众',
  '宝马',
  '奔驰',
  '奥迪',
  '长城汽车',
  '比亚迪',
  '吉利汽车',
]

// 业务单元列表
export const BUSINESS_UNITS = ['BU1', 'BU2', 'BU3', 'BU4']

// 产品平台列表
export const PRODUCT_PLATFORMS = ['PLT1', 'PLT2', 'PLT3', 'PLT4', 'PLT5']

// Mock退货单数据
export const MOCK_ORDERS: ReturnOrder[] = [
  {
    id: '1',
    orderNumber: 'RO-2026-0001',
    customer: '一汽大众',
    receiveDate: '2026-01-15',
    complaintDate: '2026-01-10',
    returnMethod: ReturnMethod.EXPRESS,
    trackingNumber: 'SF1234567890',
    returnQuantity: 50,
    initialAnalysisQuantity: 50,
    detailedAnalysisQuantity: 5,
    scrappedQuantity: 0,
    qcCreatedQuantity: 3,
    qcNotCreatedQuantity: 2,
    description: '客户反馈产品异响，怠速时异响明显',
    status: OrderStatus.PENDING_DETAILED_ANALYSIS,
    createdBy: '张三',
    createdAt: '2026-01-15 09:00:00',
  },
  {
    id: '2',
    orderNumber: 'RO-2026-0002',
    customer: '上汽大众',
    receiveDate: '2026-01-18',
    complaintDate: '2026-01-15',
    returnMethod: ReturnMethod.PICKUP,
    returnQuantity: 30,
    initialAnalysisQuantity: 30,
    detailedAnalysisQuantity: 3,
    scrappedQuantity: 0,
    qcCreatedQuantity: 2,
    qcNotCreatedQuantity: 1,
    description: '传感器数据异常',
    status: OrderStatus.PENDING_SAMPLING,
    createdBy: '李四',
    createdAt: '2026-01-18 10:30:00',
  },
  {
    id: '3',
    orderNumber: 'RO-2026-0003',
    customer: '宝马',
    receiveDate: '2026-01-20',
    complaintDate: '2026-01-18',
    returnMethod: ReturnMethod.EXPRESS,
    trackingNumber: 'YT9876543210',
    returnQuantity: 20,
    initialAnalysisQuantity: 20,
    detailedAnalysisQuantity: 2,
    scrappedQuantity: 10,
    qcCreatedQuantity: 2,
    qcNotCreatedQuantity: 0,
    description: '电路板故障',
    status: OrderStatus.PENDING_SCRAP,
    createdBy: '王五',
    createdAt: '2026-01-20 14:00:00',
  },
  {
    id: '4',
    orderNumber: 'RO-2026-0004',
    customer: '奔驰',
    receiveDate: '2026-01-22',
    complaintDate: '2026-01-20',
    returnMethod: ReturnMethod.EXPRESS,
    trackingNumber: 'ZT1122334455',
    returnQuantity: 15,
    initialAnalysisQuantity: 15,
    detailedAnalysisQuantity: 0,
    scrappedQuantity: 0,
    qcCreatedQuantity: 0,
    qcNotCreatedQuantity: 0,
    description: '接口松动',
    status: OrderStatus.PENDING_INITIAL_ANALYSIS,
    createdBy: '赵六',
    createdAt: '2026-01-22 16:00:00',
  },
  {
    id: '5',
    orderNumber: 'RO-2026-0005',
    customer: '奥迪',
    receiveDate: '2026-01-25',
    complaintDate: '2026-01-23',
    returnMethod: ReturnMethod.OTHER,
    returnQuantity: 45,
    initialAnalysisQuantity: 45,
    detailedAnalysisQuantity: 5,
    scrappedQuantity: 20,
    qcCreatedQuantity: 5,
    qcNotCreatedQuantity: 0,
    status: OrderStatus.COMPLETED,
    createdBy: '钱七',
    createdAt: '2026-01-25 09:30:00',
  },
]

// Mock售后件数据
export const MOCK_PARTS: Part[] = [
  {
    id: '1',
    partNumber: 'BU1-PLT1-0001',
    orderId: '1',
    orderNumber: 'RO-2026-0001',
    partCode: 'RB-12345-AB',
    businessUnit: 'BU1',
    productPlatform: 'PLT1',
    productionShift: 'A班',
    vehicleProductionDate: '2025-06-15',
    vehiclePurchaseDate: '2025-07-20',
    vehicleFailureDate: '2026-01-10',
    vehicleVIN: 'LSVAB2183E2123456',
    vehicleMileage: 15234,
    customerDescription: '发动机异响，怠速不稳',
    status: PartStatus.PENDING_DETAILED_ANALYSIS,
    images: [],
    createdBy: '李四',
    createdAt: '2026-01-16 10:00:00',
  },
  {
    id: '2',
    partNumber: 'BU1-PLT1-0002',
    orderId: '1',
    orderNumber: 'RO-2026-0001',
    partCode: 'RB-12345-AC',
    businessUnit: 'BU1',
    productPlatform: 'PLT1',
    productionShift: 'B班',
    vehicleProductionDate: '2025-06-18',
    vehiclePurchaseDate: '2025-08-10',
    vehicleFailureDate: '2026-01-08',
    vehicleVIN: 'LSVAB2183E2123457',
    vehicleMileage: 12560,
    customerDescription: '怠速抖动',
    status: PartStatus.PENDING_DETAILED_ANALYSIS,
    images: [],
    createdBy: '李四',
    createdAt: '2026-01-16 10:30:00',
  },
  {
    id: '3',
    partNumber: 'BU2-PLT3-0001',
    orderId: '2',
    orderNumber: 'RO-2026-0002',
    partCode: 'RB-67890-XY',
    businessUnit: 'BU2',
    productPlatform: 'PLT3',
    vehicleProductionDate: '2025-05-20',
    vehiclePurchaseDate: '2025-06-15',
    vehicleFailureDate: '2026-01-12',
    vehicleVIN: 'LSVCD4291F3456789',
    vehicleMileage: 28900,
    customerDescription: '传感器读数不准确',
    status: PartStatus.REGISTERED,
    images: [],
    createdBy: '王五',
    createdAt: '2026-01-19 09:00:00',
  },
  {
    id: '4',
    partNumber: 'BU3-PLT2-0001',
    orderId: '3',
    orderNumber: 'RO-2026-0003',
    partCode: 'RB-11111-ZZ',
    businessUnit: 'BU3',
    productPlatform: 'PLT2',
    vehicleProductionDate: '2025-04-10',
    vehiclePurchaseDate: '2025-05-05',
    vehicleFailureDate: '2026-01-15',
    vehicleVIN: 'WVWEF5382G1234567',
    vehicleMileage: 35000,
    customerDescription: '电路板烧毁',
    status: PartStatus.ANALYSIS_COMPLETED,
    images: [],
    createdBy: '赵六',
    createdAt: '2026-01-21 11:00:00',
  },
  {
    id: '5',
    partNumber: 'BU1-PLT4-0001',
    orderId: '4',
    orderNumber: 'RO-2026-0004',
    partCode: 'RB-22222-AA',
    businessUnit: 'BU1',
    productPlatform: 'PLT4',
    vehicleProductionDate: '2025-07-01',
    vehiclePurchaseDate: '2025-08-15',
    vehicleFailureDate: '2026-01-18',
    vehicleVIN: 'WBA3A5C50EF123456',
    vehicleMileage: 8500,
    customerDescription: '连接器松动导致断电',
    status: PartStatus.PENDING_INITIAL_ANALYSIS,
    images: [],
    createdBy: '钱七',
    createdAt: '2026-01-23 14:00:00',
  },
]

// Mock任务数据
export const MOCK_TASKS: Task[] = [
  { id: '1', type: 'initial_analysis', title: '待初分析', count: 15, priority: 'medium' },
  { id: '2', type: 'detailed_analysis', title: '待精分析', count: 8, priority: 'medium' },
  { id: '3', type: 'warning', title: '精分析预警', count: 3, priority: 'high' },
  { id: '4', type: 'overdue', title: '精分析超期', count: 2, priority: 'urgent' },
  { id: '5', type: 'approval', title: '精分析报告待审批', count: 5, priority: 'medium' },
  { id: '6', type: 'scrap_confirm', title: '报废审批确认', count: 4, priority: 'medium' },
]

// 失效类型列表
export const FAILURE_TYPES = ['噪音', '断裂', '变形', '异响', '渗漏', '其他']

// Mock报告模板 - 按产品平台和失效类型匹配
export const MOCK_TEMPLATES: ReportTemplate[] = [
  {
    id: 'template-plt1-noise',
    name: 'PLT1-噪音分析模板',
    productPlatform: 'PLT1',
    failureType: '噪音',
    fields: [
      { name: 'noiseType', type: 'select', label: '噪音类型', required: true, options: ['啸叫', '异响', '振动噪音', '其他'] },
      { name: 'noiseFrequency', type: 'text', label: '噪音频率(Hz)', required: true },
      { name: 'failureDescription', type: 'textarea', label: '失效现象描述', required: true },
      { name: 'rootCause', type: 'textarea', label: '根本原因分析', required: true },
      { name: 'improvement', type: 'textarea', label: '改进措施', required: true },
      { name: 'responsibleDept', type: 'select', label: '责任部门', required: true, options: ['质量部', '工程部', '生产部', '采购部'] },
      { name: 'expectedDate', type: 'date', label: '预计完成时间', required: true },
    ],
  },
  {
    id: 'template-plt1-fracture',
    name: 'PLT1-断裂分析模板',
    productPlatform: 'PLT1',
    failureType: '断裂',
    fields: [
      { name: 'fractureType', type: 'select', label: '断裂类型', required: true, options: ['疲劳断裂', '脆性断裂', '应力断裂', '其他'] },
      { name: 'fractureLocation', type: 'text', label: '断裂位置', required: true },
      { name: 'failureDescription', type: 'textarea', label: '失效现象描述', required: true },
      { name: 'rootCause', type: 'textarea', label: '根本原因分析', required: true },
      { name: 'improvement', type: 'textarea', label: '改进措施', required: true },
      { name: 'responsibleDept', type: 'select', label: '责任部门', required: true, options: ['质量部', '工程部', '生产部', '采购部'] },
      { name: 'expectedDate', type: 'date', label: '预计完成时间', required: true },
    ],
  },
  {
    id: 'template-plt2-leak',
    name: 'PLT2-渗漏分析模板',
    productPlatform: 'PLT2',
    failureType: '渗漏',
    fields: [
      { name: 'leakType', type: 'select', label: '渗漏类型', required: true, options: ['油渗漏', '气体渗漏', '液压渗漏', '其他'] },
      { name: 'leakLocation', type: 'text', label: '渗漏位置', required: true },
      { name: 'leakRate', type: 'text', label: '渗漏量', required: false },
      { name: 'failureDescription', type: 'textarea', label: '失效现象描述', required: true },
      { name: 'rootCause', type: 'textarea', label: '根本原因分析', required: true },
      { name: 'improvement', type: 'textarea', label: '改进措施', required: true },
      { name: 'responsibleDept', type: 'select', label: '责任部门', required: true, options: ['质量部', '工程部', '生产部', '采购部'] },
      { name: 'expectedDate', type: 'date', label: '预计完成时间', required: true },
    ],
  },
  {
    id: 'template-default',
    name: '通用精分析模板',
    productPlatform: '',
    failureType: '',
    fields: [
      { name: 'failureMode', type: 'select', label: '失效模式', required: true, options: ['电气失效', '机械失效', '材料失效', '其他'] },
      { name: 'failureDescription', type: 'textarea', label: '失效现象描述', required: true },
      { name: 'rootCause', type: 'textarea', label: '根本原因分析', required: true },
      { name: 'improvement', type: 'textarea', label: '改进措施', required: true },
      { name: 'responsibleDept', type: 'select', label: '责任部门', required: true, options: ['质量部', '工程部', '生产部', '采购部'] },
      { name: 'expectedDate', type: 'date', label: '预计完成时间', required: true },
    ],
  },
]

// Mock精分析报告
export const MOCK_REPORTS: AnalysisReport[] = [
  {
    id: 'report-1',
    partId: '4',
    templateId: 'template-1',
    content: {
      failureMode: '电气失效',
      failureDescription: '电路板在高温环境下工作导致元器件损坏',
      rootCause: '散热设计不足，长时间高负载运行导致温度过高',
      improvement: '优化散热结构，增加散热片面积',
      responsibleDept: '工程部',
      expectedDate: '2026-02-28',
    },
    status: 'approved',
    summary: '电路板高温失效分析报告',
    createdBy: '赵六',
    createdAt: '2026-01-22 15:00:00',
    submittedBy: '赵六',
    submittedAt: '2026-01-22 16:00:00',
    approvedBy: '主管',
    approvedAt: '2026-01-23 10:00:00',
  },
]

// 趋势数据生成
export const generateTrendData = (days: number) => {
  const data = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toISOString().split('T')[0],
      orders: Math.floor(Math.random() * 20) + 5,
      parts: Math.floor(Math.random() * 50) + 20,
    })
  }
  return data
}

// 客户排名数据
export const CUSTOMER_RANKING = [
  { customer: '一汽大众', count: 150 },
  { customer: '上汽大众', count: 120 },
  { customer: '宝马', count: 95 },
  { customer: '奔驰', count: 88 },
  { customer: '奥迪', count: 75 },
  { customer: '长城汽车', count: 60 },
  { customer: '比亚迪', count: 45 },
  { customer: '吉利汽车', count: 30 },
]

// 失效模式分布
export const FAILURE_MODE_DATA = [
  { name: '电气失效', value: 35 },
  { name: '机械失效', value: 28 },
  { name: '材料失效', value: 20 },
  { name: '其他', value: 17 },
]

// 业务单元分布
export const BU_DISTRIBUTION = [
  { name: 'BU1', value: 40 },
  { name: 'BU2', value: 25 },
  { name: 'BU3', value: 20 },
  { name: 'BU4', value: 15 },
]

// 处理时效数据
export const PROCESSING_TIME_DATA = [
  { stage: '初分析', avgDays: 2.5 },
  { stage: '抽样', avgDays: 1.2 },
  { stage: '精分析', avgDays: 5.8 },
  { stage: '审批', avgDays: 1.5 },
  { stage: '报废', avgDays: 3.2 },
]

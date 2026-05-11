import request from './request'

export interface OcrResult {
  vehicleProductionDate?: string
  vehiclePurchaseDate?: string
  vehicleFailureDate?: string
  vehicleVIN?: string
  vehicleMileage?: number
  customerDescription?: string
  repairStation?: string
  complaintLocation?: string
}

export interface OcrTask {
  taskId: string
  partId?: string
  /** CREATED | PROCESSING | SUCCESS | FAILED */
  status: 'CREATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
  result?: OcrResult
  errorMessage?: string
  createdAt?: string
}

export const ocrApi = {
  /**
   * 上传图片，创建 OCR 任务，立即返回 taskId。
   * partId 在编辑模式下传入实现立即绑定；新建模式可省略。
   */
  createTask(file: File, partId?: string): Promise<OcrTask> {
    const formData = new FormData()
    formData.append('file', file)
    if (partId) formData.append('partId', partId)
    return request.post('/ocr/tasks', formData) as unknown as Promise<OcrTask>
  },

  /** 查询 OCR 任务状态（前端每 3s 轮询） */
  getTask(taskId: string): Promise<OcrTask> {
    return request.get(`/ocr/tasks/${taskId}`) as unknown as Promise<OcrTask>
  },

  getLatestTaskByPartId(partId: string): Promise<OcrTask> {
    return request.get('/ocr/tasks/latest', { params: { partId } }) as unknown as Promise<OcrTask>
  },

  getTaskImage(taskId: string): Promise<Blob> {
    return request.get(`/ocr/tasks/${taskId}/image`, { responseType: 'blob' }) as unknown as Promise<Blob>
  },

  retryTask(taskId: string): Promise<OcrTask> {
    return request.post(`/ocr/tasks/${taskId}/retry`) as unknown as Promise<OcrTask>
  },
}

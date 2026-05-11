import request from './request'

export interface ImageUploadResult {
  relativePath: string
  url: string
}

const FILE_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8102/aftermarket-parts-management-system/api/v1'

export const fileApi = {
  /** 获取文件完整 URL（用于 img src，直接请求后端，不经过 Axios） */
  getFileUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) return relativePath
    return `${FILE_BASE}/files/${relativePath}`
  },

  /** 通用上传（不关联任何实体，适用于新建场景） */
  upload(file: File): Promise<ImageUploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/files/upload', formData) as unknown as Promise<ImageUploadResult>
  },
}

export const partImageApi = {
  /** 上传售后件缺陷照片 */
  upload(partId: string, file: File): Promise<ImageUploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`/parts/${partId}/images`, formData) as unknown as Promise<ImageUploadResult>
  },

  /** 删除售后件缺陷照片 */
  delete(partId: string, imageRelativePath: string): Promise<void> {
    // imageRelativePath = "parts/{partId}/{uuid}.jpg", we need just the filename part
    const fileName = imageRelativePath.split('/').pop()!
    return request.delete(`/parts/${partId}/images/${fileName}`) as unknown as Promise<void>
  },
}

export const analysisAttachmentApi = {
  /** 上传精分析附件 */
  upload(reportId: string, file: File): Promise<ImageUploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`/analysis-reports/${reportId}/attachments`, formData) as unknown as Promise<ImageUploadResult>
  },

  /** 删除精分析附件 */
  delete(reportId: string, attachmentRelativePath: string): Promise<void> {
    const fileName = attachmentRelativePath.split('/').pop()!
    return request.delete(`/analysis-reports/${reportId}/attachments/${fileName}`) as unknown as Promise<void>
  },
}

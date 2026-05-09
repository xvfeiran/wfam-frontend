<template>
  <a-card class="ocr-zone-card" :title="t('returnPart.ocrRecognition')">
    <!-- 隐藏文件输入：普通上传 -->
    <input
      ref="uploadInputRef"
      type="file"
      accept="image/jpeg,image/png,image/jpg"
      style="display: none"
      @change="onFileChange"
    />

    <!-- 拍照区域主体 -->
    <div
      class="ocr-zone"
      :class="`ocr-zone--${zoneState}`"
    >
      <!-- 空闲：两个入口按钮 -->
      <template v-if="zoneState === 'idle'">
        <div class="ocr-idle">
          <div class="ocr-idle__buttons">
            <div class="ocr-idle__btn" @click="triggerCamera">
              <CameraOutlined class="ocr-idle__btn-icon" />
              <span>{{ t('ocr.takePhoto') }}</span>
            </div>
            <div class="ocr-idle__divider" />
            <div class="ocr-idle__btn" @click="triggerUpload">
              <UploadOutlined class="ocr-idle__btn-icon" />
              <span>{{ t('ocr.uploadPhoto') }}</span>
            </div>
          </div>
          <p class="ocr-idle__hint">{{ t('returnPart.ocrTip') }}</p>
        </div>
      </template>

      <!-- 上传中 -->
      <template v-else-if="zoneState === 'uploading'">
        <div class="ocr-status-overlay">
          <div class="ocr-preview-clickable" @click="showPreviewModal = true">
            <img v-if="previewUrl" :src="previewUrl" class="ocr-preview" alt="OCR Preview" />
          </div>
          <div class="ocr-overlay">
            <a-spin size="large" />
            <p>{{ t('ocr.uploading') }}</p>
          </div>
        </div>
      </template>

      <!-- 识别中 -->
      <template v-else-if="zoneState === 'processing'">
        <div class="ocr-status-overlay">
          <div class="ocr-preview-clickable" @click="showPreviewModal = true">
            <img v-if="previewUrl" :src="previewUrl" class="ocr-preview" alt="OCR Preview" />
          </div>
          <div class="ocr-overlay">
            <a-spin size="large" />
            <p>{{ t('returnPart.ocrLoading') }}</p>
            <p class="ocr-overlay__hint">{{ t('ocr.processingHint', { seconds: elapsedSeconds }) }}</p>
          </div>
        </div>
      </template>

      <!-- 识别成功 -->
      <template v-else-if="zoneState === 'success'">
        <div class="ocr-result-area">
          <div class="ocr-result-area__preview" @click="showPreviewModal = true">
            <img v-if="previewUrl" :src="previewUrl" class="ocr-preview-thumb" alt="OCR Preview" />
            <CheckCircleFilled class="ocr-result-area__badge ocr-result-area__badge--success" />
          </div>
          <div class="ocr-result-area__fields">
            <div class="ocr-result-area__header">
              <p class="ocr-result-area__title">
                <CheckCircleOutlined style="color: #52c41a; margin-right: 6px;" />
                {{ t('returnPart.ocrComplete') }}
              </p>
              <a-button size="small" @click="showPreviewModal = true">
                <EyeOutlined /> {{ t('ocr.preview') }}
              </a-button>
            </div>
            <div class="ocr-field-list">
              <div
                v-for="field in OCR_FIELDS"
                :key="field"
                class="ocr-field-item"
                :class="{
                  'ocr-field-item--success': ocrResults[field]?.status === 'success',
                  'ocr-field-item--error': ocrResults[field]?.status === 'error',
                }"
              >
                <span class="ocr-field-item__label">{{ t(`returnPart.${field}`) }}</span>
                <span v-if="ocrResults[field]?.status === 'success'" class="ocr-field-item__value">
                  {{ ocrResults[field].value }}
                </span>
                <span v-else class="ocr-field-item__miss">{{ t('ocr.fieldNotRecognized') }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 识别失败 -->
      <template v-else-if="zoneState === 'failed'">
        <div class="ocr-status-overlay">
          <div class="ocr-preview-clickable" @click="showPreviewModal = true">
            <img v-if="previewUrl" :src="previewUrl" class="ocr-preview" alt="OCR Preview" />
          </div>
          <div class="ocr-overlay ocr-overlay--failed">
            <CloseCircleFilled class="ocr-overlay__icon" />
            <p>{{ t('ocr.degraded') }}</p>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部操作栏 -->
    <div class="ocr-zone-actions">
      <!-- 识别中：停止 -->
      <a-button v-if="zoneState === 'processing' || zoneState === 'uploading'" @click="$emit('stopOCR')">
        {{ t('returnPart.stopRecognition') }}
      </a-button>

      <!-- 成功 / 失败：重新选择 -->
      <template v-if="zoneState === 'success' || zoneState === 'failed'">
        <a-button v-if="zoneState === 'failed'" type="primary" @click="$emit('retryOCR')">
          {{ t('ocr.retryRecognition') }}
        </a-button>
        <a-button @click="triggerCamera">
          <CameraOutlined /> {{ t('ocr.takePhoto') }}
        </a-button>
        <a-button @click="triggerUpload">
          <UploadOutlined /> {{ t('ocr.uploadPhoto') }}
        </a-button>
      </template>
    </div>

    <!-- OCR 预览模态框 -->
    <OCRPreviewModal
      v-model:visible="showPreviewModal"
      :image-url="previewUrl"
      :ocr-results="ocrResults"
      @confirm="handlePreviewConfirm"
    />

    <!-- 摄像头拍照弹窗 -->
    <CameraCapture
      v-model:open="cameraOpen"
      :hint="t('ocr.captureHint')"
      @captured="onCameraCaptured"
    />
  </a-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CameraOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  EyeOutlined,
} from '@ant-design/icons-vue'
import type { OcrZoneState, OCRResultItem } from '@/composables/useOCR'
import OCRPreviewModal from './OCRPreviewModal.vue'
import CameraCapture from '@/components/CameraCapture.vue'

const OCR_FIELDS = [
  'vehicleProductionDate',
  'vehiclePurchaseDate',
  'vehicleFailureDate',
  'vehicleVIN',
  'vehicleMileage',
  'customerDescription',
] as const

interface Props {
  zoneState: OcrZoneState
  previewUrl: string
  ocrResults: Record<string, OCRResultItem>
  elapsedSeconds?: number
}

withDefaults(defineProps<Props>(), {
  zoneState: 'idle',
  previewUrl: '',
  elapsedSeconds: 0,
})

const emit = defineEmits<{
  (e: 'handleOCRUpload', file: File): void
  (e: 'retryOCR'): void
  (e: 'stopOCR'): void
  (e: 'retake'): void
  (e: 'previewConfirm', form: Record<string, any>): void
}>()

const { t } = useI18n()
const uploadInputRef = ref<HTMLInputElement | null>(null)
const showPreviewModal = ref(false)
const cameraOpen = ref(false)

const triggerUpload = () => uploadInputRef.value?.click()
const triggerCamera = () => { cameraOpen.value = true }

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('handleOCRUpload', file)
    input.value = ''
  }
}

const onCameraCaptured = (file: File) => {
  emit('handleOCRUpload', file)
}

const handlePreviewConfirm = (form: Record<string, any>) => {
  emit('previewConfirm', form)
}
</script>

<style lang="less" scoped>
.ocr-zone-card {
  margin-bottom: 16px;

  :deep(.ant-card-body) {
    padding-bottom: 12px;
  }
}

.ocr-zone {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.25s, background 0.25s;
  overflow: hidden;
  position: relative;

  &--processing,
  &--uploading {
    border-color: #1677ff;
    border-style: dashed;
  }

  &--success {
    border-color: #52c41a;
    border-style: solid;
    align-items: flex-start;
    min-height: 200px;
  }

  &--failed {
    border-color: #ff4d4f;
    border-style: dashed;
  }
}

// ── 空闲状态：两个入口 ─────────────────────────────────────────
.ocr-idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 28px 24px;
  width: 100%;

  &__buttons {
    display: flex;
    align-items: stretch;
    gap: 0;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    background: #fafafa;
  }

  &__btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px 40px;
    cursor: pointer;
    font-size: 13px;
    color: #595959;
    transition: background 0.2s, color 0.2s;
    user-select: none;
    flex: 1;

    &:hover {
      background: #e6f4ff;
      color: #1677ff;

      .ocr-idle__btn-icon {
        color: #1677ff;
      }
    }

    &:active {
      background: #bae0ff;
    }
  }

  &__btn-icon {
    font-size: 28px;
    color: #8c8c8c;
    transition: color 0.2s;
  }

  &__divider {
    width: 1px;
    background: #e8e8e8;
    flex-shrink: 0;
  }

  &__hint {
    margin: 0;
    font-size: 12px;
    color: #bfbfbf;
  }
}

// ── 图片覆盖层（上传中 / 识别中 / 失败）──────────────────────────
.ocr-status-overlay {
  position: relative;
  width: 100%;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ocr-preview {
  max-height: 200px;
  max-width: 100%;
  object-fit: contain;
  display: block;

  :deep(img) {
    max-height: 200px;
    max-width: 100%;
    object-fit: contain;
  }
}

.ocr-preview-clickable {
  max-height: 200px;
  max-width: 100%;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  .ocr-preview {
    width: 100%;
    height: 100%;
  }
}

.ocr-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.82);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  color: #1677ff;
  pointer-events: none; // 保证图片预览按钮仍可点击

  &__hint {
    font-size: 12px;
    color: #8c8c8c;
    margin: 0;
  }

  &__icon {
    font-size: 32px;
  }

  &--failed {
    color: #ff4d4f;
    background: rgba(255, 77, 79, 0.06);
    pointer-events: none;

    p { margin: 0; }
  }

  p { margin: 0; }
}

// ── 识别成功结果区 ────────────────────────────────────────────
.ocr-result-area {
  display: flex;
  width: 100%;
  gap: 16px;
  padding: 12px;

  &__preview {
    position: relative;
    flex-shrink: 0;
  }

  &__badge {
    position: absolute;
    bottom: -6px;
    right: -6px;
    font-size: 20px;

    &--success { color: #52c41a; }
  }

  &__fields {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: #262626;
  }
}

.ocr-preview-thumb {
  max-height: 120px;
  max-width: 200px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  display: block;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
}

.ocr-field-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ocr-field-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 3px 0;

  &__label {
    color: #8c8c8c;
    flex-shrink: 0;
    min-width: 80px;
  }

  &__value {
    color: #262626;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__miss {
    color: #bfbfbf;
    font-style: italic;
  }

  &--success &__label { color: #52c41a; }
  &--error  &__label { color: #bfbfbf; }
}

.ocr-zone-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  justify-content: flex-end;
}
</style>

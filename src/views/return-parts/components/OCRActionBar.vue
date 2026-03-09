<template>
  <a-card class="ocr-card">
    <div class="ocr-actions">
      <a-space>
        <a-upload
          :before-upload="handleOCRUpload"
          :show-upload-list="false"
          accept="image/*"
        >
          <a-button type="primary" :loading="ocrLoading">
            <CameraOutlined /> {{ t('returnPart.ocrRecognition') }}
          </a-button>
        </a-upload>
        <a-button v-if="ocrLoading" @click="stopOCR">
          {{ t('returnPart.stopRecognition') }}
        </a-button>
        <a-button v-if="hasOCRResults" @click="applyAllOCR">
          {{ t('common.applyAll') }}
        </a-button>
      </a-space>
      <div class="ocr-status">
        <template v-if="ocrLoading">
          <a-spin size="small" />
          <span class="status-text loading">{{ t('returnPart.ocrLoading') }}</span>
        </template>
        <template v-else-if="hasOCRResults">
          <CheckCircleOutlined class="status-icon success" />
          <span class="status-text success">{{ t('returnPart.ocrComplete') }}</span>
        </template>
        <span v-else class="ocr-tip">{{ t('returnPart.ocrTip') }}</span>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CameraOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'

interface Emits {
  (e: 'handleOCRUpload', file: File): Promise<void>
  (e: 'stopOCR'): void
  (e: 'applyAllOCR'): void
}

defineEmits<Emits>()

interface Props {
  ocrLoading: boolean
  hasOCRResults: boolean
}

withDefaults(defineProps<Props>(), {
  ocrLoading: false,
  hasOCRResults: false
})

const { t } = useI18n()

const handleOCRUpload = (file: File) => {
  emit('handleOCRUpload', file)
  return false
}

defineExpose({ handleOCRUpload })
</script>

<style lang="less" scoped>
.ocr-card {
  margin-bottom: 16px;

  .ocr-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .ocr-status {
      display: flex;
      align-items: center;
      gap: 8px;

      .status-icon {
        font-size: 16px;

        &.success {
          color: #52c41a;
        }
      }

      .status-text {
        font-size: 14px;

        &.loading {
          color: #1890ff;
        }

        &.success {
          color: #52c41a;
        }
      }

      .ocr-tip {
        color: #999;
        font-size: 12px;
      }
    }
  }
}
</style>

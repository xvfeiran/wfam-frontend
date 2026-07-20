<template>
  <a-card :title="t('returnPart.photoUpload')" class="upload-card">
    <!-- Hidden file input (image-only) -->
    <input
      ref="uploadInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/bmp"
      multiple
      style="display: none"
      @change="onFileInputChange"
    />

    <!-- OCR-style action buttons -->
    <div v-if="fileList.length < 20" class="upload-idle">
      <div class="upload-idle__buttons">
        <div class="upload-idle__btn" @click="triggerUpload">
          <UploadOutlined class="upload-idle__btn-icon" />
          <span>{{ t('ocr.uploadPhoto') }}</span>
        </div>
        <div class="upload-idle__divider" />
        <div class="upload-idle__btn" @click="cameraOpen = true">
          <CameraOutlined class="upload-idle__btn-icon" />
          <span>{{ t('ocr.takePhoto') }}</span>
        </div>
      </div>
    </div>

    <!-- File list display (trigger card hidden via CSS) -->
    <a-upload
      :file-list="fileList"
      list-type="picture-card"
      class="upload-grid"
      @preview="handlePreview"
      @remove="handleRemove"
    >
      <span style="display:none"></span>
    </a-upload>

    <div class="upload-tip">
      {{ t('returnPart.uploadTip') }}
    </div>
  </a-card>

  <!-- 图片预览 -->
  <a-modal :open="previewVisible" :footer="null" @cancel="previewVisible = false">
    <img :src="previewImage" style="width: 100%" />
  </a-modal>

  <!-- 摄像头拍照弹窗 -->
  <CameraCapture
    v-model:open="cameraOpen"
    @captured="onCameraCaptured"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { CameraOutlined, UploadOutlined } from '@ant-design/icons-vue'
import CameraCapture from '@/components/CameraCapture.vue'
import { fileApi } from '@/services/fileApi'

interface Props {
  imagePaths: string[]
}

interface Emits {
  (e: 'update:imagePaths', value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const previewVisible = ref(false)
const previewImage = ref('')
const cameraOpen = ref(false)
const uploadInputRef = ref<HTMLInputElement | null>(null)

interface ImageItem {
  uid: string
  name: string
  status: 'uploading' | 'done' | 'error'
  url: string
  relativePath: string
  thumbUrl?: string
}

const fileList = ref<ImageItem[]>([])

watch(() => props.imagePaths, (paths) => {
  if (!paths || paths.length === 0) {
    fileList.value = []
    return
  }
  fileList.value = paths.map((p, idx) => ({
    uid: `-${idx}`,
    name: p.split('/').pop() || `image_${idx}`,
    status: 'done' as const,
    url: p.startsWith('/') || p.startsWith('http') ? p : fileApi.getFileUrl(p),
    relativePath: p,
  }))
}, { immediate: true })

const emitPaths = () => {
  emit('update:imagePaths', fileList.value.filter(f => f.status === 'done').map(f => f.relativePath))
}

const addFile = (file: File) => {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  fileList.value = [...fileList.value, {
    uid,
    name: file.name,
    status: 'uploading',
    url: '',
    relativePath: '',
    thumbUrl: URL.createObjectURL(file),
  }]
  doUpload(uid, file)
}

const doUpload = async (uid: string, file: File) => {
  try {
    const result = await fileApi.upload(file)
    const idx = fileList.value.findIndex(f => f.uid === uid)
    if (idx >= 0) {
      fileList.value[idx].status = 'done'
      fileList.value[idx].url = fileApi.getFileUrl(result.relativePath)
      fileList.value[idx].relativePath = result.relativePath
    }
    emitPaths()
  } catch {
    const idx = fileList.value.findIndex(f => f.uid === uid)
    if (idx >= 0) {
      fileList.value[idx].status = 'error'
    }
    message.error(t('message.uploadFailed'))
  }
}

const triggerUpload = () => uploadInputRef.value?.click()

const onFileInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files) return
  let rejected = 0
  for (let i = 0; i < files.length && fileList.value.length < 20; i++) {
    const file = files[i]
    // accept 只是浏览器提示，用户可选「所有文件」绕过，这里强制校验 MIME 类型
    if (!file.type.startsWith('image/')) {
      rejected++
      continue
    }
    addFile(file)
  }
  if (rejected > 0) {
    message.error(t('message.fileTypeNotSupported'))
  }
  input.value = ''
}

const handleRemove = (file: ImageItem) => {
  fileList.value = fileList.value.filter(f => f.uid !== file.uid)
  emitPaths()
}

const handlePreview = (file: ImageItem) => {
  previewImage.value = file.url || file.thumbUrl || ''
  previewVisible.value = true
}

const onCameraCaptured = (file: File) => {
  if (fileList.value.length < 20) {
    addFile(file)
  }
}
</script>

<style lang="less" scoped>
.upload-card {
  margin-bottom: 16px;

  .upload-grid :deep(.ant-upload-select) {
    display: none !important;
  }

  .upload-tip {
    margin-top: 8px;
    color: #999;
    font-size: 12px;
  }
}

.upload-idle {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;

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

      .upload-idle__btn-icon {
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
}
</style>

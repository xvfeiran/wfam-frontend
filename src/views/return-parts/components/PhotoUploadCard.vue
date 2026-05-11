<template>
  <a-card :title="t('returnPart.photoUpload')" class="upload-card">
    <a-upload
      :file-list="fileList"
      list-type="picture-card"
      :before-upload="handleUpload"
      :max-count="20"
      multiple
      @preview="handlePreview"
      @remove="handleRemove"
    >
      <div v-if="fileList.length < 20">
        <PlusOutlined />
        <div style="margin-top: 8px">{{ t('returnPart.upload') }}</div>
      </div>
    </a-upload>

    <!-- 拍照按钮 -->
    <a-button
      v-if="fileList.length < 20"
      class="camera-btn"
      @click="cameraOpen = true"
    >
      <CameraOutlined /> {{ t('ocr.takePhoto') }}
    </a-button>

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
import { PlusOutlined, CameraOutlined } from '@ant-design/icons-vue'
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

const handleUpload = (file: File) => {
  addFile(file)
  return false
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

  .camera-btn {
    margin-bottom: 8px;
  }

  .upload-tip {
    margin-top: 8px;
    color: #999;
    font-size: 12px;
  }
}
</style>

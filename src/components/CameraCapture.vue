<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :mask-closable="false"
    :width="'100%'"
    wrap-class-name="camera-fullscreen-modal"
    :body-style="{ padding: 0, height: '100vh', overflow: 'hidden', background: '#000' }"
    :destroy-on-close="true"
    @cancel="handleClose"
  >
    <div class="camera-fullscreen">
      <!-- 视频取景 -->
      <video ref="videoRef" autoplay playsinline class="camera-video" />

      <!-- 顶部提示 -->
      <div v-if="hint" class="camera-hint">{{ hint }}</div>

      <!-- 底部工具栏 -->
      <div class="camera-toolbar">
        <button class="camera-close-btn" @click="handleClose">
          <CloseOutlined />
        </button>
        <button class="camera-shutter-btn" :disabled="!streamReady" @click="capture">
          <span class="camera-shutter-inner" />
        </button>
        <div class="camera-spacer" />
      </div>
    </div>

    <canvas ref="canvasRef" style="display: none" />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { CloseOutlined } from '@ant-design/icons-vue'

const props = defineProps<{ open: boolean; hint?: string }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'captured', file: File): void
}>()

const { t } = useI18n()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const streamReady = ref(false)
let mediaStream: MediaStream | null = null

watch(() => props.open, async (val) => {
  if (val) {
    setTimeout(async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        })
        if (videoRef.value) {
          videoRef.value.srcObject = mediaStream
          streamReady.value = true
        }
      } catch {
        handleClose()
        message.error(t('ocr.cameraDenied'))
      }
    }, 300)
  } else {
    stopStream()
  }
})

const stopStream = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  streamReady.value = false
}

const handleClose = () => {
  stopStream()
  emit('update:open', false)
}

const capture = () => {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) return

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(video as CanvasImageSource, 0, 0)

  canvas.toBlob((blob) => {
    if (!blob) return
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
    emit('captured', file)
    handleClose()
  }, 'image/jpeg', 0.92)
}
</script>

<style lang="less">
/* 不能 scoped，需要穿透 ant-design modal wrapper */
.camera-fullscreen-modal {
  .ant-modal {
    top: 0;
    padding: 0;
    max-width: none;
  }

  .ant-modal-content {
    height: 100vh;
    border-radius: 0;
    overflow: hidden;
    background: #000;
  }

  .ant-modal-body {
    height: 100vh !important;
  }
}
</style>

<style lang="less" scoped>
.camera-fullscreen {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.camera-hint {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 80%;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 14px;
  line-height: 1.6;
  border-radius: 8px;
  text-align: center;
  pointer-events: none;
}

.camera-toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 36px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
}

.camera-close-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
  }
}

.camera-shutter-btn {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  border: 4px solid #fff;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    border-color: #91caff;
  }

  &:not(:disabled):active .camera-shutter-inner {
    transform: scale(0.85);
  }
}

.camera-shutter-inner {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff;
  display: block;
  transition: transform 0.15s;

  &:hover {
    background: #f0f0f0;
  }
}

.camera-spacer {
  width: 44px;
}
</style>

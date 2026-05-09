<template>
  <a-modal
    :open="visible"
    :title="t('returnPart.ocrPreview')"
    :width="1000"
    :closable="true"
    :mask-closable="false"
    @cancel="handleCancel"
  >
    <div class="ocr-preview-content">
      <!-- 左侧：图片区域（支持缩放和拖动） -->
      <div class="ocr-preview-image">
        <div
          class="image-wrapper"
          @wheel.prevent="onWheel"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend.prevent="onTouchEnd"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
        >
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :style="{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }"
            alt="OCR Preview"
            class="preview-image"
          />
          <div v-else class="no-image">{{ t('ocr.noImage') }}</div>
        </div>
        <!-- 缩放控制提示 -->
        <div class="zoom-hint">
          <span>{{ t('ocr.zoomHint') }}</span>
        </div>
        <!-- 缩放控制按钮 -->
        <div class="zoom-controls">
          <a-button size="small" @click="zoomOut" :disabled="scale <= minScale">
            <ZoomOutOutlined />
          </a-button>
          <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
          <a-button size="small" @click="zoomIn" :disabled="scale >= maxScale">
            <ZoomInOutlined />
          </a-button>
          <a-button size="small" @click="resetZoom">
            <ReloadOutlined />
          </a-button>
        </div>
      </div>

      <!-- 右侧：识别表单 -->
      <div class="ocr-preview-form">
        <div class="form-header">
          <h4>{{ t('ocr.ocrRecognizedFields') }}</h4>
          <p class="form-hint">{{ t('ocr.previewFormHint') }}</p>
        </div>

        <a-form :model="localForm" layout="vertical">
          <a-form-item :label="t('returnPart.vehicleProductionDate')">
            <a-date-picker
              v-model:value="localForm.vehicleProductionDate"
              format="YYYY-MM-DD"
              :placeholder="t('validation.pleaseSelect')"
              style="width: 100%"
            />
          </a-form-item>

          <a-form-item :label="t('returnPart.vehiclePurchaseDate')">
            <a-date-picker
              v-model:value="localForm.vehiclePurchaseDate"
              format="YYYY-MM-DD"
              :placeholder="t('validation.pleaseSelect')"
              style="width: 100%"
            />
          </a-form-item>

          <a-form-item :label="t('returnPart.vehicleFailureDate')">
            <a-date-picker
              v-model:value="localForm.vehicleFailureDate"
              format="YYYY-MM-DD"
              :placeholder="t('validation.pleaseSelect')"
              style="width: 100%"
            />
          </a-form-item>

          <a-form-item :label="t('returnPart.vehicleVIN')">
            <a-input
              v-model:value="localForm.vehicleVIN"
              :placeholder="t('validation.pleaseInput')"
            />
          </a-form-item>

          <a-form-item :label="t('returnPart.vehicleMileage')">
            <a-input-number
              v-model:value="localForm.vehicleMileage"
              :placeholder="t('validation.pleaseInput')"
              :min="0"
              style="width: 100%"
            />
          </a-form-item>

          <a-form-item :label="t('returnPart.repairStationLocation')">
            <a-input
              v-model:value="localForm.repairStationLocation"
              :placeholder="t('validation.pleaseInput')"
            />
          </a-form-item>

          <a-form-item :label="t('returnPart.customerDescription')">
            <a-text-area
              v-model:value="localForm.customerDescription"
              :placeholder="t('returnPart.customerDescPlaceholder')"
              :rows="3"
            />
          </a-form-item>
        </a-form>
      </div>
    </div>

    <template #footer>
      <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
      <a-button type="primary" @click="handleConfirm">
        {{ t('ocr.confirmApply') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import type { OCRResultItem } from '@/composables/useOCR'

interface Props {
  visible: boolean
  imageUrl: string
  ocrResults: Record<string, OCRResultItem>
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  imageUrl: '',
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', form: Record<string, any>): void
}>()

const { t } = useI18n()

// 缩放状态
const scale = ref(1)
const minScale = 0.5
const maxScale = 3

// 位置状态（用于拖动）
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const positionStart = ref({ x: 0, y: 0 })

// 双指触摸状态
const initialDistance = ref(0)
const initialScale = ref(1)

// 本地表单数据（不直接双向绑定）
const localForm = reactive<{
  vehicleProductionDate: ReturnType<typeof dayjs> | null
  vehiclePurchaseDate: ReturnType<typeof dayjs> | null
  vehicleFailureDate: ReturnType<typeof dayjs> | null
  vehicleVIN: string
  vehicleMileage: number | null
  repairStationLocation: string
  customerDescription: string
}>({
  vehicleProductionDate: null,
  vehiclePurchaseDate: null,
  vehicleFailureDate: null,
  vehicleVIN: '',
  vehicleMileage: null,
  repairStationLocation: '',
  customerDescription: '',
})

// 当 OCR 结果变化时，更新本地表单
watch(
  () => props.ocrResults,
  (results) => {
    if (results.vehicleProductionDate?.status === 'success') {
      localForm.vehicleProductionDate = parseDate(results.vehicleProductionDate.value)
    }
    if (results.vehiclePurchaseDate?.status === 'success') {
      localForm.vehiclePurchaseDate = parseDate(results.vehiclePurchaseDate.value)
    }
    if (results.vehicleFailureDate?.status === 'success') {
      localForm.vehicleFailureDate = parseDate(results.vehicleFailureDate.value)
    }
    if (results.vehicleVIN?.status === 'success') {
      localForm.vehicleVIN = results.vehicleVIN.value
    }
    if (results.vehicleMileage?.status === 'success') {
      localForm.vehicleMileage = Number(results.vehicleMileage.value) || null
    }
    if (results.repairStationLocation?.status === 'success') {
      localForm.repairStationLocation = results.repairStationLocation.value
    }
    if (results.customerDescription?.status === 'success') {
      localForm.customerDescription = results.customerDescription.value
    }
  },
  { immediate: true, deep: true },
)

function parseDate(value: string): ReturnType<typeof dayjs> | null {
  if (!value) return null
  return dayjs(value)
}

// 鼠标滚轮缩放
function onWheel(event: WheelEvent) {
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.max(minScale, Math.min(maxScale, scale.value + delta))
}

// 鼠标拖动
function onMouseDown(event: MouseEvent) {
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  positionStart.value = { ...position.value }
}

function onMouseMove(event: MouseEvent) {
  if (!isDragging.value) return
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  position.value = {
    x: positionStart.value.x + dx,
    y: positionStart.value.y + dy,
  }
}

function onMouseUp() {
  isDragging.value = false
}

// 双指触摸缩放
function onTouchStart(event: TouchEvent) {
  if (event.touches.length === 1) {
    // 单指触摸开始拖动
    isDragging.value = true
    dragStart.value = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    positionStart.value = { ...position.value }
  } else if (event.touches.length === 2) {
    // 双指触摸开始缩放
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    initialDistance.value = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY,
    )
    initialScale.value = scale.value
  }
}

function onTouchMove(event: TouchEvent) {
  if (event.touches.length === 1 && isDragging.value) {
    // 单指拖动
    const dx = event.touches[0].clientX - dragStart.value.x
    const dy = event.touches[0].clientY - dragStart.value.y
    position.value = {
      x: positionStart.value.x + dx,
      y: positionStart.value.y + dy,
    }
  } else if (event.touches.length === 2) {
    // 双指缩放
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY,
    )
    const scaleRatio = currentDistance / initialDistance.value
    scale.value = Math.max(minScale, Math.min(maxScale, initialScale.value * scaleRatio))
  }
}

function onTouchEnd() {
  isDragging.value = false
}

// 缩放控制按钮
function zoomIn() {
  scale.value = Math.min(maxScale, scale.value + 0.25)
}

function zoomOut() {
  scale.value = Math.max(minScale, scale.value - 0.25)
}

function resetZoom() {
  scale.value = 1
  position.value = { x: 0, y: 0 }
}

// 取消
function handleCancel() {
  emit('update:visible', false)
  // 重置缩放和位置
  scale.value = 1
  position.value = { x: 0, y: 0 }
}

// 确认应用
function handleConfirm() {
  emit('confirm', { ...localForm })
  emit('update:visible', false)
  // 重置缩放和位置
  scale.value = 1
  position.value = { x: 0, y: 0 }
}
</script>

<style lang="less" scoped>
.ocr-preview-content {
  display: flex;
  gap: 24px;
  height: 500px;
}

.ocr-preview-image {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.image-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

.no-image {
  color: #8c8c8c;
  font-size: 14px;
}

.zoom-hint {
  padding: 6px 12px;
  text-align: center;
  font-size: 12px;
  color: #8c8c8c;
  background: rgba(0, 0, 0, 0.04);
  border-top: 1px solid #e8e8e8;
}

.zoom-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.04);
  border-top: 1px solid #e8e8e8;
}

.zoom-level {
  min-width: 45px;
  text-align: center;
  font-size: 12px;
  color: #595959;
}

.ocr-preview-form {
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.form-header {
  margin-bottom: 16px;

  h4 {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 500;
  }
}

.form-hint {
  margin: 0;
  font-size: 12px;
  color: #8c8c8c;
}

:deep(.ant-form-item) {
  margin-bottom: 12px;
}

:deep(.ant-form-item-label > label) {
  font-size: 13px;
}
</style>

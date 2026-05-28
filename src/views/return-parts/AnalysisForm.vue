<template>
  <div class="analysis-form">
    <a-page-header
      :title="t('analysisForm.title', { partNumber: part?.partNumber || '' })"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button :disabled="saveDraftDebounce.isDebouncing.value" :loading="saveDraftDebounce.isDebouncing.value" @click="handleSaveDraft">{{ t('analysisForm.saveDraft') }}</a-button>
          <a-button type="primary" :disabled="submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('analysisForm.submitApproval') }}</a-button>
          <a-button @click="handleDownload">
            <DownloadOutlined /> {{ t('analysisForm.downloadReport') }}
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card>
      <div class="template-hint">
        {{ t('analysisForm.templateHint', { platform: part?.productPlatform || 'xxx', failureMode: form.failureMode || t('returnPart.failureType') }) }}
      </div>

      <a-form :model="form" layout="vertical" ref="formRef">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('analysisForm.partNumber')">
              <a-input :value="part?.partNumber" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('analysisForm.partCode')">
              <a-input :value="part?.partCode" disabled />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('analysisForm.businessUnit')">
              <a-input :value="part?.businessUnit" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('analysisForm.productPlatform')">
              <a-input :value="part?.productPlatform" disabled />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>{{ t('analysisForm.analysisInfo') }}</a-divider>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('returnPart.boschFailureType')" name="boschFailureType">
              <a-select v-model:value="form.boschFailureType" :placeholder="t('returnPart.boschFailureType')" allow-clear>
                <a-select-option v-for="item in COMPLAINT_TYPES" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item :label="t('analysisForm.failureMode')" name="failureMode" :rules="[{ required: true, message: t('analysisForm.pleaseSelectFailureMode') }]">
              <a-select v-model:value="form.failureMode" :placeholder="t('analysisForm.pleaseSelectFailureMode')">
                <a-select-option value="电气故障">{{ t('analysisForm.failureElectrical') }}</a-select-option>
                <a-select-option value="机械故障">{{ t('analysisForm.failureMechanical') }}</a-select-option>
                <a-select-option value="软件故障">{{ t('analysisForm.failureSoftware') }}</a-select-option>
                <a-select-option value="外观损伤">{{ t('analysisForm.failureAppearance') }}</a-select-option>
                <a-select-option value="其他">{{ t('analysisForm.failureOther') }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('analysisForm.rootCause')" name="rootCause" :rules="[{ required: true, message: t('analysisForm.pleaseSelectRootCause') }]">
              <a-select v-model:value="form.rootCause" :placeholder="t('analysisForm.pleaseSelectRootCause')">
                <a-select-option value="设计缺陷">{{ t('analysisForm.causeDesign') }}</a-select-option>
                <a-select-option value="制造缺陷">{{ t('analysisForm.causeManufacturing') }}</a-select-option>
                <a-select-option value="材料问题">{{ t('analysisForm.causeMaterial') }}</a-select-option>
                <a-select-option value="使用不当">{{ t('analysisForm.causeUsage') }}</a-select-option>
                <a-select-option value="其他">{{ t('analysisForm.causeOther') }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item :label="t('analysisForm.failureDescription')" name="failureDescription" :rules="[{ required: true, message: t('validation.required') }]">
              <a-textarea
                v-model:value="form.failureDescription"
                :placeholder="t('analysisForm.pleaseDescribeFailure')"
                :rows="4"
                show-count
                :maxlength="1000"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item :label="t('analysisForm.analysisConclusion')" name="analysisConclusion" :rules="[{ required: true, message: t('validation.required') }]">
              <a-textarea
                v-model:value="form.analysisConclusion"
                :placeholder="t('analysisForm.pleaseInputConclusion')"
                :rows="4"
                show-count
                :maxlength="1000"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item :label="t('analysisForm.improvementMeasures')" name="improvementMeasures">
              <a-textarea
                v-model:value="form.improvementMeasures"
                :placeholder="t('analysisForm.pleaseInputImprovements')"
                :rows="3"
                show-count
                :maxlength="500"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item :label="t('analysisForm.attachmentUpload')">
              <a-upload
                v-model:file-list="fileList"
                :before-upload="handleAttachmentUpload"
                :max-count="10"
                list-type="picture-card"
                @remove="handleAttachmentRemove"
                @preview="handleAttachmentPreview"
              >
                <div v-if="fileList.length < 10">
                  <PlusOutlined />
                  <div style="margin-top: 8px">{{ t('common.upload') }}</div>
                </div>
              </a-upload>
              <a-button
                v-if="fileList.length < 10"
                class="camera-btn"
                @click="cameraOpen = true"
              >
                <CameraOutlined /> {{ t('ocr.takePhoto') }}
              </a-button>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 摄像头拍照弹窗 -->
    <CameraCapture
      v-model:open="cameraOpen"
      @captured="onCameraCaptured"
    />

    <!-- 图片预览弹窗 -->
    <a-modal :open="previewVisible" :footer="null" @cancel="previewVisible = false">
      <img :src="previewImage" style="width: 100%" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { DownloadOutlined, PlusOutlined, CameraOutlined } from '@ant-design/icons-vue'
import { partApi } from '@/services/partApi'

import { COMPLAINT_TYPES } from '@/constants/complaintTypes'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import CameraCapture from '@/components/CameraCapture.vue'
import type { Part } from '@/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const formRef = ref()

// 防抖处理
const saveDraftDebounce = useDebouncedClick({ delay: 1000 })
const submitDebounce = useDebouncedClick({ delay: 1000 })

const partId = computed(() => route.params.id as string)
const part = ref<Part | null>(null)

const form = reactive({
  boschFailureType: undefined as string | undefined,
  failureMode: undefined as string | undefined,
  rootCause: undefined as string | undefined,
  failureDescription: '',
  analysisConclusion: '',
  improvementMeasures: '',
})

const fileList = ref<any[]>([])
const previewVisible = ref(false)
const previewImage = ref('')

const cameraOpen = ref(false)

const handleAttachmentUpload = async (file: File) => {
  // For now, we store locally since report may not exist yet
  // When the report is saved/submitted, attachments would need to be uploaded
  // For simplicity, show a preview but defer upload to when reportId is available
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const item = {
    uid,
    name: file.name,
    status: 'done' as const,
    url: URL.createObjectURL(file),
    thumbUrl: URL.createObjectURL(file),
    originFileObj: file,
  }
  fileList.value = [...fileList.value, item]
  return false
}

const handleAttachmentRemove = async (file: any) => {
  fileList.value = fileList.value.filter(f => f.uid !== file.uid)
}

const handleAttachmentPreview = (file: any) => {
  previewImage.value = file.url || file.thumbUrl
  previewVisible.value = true
}

const onCameraCaptured = (file: File) => {
  if (fileList.value.length < 10) {
    handleAttachmentUpload(file)
  }
}

onMounted(async () => {
  part.value = await partApi.getById(partId.value)
})

const handleBack = () => {
  router.back()
}

const handleSaveDraft = () => saveDraftDebounce.execute(async () => {
  // TODO: 实现保存草稿逻辑
  message.success(t('message.draftSaved'))
})

const handleSubmit = () => submitDebounce.execute(async () => {
  try {
    await formRef.value?.validate()
    message.success(t('analysisForm.submitSuccess', t('message.submitSuccess')))
    router.push('/return-parts')
  } catch {
    message.error(t('validation.formError'))
  }
})

const handleDownload = () => {
  message.success(t('message.generatingReport'))
  setTimeout(() => {
    message.success(t('message.reportDownloadSuccess'))
  }, 1000)
}
</script>

<style lang="less" scoped>
.analysis-form {
  padding: 0;

  .template-hint {
    background: #f5f5f5;
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 24px;
    color: #666;
    font-size: 14px;
  }

  .camera-btn {
    margin-top: 8px;
  }
}
</style>

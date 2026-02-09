<template>
  <a-modal
    :open="visible"
    :title="t('reportForm.detailedAnalysis')"
    width="800px"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <!-- 顶部信息提示 -->
    <div class="part-info-tip">
      <span>{{ t('returnPart.productPlatform') }}: {{ part?.productPlatform || '-' }}</span>
      <a-divider type="vertical" />
      <span>{{ t('returnPart.failureType') }}: {{ part?.failureType || '-' }}</span>
      <span v-if="selectedTemplate" class="template-name">（{{ t('reportForm.templateMatched') }} {{ selectedTemplate.name }}）</span>
    </div>

    <a-form :model="form" layout="vertical" ref="formRef">
      <template v-if="selectedTemplate">
        <a-divider>{{ t('reportForm.reportContent') }}</a-divider>

        <template v-for="field in selectedTemplate.fields" :key="field.name">
          <a-form-item :label="field.label" :name="['content', field.name]" :rules="field.required ? [{ required: true, message: t('reportForm.enterField', { field: field.label }) }] : []">
            <template v-if="field.type === 'text'">
              <a-input v-model:value="form.content[field.name]" :placeholder="t('reportForm.inputField', { field: field.label })" />
            </template>
            <template v-else-if="field.type === 'textarea'">
              <a-textarea v-model:value="form.content[field.name]" :placeholder="t('reportForm.inputField', { field: field.label })" :rows="3" />
            </template>
            <template v-else-if="field.type === 'select'">
              <a-select v-model:value="form.content[field.name]" :placeholder="t('reportForm.selectField', { field: field.label })">
                <a-select-option v-for="opt in field.options" :key="opt" :value="opt">
                  {{ opt }}
                </a-select-option>
              </a-select>
            </template>
            <template v-else-if="field.type === 'date'">
              <a-date-picker v-model:value="form.content[field.name]" style="width: 100%" />
            </template>
            <template v-else-if="field.type === 'number'">
              <a-input-number v-model:value="form.content[field.name]" style="width: 100%" />
            </template>
          </a-form-item>
        </template>

        <a-divider>{{ t('reportForm.reportSummary') }}</a-divider>

        <a-form-item :label="t('reportForm.reportSummary')" name="summary">
          <a-textarea v-model:value="form.summary" :placeholder="t('reportForm.inputReportSummary')" :rows="2" show-count :maxlength="200" />
        </a-form-item>

        <a-form-item :label="t('analysisForm.attachmentUpload')">
          <a-upload v-model:file-list="form.attachments" :before-upload="() => false" :max-count="5">
            <a-button>
              <UploadOutlined /> {{ t('common.upload') }}
            </a-button>
          </a-upload>
        </a-form-item>
      </template>

      <a-empty v-else :description="t('reportForm.noTemplateMatched')" />
    </a-form>

    <template #footer>
      <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
      <a-button @click="handleDownload" :disabled="!selectedTemplate">
        <DownloadOutlined /> {{ t('analysisForm.downloadReport') }}
      </a-button>
      <a-button @click="handleSaveDraft" :disabled="!selectedTemplate">{{ t('common.save') }}</a-button>
      <a-button type="primary" @click="handleSubmit" :disabled="!selectedTemplate">{{ t('analysisForm.submitApproval') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { MOCK_TEMPLATES } from '@/services/mockData'
import type { Part, ReportTemplate } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  part: Part | null
}>()

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref()
const templates = ref(MOCK_TEMPLATES)

const form = reactive({
  templateId: undefined as string | undefined,
  content: {} as Record<string, any>,
  summary: '',
  attachments: [] as any[],
})

// 根据产品平台和失效类型自动匹配模板
const selectedTemplate = computed(() => {
  if (!props.part) return null

  const { productPlatform, failureType } = props.part

  // 首先尝试精确匹配（产品平台 + 失效类型）
  let template = templates.value.find(
    t => t.productPlatform === productPlatform && t.failureType === failureType
  )

  // 如果没有精确匹配，尝试只匹配产品平台
  if (!template) {
    template = templates.value.find(
      t => t.productPlatform === productPlatform && !t.failureType
    )
  }

  // 如果还是没有，尝试只匹配失效类型
  if (!template) {
    template = templates.value.find(
      t => !t.productPlatform && t.failureType === failureType
    )
  }

  // 最后使用默认模板
  if (!template) {
    template = templates.value.find(t => !t.productPlatform && !t.failureType)
  }

  return template || null
})

// 当模板变化时重置表单内容
watch(selectedTemplate, (newTemplate) => {
  if (newTemplate) {
    form.templateId = newTemplate.id
    form.content = {}
  }
})

const handleCancel = () => {
  emit('update:visible', false)
}

const handleSaveDraft = () => {
  message.success(t('message.draftSaved'))
}

const handleDownload = () => {
  message.success(t('message.generatingReport'))
  setTimeout(() => {
    message.success(t('message.reportDownloadSuccess'))
  }, 1000)
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    emit('success')
  } catch {
    message.error(t('validation.formError'))
  }
}
</script>

<style lang="less" scoped>
.part-info-tip {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;

  .template-name {
    margin-left: 12px;
    color: #1890ff;
  }
}
</style>

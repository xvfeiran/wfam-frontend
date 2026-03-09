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
import { reportsApi } from '@/services/reportsApi'
import type { Part, ReportTemplate } from '@/types'
import dayjs from 'dayjs'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  part: Part | null
}>()

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref()
const templates = ref<ReportTemplate[]>([])
const reportId = ref<string>()
const loading = ref(false)

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

  console.log('[Template Match] Part info:', { productPlatform, failureType })
  console.log('[Template Match] Available templates:', templates.value)

  // 首先尝试精确匹配（产品平台 + 失效类型）
  let template = templates.value.find(
    t => t.productPlatform === productPlatform && t.failureType === failureType
  )

  console.log('[Template Match] Exact match result:', template)

  // 如果没有精确匹配，尝试只匹配产品平台
  if (!template) {
    template = templates.value.find(
      t => t.productPlatform === productPlatform && !t.failureType
    )
    console.log('[Template Match] Platform match result:', template)
  }

  // 如果还是没有，尝试只匹配失效类型
  if (!template) {
    template = templates.value.find(
      t => !t.productPlatform && t.failureType === failureType
    )
    console.log('[Template Match] Failure type match result:', template)
  }

  // 最后使用默认模板
  if (!template) {
    template = templates.value.find(t => !t.productPlatform && !t.failureType)
    console.log('[Template Match] Default template:', template)
  }

  return template || null
})

// 当弹窗打开时加载模板和现有报告
watch(() => props.visible, async (val) => {
  if (val) {
    console.log('[Template Modal] Opening modal, loading templates...')
    if (templates.value.length === 0) {
      try {
        templates.value = await reportsApi.getTemplates()
        console.log('[Template Modal] Templates loaded:', templates.value)
      } catch (error) {
        console.error('[Template Modal] Failed to load templates:', error)
      }
    } else {
      console.log('[Template Modal] Using cached templates:', templates.value)
    }
    // 加载现有报告
    if (props.part?.id) {
      try {
        const existingReport = await reportsApi.getLatestReportByPart(props.part.id)
        if (existingReport) {
          reportId.value = existingReport.id
          form.templateId = existingReport.templateId
          form.content = existingReport.content || {}
          form.summary = existingReport.summary || ''
        }
      } catch {
        // 没有现有报告，使用新表单
        reportId.value = undefined
      }
    }
  }
})

// 当模板变化时重置表单内容
watch(selectedTemplate, (newTemplate) => {
  if (newTemplate && !reportId.value) {
    form.templateId = newTemplate.id
    form.content = {}
  }
})

const handleCancel = () => {
  emit('update:visible', false)
}

const handleSaveDraft = async () => {
  if (!props.part?.id || !selectedTemplate.value) return
  try {
    loading.value = true
    await formRef.value?.validate()

    // 格式化日期字段
    const formattedContent: Record<string, any> = {}
    for (const [key, value] of Object.entries(form.content)) {
      if (dayjs.isDayjs(value)) {
        formattedContent[key] = value.format('YYYY-MM-DD')
      } else {
        formattedContent[key] = value
      }
    }

    const report = await reportsApi.saveReport({
      partId: props.part.id,
      templateId: selectedTemplate.value.id,
      content: formattedContent,
      summary: form.summary,
      status: 'draft',
    })
    reportId.value = report.id
    message.success(t('message.draftSaved'))
  } catch {
    message.error(t('validation.formError'))
  } finally {
    loading.value = false
  }
}

const handleDownload = async () => {
  if (!reportId.value) {
    message.warning(t('analysisForm.pleaseSaveFirst'))
    return
  }
  try {
    loading.value = true
    const blob = await reportsApi.exportReport(reportId.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${props.part?.partNumber}_${Date.now()}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    message.success(t('message.downloadSuccess'))
  } catch {
    message.error(t('message.exportFailed'))
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!props.part?.id || !selectedTemplate.value) return
  try {
    loading.value = true
    await formRef.value?.validate()

    // 格式化日期字段
    const formattedContent: Record<string, any> = {}
    for (const [key, value] of Object.entries(form.content)) {
      if (dayjs.isDayjs(value)) {
        formattedContent[key] = value.format('YYYY-MM-DD')
      } else {
        formattedContent[key] = value
      }
    }

    const report = await reportsApi.saveReport({
      partId: props.part.id,
      templateId: selectedTemplate.value.id,
      content: formattedContent,
      summary: form.summary,
      status: 'submitted',
    })
    reportId.value = report.id
    emit('success')
    message.success(t('message.submitSuccess'))
  } catch {
    message.error(t('validation.formError'))
  } finally {
    loading.value = false
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

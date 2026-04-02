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
      <div class="match-conditions">
        <span class="conditions-label">{{ t('reportForm.matchConditions') }}:</span>
        <a-form-item :label="t('returnPart.productPlatform')" style="margin-bottom: 0; margin-left: 8px;">
          <a-select
            v-model:value="matchConditions.productPlatform"
            style="width: 150px"
            @change="handleMatchConditionsChange"
            allow-clear
            :disabled="isApproved"
          >
            <a-select-option v-for="pc in productPlatformOptions" :key="pc" :value="pc">
              {{ pc }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('returnPart.failureType')" style="margin-bottom: 0; margin-left: 8px;">
          <a-select
            v-model:value="matchConditions.failureType"
            style="width: 150px"
            @change="handleMatchConditionsChange"
            allow-clear
            :disabled="isApproved"
          >
            <a-select-option v-for="ft in failureTypeOptions" :key="ft" :value="ft">
              {{ ft }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </div>
      <!-- 当有多个匹配模板时显示选择器 -->
      <div v-if="matchedTemplates.length > 1" class="template-selector">
        <a-form-item :label="t('reportForm.selectTemplate')" style="margin-bottom: 0;">
          <a-select v-model:value="form.templateId" style="width: 250px">
            <a-select-option v-for="tmpl in matchedTemplates" :key="tmpl.id" :value="tmpl.id">
              {{ tmpl.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </div>
      <span v-else-if="selectedTemplate" class="template-name">（{{ t('reportForm.templateMatched') }} {{ selectedTemplate.name }}）</span>
    </div>

    <a-form :model="form" layout="vertical" ref="formRef">
      <template v-if="selectedTemplate">
        <a-divider>{{ t('reportForm.reportContent') }}</a-divider>

        <template v-for="field in selectedTemplate.fields" :key="field.name">
          <a-form-item :label="field.label" :name="['content', field.name]" :rules="field.required ? [{ required: true, message: t('reportForm.enterField', { field: field.label }) }] : []">
            <template v-if="field.type === 'text'">
              <a-input v-model:value="form.content[field.name]" :placeholder="t('reportForm.inputField', { field: field.label })" :disabled="isApproved" />
            </template>
            <template v-else-if="field.type === 'textarea'">
              <a-textarea v-model:value="form.content[field.name]" :placeholder="t('reportForm.inputField', { field: field.label })" :rows="3" :disabled="isApproved" />
            </template>
            <template v-else-if="field.type === 'select'">
              <a-select v-model:value="form.content[field.name]" :placeholder="t('reportForm.selectField', { field: field.label })" :disabled="isApproved">
                <a-select-option v-for="opt in field.options" :key="opt" :value="opt">
                  {{ opt }}
                </a-select-option>
              </a-select>
            </template>
            <template v-else-if="field.type === 'date'">
              <a-date-picker v-model:value="form.content[field.name]" style="width: 100%" :disabled="isApproved" />
            </template>
            <template v-else-if="field.type === 'number'">
              <a-input-number v-model:value="form.content[field.name]" style="width: 100%" :disabled="isApproved" />
            </template>
          </a-form-item>
        </template>

        <a-divider>{{ t('reportForm.reportSummary') }}</a-divider>

        <a-form-item :label="t('reportForm.reportSummary')" name="summary">
          <a-textarea v-model:value="form.summary" :placeholder="t('reportForm.inputReportSummary')" :rows="2" show-count :maxlength="200" :disabled="isApproved" />
        </a-form-item>

        <a-form-item :label="t('analysisForm.attachmentUpload')">
          <a-upload v-model:file-list="form.attachments" :before-upload="() => false" :max-count="5" :disabled="isApproved">
            <a-button :disabled="isApproved">
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
      <template v-if="isApproved">
        <!-- 审批通过：只读，无编辑操作 -->
      </template>
      <template v-else-if="isPendingApproval">
        <a-button type="primary" @click="handleViewApproval">{{ t('analysisForm.viewApprovalProgress') }}</a-button>
      </template>
      <template v-else>
        <a-button @click="handleSaveDraft" :disabled="!selectedTemplate">{{ t('common.save') }}</a-button>
        <a-button type="primary" @click="handleSubmit" :disabled="!selectedTemplate">{{ t('analysisForm.submitApproval') }}</a-button>
      </template>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { reportsApi } from '@/services/reportsApi'
import { lookupApi } from '@/services/lookupApi'
import { PartStatus } from '@/types'
import type { Part, ReportTemplate } from '@/types'
import dayjs from 'dayjs'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  part: Part | null
}>()

const emit = defineEmits(['update:visible', 'success', 'view-approval'])

const formRef = ref()
const templates = ref<ReportTemplate[]>([])
const reportId = ref<string>()
const loading = ref(false)

// 匹配条件状态
const matchConditions = reactive({
  productPlatform: undefined as string | undefined,
  failureType: undefined as string | undefined,
})

// 匹配模板列表
const matchedTemplates = ref<ReportTemplate[]>([])
const productPlatformOptions = ref<string[]>([])
const failureTypeOptions = ref<string[]>([])

const form = reactive({
  templateId: undefined as string | undefined,
  content: {} as Record<string, any>,
  summary: '',
  attachments: [] as any[],
})

// 根据选中的模板ID获取当前模板
const selectedTemplate = computed(() => {
  return matchedTemplates.value.find(t => t.id === form.templateId) || null
})

// 是否处于待审批状态（已提交，等待审批）
const isPendingApproval = computed(() => {
  return props.part?.status === PartStatus.PENDING_APPROVAL
})

// 是否已审批通过（只读，不可再编辑）
const isApproved = computed(() => {
  return props.part?.status === PartStatus.ANALYSIS_COMPLETED
})

// 匹配模板函数
const matchTemplates = async () => {
  const { productPlatform, failureType } = matchConditions
  if (!productPlatform) {
    matchedTemplates.value = []
    form.templateId = undefined
    return
  }

  try {
    const allTemplates = await reportsApi.matchAllTemplates(productPlatform, failureType)
    matchedTemplates.value = allTemplates

    // 如果没有已选择的模板（新报告），使用第一个匹配的模板
    if (!form.templateId && allTemplates.length > 0) {
      form.templateId = allTemplates[0].id
    }
  } catch (error) {
    console.error('[Template Match] Failed to match templates:', error)
    matchedTemplates.value = []
  }
}

// 处理匹配条件变化
const handleMatchConditionsChange = () => {
  matchTemplates()
}

// 将内容中的日期字符串转换为 dayjs 对象
const convertDatesToDayjs = (content: Record<string, any>, template: ReportTemplate | null) => {
  if (!template || !content) return content

  const converted = { ...content }
  for (const field of template.fields) {
    if (field.type === 'date' && converted[field.name]) {
      // 如果是字符串且不是 dayjs 对象，则转换
      if (typeof converted[field.name] === 'string' && !dayjs.isDayjs(converted[field.name])) {
        converted[field.name] = dayjs(converted[field.name])
      }
    }
  }
  return converted
}

// 当弹窗打开时加载模板和现有报告
watch(() => props.visible, async (val) => {
  if (val) {
    console.log('[Template Modal] Opening modal, loading templates...')

    // 加载选项数据
    try {
      const lookups = await lookupApi.getAll()
      productPlatformOptions.value = lookups.productPlatforms
      failureTypeOptions.value = lookups.failureTypes
    } catch (error) {
      console.error('[Template Modal] Failed to load lookup options:', error)
    }

    // 加载所有可用模板
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

    // 初始化匹配条件和加载现有报告
    if (props.part) {
      matchConditions.productPlatform = props.part.productPlatform
      matchConditions.failureType = props.part.failureType || undefined

      // 加载现有报告（获取已保存的模板ID）
      let existingReportContent: Record<string, any> | null = null
      let existingReportSummary = ''
      if (props.part.id) {
        try {
          const existingReport = await reportsApi.getLatestReportByPart(props.part.id)
          if (existingReport) {
            reportId.value = existingReport.id
            form.templateId = existingReport.templateId
            existingReportContent = existingReport.content || {}
            existingReportSummary = existingReport.summary || ''
          } else {
            // 没有现有报告，使用新表单
            reportId.value = undefined
            form.templateId = undefined
          }
        } catch {
          // 没有现有报告，使用新表单
          reportId.value = undefined
          form.templateId = undefined
        }
      }

      // 匹配模板（如果已有报告，会使用已保存的模板ID）
      await matchTemplates()

      // 如果有现有报告内容，转换日期字段为 dayjs 对象
      if (existingReportContent && Object.keys(existingReportContent).length > 0) {
        form.summary = existingReportSummary
        // 直接从 matchedTemplates 中查找当前模板
        const currentTemplate = matchedTemplates.value.find(t => t.id === form.templateId)
        form.content = convertDatesToDayjs(existingReportContent, currentTemplate || null)
      } else {
        form.content = {}
        form.summary = ''
      }
    }
  }
})

// 当模板变化时重置表单内容（仅当没有已保存的报告时）
watch(() => form.templateId, (newTemplateId) => {
  if (newTemplateId && !reportId.value) {
    // 切换模板时清空内容
    form.content = {}
  }
})

const handleCancel = () => {
  emit('update:visible', false)
}

const handleViewApproval = () => {
  emit('update:visible', false)
  emit('view-approval', props.part?.partNumber)
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;

  .match-conditions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    .conditions-label {
      font-weight: 500;
    }

    :deep(.ant-form-item) {
      margin-bottom: 0;
    }

    :deep(.ant-form-item-label) {
      padding-bottom: 0;
    }
  }

  .template-selector {
    display: flex;
    align-items: center;

    :deep(.ant-form-item) {
      margin-bottom: 0;
    }
  }

  .template-name {
    color: #1890ff;
  }
}
</style>

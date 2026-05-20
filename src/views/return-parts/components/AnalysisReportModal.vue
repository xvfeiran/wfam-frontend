<template>
  <a-modal
    :open="visible"
    :title="t('reportForm.detailedAnalysis')"
    width="800px"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <!-- 顶部匹配条件 -->
    <div class="match-conditions-card">
      <div class="match-conditions-header">
        <span class="conditions-icon">⚙</span>
        <span class="conditions-title">{{ t('reportForm.matchConditions') }}</span>
      </div>
      <div class="match-conditions-body">
        <a-form-item :label="t('returnPart.productPlatform')" class="condition-item">
          <a-select
            v-model:value="matchConditions.productPlatform"
            style="width: 160px"
            @change="handleMatchConditionsChange"
            allow-clear
            :disabled="isApproved"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option v-for="pc in productPlatformOptions" :key="pc" :value="pc">
              {{ pc }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('returnPart.failureType')" class="condition-item">
          <a-select
            v-model:value="matchConditions.failureType"
            style="width: 160px"
            @change="handleMatchConditionsChange"
            allow-clear
            :disabled="isApproved"
          >
            <a-select-option v-for="ft in failureTypeOptions" :key="ft" :value="ft">
              {{ t('returnPart.failureTypeLabels.' + ft) }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="matchedTemplates.length > 0" :label="t('reportForm.selectTemplate')" class="condition-item">
          <a-select v-model:value="form.templateId" style="width: 220px">
            <a-select-option v-for="tmpl in matchedTemplates" :key="tmpl.id" :value="tmpl.id">
              {{ tmpl.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </div>
    </div>

    <a-form :model="form" layout="vertical" ref="formRef">
      <template v-if="selectedTemplate">
        <a-divider>{{ t('reportForm.reportContent') }}</a-divider>

        <div class="responsibility-row" :class="{ 'responsibility-required': !form.responsibility }">
          <span class="responsibility-label">
            {{ t('reportForm.responsibility') }}
            <span class="required-star">*</span>
          </span>
          <a-radio-group v-model:value="form.responsibility" :disabled="isApproved" size="large">
            <a-radio-button value="B">
              <span class="resp-code">B</span> Bosch
            </a-radio-button>
            <a-radio-button value="C">
              <span class="resp-code">C</span> Customer
            </a-radio-button>
            <a-radio-button value="S">
              <span class="resp-code">S</span> Supplier
            </a-radio-button>
            <a-radio-button value="O">
              <span class="resp-code">O</span> Open
            </a-radio-button>
          </a-radio-group>
        </div>

        <template v-for="field in selectedTemplate.fields.filter(f => f.name !== 'responsibility')" :key="field.name">
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
        <a-button :disabled="!selectedTemplate || saveDraftDebounce.isDebouncing.value" :loading="saveDraftDebounce.isDebouncing.value" @click="handleSaveDraft">{{ t('common.save') }}</a-button>
        <a-button type="primary" :disabled="!selectedTemplate || submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('analysisForm.submitApproval') }}</a-button>
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
import { useDebouncedClick } from '@/composables/useDebouncedClick'
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

// 防抖处理（替代现有的 loading ref）
const saveDraftDebounce = useDebouncedClick({ delay: 1000 })
const submitDebounce = useDebouncedClick({ delay: 1000 })

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
  responsibility: undefined as string | undefined,
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

    // 当前 templateId 不在匹配结果中时，自动选第一个
    const currentIdInResults = allTemplates.some(t => t.id === form.templateId)
    if (!currentIdInResults && allTemplates.length > 0) {
      form.templateId = allTemplates[0].id
    } else if (allTemplates.length === 0) {
      form.templateId = undefined
    }
  } catch (error) {
    console.error('[Template Match] Failed to match templates:', error)
    matchedTemplates.value = []
    form.templateId = undefined
  }
}

// 处理匹配条件变化
const handleMatchConditionsChange = () => {
  matchTemplates()
}

const filterOption = (input: string, option: any) => {
  const label = option.children?.[0]?.children?.[0] ?? option.value ?? ''
  return label.toLowerCase().includes(input.toLowerCase())
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
            form.responsibility = existingReport.responsibility || undefined
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
        form.responsibility = undefined
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
  saveDraftDebounce.execute(async () => {
    try {
      if (!form.responsibility) {
        message.warning(t('reportForm.selectResponsibility'))
        return
      }
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
        partId: props.part!.id,
        templateId: selectedTemplate.value!.id,
        content: formattedContent,
        summary: form.summary,
        responsibility: form.responsibility,
        status: 'draft',
      })
      reportId.value = report.id
      message.success(t('message.draftSaved'))
    } catch {
      message.error(t('validation.formError'))
    }
  })
}

const handleDownload = async () => {
  if (!reportId.value) {
    message.warning(t('analysisForm.pleaseSaveFirst'))
    return
  }
  try {
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
  }
}

const handleSubmit = async () => {
  if (!props.part?.id || !selectedTemplate.value) return
  submitDebounce.execute(async () => {
    try {
      if (!form.responsibility) {
        message.warning(t('reportForm.selectResponsibility'))
        return
      }
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
        partId: props.part!.id,
        templateId: selectedTemplate.value!.id,
        content: formattedContent,
        summary: form.summary,
        responsibility: form.responsibility,
        status: 'submitted',
      })
      reportId.value = report.id
      emit('success')
    } catch {
      message.error(t('validation.formError'))
    }
  })
}
</script>

<style lang="less" scoped>
.match-conditions-card {
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;

  .match-conditions-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;

    .conditions-icon {
      font-size: 14px;
    }

    .conditions-title {
      font-size: 13px;
      font-weight: 600;
      color: #595959;
    }
  }

  .match-conditions-body {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    padding: 16px;

    .condition-item {
      margin-bottom: 0;
    }

    :deep(.ant-form-item-label) {
      padding-bottom: 4px;
    }
  }

}

.responsibility-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%);
  border: 1px solid #bae0ff;
  border-radius: 8px;
  transition: border-color 0.3s, box-shadow 0.3s;

  &.responsibility-required {
    border-color: #ffccc7;
    background: linear-gradient(135deg, #fff1f0 0%, #fff2f0 100%);
  }

  .responsibility-label {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;

    .required-star {
      color: #ff4d4f;
      margin-left: 2px;
    }
  }

  .resp-code {
    font-weight: 700;
    font-size: 15px;
  }

  :deep(.ant-radio-group) {
    .ant-radio-button-wrapper {
      height: 38px;
      line-height: 36px;
      font-size: 14px;
      padding: 0 18px;
      transition: all 0.2s;
    }
    .ant-radio-button-wrapper-checked {
      background: #1677ff;
      border-color: #1677ff;
      color: #fff;
      font-weight: 600;
    }
    .ant-radio-button-wrapper-checked:hover {
      background: #4096ff;
      border-color: #4096ff;
    }
  }
}
</style>

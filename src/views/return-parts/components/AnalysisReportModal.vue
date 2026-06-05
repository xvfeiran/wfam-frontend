<template>
  <a-modal
    :open="visible"
    :title="t('reportForm.detailedAnalysis')"
    :width="isPendingApproval ? '480px' : '800px'"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <!-- ── 已提交/待审批只读卡片（复用 PartDetail report-card 样式） ─── -->
    <template v-if="isReportSubmitted || isPendingApproval">
      <a-descriptions :column="1" size="small" bordered>
        <a-descriptions-item :label="t('partDetail.template')">
          {{ selectedTemplate?.name || '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('common.status')">
          <a-tag :color="reportStatusColor">{{ reportStatusLabel }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('reportForm.responsibility')">
          <a-tag v-if="form.responsibility">{{ form.responsibility }}</a-tag>
          <span v-else>-</span>
        </a-descriptions-item>
        <a-descriptions-item :label="t('partDetail.submittedTime')">
          {{ reportSubmittedAt || '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </template>

    <!-- ── 完整编辑表单（非待审批状态） ─────────────────────────────── -->
    <template v-else>

    <!-- 驳回原因提示 -->
    <a-alert
      v-if="reportRejectReason"
      :message="t('partDetail.rejectReason') + '：' + reportRejectReason"
      type="error"
      show-icon
      style="margin-bottom: 16px"
    />

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
            :disabled="isFormDisabled"
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
            :disabled="isFormDisabled"
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
          <a-radio-group v-model:value="form.responsibility" :disabled="isFormDisabled" size="large">
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
          <!--
            照片字段不用 a-form-item 包裹：
            a-upload(picture-card) 会在非渲染上下文中调用默认 slot，
            与 a-form-item 的 slot 渲染机制冲突，产生大量 "Slot invoked outside render" 告警。
            用普通 div 手动渲染 label，彻底绕开该 AntDV 内部问题。
          -->
          <template v-if="field.type === 'photo' || field.type === 'photolist'">
            <div class="photo-form-item">
              <div class="photo-form-label">
                <span v-if="field.required" class="required-star">* </span>{{ field.label }}
              </div>
              <div class="photo-upload-wrap">
                <!-- Upload + Camera action buttons -->
                <div v-if="isAssignedAnalyst && !isApproved && canUploadMore(field)" class="photo-action-buttons">
                  <div class="photo-action-btn" @click="triggerPhotoUpload(field.name, field.type)">
                    <UploadOutlined />
                    <span>{{ t('ocr.uploadPhoto') }}</span>
                  </div>
                  <div class="photo-action-divider" />
                  <div class="photo-action-btn" @click="openCameraFor(field.name)">
                    <CameraOutlined />
                    <span>{{ t('ocr.takePhoto') }}</span>
                  </div>
                </div>
                <!-- File list display (trigger hidden via CSS) -->
                <a-upload
                  :file-list="photoFileLists[field.name] || []"
                  list-type="picture-card"
                  accept="image/*"
                  v-bind="field.type === 'photo' ? { maxCount: 1 } : {}"
                  :custom-request="(opts: any) => handlePhotoUpload(field.name, opts)"
                  :disabled="isFormDisabled"
                  :on-remove="(f: any) => handlePhotoRemove(field.name, f)"
                  @update:file-list="(list: any[]) => { photoFileLists[field.name] = list }"
                >
                  <span style="display:none"></span>
                </a-upload>
                <span v-if="field.required" class="photo-required-tip">
                  <span class="required-star">*</span> {{ t('reportForm.photoRequired') }}
                </span>
              </div>
            </div>
          </template>

          <!-- 普通字段：使用 a-form-item（支持校验） -->
          <a-form-item
            v-else
            :label="field.label"
            :name="['content', field.name]"
            :rules="field.required
              ? [{ required: true, message: t('reportForm.enterField', { field: field.label }) }]
              : []"
          >
            <template v-if="field.type === 'text'">
              <a-input v-model:value="form.content[field.name]" :placeholder="t('reportForm.inputField', { field: field.label })" :disabled="isFormDisabled" />
            </template>
            <template v-else-if="field.type === 'textarea'">
              <a-textarea v-model:value="form.content[field.name]" :placeholder="t('reportForm.inputField', { field: field.label })" :rows="3" :disabled="isFormDisabled" />
            </template>
            <template v-else-if="field.type === 'select'">
              <a-select v-model:value="form.content[field.name]" :placeholder="t('reportForm.selectField', { field: field.label })" :disabled="isFormDisabled">
                <a-select-option v-for="opt in field.options" :key="opt" :value="opt">
                  {{ opt }}
                </a-select-option>
              </a-select>
            </template>
            <template v-else-if="field.type === 'date'">
              <!-- 始终传 dayjs 对象给 picker，防止 content 里残留字符串时 picker setup 崩溃 -->
              <a-date-picker
                :value="form.content[field.name] != null ? dayjs(form.content[field.name]) : null"
                style="width: 100%"
                :disabled="isFormDisabled"
                @update:value="(val: any) => { form.content[field.name] = val }"
              />
            </template>
            <template v-else-if="field.type === 'number'">
              <a-input-number v-model:value="form.content[field.name]" style="width: 100%" :disabled="isFormDisabled" />
            </template>
          </a-form-item>
        </template>
      </template>

      <a-empty v-else :description="t('reportForm.noTemplateMatched')" />
    </a-form>

    <!-- Hidden file input for photo upload -->
    <input
      ref="photoInputRef"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="onPhotoInputChange"
    />
    <!-- Camera capture modal -->
    <CameraCapture
      v-model:open="cameraOpen"
      @captured="onCameraCaptured"
    />

    </template><!-- end v-else (完整表单) -->

    <template #footer>
      <!-- 已提交（等待所有抽样件提交后进入审批）：只读 + 撤回 -->
      <template v-if="isReportSubmitted">
        <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
        <a-button :disabled="!reportId || downloadDebounce.isDebouncing.value" :loading="downloadDebounce.isDebouncing.value" @click="handleDownload">
          <DownloadOutlined /> {{ t('analysisForm.downloadReport') }}
        </a-button>
        <a-popconfirm v-if="isAssignedAnalyst" :title="t('approval.confirmWithdrawApplication')" @confirm="handleWithdraw">
          <a-button type="primary" danger :disabled="!reportId || withdrawDebounce.isDebouncing.value" :loading="withdrawDebounce.isDebouncing.value">
            {{ t('common.withdraw') }}
          </a-button>
        </a-popconfirm>
      </template>

      <!-- 待审批：简洁卡片的操作按钮 -->
      <template v-else-if="isPendingApproval">
        <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
        <a-button :disabled="!reportId || downloadDebounce.isDebouncing.value" :loading="downloadDebounce.isDebouncing.value" @click="handleDownload">
          <DownloadOutlined /> {{ t('analysisForm.downloadReport') }}
        </a-button>
        <a-button type="primary" @click="handleViewApproval">
          {{ t('analysisForm.viewApprovalProgress') }}
        </a-button>
      </template>

      <!-- 已审批通过：只读 -->
      <template v-else-if="isApproved">
        <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
        <a-button :disabled="!selectedTemplate || downloadDebounce.isDebouncing.value" :loading="downloadDebounce.isDebouncing.value" @click="handleDownload">
          <DownloadOutlined /> {{ t('analysisForm.downloadReport') }}
        </a-button>
      </template>

      <!-- 编辑态（非分析师只读查看） -->
      <template v-else>
        <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
        <a-button :disabled="!selectedTemplate || downloadDebounce.isDebouncing.value" :loading="downloadDebounce.isDebouncing.value" @click="handleDownload">
          <DownloadOutlined /> {{ t('analysisForm.downloadReport') }}
        </a-button>
        <a-button v-if="isAssignedAnalyst" :disabled="!selectedTemplate || saveDraftDebounce.isDebouncing.value" :loading="saveDraftDebounce.isDebouncing.value" @click="handleSaveDraft">{{ t('common.save') }}</a-button>
        <a-button v-if="isAssignedAnalyst" type="primary" :disabled="!selectedTemplate || submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('analysisForm.submitApproval') }}</a-button>
      </template>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { DownloadOutlined, CameraOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { reportsApi } from '@/services/reportsApi'
import { lookupApi } from '@/services/lookupApi'
import { analysisAttachmentApi, fileApi } from '@/services/fileApi'
import { PartStatus } from '@/types'
import type { Part, ReportTemplate } from '@/types'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import { usePermissions } from '@/composables/usePermissions'
import dayjs from 'dayjs'
import CameraCapture from '@/components/CameraCapture.vue'

const { t } = useI18n()
const { currentUserUsername } = usePermissions()

const props = defineProps<{
  visible: boolean
  part: Part | null
}>()

const emit = defineEmits(['update:visible', 'success', 'view-approval'])

// 仅当前用户是该零件的分析师时才允许编辑/暂存/提交
const isAssignedAnalyst = computed(() => {
  if (!props.part?.analyst) return true // 未指定分析师时允许操作（向后兼容）
  return currentUserUsername.value === props.part.analyst
})

const formRef = ref()
const templates = ref<ReportTemplate[]>([])
const reportId = ref<string>()
// 报告只读摘要（待审批/已审批时展示卡片用）
const reportStatus = ref<string>()
const reportSubmittedAt = ref<string>()
const reportRejectReason = ref<string>()

// 防抖处理（替代现有的 loading ref）
const saveDraftDebounce = useDebouncedClick({ delay: 1000 })
const submitDebounce = useDebouncedClick({ delay: 1000 })
const downloadDebounce = useDebouncedClick({ delay: 1000 })
const withdrawDebounce = useDebouncedClick({ delay: 1000 })

// Camera & manual upload state
const cameraOpen = ref(false)
const cameraFieldName = ref('')
const currentUploadField = reactive({ name: '', type: '' })
const photoInputRef = ref<HTMLInputElement | null>(null)

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
  responsibility: undefined as string | undefined,
})

// ── 照片字段管理 ──────────────────────────────────────────────────────────
// key: field.name，value: ant-design UploadFile 对象列表
const photoFileLists = reactive<Record<string, any[]>>({})

/** 从已有报告内容初始化照片列表（打开弹窗时调用） */
const initPhotoFileLists = (content: Record<string, any>, template: typeof selectedTemplate.value) => {
  Object.keys(photoFileLists).forEach(k => { delete photoFileLists[k] })
  if (!template) return
  for (const field of template.fields) {
    if (field.type === 'photo') {
      const path = content[field.name]
      photoFileLists[field.name] = path
        ? [{ uid: `pre-${field.name}`, name: String(path).split('/').pop() || field.name, status: 'done', url: fileApi.getFileUrl(String(path)), response: { relativePath: path } }]
        : []
    } else if (field.type === 'photolist') {
      const paths: string[] = Array.isArray(content[field.name]) ? content[field.name] : []
      photoFileLists[field.name] = paths.map((p, i) => ({
        uid: `pre-${field.name}-${i}`,
        name: p.split('/').pop() || `photo_${i}`,
        status: 'done',
        url: fileApi.getFileUrl(p),
        response: { relativePath: p },
      }))
    }
  }
}

/**
 * 上传前确保草稿已保存，返回 reportId。
 * 照片上传需要 reportId 才能关联到正确的附件路径。
 */
const ensureReportSaved = async (): Promise<string | null> => {
  if (reportId.value) return reportId.value
  if (!props.part?.id || !selectedTemplate.value) {
    message.warning(t('reportForm.noTemplateMatched'))
    return null
  }
  if (!form.responsibility) {
    message.warning(t('reportForm.selectResponsibility'))
    return null
  }
  try {
    const report = await reportsApi.saveReport({
      partId: props.part.id,
      templateId: selectedTemplate.value.id,
      content: form.content,

      responsibility: form.responsibility,
      status: 'draft',
    })
    reportId.value = report.id
    return report.id
  } catch {
    message.error(t('message.saveFailed'))
    return null
  }
}

const canUploadMore = (field: any) => {
  if (field.type === 'photo') {
    const list = photoFileLists[field.name] || []
    return list.filter((f: any) => f.status === 'done').length < 1
  }
  return true
}

/** Unified photo file upload (used by both file input and camera capture) */
const uploadPhotoFile = async (fieldName: string, file: File) => {
  const rid = await ensureReportSaved()
  if (!rid) return

  try {
    const result = await analysisAttachmentApi.upload(rid, file)
    const uid = `up-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const currentList = photoFileLists[fieldName] || []
    photoFileLists[fieldName] = [...currentList, {
      uid,
      name: file.name,
      status: 'done',
      url: fileApi.getFileUrl(result.relativePath),
      response: result,
    }]

    const field = selectedTemplate.value?.fields.find(f => f.name === fieldName)
    if (field?.type === 'photolist') {
      const existing = Array.isArray(form.content[fieldName]) ? form.content[fieldName] : []
      form.content[fieldName] = [...existing, result.relativePath]
    } else {
      form.content[fieldName] = result.relativePath
    }

    reportsApi.saveReport({
      partId: props.part!.id,
      templateId: selectedTemplate.value!.id,
      content: form.content,

      responsibility: form.responsibility,
      status: 'draft',
    }).catch(() => {})
  } catch {
    message.error(t('message.uploadFailed'))
  }
}

const triggerPhotoUpload = (fieldName: string, fieldType: string) => {
  currentUploadField.name = fieldName
  currentUploadField.type = fieldType
  photoInputRef.value?.click()
}

const onPhotoInputChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  const fieldName = currentUploadField.name
  const maxCount = currentUploadField.type === 'photo' ? 1 : Infinity

  for (let i = 0; i < files.length; i++) {
    const list = photoFileLists[fieldName] || []
    if (list.length >= maxCount) break
    await uploadPhotoFile(fieldName, files[i])
  }

  input.value = ''
}

const openCameraFor = (fieldName: string) => {
  cameraFieldName.value = fieldName
  cameraOpen.value = true
}

const onCameraCaptured = async (file: File) => {
  await uploadPhotoFile(cameraFieldName.value, file)
}

/** 照片/照片列表字段的上传处理（customRequest）
 *  上传成功后立即更新 form.content 并异步持久化到 DB，
 *  确保照片路径在重新打开弹窗时仍可见。
 */
const handlePhotoUpload = async (fieldName: string, { file, onSuccess, onError }: any) => {
  const rid = await ensureReportSaved()
  if (!rid) {
    onError(new Error('Report not saved'))
    return
  }
  try {
    const result = await analysisAttachmentApi.upload(rid, file as File)
    onSuccess(result)

    // 立即更新 form.content 中的路径
    const field = selectedTemplate.value?.fields.find(f => f.name === fieldName)
    if (field?.type === 'photolist') {
      const existing = Array.isArray(form.content[fieldName]) ? form.content[fieldName] : []
      form.content[fieldName] = [...existing, result.relativePath]
    } else {
      form.content[fieldName] = result.relativePath
    }

    // 异步持久化到 DB（fire-and-forget）
    reportsApi.saveReport({
      partId: props.part!.id,
      templateId: selectedTemplate.value!.id,
      content: form.content,

      responsibility: form.responsibility,
      status: 'draft',
    }).catch(() => { /* 后台保存失败忽略，不影响上传体验 */ })
  } catch (e) {
    onError(e)
    message.error(t('message.uploadFailed'))
  }
}

/** 删除照片附件（返回 false 时 ant-design 会阻止从列表移除）
 *  删除成功后立即更新 form.content 并异步持久化到 DB。
 */
const handlePhotoRemove = async (fieldName: string, file: any): Promise<boolean> => {
  const relativePath = file.response?.relativePath
  if (relativePath && reportId.value) {
    try {
      await analysisAttachmentApi.delete(reportId.value, relativePath)

      // 立即更新 form.content 中的路径
      const field = selectedTemplate.value?.fields.find(f => f.name === fieldName)
      if (field?.type === 'photolist') {
        const existing = Array.isArray(form.content[fieldName]) ? form.content[fieldName] : []
        const updated = (existing as string[]).filter(p => p !== relativePath)
        form.content[fieldName] = updated.length ? updated : undefined
      } else {
        form.content[fieldName] = undefined
      }

      // 异步持久化到 DB（fire-and-forget）
      reportsApi.saveReport({
        partId: props.part!.id,
        templateId: selectedTemplate.value!.id,
        content: form.content,
  
        responsibility: form.responsibility,
        status: 'draft',
      }).catch(() => { /* 后台保存失败忽略 */ })
    } catch {
      message.error(t('message.deleteFailed'))
      return false
    }
  }
  return true
}

// 根据选中的模板ID获取当前模板
const selectedTemplate = computed(() => {
  return matchedTemplates.value.find(t => t.id === form.templateId) || null
})

// 报告状态展示（与 PartDetail 保持一致）
const REPORT_STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
}
const reportStatusColor = computed(() => REPORT_STATUS_COLOR[reportStatus.value || ''] || 'default')
const reportStatusLabel = computed(() => {
  const map: Record<string, string> = {
    draft: t('partDetail.reportDraft'),
    submitted: t('partDetail.reportPending'),
    approved: t('partDetail.reportApproved'),
    rejected: t('partDetail.reportRejected'),
  }
  return map[reportStatus.value || ''] || (reportStatus.value || '-')
})

// 是否处于待审批状态（已提交，等待审批）
const isPendingApproval = computed(() => {
  return props.part?.status === PartStatus.PENDING_APPROVAL
})

// 是否处于已提交状态（报告已提交，等待所有抽样件提交后进入审批）
const isReportSubmitted = computed(() => {
  return props.part?.status === PartStatus.ANALYSIS_REPORT_SUBMITTED
})

// 是否已审批通过（只读，不可再编辑）
const isApproved = computed(() => {
  return props.part?.status === PartStatus.ANALYSIS_COMPLETED
})

// 表单是否只读（已审批通过 或 非指定分析师）
const isFormDisabled = computed(() => isApproved.value || !isAssignedAnalyst.value)

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

      // 加载现有报告，并从报告对应的模板反查匹配条件
      let existingReportContent: Record<string, any> | null = null
      if (props.part.id) {
        try {
          const existingReport = await reportsApi.getLatestReportByPart(props.part.id)
          if (existingReport) {
            reportId.value = existingReport.id
            form.templateId = existingReport.templateId          // 保留上次用的模板
            existingReportContent = existingReport.content || {}
            form.responsibility = existingReport.responsibility || undefined
            reportStatus.value = existingReport.status
            reportSubmittedAt.value = existingReport.submittedAt
            reportRejectReason.value = existingReport.rejectReason || undefined

            // 从模板元数据反查上次使用的匹配条件，确保 matchTemplates() 能找到同一模板
            const savedTemplate = templates.value.find(t => t.id === existingReport.templateId)
            if (savedTemplate) {
              // 模板有明确的 productPlatform → 用模板的；否则 fallback 到 part 的字段
              if (savedTemplate.productPlatform) {
                matchConditions.productPlatform = savedTemplate.productPlatform
              }
              if (savedTemplate.failureType) {
                matchConditions.failureType = savedTemplate.failureType
              }
            }
          } else {
            reportId.value = undefined
            form.templateId = undefined
          }
        } catch {
          reportId.value = undefined
          form.templateId = undefined
        }
      }

      // 用还原后的匹配条件拉取模板列表，form.templateId 已设置，matchTemplates() 会优先保留它
      await matchTemplates()

      // 用已有报告的内容填充最新模板的字段（字段名相同的自动对应，新增字段留空）
      if (existingReportContent && Object.keys(existingReportContent).length > 0) {
        const currentTemplate = matchedTemplates.value.find(t => t.id === form.templateId) || null
        form.content = convertDatesToDayjs(existingReportContent, currentTemplate)
        initPhotoFileLists(form.content, currentTemplate)
      } else {
        form.content = {}
        form.responsibility = undefined
        Object.keys(photoFileLists).forEach(k => { delete photoFileLists[k] })
      }
    }
  }
})

// 当模板变化时重置表单内容和照片列表（仅当没有已保存的报告时）
watch(() => form.templateId, (newTemplateId) => {
  if (newTemplateId && !reportId.value) {
    form.content = {}
    Object.keys(photoFileLists).forEach(k => { delete photoFileLists[k] })
  }
})

/**
 * 校验所有 required 照片字段是否已上传。
 * 因为照片字段脱离了 a-form-item，formRef.validate() 不会覆盖它们，需手动检查。
 * @returns true = 通过，false = 有缺失（已 message.warning）
 */
const validateRequiredPhotos = (): boolean => {
  if (!selectedTemplate.value) return true
  for (const field of selectedTemplate.value.fields) {
    if ((field.type === 'photo' || field.type === 'photolist') && field.required) {
      const list = photoFileLists[field.name] || []
      const uploaded = list.filter((f: any) => f.status === 'done')
      if (uploaded.length === 0) {
        message.warning(t('reportForm.photoFieldRequired', { field: field.label }))
        return false
      }
    }
  }
  return true
}

const handleCancel = () => {
  Object.keys(photoFileLists).forEach(k => { delete photoFileLists[k] })
  reportStatus.value = undefined
  reportSubmittedAt.value = undefined
  reportRejectReason.value = undefined
  emit('update:visible', false)
}

const handleViewApproval = () => {
  emit('update:visible', false)
  emit('view-approval', props.part?.partNumber)
}

const handleWithdraw = () => {
  withdrawDebounce.execute(async () => {
    if (!reportId.value) return
    try {
      await reportsApi.withdrawReport(reportId.value)
      emit('update:visible', false)
      emit('success')
    } catch {
      message.error(t('message.operationFailed'))
    }
  })
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

const handleDownload = () => {
  downloadDebounce.execute(async () => {
    if (!reportId.value) {
      message.warning(t('analysisForm.pleaseSaveFirst'))
      return
    }
    try {
      const blob = await reportsApi.exportReport(reportId.value)
      console.log(`[Download] reportId=${reportId.value}, blobSize=${blob.size}, blobType=${blob.type}`)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${props.part?.partNumber}_${Date.now()}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      message.success(t('message.downloadSuccess'))
    } catch (e) {
      console.error('[Download] Failed:', e)
      message.error(t('message.exportFailed'))
    }
  })
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
      // 照片字段不在 a-form-item 内，需单独校验
      if (!validateRequiredPhotos()) return

      // 格式化日期字段
      const formattedContent: Record<string, any> = {}
      for (const [key, value] of Object.entries(form.content)) {
        if (dayjs.isDayjs(value)) {
          formattedContent[key] = value.format('YYYY-MM-DD')
        } else {
          formattedContent[key] = value
        }
      }

      // Step 1: 保存报告数据（draft）
      const report = await reportsApi.saveReport({
        partId: props.part!.id,
        templateId: selectedTemplate.value!.id,
        content: formattedContent,
  
        responsibility: form.responsibility,
        status: 'draft',
      })
      reportId.value = report.id

      // Step 2: 调用专用提交端点，触发 Part → analysis_report_submitted 联动
      await reportsApi.submitReport(report.id)
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

// ── 照片字段容器（替代 a-form-item，避免 slot-outside-render 告警） ──────
.photo-form-item {
  margin-bottom: 24px; // 与 a-form-item 默认间距一致

  .photo-form-label {
    margin-bottom: 8px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.88);

    .required-star {
      color: #ff4d4f;
      font-family: SimSun, sans-serif;
      font-size: 14px;
      margin-inline-end: 4px;
    }
  }
}

// ── 照片上传字段样式 ─────────────────────────────────────────────────────
.photo-upload-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;

  // 保证 picture-card 模式下不溢出表单
  :deep(.ant-upload-list-picture-card) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  :deep(.ant-upload.ant-upload-select) {
    display: none !important;
  }
}

.photo-action-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;

  .photo-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 36px;
    cursor: pointer;
    font-size: 13px;
    color: #595959;
    transition: background 0.2s, color 0.2s;
    user-select: none;
    background: #fafafa;

    &:first-child {
      border-radius: 8px 0 0 8px;
    }
    &:last-child {
      border-radius: 0 8px 8px 0;
    }
    &:hover {
      background: #e6f4ff;
      color: #1677ff;
    }
    &:active {
      background: #bae0ff;
    }

    .anticon {
      font-size: 24px;
      color: #8c8c8c;
    }
    &:hover .anticon {
      color: #1677ff;
    }
  }

  .photo-action-divider {
    width: 1px;
    background: #e8e8e8;
    flex-shrink: 0;
  }

  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.photo-required-tip {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;

  .required-star {
    color: #ff4d4f;
    margin-right: 2px;
  }
}
</style>

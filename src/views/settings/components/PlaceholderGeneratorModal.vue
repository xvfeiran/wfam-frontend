<template>
  <a-modal
    :open="props.visible"
    :title="t('settings.pgTitle')"
    :width="560"
    :footer="null"
    @cancel="$emit('cancel')"
  >
    <a-form layout="vertical" :model="form">
      <!-- 字段类型：可点击卡片 -->
      <a-form-item :label="t('settings.pgFieldType')">
        <div class="type-cards">
          <div
            v-for="ft in fieldTypes"
            :key="ft.value"
            class="type-card"
            :class="{ active: form.type === ft.value }"
            @click="form.type = ft.value"
          >
            <component :is="ft.icon" />
            <span>{{ t(ft.labelKey) }}</span>
          </div>
        </div>
      </a-form-item>

      <!-- 字段名 -->
      <a-form-item :label="t('settings.pgFieldName')" required>
        <a-input
          v-model:value="form.fieldName"
          :placeholder="t('settings.pgFieldNamePlaceholder')"
        />
        <div v-if="fieldNameError" class="field-error">{{ fieldNameError }}</div>
      </a-form-item>

      <!-- 中文标签 -->
      <a-form-item :label="t('settings.pgLabelZh')">
        <a-input v-model:value="form.labelZh" />
      </a-form-item>

      <!-- 英文标签 -->
      <a-form-item :label="t('settings.pgLabelEn')">
        <a-input v-model:value="form.labelEn" />
      </a-form-item>

      <!-- 必填 -->
      <a-form-item :label="t('settings.pgRequired')">
        <a-switch v-model:checked="form.required" />
      </a-form-item>

      <!-- 选项：仅 select 显示 -->
      <a-form-item v-if="form.type === 'select'" :label="t('settings.pgOptions')">
        <a-input
          v-model:value="form.options"
          :placeholder="t('settings.pgOptionsPlaceholder')"
        />
        <div v-if="!form.options" class="field-warn">{{ t('settings.pgOptionsHint') }}</div>
      </a-form-item>

      <!-- 预览 -->
      <a-form-item :label="t('settings.pgPreview')">
        <div class="preview-box" :class="{ invalid: !isValid }">
          <code>{{ placeholder }}</code>
        </div>
      </a-form-item>

      <!-- 操作 -->
      <div class="actions">
        <a-button @click="handleReset">{{ t('settings.pgReset') }}</a-button>
        <a-button type="primary" :disabled="!isValid" @click="handleCopy">
          {{ t('settings.pgCopy') }}
        </a-button>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  EditOutlined,
  AlignLeftOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  NumberOutlined,
  PictureOutlined,
  FileImageOutlined,
} from '@ant-design/icons-vue'

type FieldType = 'text' | 'textarea' | 'select' | 'date' | 'number' | 'photo' | 'photolist'

interface Props {
  visible: boolean
}
const props = defineProps<Props>()
defineEmits<{ (e: 'cancel'): void }>()

const { t } = useI18n()

const fieldTypes: { value: FieldType; icon: any; labelKey: string }[] = [
  { value: 'text', icon: EditOutlined, labelKey: 'settings.pgTypeText' },
  { value: 'textarea', icon: AlignLeftOutlined, labelKey: 'settings.pgTypeTextarea' },
  { value: 'select', icon: UnorderedListOutlined, labelKey: 'settings.pgTypeSelect' },
  { value: 'date', icon: CalendarOutlined, labelKey: 'settings.pgTypeDate' },
  { value: 'number', icon: NumberOutlined, labelKey: 'settings.pgTypeNumber' },
  { value: 'photo', icon: PictureOutlined, labelKey: 'settings.pgTypePhoto' },
  { value: 'photolist', icon: FileImageOutlined, labelKey: 'settings.pgTypePhotolist' },
]

const form = reactive({
  type: 'text' as FieldType,
  fieldName: '',
  labelZh: '',
  labelEn: '',
  required: false,
  options: '',
})

const ILLEGAL = /[:\[\]]/

const fieldNameError = computed(() => {
  if (!form.fieldName) return ''
  if (ILLEGAL.test(form.fieldName)) return t('settings.pgFieldNameIllegal')
  return ''
})

const isValid = computed(() => !!form.fieldName && !ILLEGAL.test(form.fieldName))

const placeholder = computed(() => {
  const opts = form.type === 'select' ? form.options : ''
  return `[[${form.type}:${form.fieldName}:${form.labelZh}:${form.labelEn}:${form.required}:${opts}]]`
})

const handleCopy = async () => {
  if (!isValid.value) return
  try {
    await navigator.clipboard.writeText(placeholder.value)
    message.success(t('settings.pgCopySuccess'))
  } catch {
    message.error(t('settings.pgCopyFailed'))
  }
}

const handleReset = () => {
  form.type = 'text'
  form.fieldName = ''
  form.labelZh = ''
  form.labelEn = ''
  form.required = false
  form.options = ''
}
</script>

<style lang="less" scoped>
.type-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 72px;
  padding: 8px 4px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  &:hover {
    border-color: #1890ff;
  }
  &.active {
    border-color: #1890ff;
    background: #e6f7ff;
    color: #1890ff;
  }
  .anticon {
    font-size: 18px;
    margin-bottom: 4px;
  }
}
.field-error {
  margin-top: 4px;
  font-size: 12px;
  color: #ff4d4f;
}
.field-warn {
  margin-top: 4px;
  font-size: 12px;
  color: #faad14;
}
.preview-box {
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  word-break: break-all;
  code {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    color: #333;
  }
  &.invalid code {
    color: #ff4d4f;
  }
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

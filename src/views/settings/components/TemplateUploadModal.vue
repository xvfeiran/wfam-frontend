<template>
  <a-modal
    :open="visible"
    :title="t('settings.uploadTemplateTitle')"
    @ok="$emit('upload')"
    @cancel="$emit('cancel')"
  >
    <a-form :model="form" layout="vertical" ref="formRef">
      <a-form-item :label="t('settings.templateName')" name="name">
        <a-input v-model:value="form.name" :placeholder="t('settings.templateNamePlaceholder')" />
      </a-form-item>
      <a-form-item :label="t('settings.productPlatform')" name="productPlatform" :rules="[{ required: true, message: t('settings.pleaseSelectPlatform') }]">
        <a-select v-model:value="form.productPlatform" :placeholder="t('settings.pleaseSelectPlatform')">
          <a-select-option v-for="pp in productPlatforms" :key="pp" :value="pp">{{ pp }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="t('settings.failureType')" name="failureType" :rules="[{ required: true, message: t('settings.pleaseSelectFailureType') }]">
        <a-select v-model:value="form.failureType" :placeholder="t('settings.pleaseSelectFailureType')">
          <a-select-option v-for="ft in failureTypes" :key="ft" :value="ft">{{ ft }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="t('settings.templateFile')">
        <a-upload
          v-model:file-list="form.fileList"
          :before-upload="() => false"
          :max-count="1"
          accept=".xlsx,.xls"
        >
          <a-button>
            <UploadOutlined /> {{ t('settings.selectExcelFile') }}
          </a-button>
        </a-upload>
        <div class="field-tip">{{ t('settings.supportFormat') }}</div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { UploadOutlined } from '@ant-design/icons-vue'

interface TemplateForm {
  name?: string
  productPlatform?: string
  failureType?: string
  fileList: any[]
}

interface Props {
  visible: boolean
  form: TemplateForm
  productPlatforms: string[]
  failureTypes: string[]
}

defineProps<Props>()

defineEmits<{
  (e: 'upload'): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()
</script>

<style lang="less" scoped>
.field-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
</style>

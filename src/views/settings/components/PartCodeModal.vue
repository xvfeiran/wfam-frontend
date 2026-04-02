<template>
  <a-modal
    :open="visible"
    :title="isEdit ? t('settings.editPartCode') : t('settings.addPartCode')"
    @ok="$emit('save')"
    @cancel="$emit('cancel')"
  >
    <a-form :model="form" layout="vertical">
      <a-form-item :label="t('settings.partCode')" name="partCode" :rules="[{ required: true, message: t('settings.pleaseInputPartCode') }]">
        <a-input v-model:value="form.partCode" :placeholder="t('settings.pleaseInputPartCode')" />
      </a-form-item>
      <a-form-item :label="t('settings.businessUnit')" name="businessUnit">
        <a-input v-model:value="form.businessUnit" :placeholder="t('settings.pleaseInputBusinessUnit')" />
      </a-form-item>
      <a-form-item :label="t('settings.productPlatform')" name="productPlatform">
        <a-input v-model:value="form.productPlatform" :placeholder="t('settings.pleaseInputProductPlatform')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface PartCodeForm {
  id: string
  partCode: string
  businessUnit: string
  productPlatform: string
}

interface Props {
  visible: boolean
  form: PartCodeForm
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'save'): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()

const isEdit = computed(() => !!props.form.id)
</script>

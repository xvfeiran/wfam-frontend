<template>
  <a-modal
    :open="visible"
    :title="isEdit ? t('settings.editCustomer') : t('settings.addCustomer')"
    @ok="$emit('save')"
    @cancel="$emit('cancel')"
  >
    <a-form :model="form" layout="vertical" ref="formRef">
      <a-form-item :label="t('settings.customer')" name="name" :rules="[{ required: true, message: t('settings.pleaseInputCustomer') }]">
        <a-input v-model:value="form.name" :placeholder="t('settings.pleaseInputCustomer')" />
      </a-form-item>
      <a-form-item :label="t('settings.customerCode')" name="code">
        <a-input v-model:value="form.code" :placeholder="t('settings.pleaseInputCustomerCode')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface CustomerForm {
  id: string
  name: string
  code: string | undefined
}

interface Props {
  visible: boolean
  form: CustomerForm
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'save'): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()

const isEdit = computed(() => !!props.form.id)
</script>

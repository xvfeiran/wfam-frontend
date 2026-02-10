<template>
  <a-modal
    :open="visible"
    :title="part ? t('modal.editPart') : t('modal.newPart')"
    width="600px"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <a-form :model="form" :rules="rules" layout="vertical" ref="formRef">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.partCode')" name="partCode">
            <a-input v-model:value="form.partCode" :placeholder="t('validation.inputPartCode')" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.businessUnit')" name="businessUnit">
            <a-select v-model:value="form.businessUnit" :placeholder="t('validation.selectBusinessUnit')">
              <a-select-option v-for="bu in businessUnits" :key="bu" :value="bu">
                {{ bu }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.productPlatform')" name="productPlatform">
            <a-select v-model:value="form.productPlatform" :placeholder="t('validation.selectProductPlatform')">
              <a-select-option v-for="pp in productPlatforms" :key="pp" :value="pp">
                {{ pp }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('partDetail.productionShift')">
            <a-input v-model:value="form.productionShift" :placeholder="t('returnPart.productionShift')" />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { lookupApi } from '@/services/lookupApi'
import type { Part } from '@/types'
import { PartStatus } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  part: Part | null
}>()

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref()
const businessUnits = ref<string[]>([])
const productPlatforms = ref<string[]>([])

watch(() => props.visible, async (val) => {
  if (val && businessUnits.value.length === 0) {
    const lookups = await lookupApi.getAll()
    businessUnits.value = lookups.businessUnits
    productPlatforms.value = lookups.productPlatforms
  }
})

const form = reactive({
  partCode: '',
  businessUnit: undefined as string | undefined,
  productPlatform: undefined as string | undefined,
  productionShift: '',
})

const rules = {
  partCode: [{ required: true, message: t('validation.inputPartCode') }],
  businessUnit: [{ required: true, message: t('validation.selectBusinessUnit') }],
  productPlatform: [{ required: true, message: t('validation.selectProductPlatform') }],
}

watch(
  () => props.part,
  (part) => {
    if (part) {
      form.partCode = part.partCode
      form.businessUnit = part.businessUnit
      form.productPlatform = part.productPlatform
      form.productionShift = part.productionShift || ''
    } else {
      form.partCode = ''
      form.businessUnit = undefined
      form.productPlatform = undefined
      form.productionShift = ''
    }
  },
  { immediate: true }
)

const handleCancel = () => {
  emit('update:visible', false)
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    const newPart: Part = {
      id: props.part?.id || String(Date.now()),
      partNumber: `${form.businessUnit}-${form.productPlatform}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      orderId: '',
      partCode: form.partCode,
      businessUnit: form.businessUnit!,
      productPlatform: form.productPlatform!,
      productionShift: form.productionShift,
      status: PartStatus.REGISTERED,
      images: [],
      createdBy: '管理员',
      createdAt: new Date().toISOString(),
    }
    emit('success', newPart)
  } catch {
    // 验证失败
  }
}
</script>

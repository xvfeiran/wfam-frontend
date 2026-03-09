<template>
  <a-card :title="t('returnPart.photoUpload')" class="upload-card">
    <a-upload
      v-model:file-list="fileList"
      list-type="picture-card"
      :before-upload="() => false"
      :max-count="20"
      multiple
      @preview="handlePreview"
    >
      <div v-if="fileList.length < 20">
        <PlusOutlined />
        <div style="margin-top: 8px">{{ t('returnPart.upload') }}</div>
      </div>
    </a-upload>
    <div class="upload-tip">
      {{ t('returnPart.uploadTip') }}
    </div>
  </a-card>

  <a-modal :open="previewVisible" :footer="null" @cancel="previewVisible = false">
    <img :src="previewImage" style="width: 100%" />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusOutlined } from '@ant-design/icons-vue'

interface Props {
  imageFiles: any[]
}

interface Emits {
  (e: 'update:imageFiles', value: any[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const previewVisible = ref(false)
const previewImage = ref('')

const fileList = ref<any[]>(props.imageFiles || [])

watch(() => props.imageFiles, (newVal) => {
  fileList.value = newVal || []
})

watch(fileList, (newVal) => {
  emit('update:imageFiles', newVal)
})

const handlePreview = (file: any) => {
  previewImage.value = file.url || file.thumbUrl
  previewVisible.value = true
}
</script>

<style lang="less" scoped>
.upload-card {
  margin-bottom: 16px;

  .upload-tip {
    margin-top: 8px;
    color: #999;
    font-size: 12px;
  }
}
</style>

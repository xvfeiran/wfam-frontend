<template>
  <div class="ocr-result" v-if="result && result.status !== 'loading' || result?.status === 'loading'">
    <template v-if="result?.status === 'loading'">
      <a-spin size="small" />
      <span class="loading-text">{{ t('ocr.loading') }}</span>
    </template>
    <template v-else-if="result?.status === 'success'">
      <div class="success-result">
        <span class="result-value">{{ result.value }}</span>
        <a-button type="link" size="small" @click="$emit('apply')">{{ t('common.apply') }}</a-button>
      </div>
    </template>
    <template v-else-if="result?.status === 'error'">
      <span class="error-text">{{ t('ocr.error') }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface OCRResultItem {
  value: string
  status: 'loading' | 'success' | 'error'
  confidence?: number
}

defineProps<{
  result?: OCRResultItem
}>()

defineEmits(['apply'])
</script>

<style lang="less" scoped>
.ocr-result {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;

  .loading-text {
    color: #999;
  }

  .success-result {
    display: flex;
    align-items: center;
    gap: 4px;

    .result-value {
      color: #52c41a;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .error-text {
    color: #ff4d4f;
  }
}
</style>

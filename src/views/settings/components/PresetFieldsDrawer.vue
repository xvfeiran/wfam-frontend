<template>
  <a-drawer
    :open="props.visible"
    :title="t('settings.pgPresetDrawerTitle')"
    :width="420"
    @close="$emit('cancel')"
  >
    <p class="preset-intro">{{ t('settings.pgPresetIntro') }}</p>
    <div class="preset-list">
      <div v-for="p in presetFields" :key="p.fieldName" class="preset-card">
        <div class="preset-head">
          <span class="preset-title">{{ t(p.titleKey) }}</span>
          <a-tag color="orange">{{ t('settings.pgPresetWritebackTag') }}</a-tag>
        </div>
        <div class="preset-name">fieldName: <code>{{ p.fieldName }}</code></div>
        <div class="preset-desc">{{ t(p.descKey) }}</div>
        <div class="preset-foot">
          <code class="preset-code">[[{{ p.type }}:{{ p.fieldName }}:…]]</code>
          <a-button type="primary" size="small" @click="$emit('select', p)">
            {{ t('settings.pgPresetInsert') }}
          </a-button>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { presetFields, type PresetField } from './presetFields'

interface Props {
  visible: boolean
}
const props = defineProps<Props>()
defineEmits<{
  (e: 'cancel'): void
  (e: 'select', preset: PresetField): void
}>()

const { t } = useI18n()
</script>

<style lang="less" scoped>
.preset-intro {
  margin-bottom: 16px;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}
.preset-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.preset-card {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fafafa;
}
.preset-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.preset-title {
  font-weight: 600;
  font-size: 14px;
}
.preset-name {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
  code {
    background: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
  }
}
.preset-desc {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 10px;
}
.preset-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.preset-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #1890ff;
  word-break: break-all;
}
</style>

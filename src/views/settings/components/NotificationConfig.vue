<template>
  <div class="notification-config">
    <a-card :title="t('settings.notificationConfig')">
      <a-form :model="config" layout="vertical" ref="formRef">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-card :title="t('settings.warningNotification')" size="small">
              <a-form-item :label="t('settings.cronExpression')">
                <a-input v-model:value="config.warningCron" placeholder="0 9 * * *" />
                <div class="field-tip">{{ t('settings.cronTip') }}</div>
              </a-form-item>
              <a-form-item :label="t('settings.warningThreshold')">
                <a-input-number v-model:value="config.warningThreshold" :min="1" :max="30" />
                <div class="field-tip">{{ t('settings.thresholdTip') }}</div>
              </a-form-item>
            </a-card>
          </a-col>
          <a-col :span="12">
            <a-card :title="t('settings.overdueNotification')" size="small">
              <a-form-item :label="t('settings.cronExpression')">
                <a-input v-model:value="config.overdueCron" placeholder="0 9 * * *" />
                <div class="field-tip">{{ t('settings.cronTip') }}</div>
              </a-form-item>
              <a-form-item :label="t('settings.recipients')">
                <a-select v-model:value="config.overdueRecipients" mode="multiple" placeholder="请选择接收人">
                  <a-select-option v-for="u in userOptions" :key="u.value" :value="u.value">
                    {{ u.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-card>
          </a-col>
        </a-row>
        <div class="form-actions">
          <a-button type="primary" @click="$emit('save-config')">{{ t('settings.saveConfig') }}</a-button>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface NotificationConfig {
  warningCron: string
  warningThreshold: number
  overdueCron: string
  overdueRecipients: string[]
}

interface Props {
  config: NotificationConfig
  userOptions: { value: string; label: string }[]
}

defineProps<Props>()

defineEmits<{
  (e: 'save-config'): void
}>()

const { t } = useI18n()
</script>

<style lang="less" scoped>
.field-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.form-actions {
  margin-top: 24px;
  text-align: center;
}
</style>

<template>
  <div class="email-config">
    <a-card :title="t('settings.emailConfig')">
      <template #extra>
        <a-button @click="handleReset" type="link" size="small">
          {{ t('settings.resetConfig') }}
        </a-button>
      </template>
      <a-form :model="config" layout="vertical" ref="formRef">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smtpHost')"
              name="smtpHost"
              :rules="[{ required: true, message: t('settings.smtpHostRequired') }]"
            >
              <a-input v-model:value="config.smtpHost" :placeholder="t('settings.smtpHostPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smtpPort')"
              name="smtpPort"
              :rules="[{ required: true, message: t('settings.smtpPortRequired') }]"
            >
              <a-select
                v-model:value="config.smtpPort"
                :placeholder="t('settings.smtpPortPlaceholder')"
                style="width: 100%"
              >
                <a-select-option :value="25">25 ({{ t('settings.standardSmtp') }})</a-select-option>
                <a-select-option :value="587">587 (STARTTLS)</a-select-option>
                <a-select-option :value="465">465 (SSL)</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smtpUsername')"
              name="smtpUsername"
            >
              <a-input v-model:value="config.smtpUsername" :placeholder="t('settings.smtpUsernamePlaceholder')" />
              <div class="field-tip">{{ t('settings.smtpUsernameTip') }}</div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smtpDomain')"
              name="smtpDomain"
            >
              <a-input v-model:value="config.smtpDomain" :placeholder="t('settings.smtpDomainPlaceholder')" />
              <div class="field-tip">{{ t('settings.smtpDomainTip') }}</div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item
              :label="t('settings.emailFrom')"
              name="emailFrom"
              :rules="[
                { required: true, message: t('settings.emailFromRequired') },
                { type: 'email', message: t('settings.emailFromInvalid') }
              ]"
            >
              <a-input v-model:value="config.emailFrom" :placeholder="t('settings.emailFromPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              :label="t('settings.emailFromDisplayName')"
              name="emailFromDisplayName"
            >
              <a-input v-model:value="config.emailFromDisplayName" :placeholder="t('settings.emailFromDisplayNamePlaceholder')" />
              <div class="field-tip">{{ t('settings.emailFromDisplayNameTip') }}</div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item
              :label="t('settings.emailPassword')"
              name="emailPassword"
              :rules="[{ required: true, message: t('settings.emailPasswordRequired') }]"
            >
              <a-input-password v-model:value="config.emailPassword" :placeholder="t('settings.emailPasswordPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              :label="t('settings.enableSsl')"
              name="enableSsl"
            >
              <a-switch v-model:checked="config.enableSsl" />
              <div class="field-tip">{{ t('settings.enableSslTip') }}</div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-alert
          v-if="testResult"
          :message="testResult.message"
          :type="testResult.type"
          :description="testResult.description"
          show-icon
          closable
          @close="testResult = null"
          style="margin-bottom: 16px"
        />
        <div class="form-actions">
          <a-button @click="openTestModal" :disabled="hasUnsavedChanges">
            {{ t('settings.testConnection') }}
          </a-button>
          <a-button type="primary" :disabled="saveDebounce.isDebouncing" :loading="saveDebounce.isDebouncing" @click="handleSave">
            {{ t('settings.saveConfig') }}
          </a-button>
        </div>
        <div v-if="hasUnsavedChanges" class="unsaved-hint">
          <a-alert
            :message="t('settings.unsavedChangesHint')"
            type="warning"
            show-icon
            style="margin-top: 12px"
          />
        </div>
      </a-form>
    </a-card>

    <!-- 测试邮件弹窗 -->
    <a-modal
      v-model:open="testModalVisible"
      :title="t('settings.testEmailTitle')"
      :confirm-loading="testing"
      @ok="handleTest"
      @cancel="testModalVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item
          :label="t('settings.testEmailAddress')"
          :rules="[
            { required: true, message: t('settings.testEmailAddressRequired') },
            { type: 'email', message: t('settings.testEmailAddressInvalid') }
          ]"
        >
          <a-input
            v-model:value="testEmailAddress"
            :placeholder="t('settings.testEmailAddressPlaceholder')"
          />
          <div class="field-tip">{{ t('settings.testEmailAddressTip') }}</div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { emailConfigApi, type EmailConfig } from '@/services/emailConfigApi'
import { useDebouncedClick } from '@/composables/useDebouncedClick'

const { t } = useI18n()

const config = reactive<EmailConfig>({
  smtpHost: '',
  smtpPort: 25,
  smtpUsername: '',
  smtpDomain: '',
  emailFrom: '',
  emailFromDisplayName: '',
  emailPassword: '',
  enableSsl: false,
})

const originalConfig = reactive<EmailConfig>({
  smtpHost: '',
  smtpPort: 25,
  smtpUsername: '',
  smtpDomain: '',
  emailFrom: '',
  emailFromDisplayName: '',
  emailPassword: '',
  enableSsl: false,
})

const formRef = ref()
const testing = ref(false)
const testModalVisible = ref(false)
const testEmailAddress = ref('')

// Initialize debounce instance for save button
const saveDebounce = useDebouncedClick({ delay: 1000 })

const testResult = ref<{ type: 'success' | 'error'; message: string; description?: string } | null>(null)

const hasUnsavedChanges = computed(() => {
  return config.smtpHost !== originalConfig.smtpHost ||
         config.smtpPort !== originalConfig.smtpPort ||
         config.smtpUsername !== originalConfig.smtpUsername ||
         config.smtpDomain !== originalConfig.smtpDomain ||
         config.emailFrom !== originalConfig.emailFrom ||
         config.emailFromDisplayName !== originalConfig.emailFromDisplayName ||
         config.emailPassword !== originalConfig.emailPassword ||
         config.enableSsl !== originalConfig.enableSsl
})

const loadConfig = async () => {
  try {
    const data = await emailConfigApi.getConfig()
    if (data) {
      config.id = data.id
      config.smtpHost = data.smtpHost || ''
      config.smtpPort = data.smtpPort ?? 25
      config.smtpUsername = data.smtpUsername || ''
      config.smtpDomain = data.smtpDomain || ''
      config.emailFrom = data.emailFrom || ''
      config.emailFromDisplayName = data.emailFromDisplayName || ''
      config.emailPassword = data.emailPassword || ''
      config.enableSsl = data.enableSsl ?? false
      config.enabled = data.enabled
      config.createdAt = data.createdAt
      config.createdBy = data.createdBy

      // Update original config
      originalConfig.smtpHost = config.smtpHost
      originalConfig.smtpPort = config.smtpPort
      originalConfig.smtpUsername = config.smtpUsername
      originalConfig.smtpDomain = config.smtpDomain
      originalConfig.emailFrom = config.emailFrom
      originalConfig.emailFromDisplayName = config.emailFromDisplayName
      originalConfig.emailPassword = config.emailPassword
      originalConfig.enableSsl = config.enableSsl
    }
  } catch {
    message.error(t('message.loadFailed'))
  }
}

const openTestModal = () => {
  if (hasUnsavedChanges.value) {
    message.warning(t('settings.pleaseSaveBeforeTest'))
    return
  }
  testEmailAddress.value = ''
  testModalVisible.value = true
}

const handleTest = async () => {
  if (!testEmailAddress.value) {
    message.error(t('settings.testEmailAddressRequired'))
    return
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(testEmailAddress.value)) {
    message.error(t('settings.testEmailAddressInvalid'))
    return
  }

  try {
    testing.value = true
    testResult.value = null

    const result = await emailConfigApi.testConnection(testEmailAddress.value)
    if (result.status === 'success') {
      testResult.value = {
        type: 'success',
        message: t('settings.testConnectionSuccess'),
        description: t('settings.testEmailSent', { email: testEmailAddress.value })
      }
      message.success(t('settings.testConnectionSuccess'))
      testModalVisible.value = false
    } else {
      testResult.value = {
        type: 'error',
        message: t('settings.testConnectionFailed'),
        description: result.message
      }
      message.error(t('settings.testConnectionFailed') + ': ' + result.message)
    }
  } catch (error: any) {
    testResult.value = {
      type: 'error',
      message: t('settings.testConnectionFailed'),
      description: error?.response?.data?.message || error?.message || t('settings.networkError')
    }
    message.error(t('settings.testConnectionFailed'))
  } finally {
    testing.value = false
  }
}

const handleSave = () => {
  saveDebounce.execute(async () => {
    try {
      await formRef.value.validate()

      await emailConfigApi.saveConfig({
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUsername: config.smtpUsername,
        smtpDomain: config.smtpDomain,
        emailFrom: config.emailFrom,
        emailFromDisplayName: config.emailFromDisplayName,
        emailPassword: config.emailPassword,
        enableSsl: config.enableSsl,
      })

      await loadConfig()
      testResult.value = null
      message.success(t('message.configSaveSuccess'))
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || t('message.saveFailed')
      message.error(errorMsg)
    }
  })
}

const handleReset = () => {
  // 重置为默认值，保留关键字段
  config.smtpPort = 25
  config.smtpDomain = ''
  config.emailFromDisplayName = ''
  config.enableSsl = false
  message.success(t('settings.resetSuccess'))
}

onMounted(() => {
  loadConfig()
})

defineExpose({
  loadConfig,
})
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
  display: flex;
  justify-content: center;
  gap: 12px;
}

.unsaved-hint {
  margin-top: 12px;
}
</style>

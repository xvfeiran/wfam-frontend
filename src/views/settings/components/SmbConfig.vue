<template>
  <div class="smb-config">
    <a-card :title="t('settings.smbConfig')">
      <a-form :model="config" layout="vertical" ref="formRef">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smbHost')"
              name="host"
              :rules="[{ required: true, message: t('settings.smbHostRequired') }]"
            >
              <a-input
                v-model:value="config.host"
                :placeholder="t('settings.smbHost')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smbShareName')"
              name="shareName"
              :rules="[{ required: true, message: t('settings.smbShareNameRequired') }]"
            >
              <a-input
                v-model:value="config.shareName"
                placeholder="superlineleader$"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smbDomain')"
              name="domain"
            >
              <a-input
                v-model:value="config.domain"
                :placeholder="t('settings.smbDomainPlaceholder')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smbUser')"
              name="user"
              :rules="[{ required: true, message: t('settings.smbUserRequired') }]"
            >
              <a-input v-model:value="config.user" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smbPassword')"
              name="password"
              :rules="[{ required: true, message: t('settings.smbPasswordRequired') }]"
            >
              <a-input-password
                v-model:value="config.password"
                autocomplete="new-password"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('settings.smbEnabled')" name="enabled">
              <a-switch v-model:checked="config.enabled" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smbPrefix')"
              name="prefix"
              :rules="[{ required: true, message: t('settings.smbPrefixRequired') }]"
            >
              <a-input v-model:value="config.prefix" placeholder="wfam" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              :label="t('settings.smbEnv')"
              name="env"
              :rules="[{ required: true, message: t('settings.smbEnvRequired') }]"
            >
              <a-input v-model:value="config.env" placeholder="dev / prod" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-alert
          v-if="testResult"
          :message="testResult.message"
          :type="testResult.type"
          show-icon
          closable
          @close="testResult = null"
          style="margin-bottom: 16px"
        />

        <div class="form-actions">
          <a-button @click="handleTest" :disabled="hasUnsavedChanges" :loading="testing">
            {{ t('settings.testSmbConnection') }}
          </a-button>
          <a-button
            type="primary"
            :loading="saving"
            :disabled="saving"
            @click="handleSave"
          >
            {{ t('settings.saveConfig') }}
          </a-button>
        </div>

        <div v-if="hasUnsavedChanges" class="unsaved-hint">
          <a-alert
            :message="t('settings.smbUnsavedChangesHint')"
            type="warning"
            show-icon
            style="margin-top: 12px"
          />
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { smbConfigApi, type SmbConfig } from '@/services/smbConfigApi'

const { t } = useI18n()

const PASSWORD_MASK = '******'

const defaultConfig = (): SmbConfig => ({
  host: '',
  shareName: '',
  domain: '',
  user: '',
  password: '',
  prefix: '',
  env: '',
  enabled: true,
})

const config = reactive<SmbConfig>(defaultConfig())
const originalConfig = reactive<SmbConfig>(defaultConfig())

const formRef = ref()
const saving = ref(false)
const testing = ref(false)
const testResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const hasUnsavedChanges = computed(() =>
  config.host !== originalConfig.host ||
  config.shareName !== originalConfig.shareName ||
  config.domain !== originalConfig.domain ||
  config.user !== originalConfig.user ||
  config.password !== originalConfig.password ||
  config.prefix !== originalConfig.prefix ||
  config.env !== originalConfig.env ||
  config.enabled !== originalConfig.enabled
)

const applyToState = (data: SmbConfig, target: SmbConfig) => {
  target.id = data.id
  target.host = data.host || ''
  target.shareName = data.shareName || ''
  target.domain = data.domain || ''
  target.user = data.user || ''
  target.password = data.password || PASSWORD_MASK
  target.prefix = data.prefix || ''
  target.env = data.env || ''
  target.enabled = data.enabled ?? true
}

const loadConfig = async () => {
  try {
    const data = await smbConfigApi.getConfig()
    if (data) {
      applyToState(data, config)
      applyToState(data, originalConfig)
    }
  } catch {
    message.error(t('message.loadFailed'))
  }
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    saving.value = true
    testResult.value = null

    const saved = await smbConfigApi.saveConfig({ ...config })
    applyToState(saved, config)
    applyToState(saved, originalConfig)
    message.success(t('settings.smbSaveAndReload'))
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || t('message.saveFailed')
    message.error(msg)
  } finally {
    saving.value = false
  }
}

const handleTest = async () => {
  if (hasUnsavedChanges.value) {
    message.warning(t('settings.smbUnsavedChangesHint'))
    return
  }
  try {
    testing.value = true
    testResult.value = null

    const result = await smbConfigApi.testConnection()
    testResult.value = {
      type: result.status === 'success' ? 'success' : 'error',
      message: result.status === 'success'
        ? t('settings.smbTestSuccess')
        : t('settings.smbTestFailed') + ': ' + result.message,
    }
    if (result.status === 'success') {
      message.success(t('settings.smbTestSuccess'))
    } else {
      message.error(t('settings.smbTestFailed'))
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || t('message.saveFailed')
    testResult.value = { type: 'error', message: t('settings.smbTestFailed') + ': ' + msg }
    message.error(t('settings.smbTestFailed'))
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadConfig()
})

defineExpose({ loadConfig })
</script>

<style lang="less" scoped>
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

<template>
  <div class="settings-page">
    <a-page-header :title="t('settings.title')" />

    <a-tabs v-model:activeKey="activeTab">
      <!-- 精分析模板上传 -->
      <a-tab-pane key="templates" :tab="t('settings.templates')">
        <a-card :title="t('settings.templateManagement')">
          <template #extra>
            <a-button type="primary" @click="handleAddTemplate">
              <PlusOutlined /> {{ t('settings.uploadTemplate') }}
            </a-button>
          </template>
          <a-table :columns="templateColumns" :data-source="templates" :pagination="false" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a @click="handleDownloadTemplate(record)">{{ t('settings.download') }}</a>
                  <a-divider type="vertical" />
                  <a-popconfirm :title="t('settings.confirmDeleteTemplate')" @confirm="handleDeleteTemplate(record.id)">
                    <a class="danger-link">{{ t('common.delete') }}</a>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- 邮件触发配置 -->
      <a-tab-pane key="notifications" :tab="t('settings.notifications')">
        <a-card :title="t('settings.notificationConfig')">
          <a-form :model="notificationConfig" layout="vertical" ref="notificationFormRef">
            <a-row :gutter="24">
              <a-col :span="12">
                <a-card :title="t('settings.warningNotification')" size="small">
                  <a-form-item :label="t('settings.cronExpression')">
                    <a-input v-model:value="notificationConfig.warningCron" placeholder="0 9 * * *" />
                    <div class="field-tip">{{ t('settings.cronTip') }}</div>
                  </a-form-item>
                  <a-form-item :label="t('settings.warningThreshold')">
                    <a-input-number v-model:value="notificationConfig.warningThreshold" :min="1" :max="30" />
                    <div class="field-tip">{{ t('settings.thresholdTip') }}</div>
                  </a-form-item>
                </a-card>
              </a-col>
              <a-col :span="12">
                <a-card :title="t('settings.overdueNotification')" size="small">
                  <a-form-item :label="t('settings.cronExpression')">
                    <a-input v-model:value="notificationConfig.overdueCron" placeholder="0 9 * * *" />
                    <div class="field-tip">{{ t('settings.cronTip') }}</div>
                  </a-form-item>
                  <a-form-item :label="t('settings.recipients')">
                    <a-select v-model:value="notificationConfig.overdueRecipients" mode="multiple" placeholder="请选择接收人">
                      <a-select-option v-for="u in userOptions" :key="u.value" :value="u.value">
                        {{ u.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-card>
              </a-col>
            </a-row>
            <div class="form-actions">
              <a-button type="primary" @click="handleSaveNotificationConfig">{{ t('settings.saveConfig') }}</a-button>
            </div>
          </a-form>
        </a-card>
      </a-tab-pane>

      <!-- 主数据同步 -->
      <a-tab-pane key="sync" :tab="t('settings.dataSync')">
        <a-card :title="t('settings.masterDataSync')">
          <a-alert
            :message="t('settings.syncAlert')"
            type="info"
            show-icon
            style="margin-bottom: 24px"
          />
          <a-descriptions :column="2" bordered>
            <a-descriptions-item :label="t('settings.lastSyncTime')">{{ syncInfo.lastSyncTime || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('settings.syncStatus')">
              <a-tag :color="syncInfo.status === 'success' ? 'success' : syncInfo.status === 'failed' ? 'error' : 'default'">
                {{ syncInfo.statusText }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item :label="t('settings.platformCount')">{{ syncInfo.platformCount }}</a-descriptions-item>
            <a-descriptions-item :label="t('settings.recordCount')">{{ syncInfo.recordCount }}</a-descriptions-item>
          </a-descriptions>
          <div class="sync-actions">
            <a-button type="primary" :loading="syncing" @click="handleSync">
              <SyncOutlined /> {{ t('settings.syncNow') }}
            </a-button>
          </div>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 上传模板弹窗 -->
    <a-modal
      v-model:open="templateModalVisible"
      :title="t('settings.uploadTemplateTitle')"
      @ok="handleTemplateUpload"
      @cancel="templateModalVisible = false"
    >
      <a-form :model="templateForm" layout="vertical" ref="templateFormRef">
        <a-form-item :label="t('settings.productPlatform')" name="productPlatform" :rules="[{ required: true, message: t('settings.pleaseSelectPlatform') }]">
          <a-select v-model:value="templateForm.productPlatform" :placeholder="t('settings.pleaseSelectPlatform')">
            <a-select-option v-for="pp in productPlatformOptions" :key="pp" :value="pp">{{ pp }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('settings.failureType')" name="failureType" :rules="[{ required: true, message: t('settings.pleaseSelectFailureType') }]">
          <a-select v-model:value="templateForm.failureType" :placeholder="t('settings.pleaseSelectFailureType')">
            <a-select-option v-for="ft in failureTypeOptions" :key="ft" :value="ft">{{ ft }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('settings.templateFile')" name="file" :rules="[{ required: true, message: t('settings.pleaseUploadTemplateFile') }]">
          <a-upload
            v-model:file-list="templateForm.fileList"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, UploadOutlined, SyncOutlined } from '@ant-design/icons-vue'
import { PRODUCT_PLATFORMS, FAILURE_TYPES } from '@/services/mockData'

const { t } = useI18n()

// 配置模块的Tab类型
type SettingsTab = 'templates' | 'notifications' | 'sync'

// 同步状态类型
type SyncStatus = 'success' | 'failed' | 'idle'

// 模板接口
interface TemplateItem {
  id: string
  name: string
  productPlatform: string
  failureType: string
  uploadTime: string
  uploadBy: string
}

// 同步信息接口
interface SyncInfo {
  lastSyncTime: string
  status: SyncStatus
  statusText: string
  platformCount: number
  recordCount: number
}

const activeTab = ref<SettingsTab>('templates')
const templateModalVisible = ref(false)
const templateFormRef = ref()
const notificationFormRef = ref()
const syncing = ref(false)

// 产品平台和失效类型选项
const productPlatformOptions = ref(PRODUCT_PLATFORMS)
const failureTypeOptions = ref(FAILURE_TYPES)

// 用户选项
const userOptions = ref([
  { value: 'user1', label: '张三' },
  { value: 'user2', label: '李四' },
  { value: 'user3', label: '王五' },
  { value: 'user4', label: '赵六' },
])

// 模板列表
const templates = ref<TemplateItem[]>([
  { id: '1', name: 'PLT1-噪音分析模板.xlsx', productPlatform: 'PLT1', failureType: '噪音', uploadTime: '2026-01-20 10:00', uploadBy: '管理员' },
  { id: '2', name: 'PLT1-断裂分析模板.xlsx', productPlatform: 'PLT1', failureType: '断裂', uploadTime: '2026-01-21 14:30', uploadBy: '管理员' },
  { id: '3', name: 'PLT2-渗漏分析模板.xlsx', productPlatform: 'PLT2', failureType: '渗漏', uploadTime: '2026-01-22 09:15', uploadBy: '管理员' },
])

const templateColumns = computed(() => [
  { title: t('settings.templateName'), dataIndex: 'name', key: 'name' },
  { title: t('settings.productPlatform'), dataIndex: 'productPlatform', key: 'productPlatform' },
  { title: t('settings.failureType'), dataIndex: 'failureType', key: 'failureType' },
  { title: t('settings.uploadTime'), dataIndex: 'uploadTime', key: 'uploadTime' },
  { title: t('settings.uploadBy'), dataIndex: 'uploadBy', key: 'uploadBy' },
  { title: t('common.operation'), key: 'action', width: 120 },
])

// 模板表单
const templateForm = reactive({
  productPlatform: undefined as string | undefined,
  failureType: undefined as string | undefined,
  fileList: [] as any[],
})

// 通知配置
const notificationConfig = reactive({
  warningCron: '0 9 * * *',
  warningThreshold: 3,
  overdueCron: '0 9 * * *',
  overdueRecipients: ['user1', 'user2'],
})

// 同步信息
const syncInfo = ref<SyncInfo>({
  lastSyncTime: '2026-02-03 08:00:00',
  status: 'success',
  statusText: t('settings.syncSuccess'),
  platformCount: 5,
  recordCount: 156,
})

const handleAddTemplate = () => {
  templateForm.productPlatform = undefined
  templateForm.failureType = undefined
  templateForm.fileList = []
  templateModalVisible.value = true
}

const handleTemplateUpload = async () => {
  try {
    await templateFormRef.value?.validate()
    if (templateForm.fileList.length === 0) {
      message.error(t('settings.pleaseUploadTemplateFile'))
      return
    }
    // 模拟上传
    const newTemplate = {
      id: String(templates.value.length + 1),
      name: `${templateForm.productPlatform}-${templateForm.failureType}分析模板.xlsx`,
      productPlatform: templateForm.productPlatform!,
      failureType: templateForm.failureType!,
      uploadTime: new Date().toLocaleString(),
      uploadBy: '管理员',
    }
    templates.value.push(newTemplate)
    templateModalVisible.value = false
    message.success(t('message.templateUploadSuccess'))
  } catch {
    message.error(t('settings.checkFormFields'))
  }
}

const handleDownloadTemplate = (record: TemplateItem) => {
  message.success(t('message.downloadTemplate', { name: record.name }))
}

const handleDeleteTemplate = (id: string) => {
  templates.value = templates.value.filter(t => t.id !== id)
  message.success(t('message.deleteSuccess'))
}

const handleSaveNotificationConfig = () => {
  message.success(t('message.configSaveSuccess'))
}

const handleSync = () => {
  Modal.confirm({
    title: t('settings.confirmSyncTitle'),
    content: t('settings.confirmSync'),
    onOk: () => {
      syncing.value = true
      setTimeout(() => {
        syncing.value = false
        syncInfo.value = {
          lastSyncTime: new Date().toLocaleString(),
          status: 'success',
          statusText: t('settings.syncSuccess'),
          platformCount: 5,
          recordCount: 162,
        }
        message.success(t('message.syncComplete'))
      }, 2000)
    },
  })
}
</script>

<style lang="less" scoped>
.settings-page {
  padding: 24px;

  .field-tip {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
  }

  .form-actions {
    margin-top: 24px;
    text-align: center;
  }

  .sync-actions {
    margin-top: 24px;
    text-align: center;
  }

  .danger-link {
    color: #ff4d4f;
  }
}
</style>

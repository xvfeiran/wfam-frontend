<template>
  <div class="settings-page">
    <a-page-header :title="t('settings.title')" />

    <a-tabs v-model:activeKey="activeTab">
      <!-- 精分析模板上传 -->
      <a-tab-pane key="templates" :tab="t('settings.templates')">
        <TemplateManagement
          :templates="templates"
          @add-template="handleAddTemplate"
          @download-template="handleDownloadTemplate"
          @delete-template="handleDeleteTemplate"
        />
      </a-tab-pane>

      <!-- 邮件触发配置 -->
      <a-tab-pane key="notifications" :tab="t('settings.notifications')">
        <NotificationConfig
          :config="notificationConfig"
          :user-options="userOptions"
          @save-config="handleSaveNotificationConfig"
        />
      </a-tab-pane>

      <!-- 主数据同步 -->
      <a-tab-pane key="sync" :tab="t('settings.dataSync')">
        <DataSync
          :sync-info="syncInfo"
          :syncing="syncing"
          @sync="handleSync"
        />
      </a-tab-pane>

      <!-- 数据字典 -->
      <a-tab-pane key="dictionary" :tab="t('settings.dataDictionary')">
        <CustomerManagement
          :customers="customers"
          :loading="loadingCustomers"
          :total="customerTotal"
          :current-page="customerCurrentPage"
          :page-size="customerPageSize"
          @add-customer="handleAddCustomer"
          @edit-customer="handleEditCustomer"
          @search="handleCustomerSearch"
          @reset="handleCustomerReset"
          @page-change="handleCustomerPageChange"
          @sort-change="handleCustomerSortChange"
        />
      </a-tab-pane>
    </a-tabs>

    <!-- 上传模板弹窗 -->
    <TemplateUploadModal
      :visible="templateModalVisible"
      :form="templateForm"
      :product-categories="productCategoryOptions"
      :failure-types="failureTypeOptions"
      @upload="handleTemplateUpload"
      @cancel="templateModalVisible = false"
    />

    <!-- 客户编辑弹窗 -->
    <CustomerModal
      :visible="customerModalVisible"
      :form="customerForm"
      @save="handleSaveCustomer"
      @cancel="customerModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { lookupApi } from '@/services/lookupApi'
import { customerApi } from '@/services/customerApi'
import { reportsApi } from '@/services/reportsApi'
import type { Customer } from '@/services/customerApi'
import type { ReportTemplate } from '@/types'
import TemplateManagement from './components/TemplateManagement.vue'
import NotificationConfig from './components/NotificationConfig.vue'
import DataSync from './components/DataSync.vue'
import CustomerManagement from './components/CustomerManagement.vue'
import TemplateUploadModal from './components/TemplateUploadModal.vue'
import CustomerModal from './components/CustomerModal.vue'

const { t } = useI18n()

type SettingsTab = 'templates' | 'notifications' | 'sync' | 'dictionary'
type SyncStatus = 'success' | 'failed' | 'idle'

interface TemplateItem {
  id: string
  name: string
  productCategory: string
  failureType: string
  uploadTime: string
  uploadBy: string
  fields?: any[]
}

interface SyncInfo {
  lastSyncTime: string
  status: SyncStatus
  statusText: string
  platformCount: number
  recordCount: number
}

const activeTab = ref<SettingsTab>('templates')
const templateModalVisible = ref(false)
const customerModalVisible = ref(false)
const syncing = ref(false)

const productCategoryOptions = ref<string[]>([])
const failureTypeOptions = ref<string[]>([])

onMounted(async () => {
  const lookups = await lookupApi.getAll()
  productCategoryOptions.value = lookups.productCategories
  failureTypeOptions.value = lookups.failureTypes

  await loadCustomers()
  await loadTemplates()
})

const loadTemplates = async () => {
  try {
    const data = await reportsApi.getAllTemplates()
    templates.value = data.map(t => ({
      id: t.id,
      name: t.name,
      productCategory: t.productCategory || '-',
      failureType: t.failureType || '-',
      uploadTime: t.createdAt || '-',
      uploadBy: t.createdBy || '-',
      fields: t.fields
    }))
  } catch {
    message.error(t('message.loadFailed'))
  }
}

const userOptions = ref([
  { value: 'user1', label: '张三' },
  { value: 'user2', label: '李四' },
  { value: 'user3', label: '王五' },
  { value: 'user4', label: '赵六' },
])

// Customer pagination state
const customers = ref<Customer[]>([])
const loadingCustomers = ref(false)
const customerTotal = ref(0)
const customerCurrentPage = ref(1)
const customerPageSize = ref(10)
const customerSearchName = ref('')
const customerSearchCode = ref('')
const customerSortBy = ref<string | undefined>(undefined)
const customerSortOrder = ref<'ascend' | 'descend' | undefined>(undefined)

const templates = ref<TemplateItem[]>([])

const templateForm = reactive({
  name: undefined as string | undefined,
  productCategory: undefined as string | undefined,
  failureType: undefined as string | undefined,
  fileList: [] as any[],
})

const notificationConfig = reactive({
  warningCron: '0 9 * * *',
  warningThreshold: 3,
  overdueCron: '0 9 * * *',
  overdueRecipients: ['user1', 'user2'],
})

const syncInfo = ref<SyncInfo>({
  lastSyncTime: '2026-02-03 08:00:00',
  status: 'success',
  statusText: t('settings.syncSuccess'),
  platformCount: 5,
  recordCount: 156,
})

const customerForm = reactive({
  id: '',
  name: '',
  code: '',
})

const loadCustomers = async () => {
  loadingCustomers.value = true
  try {
    const result = await customerApi.page({
      name: customerSearchName.value,
      code: customerSearchCode.value,
      page: customerCurrentPage.value,
      pageSize: customerPageSize.value,
      sortBy: customerSortBy.value,
      sortOrder: customerSortOrder.value,
    })
    customers.value = result.data
    customerTotal.value = result.total
  } catch {
    message.error(t('message.loadFailed'))
  } finally {
    loadingCustomers.value = false
  }
}

const handleAddTemplate = () => {
  templateForm.name = undefined
  templateForm.productCategory = undefined
  templateForm.failureType = undefined
  templateForm.fileList = []
  templateModalVisible.value = true
}

const handleTemplateUpload = async () => {
  if (templateForm.fileList.length === 0) {
    message.error(t('settings.pleaseUploadTemplateFile'))
    return
  }

  const formData = new FormData()
  formData.append('file', templateForm.fileList[0].originFileObj)
  formData.append('productCategory', templateForm.productCategory!)
  formData.append('failureType', templateForm.failureType || '')
  if (templateForm.name) {
    formData.append('name', templateForm.name)
  }

  try {
    await reportsApi.uploadTemplate(formData)
    await loadTemplates()
    templateModalVisible.value = false
    message.success(t('message.templateUploadSuccess'))
  } catch {
    message.error(t('message.uploadFailed'))
  }
}

const handleDownloadTemplate = async (record: TemplateItem) => {
  try {
    const blob = await reportsApi.downloadTemplate(record.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = record.name
    a.click()
    window.URL.revokeObjectURL(url)
    message.success(t('message.downloadSuccess'))
  } catch {
    message.error(t('message.downloadFailed'))
  }
}

const handleDeleteTemplate = async (id: string) => {
  try {
    await reportsApi.deleteTemplate(id)
    await loadTemplates()
    message.success(t('message.deleteSuccess'))
  } catch {
    message.error(t('message.deleteFailed'))
  }
}

const handleSaveNotificationConfig = () => {
  message.success(t('message.configSaveSuccess'))
}

const handleAddCustomer = () => {
  customerForm.id = ''
  customerForm.name = ''
  customerForm.code = ''
  customerModalVisible.value = true
}

const handleEditCustomer = (record: Customer) => {
  customerForm.id = record.id || ''
  customerForm.name = record.name
  customerForm.code = record.code || ''
  customerModalVisible.value = true
}

const handleCustomerSearch = async (name: string, code: string) => {
  customerSearchName.value = name
  customerSearchCode.value = code
  customerCurrentPage.value = 1
  await loadCustomers()
}

const handleCustomerReset = async () => {
  customerSearchName.value = ''
  customerSearchCode.value = ''
  customerSortBy.value = undefined
  customerSortOrder.value = undefined
  customerCurrentPage.value = 1
  await loadCustomers()
}

const handleCustomerPageChange = async (page: number, pageSize: number) => {
  customerCurrentPage.value = page
  customerPageSize.value = pageSize
  await loadCustomers()
}

const handleCustomerSortChange = async (sortBy: string, sortOrder: 'ascend' | 'descend' | null) => {
  customerSortBy.value = sortBy
  customerSortOrder.value = sortOrder || undefined
  await loadCustomers()
}

const handleSaveCustomer = async () => {
  const nameExists = customers.value.some(
    c => c.name === customerForm.name && c.id !== customerForm.id
  )
  if (nameExists) {
    message.error(t('settings.customerExists'))
    return
  }

  // 检查代码是否已存在（仅当代码非空时）
  if (customerForm.code && customerForm.code.trim()) {
    const codeExists = customers.value.some(
      c => c.code === customerForm.code && c.id !== customerForm.id
    )
    if (codeExists) {
      message.error(t('settings.customerCodeExists'))
      return
    }
  }

  try {
    if (customerForm.id) {
      await customerApi.update(customerForm.id, {
        name: customerForm.name,
        code: customerForm.code,
      })
    } else {
      await customerApi.create({
        name: customerForm.name,
        code: customerForm.code,
      })
    }

    await loadCustomers()
    customerModalVisible.value = false
    message.success(t('settings.saveSuccess'))
  } catch {
    // Form validation failed or API error
  }
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
}
</style>

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

      <!-- 邮件服务器配置 -->
      <a-tab-pane key="email" :tab="t('settings.email')">
        <EmailConfig ref="emailConfigRef" />
      </a-tab-pane>

      <!-- SMB存储配置 -->
      <a-tab-pane key="smb" :tab="t('settings.smb')">
        <SmbConfig />
      </a-tab-pane>

      <!-- 数据字典 -->
      <a-tab-pane key="dictionary" :tab="t('settings.dataDictionary')">
        <a-tabs v-model:activeKey="dictionaryTab">
          <a-tab-pane key="customers" :tab="t('settings.customerManagement')">
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
              @table-change="handleCustomerTableChange"
            />
          </a-tab-pane>
          <a-tab-pane key="partCodes" :tab="t('settings.partCodeManagement')">
            <PartCodeManagement
              :part-codes="partCodes"
              :loading="loadingPartCodes"
              :total="partCodeTotal"
              :current-page="partCodeCurrentPage"
              :page-size="partCodePageSize"
              @add-part-code="handleAddPartCode"
              @edit-part-code="handleEditPartCode"
              @search="handlePartCodeSearch"
              @reset="handlePartCodeReset"
              @table-change="handlePartCodeTableChange"
            />
          </a-tab-pane>
        </a-tabs>
      </a-tab-pane>
    </a-tabs>

    <!-- 上传模板弹窗 -->
    <TemplateUploadModal
      :visible="templateModalVisible"
      :form="templateForm"
      :product-platforms="productPlatformOptions"
      :failure-types="failureTypeOptions"
      :loading="templateUploading"
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

    <!-- 零件号编辑弹窗 -->
    <PartCodeModal
      :visible="partCodeModalVisible"
      :form="partCodeForm"
      @save="handleSavePartCode"
      @cancel="partCodeModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { lookupApi } from '@/services/lookupApi'
import { customerApi } from '@/services/customerApi'
import { partCodeApi } from '@/services/partCodeApi'
import { reportsApi } from '@/services/reportsApi'
import type { Customer } from '@/services/customerApi'
import type { PartCode } from '@/services/partCodeApi'
import TemplateManagement from './components/TemplateManagement.vue'
import EmailConfig from './components/EmailConfig.vue'
import SmbConfig from './components/SmbConfig.vue'
import CustomerManagement from './components/CustomerManagement.vue'
import PartCodeManagement from './components/PartCodeManagement.vue'
import TemplateUploadModal from './components/TemplateUploadModal.vue'
import CustomerModal from './components/CustomerModal.vue'
import PartCodeModal from './components/PartCodeModal.vue'

const { t } = useI18n()

type SettingsTab = 'templates' | 'email' | 'smb' | 'dictionary'
type DictionaryTab = 'customers' | 'partCodes'

interface TemplateItem {
  id: string
  name: string
  productPlatform: string
  failureType: string
  uploadTime: string
  uploadBy: string
  fields?: any[]
}

const activeTab = ref<SettingsTab>('templates')
const dictionaryTab = ref<DictionaryTab>('customers')
const templateModalVisible = ref(false)
const customerModalVisible = ref(false)
const partCodeModalVisible = ref(false)

const productPlatformOptions = ref<string[]>([])
const failureTypeOptions = ref<string[]>([])
const templateUploading = ref(false)

// Part code pagination state
const partCodes = ref<PartCode[]>([])
const loadingPartCodes = ref(false)
const partCodeTotal = ref(0)
const partCodeCurrentPage = ref(1)
const partCodePageSize = ref(10)
const partCodeSearchPartCode = ref('')
const partCodeSearchBusinessUnit = ref('')
const partCodeSearchProductPlatform = ref('')
const partCodeSortBy = ref<string | undefined>(undefined)
const partCodeSortOrder = ref<'ascend' | 'descend' | undefined>(undefined)

const partCodeForm = reactive({
  id: '',
  partCode: '',
  businessUnit: '',
  productPlatform: '',
})

const loadPartCodes = async () => {
  loadingPartCodes.value = true
  try {
    const result = await partCodeApi.page({
      partCode: partCodeSearchPartCode.value,
      businessUnit: partCodeSearchBusinessUnit.value,
      productPlatform: partCodeSearchProductPlatform.value,
      page: partCodeCurrentPage.value,
      pageSize: partCodePageSize.value,
      sortBy: partCodeSortBy.value,
      sortOrder: partCodeSortOrder.value,
    })
    partCodes.value = result.data
    partCodeTotal.value = result.total
  } catch {
    message.error(t('message.loadFailed'))
  } finally {
    loadingPartCodes.value = false
  }
}

onMounted(async () => {
  const lookups = await lookupApi.getAll()
  productPlatformOptions.value = lookups.productPlatforms
  failureTypeOptions.value = lookups.failureTypes

  await loadCustomers()
  await loadPartCodes()
  await loadTemplates()
})

const loadTemplates = async () => {
  try {
    const data = await reportsApi.getAllTemplates()
    templates.value = data.map(t => ({
      id: t.id,
      name: t.name,
      productPlatform: t.productPlatform || '-',
      failureType: t.failureType || '-',
      uploadTime: t.createdAt || '-',
      uploadBy: t.createdBy || '-',
      fields: t.fields
    }))
  } catch {
    message.error(t('message.loadFailed'))
  }
}

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
  productPlatform: undefined as string | undefined,
  failureType: undefined as string | undefined,
  fileList: [] as any[],
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
  templateForm.productPlatform = undefined
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
  formData.append('productPlatform', templateForm.productPlatform!)
  formData.append('failureType', templateForm.failureType || '')
  if (templateForm.name) {
    formData.append('name', templateForm.name)
  }

  try {
    templateUploading.value = true
    await reportsApi.uploadTemplate(formData)
    await loadTemplates()
    templateModalVisible.value = false
    message.success(t('message.templateUploadSuccess'))
  } catch {
    message.error(t('message.uploadFailed'))
  } finally {
    templateUploading.value = false
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

const getApiErrorMessage = (error: unknown): string | undefined => {
  const apiError = error as {
    response?: {
      status?: number
      data?: {
        message?: string
      }
    }
    message?: string
  }

  if (apiError.response?.data?.message) {
    return apiError.response.data.message
  }

  if (apiError.response?.status === 409) {
    return t('settings.templateInUseCannotDelete')
  }

  return undefined
}

const handleDeleteTemplate = async (id: string) => {
  try {
    await reportsApi.deleteTemplate(id)
    await loadTemplates()
    message.success(t('message.deleteSuccess'))
  } catch (error) {
    message.error(getApiErrorMessage(error) || t('message.deleteFailed'))
  }
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

const handleCustomerTableChange = async (
  page: number,
  pageSize: number,
  sortBy: string | undefined,
  sortOrder: 'ascend' | 'descend' | null,
) => {
  // Reset to page 1 when sort changes
  const sortChanged = sortBy !== customerSortBy.value || (sortOrder || undefined) !== customerSortOrder.value
  if (sortChanged && sortBy) {
    customerCurrentPage.value = 1
  } else {
    customerCurrentPage.value = page
  }
  customerPageSize.value = pageSize
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

const handleAddPartCode = () => {
  partCodeForm.id = ''
  partCodeForm.partCode = ''
  partCodeForm.businessUnit = ''
  partCodeForm.productPlatform = ''
  partCodeModalVisible.value = true
}

const handleEditPartCode = (record: PartCode) => {
  partCodeForm.id = record.id || ''
  partCodeForm.partCode = record.partCode
  partCodeForm.businessUnit = record.businessUnit || ''
  partCodeForm.productPlatform = record.productPlatform || ''
  partCodeModalVisible.value = true
}

const handlePartCodeSearch = async (partCode: string, businessUnit: string, productPlatform: string) => {
  partCodeSearchPartCode.value = partCode
  partCodeSearchBusinessUnit.value = businessUnit
  partCodeSearchProductPlatform.value = productPlatform
  partCodeCurrentPage.value = 1
  await loadPartCodes()
}

const handlePartCodeReset = async () => {
  partCodeSearchPartCode.value = ''
  partCodeSearchBusinessUnit.value = ''
  partCodeSearchProductPlatform.value = ''
  partCodeSortBy.value = undefined
  partCodeSortOrder.value = undefined
  partCodeCurrentPage.value = 1
  await loadPartCodes()
}

const handlePartCodeTableChange = async (
  page: number,
  pageSize: number,
  sortBy: string | undefined,
  sortOrder: 'ascend' | 'descend' | null,
) => {
  // Reset to page 1 when sort changes
  const sortChanged = sortBy !== partCodeSortBy.value || (sortOrder || undefined) !== partCodeSortOrder.value
  if (sortChanged && sortBy) {
    partCodeCurrentPage.value = 1
  } else {
    partCodeCurrentPage.value = page
  }
  partCodePageSize.value = pageSize
  partCodeSortBy.value = sortBy
  partCodeSortOrder.value = sortOrder || undefined
  await loadPartCodes()
}

const handleSavePartCode = async () => {
  try {
    if (partCodeForm.id) {
      await partCodeApi.update(partCodeForm.id, {
        partCode: partCodeForm.partCode,
        businessUnit: partCodeForm.businessUnit,
        productPlatform: partCodeForm.productPlatform,
      })
    } else {
      await partCodeApi.create({
        partCode: partCodeForm.partCode,
        businessUnit: partCodeForm.businessUnit,
        productPlatform: partCodeForm.productPlatform,
      })
    }
    await loadPartCodes()
    partCodeModalVisible.value = false
    message.success(t('settings.saveSuccess'))
  } catch {
    // API error
  }
}

</script>

<style lang="less" scoped>
.settings-page {
  padding: 0;
}
</style>

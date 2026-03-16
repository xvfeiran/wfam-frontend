<template>
  <div class="template-management">
    <a-card :title="t('settings.templateManagement')">
      <template #extra>
        <a-button type="primary" @click="$emit('add-template')">
          <PlusOutlined /> {{ t('settings.uploadTemplate') }}
        </a-button>
      </template>
      <a-table :columns="columns" :data-source="templates" :pagination="false" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="$emit('download-template', record)">{{ t('settings.download') }}</a>
              <a-divider type="vertical" />
              <a-popconfirm :title="t('settings.confirmDeleteTemplate')" @confirm="$emit('delete-template', record.id)">
                <a class="danger-link">{{ t('common.delete') }}</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusOutlined } from '@ant-design/icons-vue'

interface TemplateItem {
  id: string
  name: string
  productCategory: string
  failureType: string
  uploadTime: string
  uploadBy: string
  fields?: any[]
}

interface Props {
  templates: TemplateItem[]
}

defineProps<Props>()

defineEmits<{
  (e: 'add-template'): void
  (e: 'download-template', record: TemplateItem): void
  (e: 'delete-template', id: string): void
}>()

const { t } = useI18n()

const columns = computed(() => [
  { title: t('settings.templateName'), dataIndex: 'name', key: 'name' },
  { title: t('settings.productCategory'), dataIndex: 'productCategory', key: 'productCategory' },
  { title: t('settings.failureType'), dataIndex: 'failureType', key: 'failureType' },
  { title: t('settings.uploadTime'), dataIndex: 'uploadTime', key: 'uploadTime' },
  { title: t('settings.uploadBy'), dataIndex: 'uploadBy', key: 'uploadBy' },
  { title: t('common.operation'), key: 'action', width: 120 },
])
</script>

<style lang="less" scoped>
.danger-link {
  color: #ff4d4f;
}
</style>

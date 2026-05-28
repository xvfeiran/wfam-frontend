<template>
  <div class="action-bar">
    <a-space>
      <a-button type="primary" @click="$emit('create')">
        <PlusOutlined /> {{ t('common.create') }}
      </a-button>
      <a-button :loading="exportLoading" @click="$emit('export')">
        <DownloadOutlined /> {{ t('common.export') }}
      </a-button>
      <a-button v-if="canEdit" type="primary" :disabled="selectedCount !== 1" @click="$emit('edit')">
        <EditOutlined /> {{ t('common.edit') }}
      </a-button>
      <a-popconfirm v-if="canDelete" :title="t('returnPart.confirmDelete')" @confirm="$emit('delete')">
        <a-button danger :disabled="selectedCount === 0">
          <DeleteOutlined /> {{ t('common.delete') }}
        </a-button>
      </a-popconfirm>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'

interface Props {
  selectedCount: number
  canEdit?: boolean
  canDelete?: boolean
  exportLoading?: boolean
}

defineProps<Props>()

defineEmits<{
  (e: 'create'): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'export'): void
}>()

const { t } = useI18n()
</script>

<style lang="less" scoped>
.action-bar {
  margin-bottom: 16px;
}
</style>

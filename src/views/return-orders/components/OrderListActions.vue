<template>
  <div class="action-bar">
    <a-space>
      <a-button type="primary" @click="$emit('create')">
        <PlusOutlined /> {{ t('common.create') }}
      </a-button>
      <a-button @click="$emit('import')">
        <UploadOutlined /> {{ t('common.import') }}
      </a-button>
      <a-button @click="$emit('export')">
        <DownloadOutlined /> {{ t('common.export') }}
      </a-button>
      <a-button :disabled="selectedCount !== 1" @click="$emit('edit')">
        <EditOutlined /> {{ t('common.edit') }}
      </a-button>
      <a-popconfirm :title="t('returnOrder.confirmDelete')" @confirm="$emit('delete')" :disabled="selectedCount === 0">
        <a-button danger :disabled="selectedCount === 0">
          <DeleteOutlined /> {{ t('common.delete') }}
        </a-button>
      </a-popconfirm>
      <a-button :disabled="selectedCount !== 1" @click="$emit('sampling')">
        <ExperimentOutlined /> {{ t('returnOrder.sampling') }}
      </a-button>
      <a-button danger :disabled="selectedCount === 0" @click="$emit('scrap')">
        <StopOutlined /> {{ t('returnOrder.scrap') }}
      </a-button>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  StopOutlined,
} from '@ant-design/icons-vue'

interface Props {
  selectedCount: number
}

defineProps<Props>()

defineEmits<{
  (e: 'create'): void
  (e: 'import'): void
  (e: 'export'): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'sampling'): void
  (e: 'scrap'): void
}>()

const { t } = useI18n()
</script>

<style lang="less" scoped>
.action-bar {
  margin-bottom: 16px;
}
</style>

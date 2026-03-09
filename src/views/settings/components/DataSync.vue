<template>
  <div class="data-sync">
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
          <a-tag :color="statusColor">{{ syncInfo.statusText }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('settings.platformCount')">{{ syncInfo.platformCount }}</a-descriptions-item>
        <a-descriptions-item :label="t('settings.recordCount')">{{ syncInfo.recordCount }}</a-descriptions-item>
      </a-descriptions>
      <div class="sync-actions">
        <a-button type="primary" :loading="syncing" @click="$emit('sync')">
          <SyncOutlined /> {{ t('settings.syncNow') }}
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SyncOutlined } from '@ant-design/icons-vue'

type SyncStatus = 'success' | 'failed' | 'idle'

interface SyncInfo {
  lastSyncTime: string
  status: SyncStatus
  statusText: string
  platformCount: number
  recordCount: number
}

interface Props {
  syncInfo: SyncInfo
  syncing: boolean
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'sync'): void
}>()

const { t } = useI18n()

const statusColor = computed(() => {
  switch (props.syncInfo.status) {
    case 'success': return 'success'
    case 'failed': return 'error'
    default: return 'default'
  }
})
</script>

<style lang="less" scoped>
.sync-actions {
  margin-top: 24px;
  text-align: center;
}
</style>

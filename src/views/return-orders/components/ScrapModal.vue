<template>
  <a-modal
    :open="visible"
    :title="t('modal.scrapProcessing')"
    width="600px"
    @cancel="handleCancel"
    @ok="handleSubmit"
  >
    <a-alert
      :message="t('message.workOnAlert')"
      :description="t('message.workOnDescription')"
      type="info"
      show-icon
      style="margin-bottom: 16px"
    />

    <a-card :title="t('modal.workOnScrapLink')" size="small" style="margin-bottom: 16px">
      <div class="workon-link">
        <a-typography-link href="https://workon.example.com/scrap" target="_blank">
          <LinkOutlined /> {{ t('modal.clickToEnterWorkOn') }}
        </a-typography-link>
        <a-typography-text type="secondary" style="display: block; margin-top: 8px">
          {{ t('modal.copyInfoToWorkOn') }}
        </a-typography-text>
      </div>
      <a-descriptions :column="1" bordered size="small" style="margin-top: 12px">
        <a-descriptions-item :label="t('message.orderNumber')">{{ orderNumbers }}</a-descriptions-item>
        <a-descriptions-item :label="t('message.scrapQuantity')">{{ selectedIds.length }}{{ t('message.unit') }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-form :model="form" layout="vertical">
      <a-form-item :label="t('message.scrapStatus')" required>
        <a-radio-group v-model:value="form.scrapStatus">
          <a-radio value="pending_workon">{{ t('message.pendingWorkOnScrap') }}</a-radio>
          <a-radio value="completed_workon">{{ t('message.completedWorkOnScrap') }}</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item :label="t('message.remark')">
        <a-textarea
          v-model:value="form.remark"
          :placeholder="t('message.pleaseInputRemarkOptional')"
          :rows="3"
          show-count
          :maxlength="200"
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
      <a-button type="primary" @click="handleSubmit">{{ t('modal.markAsConfirmed') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { LinkOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import type { ReturnOrder } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  selectedIds: string[]
}>()

const emit = defineEmits(['update:visible', 'success'])

const form = reactive({
  scrapStatus: 'pending_workon' as 'pending_workon' | 'completed_workon',
  remark: '',
})

const orders = ref<ReturnOrder[]>([])

// 获取选中的退货单号
const orderNumbers = computed(() => {
  return props.selectedIds
    .map(id => orders.value.find(o => o.id === id)?.orderNumber)
    .filter(Boolean)
    .join(', ') || '-'
})

// 重置表单并加载订单数据
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      form.scrapStatus = 'pending_workon'
      form.remark = ''
      orders.value = await returnOrderApi.list()
    }
  }
)

const handleCancel = () => {
  emit('update:visible', false)
}

const handleSubmit = () => {
  const statusText = form.scrapStatus === 'pending_workon' ? t('message.pendingWorkOnScrap') : t('message.completedWorkOnScrap')
  message.success(t('message.markedAsStatus', { status: statusText }))
  emit('success')
}
</script>

<style lang="less" scoped>
.workon-link {
  padding: 8px 0;
}
</style>

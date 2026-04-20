<template>
  <a-modal
    :open="visible"
    :title="t('modal.scrapProcessing')"
    width="600px"
    @cancel="handleCancel"
    @ok="handleSubmit"
    :confirm-loading="submitDebounce.isDebouncing.value"
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
        <a-descriptions-item :label="t('message.orderNumber')">{{ displayOrderNumber }}</a-descriptions-item>
        <a-descriptions-item :label="t('message.currentStatus')">
          <a-tag :color="getStatusColor()">{{ getStatusLabel() }}</a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-form :model="form" layout="vertical">
      <a-form-item :label="t('message.scrapStatus')" required>
        <a-radio-group v-model:value="form.scrapStatus">
          <a-radio value="pending_workon" :disabled="isScrapInProgressOrScrapped">
            {{ t('message.pendingWorkOnScrap') }}
          </a-radio>
          <a-radio value="completed_workon" :disabled="!isScrapInProgress || isScrapped">
            {{ t('message.completedWorkOnScrap') }}
          </a-radio>
        </a-radio-group>
        <div v-if="isScrapped" class="status-hint">
          <a-typography-text type="secondary">
            {{ t('message.alreadyScrappedCannotModify') }}
          </a-typography-text>
        </div>
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
      <a-button type="primary" @click="handleSubmit" :loading="submitDebounce.isDebouncing.value" :disabled="isScrapped || submitDebounce.isDebouncing.value">
        {{ isScrapped ? t('common.viewOnly') : t('modal.markAsConfirmed') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { LinkOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import type { ReturnOrder } from '@/types'
import { ORDER_STATUS_MAP } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  order?: ReturnOrder | null
  selectedIds?: string[]
}>()

const emit = defineEmits(['update:visible', 'success'])

const form = reactive({
  scrapStatus: 'pending_workon' as 'pending_workon' | 'completed_workon',
})

// 防抖处理
const submitDebounce = useDebouncedClick({ delay: 1000 })

const getCurrentStatus = () => props.order?.status as string | undefined

// 显示的订单号
const displayOrderNumber = computed(() => {
  if (props.order) {
    return props.order.orderNumber || t('validation.unsubmitted')
  }
  return '-'
})

// 是否为报废中或已报废状态
const isScrapInProgressOrScrapped = computed(() => {
  const status = getCurrentStatus()
  return status === 'scrap_in_progress' || status === 'scrapped'
})

// 是否为报废中状态
const isScrapInProgress = computed(() => {
  return getCurrentStatus() === 'scrap_in_progress'
})

// 是否为已报废状态
const isScrapped = computed(() => {
  return getCurrentStatus() === 'scrapped'
})

// 获取状态颜色
const getStatusColor = () => {
  const status = getCurrentStatus()
  if (!status) return 'default'
  return status in ORDER_STATUS_MAP ? ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP].color : 'default'
}

// 获取状态标签
const getStatusLabel = () => {
  const status = getCurrentStatus()
  if (!status) return '-'
  const key = statusI18nKeyMap[status] || status
  return t(key)
}

// 状态到i18n键的映射
const statusI18nKeyMap: Record<string, string> = {
  draft: 'status.draft',
  in_initial_analysis: 'status.inInitialAnalysis',
  in_detailed_analysis: 'status.inDetailedAnalysis',
  pending_approval: 'status.pendingApproval',
  analysis_completed: 'status.analysisCompleted',
  scrap_in_progress: 'status.scrapInProgress',
  scrapped: 'status.scrapped',
}

// 重置表单
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      // 根据当前状态设置默认值
      if (isScrapInProgress.value) {
        form.scrapStatus = 'pending_workon'
      } else if (isScrapped.value) {
        form.scrapStatus = 'completed_workon'
      } else {
        form.scrapStatus = 'pending_workon'
      }
    }
  }
)

const handleCancel = () => {
  emit('update:visible', false)
}

const handleSubmit = async () => {
  // 已报废状态只能查看
  if (isScrapped.value) {
    emit('update:visible', false)
    return
  }

  submitDebounce.execute(async () => {
    // 详情页模式：处理单个订单
    if (props.order) {
      // 如果是已报废状态，不需要操作
      if (getCurrentStatus() === 'scrapped') {
        emit('update:visible', false)
        return
      }

      // 如果用户选择了"已WorkON报废"，调用 workonConfirm
      if (form.scrapStatus === 'completed_workon' && getCurrentStatus() === 'scrap_in_progress') {
        await returnOrderApi.workonConfirm(props.order.id)
      } else {
        // 否则调用 scrap 方法
        await returnOrderApi.scrap(props.order.id)
      }

      emit('success')
      emit('update:visible', false)
    }
    // 列表页模式：处理多个订单（已废弃，但保留兼容性）
    else if (props.selectedIds && props.selectedIds.length > 0) {
      for (const id of props.selectedIds) {
        await returnOrderApi.scrap(id)
      }
      emit('success')
      emit('update:visible', false)
    }
  })
}
</script>

<style lang="less" scoped>
.workon-link {
  padding: 8px 0;
}

.status-hint {
  margin-top: 8px;
}
</style>

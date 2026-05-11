<template>
  <a-modal
    :open="visible"
    :title="t('modal.scrapProcessing')"
    width="600px"
    @cancel="handleCancel"
    @ok="handleSubmit"
    :confirm-loading="submitDebounce.isDebouncing.value"
  >
    <!-- 报废限制提示 -->
    <a-alert
      v-if="scrapRestrictionReason"
      :message="t('message.cannotScrap')"
      :description="scrapRestrictionReason"
      type="warning"
      show-icon
      style="margin-bottom: 16px"
    />

    <a-alert
      v-else
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
      <a-button type="primary" @click="handleSubmit" :loading="submitDebounce.isDebouncing.value" :disabled="hasScrapRestriction || isScrapped || submitDebounce.isDebouncing.value">
        {{ isScrapped ? t('common.viewOnly') : hasScrapRestriction ? t('common.confirm') : t('modal.markAsConfirmed') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { LinkOutlined } from '@ant-design/icons-vue'
import { analysisOrderApi } from '@/services/analysisOrderApi'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import type { AnalysisOrder } from '@/types'
import { ANALYSIS_ORDER_STATUS_MAP, AnalysisOrderStatus, PartStatus } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  order?: AnalysisOrder | null
  is0km?: boolean
}>()

const emit = defineEmits(['update:visible', 'success'])

const form = reactive({
  scrapStatus: 'pending_workon' as 'pending_workon' | 'completed_workon',
})

// 防抖处理
const submitDebounce = useDebouncedClick({ delay: 1000 })

const getCurrentStatus = () => props.order?.status as string | undefined

const displayOrderNumber = computed(() => {
  return props.order?.orderNumber || '-'
})

const isScrapInProgressOrScrapped = computed(() => {
  const status = getCurrentStatus()
  return status === AnalysisOrderStatus.WORKON_SCRAP_IN_PROGRESS || status === AnalysisOrderStatus.WORKON_SCRAPPED
})

const isScrapInProgress = computed(() => {
  return getCurrentStatus() === AnalysisOrderStatus.WORKON_SCRAP_IN_PROGRESS
})

const isScrapped = computed(() => {
  return getCurrentStatus() === AnalysisOrderStatus.WORKON_SCRAPPED
})

// 报废限制原因
const scrapRestrictionReason = computed(() => {
  if (!props.order) return undefined

  const status = getCurrentStatus()

  // 已报废
  if (status === AnalysisOrderStatus.WORKON_SCRAPPED) {
    return t('message.alreadyScrappedCannotModify')
  }

  // 待抽样状态（0KM 件跳过抽样，允许直接报废）
  if (status === AnalysisOrderStatus.PENDING_SAMPLING && !props.is0km) {
    return t('message.cannotScrapPendingSampling')
  }

  // 检查抽样件的精分析完成状态
  const parts = props.order.parts || []
  const sampledParts = parts.filter(p => p.isSample === 1)

  // 有抽样件但未全部完成精分析（scrap_in_progress/scrapped 表示已通过审批进入后续流程，同样满足条件）
  if (sampledParts.length > 0) {
    const incompleteParts = sampledParts.filter(p =>
      p.status !== PartStatus.ANALYSIS_COMPLETED &&
      p.status !== PartStatus.SCRAP_IN_PROGRESS &&
      p.status !== PartStatus.SCRAPPED
    )
    if (incompleteParts.length > 0) {
      return t('message.cannotScrapSampleNotCompleted', { count: incompleteParts.length })
    }
  }

  return undefined
})

// 是否有报废限制
const hasScrapRestriction = computed(() => {
  return !!scrapRestrictionReason.value && !isScrapped.value
})

const getStatusColor = () => {
  const status = getCurrentStatus()
  if (!status) return 'default'
  return status in ANALYSIS_ORDER_STATUS_MAP
    ? ANALYSIS_ORDER_STATUS_MAP[status as AnalysisOrderStatus].color
    : 'default'
}

const statusI18nKeyMap: Record<string, string> = {
  pending_sampling: 'analysisOrder.statusPendingSampling',
  in_detailed_analysis: 'analysisOrder.statusInDetailedAnalysis',
  pending_approval: 'analysisOrder.statusPendingApproval',
  analysis_completed: 'analysisOrder.statusAnalysisCompleted',
  workon_scrap_in_progress: 'analysisOrder.statusWorkonScrapInProgress',
  workon_scrapped: 'analysisOrder.statusWorkonScrapped',
}

const getStatusLabel = () => {
  const status = getCurrentStatus()
  if (!status) return '-'
  const key = statusI18nKeyMap[status]
  return key ? t(key) : status
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      form.scrapStatus = isScrapInProgress.value || isScrapped.value ? 'completed_workon' : 'pending_workon'
    }
  }
)

const handleCancel = () => {
  emit('update:visible', false)
}

const handleSubmit = async () => {
  if (isScrapped.value) {
    emit('update:visible', false)
    return
  }
  if (!props.order) return

  submitDebounce.execute(async () => {
    try {
      if (form.scrapStatus === 'completed_workon' && isScrapInProgress.value) {
        await analysisOrderApi.workonConfirm(props.order.id)
      } else {
        await analysisOrderApi.scrap(props.order.id)
      }
      emit('success')
      emit('update:visible', false)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || t('message.scrapFailed')
      message.error(errorMsg)
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

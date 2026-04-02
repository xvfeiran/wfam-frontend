<template>
  <a-modal
    :open="visible"
    :title="modalTitle"
    width="920px"
    :footer="null"
    destroy-on-close
    @cancel="handleCancel"
  >
    <!-- 只读模式：查看已完成的抽样结果 -->
    <template v-if="isReadOnly">
      <a-alert :message="t('message.samplingCompletedAlert')" type="info" show-icon style="margin-bottom: 16px" />
      <a-transfer
        :data-source="transferDataSource"
        :target-keys="sampledPartIds"
        :titles="[
          `${t('message.unsampledParts')} (${availableParts.length - sampledPartIds.length}/${availableParts.length})`,
          `${t('message.sampledParts')} (${sampledPartIds.length})`
        ]"
        :render="renderItem"
        :list-style="{ width: '400px', height: '380px' }"
        disabled
        show-search
      />
      <!-- QMC Leader 可以切换到可编辑模式 -->
      <div class="modal-footer">
        <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
        <a-button
          v-if="canEditSubmittedForm"
          type="primary"
          @click="handleSwitchToEditMode"
        >
          {{ t('returnOrder.resampling') }}
        </a-button>
      </div>
    </template>

    <!-- 可操作模式：抽样或重新抽样 -->
    <template v-else>
      <!-- 重新抽样警告提示 -->
      <a-alert
        v-if="hasBeenSampled"
        :message="t('message.resamplingWarning')"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />

      <!-- 选择抽样方式 -->
      <div class="choice-section">
        <span class="choice-label">{{ t('message.selectSamplingMethod') }}：</span>
        <a-radio-group v-model:value="samplingChoice" button-style="solid" size="large">
          <a-radio-button value="sampling">
            <FilterOutlined /> {{ t('message.startSampling') }}
          </a-radio-button>
          <a-radio-button value="none">
            <StopOutlined /> {{ t('message.noSampling') }}
          </a-radio-button>
        </a-radio-group>
      </div>

      <!-- 不抽样提示 -->
      <template v-if="samplingChoice === 'none'">
        <a-alert
          :message="t('message.noSamplingWarning')"
          type="warning"
          show-icon
          style="margin: 16px 0"
        />
        <div class="modal-footer">
          <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
          <a-button type="primary" danger :loading="submitting" @click="handleNoSampling">
            {{ t('message.confirmNoSampling') }}
          </a-button>
        </div>
      </template>

      <!-- 抽样操作区域 -->
      <template v-if="samplingChoice === 'sampling'">
        <!-- 抽样比例/数量控制 -->
        <div class="sampling-controls">
          <a-space :size="24" align="center" wrap>
            <a-space align="center" :size="8">
              <span class="control-label">{{ t('message.samplingRatio') }}：</span>
              <a-input-number
                v-model:value="samplingRatio"
                :min="0"
                :max="100"
                :precision="1"
                :addon-after="'%'"
                style="width: 130px"
                @change="onRatioChange"
              />
            </a-space>
            <a-space align="center" :size="8">
              <span class="control-label">{{ t('message.sampledCount') }}：</span>
              <a-input-number
                v-model:value="sampledCount"
                :min="0"
                :max="totalCount"
                style="width: 100px"
                @change="onCountChange"
              />
              <span class="count-total">/ {{ totalCount }}</span>
            </a-space>
            <a-button
              type="default"
              :disabled="sampledCount === 0 || totalCount === 0"
              @click="handleRandomSampling"
            >
              <template #icon><ThunderboltOutlined /></template>
              {{ t('message.randomSampling') }}
            </a-button>
          </a-space>
        </div>

        <!-- 穿梭框 -->
        <a-transfer
          :data-source="transferDataSource"
          :target-keys="selectedPartIds"
          :titles="[
            `${t('message.unsampledParts')} (${availableParts.length - selectedPartIds.length}/${availableParts.length})`,
            `${t('message.sampledParts')} (${selectedPartIds.length})`
          ]"
          :render="renderItem"
          :list-style="{ width: '400px', height: '380px' }"
          show-search
          @change="handleTransferChange"
        />

        <!-- 底部按钮 -->
        <div class="modal-footer">
          <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
          <a-button
            type="primary"
            :disabled="selectedPartIds.length === 0"
            :loading="submitting"
            @click="handleConfirmSampling"
          >
            {{ t('message.confirmSampling') }}（{{ selectedPartIds.length }}）
          </a-button>
        </div>
      </template>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { StopOutlined, FilterOutlined, ThunderboltOutlined } from '@ant-design/icons-vue'
import { returnOrderApi } from '@/services/returnOrderApi'
import type { ReturnOrder, Part } from '@/types'
import { usePermissions } from '@/composables/usePermissions'

const { t } = useI18n()
const { canEditSubmittedForm } = usePermissions()

const props = defineProps<{
  visible: boolean
  order: ReturnOrder | null
  readOnly?: boolean  // 是否只读模式（查看已完成的抽样结果）
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
  (e: 'no-sampling'): void
}>()

// 状态
const internalReadOnly = ref(false)  // 内部只读状态（支持在弹窗内切换）
const samplingChoice = ref<'none' | 'sampling' | null>('sampling')
const selectedPartIds = ref<string[]>([])
const sampledPartIds = ref<string[]>([])  // 已抽样只读视图用
const samplingRatio = ref<number>(0)
const sampledCount = ref<number>(0)
const submitting = ref(false)
const updating = ref(false)
const availableParts = ref<Part[]>([])
// 是否已完成抽样（基于售后件的 isSample 字段判断）
const isSampled = computed(() => {
  if (!props.order) return false
  return availableParts.value.some(p => p.isSample === 1)
})

// 是否已经抽样过（用于显示重新抽样警告）
const hasBeenSampled = computed(() => {
  return isSampled.value && sampledPartIds.value.length > 0
})

// 当前是否为只读模式（使用内部状态，支持弹窗内切换）
const isReadOnly = computed(() => internalReadOnly.value)

// 模态框标题
const modalTitle = computed(() => {
  if (isReadOnly.value) {
    return t('returnOrder.viewSamplingResult')
  }
  if (hasBeenSampled.value) {
    return t('message.resamplingTitle')
  }
  return t('modal.samplingManagement')
})

const totalCount = computed(() => availableParts.value.length)

// 穿梭框数据源
const transferDataSource = computed(() =>
  availableParts.value.map(part => ({
    key: part.id,
    title: part.partCode,
    description: `${part.businessUnit} / ${part.productPlatform}`,
    partNumber: part.partNumber,
  }))
)

// 穿梭框 item 渲染
const renderItem = (item: any) => `${item.title}  |  ${item.description}`

// 当 visible 或 order 变化时加载数据并重置状态
watch(
  () => [props.visible, props.order] as const,
  async ([visible, order]) => {
    if (!visible || !order) return
    // 设置内部只读状态（从 props 初始化）
    internalReadOnly.value = props.readOnly ?? false

    samplingChoice.value = 'sampling'
    selectedPartIds.value = []
    sampledCount.value = 0
    samplingRatio.value = 0
    availableParts.value = (await returnOrderApi.getParts(order.id, { pageSize: 10000 })).data

    // 加载已抽样的售后件数据
    if (isSampled.value) {
      // 从 isSample 字段加载已抽样的售后件
      sampledPartIds.value = availableParts.value
        .filter(p => p.isSample === 1)
        .map(p => p.id)

      // 同步抽样数量和比例
      selectedPartIds.value = [...sampledPartIds.value]
      sampledCount.value = selectedPartIds.value.length
      samplingRatio.value = totalCount.value > 0
        ? parseFloat(((sampledCount.value / totalCount.value) * 100).toFixed(1))
        : 0
    } else {
      sampledPartIds.value = []
    }
  },
  { immediate: true }
)

// 切换到可编辑模式（点击"重新抽样"按钮）
const handleSwitchToEditMode = () => {
  internalReadOnly.value = false
}

// 手动拖拽穿梭框后同步比例/数量
const handleTransferChange = (targetKeys: string[]) => {
  selectedPartIds.value = targetKeys
  if (updating.value) return
  updating.value = true
  sampledCount.value = targetKeys.length
  samplingRatio.value =
    totalCount.value > 0
      ? parseFloat(((targetKeys.length / totalCount.value) * 100).toFixed(1))
      : 0
  updating.value = false
}

// 输入抽样比例 → 同步数量
const onRatioChange = (ratio: number | null) => {
  if (updating.value || ratio === null) return
  updating.value = true
  sampledCount.value = Math.min(
    Math.round((ratio / 100) * totalCount.value),
    totalCount.value
  )
  updating.value = false
}

// 输入抽样数 → 同步比例
const onCountChange = (count: number | null) => {
  if (updating.value || count === null) return
  updating.value = true
  samplingRatio.value =
    totalCount.value > 0
      ? parseFloat(((count / totalCount.value) * 100).toFixed(1))
      : 0
  updating.value = false
}

// 随机抽样：按当前 sampledCount 随机选取
const handleRandomSampling = () => {
  const count = Math.min(sampledCount.value, totalCount.value)
  if (count <= 0) return
  const shuffled = [...availableParts.value].sort(() => Math.random() - 0.5)
  selectedPartIds.value = shuffled.slice(0, count).map(p => p.id)
  message.success(t('message.randomSamplingComplete', { count }))
}

// 取消
const handleCancel = () => {
  emit('update:visible', false)
}

// 确认不抽样 → 进入精分析（sampledPartIds 为空）
const handleNoSampling = async () => {
  submitting.value = true
  try {
    await returnOrderApi.sampling(props.order!.id, { sampledPartIds: [] })
    message.success(t('message.noSamplingSuccess'))
    emit('no-sampling')
    emit('update:visible', false)
  } finally {
    submitting.value = false
  }
}

// 确认抽样
const handleConfirmSampling = async () => {
  if (selectedPartIds.value.length === 0) {
    message.warning(t('message.pleaseSelectAtLeastOnePart'))
    return
  }
  submitting.value = true
  try {
    await returnOrderApi.sampling(props.order!.id, { sampledPartIds: selectedPartIds.value })
    message.success(t('message.samplingSuccessMsg', { count: selectedPartIds.value.length }))
    emit('success')
    emit('update:visible', false)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="less" scoped>
.choice-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  .choice-label {
    font-size: 14px;
    color: #333;
    white-space: nowrap;
  }
}

.sampling-controls {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;

  .control-label {
    font-size: 14px;
    color: #555;
    white-space: nowrap;
  }

  .count-total {
    font-size: 14px;
    color: #888;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>

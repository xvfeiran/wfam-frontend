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
        :list-style="{ width: '400px', height: '380px' }"
        disabled
        show-search
      >
        <template #render="item">
          <span class="transfer-item">
            <span class="transfer-item-text">{{ item.title }}  |  {{ item.description }}</span>
            <a-button type="link" size="small" class="detail-btn" @click.stop="showPartDetail(item.key)">
              {{ t('common.view') }}
            </a-button>
          </span>
        </template>
      </a-transfer>
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
          <a-radio-button value="random">
            <ThunderboltOutlined /> {{ t('message.randomSampling') }}
          </a-radio-button>
          <a-radio-button value="manual">
            <FilterOutlined /> {{ t('message.manualSampling') }}
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

      <!-- 随机抽样区域 -->
      <template v-if="samplingChoice === 'random'">
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

        <!-- 穿梭框（完整数据源） -->
        <a-transfer
          :data-source="transferDataSource"
          :target-keys="selectedPartIds"
          :titles="[
            `${t('message.unsampledParts')} (${availableParts.length - selectedPartIds.length}/${availableParts.length})`,
            `${t('message.sampledParts')} (${selectedPartIds.length})`
          ]"
          :list-style="{ width: '400px', height: '380px' }"
          show-search
          @change="handleTransferChange"
        >
          <template #render="item">
            <span class="transfer-item">
              <span class="transfer-item-text">{{ item.title }}  |  {{ item.description }}</span>
              <a-button type="link" size="small" class="detail-btn" @click.stop="showPartDetail(item.key)">
                {{ t('common.view') }}
              </a-button>
            </span>
          </template>
        </a-transfer>

        <!-- 底部按钮 -->
        <div class="modal-footer">
          <a-button
            :disabled="selectedPartIds.length === 0"
            @click="handleClearSelection"
          >
            <template #icon><ClearOutlined /></template>
            {{ t('message.clearSelection') }}
          </a-button>
          <div style="flex: 1" />
          <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
          <a-button
            type="primary"
            :disabled="selectedPartIds.length === 0"
            :loading="confirmDebounce.isDebouncing.value"
            @click="handleConfirmSampling"
          >
            {{ t('message.confirmSampling') }}（{{ selectedPartIds.length }}）
          </a-button>
        </div>
      </template>

      <!-- 手动抽样区域 -->
      <template v-if="samplingChoice === 'manual'">
        <!-- 搜索筛选 -->
        <div class="manual-search">
          <a-row :gutter="12" align="middle">
            <a-col :span="6">
              <a-select
                v-model:value="manualSearch.partCode"
                :placeholder="t('returnPart.partCode')"
                allow-clear
                show-search
                :filter-option="filterOption"
                style="width: 100%"
                @change="onPartCodeChange"
              >
                <a-select-option v-for="pc in partCodeOptions" :key="pc" :value="pc">
                  {{ pc }}
                </a-select-option>
              </a-select>
            </a-col>
            <a-col :span="5">
              <a-select
                v-model:value="manualSearch.businessUnit"
                :placeholder="t('returnPart.businessUnit')"
                allow-clear
                style="width: 100%"
              >
                <a-select-option v-for="bu in masterBusinessUnits" :key="bu" :value="bu">
                  {{ bu }}
                </a-select-option>
              </a-select>
            </a-col>
            <a-col :span="5">
              <a-select
                v-model:value="manualSearch.failureType"
                :placeholder="t('returnPart.failureType')"
                allow-clear
                style="width: 100%"
              >
                <a-select-option v-for="ft in failureTypeOptions" :key="ft" :value="ft">
                  {{ t(`returnPart.failureTypeLabels.${ft}`) }}
                </a-select-option>
              </a-select>
            </a-col>
            <a-col :span="6">
              <a-space>
                <a-button type="primary" @click="applyManualFilter">
                  {{ t('common.search') }}
                </a-button>
                <a-button @click="resetManualFilter">
                  {{ t('common.reset') }}
                </a-button>
              </a-space>
            </a-col>
          </a-row>
        </div>

        <!-- 穿梭框（过滤后数据源） -->
        <a-transfer
          :data-source="manualFilteredSource"
          :target-keys="selectedPartIds"
          :titles="[
            `${t('message.unsampledParts')} (${manualFilteredSource.length - selectedPartIds.length}/${manualFilteredSource.length})`,
            `${t('message.sampledParts')} (${selectedPartIds.length})`
          ]"
          :list-style="{ width: '400px', height: '380px' }"
          show-search
          @change="handleTransferChange"
        >
          <template #render="item">
            <span class="transfer-item">
              <span class="transfer-item-text">{{ item.title }}  |  {{ item.description }}</span>
              <a-button type="link" size="small" class="detail-btn" @click.stop="showPartDetail(item.key)">
                {{ t('common.view') }}
              </a-button>
            </span>
          </template>
        </a-transfer>

        <!-- 底部按钮 -->
        <div class="modal-footer">
          <a-button
            :disabled="selectedPartIds.length === 0"
            @click="handleClearSelection"
          >
            <template #icon><ClearOutlined /></template>
            {{ t('message.clearSelection') }}
          </a-button>
          <div style="flex: 1" />
          <a-button @click="handleCancel">{{ t('common.cancel') }}</a-button>
          <a-button
            type="primary"
            :disabled="selectedPartIds.length === 0"
            :loading="confirmDebounce.isDebouncing.value"
            @click="handleConfirmSampling"
          >
            {{ t('message.confirmSampling') }}（{{ selectedPartIds.length }}）
          </a-button>
        </div>
      </template>
    </template>
  </a-modal>

  <!-- 售后件详情弹窗 -->
  <a-modal
    v-model:open="detailVisible"
    :title="t('partDetail.titleNew')"
    width="640px"
    :footer="null"
  >
    <a-descriptions :column="2" bordered size="small" v-if="detailPart">
      <a-descriptions-item :label="t('returnPart.partNumber')">{{ detailPart.partNumber || '-' }}</a-descriptions-item>
      <a-descriptions-item :label="t('returnPart.partCode')">{{ detailPart.partCode || '-' }}</a-descriptions-item>
      <a-descriptions-item :label="t('returnPart.businessUnit')">{{ detailPart.businessUnit || '-' }}</a-descriptions-item>
      <a-descriptions-item :label="t('returnPart.productPlatform')">{{ detailPart.productPlatform || '-' }}</a-descriptions-item>
      <a-descriptions-item :label="t('partDetail.productionShift')">{{ detailPart.productionShift || '-' }}</a-descriptions-item>
      <a-descriptions-item :label="t('partDetail.customerFailureType')">{{ detailPart.failureType ? t('returnPart.failureTypeLabels.' + detailPart.failureType) : '-' }}</a-descriptions-item>
      <a-descriptions-item :label="t('partDetail.boschFailureType')">{{ detailPart.boschFailureType || '-' }}</a-descriptions-item>
      <a-descriptions-item :label="t('partDetail.responsibleEngineer')">{{ userDisplayName(detailPart.responsibleEngineer) }}</a-descriptions-item>
      <a-descriptions-item :label="t('partDetail.analyst')">{{ userDisplayName(detailPart.analyst) }}</a-descriptions-item>
      <a-descriptions-item :label="t('common.status')" :span="2">
        <a-tag :color="PART_STATUS_MAP[detailPart.status]?.color || 'default'">
          {{ getPartStatusLabel(detailPart.status) }}
        </a-tag>
      </a-descriptions-item>
    </a-descriptions>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { StopOutlined, FilterOutlined, ThunderboltOutlined, ClearOutlined } from '@ant-design/icons-vue'
import { analysisOrderApi } from '@/services/analysisOrderApi'
import { lookupApi } from '@/services/lookupApi'
import { useDebouncedClick } from '@/composables/useDebouncedClick'
import { AnalysisOrderStatus, PART_STATUS_MAP } from '@/types'
import type { AnalysisOrder, Part } from '@/types'
import { usePermissions } from '@/composables/usePermissions'
import { useStatusLabels } from '@/composables/useStatusLabels'
import { useUserNameMap } from '@/composables/useUserNameMap'

const { t } = useI18n()
const { canEditSubmittedForm } = usePermissions()
const { getStatusLabel: getPartStatusLabel } = useStatusLabels()
const { displayName: userDisplayName } = useUserNameMap()

const props = defineProps<{
  visible: boolean
  order: AnalysisOrder | null
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
  (e: 'no-sampling'): void
}>()

// 状态
const internalReadOnly = ref(false)
const samplingChoice = ref<'random' | 'manual' | 'none' | null>('random')
const selectedPartIds = ref<string[]>([])
const sampledPartIds = ref<string[]>([])
const samplingRatio = ref<number>(0)
const sampledCount = ref<number>(0)
const submitting = ref(false)
const updating = ref(false)
const availableParts = ref<Part[]>([])
const detailVisible = ref(false)

// 防抖处理
const confirmDebounce = useDebouncedClick({ delay: 1000 })
const detailPart = ref<Part | null>(null)

// 手动抽样搜索状态
const manualSearch = ref({
  partCode: undefined as string | undefined,
  businessUnit: undefined as string | undefined,
  failureType: undefined as string | undefined,
})
const manualFilterApplied = ref({
  partCode: undefined as string | undefined,
  businessUnit: undefined as string | undefined,
  failureType: undefined as string | undefined,
})

// 零件号下拉选项（从当前可用零件去重）
const partCodeOptions = computed(() => {
  const codes = new Set(availableParts.value.map(p => p.partCode).filter(Boolean))
  return Array.from(codes).sort()
})

// 业务单元下拉选项（从主数据）
const masterBusinessUnits = ref<string[]>([])

// 客户失效类型选项（NVH/外观/功能）
const failureTypeOptions = ['NVH', 'APPEARANCE', 'FUNCTION']

// 是否已完成抽样
const isSampled = computed(() => {
  if (!props.order) return false
  return props.order.status !== AnalysisOrderStatus.PENDING_SAMPLING
})

// 是否已经抽样过（用于显示重新抽样警告）
const hasBeenSampled = computed(() => {
  return isSampled.value && sampledPartIds.value.length > 0
})

// 当前是否为只读模式
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

// 手动抽样过滤后的数据源（已选中的始终可见）
const manualFilteredSource = computed(() => {
  const { partCode, businessUnit, failureType } = manualFilterApplied.value
  if (!partCode && !businessUnit && !failureType) return transferDataSource.value

  return transferDataSource.value.filter(item => {
    if (selectedPartIds.value.includes(item.key)) return true

    const part = availableParts.value.find(p => p.id === item.key)
    if (!part) return false

    let match = true
    if (partCode) {
      match = match && part.partCode === partCode
    }
    if (businessUnit) {
      match = match && part.businessUnit === businessUnit
    }
    if (failureType) {
      match = match && part.failureType === failureType
    }
    return match
  })
})

// 查看售后件详情
const showPartDetail = (partId: string) => {
  detailPart.value = availableParts.value.find(p => p.id === partId) || null
  detailVisible.value = true
}

// 零件号选择时自动填充业务单元
const onPartCodeChange = (partCode: string | undefined) => {
  if (partCode) {
    const matchingPart = availableParts.value.find(p => p.partCode === partCode)
    if (matchingPart?.businessUnit) {
      manualSearch.value.businessUnit = matchingPart.businessUnit
    }
  }
}

// Select 下拉搜索过滤
const filterOption = (input: string, option: any) => {
  return (option.key as string)?.toLowerCase().includes(input.toLowerCase())
}

// 手动抽样：应用筛选
const applyManualFilter = () => {
  manualFilterApplied.value = { ...manualSearch.value }
}

// 手动抽样：重置筛选
const resetManualFilter = () => {
  manualSearch.value = { partCode: undefined, businessUnit: undefined, failureType: undefined }
  manualFilterApplied.value = { partCode: undefined, businessUnit: undefined, failureType: undefined }
}

// 当 visible 或 order 变化时加载数据并重置状态
watch(
  () => [props.visible, props.order] as const,
  async ([visible, order]) => {
    if (!visible || !order) return

    // 加载主数据业务单元选项（仅首次）
    if (masterBusinessUnits.value.length === 0) {
      const lookups = await lookupApi.getAll()
      masterBusinessUnits.value = lookups.businessUnits
    }
    internalReadOnly.value = props.readOnly ?? false

    samplingChoice.value = 'random'
    selectedPartIds.value = []
    sampledCount.value = 0
    samplingRatio.value = 0
    availableParts.value = order.parts || []
    resetManualFilter()

    // 加载已抽样的售后件数据
    if (isSampled.value) {
      sampledPartIds.value = availableParts.value
        .filter(p => p.isSample === 1)
        .map(p => p.id)

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

// 切换到可编辑模式
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

// 随机抽样
const handleRandomSampling = () => {
  const count = Math.min(sampledCount.value, totalCount.value)
  if (count <= 0) return
  const shuffled = [...availableParts.value].sort(() => Math.random() - 0.5)
  selectedPartIds.value = shuffled.slice(0, count).map(p => p.id)
  message.success(t('message.randomSamplingComplete', { count }))
}

// 一键清除
const handleClearSelection = () => {
  selectedPartIds.value = []
  sampledCount.value = 0
  samplingRatio.value = 0
}

// 取消
const handleCancel = () => {
  emit('update:visible', false)
}

// 确认不抽样
const handleNoSampling = async () => {
  submitting.value = true
  try {
    await analysisOrderApi.sampling(props.order!.id, { sampledPartIds: [] })
    message.success(t('message.noSamplingSuccess'))
    emit('no-sampling')
    emit('update:visible', false)
  } finally {
    submitting.value = false
  }
}

// 确认抽样
const handleConfirmSampling = () => confirmDebounce.execute(async () => {
  if (selectedPartIds.value.length === 0) {
    message.warning(t('message.pleaseSelectAtLeastOnePart'))
    return
  }
  try {
    await analysisOrderApi.sampling(props.order!.id, { sampledPartIds: selectedPartIds.value })
    message.success(t('message.samplingSuccessMsg', { count: selectedPartIds.value.length }))
    emit('success')
    emit('update:visible', false)
  } finally {
  }
})
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

.manual-search {
  margin-bottom: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.transfer-item {
  display: inline-flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;

  .transfer-item-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail-btn {
    flex-shrink: 0;
    padding: 0 4px;
    font-size: 12px;
    height: auto;
    line-height: 1;
  }
}
</style>

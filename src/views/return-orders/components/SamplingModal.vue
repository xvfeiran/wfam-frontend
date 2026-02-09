<template>
  <a-modal
    :open="visible"
    :title="isSampled ? t('modal.samplingResultView') : t('modal.samplingManagement')"
    width="900px"
    :footer="null"
    @cancel="handleCancel"
  >
    <!-- 已抽样状态：仅查看 -->
    <template v-if="isSampled">
      <a-alert :message="t('message.samplingCompletedAlert')" type="info" show-icon style="margin-bottom: 16px" />

      <a-row :gutter="16">
        <!-- 左侧：售后件列表 -->
        <a-col :span="12">
          <a-card :title="t('message.parts')" size="small">
            <div class="parts-list">
              <div v-for="part in availableParts" :key="part.id" class="part-item">
                <div class="part-info">
                  <div class="part-code">{{ part.partCode }}</div>
                  <div class="part-meta">{{ part.businessUnit }} - {{ part.productPlatform }}</div>
                </div>
              </div>
              <a-empty v-if="availableParts.length === 0" :description="t('message.noParts')" />
            </div>
          </a-card>
        </a-col>

        <!-- 右侧：抽样结果 -->
        <a-col :span="12">
          <a-card :title="t('message.samplingResult')" size="small" :extra="t('message.totalSamples', { count: sampledPartIds.length })">
            <div class="selected-list">
              <div v-for="(partId, index) in sampledPartIds" :key="partId" class="selected-item">
                <div class="sample-info">
                  <div class="sample-number">{{ generateSampleNumber(partId, index) }}</div>
                  <div class="sample-code">{{ getPartById(partId)?.partCode }}</div>
                </div>
              </div>
              <a-empty v-if="sampledPartIds.length === 0" :description="t('message.noSamplingResultView')" />
            </div>
          </a-card>
        </a-col>
      </a-row>
    </template>

    <!-- 未抽样状态：可操作 -->
    <template v-else>
      <a-form layout="vertical">
        <a-form-item :label="t('message.sampling')" style="margin-bottom: 8px">
          <a-space>
            <a-radio-group v-model:value="samplingMethod">
              <a-radio value="standard">{{ t('message.standardSampling') }}</a-radio>
              <a-radio value="custom">{{ t('message.customSampling') }}</a-radio>
              <a-radio value="none">{{ t('message.noSampling') }}</a-radio>
            </a-radio-group>
            <a-button type="primary" @click="handleSampling" :disabled="samplingMethod === 'none'">
              {{ t('message.sampling') }}
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-row :gutter="16">
        <!-- 左侧：售后件列表（仅展示，不能操作） -->
        <a-col :span="12">
          <a-card :title="t('message.parts')" size="small">
            <div class="parts-list">
              <div v-for="part in availableParts" :key="part.id" class="part-item">
                <div class="part-info">
                  <div class="part-code">{{ part.partCode }}</div>
                  <div class="part-meta">{{ part.businessUnit }} - {{ part.productPlatform }}</div>
                </div>
              </div>
              <a-empty v-if="availableParts.length === 0" :description="t('message.noParts')" />
            </div>
          </a-card>
        </a-col>

        <!-- 右侧：抽样结果 -->
        <a-col :span="12">
          <a-card :title="t('message.samplingResult')" size="small" :extra="t('message.totalSamples', { count: selectedPartIds.length })">
            <div class="selected-list">
              <div v-for="(partId, index) in selectedPartIds" :key="partId" class="selected-item">
                <div class="sample-info">
                  <div class="sample-number">{{ generateSampleNumber(partId, index) }}</div>
                  <div class="sample-code">{{ getPartById(partId)?.partCode }}</div>
                </div>
              </div>
              <a-empty v-if="selectedPartIds.length === 0" :description="t('message.noSamplingResult')" />
            </div>
          </a-card>
        </a-col>
      </a-row>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { MOCK_PARTS } from '@/services/mockData'
import { OrderStatus } from '@/types'
import type { ReturnOrder, Part } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  order: ReturnOrder | null
}>()

const emit = defineEmits(['update:visible', 'success'])

const samplingMethod = ref<'standard' | 'custom' | 'none'>('standard')
const selectedPartIds = ref<string[]>([])
const sampledPartIds = ref<string[]>([])

// 获取当前退货单关联的零件
const availableParts = ref<Part[]>([])

// 判断是否已抽样
const isSampled = computed(() => {
  if (!props.order) return false
  return props.order.status === OrderStatus.SAMPLING_COMPLETED ||
         props.order.status === OrderStatus.PENDING_DETAILED_ANALYSIS ||
         props.order.status === OrderStatus.IN_DETAILED_ANALYSIS ||
         props.order.status === OrderStatus.PENDING_APPROVAL ||
         props.order.status === OrderStatus.APPROVED ||
         props.order.status === OrderStatus.COMPLETED
})

watch(
  () => props.order,
  (order) => {
    if (order) {
      availableParts.value = MOCK_PARTS.filter(p => p.orderId === order.id)
      selectedPartIds.value = []
      // 模拟已抽样的结果（实际应从后端获取）
      if (isSampled.value) {
        sampledPartIds.value = availableParts.value.slice(0, Math.ceil(availableParts.value.length / 2)).map(p => p.id)
      } else {
        sampledPartIds.value = []
      }
    }
  },
  { immediate: true }
)

const getPartById = (id: string) => availableParts.value.find(p => p.id === id)

const generateSampleNumber = (partId: string, index: number) => {
  const part = getPartById(partId)
  if (!part) return ''
  return `${part.businessUnit}-${part.productPlatform}-${String(index + 1).padStart(4, '0')}`
}

const handleCancel = () => {
  emit('update:visible', false)
}

const handleSampling = () => {
  if (samplingMethod.value === 'none') {
    message.info(t('message.currentSelectNoSampling'))
    return
  }

  if (availableParts.value.length === 0) {
    message.warning(t('message.noPartsAvailable'))
    return
  }

  // 根据抽样方式进行抽样
  if (samplingMethod.value === 'standard') {
    // 标准抽样：按一定比例随机抽取
    const sampleCount = Math.max(1, Math.ceil(availableParts.value.length * 0.3))
    const shuffled = [...availableParts.value].sort(() => Math.random() - 0.5)
    selectedPartIds.value = shuffled.slice(0, sampleCount).map(p => p.id)
    message.success(t('message.standardSamplingComplete', { count: sampleCount }))
  } else if (samplingMethod.value === 'custom') {
    // 指定抽样：全部选中（实际可根据需求调整）
    selectedPartIds.value = availableParts.value.map(p => p.id)
    message.success(t('message.customSamplingComplete', { count: selectedPartIds.value.length }))
  }

  emit('success')
}
</script>

<style lang="less" scoped>
.parts-list, .selected-list {
  max-height: 400px;
  overflow-y: auto;
}

.part-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .part-info {
    .part-code {
      font-weight: 500;
    }
    .part-meta {
      font-size: 12px;
      color: #999;
    }
  }
}

.selected-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .sample-info {
    .sample-number {
      font-weight: 500;
      color: #0066B2;
    }
    .sample-code {
      font-size: 12px;
      color: #999;
    }
  }
}
</style>

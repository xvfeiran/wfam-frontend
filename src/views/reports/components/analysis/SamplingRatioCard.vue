<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalysisStore } from '@/stores/reportAnalysis'
import { analysisApi } from '@/services/reportAnalysis'
import { transformSamplingRatio } from '@/utils/transforms/analysis/samplingRatio'

const store = useAnalysisStore()
const { filters } = storeToRefs(store)

const loading = ref(false)
const cardData = ref<{ bu: string; ratio: number }[]>([])
const displayValues = ref<Record<string, number>>({})
const isAnimating = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const res = await analysisApi.getSamplingRatio(filters.value.samplingRatioYear)
    cardData.value = transformSamplingRatio(res)

    // 初始化显示值为0
    cardData.value.forEach(item => {
      displayValues.value[item.bu] = 0
    })

    // 触发动画
    isAnimating.value = true
    setTimeout(() => {
      cardData.value.forEach((item, index) => {
        animateValue(item.bu, item.ratio * 100, index * 120)
      })
    }, 200)
  } finally {
    loading.value = false
  }
}

function animateValue(bu: string, target: number, delay: number) {
  const duration = 1500
  const startTime = performance.now() + delay

  function update(currentTime: number) {
    const elapsed = currentTime - startTime
    if (elapsed < 0) {
      requestAnimationFrame(update)
      return
    }

    const progress = Math.min(elapsed / duration, 1)
    // easeOutExpo
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

    displayValues.value[bu] = Math.round(target * easeProgress)

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

onMounted(fetchData)

watch(() => filters.value.samplingRatioYear, () => {
  fetchData()
})

function getColor(ratio: number): string {
  if (ratio >= 80) return '#1d4ed8'
  if (ratio >= 60) return '#2563eb'
  if (ratio >= 40) return '#3b82f6'
  return '#60a5fa'
}
</script>

<template>
  <div class="sampling-ratio-grid">
    <template v-if="loading">
      <div v-for="i in 4" :key="i" class="ratio-card ratio-card--skeleton">
        <div class="skeleton-value"></div>
        <div class="skeleton-label"></div>
      </div>
    </template>
    <template v-else>
      <div
        v-for="(item, index) in cardData"
        :key="item.bu"
        class="ratio-card"
        :style="{ '--delay': `${index * 80}ms` }"
      >
        <!-- 装饰背景 -->
        <div class="card-bg">
          <div class="bg-circle bg-circle-1"></div>
          <div class="bg-circle bg-circle-2"></div>
        </div>

        <!-- 主内容 -->
        <div class="card-content">
          <!-- 数字显示 -->
          <div class="value-container">
            <span class="value-prefix">-</span>
            <span
              class="value-number"
              :style="{ '--target': item.ratio * 100, '--color': getColor(item.ratio * 100) }"
            >
              {{ displayValues[item.bu] }}
            </span>
            <span class="value-suffix">%</span>
          </div>

          <!-- 底部装饰线 -->
          <div class="value-underline" :style="{ background: getColor(item.ratio) }"></div>
        </div>

        <!-- BU标签 -->
        <div class="card-footer">
          <span class="bu-label">{{ item.bu }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
// =============================================
// 抽样比例卡片 - 数字计数动画
// Design: Minimal Luxury / Refined Corporate
// =============================================

@sampling-bg: #ffffff;
@sampling-border: #e2e8f0;
@sampling-text-primary: #1e293b;
@sampling-text-secondary: #64748b;

.sampling-ratio-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  height: 100%;
  min-height: 280px;
  padding: 8px;
}

.ratio-card {
  position: relative;
  background: @sampling-bg;
  border: 1px solid @sampling-border;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 28px 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  // 入场动画
  opacity: 0;
  transform: translateY(20px);
  animation: card-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--delay);

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.08),
      0 8px 16px rgba(0, 0, 0, 0.04);
    border-color: rgba(14, 165, 233, 0.3);

    .bg-circle-1 {
      transform: translate(-30%, -30%) scale(1.5);
    }

    .bg-circle-2 {
      transform: translate(30%, 30%) scale(1.3);
    }
  }
}

// 装饰背景
.card-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.bg-circle-1 {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  top: -60px;
  right: -60px;
  transform: translate(0, 0);
}

.bg-circle-2 {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  bottom: -40px;
  left: -40px;
  transform: translate(0, 0);
}

// 主内容
.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

// 数字容器
.value-container {
  display: flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1;
}

.value-prefix {
  font-size: 24px;
  font-weight: 600;
  color: @sampling-text-secondary;
  opacity: 0.5;
}

.value-number {
  font-size: 56px;
  font-weight: 800;
  letter-spacing: -3px;
  background: linear-gradient(135deg, var(--color) 0%, color-mix(in srgb, var(--color) 60%, #1e293b) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.value-suffix {
  font-size: 24px;
  font-weight: 600;
  color: var(--color);
  opacity: 0.8;
}

// 底部装饰线
.value-underline {
  width: 40px;
  height: 3px;
  border-radius: 2px;
  opacity: 0.7;
}

// 底部标签
.card-footer {
  position: relative;
  z-index: 1;
}

.bu-label {
  font-size: 13px;
  font-weight: 600;
  color: @sampling-text-secondary;
  letter-spacing: 1px;
  text-transform: uppercase;
}

// 骨架屏
.ratio-card--skeleton {
  .skeleton-value {
    width: 120px;
    height: 56px;
    background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 8px;
  }

  .skeleton-label {
    width: 60px;
    height: 14px;
    background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;
  }
}

// 动画
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// 响应式
@media (max-width: 1200px) {
  .sampling-ratio-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .sampling-ratio-grid {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .ratio-card {
    min-height: 180px;
    flex-direction: row;
    gap: 32px;
    padding: 24px 32px;
  }

  .card-content {
    flex-direction: row;
    gap: 16px;
  }

  .value-number {
    font-size: 42px;
  }
}
</style>

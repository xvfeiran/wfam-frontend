<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { qualityApi } from '@/services/reportQuality'
import { nowShanghai } from '@/utils/dayjs'

const loading = ref(true)
const displayedCount = ref(0)
const animationDuration = 1200

function animateCount(target: number) {
  const startTime = performance.now()
  const startValue = 0

  function update(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / animationDuration, 1)
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    displayedCount.value = Math.round(startValue + (target - startValue) * easeProgress)

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

async function fetchData() {
  loading.value = true
  try {
    const currentYear = String(nowShanghai().year())
    const count = await qualityApi.getReturnQuantity(currentYear)
    animateCount(count)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="return-quantity-card">
    <div class="card-grid-bg">
      <svg class="grid-pattern" viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.15"/>
          </pattern>
          <pattern id="largeGrid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)"/>
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" stroke-width="1" opacity="0.08"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#largeGrid)"/>
      </svg>
    </div>

    <div class="card-orb card-orb--primary"></div>
    <div class="card-orb card-orb--secondary"></div>

    <div class="card-content">
      <div class="card-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        <span>AFTER-SALES PARTS</span>
      </div>

      <div class="card-center">
        <div v-if="loading" class="skeleton skeleton--value"></div>
        <template v-else>
          <span class="card-value">{{ displayedCount.toLocaleString() }}</span>
        </template>
      </div>

      <div class="card-label">
        <span>本年度累计售后件数量</span>
      </div>
    </div>

    <div class="card-highlight"></div>
  </div>
</template>

<style scoped lang="less">
// =============================================
// 售后件总数卡片 - 工业数据驱动美学
// =============================================

@accent-primary: #2563eb;
@accent-secondary: #0ea5e9;
@accent-success: #10b981;
@accent-danger: #ef4444;
@text-primary: #1e293b;
@text-secondary: #64748b;
@text-muted: #94a3b8;
@bg-card: #ffffff;
@bg-page: #f5f7fa;
@border-color: #e2e8f0;

.return-quantity-card {
  position: relative;
  height: 100%;
  min-height: 280px;
  background: linear-gradient(145deg, #ffffff 0%, @bg-page 100%);
  border: 1px solid @border-color;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);

  .card-grid-bg {
    position: absolute;
    inset: 0;
    color: @accent-primary;

    .grid-pattern {
      width: 100%;
      height: 100%;
    }
  }

  .card-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.4;
    pointer-events: none;

    &--primary {
      width: 180px;
      height: 180px;
      top: -60px;
      right: -40px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, transparent 70%);
    }

    &--secondary {
      width: 120px;
      height: 120px;
      bottom: -30px;
      left: -20px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, transparent 70%);
    }
  }

  .card-content {
    position: relative;
    z-index: 2;
    height: 100%;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }

  .card-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(37, 99, 235, 0.08);
    border: 1px solid rgba(37, 99, 235, 0.15);
    border-radius: 20px;
    margin-bottom: 20px;
    width: fit-content;

    svg {
      width: 14px;
      height: 14px;
      color: @accent-primary;
    }

    span {
      font-size: 10px;
      font-weight: 700;
      color: @accent-primary;
      letter-spacing: 1.2px;
    }
  }

  .card-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .card-value {
    font-size: 64px;
    font-weight: 800;
    color: @text-primary;
    line-height: 1;
    letter-spacing: -3px;
    font-variant-numeric: tabular-nums;
  }

  .card-label {
    text-align: center;
    font-size: 13px;
    color: @text-secondary;
    margin-top: 12px;
  }

  .card-highlight {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    border: 2px solid transparent;
    transition: border-color 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(37, 99, 235, 0.12);

    .card-highlight {
      border-color: rgba(37, 99, 235, 0.3);
    }

    .card-orb--primary {
      opacity: 0.6;
      transform: scale(1.1);
      transition: all 0.4s ease;
    }
  }

  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;

    &--value {
      width: 200px;
      height: 64px;
    }
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

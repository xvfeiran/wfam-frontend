# 防抖按钮设计文档

**日期:** 2026-04-20
**作者:** Claude
**状态:** 设计阶段

## 概述

为前端所有"提交"、"暂存"按钮添加防抖功能，防止用户快速多次点击导致重复提交。

## 需求

- 防抖延迟: 1000ms
- 防抖期间按钮状态: 禁用 + 加载中
- 不改变现有 API 调用和表单验证逻辑

## 架构设计

### Composable 函数

创建 `useDebouncedClick` 组合函数，遵循 Vue 3 Composition API 风格。

```typescript
// composables/useDebouncedClick.ts
import { ref, onUnmounted } from 'vue'

export function useDebouncedClick(delay: number = 1000) {
  const isDebouncing = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const execute = async (fn: () => void | Promise<void>) => {
    if (isDebouncing.value) return

    isDebouncing.value = true
    try {
      await fn()
    } finally {
      debounceTimer = setTimeout(() => {
        isDebouncing.value = false
      }, delay)
    }
  }

  const cancel = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    isDebouncing.value = false
  }

  onUnmounted(() => {
    cancel()
  })

  return { isDebouncing, execute, cancel }
}
```

### 用法示例

```vue
<script setup lang="ts">
import { useDebouncedClick } from '@/composables/useDebouncedClick'

const { isDebouncing, execute } = useDebouncedClick(1000)

const handleSubmit = () => execute(async () => {
  await formRef.value?.validate()
  await returnOrderApi.submit(orderId.value)
  message.success(t('message.submitSuccess'))
  router.push('/return-orders')
})
</script>

<template>
  <a-button
    type="primary"
    :disabled="isDebouncing"
    :loading="isDebouncing"
    @click="handleSubmit"
  >
    {{ t('common.submit') }}
  </a-button>
</template>
```

## 组件修改清单

| 组件路径 | 按钮类型 | 操作 |
|----------|----------|------|
| views/return-orders/OrderForm.vue | 保存、提交 | 添加防抖 |
| views/return-parts/PartForm.vue | 保存、提交 | 添加防抖 |
| views/return-parts/AnalysisForm.vue | 保存草稿、提交审批 | 添加防抖 |
| views/return-parts/components/AnalysisReportModal.vue | 保存、提交审批 | 添加防抖 |
| views/return-orders/components/ScrapModal.vue | 提交 | 添加防抖 |
| views/analysis-orders/components/ScrapModal.vue | 提交 | 添加防抖 |
| views/settings/components/EmailConfig.vue | 保存配置 | 添加防抖 |
| views/settings/components/NotificationConfig.vue | 保存配置 | 添加防抖 |

## 边缘情况处理

1. **组件卸载**: `onUnmounted` 钩子清理定时器，防止内存泄漏
2. **异步错误**: `finally` 块确保即使出错也会重置状态
3. **快速连续点击**: 第一次点击后，后续点击被忽略直到防抖结束
4. **手动取消**: 暴露 `cancel()` 方法用于特殊场景

## 测试策略

### 单元测试
- 测试正常点击执行
- 测试防抖期间重复点击被忽略
- 测试异步函数错误不影响状态重置
- 测试组件卸载时清理定时器

### 手动测试
1. 快速双击提交按钮 → 只触发一次 API 调用
2. 点击后验证按钮显示 loading 状态
3. 等待 1000ms 后按钮恢复可点击

## 不变内容

- 现有的 API 调用逻辑
- 现有的表单验证逻辑
- 现有的错误处理逻辑
- 现有的路由跳转逻辑

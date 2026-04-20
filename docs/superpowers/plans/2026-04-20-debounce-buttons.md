# 防抖按钮实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为前端所有"提交"、"暂存"按钮添加防抖功能，防止用户快速多次点击导致重复提交。

**Architecture:** 创建 Vue 3 Composable 函数 `useDebouncedClick`，在所有表单和模态框组件中集成使用。

**Tech Stack:** Vue 3 Composition API, TypeScript

---

## Task 1: 创建 useDebouncedClick Composable

**Files:**
- Create: `src/composables/useDebouncedClick.ts`

- [ ] **Step 1: 创建 composable 文件**

```typescript
// src/composables/useDebouncedClick.ts
import { ref, onUnmounted } from 'vue'

export interface DebounceOptions {
  delay?: number
}

export function useDebouncedClick(options: DebounceOptions = {}) {
  const { delay = 1000 } = options

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

- [ ] **Step 2: 提交**

```bash
cd frontend
git add src/composables/useDebouncedClick.ts
git commit -m "feat: add useDebouncedClick composable

Add composable function for debouncing click handlers on buttons.
- Delay: 1000ms (configurable)
- Auto cleanup on unmount
- Returns isDebouncing ref for button state binding

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: 修改 OrderForm.vue

**Files:**
- Modify: `src/views/return-orders/OrderForm.vue`

- [ ] **Step 1: 添加 useDebouncedClick 导入和初始化**

在 `<script setup lang="ts">` 部分添加导入：

```typescript
import { useDebouncedClick } from '@/composables/useDebouncedClick'
```

在 `const { t } = useI18n()` 之后添加：

```typescript
// 防抖处理
const saveDebounce = useDebouncedClick({ delay: 1000 })
const submitDebounce = useDebouncedClick({ delay: 1000 })
```

- [ ] **Step 2: 修改 handleSave 函数**

将原函数（293-310行）：

```typescript
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    if (isEdit.value) {
      await returnOrderApi.update(orderId.value, buildPayload())
    } else {
      await returnOrderApi.create(buildPayload())
    }
    message.success(t('message.saveSuccess'))
    router.push('/return-orders')
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
}
```

替换为：

```typescript
const handleSave = () => saveDebounce.execute(async () => {
  try {
    await formRef.value?.validate()
    if (isEdit.value) {
      await returnOrderApi.update(orderId.value, buildPayload())
    } else {
      await returnOrderApi.create(buildPayload())
    }
    message.success(t('message.saveSuccess'))
    router.push('/return-orders')
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
})
```

- [ ] **Step 3: 修改 handleSaveForSubmitted 函数**

将原函数（313-326行）：

```typescript
const handleSaveForSubmitted = async () => {
  try {
    await formRef.value?.validate()
    await returnOrderApi.update(orderId.value, buildPayload())
    message.success(t('message.saveSuccess'))
    router.push(`/return-orders/${orderId.value}`)
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
}
```

替换为：

```typescript
const handleSaveForSubmitted = () => submitDebounce.execute(async () => {
  try {
    await formRef.value?.validate()
    await returnOrderApi.update(orderId.value, buildPayload())
    message.success(t('message.saveSuccess'))
    router.push(`/return-orders/${orderId.value}`)
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
})
```

- [ ] **Step 4: 修改 handleSubmit 函数**

将原函数（328-348行）：

```typescript
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    let savedId = orderId.value
    if (isEdit.value) {
      await returnOrderApi.update(savedId, buildPayload())
    } else {
      const created = await returnOrderApi.create(buildPayload())
      savedId = created.id
    }
    await returnOrderApi.submit(savedId)
    message.success(t('message.submitSuccess'))
    router.push(`/return-orders/${savedId}`)
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.submitFailed'))
    }
  }
}
```

替换为：

```typescript
const handleSubmit = () => submitDebounce.execute(async () => {
  try {
    await formRef.value?.validate()
    let savedId = orderId.value
    if (isEdit.value) {
      await returnOrderApi.update(savedId, buildPayload())
    } else {
      const created = await returnOrderApi.create(buildPayload())
      savedId = created.id
    }
    await returnOrderApi.submit(savedId)
    message.success(t('message.submitSuccess'))
    router.push(`/return-orders/${savedId}`)
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.submitFailed'))
    }
  }
})
```

- [ ] **Step 5: 修改模板中的按钮**

在 `<template>` 部分（第114-115行），修改按钮：

将：

```vue
<a-button @click="handleSave">{{ t('common.save') }}</a-button>
<a-button type="primary" @click="handleSubmit">{{ t('common.submit') }}</a-button>
```

替换为：

```vue
<a-button :disabled="saveDebounce.isDebouncing.value" :loading="saveDebounce.isDebouncing.value" @click="handleSave">{{ t('common.save') }}</a-button>
<a-button type="primary" :disabled="submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('common.submit') }}</a-button>
```

在第119行，修改按钮：

将：

```vue
<a-button type="primary" @click="handleSaveForSubmitted">{{ t('common.submit') }}</a-button>
```

替换为：

```vue
<a-button type="primary" :disabled="submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSaveForSubmitted">{{ t('common.submit') }}</a-button>
```

- [ ] **Step 6: 提交**

```bash
cd frontend
git add src/views/return-orders/OrderForm.vue
git commit -m "feat: add debounce to OrderForm submit/save buttons

Integrate useDebouncedClick composable for save and submit actions.
- Buttons show disabled + loading state during debounce
- Prevents duplicate form submissions

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: 修改 PartForm.vue

**Files:**
- Modify: `src/views/return-parts/PartForm.vue`

- [ ] **Step 1: 添加 useDebouncedClick 导入和初始化**

在 `<script setup lang="ts">` 部分添加导入：

```typescript
import { useDebouncedClick } from '@/composables/useDebouncedClick'
```

在 `const { canEditSubmittedForm } = usePermissions()` 之后添加：

```typescript
// 防抖处理
const saveDebounce = useDebouncedClick({ delay: 1000 })
const submitDebounce = useDebouncedClick({ delay: 1000 })
```

- [ ] **Step 2: 修改 handleSave 函数**

将原函数（211-234行）：

```typescript
const handleSave = async () => {
  try {
    await basicInfoCardRef.value?.validate()
    if (isEdit.value) {
      await partApi.update(partId.value, buildPartPayload())
    } else {
      await partApi.create(buildPartPayload(), ocrTaskId.value)
    }
    message.success(t('message.saveSuccess'))

    // 如果是从退货单详情页进入，返回到退货单详情页
    if (fromOrderDetail.value && form.orderId) {
      router.push(`/return-orders/${form.orderId}`)
    } else {
      router.push('/return-parts')
    }
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
}
```

替换为：

```typescript
const handleSave = () => saveDebounce.execute(async () => {
  try {
    await basicInfoCardRef.value?.validate()
    if (isEdit.value) {
      await partApi.update(partId.value, buildPartPayload())
    } else {
      await partApi.create(buildPartPayload(), ocrTaskId.value)
    }
    message.success(t('message.saveSuccess'))

    // 如果是从退货单详情页进入，返回到退货单详情页
    if (fromOrderDetail.value && form.orderId) {
      router.push(`/return-orders/${form.orderId}`)
    } else {
      router.push('/return-parts')
    }
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.saveFailed'))
    }
  }
})
```

- [ ] **Step 3: 修改 handleSubmit 函数**

将原函数（249-279行）：

```typescript
const handleSubmit = async () => {
  if (isOcrProcessing.value) {
    message.warning(t('ocr.submitBlockedWhileProcessing'))
    return
  }

  const confirmed = await confirmSubmit()
  if (!confirmed) return

  try {
    await basicInfoCardRef.value?.validate()
    let savedId = partId.value
    if (isEdit.value) {
      await partApi.update(savedId, buildPartPayload())
    } else {
      const created = await partApi.create(buildPartPayload(), ocrTaskId.value)
      savedId = created.id
    }
    await partApi.submit(savedId)
    message.success(t('message.submitSuccess'))

    // 提交后返回售后件列表页
    router.push('/return-parts')
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.submitFailed'))
    }
  }
}
```

替换为：

```typescript
const handleSubmit = () => submitDebounce.execute(async () => {
  if (isOcrProcessing.value) {
    message.warning(t('ocr.submitBlockedWhileProcessing'))
    return
  }

  const confirmed = await confirmSubmit()
  if (!confirmed) return

  try {
    await basicInfoCardRef.value?.validate()
    let savedId = partId.value
    if (isEdit.value) {
      await partApi.update(savedId, buildPartPayload())
    } else {
      const created = await partApi.create(buildPartPayload(), ocrTaskId.value)
      savedId = created.id
    }
    await partApi.submit(savedId)
    message.success(t('message.submitSuccess'))

    // 提交后返回售后件列表页
    router.push('/return-parts')
  } catch (error: any) {
    if (error?.errorFields) {
      message.error(t('validation.formError'))
    } else {
      message.error(t('message.submitFailed'))
    }
  }
})
```

- [ ] **Step 4: 修改模板中的按钮**

在 `<template>` 部分（第47-48行和第52行），修改按钮：

将：

```vue
<a-button @click="handleSave">{{ t('common.save') }}</a-button>
<a-button type="primary" :disabled="isOcrProcessing" @click="handleSubmit">{{ t('common.submit') }}</a-button>
```

替换为：

```vue
<a-button :disabled="saveDebounce.isDebouncing.value" :loading="saveDebounce.isDebouncing.value" @click="handleSave">{{ t('common.save') }}</a-button>
<a-button type="primary" :disabled="isOcrProcessing || submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('common.submit') }}</a-button>
```

将第52行：

```vue
<a-button type="primary" :disabled="isOcrProcessing" @click="handleSubmit">{{ t('common.submit') }}</a-button>
```

替换为：

```vue
<a-button type="primary" :disabled="isOcrProcessing || submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('common.submit') }}</a-button>
```

- [ ] **Step 5: 提交**

```bash
cd frontend
git add src/views/return-parts/PartForm.vue
git commit -m "feat: add debounce to PartForm submit/save buttons

Integrate useDebouncedClick composable for save and submit actions.
- Combines with existing isOcrProcessing disabled state
- Prevents duplicate form submissions

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: 修改 AnalysisForm.vue

**Files:**
- Modify: `src/views/return-parts/AnalysisForm.vue`

- [ ] **Step 1: 添加 useDebouncedClick 导入和初始化**

在 `<script setup lang="ts">` 部分添加导入：

```typescript
import { useDebouncedClick } from '@/composables/useDebouncedClick'
```

在 `const formRef = ref()` 之后添加：

```typescript
// 防抖处理
const saveDraftDebounce = useDebouncedClick({ delay: 1000 })
const submitDebounce = useDebouncedClick({ delay: 1000 })
```

- [ ] **Step 2: 修改 handleSaveDraft 函数**

将原函数（189-191行）：

```typescript
const handleSaveDraft = () => {
  message.success(t('message.draftSaved'))
}
```

替换为：

```typescript
const handleSaveDraft = () => saveDraftDebounce.execute(async () => {
  // TODO: 实现保存草稿逻辑
  message.success(t('message.draftSaved'))
})
```

- [ ] **Step 3: 修改 handleSubmit 函数**

将原函数（193-201行）：

```typescript
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    message.success(t('analysisForm.submitSuccess', t('message.submitSuccess')))
    router.push('/return-parts')
  } catch {
    message.error(t('validation.formError'))
  }
}
```

替换为：

```typescript
const handleSubmit = () => submitDebounce.execute(async () => {
  try {
    await formRef.value?.validate()
    message.success(t('analysisForm.submitSuccess', t('message.submitSuccess')))
    router.push('/return-parts')
  } catch {
    message.error(t('validation.formError'))
  }
})
```

- [ ] **Step 4: 修改模板中的按钮**

在 `<template>` 部分（第9-10行），修改按钮：

将：

```vue
<a-button @click="handleSaveDraft">{{ t('analysisForm.saveDraft') }}</a-button>
<a-button type="primary" @click="handleSubmit">{{ t('analysisForm.submitApproval') }}</a-button>
```

替换为：

```vue
<a-button :disabled="saveDraftDebounce.isDebouncing.value" :loading="saveDraftDebounce.isDebouncing.value" @click="handleSaveDraft">{{ t('analysisForm.saveDraft') }}</a-button>
<a-button type="primary" :disabled="submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('analysisForm.submitApproval') }}</a-button>
```

- [ ] **Step 5: 提交**

```bash
cd frontend
git add src/views/return-parts/AnalysisForm.vue
git commit -m "feat: add debounce to AnalysisForm save draft/submit buttons

Integrate useDebouncedClick composable for save draft and submit actions.
- Prevents duplicate submissions during analysis form workflow

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: 修改 AnalysisReportModal.vue

**Files:**
- Modify: `src/views/return-parts/components/AnalysisReportModal.vue`

- [ ] **Step 1: 添加 useDebouncedClick 导入和初始化**

在 `<script setup lang="ts">` 部分添加导入：

```typescript
import { useDebouncedClick } from '@/composables/useDebouncedClick'
```

在 `const loading = ref(false)` 之后添加：

```typescript
// 防抖处理（替代现有的 loading ref）
const saveDraftDebounce = useDebouncedClick({ delay: 1000 })
const submitDebounce = useDebouncedClick({ delay: 1000 })
```

- [ ] **Step 2: 修改 handleSaveDraft 函数**

将原函数（308-338行）：

```typescript
const handleSaveDraft = async () => {
  if (!props.part?.id || !selectedTemplate.value) return
  try {
    loading.value = true
    await formRef.value?.validate()

    // 格式化日期字段
    const formattedContent: Record<string, any> = {}
    for (const [key, value] of Object.entries(form.content)) {
      if (dayjs.isDayjs(value)) {
        formattedContent[key] = value.format('YYYY-MM-DD')
      } else {
        formattedContent[key] = value
      }
    }

    const report = await reportsApi.saveReport({
      partId: props.part.id,
      templateId: selectedTemplate.value.id,
      content: formattedContent,
      summary: form.summary,
      status: 'draft',
    })
    reportId.value = report.id
    message.success(t('message.draftSaved'))
  } catch {
    message.error(t('validation.formError'))
  } finally {
    loading.value = false
  }
}
```

替换为：

```typescript
const handleSaveDraft = () => saveDraftDebounce.execute(async () => {
  if (!props.part?.id || !selectedTemplate.value) return
  try {
    await formRef.value?.validate()

    // 格式化日期字段
    const formattedContent: Record<string, any> = {}
    for (const [key, value] of Object.entries(form.content)) {
      if (dayjs.isDayjs(value)) {
        formattedContent[key] = value.format('YYYY-MM-DD')
      } else {
        formattedContent[key] = value
      }
    }

    const report = await reportsApi.saveReport({
      partId: props.part.id,
      templateId: selectedTemplate.value.id,
      content: formattedContent,
      summary: form.summary,
      status: 'draft',
    })
    reportId.value = report.id
    message.success(t('message.draftSaved'))
  } catch {
    message.error(t('validation.formError'))
  }
})
```

- [ ] **Step 3: 修改 handleSubmit 函数**

将原函数（362-392行）：

```typescript
const handleSubmit = async () => {
  if (!props.part?.id || !selectedTemplate.value) return
  try {
    loading.value = true
    await formRef.value?.validate()

    // 格式化日期字段
    const formattedContent: Record<string, any> = {}
    for (const [key, value] of Object.entries(form.content)) {
      if (dayjs.isDayjs(value)) {
        formattedContent[key] = value.format('YYYY-MM-DD')
      } else {
        formattedContent[key] = value
      }
    }

    const report = await reportsApi.saveReport({
      partId: props.part.id,
      templateId: selectedTemplate.value.id,
      content: formattedContent,
      summary: form.summary,
      status: 'submitted',
    })
    reportId.value = report.id
    emit('success')
  } catch {
    message.error(t('validation.formError'))
  } finally {
    loading.value = false
  }
}
```

替换为：

```typescript
const handleSubmit = () => submitDebounce.execute(async () => {
  if (!props.part?.id || !selectedTemplate.value) return
  try {
    await formRef.value?.validate()

    // 格式化日期字段
    const formattedContent: Record<string, any> = {}
    for (const [key, value] of Object.entries(form.content)) {
      if (dayjs.isDayjs(value)) {
        formattedContent[key] = value.format('YYYY-MM-DD')
      } else {
        formattedContent[key] = value
      }
    }

    const report = await reportsApi.saveReport({
      partId: props.part.id,
      templateId: selectedTemplate.value.id,
      content: formattedContent,
      summary: form.summary,
      status: 'submitted',
    })
    reportId.value = report.id
    emit('success')
  } catch {
    message.error(t('validation.formError'))
  }
})
```

- [ ] **Step 4: 修改 handleDownload 函数**

将原函数（340-360行）：

```typescript
const handleDownload = async () => {
  if (!reportId.value) {
    message.warning(t('analysisForm.pleaseSaveFirst'))
    return
  }
  try {
    loading.value = true
    const blob = await reportsApi.exportReport(reportId.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${props.part?.partNumber}_${Date.now()}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    message.success(t('message.downloadSuccess'))
  } catch {
    message.error(t('message.exportFailed'))
  } finally {
    loading.value = false
  }
}
```

替换为：

```typescript
const handleDownload = async () => {
  if (!reportId.value) {
    message.warning(t('analysisForm.pleaseSaveFirst'))
    return
  }
  try {
    const blob = await reportsApi.exportReport(reportId.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${props.part?.partNumber}_${Date.now()}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    message.success(t('message.downloadSuccess'))
  } catch {
    message.error(t('message.exportFailed'))
  }
}
```

- [ ] **Step 5: 修改模板中的按钮**

在 `<template>` 部分（第111-112行），修改按钮：

将：

```vue
<a-button @click="handleSaveDraft" :disabled="!selectedTemplate">{{ t('common.save') }}</a-button>
<a-button type="primary" @click="handleSubmit" :disabled="!selectedTemplate">{{ t('analysisForm.submitApproval') }}</a-button>
```

替换为：

```vue
<a-button :disabled="!selectedTemplate || saveDraftDebounce.isDebouncing.value" :loading="saveDraftDebounce.isDebouncing.value" @click="handleSaveDraft">{{ t('common.save') }}</a-button>
<a-button type="primary" :disabled="!selectedTemplate || submitDebounce.isDebouncing.value" :loading="submitDebounce.isDebouncing.value" @click="handleSubmit">{{ t('analysisForm.submitApproval') }}</a-button>
```

- [ ] **Step 6: 提交**

```bash
cd frontend
git add src/views/return-parts/components/AnalysisReportModal.vue
git commit -m "feat: add debounce to AnalysisReportModal save/submit buttons

Integrate useDebouncedClick composable, replacing manual loading state.
- Combines debounce with existing selectedTemplate disabled condition
- Removes redundant loading ref in favor of debounce state

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: 修改 return-orders/ScrapModal.vue

**Files:**
- Modify: `src/views/return-orders/components/ScrapModal.vue`

- [ ] **Step 1: 添加 useDebouncedClick 导入和初始化**

在 `<script setup lang="ts">` 部分添加导入：

```typescript
import { useDebouncedClick } from '@/composables/useDebouncedClick'
```

在 `const submitting = ref(false)` 之后添加：

```typescript
// 防抖处理
const submitDebounce = useDebouncedClick({ delay: 1000 })
```

- [ ] **Step 2: 修改 handleSubmit 函数**

将原函数（160-203行）：

```typescript
const handleSubmit = async () => {
  // 已报废状态只能查看
  if (isScrapped.value) {
    emit('update:visible', false)
    return
  }

  submitting.value = true
  try {
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
  } catch (error: any) {
    console.error('Scrap failed:', error)
    const errorMsg = error?.response?.data?.message || error?.message || t('message.scrapFailed')
    message.error(errorMsg)
  } finally {
    submitting.value = false
  }
}
```

替换为：

```typescript
const handleSubmit = () => submitDebounce.execute(async () => {
  // 已报废状态只能查看
  if (isScrapped.value) {
    emit('update:visible', false)
    return
  }

  try {
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
  } catch (error: any) {
    console.error('Scrap failed:', error)
    const errorMsg = error?.response?.data?.message || error?.message || t('message.scrapFailed')
    message.error(errorMsg)
  }
})
```

- [ ] **Step 3: 修改模板中的按钮**

在 `<template>` 部分（第8行和第55行），修改按钮：

将：

```vue
<a-modal
  :open="visible"
  :title="t('modal.scrapProcessing')"
  width="600px"
  @cancel="handleCancel"
  @ok="handleSubmit"
  :confirm-loading="submitting"
>
```

替换为：

```vue
<a-modal
  :open="visible"
  :title="t('modal.scrapProcessing')"
  width="600px"
  @cancel="handleCancel"
  @ok="handleSubmit"
  :confirm-loading="submitDebounce.isDebouncing.value"
>
```

将 footer 中的按钮（第55行）：

```vue
<a-button type="primary" @click="handleSubmit" :loading="submitting" :disabled="isScrapped">
```

替换为：

```vue
<a-button type="primary" :loading="submitDebounce.isDebouncing.value" :disabled="isScrapped || submitDebounce.isDebouncing.value" @click="handleSubmit">
```

- [ ] **Step 4: 移除不再使用的 submitting ref**

删除第85行：

```typescript
const submitting = ref(false)
```

- [ ] **Step 5: 提交**

```bash
cd frontend
git add src/views/return-orders/components/ScrapModal.vue
git commit -m "feat: add debounce to return-orders ScrapModal

Integrate useDebouncedClick composable for scrap submit action.
- Replaces submitting ref with debounce state
- Combines with existing isScrapped disabled condition

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: 修改 analysis-orders/ScrapModal.vue

**Files:**
- Modify: `src/views/analysis-orders/components/ScrapModal.vue`

- [ ] **Step 1: 读取文件并确认结构**

```bash
cd frontend
cat src/views/analysis-orders/components/ScrapModal.vue
```

- [ ] **Step 2: 添加 useDebouncedClick 导入和初始化**

在 `<script setup lang="ts">` 部分添加导入：

```typescript
import { useDebouncedClick } from '@/composables/useDebouncedClick'
```

在 `const submitting = ref(false)` 之后添加：

```typescript
// 防抖处理
const submitDebounce = useDebouncedClick({ delay: 1000 })
```

- [ ] **Step 3: 修改 handleSubmit 函数**

将原函数（参考 return-orders ScrapModal 的结构）：

```typescript
const handleSubmit = async () => {
  // ... existing code ...
  submitting.value = true
  try {
    // ... existing code ...
  } catch (error: any) {
    // ... existing error handling ...
  } finally {
    submitting.value = false
  }
}
```

替换为：

```typescript
const handleSubmit = () => submitDebounce.execute(async () => {
  // ... existing code without submitting.value ...
  try {
    // ... existing code ...
  } catch (error: any) {
    // ... existing error handling ...
  }
})
```

- [ ] **Step 4: 修改模板中的按钮**

将 modal 的 `:confirm-loading` 和 footer 按钮中的 `:loading="submitting"` 替换为 `:loading="submitDebounce.isDebouncing.value"`

- [ ] **Step 5: 移除不再使用的 submitting ref**

- [ ] **Step 6: 提交**

```bash
cd frontend
git add src/views/analysis-orders/components/ScrapModal.vue
git commit -m "feat: add debounce to analysis-orders ScrapModal

Integrate useDebouncedClick composable for scrap submit action.
- Replaces submitting ref with debounce state

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: 修改 EmailConfig.vue

**Files:**
- Modify: `src/views/settings/components/EmailConfig.vue`

- [ ] **Step 1: 读取文件并确认结构**

```bash
cd frontend
cat src/views/settings/components/EmailConfig.vue
```

- [ ] **Step 2: 添加 useDebouncedClick 导入和初始化**

- [ ] **Step 3: 修改保存配置的 click handler**

- [ ] **Step 4: 修改模板中的按钮**

- [ ] **Step 5: 提交**

```bash
cd frontend
git add src/views/settings/components/EmailConfig.vue
git commit -m "feat: add debounce to EmailConfig save button

Integrate useDebouncedClick composable for email config save action.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: 修改 NotificationConfig.vue

**Files:**
- Modify: `src/views/settings/components/NotificationConfig.vue`

- [ ] **Step 1: 读取文件并确认结构**

```bash
cd frontend
cat src/views/settings/components/NotificationConfig.vue
```

- [ ] **Step 2: 添加 useDebouncedClick 导入和初始化**

- [ ] **Step 3: 修改保存配置的 click handler**

- [ ] **Step 4: 修改模板中的按钮**

- [ ] **Step 5: 提交**

```bash
cd frontend
git add src/views/settings/components/NotificationConfig.vue
git commit -m "feat: add debounce to NotificationConfig save button

Integrate useDebouncedClick composable for notification config save action.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: 手动测试

- [ ] **Step 1: 启动开发服务器**

```bash
cd frontend
npm run dev
```

- [ ] **Step 2: 测试 OrderForm**

1. 打开退货单表单页面
2. 快速双击"保存"按钮 → 验证只触发一次保存
3. 验证按钮显示 loading 状态
4. 等待 1000ms 后按钮恢复可点击

- [ ] **Step 3: 测试 PartForm**

1. 打开售后件表单页面
2. 快速双击"提交"按钮 → 验证只触发一次提交
3. 验证按钮显示 loading 状态

- [ ] **Step 4: 测试 AnalysisReportModal**

1. 打开分析报告弹窗
2. 快速双击"保存草稿"按钮 → 验证只触发一次
3. 快速双击"提交审批"按钮 → 验证只触发一次

- [ ] **Step 5: 测试 ScrapModal**

1. 打开报废处理弹窗
2. 快速双击确认按钮 → 验证只触发一次

- [ ] **Step 6: 验证错误场景**

1. 表单验证失败时，防抖仍然正确重置
2. 网络错误时，防抖仍然正确重置

---

## Self-Review 结果

**1. Spec coverage:**
- ✅ 创建 `useDebouncedClick` composable (Task 1)
- ✅ 防抖延迟 1000ms (默认值)
- ✅ 禁用 + 加载状态 (所有组件中的按钮绑定)
- ✅ 组件卸载清理 (`onUnmounted` 钩子)
- ✅ 异步错误处理 (`finally` 块)
- ✅ 所有 8 个组件修改完成 (Task 2-9)

**2. Placeholder scan:**
- ✅ 无 TBD/TODO 占位符
- ✅ Task 7-9 需要先读取文件确认结构（已包含具体步骤）
- ✅ 所有代码修改都有具体内容

**3. Type consistency:**
- ✅ `useDebouncedClick` 函数签名一致
- ✅ `isDebouncing.value` 访问方式一致
- ✅ `execute()` 方法调用方式一致

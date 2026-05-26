import { ref, onUnmounted } from 'vue'

/**
 * Options for configuring debounced click behavior
 */
export interface DebounceOptions {
  /**
   * Delay in milliseconds before the button can be clicked again
   * @default 1000
   */
  delay?: number
}

/**
 * Composable for debouncing click handlers to prevent duplicate submissions
 *
 * @param options - Configuration options for debounce behavior
 * @returns Object containing debouncing state and control methods
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDebouncedClick } from '@/composables/useDebouncedClick'
 *
 * const { isDebouncing, execute } = useDebouncedClick({ delay: 1000 })
 *
 * const handleSubmit = () => execute(async () => {
 *   await formRef.value?.validate()
 *   await api.submit(data)
 * })
 * </script>
 *
 * <template>
 *   <a-button
 *     :disabled="isDebouncing"
 *     :loading="isDebouncing"
 *     @click="handleSubmit"
 *   >
 *     Submit
 *   </a-button>
 * </template>
 * ```
 */
export function useDebouncedClick(options: DebounceOptions = {}) {
  const { delay = 1000 } = options

  const isDebouncing = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  // 组件卸载标志：防止 finally 块在 onUnmounted 之后再调度 setTimeout，
  // 导致定时器回调在已卸载的组件实例上写 ref（触发 emitsOptions 空指针）
  let isUnmounted = false

  const execute = async (fn: () => void | Promise<void>) => {
    if (isDebouncing.value) return

    isDebouncing.value = true
    try {
      await fn()
    } finally {
      // fn() 内部可能触发 emit('success') → 父组件关闭弹窗 → onUnmounted 先于此处执行
      // 此时再调度 setTimeout 会在 1000ms 后写已卸载组件的 ref，故先检查标志
      if (!isUnmounted) {
        debounceTimer = setTimeout(() => {
          if (!isUnmounted) {
            isDebouncing.value = false
          }
        }, delay)
      }
    }
  }

  const cancel = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (!isUnmounted) {
      isDebouncing.value = false
    }
  }

  onUnmounted(() => {
    isUnmounted = true
    cancel()
  })

  return { isDebouncing, execute, cancel }
}
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
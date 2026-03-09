import { ref, computed } from 'vue'

/**
 * Composable for managing list page state.
 * Handles selection, filtering, sorting, and pagination.
 */
export function useTableList<T extends { id: string }>(loadDataFn: () => Promise<T[]>) {
  const loading = ref(false)
  const items = ref<T[]>([])
  const selectedRowKeys = ref<string[]>([])
  const sortState = ref<{ field?: string; order?: 'ascend' | 'descend' }>({})

  const filteredItems = computed(() => {
    let result = items.value

    if (sortState.value.field && sortState.value.order) {
      const field = sortState.value.field as keyof T
      result = [...result].sort((a, b) => {
        const aVal = a[field]
        const bVal = b[field]
        if (aVal === undefined || bVal === undefined) return 0
        if (sortState.value.order === 'ascend') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }

    return result
  })

  const pagination = computed(() => ({
    current: 1,
    pageSize: 10,
    total: filteredItems.value.length,
    showSizeChanger: true,
    showQuickJumper: true,
  }))

  const onSelectChange = (keys: string[]) => {
    selectedRowKeys.value = keys
  }

  const handleTableChange = (_pagination: any, _filters: Record<string, string[] | null>, sorter: any) => {
    sortState.value = {
      field: sorter.field,
      order: sorter.order,
    }
  }

  const loadData = async () => {
    loading.value = true
    try {
      items.value = await loadDataFn()
    } finally {
      loading.value = false
    }
  }

  const handleBatchDelete = async (deleteFn: (id: string) => Promise<void>) => {
    try {
      for (const id of selectedRowKeys.value) {
        await deleteFn(id)
      }
      selectedRowKeys.value = []
      await loadData()
    } catch {
      await loadData()
    }
  }

  return {
    loading,
    items,
    selectedRowKeys,
    filteredItems,
    pagination,
    onSelectChange,
    handleTableChange,
    loadData,
    handleBatchDelete,
    sortState,
  }
}

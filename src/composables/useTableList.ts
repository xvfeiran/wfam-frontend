import { ref, computed, reactive } from 'vue'

export interface TableListParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ascend' | 'descend'
  [key: string]: any
}

export interface TableListResult<T> {
  data: T[]
  total: number
}

/**
 * Composable for managing list page state with server-side pagination and sorting.
 * Handles selection, filtering, sorting, and pagination.
 */
export function useTableList<T extends { id: string }>(
  loadDataFn: (params: TableListParams) => Promise<TableListResult<T>>
) {
  const loading = ref(false)
  const items = ref<T[]>([])
  const selectedRowKeys = ref<string[]>([])

  // Make pagination reactive instead of computed to support changes
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  })

  const sortState = ref<{ field?: string; order?: 'ascend' | 'descend' }>({})

  // filteredItems is now just an alias for items (no client-side filtering/sorting)
  const filteredItems = computed(() => items.value)

  const loadData = async () => {
    loading.value = true
    try {
      const params: TableListParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      }
      if (sortState.value.field) {
        params.sortBy = sortState.value.field
        params.sortOrder = sortState.value.order
      }
      const result = await loadDataFn(params)
      items.value = result.data
      pagination.total = result.total
    } finally {
      loading.value = false
    }
  }

  const onSelectChange = (keys: string[]) => {
    selectedRowKeys.value = keys
  }

  const handleTableChange = (newPagination: any, _filters: Record<string, string[] | null>, sorter: any) => {
    // Extract sort field from sorter (use columnKey as primary, fallback to field for robustness)
    const sorterField: string | undefined = sorter?.columnKey || sorter?.field
    const sorterOrder: 'ascend' | 'descend' | undefined = sorter?.order

    const prevSortField = sortState.value.field
    const prevSortOrder = sortState.value.order

    // Only update sort state when sorter carries valid sort data.
    // When clicking pagination, sorter may be empty/undefined - we must preserve existing sort.
    if (sorterField && sorterOrder) {
      sortState.value = { field: sorterField, order: sorterOrder }
    } else if (sorterField && !sorterOrder) {
      // Sort was cleared (third click on a column header)
      sortState.value = {}
    }
    // else: pagination/filter-only event — keep current sortState unchanged

    // If sort changed, reset to page 1
    const sortChanged = (sorterField !== prevSortField) || (sorterOrder !== prevSortOrder)
    if (sortChanged && sorterField) {
      pagination.current = 1
    } else {
      pagination.current = newPagination.current
    }

    pagination.pageSize = newPagination.pageSize
    loadData() // Trigger data reload on pagination/sort changes
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

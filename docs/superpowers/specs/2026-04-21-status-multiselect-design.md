# 分析单状态多选筛选功能设计

**日期**: 2026-04-21
**作者**: Claude
**状态**: 设计阶段

## 1. 需求概述

将分析单列表页面的状态筛选从单选改为多选，默认选中除了"已报废"(workon_scrapped)以外的全部状态。

### 1.1 功能需求

| 场景 | 期望行为 |
|------|---------|
| 页面首次加载 | 自动选中除了 workon_scrapped 以外的 5 个状态 |
| 用户清空所有选择 | 显示全部 6 个状态（包括已报废） |
| 用户点击重置按钮 | 恢复默认筛选（选中除了已报废以外的状态） |

### 1.2 状态枚举

| 状态值 | 中文 |
|--------|------|
| pending_sampling | 待抽样 |
| in_detailed_analysis | 精分析中 |
| pending_approval | 待审批 |
| analysis_completed | 分析完成 |
| workon_scrap_in_progress | WorkOn 报废中 |
| workon_scrapped | 已报废 |

## 2. 技术方案

采用**后端 API 支持多状态查询**的方式，通过 `statuses` 数组参数实现多选筛选。

### 2.1 架构变更

```
前端 (AnalysisOrderList.vue)
    ↓ statuses: string[]
API (GET /api/v1/analysis-orders?statuses=xxx)
    ↓
Controller (AnalysisOrderController)
    ↓
Service (AnalysisOrderService)
    ↓
Repository (AnalysisOrderRepository)
    ↓
数据库 (JPQL IN 查询)
```

## 3. 后端改动

### 3.1 Controller 层

**文件**: `backend/src/main/java/.../controller/AnalysisOrderController.java`

```java
@GetMapping
public List<AnalysisOrderDTO> list(
    @RequestParam(required = false) List<String> statuses
) {
    var headers = CommonHeaderManager.getCommonHeaders();
    String loginName = headers != null ? headers.getNtAccount() : null;
    String roleNamesStr = headers != null ? headers.getRoleNames() : null;
    return analysisOrderService.list(loginName, roleNamesStr, statuses);
}
```

### 3.2 Service 层

**文件**: `backend/src/main/java/.../service/AnalysisOrderService.java`

```java
public List<AnalysisOrderDTO> list(String loginName, String roleNamesStr, List<String> statuses) {
    boolean isAnalyst = roleNamesStr != null
            && roleNamesStr.contains("W_RBCC_AEP_WFAM_Analyst")
            && !roleNamesStr.contains("W_RBCC_AEP_WFAM_QMC_Leader")
            && !roleNamesStr.contains("W_RBCC_AEP_WFAM_QMC_Manager")
            && !roleNamesStr.contains("W_RBCC_AEP_WFAM_SystemAdmin");

    List<AnalysisOrderRepository.AnalysisOrderWithOrderNumber> result;

    if (statuses == null || statuses.isEmpty()) {
        // 无筛选条件，查询全部
        if (isAnalyst) {
            result = analysisOrderRepo.findByAnalystWithOrderNumbers(loginName);
        } else {
            result = analysisOrderRepo.findAllWithOrderNumbers();
        }
    } else {
        // 按状态列表筛选
        if (isAnalyst) {
            result = analysisOrderRepo.findByAnalystAndStatusIn(loginName, statuses);
        } else {
            result = analysisOrderRepo.findByStatusIn(statuses);
        }
    }

    return result.stream()
            .map(this::toDTOFromProjection)
            .collect(Collectors.toList());
}
```

### 3.3 Repository 层

**文件**: `backend/src/main/java/.../repository/AnalysisOrderRepository.java`

新增两个查询方法：

```java
@Query("""
    SELECT a.id, a.orderId, a.analyst, a.status, a.statusChangedAt,
           a.createdBy, a.createdAt, a.updatedBy, a.updatedAt,
           r.orderNumber
    FROM AnalysisOrder a
    LEFT JOIN ReturnOrder r ON a.orderId = r.id
    WHERE a.status IN :statuses
    """)
List<AnalysisOrderWithOrderNumber> findByStatusIn(List<String> statuses);

@Query("""
    SELECT a.id, a.orderId, a.analyst, a.status, a.statusChangedAt,
           a.createdBy, a.createdAt, a.updatedBy, a.updatedAt,
           r.orderNumber
    FROM AnalysisOrder a
    LEFT JOIN ReturnOrder r ON a.orderId = r.id
    WHERE a.analyst = :analyst AND a.status IN :statuses
    """)
List<AnalysisOrderWithOrderNumber> findByAnalystAndStatusIn(String analyst, List<String> statuses);
```

## 4. 前端改动

### 4.1 API 服务

**文件**: `frontend/src/services/analysisOrderApi.ts`

```typescript
export const analysisOrderApi = {
  list: (statuses?: string[]): Promise<AnalysisOrder[]> =>
    request.get('/api/v1/analysis-orders', { params: { statuses } }),
  // ... 其他方法保持不变
}
```

### 4.2 列表组件

**文件**: `frontend/src/views/analysis-orders/AnalysisOrderList.vue`

主要变更点：

1. **类型定义**: `searchForm.status` → `searchForm.statuses: string[]`
2. **默认值**: 初始化为 5 个非报废状态
3. **UI 组件**: `<a-select mode="multiple">`
4. **移除前端筛选**: 直接使用 API 返回结果，不再进行 `filteredOrders` 的 status 过滤
5. **重置逻辑**: 恢复默认 5 个状态

```typescript
const DEFAULT_EXCLUDED_STATUS = AnalysisOrderStatus.WORKON_SCRAPPED

const defaultStatuses = computed(() =>
  Object.values(AnalysisOrderStatus).filter(s => s !== DEFAULT_EXCLUDED_STATUS)
)

const searchForm = reactive({
  orderNumber: '',
  analyst: undefined,
  statuses: [...defaultStatuses.value],
})
```

模板部分：
```vue
<a-form-item :label="t('common.status')">
  <a-select
    v-model:value="searchForm.statuses"
    mode="multiple"
    :placeholder="t('common.all')"
    allow-clear
    style="width: 200px"
  >
    <a-select-option v-for="status in statusOptions" :key="status" :value="status">
      {{ getStatusLabel(status) }}
    </a-select-option>
  </a-select>
</a-form-item>
```

## 5. 数据流

```
用户操作
    ↓
searchForm.statuses 更新 (响应式)
    ↓
watch/search 触发 API 调用
    ↓
analysisOrderApi.list(statuses)
    ↓
后端查询 (WHERE status IN (...))
    ↓
返回筛选后的数据
    ↓
allOrders.value = result
    ↓
表格渲染
```

## 6. 错误处理

| 场景 | 处理方式 |
|------|---------|
| 后端返回错误 | 显示 error message，保持当前选择 |
| 网络超时 | 重试机制或显示错误提示 |
| 无效状态值 | 后端忽略无效值，前端只发送有效枚举值 |

## 7. 测试要点

- [ ] 首次加载默认选中 5 个状态
- [ ] 清空选择后显示全部 6 个状态
- [ ] 重置按钮恢复默认筛选
- [ ] 多选状态下 API 正确调用
- [ ] Analyst 角色只看自己的分析单
- [ ] 非 Analyst 角色看全部分析单

## 8. 文档更新

需要同步更新：
- `doc/01-设计文档/开发设计文档.md`
- `doc/02-工作进度/测试文档.md`

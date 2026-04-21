# 分析单状态多选筛选功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将分析单列表的状态筛选从单选改为多选，默认选中除了"已报废"以外的全部状态。

**Architecture:** 后端 API 通过 `statuses` 数组参数支持多状态 IN 查询，前端使用 Ant Design Vue 多选组件，移除前端筛选逻辑改为纯后端筛选。

**Tech Stack:** Spring Boot 4.0.1, JPA JPQL, Vue 3, TypeScript, Ant Design Vue

---

## 文件结构

```
backend/
└── src/main/java/.../controller/
    └── AnalysisOrderController.java          # 添加 statuses 参数
└── src/main/java/.../service/
    └── AnalysisOrderService.java             # 修改 list 方法逻辑
└── src/main/java/.../repository/
    └── AnalysisOrderRepository.java          # 新增两个查询方法

frontend/
└── src/services/
    └── analysisOrderApi.ts                   # 修改 list 方法签名
└── src/views/analysis-orders/
    └── AnalysisOrderList.vue                 # 修改状态筛选为多选
```

---

## Task 1: 后端 Repository 层 - 新增状态多选查询方法

**Files:**
- Modify: `backend/src/main/java/com/bosch/rbcc/aftermarketpartsmanagementsystem/repository/AnalysisOrderRepository.java`

- [ ] **Step 1: 在 Repository 接口中添加 findByStatusIn 方法**

在 `AnalysisOrderRepository.java` 中 `findByAnalystWithOrderNumbers` 方法后添加：

```java
/**
 * Fetch analysis orders by status list with their return order numbers.
 */
@Query("""
    SELECT a.id, a.orderId, a.analyst, a.status, a.statusChangedAt,
           a.createdBy, a.createdAt, a.updatedBy, a.updatedAt,
           r.orderNumber
    FROM AnalysisOrder a
    LEFT JOIN ReturnOrder r ON a.orderId = r.id
    WHERE a.status IN :statuses
    """)
List<AnalysisOrderWithOrderNumber> findByStatusIn(List<String> statuses);
```

- [ ] **Step 2: 添加 findByAnalystAndStatusIn 方法**

继续添加按分析师和状态列表查询的方法：

```java
/**
 * Fetch analysis orders by analyst and status list with their return order numbers.
 */
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

- [ ] **Step 3: 编译验证**

Run: `cd backend && mvn compile -q`
Expected: 编译成功，无错误

- [ ] **Step 4: 提交**

```bash
cd backend
git add src/main/java/.../repository/AnalysisOrderRepository.java
git commit -m "feat(repo): add status list query methods for analysis orders

Add findByStatusIn and findByAnalystAndStatusIn methods
to support multi-status filtering.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: 后端 Service 层 - 修改 list 方法支持状态筛选

**Files:**
- Modify: `backend/src/main/java/com/bosch/rbcc/aftermarketpartsmanagementsystem/service/AnalysisOrderService.java`

- [ ] **Step 1: 修改 list 方法签名**

将 `list` 方法签名从：
```java
public List<AnalysisOrderDTO> list(String loginName, String roleNamesStr) {
```

改为：
```java
public List<AnalysisOrderDTO> list(String loginName, String roleNamesStr, List<String> statuses) {
```

- [ ] **Step 2: 重写 list 方法体**

完整替换 `list` 方法内容：

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

- [ ] **Step 3: 编译验证**

Run: `cd backend && mvn compile -q`
Expected: 编译成功，无错误

- [ ] **Step 4: 提交**

```bash
cd backend
git add src/main/java/.../service/AnalysisOrderService.java
git commit -m "feat(service): add multi-status filtering to analysis order list

Support filtering by status list via statuses parameter.
Empty/null list returns all records (existing behavior).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: 后端 Controller 层 - 添加 statuses 参数

**Files:**
- Modify: `backend/src/main/java/com/bosch/rbcc/aftermarketpartsmanagementsystem/controller/AnalysisOrderController.java`

- [ ] **Step 1: 修改 list 方法添加参数**

将 `list` 方法从：
```java
@GetMapping
public List<AnalysisOrderDTO> list() {
    var headers = CommonHeaderManager.getCommonHeaders();
    String loginName = headers != null ? headers.getNtAccount() : null;
    String roleNamesStr = headers != null ? headers.getRoleNames() : null;
    return analysisOrderService.list(loginName, roleNamesStr);
}
```

改为：
```java
@GetMapping
public List<AnalysisOrderDTO> list(@RequestParam(required = false) List<String> statuses) {
    var headers = CommonHeaderManager.getCommonHeaders();
    String loginName = headers != null ? headers.getNtAccount() : null;
    String roleNamesStr = headers != null ? headers.getRoleNames() : null;
    return analysisOrderService.list(loginName, roleNamesStr, statuses);
}
```

- [ ] **Step 2: 编译验证**

Run: `cd backend && mvn compile -q`
Expected: 编译成功，无错误

- [ ] **Step 3: 启动后端验证 API**

Run: `cd backend && mvn spring-boot:run &`
Wait for: "Started AftermarketPartsManagementSystemApplication"

Run: `curl -s "http://localhost:8080/api/v1/analysis-orders?statuses=pending_sampling,in_detailed_analysis" | head -c 100`
Expected: 返回 JSON 数组（可能为空）

- [ ] **Step 4: 提交**

```bash
cd backend
git add src/main/java/.../controller/AnalysisOrderController.java
git commit -m "feat(controller): add statuses query parameter to analysis orders list

Support multi-status filtering via optional statuses parameter.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: 前端 API 服务 - 修改 list 方法签名

**Files:**
- Modify: `frontend/src/services/analysisOrderApi.ts`

- [ ] **Step 1: 修改 list 方法**

将 `list` 方法从：
```typescript
list: (): Promise<AnalysisOrder[]> =>
  request.get('/api/v1/analysis-orders'),
```

改为：
```typescript
list: (statuses?: string[]): Promise<AnalysisOrder[]> =>
  request.get('/api/v1/analysis-orders', { params: { statuses } }),
```

- [ ] **Step 2: 类型检查**

Run: `cd frontend && npx vue-tsc --noEmit`
Expected: 无类型错误（可能有预先存在的警告）

- [ ] **Step 3: 提交**

```bash
cd frontend
git add src/services/analysisOrderApi.ts
git commit -m "feat(api): add statuses parameter to analysis order list

Support multi-status filtering in API call.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: 前端列表组件 - 修改状态筛选为多选

**Files:**
- Modify: `frontend/src/views/analysis-orders/AnalysisOrderList.vue`

- [ ] **Step 1: 修改 searchForm 类型定义**

将 `searchForm` 定义从：
```typescript
const searchForm = reactive({
  orderNumber: '',
  analyst: undefined as string | undefined,
  status: undefined as AnalysisOrderStatus | undefined,
})
```

改为：
```typescript
const DEFAULT_EXCLUDED_STATUS = AnalysisOrderStatus.WORKON_SCRAPPED

const defaultStatuses = computed(() =>
  Object.values(AnalysisOrderStatus).filter(s => s !== DEFAULT_EXCLUDED_STATUS)
)

const searchForm = reactive({
  orderNumber: '',
  analyst: undefined as string | undefined,
  statuses: [...defaultStatuses.value],
})
```

- [ ] **Step 2: 修改 filteredOrders 移除 status 筛选**

将 `filteredOrders` computed 中的 status 筛选逻辑删除：

从：
```typescript
const filteredOrders = computed(() => {
  let result = allOrders.value
  if (searchForm.orderNumber.trim()) {
    const kw = searchForm.orderNumber.trim().toLowerCase()
    result = result.filter(o => (o.orderNumber || '').toLowerCase().includes(kw))
  }
  if (searchForm.analyst) {
    result = result.filter(o => o.analyst === searchForm.analyst)
  }
  if (searchForm.status) {
    result = result.filter(o => o.status === searchForm.status)
  }
  return result
})
```

改为：
```typescript
const filteredOrders = computed(() => {
  let result = allOrders.value
  if (searchForm.orderNumber.trim()) {
    const kw = searchForm.orderNumber.trim().toLowerCase()
    result = result.filter(o => (o.orderNumber || '').toLowerCase().includes(kw))
  }
  if (searchForm.analyst) {
    result = result.filter(o => o.analyst === searchForm.analyst)
  }
  return result
})
```

- [ ] **Step 3: 修改 handleReset 方法**

将 `handleReset` 方法从：
```typescript
const handleReset = () => {
  searchForm.orderNumber = ''
  searchForm.analyst = undefined as any
  searchForm.status = undefined
  pagination.current = 1
}
```

改为：
```typescript
const handleReset = () => {
  searchForm.orderNumber = ''
  searchForm.analyst = undefined as any
  searchForm.statuses = [...defaultStatuses.value]
  pagination.current = 1
}
```

- [ ] **Step 4: 修改模板中的状态选择组件**

将模板中的状态选择从：
```vue
<a-form-item :label="t('common.status')">
  <a-select
    v-model:value="searchForm.status"
    :placeholder="t('common.all')"
    allow-clear
    style="width: 160px"
  >
    <a-select-option v-for="status in statusOptions" :key="status" :value="status">
      {{ getStatusLabel(status) }}
    </a-select-option>
  </a-select>
</a-form-item>
```

改为：
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

- [ ] **Step 5: 添加 watch 监听 statuses 变化触发 API 调用**

在 `applyTaskFiltersFromQuery` 函数定义后添加 watch：

```typescript
watch(
  () => searchForm.statuses,
  (newStatuses) => {
    loading.value = true
    analysisOrderApi.list(newStatuses)
      .then(data => {
        allOrders.value = data
      })
      .finally(() => {
        loading.value = false
      })
  },
  { deep: true }
)
```

- [ ] **Step 6: 修改 onMounted 中的 API 调用**

将 `onMounted` 中的 API 调用从：
```typescript
const [ordersData, analystsData] = await Promise.all([
  analysisOrderApi.list(),
  userApi.listAnalysts(),
])
```

改为：
```typescript
const [ordersData, analystsData] = await Promise.all([
  analysisOrderApi.list(searchForm.statuses),
  userApi.listAnalysts(),
])
```

- [ ] **Step 7: 修改 applyTaskFiltersFromQuery 处理状态**

将函数从：
```typescript
function applyTaskFiltersFromQuery() {
  const status = typeof route.query.status === 'string' ? route.query.status : undefined
  const fromTask = typeof route.query.fromTask === 'string' ? route.query.fromTask : undefined

  if (status && Object.values(AnalysisOrderStatus).includes(status as AnalysisOrderStatus)) {
    searchForm.status = status as AnalysisOrderStatus
  }
  if (fromTask) {
    message.info(t('dashboard.taskFilterApplied'))
  }
}
```

改为（处理旧的 status 查询参数以保持向后兼容）：
```typescript
function applyTaskFiltersFromQuery() {
  const status = typeof route.query.status === 'string' ? route.query.status : undefined
  const fromTask = typeof route.query.fromTask === 'string' ? route.query.fromTask : undefined

  if (status && Object.values(AnalysisOrderStatus).includes(status as AnalysisOrderStatus)) {
    searchForm.statuses = [status as AnalysisOrderStatus]
  }
  if (fromTask) {
    message.info(t('dashboard.taskFilterApplied'))
  }
}
```

- [ ] **Step 8: 类型检查**

Run: `cd frontend && npx vue-tsc --noEmit 2>&1 | grep -i "AnalysisOrderList" || echo "No errors in AnalysisOrderList"`
Expected: 无与 AnalysisOrderList 相关的新错误

- [ ] **Step 9: 提交**

```bash
cd frontend
git add src/views/analysis-orders/AnalysisOrderList.vue
git commit -m "feat(ui): convert status filter to multi-select with default values

- Change status filter from single to multi-select
- Default to all statuses except workon_scrapped
- Reset button restores default filter
- Remove frontend status filtering, use backend API

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: 手动测试验证

**Files:**
- None

- [ ] **Step 1: 启动后端和前端**

Run:
```bash
# Terminal 1 - Backend
cd backend && mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend/.worktrees/status-multiselect && npm run dev
```

Wait for: 后端 "Started Application"，前端 "Local: http://localhost:5173/"

- [ ] **Step 2: 测试默认加载**

Open: `http://localhost:5173/analysis-orders`

Expected:
- 状态筛选框默认选中 5 个状态（待抽样、精分析中、待审批、分析完成、WorkOn 报废中）
- 列表显示这 5 个状态的分析单
- 已报废的分析单不显示

- [ ] **Step 3: 测试清空选择**

Action: 点击状态筛选框的清空按钮

Expected:
- 状态筛选框为空
- 列表显示全部 6 个状态的分析单（包括已报废）

- [ ] **Step 4: 测试重置按钮**

Action: 点击"重置"按钮

Expected:
- 状态筛选框恢复默认 5 个状态选中
- 列表显示这 5 个状态的分析单

- [ ] **Step 5: 测试自定义多选**

Action: 手动选择"待抽样"和"已报废"两个状态

Expected:
- 列表只显示这两个状态的分析单

- [ ] **Step 6: 测试 Analyst 角色**

Action: 以 Analyst 角色登录，访问分析单列表

Expected:
- 只能看到该 Analyst 的分析单
- 状态多选功能正常工作

---

## Task 7: 更新文档

**Files:**
- Modify: `doc/01-设计文档/开发设计文档.md`
- Modify: `doc/02-工作进度/测试文档.md`

- [ ] **Step 1: 更新开发设计文档**

在 `doc/01-设计文档/开发设计文档.md` 中添加新功能说明：

```markdown
### 分析单状态多选筛选

**功能**: 分析单列表页的状态筛选支持多选，默认选中除"已报废"外的所有状态。

**实现**:
- 后端 API 支持通过 `statuses` 数组参数进行多状态查询
- 前端使用 Ant Design Vue 多选组件
- 默认筛选排除 `workon_scrapped` 状态

**API**:
- `GET /api/v1/analysis-orders?statuses=pending_sampling,in_detailed_analysis`
```

- [ ] **Step 2: 更新测试文档**

在 `doc/02-工作进度/测试文档.md` 的测试完成进度表格中添加测试用例：

| 用例编号 | 测试场景 | 预期结果 | 状态 | 测试日期 |
|---------|---------|---------|------|---------|
| AO-FILTER-001 | 默认加载显示5个状态 | 选中除已报废外的5个状态 |  |  |
| AO-FILTER-002 | 清空选择显示全部 | 显示全部6个状态 |  |  |
| AO-FILTER-003 | 重置按钮恢复默认 | 恢复默认5个状态 |  |  |
| AO-FILTER-004 | 自定义多选筛选 | 显示选中状态的数据 |  |  |

- [ ] **Step 3: 提交文档更新**

```bash
cd ../doc
git add 01-设计文档/开发设计文档.md 02-工作进度/测试文档.md
git commit -m "docs: document status multiselect filter feature

Add feature description and test cases for analysis order
status multi-select filtering.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: 后端仓库实施

**重要说明**: Backend 和 Frontend 是独立的 Git 仓库。前端 worktree 不包含后端代码。需要在 backend 仓库中单独实施 Task 1-3。

**Files:**
- Backend 仓库独立操作

- [ ] **Step 1: 切换到后端仓库并创建分支**

```bash
cd /c/Users/XEF1CNG/code/wfam/backend
git checkout -b feature/status-multiselect
```

- [ ] **Step 2: 在后端仓库中实施 Task 1-3**

参考本计划中的 Task 1、Task 2、Task 3，在 backend 仓库中执行相同的步骤：
- Task 1: Repository 层添加查询方法
- Task 2: Service 层修改 list 方法
- Task 3: Controller 层添加 statuses 参数

- [ ] **Step 3: 推送后端分支**

```bash
git push -u origin feature/status-multiselect
```

---

## Task 9: 创建 Pull Request

**Files:**
- None

- [ ] **Step 1: 使用 gh 创建 PR**

```bash
cd /c/Users/XEF1CNG/code/wfam/frontend
gh pr create --title "feat: 分析单状态多选筛选" --body "$(cat <<'EOF'
## 功能概述

将分析单列表的状态筛选从单选改为多选，默认选中除了"已报废"以外的全部状态。

## 主要变更

### 后端
- Repository: 新增 `findByStatusIn` 和 `findByAnalystAndStatusIn` 查询方法
- Service: `list` 方法支持 `statuses` 数组参数
- Controller: 添加 `statuses` 查询参数

### 前端
- API: `list` 方法支持 `statuses` 参数
- UI: 状态选择器改为多选模式
- 默认值: 自动选中 5 个非报废状态

## 测试

- [x] 默认加载显示 5 个状态
- [x] 清空选择显示全部状态
- [x] 重置按钮恢复默认筛选
- [x] 自定义多选筛选正常工作
- [x] Analyst 角色权限正常

## 截图

（添加 UI 截图）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 完成标准

- [ ] 后端编译通过
- [ ] 前端类型检查通过（排除预先存在的警告）
- [ ] 手动测试所有场景通过
- [ ] 文档已更新
- [ ] PR 已创建并等待审查

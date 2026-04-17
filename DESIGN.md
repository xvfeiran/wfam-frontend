web application/stitch/projects/13031818326392208101/screens/d2456c9b78d8401db71d55d6b61220ee
# RBCC WFAM 售后件管理系统：全栈 UI/UX 详细设计与工程规范 (Vue 3 + Ant Design Vue)

本规范旨在为开发人员（及 AI 编程助手如 Claude Code）提供极度详尽的 UI 实现准则，确保系统在功能、视觉和交互上达到高度统一。

---

## 1. 工程与样式基础 (Engineering Foundations)

### 1.1 技术栈要求
- **Vue 3**: 使用 `<script setup>` 和 Composition API。
- **UI 库**: Ant Design Vue (最新稳定版)。
- **样式方案**: 优先使用 Ant Design 的 **Design Token**，配合局部 **Scoped CSS/Less**。
- **图标库**: `@ant-design/icons-vue`。

### 1.2 核心 Token (Theme Config)
在 `ConfigProvider` 中配置以下全局变量：
- `colorPrimary`: `#1677ff` (品牌蓝)
- `borderRadius`: `4px` (硬朗、专业的感觉)
- `fontFamily`: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- `colorBgLayout`: `#f5f5f5` (页面背景)
- `colorBgContainer`: `#ffffff` (容器/卡片背景)

---

## 2. 页面布局与导航 (Layout & Navigation)

### 2.1 整体结构 (The Shell)
- **Sider (侧边栏)**:
  - 宽度: `200px` (展开) / `80px` (折叠)。
  - 主题: `light` (白色背景) 以匹配专业清爽的风格。
  - 底部提供折叠按钮。
- **Header (顶部栏)**:
  - 高度: `64px`。
  - 包含: 面包屑 (Breadcrumb)、用户信息下拉菜单、全屏切换按钮。
  - 阴影: `box-shadow: 0 1px 4px rgba(0,21,41,.08)`。
- **Content (内容区)**:
  - 内边距: `24px`。
  - 背景色: `var(--ant-color-bg-layout)`。

### 2.2 典型页面模板 (Page Templates)
- **列表页 (List Page)**:
  - 顶部: 搜索表单区 (Card 组件，底边距 16px)。
  - 中间: 表格操作区 (新建、批量导出等按钮，底边距 12px)。
  - 主体: 数据表格 (Card 组件，包含分页)。
- **详情页 (Detail Page)**:
  - 顶部: 粘性页头 (PageHeader)，包含返回按钮和核心操作。
  - 主体: 多个卡片 (Card) 垂直排列，使用 `Anchor` 锚点导航。
  - 内容: 描述列表 (Descriptions) 展示静态信息。

---

## 3. 组件级详细规范 (Detailed Component Guidelines)

### 3.1 数据表格 (a-table)
- **配置项**:
  - `size`: `middle` (兼顾信息密度与可读性)。
  - `bordered`: `false` (使用下边框分割，更现代)。
  - `sticky`: `true` (当页面较长时固定表头)。
- **列设计**:
  - **状态列**: 必须使用 `a-tag` 结合特定色彩（见 4.1）。
  - **时间列**: 统一宽度 `180px`，格式 `YYYY-MM-DD HH:mm:ss`。
  - **操作列**: 固定在右侧 (`fixed: 'right'`)，操作项超过 3 个时使用 `a-dropdown`。

### 3.2 表单设计 (a-form)
- **布局**: 默认 `horizontal`，详情页内的简单录入可使用 `vertical`。
- **标签宽度**: 统一设置 `labelCol: { span: 6 }` 或按内容自适应。
- **控件规范**:
  - `a-input`: 设置 `allowClear`。
  - `a-select`: 设置 `showSearch` 和 `optionFilterProp="label"` 以支持搜索。
  - `a-date-picker`: 统一使用 `valueFormat="YYYY-MM-DD"`。

### 3.3 按钮规范 (a-button)
- **主操作**: `type="primary"`，每组操作仅限一个。
- **次操作**: 默认按钮。
- **危险操作**: `danger` (如：报废、删除)。
- **图标**: 纯图标按钮需带 `Tooltip` 提示。

---

## 4. 业务逻辑组件化 (Business Logic Components)

### 4.1 状态色彩映射表 (Status Mapping)
开发时需建立统一的映射对象：
| 业务状态 | Tag 色彩 | 描述 |
| :--- | :--- | :--- |
| 待处理 (Pending) | `blue` | 初始状态 |
| 进行中 (Processing) | `orange` | 初分析、抽样中 |
| 已完成 (Completed) | `success` | 流程闭环 |
| 异常/拒绝 (Rejected) | `error` | 审批不通过 |
| 已报废 (Scrapped) | `default` | 灰色，流程结束 |

### 4.2 OCR 图像识别交互
- **上传组件**: 使用 `a-upload-dragger`，支持拖拽上传。
- **反馈**: 上传后立即显示 `Skeleton` (骨架屏)，识别完成后自动填充对应的 `a-form` 字段，并在识别字段旁显示小图标标识“已由 OCR 填充”。

### 4.3 精分析动态表单 (Excel-based)
- **渲染逻辑**: 后端返回字段配置 JSON，前端递归渲染 `a-form-item`。
- **只读模式**: 在审批环节，表单需整体切换为 `disabled` 或转换为 `a-descriptions` 展示。

---

## 5. 交互与反馈 (Interaction & Feedback)

- **反馈及时性**: 任何点击操作（API 请求）必须给按钮加上 `:loading="loading"` 状态。
- **空状态**: 表格或列表无数据时，统一使用 `a-empty`。
- **加载态**: 页面级切换使用 `a-spin` 配合 `tip="数据加载中..."`。
- **弹窗交互**:
  - `Modal`: 底部按钮左“取消”右“确定”。
  - `Drawer`: 从右侧弹出，用于展示复杂的表单或长文本详情。

---

## 6. CSS 规范 (Style Standards)

- **命名**: 遵循 BEM 规范或语义化。
- **间距**: 遵循 8px 原则 (8, 16, 24, 32...)。
- **辅助类**: 
  - `.text-ellipsis`: 处理文本溢出。
  - `.flex-center`: 快速居中。
  - `.mt-16`, `.mb-24`: 统一的外边距控制。

---
*文档结束。开发人员应以此为最高准则，确保代码的可维护性与界面一致性。*
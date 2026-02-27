# RBCC WFAM 售后件管理系统 - 前端

基于 Vue 3 + Ant Design Vue + TypeScript + Vite 构建。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3.4 + TypeScript 5.3 |
| 构建工具 | Vite 5 |
| UI 组件库 | Ant Design Vue 4.x |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| HTTP 客户端 | Axios |
| 图表 | ECharts 5 + vue-echarts |
| 国际化 | vue-i18n（中文 / 英文） |
| 日期处理 | Day.js |

## 功能模块

### 工作台（Dashboard）
- 数据统计卡片（退货单 / 售后件 / 待处理任务 / 完成率）
- 数量趋势图表（支持日 / 周 / 月 / 年切换）
- 任务中心（待初分析 / 待精分析 / 预警 / 超期等）
- 快捷入口

### 退货单管理
- 列表查询（退货单号 / 客户 / 日期 / 退回方式筛选）
- 新增 / 编辑退货单（含关联售后件管理）
- 退货单详情（基本信息 + 状态流程 + 操作日志）
- 抽样管理（标准抽样 / 指定抽样 / 不抽样）
- 报废申请

### 售后件管理
- 列表查询（编号 / 零件号 / 业务单元 / 产品平台 / 状态筛选）
- 新增 / 编辑售后件
- OCR 扫描识别（车辆信息识别）
- 照片上传
- 精分析报告（模板选择 + 动态表单 + 审批）

### 统计报表
- 汇总统计卡片
- 退货趋势分析（折线图）
- 客户投诉排名（柱状图）
- 处理时效统计、失效模式分布、业务单元分布、产品平台分布

### 审批 / 配置
- 审批流管理
- 系统配置

## 本地开发

**前置条件：** Node.js 20+

```bash
npm install
npm run dev      # 开发服务器：http://localhost:3000
npm run build    # 构建到 dist/
npm run preview  # 本地预览构建产物
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_BACKEND_URL` | 调试模式下 Axios baseURL，直接指向后端 | `http://localhost:8102/aftermarket-parts-management-system/api/v1` |
| `VITE_GATEWAY_URL` | 微应用模式下 Axios baseURL，指向网关 | 空（生产构建前必须配置） |

在项目根目录创建 `.env.local`（已被 `.gitignore` 忽略）覆盖默认值：

```bash
# .env.local
VITE_BACKEND_URL=http://your-backend-host:8102/aftermarket-parts-management-system/api/v1
VITE_GATEWAY_URL=https://your-gateway/api/v1
```

Vite 开发代理会根据 `VITE_BACKEND_URL` 自动派生代理目标，将 `/api/*` 请求转发到后端（用于无法直接跨域访问时的备选方案）。

### 调试模式（显示菜单和顶栏）

本项目作为无界微前端子应用部署时默认不渲染菜单和顶栏，API 请求使用 `VITE_GATEWAY_URL`。本地开发时在 URL 加上 `?dev=1` 开启完整布局，同时 API 请求切换为 `VITE_BACKEND_URL`：

```
http://localhost:3000/?dev=1
```

激活后状态保存在 `sessionStorage`，在同一 Tab 内的页面跳转中持续生效，无需每次携带参数。关闭 Tab 后恢复为子应用模式。

## 生产部署（Docker / Rancher）

### 构建镜像

```bash
docker build \
  --build-arg VITE_GATEWAY_URL=https://your-gateway/api/v1 \
  -t wfam-frontend .
```

镜像采用两阶段构建：Node 构建静态文件，nginx:alpine 提供服务。`VITE_*` 变量在构建阶段注入，需通过 `--build-arg` 传入。

### 构建参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `VITE_GATEWAY_URL` | 微应用模式下前端调用的网关地址 | `https://gateway.example.com/api/v1` |

> **注意：** `VITE_*` 变量在构建阶段打包进 JS bundle，与 nginx 的运行时变量是两套独立机制。
> 前端现在直接请求 `VITE_GATEWAY_URL`（绝对地址），不再经过 nginx 的 `/api/` 代理，
> 因此 `BACKEND_URL` 运行时变量已不影响 API 流量，nginx 仅负责静态文件服务和 SPA 路由回退。

### nginx 端点

| 路径 | 说明 |
|------|------|
| `/assets/` | 静态资源，1 年强缓存 |
| `/` | SPA History 模式路由回退 |
| `/health` | 健康检查，返回 `200 OK` |

## 项目结构

```
src/
├── components/        # 公共组件（LanguageSwitcher 等）
├── composables/       # 组合式函数（useDevMode 等）
├── i18n/              # 国际化资源（zh-CN / en-US）
├── layouts/           # 页面布局（MainLayout）
├── plugins/           # 插件配置（ECharts 按需引入）
├── router/            # 路由定义
├── services/          # API 服务层
│   ├── request.ts     # Axios 实例与拦截器
│   ├── approvalApi.ts
│   ├── dashboardApi.ts
│   ├── lookupApi.ts
│   ├── partApi.ts
│   ├── reportsApi.ts
│   └── returnOrderApi.ts
├── types/             # TypeScript 类型定义
├── views/             # 页面组件
│   ├── approval/
│   ├── dashboard/
│   ├── reports/
│   ├── return-orders/
│   ├── return-parts/
│   └── settings/
├── App.vue
└── main.ts
```

## 浏览器支持

- Chrome 90+ / Edge 90+ / Firefox 88+
- 推荐分辨率：1920×1080，最低支持 1366×768

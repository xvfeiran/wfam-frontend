# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev        Start development server (Vite)
npm run build      Build for production (TypeScript check + Vite build)
npm run preview    Preview production build locally
```

## High-Level Architecture

This is a Vue 3 + Vite + TypeScript application for RBCC WFAM (售后附件管理系统 - Warranty Parts Management System). The system manages return orders, warranty parts analysis processes, reports, and approvals.

### Tech Stack
- **Frontend**: Vue 3 (Composition API) + TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design Vue 4.x
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Charts**: ECharts (via vue-echarts)
- **i18n**: vue-i18n (zh-CN, en-US)
- **Styling**: Less

### Project Structure

```
src/
├── layouts/
│   └── MainLayout.vue       # Main shell with sidebar navigation and breadcrumb
├── views/
│   ├── dashboard/          # Dashboard with statistics, charts, task center
│   ├── return-orders/      # Return order management (list, form, detail, components)
│   ├── return-parts/       # Warranty parts management (list, form, detail, analysis)
│   ├── reports/            # Statistical reports with filters and charts
│   ├── approval/           # Approval workflows (scrap, analysis reports)
│   └── settings/           # Configuration (templates, notifications, data sync)
├── components/
│   └── LanguageSwitcher.vue
├── router/
│   └── index.ts            # Route configuration with MainLayout as parent
├── i18n/
│   ├── index.ts            # i18n setup (zh-CN as fallback)
│   └── locales/
│       ├── zh-CN.ts        # Chinese translations
│       └── en-US.ts        # English translations
├── types/
│   └── index.ts            # TypeScript interfaces and enums
├── services/
│   └── mockData.ts         # Mock data (replace with API calls later)
└── main.ts                 # App entry point
```

### Key Architecture Patterns

#### Status Workflows
The system manages two primary entities with multi-step status flows:

1. **Return Orders** (OrderStatus enum):
   - PENDING_REGISTRATION → PENDING_INITIAL_ANALYSIS → PENDING_SAMPLING → SAMPLING_COMPLETED → PENDING_DETAILED_ANALYSIS → IN_DETAILED_ANALYSIS → PENDING_APPROVAL → APPROVED → PENDING_SCRAP → SCRAPPED → COMPLETED

2. **Warranty Parts** (PartStatus enum):
   - REGISTERED → PENDING_INITIAL_ANALYSIS → INITIAL_ANALYSIS_COMPLETED → PENDING_DETAILED_ANALYSIS → IN_DETAILED_ANALYSIS → ANALYSIS_COMPLETED → PENDING_SCRAP → SCRAPPED

Status mapping objects (`ORDER_STATUS_MAP`, `PART_STATUS_MAP`) in `types/index.ts` provide `{ label, color }` for UI display.

#### Route Structure
All routes are nested under `MainLayout` with a consistent pattern:
- `{domain}` (List view)
- `{domain}/new` (Create form)
- `{domain}/:id` (Detail view)
- `{domain}/:id/edit` (Edit form)
- `return-parts/:id/analysis` (Analysis form)

The MainLayout breadcrumb uses `route.meta.title` combined with i18n mapping for dynamic page titles. See `MainLayout.vue` for the `currentPageTitle` computed property.

#### Internationalization
- All UI text uses `t()` from `useI18n()` composable
- Translation keys are organized by namespace: `common`, `menu`, `returnOrder`, `returnPart`, `reports`, `dashboard`, `partDetail`, `analysisForm`, etc.
- Dynamic values use placeholders: `t('key', { variable: value })`
- Mock data should NOT contain display text - use translation keys instead for task titles, status labels, etc.

#### Modal Components
Common modal pattern: `components/[feature]Modal.vue` with props `:visible` and emits `['update:visible', 'success']`

Examples:
- `SamplingModal.vue` - Standard/custom sampling for return orders
- `ScrapModal.vue` - Mark scrap status with WorkON external link
- `AnalysisReportModal.vue` - Template-based analysis forms

#### Mock Data Structure
Located in `src/services/mockData.ts`:
- `MOCK_ORDERS` - Return order records
- `MOCK_PARTS` - Warranty part records
- `MOCK_TASKS` - Dashboard task center (task types: initial_analysis, detailed_analysis, warning, overdue, approval, scrap_confirm)
- `MOCK_TEMPLATES` - Analysis report templates with dynamic fields
- `MOCK_REPORTS` - Submitted analysis reports
- Chart data generators: `generateTrendData()`, `CUSTOMER_RANKING`, `FAILURE_MODE_DATA`, etc.

When implementing real APIs, replace these with actual service calls while keeping the same interfaces.

#### Breadcrumb and Navigation
MainLayout breadcrumb requires `route.meta.title` set in router config. The title is translated via i18n path mapping that matches route patterns (including dynamic `:id` paths).

#### Chart Components
Reports page uses `vue-echarts` with computed chart options that include i18n for legend labels and axis names.

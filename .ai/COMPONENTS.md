# Frontend Components

## Component Architecture

Components follow a hierarchical structure: **Common → Layout → Feature → Page**. Components are organized by domain module and built with composition patterns.

### Naming Convention
- Component files: `PascalCase.tsx` (e.g., `DocumentCard.tsx`)
- Styles: Co-located CSS modules `ComponentName.module.css` or styled within the component
- Tests: `ComponentName.test.tsx`
- Stories: `ComponentName.stories.tsx` (if using Storybook)

### Component File Structure
```tsx
// 1. Imports
// 2. Types/Interfaces
// 3. Component definition (named export)
// 4. Sub-components (if small, otherwise separate files)
```

---

## Common Components

Reusable, domain-agnostic components used across all features.

### Button
- **File:** `components/common/Button.tsx`
- **Props:** `variant` (primary, secondary, ghost, danger), `size` (sm, md, lg), `loading`, `disabled`, `icon`, `children`
- **Variants:**
  - Primary: Accent blue background, white text
  - Secondary: Transparent background, border, text color
  - Ghost: No background or border, text color only
  - Danger: Red background for destructive actions

### Input
- **File:** `components/common/Input.tsx`
- **Props:** `label`, `placeholder`, `error`, `helperText`, `icon`, `type`, `disabled`
- **Features:** Floating label animation, error state with red border, helper text below

### Select
- **File:** `components/common/Select.tsx`
- **Props:** `label`, `options`, `value`, `onChange`, `multiple`, `searchable`
- **Features:** Custom dropdown with search, multi-select with pills

### Badge
- **File:** `components/common/Badge.tsx`
- **Props:** `variant` (success, warning, danger, info, neutral), `size`, `children`
- **Usage:** Status indicators, category labels, count badges

### Card
- **File:** `components/common/Card.tsx`
- **Props:** `title`, `subtitle`, `actions`, `hoverable`, `children`
- **Features:** Consistent card styling with optional header actions

### Modal
- **File:** `components/common/Modal.tsx`
- **Props:** `isOpen`, `onClose`, `title`, `size` (sm, md, lg, xl), `children`, `footer`
- **Features:** Backdrop overlay, escape key close, focus trap, scroll lock

### Table
- **File:** `components/common/Table.tsx`
- **Props:** `columns`, `data`, `sortable`, `selectable`, `pagination`, `loading`
- **Features:** Column sorting, row selection, pagination controls, skeleton loading

### Toast
- **File:** `components/common/Toast.tsx`
- **Props:** `type` (success, error, warning, info), `message`, `duration`
- **Features:** Auto-dismiss, stack multiple toasts, dismiss button

### Skeleton
- **File:** `components/common/Skeleton.tsx`
- **Props:** `variant` (text, circular, rectangular), `width`, `height`, `lines`
- **Usage:** Loading placeholders matching content layout

### EmptyState
- **File:** `components/common/EmptyState.tsx`
- **Props:** `icon`, `title`, `description`, `actionLabel`, `onAction`
- **Usage:** Shown when lists/tables have no data

### Avatar
- **File:** `components/common/Avatar.tsx`
- **Props:** `src`, `name`, `size` (sm, md, lg), `status` (online, offline)
- **Features:** Image with fallback to initials

### ProgressBar
- **File:** `components/common/ProgressBar.tsx`
- **Props:** `value`, `max`, `variant` (default, success, warning, danger), `animated`

### SearchInput
- **File:** `components/common/SearchInput.tsx`
- **Props:** `value`, `onChange`, `placeholder`, `suggestions`, `onSuggestionSelect`, `loading`
- **Features:** Debounced input, suggestion dropdown, keyboard navigation

### FileUpload
- **File:** `components/common/FileUpload.tsx`
- **Props:** `accept`, `maxSize`, `multiple`, `onFiles`, `progress`
- **Features:** Drag-and-drop zone, file list with progress, validation messages

### StatCard
- **File:** `components/common/StatCard.tsx`
- **Props:** `icon`, `label`, `value`, `trend` (up, down, flat), `trendValue`, `color`
- **Features:** Metric display with trend indicator

---

## Layout Components

Define the application shell and page structure.

### AppShell
- **File:** `components/layout/AppShell.tsx`
- **Children:** TopBar, Sidebar, main content outlet
- **Features:** Manages sidebar collapse state, responsive behavior

### TopBar
- **File:** `components/layout/TopBar.tsx`
- **Elements:** Logo, ProjectSelector, GlobalSearch, NotificationBell, UserMenu
- **Height:** 56px fixed

### Sidebar
- **File:** `components/layout/Sidebar.tsx`
- **Elements:** Navigation items with icons, collapsible sections, active indicator
- **Width:** 240px expanded, 64px collapsed
- **Navigation Items:** Dashboard, Documents, Search, Chat, Compliance, Schedule, Procurement, Settings, AI Agents (separated section)

### PageHeader
- **File:** `components/layout/PageHeader.tsx`
- **Props:** `title`, `subtitle`, `breadcrumbs`, `actions` (slot for action buttons)

### PageContent
- **File:** `components/layout/PageContent.tsx`
- **Props:** `maxWidth`, `padding`, `children`
- **Features:** Scrollable container with configurable max width

### ProjectSelector
- **File:** `components/layout/ProjectSelector.tsx`
- **Features:** Dropdown listing user's projects, current project highlighted, search filter

### NotificationBell
- **File:** `components/layout/NotificationBell.tsx`
- **Features:** Bell icon with unread count badge, dropdown panel with notification list, mark-as-read

### UserMenu
- **File:** `components/layout/UserMenu.tsx`
- **Features:** Avatar + name, dropdown with profile, settings, logout

---

## Feature Components

### Dashboard Module

| Component | File | Purpose |
|-----------|------|---------|
| DashboardGrid | `components/dashboard/DashboardGrid.tsx` | Responsive grid layout for dashboard widgets |
| HealthScoreGauge | `components/dashboard/HealthScoreGauge.tsx` | Circular gauge showing project health (0-100) |
| ComplianceSummaryBar | `components/dashboard/ComplianceSummaryBar.tsx` | Stacked horizontal bar (pass/warning/fail) |
| ScheduleRiskHeatMap | `components/dashboard/ScheduleRiskHeatMap.tsx` | Color-coded risk list for schedule activities |
| ActivityFeed | `components/dashboard/ActivityFeed.tsx` | Chronological list of recent project actions |
| ProcurementPipeline | `components/dashboard/ProcurementPipeline.tsx` | Funnel visualization of procurement stages |
| MetricTrendChart | `components/dashboard/MetricTrendChart.tsx` | Line chart showing metric trends over time |

### Document Module

| Component | File | Purpose |
|-----------|------|---------|
| DocumentList | `components/documents/DocumentList.tsx` | Filterable table of project documents |
| DocumentCard | `components/documents/DocumentCard.tsx` | Card view of a single document |
| DocumentUploadModal | `components/documents/DocumentUploadModal.tsx` | Upload modal with drag-and-drop and metadata |
| DocumentPreview | `components/documents/DocumentPreview.tsx` | Document detail panel with metadata and preview |
| DocumentFilterBar | `components/documents/DocumentFilterBar.tsx` | Category, status, and search filters |
| ProcessingStatusBadge | `components/documents/ProcessingStatusBadge.tsx` | Animated badge showing processing state |
| VersionHistory | `components/documents/VersionHistory.tsx` | Document revision timeline |

### Chat Module

| Component | File | Purpose |
|-----------|------|---------|
| ChatWindow | `components/chat/ChatWindow.tsx` | Full chat interface container |
| MessageList | `components/chat/MessageList.tsx` | Scrollable message list |
| UserMessage | `components/chat/UserMessage.tsx` | User message bubble (right-aligned) |
| AssistantMessage | `components/chat/AssistantMessage.tsx` | AI response with sources and formatting |
| MessageInput | `components/chat/MessageInput.tsx` | Text area with send button and attachments |
| SourceCitation | `components/chat/SourceCitation.tsx` | Collapsible source reference card |
| SuggestedQuestions | `components/chat/SuggestedQuestions.tsx` | Clickable follow-up suggestion pills |
| ChatSessionList | `components/chat/ChatSessionList.tsx` | Sidebar list of chat sessions |

### Compliance Module

| Component | File | Purpose |
|-----------|------|---------|
| ComplianceOverview | `components/compliance/ComplianceOverview.tsx` | Summary with percentage and standard breakdown |
| ComplianceTable | `components/compliance/ComplianceTable.tsx` | Detailed findings table with expand/collapse |
| ComplianceCheckRunner | `components/compliance/ComplianceCheckRunner.tsx` | Form to initiate compliance check |
| FindingDetail | `components/compliance/FindingDetail.tsx` | Expanded finding with evidence and action |
| StandardBadge | `components/compliance/StandardBadge.tsx` | Styled badge for standard codes |

### Schedule Module

| Component | File | Purpose |
|-----------|------|---------|
| ScheduleImport | `components/schedule/ScheduleImport.tsx` | P6 XML file upload interface |
| CriticalPathView | `components/schedule/CriticalPathView.tsx` | Visual critical path display |
| RiskHeatMap | `components/schedule/RiskHeatMap.tsx` | Activity risk visualization |
| ActivityDetail | `components/schedule/ActivityDetail.tsx` | Activity detail panel with risk factors |
| ScheduleMetrics | `components/schedule/ScheduleMetrics.tsx` | SPI, float, risk score gauges |

### Procurement Module

| Component | File | Purpose |
|-----------|------|---------|
| ProcurementTable | `components/procurement/ProcurementTable.tsx` | Filterable procurement item table |
| StatusPipeline | `components/procurement/StatusPipeline.tsx` | Visual pipeline of procurement stages |
| VendorScorecard | `components/procurement/VendorScorecard.tsx` | Vendor performance summary card |
| LeadTimeTracker | `components/procurement/LeadTimeTracker.tsx` | Lead time visualization with alerts |
| ProcurementImport | `components/procurement/ProcurementImport.tsx` | CSV/Excel import interface |

### Simulation & Graph Module

| Component | File | Purpose |
|-----------|------|---------|
| GraphVisualizer | `components/graph/GraphVisualizer.tsx` | Interactive node/edge Knowledge Graph display |
| SimulationTimeline | `components/simulation/SimulationTimeline.tsx` | Gantt-style timeline for Delay Simulations |
| MitigationCards | `components/simulation/MitigationCards.tsx` | AI-generated mitigation strategies display |

### AI Agents Module

| Component | File | Purpose |
|-----------|------|---------|
| AgentDashboard | `components/agents/AgentDashboard.tsx` | Overview of all 14 active agents |
| AgentRunHistory | `components/agents/AgentRunHistory.tsx` | Logs and findings of a specific agent |
| SupervisorMetrics | `components/agents/SupervisorMetrics.tsx` | Metrics on Supervisor delegation accuracy |

---

## Pages

Pages compose layout and feature components. Each page maps to a route.

| Page | Route | Key Components |
|------|-------|---------------|
| LoginPage | `/login` | Input, Button, Card |
| RegisterPage | `/register` | Input, Button, Card |
| DashboardPage | `/dashboard` | DashboardGrid, HealthScoreGauge, StatCard, ActivityFeed |
| DocumentsPage | `/documents` | DocumentList, DocumentFilterBar, DocumentPreview, DocumentUploadModal |
| SearchPage | `/search` | SearchInput, AssistantMessage, SourceCitation |
| ChatPage | `/chat` | ChatWindow, ChatSessionList |
| CompliancePage | `/compliance` | ComplianceOverview, ComplianceTable, ComplianceCheckRunner |
| SchedulePage | `/schedule` | CriticalPathView, RiskHeatMap, ScheduleMetrics |
| ProcurementPage | `/procurement` | ProcurementTable, StatusPipeline, VendorScorecard |
| GraphPage | `/graph` | GraphVisualizer, SearchInput |
| SimulationPage | `/simulation` | SimulationTimeline, MitigationCards |
| AgentsPage | `/agents` | AgentDashboard, AgentRunHistory |
| SettingsPage | `/settings` | Input, Select, Button, Card |

## Related Documents

- [UI_GUIDELINES.md](./UI_GUIDELINES.md) — Design system and tokens
- [FEATURES.md](./FEATURES.md) — Features these components implement
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) — Component coding standards

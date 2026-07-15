# WatchForge — Implementation Roadmap & Validation Plan

This document establishes the delivery phases, dependency graphs, work packages, and testing strategies for WatchForge.

---

## 1. Subsystem Dependency Graph

To prevent integration blocks and merge conflicts, subsystems must be implemented in order of their dependencies:

```
[Registry & Templates Data]
           │
           ▼
   [Zustand Stores] ◄──────────────┐
           │                       │
     ┌─────┴──────────┐            │ (onTap Sync)
     ▼                ▼            │
[Konva Canvas]   [ReactFlow Map] ──┘
     │                │
     └─────┬──────────┘
           ▼
    [UI Components]
           │
           ▼
    [Codegen Engine]
           │
           ▼
    [Project Export]
```

*Rule:* The Codegen Engine must be developed using mock JSON states matching the Zustand stores first, allowing backend generation tasks to run in parallel with frontend UI development.

---

## 2. Milestones

The project is structured into **7 Key Milestones** spanning the entire lifecycle.

### Milestone 1: Foundation & Scaffolding
* **Objective:** Establish the React-Vite framework, install dependencies, implement multi-page routing, and construct the shell layout.
* **Exit Criteria:** Web app loads, sidebars and headers render, and routing between `/editor`, `/flow`, `/export`, and `/settings` is functional.

### Milestone 2: Zustand State & Time-Travel
* **Objective:** Code all Zustand stores and implement selective, debounced Undo/Redo operations.
* **Exit Criteria:** Test scripts verify state updates, history states capture on widget manipulation, and history indexes roll back/forward.

### Milestone 3: Canvas Workspace & Core Widgets
* **Objective:** Mount the Konva.js canvas wrapper, implement drag-and-drop from the widget palette, and render basic shapes/buttons.
* **Exit Criteria:** Widgets can be dragged from the LeftSidebar, dropped onto the canvas, resized/moved, and deleted.

### Milestone 4: Compound & Visual Data Widgets
* **Objective:** Implement compound widgets (Clock, Date, Notification Bar) with locking constraints, custom Keyboard linked to TextArea, and visual data arcs.
* **Exit Criteria:** Clock sub-elements can be customized, and adding a Keyboard automatically binds it to a TextArea on the canvas.

### Milestone 5: ReactFlow Navigation Mapping
* **Objective:** Mount ReactFlow, render ScreenNodes with thumbnails, and construct transition edges.
* **Exit Criteria:** Screens created in the Editor show up as nodes in FlowPage, and dragging navigation arrows creates onTap action listeners on the source widgets.

### Milestone 6: Codegen Engine (ESP-IDF & Arduino)
* **Objective:** Build the code generation coordinator, template-based drivers, and ZIP bundle builder.
* **Exit Criteria:** Coordinator processes mock JSON layout and returns a valid ZIP package containing target-specific drivers, main wrapper, and UI assets.

### Milestone 7: Validation Gates & Polish
* **Objective:** Implement pinout validation checker, SRAM memory limits evaluator, project auto-save, and Dark Mode.
* **Exit Criteria:** Validator flags pin conflicts and buffer warnings correctly, and projects reload successfully from localStorage.

---

## 3. Work Packages (WPs)

Each work package is designed to satisfy the **Surgical Edit Rule**: single responsibility, one owner, minimal dependencies.

| WP ID | Name | Subsystem | Bounded Files | Bounded Tests |
| --- | --- | --- | --- | --- |
| **WP-100** | Shell Setup | Core UI / Shell | `App.jsx`, `main.jsx`, `pages/` | Routing tests |
| **WP-200** | Stores & Time-travel | State Management | `src/store/**` | Zustand CRUD & undo/redo unit tests |
| **WP-300** | Konva Stage & Drag | Canvas Editor | `components/WidgetCanvas/**` | Drag-drop positioning tests |
| **WP-310** | Core Widget Renderers | Presentation Layer | `components/WidgetRenderer/**` | Shape properties UI binding tests |
| **WP-400** | Compound Widgets | Compound Logic | `components/WidgetRenderer/Clock*`, `Date*` | Nested element selector tests |
| **WP-410** | Keyboard & Text Binding | Input Logic | `components/WidgetRenderer/Keyboard*` | Textarea auto-binding event tests |
| **WP-500** | Screen Node Mapping | Navigation UI | `pages/FlowPage/**`, `useFlowStore.js` | Node generation state tests |
| **WP-510** | Edge Router & Sync | Navigation Routing | `components/FlowControls/**` | Dashed edge onTap synchronization tests |
| **WP-600** | UI Codegen Builder | Codegen Engine | `engine/codegen/screen*`, `widget*` | Mock-to-LVGL conversion unit tests |
| **WP-610** | HAL Driver Builder | Codegen Engine | `engine/codegen/display*`, `touch*` | C-code rotation macro verification tests |
| **WP-620** | Multi-Platform Exporter | Export Shell | `pages/ExportPage/**`, `useExport.js` | Handlebars rendering & ZIP compilation tests |
| **WP-700** | Pin & Memory Validator | Validation | `engine/validator.js` | GPIO duplicate pin conflict tests |

---

## 4. Validation Strategy

To prevent regressions, the project employs three validation gates:

### 4.1 Unit Testing Gate
* **Framework:** Vitest + React Testing Library (for stores and codegen).
* **Requirements:**
  * Stores (`WP-200`): State updates must be tested using mock operations. Undo stack size must never exceed $30$.
  * Codegen Engine (`WP-600`, `WP-611`): Generated C code strings are matched against expected outputs for specific JSON structures.

### 4.2 Integration Gate
* **Goal:** Verify that changes to the property panel update the canvas immediately and sync correctly with ReactFlow nodes.
* **Process:** Automated browser subagent flows validating state updates across pages.

### 4.3 FSD Compliance Gate
* **Goal:** Verification of target outputs in a hardware compiler emulator.
* **Process:** Compiling the generated ZIP output files using local compiler scripts (PlatformIO CLI command `pio run`) to ensure they compile without errors for both `esp32s3-idf` and `esp32s3-arduino` targets.

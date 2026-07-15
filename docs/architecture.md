# WatchForge — System Architecture Specification

This document details the system design, directory layout, state schemas, and API contracts for the WatchForge project. Any changes to this document must be approved by the **Architect**.

---

## 1. Directory Structure

The project follows a modular, feature-based directory structure separating the UI client layer from the C-codegen engine layer.

```
watchforge/
├── docs/                             # Project specifications & architecture docs
│   ├── LVGL_VISUAL_BUILDER_PRD.md
│   └── architecture.md
│
├── public/                           # Static assets
│   └── fonts/                        # Standard LVGL font assets (Montserrat TTFs)
│
├── src/
│   ├── main.jsx                      # App entry point
│   ├── App.jsx                       # Routing & main layout shell
│   │
│   ├── data/                         # Static registries
│   │   ├── devices.json              # Preset display/touch controller specifications
│   │   ├── widgetTemplates.json      # Built-in widget structures & default props
│   │   └── animationPresets.json     # Standard transition animations mapped to LVGL constants
│   │
│   ├── store/                        # Zustand stores (independent schemas)
│   │   ├── useProjectStore.js        # Global project & screen schemas
│   │   ├── useWidgetStore.js         # Canvas widget state schema
│   │   ├── useFlowStore.js           # ReactFlow nodes & edges mapping schema
│   │   └── useDeviceStore.js         # Hardware, platform, & GPIO configuration schema
│   │
│   ├── pages/                        # Page-level containers (business logic boundaries)
│   │   ├── LandingPage/              # Splash & introduction
│   │   ├── EditorPage/               # Design workspace (Toolbar, Sidebar, Properties)
│   │   ├── FlowPage/                 # Navigation diagram workspace (ReactFlow)
│   │   └── ExportPage/               # Code verification, preview, & ZIP download
│   │
│   ├── components/                   # Shared presentation UI components
│   │   ├── ui/                       # shadcn/ui boilerplate components
│   │   ├── WidgetCanvas/             # Konva.js stage & selection wrappers
│   │   ├── WidgetRenderer/           # Translation of Zustand widget state into Konva layout
│   │   ├── PropertyPanel/            # Contextual inputs based on selected widget type
│   │   └── DeviceFrame/              # SVG-clipped previews with safe-zones
│   │
│   ├── engine/                       # Codegen Layer (pure C generation, no React dependency)
│   │   ├── codegen/                  # Generation handlers
│   │   │   ├── index.js              # Codegen coordinator
│   │   │   ├── screenGenerator.js    # Generates lv_obj_t screens
│   │   │   ├── widgetGenerator.js    # Generates UI widgets instantiations
│   │   │   ├── animGenerator.js      # Generates transition animation macros & structures
│   │   │   ├── fontGenerator.js      # Generates font declarations
│   │   │   ├── displayDriverGenerator.js # Generates display_driver.c/.cpp and display_driver.h
│   │   │   ├── touchDriverGenerator.js   # Generates touch_driver.c/.cpp and touch_driver.h
│   │   │   ├── platformioIniGenerator.js  # Generates platformio.ini target environment flags
│   │   │   └── mainGenerator.js      # Generates main.c (ESP-IDF) or sketch.ino (Arduino)
│   │   └── templates/                # Handlebars templates
│   │       ├── ui_screen.c.hbs
│   │       ├── ui_init.h.hbs
│   │       ├── lv_conf.h.hbs
│   │       ├── platformio.ini.hbs
│   │       ├── main.c.hbs
│   │       ├── sketch.ino.hbs
│   │       ├── idf_component.yml.hbs
│   │       ├── display/               # Controller-specific initialization scripts
│   │       └── touch/                 # Touch-specific initialization scripts
│   │
│   ├── hooks/                        # Independent utility hooks
│   │   ├── useWidgetDrag.js          # Handles canvas dragging & alignment
│   │   ├── useKeyboardShortcuts.js   # Handles hotkeys (Del, Undo, Redo)
│   │   └── useExport.js              # Integrates codegen coordinator with JSZip
│   │
│   └── utils/                        # Pure utility functions
│       ├── lvglColor.js              # Hex colors -> lv_color_hex()
│       ├── lvglCoord.js              # Coordinates -> pixel / percent
│       └── fontUtils.js              # Font mapping to LVGL declarations
│
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 2. State Schemas (Zustand Stores)

State is strictly partitioned to avoid monolith stores and ensure clean change notifications.

### 2.1 Project & Screen Store (`useProjectStore`)
```typescript
interface Screen {
  id: string;          // uuid-v4
  name: string;        // e.g. "Main Screen"
  isRoot: boolean;     // Set as default initial screen
  type: 'normal' | 'overlay';
  scroll: {
    direction: 'none' | 'horizontal' | 'vertical';
    snapToPage: boolean;
    pageIndicator: 'dots' | 'none';
  };
  pages: Array<{
    id: string;        // uuid-v4
    name: string;      // e.g., "Main Tab"
    widgetIds: string[]; // Order determines Z-index
  }>;
  bgColor: string;     // Hex color code
  overlay?: {
    position: 'top' | 'bottom' | 'left' | 'right';
    sizePercent: number; // 10% to 100% of screen dimension
  };
}

interface ProjectState {
  projectName: string;
  screens: Screen[];
  activeScreenId: string;
  history: Array<{
    widgets: Record<string, Widget[]>;
    screens: Screen[];
    activeScreenId: string;
  }>;
  historyIndex: number;
}
```

### 2.2 Widget Store (`useWidgetStore`)
```typescript
interface Widget {
  id: string;          // uuid-v4
  type: 'text' | 'rect' | 'button' | 'image' | 'line' | 'keyboard' | 'textarea' | 'clock' | 'date' | 'chart' | 'bar' | 'gauge';
  screenId: string;
  pageId: string;      // Associated page container ID
  x: number;           // Coordinate relative to screen resolution
  y: number;
  width: number;
  height: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  persistent: boolean; // Rendered across all pages on the screen
  props: Record<string, any>; // Type-specific attributes (text value, font size, battery styling, etc.)
  onTap: {
    action: 'none' | 'navigate_screen' | 'navigate_page' | 'toggle_overlay' | 'custom_event';
    targetScreenId: string | null;
    targetPageIndex: number | null;
    overlayScreenId: string | null;
    customEventName: string | null;
    animation: string;  // e.g. "slide_left"
    duration: number;   // ms
  };
}

interface WidgetState {
  widgets: Record<string, Widget[]>; // Keyed by screenId
}
```

### 2.3 Flow Store (`useFlowStore`)
```typescript
interface TransitionEdge {
  id: string;          // ReactFlow edge id
  sourceScreenId: string;
  targetScreenId: string;
  trigger: 'swipe_up' | 'swipe_down' | 'swipe_left' | 'swipe_right' | 'button_press' | 'timeout';
  animation: string;   // e.g., "slide_up"
  duration: number;    // ms
  isReversible: boolean;
  reverseAnimation: string;
  timeoutMs: number | null;
  triggerWidgetId: string | null; // Non-null if generated via widget onTap shortcut
}

interface FlowState {
  nodes: any[];        // ReactFlow node structure mapping screens
  edges: TransitionEdge[];
}
```

### 2.4 Device & Configuration Store (`useDeviceStore`)
```typescript
interface Device {
  id: string;
  name: string;
  chip: 'ESP32-S3' | 'custom';
  display_controller: string; // e.g. "CO5300", "ST7789"
  interface: 'SPI' | 'QSPI' | 'I2C' | '8080';
  width: number;
  height: number;
  shape: 'round' | 'square' | 'rounded_square' | 'rect' | 'rounded_rect';
  cornerRadius?: number;
  color_depth: 16 | 32;
  swap_rgb: boolean;
}

interface DeviceState {
  selectedDevice: Device;
  targetFramework: 'espidf' | 'arduino';
  displayRotation: 0 | 1 | 2 | 3; // 0: 0°, 1: 90°, 2: 180°, 3: 270°
  bufferStrategy: 'sram_partial' | 'psram_full';
  bufferLines: number; // default: 40 lines
  displayDriverId: string;
  touchDriverId: string;
  driverConfig: {
    pins: Record<string, number>; // Maps function names (e.g. SCLK, SDA) to GPIO pins
    pclk_mhz: number;
    i2c_freq_hz: number;
  };
}
```

---

## 3. Subsystem APIs & Contracts

### 3.1 Codegen Engine Entrypoint Contract
All code generation operations must pass through `src/engine/codegen/index.js`.
```typescript
interface CodegenResult {
  files: Record<string, string>; // Maps file paths to C/H/Ini string code content
  warnings: string[];
}

export function generateProject(
  projectName: string,
  screens: Screen[],
  widgets: Record<string, Widget[]>,
  edges: TransitionEdge[],
  device: DeviceState
): CodegenResult;
```
*No frontend code (React components, state hooks) is permitted inside `src/engine/`.*

### 3.2 Dynamic Canvas/Flow Synchronization Contract
When a shortcut is added to a widget:
```typescript
function syncWidgetNavigationToFlow(
  widgetId: string, 
  sourceScreenId: string, 
  targetScreenId: string, 
  onTapConfig: any
): void;
```
*Rules:*
- Creation: Creating a widget `navigate_screen` action automatically generates a read-only dashed edge in `useFlowStore`.
- Mutation: Modifying the selected target in the Property Panel updates the corresponding flow edge's target screen.
- Deletion: Deleting the edge on the Flow Page sets the widget's `onTap.action` back to `'none'`.

---

## 4. Architectural Protection Rules
1. **Z-Index Invariance:** Widget index order inside `Screen.pages[i].widgetIds` strictly defines the canvas rendering layer sequence. No external layers can override this.
2. **Framework Separation:** `display_driver.h` must expose `#define DISPLAY_ROTATION` and `#define DISPLAY_SWAP_XY`. Driver C files must utilize conditional logic checks based on these defines to allow manual rotation directly from IDEs (like VS Code) without visual builder exports.
3. **Buffer Memory Governance:** The codegen coordinator must execute `validator.js` to calculate total SRAM consumption before archiving files. If partial buffer sizing allocation exceeds $120 \text{ KB}$ SRAM (e.g., $10 \text{ rows} \times \text{width} \times \text{color depth} \times 2$), it must throw validation errors.

---

## 5. Architectural Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| **SRAM Out of Memory (OOM) on ESP32-S3** | The frontend validator calculates SRAM buffer usage dynamically. Force default to SRAM partial slice buffer ($1/10$ screen height) and warn users if SRAM buffer $> 120 \text{ KB}$. |
| **Touch Coordinate Shift on Rotation** | Lock swap/mirror touch register flags (`swap_xy`, `mirror_x`, `mirror_y`) directly to the `#define DISPLAY_ROTATION` macro inside driver templates. |
| **Konva Canvas Sync lag with Zustand store** | Implement React canvas wrappers utilizing React.memo and selectively subscribing to specific widget fields rather than broad store subscriptions. |

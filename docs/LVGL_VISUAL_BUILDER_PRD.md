# LVGL Visual Builder — Full Project Design Document
> **Project Codename:** `WatchForge`
> **Target:** Visual UI builder berbasis web untuk membuat UI smartwatch ESP32-S3 menggunakan LVGL
> **Output:** Source code C/H yang siap di-compile dengan ESP-IDF / Arduino framework

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Phase Pengerjaan](#4-phase-pengerjaan)
5. [Agent Rules & File Access](#5-agent-rules--file-access)
6. [Halaman & UI/UX Design](#6-halaman--uiux-design)
7. [Sistem Node & Branch Logic](#7-sistem-node--branch-logic)
8. [Widget Library & Template](#8-widget-library--template)
9. [Export Engine](#9-export-engine)
10. [Display & Resolution Config](#10-display--resolution-config)
11. [State Management & Data Model](#11-state-management--data-model)
12. [Animation System](#12-animation-system)
13. [Driver HAL System](#13-driver-hal-system-hardware-abstraction-layer)

---

## 1. Project Overview

WatchForge adalah web application yang memungkinkan user untuk:
- **Merancang UI smartwatch** secara visual dengan drag-and-drop
- **Mendefinisikan alur navigasi** antar screen menggunakan node-based flow editor (seperti Node-RED)
- **Mengkonfigurasi animasi transisi** antar screen
- **Memilih bentuk & resolusi display** ESP32-S3 yang digunakan via visual shape picker (round, square, rounded, rect)
- **Insert keyboard widget** dengan berbagai layout (QWERTY, Numpad, PIN, dll) langsung ke screen
- **Memilih display driver & touch driver** dari registry (CO5300 QSPI, CST9217 I2C, GC9A01, dll) dan mengkonfigurasi GPIO pin per wiring PCB
- **Mengexport project** menjadi full package siap compile: LVGL UI code + display driver + touch driver + `main.c` + `idf_component.yml`

### Target User
Developer/maker ESP32-S3 yang familiar dengan C/Arduino tapi ingin mempercepat proses desain UI tanpa harus menulis LVGL boilerplate dari nol.

---

## 2. Tech Stack

### Frontend
| Layer | Library | Alasan |
|---|---|---|
| Framework | **React 18 + Vite** | Fast dev server, ecosystem luas |
| Flow Editor | **@xyflow/react (ReactFlow v12)** | Handles node/edge/arrow drag, zoom, pan — battle-tested di n8n, Node-RED |
| Canvas Widget | **Konva.js + react-konva** | 2D canvas rendering untuk preview widget di screen |
| State Management | **Zustand** | Ringan, tidak boilerplate, cocok untuk complex nested state |
| Styling | **Tailwind CSS + shadcn/ui** | Konsisten, cepat, component library gratis |
| Font Picker | **fontsource + react-fontpicker** | Preview font langsung di browser |
| Color Picker | **react-colorful** | Lightweight, headless |
| Code Highlight | **shiki** | Syntax highlight untuk preview export code |
| Routing | **React Router v6** | Multi-page SPA |

### Backend (Opsional / Phase 3+)
| Layer | Library | Alasan |
|---|---|---|
| Runtime | **Node.js + Express** atau **Hono** | Ringan, cepat |
| Template Engine | **Handlebars.js** | Generate file .c/.h dari template |
| File Download | Native `Blob` API (client-side) | Tidak perlu backend untuk export dasar |

> **Catatan:** Export bisa 100% client-side di Phase 1-2 menggunakan JavaScript template engine langsung di browser. Backend hanya diperlukan jika ada fitur cloud save / project sharing.

---

## 3. Folder Structure

```
watchforge/
├── public/
│   └── fonts/                        # Font files yang di-bundle
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   │
│   ├── pages/                        # Halaman utama aplikasi
│   │   ├── LandingPage/
│   │   │   ├── index.jsx
│   │   │   └── LandingPage.module.css
│   │   ├── EditorPage/               # Halaman utama editor
│   │   │   ├── index.jsx
│   │   │   ├── EditorPage.module.css
│   │   │   └── components/
│   │   │       ├── Toolbar.jsx
│   │   │       ├── LeftSidebar.jsx   # Widget library panel
│   │   │       ├── RightPanel.jsx    # Properties panel
│   │   │       ├── BottomBar.jsx     # Status / screen selector
│   │   │       └── TopBar.jsx        # Project name, export, settings
│   │   ├── FlowPage/                 # Node-based flow editor
│   │   │   ├── index.jsx
│   │   │   └── components/
│   │   │       ├── ScreenNode.jsx
│   │   │       ├── TransitionEdge.jsx
│   │   │       └── FlowControls.jsx
│   │   ├── ExportPage/
│   │   │   ├── index.jsx
│   │   │   └── components/
│   │   │       ├── CodePreview.jsx
│   │   │       └── ExportSettings.jsx
│   │   └── SettingsPage/
│   │       └── index.jsx
│   │
│   ├── components/                   # Shared UI components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── WidgetCanvas/             # Konva canvas wrapper
│   │   │   ├── index.jsx
│   │   │   ├── CanvasGrid.jsx
│   │   │   └── SelectionBox.jsx
│   │   ├── WidgetRenderer/           # Render tiap jenis widget
│   │   │   ├── ClockWidget.jsx
│   │   │   ├── DateWidget.jsx
│   │   │   ├── NotifBarWidget.jsx
│   │   │   ├── ChartWidget.jsx
│   │   │   ├── BarWidget.jsx
│   │   │   ├── ButtonWidget.jsx
│   │   │   ├── KeyboardWidget.jsx    # ← NEW: keyboard preview + config
│   │   │   ├── TextAreaWidget.jsx    # ← NEW: textarea yang di-link ke keyboard
│   │   │   ├── ImageWidget.jsx
│   │   │   └── TextWidget.jsx
│   │   ├── PropertyPanel/            # Panel kanan untuk edit properti widget
│   │   │   ├── FontPicker.jsx
│   │   │   ├── ColorPicker.jsx
│   │   │   ├── PositionEditor.jsx
│   │   │   └── AnimationPicker.jsx
│   │   └── DeviceFrame/              # Frame preview smartwatch
│   │       ├── index.jsx
│   │       ├── ShapePicker.jsx       # ← NEW: visual card selector untuk shape
│   │       ├── RoundSafeZone.jsx     # ← NEW: overlay safe zone untuk round display
│   │       └── frames/               # SVG frames per device
│   │           ├── round.svg
│   │           ├── square.svg
│   │           ├── rounded_square.svg
│   │           ├── rect_landscape.svg
│   │           ├── rect_portrait.svg
│   │           └── rounded_rect.svg
│   │
│   ├── store/                        # Zustand state
│   │   ├── useProjectStore.js        # Project-level state
│   │   ├── useFlowStore.js           # ReactFlow nodes & edges
│   │   ├── useWidgetStore.js         # Widget instances per screen
│   │   └── useDeviceStore.js         # Device & resolution config
│   │
│   ├── engine/                       # Export engine
│   │   ├── codegen/
│   │   │   ├── index.js              # Entry point export
│   │   │   ├── screenGenerator.js    # Generate lv_obj screen
│   │   │   ├── widgetGenerator.js    # Generate per-widget code
│   │   │   ├── animGenerator.js      # Generate lv_anim_t code
│   │   │   ├── fontGenerator.js      # Generate font include/declare
│   │   │   └── navigationGenerator.js # Generate screen switch logic
│   │   ├── templates/
│   │   │   ├── main_screen.c.hbs     # Handlebars template
│   │   │   ├── ui_init.h.hbs
│   │   │   └── lv_conf.h.hbs
│   │   └── validator.js              # Validasi sebelum export
│   │
│   ├── data/
│   │   ├── devices.json              # Daftar device + resolusi
│   │   ├── widgetTemplates.json      # Template widget bawaan
│   │   └── animationPresets.json     # Preset animasi
│   │
│   ├── hooks/
│   │   ├── useWidgetDrag.js
│   │   ├── useKeyboardShortcuts.js
│   │   └── useExport.js
│   │
│   └── utils/
│       ├── lvglColor.js              # Konversi hex → lv_color_hex()
│       ├── lvglCoord.js              # Koordinat → LV_PCT / px
│       └── fontUtils.js             # Font name → LVGL font define
│
├── .cursor/
│   └── rules/                        # ← AGENT RULES (lihat Section 5)
│       ├── 00-global.mdc
│       ├── 01-engine.mdc
│       ├── 02-store.mdc
│       ├── 03-components.mdc
│       └── 04-pages.mdc
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 4. Phase Pengerjaan

### Phase 0 — Setup & Scaffolding *(~1 hari)*
**Goal:** Project berjalan, routing OK, layout dasar ada.

**Tasks:**
- [ ] Init Vite + React project
- [ ] Install semua dependencies (ReactFlow, Konva, Zustand, Tailwind, shadcn/ui)
- [ ] Setup routing: `/`, `/editor`, `/flow`, `/export`, `/settings`
- [ ] Buat layout shell: TopBar, LeftSidebar, RightPanel, main area
- [ ] Setup Zustand stores (kosong dulu)
- [ ] Pasang device selector di Settings (dropdown pilih ESP32 + resolusi)
- [ ] Buat `devices.json` dengan daftar target device

**Deliverable:** Web bisa dibuka, navigasi antar halaman bisa, layout terlihat.

---

### Phase 1 — Canvas Editor & Basic Widgets *(~3-4 hari)*
**Goal:** User bisa drag widget ke canvas, lihat preview di device frame.

**Tasks:**
- [ ] Buat `DeviceFrame` — render SVG frame sesuai resolusi yang dipilih
- [ ] Buat Konva canvas di dalam frame
- [ ] Implementasi `WidgetRenderer` untuk: Text, Rect, Image, Button
- [ ] Buat `LeftSidebar` — widget palette yang bisa di-drag ke canvas
- [ ] Implementasi drag-from-palette → drop ke canvas
- [ ] Buat `RightPanel` — edit posisi (x, y, w, h), warna, opacity
- [ ] Multi-screen support: bisa tambah screen, switch antar screen
- [ ] Snap to grid (opsional toggle)

**Deliverable:** Bisa bikin layout basic, ada lebih dari 1 screen.

---

### Phase 2 — Clock, Date, & Compound Widgets *(~2-3 hari)*
**Goal:** Widget compound (jam, tanggal) yang punya sub-element bisa diatur sendiri-sendiri.

**Tasks:**
- [ ] Buat `ClockWidget` dengan sub-element: `HH`, `separator`, `MM`
  - Setiap sub-element punya: posisi relatif, font, warna, ukuran
  - Lock/unlock: format waktu tidak bisa diubah (tetap `HH:MM`)
- [ ] Buat `DateWidget` dengan sub-element: `day`, `date`, `month`, `year`
  - Setiap sub-element bisa disable/enable
  - Posisi, font, warna per sub-element
- [ ] Buat `PropertyPanel` yang context-aware: kalau pilih sub-element jam → tampilkan property sub-element itu
- [ ] Buat `FontPicker` — pilih dari font yang tersedia di LVGL (list statis + custom upload)
- [ ] Buat `ColorPicker` dengan output hex → otomatis convert ke `lv_color_hex(0xRRGGBB)`

**Deliverable:** Widget jam dan tanggal bisa dikustomisasi per elemen.

---

### Phase 3 — Flow Editor & Navigation Logic *(~3-4 hari)*
**Goal:** User bisa define alur navigasi antar screen pakai visual flow.

**Tasks:**
- [ ] Setup ReactFlow canvas di `/flow` page
- [ ] Buat `ScreenNode` — representasi 1 screen (thumbnail + nama)
- [ ] Buat `TransitionEdge` — panah antar screen dengan konfigurasi:
  - Trigger: swipe_up, swipe_down, swipe_left, swipe_right, button_press, timeout
  - Animasi: none, slide, fade, zoom
  - Duration (ms)
- [ ] Buat panel konfigurasi edge (klik panah → muncul panel di kanan)
- [ ] Sinkronisasi: screen yang ada di Editor otomatis muncul sebagai node di Flow
- [ ] Buat `Branch System`:
  - Branch utama: screen-screen navigasi biasa
  - Overlay branch: notification bar, settings overlay (muncul dari atas/bawah)

**Deliverable:** Bisa gambar alur navigasi, tiap panah bisa dikonfigurasi animasi + trigger.

---

### Phase 4 — Chart, Bar, & Data Widgets *(~2 hari)*
**Goal:** Widget data visualization yang bisa di-insert.

**Tasks:**
- [ ] `ChartWidget` — line chart, config: warna garis, background, label axis
- [ ] `BarWidget` — progress bar, config: warna fill, direction (H/V), border radius
- [ ] `GaugeWidget` — gauge/arc, config: range min-max, warna arc
- [ ] `StepCountWidget` — template widget langkah (format tetap, warna bisa diubah)
- [ ] `HeartRateWidget` — template widget BPM
- [ ] Semua widget data: bisa set "placeholder value" untuk preview

**Deliverable:** Widget data visualization tersedia di palette.

---

### Phase 5 — Export Engine *(~4-5 hari)*
**Goal:** Generate kode LVGL C/H yang valid dari project.

**Tasks:**
- [ ] Buat `screenGenerator.js` — generate `lv_obj_t* scr_home = lv_obj_create(NULL);`
- [ ] Buat `widgetGenerator.js` — generate per widget berdasarkan tipe
- [ ] Buat `animGenerator.js` — generate `lv_anim_t` dan screen transition
- [ ] Buat `navigationGenerator.js` — generate gesture handler dan screen switch
- [ ] Buat `fontGenerator.js` — generate include font header
- [ ] Setup Handlebars template untuk file output:
  - `ui.c` — semua screen + widget init
  - `ui.h` — deklarasi fungsi
  - `lv_conf.h` — konfigurasi LVGL sesuai resolusi
- [ ] Buat `ExportPage` — preview kode dengan syntax highlighting
- [ ] Tombol download: ZIP berisi semua file
- [ ] Validasi sebelum export: cek ada screen, ada navigasi dari home, dll.

**Deliverable:** Bisa download ZIP berisi kode LVGL C.

---

### Phase 6 — Polish & QoL *(~2-3 hari)*
**Goal:** UX halus, tidak ada friction.

**Tasks:**
- [ ] Undo/Redo (Ctrl+Z / Ctrl+Y) — pakai Zustand time-travel atau immer
- [ ] Keyboard shortcuts (Delete widget, Escape deselect, dll)
- [ ] Auto-save ke localStorage
- [ ] Import/Export project sebagai `.wforge` (JSON)
- [ ] Dark mode
- [ ] Tutorial overlay untuk first-time user
- [ ] Responsive layout untuk layar lebar

---

## 5. Agent Rules & File Access

Folder `.cursor/rules/` berisi aturan untuk Cursor AI agent. Setiap file `.mdc` mendefinisikan domain masing-masing agent dan file apa yang boleh/tidak boleh disentuh.

---

### `00-global.mdc` — Global Rules (berlaku untuk semua agent)

```markdown
---
description: Global rules untuk semua task di project WatchForge
globs: ["**/*.jsx", "**/*.js", "**/*.css", "**/*.json"]
---

# Global Rules

## Prinsip Utama
- Jangan pernah menulis hardcoded string resolusi layar — selalu ambil dari `useDeviceStore`
- Semua warna yang masuk ke export harus melewati `utils/lvglColor.js`
- Semua koordinat yang masuk ke export harus melewati `utils/lvglCoord.js`
- Jangan modify file di `src/engine/templates/` tanpa instruksi eksplisit
- Jangan install dependency baru tanpa konfirmasi

## Gaya Kode
- Gunakan functional component React + hooks
- Gunakan named export, bukan default export (kecuali pages)
- State global: Zustand. State lokal komponen: useState/useReducer
- Hindari prop drilling lebih dari 2 level — gunakan Zustand store

## Penamaan
- File komponen: PascalCase (`ClockWidget.jsx`)
- File utility/hook: camelCase (`useWidgetDrag.js`)
- Konstanta: UPPER_SNAKE_CASE
- Zustand store action: `verbNoun` format (`addWidget`, `removeScreen`)
```

---

### `01-engine.mdc` — Export Engine Agent

```markdown
---
description: Rules untuk agent yang bekerja di export engine dan code generation
globs: ["src/engine/**", "src/data/devices.json", "src/data/animationPresets.json"]
---

# Export Engine Rules

## File yang BOLEH diakses dan dimodifikasi
- `src/engine/codegen/**` — semua file code generator
- `src/engine/templates/**` — Handlebars template files
- `src/engine/validator.js`
- `src/data/devices.json`
- `src/data/animationPresets.json`
- `src/utils/lvglColor.js`
- `src/utils/lvglCoord.js`
- `src/utils/fontUtils.js`

## File yang DILARANG disentuh
- Semua file di `src/pages/**`
- Semua file di `src/components/**`
- Semua file di `src/store/**`

## Rules Khusus
- Setiap function di codegen harus menerima plain object (bukan React state langsung)
- Output generator harus berupa string (raw C code)
- Gunakan LVGL v8.x API — bukan v9 (API berbeda signifikan)
- Koordinat: gunakan `lv_obj_set_pos(obj, x, y)` bukan align untuk widget bebas
- Warna: selalu `lv_color_hex(0xRRGGBB)` format
- Font: gunakan `&lv_font_montserrat_XX` untuk font bawaan LVGL
- Setiap screen harus diinisialisasi dengan `lv_obj_create(NULL)`
- Jangan generate kode `#include` yang tidak diperlukan

## Template Handlebars
- Variabel template menggunakan `{{namaVariabel}}`
- Block helper: `{{#each widgets}}...{{/each}}`
- Conditional: `{{#if hasAnimation}}...{{/if}}`
- Partial: `{{> namaPartial}}`
```

---

### `02-store.mdc` — State Management Agent

```markdown
---
description: Rules untuk agent yang bekerja di Zustand stores
globs: ["src/store/**"]
---

# State Management Rules

## File yang BOLEH diakses dan dimodifikasi
- `src/store/**` — semua store files

## File yang BOLEH dibaca (read-only reference)
- `src/data/widgetTemplates.json`
- `src/data/devices.json`
- `src/engine/codegen/index.js` (untuk memahami struktur data yang dibutuhkan)

## File yang DILARANG disentuh
- Semua file di `src/pages/**`
- Semua file di `src/components/**`
- Semua file di `src/engine/**`

## Struktur Data Wajib

### Widget Object
```json
{
  "id": "uuid-v4",
  "type": "clock | date | text | button | chart | bar | gauge | image | notifbar",
  "screenId": "uuid-v4",
  "x": 0,
  "y": 0,
  "width": 100,
  "height": 50,
  "zIndex": 0,
  "locked": false,
  "visible": true,
  "props": {
    // type-specific properties
  }
}
```

### Screen Object
```json
{
  "id": "uuid-v4",
  "name": "Home Screen",
  "bgColor": "#000000",
  "scrollDir": "none | horizontal | vertical | both",
  "widgets": ["widget-uuid-1", "widget-uuid-2"]
}
```

### Flow Edge (Transition)
```json
{
  "id": "uuid-v4",
  "sourceScreenId": "uuid-v4",
  "targetScreenId": "uuid-v4",
  "trigger": "swipe_up | swipe_down | swipe_left | swipe_right | button | timeout",
  "animation": "none | slide_left | slide_right | slide_up | slide_down | fade | zoom",
  "duration": 300,
  "triggerWidgetId": null
}
```

## Rules Khusus
- Setiap action Zustand harus idempoten jika memungkinkan
- Gunakan `immer` produce untuk nested state update
- Jangan menyimpan React component di store — hanya plain data
- History (undo/redo) diimplementasikan sebagai array snapshots di `useProjectStore`
```

---

### `03-components.mdc` — UI Components Agent

```markdown
---
description: Rules untuk agent yang bekerja di komponen UI React
globs: ["src/components/**"]
---

# UI Component Rules

## File yang BOLEH diakses dan dimodifikasi
- `src/components/**` — semua komponen shared

## File yang BOLEH dibaca (read-only reference)
- `src/store/**` (untuk memahami store API)
- `src/data/widgetTemplates.json`

## File yang DILARANG disentuh
- `src/engine/**`
- `src/store/**` (tidak boleh modifikasi store langsung dari komponen file)
- `src/pages/**`

## Rules Khusus
- Komponen harus menerima props dan tidak boleh import store langsung kecuali container-level
- Untuk komponen WidgetRenderer: harus handle `selected` state via props, bukan store
- Gunakan `React.memo` untuk komponen yang render sering (widget di canvas)
- Animasi transisi UI: gunakan CSS transitions, bukan library animasi berat
- Canvas (Konva): hanya boleh render di dalam `Stage` → `Layer` hierarchy
- DeviceFrame: harus scale konten canvas sesuai resolusi device yang dipilih
```

---

### `04-pages.mdc` — Pages Agent

```markdown
---
description: Rules untuk agent yang bekerja di halaman utama aplikasi
globs: ["src/pages/**"]
---

# Pages Rules

## File yang BOLEH diakses dan dimodifikasi
- `src/pages/**` — semua halaman

## File yang BOLEH dibaca (read-only reference)
- `src/store/**`
- `src/components/**`
- `src/hooks/**`

## File yang DILARANG disentuh
- `src/engine/**`
- `src/components/WidgetRenderer/**` (jangan modifikasi renderer dari halaman)

## Rules Khusus
- Halaman adalah container — logic bisnis minimal, delegasikan ke hooks
- EditorPage adalah orchestrator: koordinasikan LeftSidebar, Canvas, RightPanel
- FlowPage: hanya menggunakan ReactFlow API dan store, tidak ada canvas Konva
- ExportPage: hanya consume hasil dari `src/engine/codegen/index.js`
- Jangan import langsung dari engine di luar ExportPage dan hooks/useExport.js
```

---

## 6. Halaman & UI/UX Design

### 6.1 Landing Page (`/`)

**Tujuan:** First impression, CTA masuk ke editor.

**Layout:**
```
┌────────────────────────────────────────────┐
│  WatchForge  [Docs] [GitHub]         [Dark]│
├────────────────────────────────────────────┤
│                                            │
│    Build Smartwatch UI Visually.           │
│    Export to LVGL. Flash to ESP32.         │
│                                            │
│    [Start Building →]  [View Examples]     │
│                                            │
│    [Animated preview: demo project]        │
│                                            │
├────────────────────────────────────────────┤
│  Features: Flow Editor │ Widget Library │  │
│  Live Preview │ LVGL Export               │
└────────────────────────────────────────────┘
```

**UX:**
- CTA utama: "Start Building" → langsung ke `/editor` dengan project baru
- Preview demo auto-play (tidak interaktif) untuk tunjukkan feel aplikasi

---

### 6.2 Editor Page (`/editor`) — Halaman Utama

**Tujuan:** Drag-drop widget ke canvas, edit properties, preview layout per page per screen.

**Layout:**
```
┌─[TopBar: Project Name | Save | Flow | Export | Settings]───────────┐
│                                                                      │
│ [LeftSidebar]  [Page Tabs + Canvas Area]        [RightPanel]        │
│ ┌──────────┐   ┌─────────────────────────────┐  ┌───────────────┐  │
│ │ Widgets  │   │[Page 1][Page 2][Page 3][ + ] │  │ Properties    │  │
│ │ ──────  │   ├─────────────────────────────┤  │ ───────────── │  │
│ │ Clock   │   │ ┌─────────────────────────┐ │  │ X:[  ] Y:[  ] │  │
│ │ Date    │   │ │                         │ │  │ W:[  ] H:[  ] │  │
│ │ Text    │   │ │    device frame +       │ │  │ Color: ██     │  │
│ │ Button  │   │ │    canvas (Page 2)      │ │  │ Font: [    ▼] │  │
│ │ Chart   │   │ │                         │ │  │ Opacity: ─── │  │
│ │ Bar     │   │ └─────────────────────────┘ │  │               │  │
│ │ Image   │   │  [Zoom: 75% ▼] [Grid] [Snap]│  │ ── On Tap ──  │  │
│ │ Keyboard│   └─────────────────────────────┘  │ [Navigate ▼]  │  │
│ │ ...     │                                     │ → [Calc Scr ▼]│  │
│ └──────────┘                                    └───────────────┘  │
│                                                                      │
│ [BottomBar: 📄 Home Screen | 🪟 NotifBar | 📄 Calculator | + Add]  │
└──────────────────────────────────────────────────────────────────────┘
```

**UX Details — BottomBar (Screen Selector):**
- Tiap chip = satu Screen. Klik untuk switch active screen.
- Double-click chip → rename screen inline.
- Klik kanan chip → context menu: `Rename / Duplicate / Delete / Set as Root / Set as Overlay`.
- `+ Add Screen` → dropdown pilih: **Normal Screen** atau **Overlay Screen**.
- Active screen di-highlight dengan border accent color.
- Chip punya ikon kecil: 📄 normal screen, 🪟 overlay screen.

**UX Details — Page Tab Bar (di atas canvas):**
- Muncul hanya jika screen aktif punya `scrollDirection != "none"`.
- Format tab: `Page 1 | Page 2 | Page 3 | +`
- Klik tab → canvas switch ke konten page tersebut. Widget page lain tidak hilang, hanya tidak tampil.
- `+` → append page baru ke screen ini.
- Double-click label tab → rename page (`Main`, `Apps`, `Music`).
- Klik kanan tab → `Delete Page` (ada konfirmasi jika page tidak kosong).
- **Overlay ghost:** saat edit Page 2, widget dari Page 1 tampil transparan (20% opacity) sebagai referensi posisi — bisa di-toggle off lewat toolbar.
- Klik ikon ⚙ di pojok kanan tab bar → **Page Settings panel** muncul:
  ```
  Scroll Direction : [Horizontal ▼]
  Snap to Page     : [On ▼]
  Page Indicator   : [Dots ▼]   ← dot navigator di bawah layar
  ```
- Jika screen `scrollDirection = "none"` → tab bar tidak tampil (single page screen, tidak perlu tab).

**UX Details — LeftSidebar (Widget Palette & Layers):**
- **Dual Add Workflow:** Widget templates dapat ditambahkan ke active screen canvas menggunakan **Single Click** (otomatis ditempatkan di posisi tengah layar) maupun **Drag-and-Drop**.
- **Layers Panel:** Menampilkan hierarki widget, status lock/unlock, visibility, reorder z-index (foreground/background), grouping (`📁 Group`), serta kontrol **Split/Joint** untuk Clock dan Status Bar.

**UX Details — Canvas & Canva-Style Smart Alignment:**
- **Always-On Visual Guides (Canva Style):** Saat widget di-drag, sistem secara otomatis menghitung dan merender garis pandu alignment berwarna merah muda (`#ec4899`).
  - **Horizontal Alignment:** Sisi Kiri-ke-Kiri, Tengah-ke-Tengah, Kanan-ke-Kanan, serta Sisi Kiri/Kanan antar widget dan batas canvas.
  - **Vertical Alignment:** Sisi Atas-ke-Atas, Tengah-ke-Tengah, Bawah-ke-Bawah, serta Sisi Atas/Bawah antar widget dan batas canvas.
- **Magnet Snapping Toggle (🧲):**
  - **Visual Guides:** Garis pandu selalu aktif tampil saat drag sebagai referensi visual presisi (seperti Canva / PowerPoint).
  - **Magnet ON:** Mengunci dan menempelkan posisi widget secara presisi jika berada dalam toleransi 5px dari garis pandu terdekat.
  - **Magnet OFF:** Garis pandu tetap aktif sebagai visual reference tanpa menarik posisi widget.
- **High-Contrast Grid (▦):** Toggle grid canvas 10px dengan garis kontras tinggi (`rgba(255,255,255,0.2)`).
- **Flanking Page Matrix Previews:** Menampilkan preview visual page tetangga (Kiri, Kanan, Atas, Bawah) di sekeliling canvas utama dengan tombol cepat tambah page (`➕`), navigasi slide, dan popover pengatur animasi transisi (`⚙️`).
- Multi-select dengan `Ctrl`/`Shift`+Click dan drag concurrent group movement. Delete widget dengan `Del` key atau ikon sampah.

**UX Details — RightPanel & Screen Settings:**
- **Screen Settings (saat tidak ada widget terpilih):** Menampilkan kontrol konfigurasi layar aktif:
  - **Background Color:** Color picker warna dasar screen (`bgColor`).
  - **Background Image (Wallpaper):** Field input nama variabel C-array gambar background (contoh: `wallpaper_space_png`). Generator memproduksi kode C LVGL yang siap diedit via VSCode:
    ```c
    LV_IMG_DECLARE(wallpaper_space_png);
    lv_obj_set_style_bg_img_src(ui_Screen_1, &wallpaper_space_png, LV_PART_MAIN);
    ```
- **Property Inspector (saat widget terpilih):** Edit posisi (X, Y via numeric & slider), ukuran (W, H via numeric & scale transform), warna, opacity, border, font size, serta event **On Tap**.
- **Section "On Tap"** — ada di SEMUA widget, default `None`:

  | Pilihan | Efek |
  |---|---|
  | `None` | Widget tidak interaktif |
  | `Navigate to Screen` | Tap → full transition ke screen yang dipilih |
  | `Navigate to Page` | Tap → scroll ke page tertentu dalam screen yang sama |
  | `Toggle Overlay` | Tap → show/hide overlay screen (notif bar, dll) |
  | `Custom Event` | Emit named event string, di-handle manual di C |

  Jika pilih **Navigate to Screen** → dropdown muncul list semua screen di project:
  ```
  On Tap: [Navigate to Screen ▼]
  Screen: [Calculator Screen   ▼]   ← ini yang bikin shortcut ke calc
  Anim:   [Slide Left          ▼]
  ```

  Jika pilih **Navigate to Page** → dropdown pilih page dalam screen mana:
  ```
  On Tap: [Navigate to Page ▼]
  Screen: [Home Screen         ▼]
  Page:   [Page 2 — Apps       ▼]
  ```

  **Ini adalah mekanisme utama shortcut widget** — icon kalkulator di home page → set On Tap = Navigate to Screen → Calculator Screen.

**UX Details — TopBar:**
- Klik nama project → rename inline.
- `Flow` → buka FlowPage (visual map semua screen + koneksi antar screen).
- `Export` → buka modal export + code preview.

---

### 6.3 Flow Page (`/flow`) — Navigation Logic Editor

**Tujuan:** Define alur navigasi antar screen dengan visual flow.

**Layout:**
```
┌─[TopBar: ← Back to Editor | Flow Editor | Auto-layout]──────────┐
│                                                                   │
│  [Minimap]                                                        │
│                                                                   │
│   ┌─────────────┐    swipe_up / slide_up (300ms)                 │
│   │ Home Screen │ ─────────────────────────────→ ┌────────────┐  │
│   │  [preview]  │                                 │ Notif Bar  │  │
│   └─────────────┘                                 └────────────┘  │
│         │                                                         │
│    swipe_left / slide_left                                        │
│         ↓                                                         │
│   ┌─────────────┐                                                 │
│   │  App List   │                                                 │
│   └─────────────┘                                                 │
│                                                                   │
│ [+ Add Screen]  [Auto Layout]  [Reset View]                       │
│                                                                   │
│                    [Right: Edge Config Panel]                     │
│                    ┌──────────────────────────┐                  │
│                    │ Trigger: [swipe_up ▼]    │                  │
│                    │ Anim:    [slide_up ▼]    │                  │
│                    │ Duration: [300ms]        │                  │
│                    └──────────────────────────┘                  │
└───────────────────────────────────────────────────────────────────┘
```

**UX Details:**
- Node = Screen. Berisi thumbnail mini dari canvas content-nya.
- Edge = Transition. Warna berbeda per tipe trigger (swipe: biru, timeout: oranye, button: hijau).
- Klik edge → panel kanan tampil konfigurasi trigger + animasi + durasi.
- Klik node → highlight, bisa rename, atau klik `Edit` untuk kembali ke EditorPage dengan screen tersebut aktif.
- `+ Add Screen` di flow akan sinkron ke BottomBar di EditorPage.
- **Branch types:**
  - **Normal branch:** Edge biasa antar screen (full screen transition)
  - **Overlay branch:** Edge dengan flag `isOverlay: true` → screen tujuan muncul sebagai layer di atas, bukan replace (untuk notif bar, quick settings)

---

### 6.4 Export Page (`/export`)

**Tujuan:** Preview kode yang akan dihasilkan, konfigurasikan opsi export secara dinamis (multi-platform), dan download.

**Layout:**
```
┌─[TopBar: ← Back | Export Project]───────────────────────────────┐
│                                                                   │
│ [Left: Export Settings]      [Right: Code Preview]               │
│ ┌───────────────────────┐    ┌─────────────────────────────┐     │
│ │ Target Device:         │    │ [ui.c] [ui.h] [lv_conf.h]   │     │
│ │ [ESP32-S3    ▼]       │    │ [display_driver.c]          │     │
│ │                        │    │ [touch_driver.c]            │     │
│ │ Target Framework:      │    │ [main.c / sketch.ino]       │     │
│ │ [Arduino Framework   ▼]│    ├─────────────────────────────┤     │
│ │ (Dinamis: IDF / Ardu)  │    │ #include "lvgl.h"           │     │
│ │                        │    │ #include "ui.h"             │     │
│ │ Display Rotation:      │    │                             │     │
│ │ [90° (Landscape)     ▼]│    │ void ui_init(void) {       │     │
│ │                        │    │   scr_home =               │     │
│ │ Buffer Strategy:       │    │     lv_obj_create(NULL);   │     │
│ │ [SRAM (Partial)      ▼]│    │   ...                       │     │
│ │                        │    │ }                           │     │
│ │ Font Bundle:           │    └─────────────────────────────┘     │
│ │ [Montserrat 16 ✓]     │                                         │
│ │ [Montserrat 24 ✓]     │    [Validate Project & Pinout]          │
│ │ [Custom font ...]      │    ✓ 3 screens defined                  │
│ │                        │    ✓ No GPIO conflicts detected        │
│ │ [Download ZIP]         │    ✓ Memory Usage: 82 KB (SRAM) - OK   │
│ └───────────────────────┘                                         │
└───────────────────────────────────────────────────────────────────┘
```

**UX Details:**
- **Target Framework Selector (Multi-Platform):** User dapat memilih target framework (**ESP-IDF** atau **Arduino Framework**) langsung di halaman ekspor ini.
  - Jika memilih **ESP-IDF**, tab preview di kanan akan menampilkan file: `ui.c`, `ui.h`, `display_driver.c`, `touch_driver.c`, `main.c`, `idf_component.yml`, `platformio.ini`, `lv_conf.h`.
  - Jika memilih **Arduino Framework**, tab preview di kanan akan menampilkan file: `ui.c`, `ui.h`, `display_driver.cpp`, `touch_driver.cpp`, `sketch.ino`, `platformio.ini`, `lv_conf.h`.
  - Struktur ZIP yang di-download akan otomatis beradaptasi dengan framework yang dipilih.
- **Display Rotation Selector:** Mengubah nilai `#define DISPLAY_ROTATION` secara dinamis di file `display_driver.h` yang langsung terupdate pada tab code preview.
- **Buffer Strategy Selector:** Memilih antara alokasi **SRAM (Partial slice buffer - hemat RAM & anti OOM)** atau **PSRAM (Full framebuffer + SRAM DMA Bounce Buffer)**.
- **Validation Panel:** Memeriksa kesiapan proyek (unreachable screen, GPIO pin conflict, serta kalkulasi estimasi memori buffer SRAM agar tidak OOM sebelum user mengunduh ZIP).
- **Download ZIP** berisi semua source code yang siap di-load ke VS Code (PlatformIO) sesuai environment terpilih.

---

### 6.5 Settings Page (`/settings`)

**Tujuan:** Konfigurasi global project dan device.

**Sections:**
- **Device Configuration:** Pilih ESP32 variant, display controller (ST7789, GC9A01, ILI9341, dll), interface (SPI/I2C/parallel)
- **Display Resolution:** Pilih dari preset atau input custom (width x height)
- **Display Shape:** Visual card picker — Round / Square / Rounded Square / Rect / Rounded Rect, dengan slider corner radius untuk shape rounded
- **Color Depth:** 16-bit RGB565 / 32-bit ARGB8888
- **LVGL Version:** v8.3 / v8.4
- **Project Info:** Nama project, author, versi

---

## 7. Sistem Node & Branch Logic

> **Catatan:** "Logic Block" yang dimaksud di sini adalah **Flow Page** — halaman visual di `/flow` yang menampilkan semua screen sebagai node dan semua koneksi navigasi sebagai edge/panah. Ini adalah satu-satunya tempat untuk define alur navigasi global antar screen. Navigasi dari widget ke screen tertentu (shortcut) di-define di RightPanel Editor, bukan di Flow Page.

---

### 7.1 Hirarki Project Lengkap

```
PROJECT
├── NORMAL SCREENS (full-screen)
│   │
│   ├── Home Screen  [isRoot: true]
│   │     ├── Page 1 — "Main"          ← jam, tanggal, step counter
│   │     ├── Page 2 — "Apps"          ← grid icon apps (kalkulator, musik, dll)
│   │     │     └── [Icon Kalkulator]  ← On Tap: Navigate to Screen → Calculator
│   │     └── Page 3 — "Info"          ← cuaca, kalender
│   │
│   ├── Calculator Screen  [isRoot: false]
│   │     └── Page 1 — (single page, no scroll)
│   │
│   └── Music Screen  [isRoot: false]
│         ├── Page 1 — "Now Playing"
│         └── Page 2 — "Playlist"
│
└── OVERLAY SCREENS (partial, layer di atas current screen)
    │
    ├── Notification Bar  [overlayPosition: top, overlaySize: 30%]
    │     ├── Page 1 — "Notifications"   ← list notif
    │     └── Page 2 — "Quick Toggles"  ← wifi, bt, do not disturb, brightness
    │
    └── Volume Overlay  [overlayPosition: right, overlaySize: 20%]
          └── Page 1 — slider volume
```

---

### 7.2 Dua Cara Navigasi (Penting Dibedakan)

| Jenis | Di-define di mana | Trigger | Cocok untuk |
|---|---|---|---|
| **Gesture/Global Navigation** | Flow Page (panah antar node) | Swipe, timeout, button fisik | Navigasi utama antar screen |
| **Widget Shortcut** | RightPanel → On Tap | Tap widget tertentu | Icon app → buka app screen |

Keduanya bisa coexist. Contoh: Home Screen punya swipe gesture ke Notif Bar (di Flow Page), SEKALIGUS punya icon kalkulator yang kalau di-tap langsung buka Calculator Screen (di widget On Tap).

---

### 7.3 Flow Page — Visual Navigation Map

Flow Page adalah representasi visual dari semua screen dan koneksinya. Ini bukan tool untuk edit widget — murni untuk define **siapa ke siapa, dengan cara apa, animasi apa**.

```
┌─ Flow Page ──────────────────────────────────────────────────────┐
│                                                                   │
│  ┌──────────────────┐   swipe_up → slide_up (300ms)              │
│  │  🏠 Home Screen  │ ─────────────────────────────→ ┌─────────┐ │
│  │  ┌────────────┐  │                                 │ 🔔 Notif│ │
│  │  │ [preview]  │  │ ←── swipe_down ─────────────── │  Bar    │ │
│  │  └────────────┘  │                                 └─────────┘ │
│  │  Pages: 3        │                                             │
│  └──────────────────┘                                             │
│         │                                                         │
│   swipe_left → slide_left                                         │
│   swipe_right ← slide_right (reverse)                            │
│         ↓                                                         │
│  ┌──────────────────┐                                             │
│  │  📱 Calculator   │                                             │
│  │  Pages: 1        │   ← Bisa juga masuk dari widget shortcut   │
│  └──────────────────┘     (tidak perlu panah di sini)            │
│                                                                   │
│  ┌──────────────────┐                                             │
│  │  🎵 Music Screen │                                             │
│  │  Pages: 2        │                                             │
│  └──────────────────┘                                             │
│                                                                   │
│  [+ Add Screen]  [Auto Layout]  [Reset View]    [Minimap ▼]      │
└───────────────────────────────────────────────────────────────────┘
```

**Keterangan node di Flow Page:**
- Node menampilkan: nama screen, thumbnail preview page 1, jumlah pages, badge tipe (normal/overlay)
- Klik node → panel kanan tampil Screen Config
- Klik `Edit ✏` di node → kembali ke EditorPage dengan screen itu aktif
- Double-click node → rename screen

**Keterangan edge di Flow Page:**
- Warna edge per trigger: swipe (biru), timeout (oranye), button fisik (hijau)
- Edge bisa bidirectional jika `isReversible: true` (panah dua arah)
- Klik edge → panel kanan tampil Edge Config

---

### 7.4 Screen Node Properties (Lengkap)

```json
{
  "id": "uuid-v4",
  "name": "Home Screen",
  "isRoot": true,
  "type": "normal | overlay",

  "scroll": {
    "direction": "none | horizontal | vertical",
    "snapToPage": true,
    "pageIndicator": "dots | none"
  },

  "pages": [
    { "id": "page-uuid-1", "name": "Main",  "widgetIds": ["w1", "w2"] },
    { "id": "page-uuid-2", "name": "Apps",  "widgetIds": ["w3", "w4", "w5"] },
    { "id": "page-uuid-3", "name": "Info",  "widgetIds": ["w6"] }
  ],

  "bgColor": "#000000",

  "overlay": {
    "enabled": false,
    "position": "top | bottom | left | right",
    "sizePercent": 30
  }
}
```

> **Kunci penting:** `pages` adalah array of page objects. Setiap page punya list `widgetIds` sendiri. Widget yang ada di Page 1 tidak otomatis muncul di Page 2 — mereka benar-benar terpisah. Kecuali widget di-set `persistent: true` (lihat bawah).

**Widget Persistent (shared across pages):**
Beberapa widget bisa di-set persistent — tampil di semua page dalam screen yang sama. Berguna untuk: status bar, clock kecil di pojok, tombol back.

```json
{
  "id": "widget-uuid",
  "persistent": true,
  "persistentInScreen": "home-screen-uuid"
}
```

---

### 7.5 Transition Edge Properties (Lengkap)

```json
{
  "id": "uuid-v4",
  "sourceScreenId": "uuid",
  "targetScreenId": "uuid",
  "trigger": "swipe_up | swipe_down | swipe_left | swipe_right | button_press | timeout",
  "animation": "none | slide_left | slide_right | slide_up | slide_down | fade | zoom_in | zoom_out",
  "duration": 300,
  "easing": "linear | ease_in | ease_out | ease_in_out",
  "isReversible": true,
  "reverseAnimation": "slide_down",
  "timeoutMs": null
}
```

---

### 7.6 Widget On Tap Properties (Shortcut)

Setiap widget punya optional `onTap` object yang di-generate jadi event handler di C:

```json
{
  "onTap": {
    "action": "none | navigate_screen | navigate_page | toggle_overlay | custom_event",
    "targetScreenId": "calculator-screen-uuid",
    "targetPageIndex": null,
    "overlayScreenId": null,
    "customEventName": null,
    "animation": "slide_left",
    "duration": 300
  }
}
```

**Generated C code untuk shortcut widget:**

```c
/* Icon kalkulator — On Tap: Navigate to Calculator Screen */
static void btn_calc_icon_event_cb(lv_event_t *e) {
    lv_event_code_t code = lv_event_get_code(e);
    if (code == LV_EVENT_CLICKED) {
        ui_navigate_home_to_calculator();
    }
}

/* Setup event listener saat screen init */
lv_obj_add_event_cb(img_calc_icon, btn_calc_icon_event_cb, LV_EVENT_CLICKED, NULL);
```

---

### 7.7 Page System — Generated LVGL Code

Untuk screen dengan multiple pages, LVGL menggunakan `lv_tileview` (horizontal/vertical scroll dengan snap):

```c
/* Home Screen — 3 pages horizontal */
void ui_screen_home_init(void) {
    scr_home = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr_home, lv_color_hex(0x000000), LV_PART_MAIN);

    /* Tileview sebagai page container */
    lv_obj_t *tv = lv_tileview_create(scr_home);
    lv_obj_set_size(tv, LV_HOR_RES_MAX, LV_VER_RES_MAX);
    lv_obj_set_pos(tv, 0, 0);
    lv_obj_set_style_bg_opa(tv, LV_OPA_TRANSP, LV_PART_MAIN);
    lv_obj_set_style_pad_all(tv, 0, LV_PART_MAIN);

    /* Page 1 — Main */
    lv_obj_t *page_main = lv_tileview_add_tile(tv, 0, 0, LV_DIR_HOR);
    /* ... widget init untuk Page 1 ... */
    lbl_clock_hh = lv_label_create(page_main);
    lv_obj_set_pos(lbl_clock_hh, 40, 95);
    /* ... */

    /* Page 2 — Apps */
    lv_obj_t *page_apps = lv_tileview_add_tile(tv, 1, 0, LV_DIR_HOR);
    /* ... widget init untuk Page 2 ... */
    img_calc_icon = lv_img_create(page_apps);
    lv_obj_set_pos(img_calc_icon, 30, 60);
    lv_obj_add_event_cb(img_calc_icon, btn_calc_icon_event_cb, LV_EVENT_CLICKED, NULL);

    /* Page 3 — Info */
    lv_obj_t *page_info = lv_tileview_add_tile(tv, 2, 0, LV_DIR_HOR);
    /* ... */

    /* Page dot indicator */
    lv_obj_t *dot_indicator = lv_obj_create(scr_home);
    /* ... posisi di bawah tileview ... */
}
```

**Untuk Overlay Screen dengan pages (Notif Bar — 2 pages vertikal... wait, notif biasanya horizontal):**

```c
/* Notification Bar — 2 pages horizontal */
void ui_screen_notifbar_init(void) {
    scr_notifbar = lv_obj_create(NULL);
    lv_obj_set_size(scr_notifbar, LV_HOR_RES_MAX, LV_VER_RES_MAX * 30 / 100); /* 30% tinggi */

    lv_obj_t *tv_notif = lv_tileview_create(scr_notifbar);
    lv_obj_set_size(tv_notif, LV_HOR_RES_MAX, LV_VER_RES_MAX * 30 / 100);

    /* Page 1 — Notifications list */
    lv_obj_t *page_notif = lv_tileview_add_tile(tv_notif, 0, 0, LV_DIR_HOR);

    /* Page 2 — Quick Toggles (WiFi, BT, DND) */
    lv_obj_t *page_toggles = lv_tileview_add_tile(tv_notif, 1, 0, LV_DIR_HOR);
}
```

---

## 8. Widget Library & Template

### 8.1 Basic Widgets

| Widget | Properti | Lock? |
|---|---|---|
| `Text` | content, font, size, color, align | Tidak ada lock |
| `Rectangle` | width, height, bgColor, borderRadius, borderColor | Tidak ada lock |
| `Button` | label, font, bgColor, pressColor, borderRadius | Tidak ada lock |
| `Image` | src (path), width, height, fit | Tidak ada lock |
| `Line` | x1,y1,x2,y2, color, thickness | Tidak ada lock |
| `Keyboard` | layout, keyBgColor, keyTextColor, keyPressColor, borderRadius, textAreaTarget | Tidak ada lock |

### 8.2 Compound Widgets (Sub-element editable)

#### Clock Widget
```
Sub-elements:
  HH         → posisi, font, ukuran, warna     [BEBAS EDIT]
  separator  → karakter (":"), posisi, warna   [BEBAS EDIT]
  MM         → posisi, font, ukuran, warna     [BEBAS EDIT]

Locked:
  Format output → selalu "HH:MM" (24h atau 12h toggle)
  Data source   → system time (tidak bisa diubah ke manual)
```

#### Date Widget
```
Sub-elements:
  day_name   → "MON", "TUE", dll — posisi, font, warna  [BEBAS EDIT]
  day_num    → "01"-"31"         — posisi, font, warna  [BEBAS EDIT]
  month      → "JAN" atau "01"   — posisi, font, warna  [BEBAS EDIT]
  year       → "2025"            — posisi, font, warna  [BEBAS EDIT]

Locked:
  Format source → system RTC (tidak bisa diubah)
```

#### Notification Bar Widget
```
Sub-elements:
  status_icons  → battery, wifi, bluetooth — toggle visibility
  time_mini     → jam mini di notif bar
  notif_content → area konten notifikasi

Locked:
  Height → 20-30px (configurable range, tidak bisa < 20px)
```

### 8.3 Data Widgets

| Widget | Config | Preview Value |
|---|---|---|
| `LineChart` | warna garis, bg, label axis, range | Data dummy auto-generated |
| `BarProgress` | warna fill, direction, min/max, border radius | Value 60% default |
| `Gauge/Arc` | range min/max, warna arc, warna needle, label | Value 75 default |
| `HeartRate` | warna icon, warna teks, unit label | "72 BPM" |
| `StepCounter` | warna icon, warna teks, goal highlight | "4,231 steps" |
| `Battery` | style (bar/circular/numeric), warna level | 80% |
| `WeatherIcon` | icon set, warna, size | Sunny icon |

### 8.4 Keyboard Widget (Detail)

Keyboard adalah widget khusus yang punya banyak konfigurasi layout dan style. Karena smartwatch biasanya punya layar kecil, keyboard harus bisa dikonfigurasi seminimal mungkin sesuai kebutuhan.

#### Layout Modes

| Mode | Isi | Use Case |
|---|---|---|
| `QWERTY` | Keyboard full alfanumerik | Input teks umum |
| `NUMPAD` | 0-9 + operator dasar (+ - × ÷ =) | Kalkulator, PIN |
| `PIN` | 0-9 saja, layout 3×3 + 0 | PIN entry, passcode |
| `PHONE` | Layout dial pad (1-9, *, 0, #) | Dialer app |
| `SPECIAL` | Simbol & tanda baca | Input URL / password |
| `CUSTOM` | User define sendiri key per baris | Bebas |

#### Sub-element yang bisa diedit

```
Keyboard Widget
  ├── container          → bgColor, padding, borderRadius, border
  ├── key_default        → bgColor, textColor, font, borderRadius  [BEBAS EDIT]
  ├── key_special        → bgColor berbeda untuk Backspace/Enter   [BEBAS EDIT]
  ├── key_pressed        → warna saat ditekan (feedback visual)    [BEBAS EDIT]
  ├── key_size           → ukuran tiap key (auto atau manual px)   [BEBAS EDIT]
  └── key_gap            → jarak antar key horizontal & vertical   [BEBAS EDIT]

Locked:
  Fungsi key    → karakter yang dikirim tiap key tidak bisa diubah
                  (kecuali mode CUSTOM)
  Event system  → selalu link ke lv_textarea yang ditunjuk
```

#### Konfigurasi Target TextArea

Keyboard harus di-link ke `TextArea` widget di screen yang sama. Di panel kanan:
- Dropdown: **"Linked TextArea"** → pilih TextArea widget yang ada di screen
- Jika belum ada TextArea → tombol shortcut **"+ Add TextArea"** langsung insert widget

#### Custom Layout (mode CUSTOM)

User bisa define layout keyboard sendiri via editor grid kecil di RightPanel:
```
Row 1: [Q][W][E][R][T][Y][U][I][O][P]
Row 2:  [A][S][D][F][G][H][J][K][L]
Row 3: [⇧][Z][X][C][V][B][N][M][⌫]
Row 4:    [space_bar_________][⏎]
```
- Klik cell → ganti karakter / simbol
- Drag untuk merge cell (space bar panjang)
- Tambah/hapus row

#### Generated LVGL Code (Keyboard)

```c
/* Keyboard Widget — NUMPAD layout */
static lv_obj_t *kb_pin_entry;

kb_pin_entry = lv_keyboard_create(scr_home);
lv_obj_set_pos(kb_pin_entry, 0, 120);
lv_obj_set_size(kb_pin_entry, 240, 120);
lv_keyboard_set_mode(kb_pin_entry, LV_KEYBOARD_MODE_NUMBER);

/* Style: key background */
static lv_style_t style_kb_btn;
lv_style_init(&style_kb_btn);
lv_style_set_bg_color(&style_kb_btn, lv_color_hex(0x1E1E1E));
lv_style_set_text_color(&style_kb_btn, lv_color_hex(0xFFFFFF));
lv_style_set_radius(&style_kb_btn, 8);
lv_obj_add_style(kb_pin_entry, &style_kb_btn, LV_PART_ITEMS);

/* Style: key pressed */
static lv_style_t style_kb_btn_pressed;
lv_style_init(&style_kb_btn_pressed);
lv_style_set_bg_color(&style_kb_btn_pressed, lv_color_hex(0x3A86FF));
lv_obj_add_style(kb_pin_entry, &style_kb_btn_pressed, LV_PART_ITEMS | LV_STATE_PRESSED);

/* Link ke TextArea */
lv_keyboard_set_textarea(kb_pin_entry, ta_pin_input);
```

---

### 8.5 Widget Template Rules

- **Locked property:** Rendered dengan ikon 🔒 di panel kanan, tidak bisa diubah
- **Editable property:** Rendered dengan input normal
- **Sub-element navigation:** Klik sub-element di canvas → panel kanan otomatis switch ke property sub-element itu
- **Reset to default:** Setiap widget punya tombol "Reset" untuk kembalikan ke template default

---

## 9. Export Engine

### Output Files

```
project_export.zip
├── ui.c                  ← semua screen + widget init code
├── ui.h                  ← function declarations + extern
├── lv_conf.h             ← LVGL config sesuai device yang dipilih
└── README_integration.md ← cara integrate ke project ESP-IDF/Arduino
```

### Sample Generated Code (`ui.c`)

```c
#include "lvgl.h"
#include "ui.h"

/* === SCREENS === */
lv_obj_t *scr_home;
lv_obj_t *scr_applist;
lv_obj_t *scr_notifbar;

/* === WIDGETS === */
/* Home Screen */
static lv_obj_t *lbl_clock_hh;
static lv_obj_t *lbl_clock_mm;
static lv_obj_t *lbl_date;

void ui_screen_home_init(void) {
    scr_home = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr_home, lv_color_hex(0x000000), LV_PART_MAIN);

    /* Clock - HH */
    lbl_clock_hh = lv_label_create(scr_home);
    lv_obj_set_pos(lbl_clock_hh, 40, 95);
    lv_obj_set_style_text_color(lbl_clock_hh, lv_color_hex(0xFFFFFF), LV_PART_MAIN);
    lv_obj_set_style_text_font(lbl_clock_hh, &lv_font_montserrat_48, LV_PART_MAIN);
    lv_label_set_text(lbl_clock_hh, "12");

    /* Clock - MM */
    lbl_clock_mm = lv_label_create(scr_home);
    lv_obj_set_pos(lbl_clock_mm, 130, 95);
    lv_obj_set_style_text_color(lbl_clock_mm, lv_color_hex(0xFFFFFF), LV_PART_MAIN);
    lv_obj_set_style_text_font(lbl_clock_mm, &lv_font_montserrat_48, LV_PART_MAIN);
    lv_label_set_text(lbl_clock_mm, "00");
}

/* === NAVIGATION === */
static lv_indev_t *touch_indev;

void ui_navigation_init(void) {
    /* Home → Notification Bar (swipe up) */
    /* Implemented via lv_scr_load_anim */
}

void ui_navigate_home_to_notifbar(void) {
    lv_scr_load_anim(scr_notifbar, LV_SCR_LOAD_ANIM_MOVE_TOP, 300, 0, false);
}

void ui_init(void) {
    ui_screen_home_init();
    ui_screen_applist_init();
    ui_screen_notifbar_init();
    ui_navigation_init();
    lv_scr_load(scr_home);
}
```

### Codegen Flow

```
Zustand Project State
        │
        ▼
  validator.js → check errors/warnings
        │
        ▼
  codegen/index.js
    ├── screenGenerator.js  → generate screen init functions
    ├── widgetGenerator.js  → generate per-widget code blocks
    ├── animGenerator.js    → generate lv_anim_t definitions
    ├── navigationGenerator.js → generate screen transition handlers
    └── fontGenerator.js   → generate font includes + extern declarations
        │
        ▼
  Handlebars templates → render final .c / .h files
        │
        ▼
  JSZip → bundle ke .zip → download
```

---

## 10. Display & Resolution Config

### Device Presets (`data/devices.json`)

```json
{
  "devices": [
    {
      "id": "esp32s3_gc9a01_240",
      "name": "ESP32-S3 + GC9A01 (240x240 Round)",
      "chip": "ESP32-S3",
      "display_controller": "GC9A01",
      "interface": "SPI",
      "width": 240,
      "height": 240,
      "shape": "round",
      "color_depth": 16,
      "lvgl_hor_res": 240,
      "lvgl_ver_res": 240,
      "swap_rgb": true,
      "notes": "Popular round smartwatch display"
    },
    {
      "id": "esp32s3_st7789_240",
      "name": "ESP32-S3 + ST7789 (240x240 Square)",
      "chip": "ESP32-S3",
      "display_controller": "ST7789",
      "interface": "SPI",
      "width": 240,
      "height": 240,
      "shape": "square",
      "color_depth": 16,
      "lvgl_hor_res": 240,
      "lvgl_ver_res": 240,
      "swap_rgb": false,
      "notes": "Common square smartwatch display"
    },
    {
      "id": "esp32s3_ili9341_320x240",
      "name": "ESP32-S3 + ILI9341 (320x240)",
      "chip": "ESP32-S3",
      "display_controller": "ILI9341",
      "interface": "SPI",
      "width": 320,
      "height": 240,
      "shape": "rect",
      "color_depth": 16,
      "lvgl_hor_res": 320,
      "lvgl_ver_res": 240,
      "swap_rgb": false,
      "notes": "Landscape rectangle display"
    },
    {
      "id": "esp32s3_st7789_170x320",
      "name": "ESP32-S3 + ST7789 (170x320 Tall)",
      "chip": "ESP32-S3",
      "display_controller": "ST7789",
      "interface": "SPI",
      "width": 170,
      "height": 320,
      "shape": "rect",
      "color_depth": 16,
      "lvgl_hor_res": 170,
      "lvgl_ver_res": 320,
      "swap_rgb": true,
      "notes": "Portrait tall display"
    },
    {
      "id": "custom",
      "name": "Custom Resolution",
      "chip": "ESP32-S3",
      "display_controller": "custom",
      "interface": "SPI",
      "width": null,
      "height": null,
      "shape": "rect",
      "color_depth": 16,
      "notes": "User-defined resolution"
    }
  ]
}
```

### Display Shape System

Display shape adalah properti **terpisah dari resolusi** — artinya shape hanya mempengaruhi bagaimana canvas di-clip di preview editor, bukan nilai koordinat yang di-export. Kode LVGL yang dihasilkan tetap berdasarkan pixel width/height penuh.

#### Shape Types

| Shape | Nilai | Deskripsi | Contoh Display |
|---|---|---|---|
| `round` | `shape: "round"` | Lingkaran penuh — clip radius = 50% | GC9A01, beberapa Amoled round |
| `square` | `shape: "square"` | Persegi dengan sudut tajam (radius 0) | ST7789 240x240 |
| `rounded_square` | `shape: "rounded_square"` | Persegi dengan sudut membulat (custom radius) | Apple Watch style |
| `rect` | `shape: "rect"` | Persegi panjang sudut tajam | ILI9341 320x240 |
| `rounded_rect` | `shape: "rounded_rect"` | Persegi panjang sudut membulat | Display modern |

Untuk `rounded_square` dan `rounded_rect`, ada properti tambahan:
```json
{
  "shape": "rounded_rect",
  "corner_radius": 24
}
```

#### UI Display Shape Picker (di Settings Page)

Shape picker ditampilkan sebagai **visual card selector**, bukan dropdown teks. User klik kartu bentuk yang diinginkan, preview di kanan langsung berubah:

```
┌──────────────────────────────────────────────────────────┐
│ Display Shape                                            │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌───┐ │
│  │  ●●●   │  │ ▪▪▪▪▪  │  │ ╭───╮  │  │ ▪▪▪▪▪▪ │  │╭─╮│ │
│  │ ●   ●  │  │ ▪   ▪  │  │ │   │  │  │ ▪    ▪ │  ││ ││ │
│  │  ●●●   │  │ ▪▪▪▪▪  │  │ ╰───╯  │  │ ▪▪▪▪▪▪ │  │╰─╯│ │
│  └────────┘  └────────┘  └────────┘  └────────┘  └───┘ │
│    Round      Square     Rounded      Rect       Rounded │
│   [aktif]               Square                   Rect   │
│                                                          │
│  Corner Radius: ────●─────── 24px  [hanya muncul jika   │
│                                     shape rounded]       │
│                                                          │
│  Preview:  ╭──────────╮                                  │
│            │          │  ← frame preview langsung update │
│            │  240x240  │                                  │
│            ╰──────────╯                                  │
└──────────────────────────────────────────────────────────┘
```

#### Custom Resolution + Shape Picker (Gabungan)

Di Settings page, alur config device lengkap:

```
┌─ Device Configuration ──────────────────────────────────────┐
│                                                              │
│  1. Preset Device                                            │
│     [ESP32-S3 + GC9A01 240x240 ▼]  atau  [Custom]          │
│                                                              │
│  2. Resolution (otomatis terisi dari preset, atau manual)   │
│     Width:  [240] px    Height: [240] px                    │
│                                                              │
│  3. Display Shape    ← VISUAL CARD PICKER                   │
│     ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│     │  ○   │ │  □   │ │  ▢   │ │  ▬   │ │  ▭   │          │
│     │Round │ │Sq    │ │Rnd Sq│ │ Rect │ │Rnd Rt│          │
│     └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                              │
│     [jika rounded dipilih]                                   │
│     Corner Radius: ──●──── 20px                             │
│                                                              │
│  4. Color Depth  [16-bit RGB565 ▼]                          │
│  5. Interface    [SPI ▼]                                     │
│                                                              │
│  [Apply]  ← update canvas frame & export config sekaligus  │
└──────────────────────────────────────────────────────────────┘
```

#### DeviceFrame SVG per Shape

File SVG di `src/components/DeviceFrame/frames/` dibuat satu per kombinasi shape:

```
frames/
├── round.svg           ← clip-path lingkaran
├── square.svg          ← clip-path persegi
├── rounded_square.svg  ← clip-path dengan corner-radius variable
├── rect_landscape.svg  ← clip-path landscape
├── rect_portrait.svg   ← clip-path portrait
└── rounded_rect.svg    ← clip-path rect dengan corner-radius variable
```

SVG frame ini hanya bertugas sebagai **visual clip mask** — canvas Konva di dalamnya tetap render pada koordinat 0,0 ke width×height penuh. Shape tidak mempengaruhi koordinat widget sama sekali.

#### Export Impact dari Shape

Shape **tidak menghasilkan kode tambahan** di `ui.c` — karena hardware display sudah handle bentuk fisiknya. Yang berubah hanya `lv_conf.h`:

```c
/* Untuk round display: tambahkan mask arc di lv_conf */
/* Catatan di README_integration.md: */
// Round display (GC9A01) tidak butuh software clip.
// Hardware display sudah berbentuk bulat secara fisik.
// Widget yang ditempatkan di sudut layar akan terpotong secara fisik.
// Gunakan tool "Round Safe Zone" di editor untuk visualisasi area aman.
```

> **Round Safe Zone:** Ketika shape = `round`, editor otomatis overlay lingkaran putus-putus di canvas untuk menunjukkan batas aman area yang terlihat. Widget di luar safe zone tetap bisa diletakkan tapi akan ada warning "⚠ partially clipped on round display".

### lv_conf.h Template (Handlebars)

```c
/* Generated by WatchForge */
#ifndef LV_CONF_H
#define LV_CONF_H

#define LV_HOR_RES_MAX   {{device.width}}
#define LV_VER_RES_MAX   {{device.height}}
#define LV_COLOR_DEPTH   {{device.color_depth}}

{{#if device.swap_rgb}}
#define LV_COLOR_16_SWAP 1
{{else}}
#define LV_COLOR_16_SWAP 0
{{/if}}

/* Font configs */
{{#each usedFonts}}
#define LV_FONT_MONTSERRAT_{{this}} 1
{{/each}}

#define LV_USE_ANIMATION 1
#define LV_USE_LABEL     1
#define LV_USE_ARC       1
#define LV_USE_CHART     1
#define LV_USE_BTN       1
#define LV_USE_IMG       1

#endif
```

### Canvas Scaling Logic

Ketika resolusi device berubah, canvas di EditorPage harus:
1. Resize frame SVG sesuai aspek rasio device
2. Scale semua widget koordinat (bukan ubah nilai — hanya scale visual preview)
3. Nilai `x, y, w, h` yang disimpan selalu dalam pixel asli device (tidak di-scale)

---

## 11. State Management & Data Model

### Store Overview

```
useProjectStore
  ├── projectName: string
  ├── screens: Screen[]
  ├── activeScreenId: string
  ├── history: Snapshot[]       ← untuk undo/redo
  ├── historyIndex: number
  └── actions: addScreen, removeScreen, setActiveScreen, undo, redo

useWidgetStore
  ├── widgets: Record<screenId, Widget[]>
  └── actions: addWidget, removeWidget, updateWidget, moveWidget, duplicateWidget

useFlowStore
  ├── nodes: FlowNode[]          ← ReactFlow nodes
  ├── edges: FlowEdge[]          ← ReactFlow edges (= transitions)
  └── actions: addEdge, removeEdge, updateEdgeConfig, syncFromProjectStore

useDeviceStore
  ├── selectedDevice: Device
  ├── customWidth: number
  ├── customHeight: number
  ├── shape: "round" | "square" | "rounded_square" | "rect" | "rounded_rect"
  ├── cornerRadius: number              ← aktif hanya jika shape = rounded_*
  ├── displayDriverId: string           ← id dari drivers.json, e.g. "co5300_qspi"
  ├── touchDriverId: string             ← id dari drivers.json, e.g. "cst9217_i2c"
  ├── driverConfig: object              ← nilai GPIO pin dari GPIO Pin Mapper
  └── actions: setDevice, setCustomResolution, setShape, setCornerRadius,
               setDisplayDriver, setTouchDriver, updateDriverConfig
```

### Sinkronisasi Editor ↔ Flow

- Ketika screen ditambah di EditorPage → `useProjectStore.addScreen()` → FlowPage auto-render node baru
- Ketika screen dihapus → node di flow ikut hilang + semua edge yang connect ke screen itu dihapus
- Nama screen di-rename di salah satu tempat → sinkron ke semua tempat via store

---

## 12. Animation System

### Animation Presets (`data/animationPresets.json`)

```json
{
  "presets": [
    { "id": "none",        "label": "None",       "lvgl": "LV_SCR_LOAD_ANIM_NONE" },
    { "id": "slide_left",  "label": "Slide Left",  "lvgl": "LV_SCR_LOAD_ANIM_MOVE_LEFT" },
    { "id": "slide_right", "label": "Slide Right", "lvgl": "LV_SCR_LOAD_ANIM_MOVE_RIGHT" },
    { "id": "slide_up",    "label": "Slide Up",    "lvgl": "LV_SCR_LOAD_ANIM_MOVE_TOP" },
    { "id": "slide_down",  "label": "Slide Down",  "lvgl": "LV_SCR_LOAD_ANIM_MOVE_BOTTOM" },
    { "id": "fade",        "label": "Fade",        "lvgl": "LV_SCR_LOAD_ANIM_FADE_ON" },
    { "id": "zoom_in",     "label": "Zoom In",     "lvgl": "LV_SCR_LOAD_ANIM_ZOOM_IN" },
    { "id": "zoom_out",    "label": "Zoom Out",    "lvgl": "LV_SCR_LOAD_ANIM_ZOOM_OUT" }
  ]
}
```

### Generated Animation Code

Setiap transition edge menghasilkan fungsi:
```c
// Dari: Home → NotifBar | trigger: swipe_up | anim: slide_up | duration: 300ms
void ui_navigate_home_to_notifbar(void) {
    lv_scr_load_anim(
        scr_notifbar,
        LV_SCR_LOAD_ANIM_MOVE_TOP,
        300,   // duration ms
        0,     // delay ms
        false  // auto delete old screen
    );
}
```

### Overlay Animation

Untuk notif bar / quick settings (overlay branch):
```c
// Overlay: tidak replace screen, tapi slide partial layer
void ui_show_notifbar(void) {
    lv_obj_set_y(scr_notifbar, -LV_VER_RES_MAX); // mulai dari atas layar
    lv_obj_set_hidden(scr_notifbar, false);

    lv_anim_t a;
    lv_anim_init(&a);
    lv_anim_set_exec_cb(&a, (lv_anim_exec_xcb_t)lv_obj_set_y);
    lv_anim_set_var(&a, scr_notifbar);
    lv_anim_set_values(&a, -LV_VER_RES_MAX, 0);
    lv_anim_set_time(&a, 300);
    lv_anim_set_path_cb(&a, lv_anim_path_ease_out);
    lv_anim_start(&a);
}
```

---

## 13. Driver HAL System (Hardware Abstraction Layer)

### Konteks & Masalah

LVGL adalah **rendering engine** — dia hanya tahu cara gambar pixel ke buffer. Dia tidak tahu cara mengirim buffer itu ke display fisik, dan tidak tahu cara baca koordinat sentuh dari touchscreen.

Yang menghubungkan LVGL ke hardware adalah dua callback yang harus user daftarkan:
- `lv_disp_drv_t` → flush callback → kirim framebuffer ke display controller
- `lv_indev_drv_t` → read callback → baca koordinat dari touchscreen

Untuk display dan touch standar (ST7789, ILI9341, XPT2046), ada banyak contoh di internet. Tapi untuk library custom seperti `esp_lcd_co5300` (QSPI AMOLED) atau `esp_lcd_touch_cst9217` (I2C capacitive), inisialisasinya beda dan spesifik.

**Solusi WatchForge:** Export engine harus generate **3 layer kode terpisah**:

```
Layer 1: ui.c / ui.h          ← murni LVGL widget code (tidak berubah apapun driver-nya)
Layer 2: display_driver.c/h   ← inisialisasi hardware display + flush callback
Layer 3: touch_driver.c/h     ← inisialisasi hardware touch + read callback
```

Layer 1 sama persis untuk semua device. Layer 2 dan 3 di-generate berdasarkan display controller dan touch IC yang dipilih di Settings.

---

### Driver Registry (`data/drivers.json`)

Ini adalah "database" driver yang WatchForge tahu cara generate-nya. Bisa diperluas dengan pull request / community contribution.

```json
{
  "display_drivers": [
    {
      "id": "co5300_qspi",
      "name": "CO5300 (QSPI AMOLED)",
      "idf_component": "kodediy/esp_lcd_co5300",
      "idf_version": "^1.0.2",
      "interface": "QSPI",
      "notes": "AMOLED panel CO5300AF-51, digunakan di smartwatch custom. Butuh esp-idf >= 5.1",
      "init_params": [
        { "key": "qspi_host",     "type": "spi_host_device_t", "default": "SPI2_HOST" },
        { "key": "clk_gpio",      "type": "int", "default": 12 },
        { "key": "d0_gpio",       "type": "int", "default": 13 },
        { "key": "d1_gpio",       "type": "int", "default": 14 },
        { "key": "d2_gpio",       "type": "int", "default": 15 },
        { "key": "d3_gpio",       "type": "int", "default": 16 },
        { "key": "cs_gpio",       "type": "int", "default": 11 },
        { "key": "reset_gpio",    "type": "int", "default": 10 },
        { "key": "pclk_mhz",     "type": "int", "default": 80 },
        { "key": "width",         "type": "int", "default": 194 },
        { "key": "height",        "type": "int", "default": 368 }
      ],
      "template_file": "display_co5300_qspi.c.hbs"
    },
    {
      "id": "gc9a01_spi",
      "name": "GC9A01 (SPI Round 240x240)",
      "idf_component": null,
      "interface": "SPI",
      "notes": "Built-in ESP-IDF LCD driver via esp_lcd panel API",
      "init_params": [
        { "key": "spi_host",   "type": "spi_host_device_t", "default": "SPI2_HOST" },
        { "key": "clk_gpio",   "type": "int", "default": 18 },
        { "key": "mosi_gpio",  "type": "int", "default": 23 },
        { "key": "cs_gpio",    "type": "int", "default": 15 },
        { "key": "dc_gpio",    "type": "int", "default": 2 },
        { "key": "reset_gpio", "type": "int", "default": 4 },
        { "key": "bl_gpio",    "type": "int", "default": 5 },
        { "key": "pclk_mhz",  "type": "int", "default": 40 }
      ],
      "template_file": "display_gc9a01_spi.c.hbs"
    },
    {
      "id": "st7789_spi",
      "name": "ST7789 (SPI)",
      "idf_component": null,
      "interface": "SPI",
      "notes": "Built-in ESP-IDF LCD driver",
      "init_params": [
        { "key": "spi_host",   "type": "spi_host_device_t", "default": "SPI2_HOST" },
        { "key": "clk_gpio",   "type": "int", "default": 18 },
        { "key": "mosi_gpio",  "type": "int", "default": 23 },
        { "key": "cs_gpio",    "type": "int", "default": 15 },
        { "key": "dc_gpio",    "type": "int", "default": 2 },
        { "key": "reset_gpio", "type": "int", "default": 4 },
        { "key": "bl_gpio",    "type": "int", "default": 5 },
        { "key": "pclk_mhz",  "type": "int", "default": 40 }
      ],
      "template_file": "display_st7789_spi.c.hbs"
    },
    {
      "id": "ili9341_spi",
      "name": "ILI9341 (SPI)",
      "idf_component": null,
      "interface": "SPI",
      "notes": "Built-in ESP-IDF LCD driver",
      "init_params": [
        { "key": "spi_host",   "type": "spi_host_device_t", "default": "SPI2_HOST" },
        { "key": "clk_gpio",   "type": "int", "default": 18 },
        { "key": "mosi_gpio",  "type": "int", "default": 23 },
        { "key": "cs_gpio",    "type": "int", "default": 15 },
        { "key": "dc_gpio",    "type": "int", "default": 2 },
        { "key": "reset_gpio", "type": "int", "default": 4 },
        { "key": "bl_gpio",    "type": "int", "default": 5 }
      ],
      "template_file": "display_ili9341_spi.c.hbs"
    }
  ],
  "touch_drivers": [
    {
      "id": "cst9217_i2c",
      "name": "CST9217 (I2C Capacitive)",
      "idf_component": "waveshare/esp_lcd_touch_cst9217",
      "idf_version": "^1.0.3",
      "interface": "I2C",
      "notes": "Capacitive touch untuk AMOLED panel. Multi-touch support.",
      "init_params": [
        { "key": "i2c_port",   "type": "i2c_port_t", "default": "I2C_NUM_0" },
        { "key": "sda_gpio",   "type": "int", "default": 6 },
        { "key": "scl_gpio",   "type": "int", "default": 7 },
        { "key": "int_gpio",   "type": "int", "default": 21 },
        { "key": "rst_gpio",   "type": "int", "default": -1 },
        { "key": "i2c_freq",   "type": "int", "default": 400000 }
      ],
      "template_file": "touch_cst9217_i2c.c.hbs"
    },
    {
      "id": "ft5x06_i2c",
      "name": "FT5x06 (I2C Capacitive)",
      "idf_component": null,
      "interface": "I2C",
      "notes": "Capacitive touch FocalTech series, built-in ESP-IDF",
      "init_params": [
        { "key": "i2c_port",   "type": "i2c_port_t", "default": "I2C_NUM_0" },
        { "key": "sda_gpio",   "type": "int", "default": 6 },
        { "key": "scl_gpio",   "type": "int", "default": 7 },
        { "key": "int_gpio",   "type": "int", "default": 21 }
      ],
      "template_file": "touch_ft5x06_i2c.c.hbs"
    },
    {
      "id": "xpt2046_spi",
      "name": "XPT2046 (SPI Resistive)",
      "idf_component": null,
      "interface": "SPI",
      "notes": "Resistive touch controller, umum di display murah",
      "init_params": [
        { "key": "spi_host",   "type": "spi_host_device_t", "default": "SPI2_HOST" },
        { "key": "cs_gpio",    "type": "int", "default": 5 },
        { "key": "irq_gpio",   "type": "int", "default": 36 }
      ],
      "template_file": "touch_xpt2046_spi.c.hbs"
    },
    {
      "id": "none",
      "name": "No Touchscreen",
      "idf_component": null,
      "notes": "Display tanpa touch, navigasi via button fisik saja",
      "template_file": null
    }
  ]
}
```

---

### GPIO Pin Mapper (UI di Settings Page)

Setelah user pilih display driver dan touch driver, WatchForge menampilkan **GPIO Pin Mapper** — form interaktif yang pre-fill dengan nilai default dari `drivers.json`, tapi bisa diubah user sesuai wiring PCB mereka.

```
┌─ GPIO Pin Configuration ─────────────────────────────────────────┐
│                                                                   │
│  Display Driver: CO5300 (QSPI AMOLED)                            │
│  ┌──────────────┬──────┐  ┌──────────────┬──────┐               │
│  │ QSPI CLK     │ [12] │  │ QSPI D0      │ [13] │               │
│  │ QSPI D1      │ [14] │  │ QSPI D2      │ [15] │               │
│  │ QSPI D3      │ [16] │  │ CS           │ [11] │               │
│  │ RESET        │ [10] │  │ PCLK MHz     │ [80] │               │
│  └──────────────┴──────┘  └──────────────┴──────┘               │
│                                                                   │
│  Touch Driver: CST9217 (I2C Capacitive)                          │
│  ┌──────────────┬──────┐  ┌──────────────┬──────┐               │
│  │ I2C SDA      │ [ 6] │  │ I2C SCL      │ [ 7] │               │
│  │ INT GPIO     │ [21] │  │ RST GPIO     │ [-1] │               │
│  │ I2C Freq Hz  │[400000]│                                       │
│  └──────────────┴──────┘                                         │
│                                                                   │
│  ⚠ Pastikan pin ini sesuai dengan PCB lo sebelum flash!          │
│                                                                   │
│  [Reset to Default]                    [Save & Continue →]       │
└───────────────────────────────────────────────────────────────────┘
```

Nilai dari form ini disimpan ke `useDeviceStore.driverConfig` dan dipakai saat export generate `display_driver.c`.

---

### Export Output Lengkap (berdasarkan Target Framework)

Struktur ZIP hasil ekspor akan menyesuaikan secara dinamis dengan target framework yang dipilih oleh user pada **Export Page**:

#### Opsi 1: ESP-IDF Target (PlatformIO / ESP-IDF project structure)
```
project_export.zip
├── platformio.ini              ← Konfigurasi PlatformIO untuk target env esp32s3-idf
├── sdkconfig.defaults          ← Konfigurasi flash, partition, dll.
├── idf_component.yml           ← Dependensi driver registry (kodediy/esp_lcd_co5300, dll.)
├── lv_conf.h                   ← LVGL config (resolusi, kedalaman warna, dipetakan otomatis)
├── README_integration.md       ← Panduan instalasi dan compile di ESP-IDF
├── main/
│   ├── main.c                  ← Entry point ESP-IDF (app_main, init driver + LVGL loop)
│   └── CMakeLists.txt          ← Build system main component
├── drivers/
│   ├── display_driver.c        ← Inisialisasi display controller + flush callback (esp_lcd)
│   ├── display_driver.h        ← Header driver display (berisi DISPLAY_ROTATION macro)
│   ├── touch_driver.c          ← Inisialisasi touch controller + read callback (esp_lcd)
│   └── touch_driver.h
└── ui/
    ├── ui.c                    ← Murni LVGL UI widgets rendering code (C/H)
    └── ui.h
```

#### Opsi 2: Arduino Framework Target (PlatformIO / Arduino IDE structure)
```
project_export.zip
├── platformio.ini              ← Konfigurasi PlatformIO untuk target env esp32s3-arduino
├── sketch.ino                  ← Entry point Arduino (setup() & loop() utama)
├── lv_conf.h                   ← LVGL config
├── README_integration.md       ← Panduan instalasi dan compile di Arduino IDE / PIO
├── drivers/
│   ├── display_driver.cpp      ← Inisialisasi LCD (menggunakan LovyanGFX / Arduino wrapper)
│   ├── display_driver.h        ← Header driver display (berisi DISPLAY_ROTATION macro)
│   ├── touch_driver.cpp        ← Inisialisasi touch (menggunakan Arduino Wire/I2C wrapper)
│   └── touch_driver.h
└── ui/
    ├── ui.c                    ← LVGL UI widgets rendering code (C/H)
    └── ui.h
```

---

### Generated `display_driver.c` untuk CO5300 (QSPI)

```c
/*
 * display_driver.c
 * Generated by WatchForge
 * Driver: CO5300 AMOLED via QSPI
 * Library: kodediy/esp_lcd_co5300 ^1.0.2
 */

#include "display_driver.h"
#include "esp_lcd_panel_io.h"
#include "esp_lcd_panel_ops.h"
#include "esp_lcd_co5300.h"
#include "lvgl.h"

/* === GPIO Config (sesuai pengaturan di WatchForge) === */
#define DISP_QSPI_CLK   12
#define DISP_QSPI_D0    13
#define DISP_QSPI_D1    14
#define DISP_QSPI_D2    15
#define DISP_QSPI_D3    16
#define DISP_CS         11
#define DISP_RESET      10
#define DISP_PCLK_MHZ  80
#define DISP_WIDTH      194
#define DISP_HEIGHT     368

static esp_lcd_panel_handle_t panel_handle = NULL;
static lv_disp_draw_buf_t disp_buf;
static lv_color_t *buf1 = NULL;

/* LVGL flush callback — dipanggil LVGL setiap frame siap dikirim */
static void lvgl_flush_cb(lv_disp_drv_t *drv, const lv_area_t *area, lv_color_t *color_map) {
    esp_lcd_panel_draw_bitmap(panel_handle,
        area->x1, area->y1,
        area->x2 + 1, area->y2 + 1,
        color_map);
    lv_disp_flush_ready(drv);
}

void display_driver_init(void) {
    /* 1. Init QSPI bus */
    spi_bus_config_t bus_cfg = {
        .sclk_io_num     = DISP_QSPI_CLK,
        .data0_io_num    = DISP_QSPI_D0,
        .data1_io_num    = DISP_QSPI_D1,
        .data2_io_num    = DISP_QSPI_D2,
        .data3_io_num    = DISP_QSPI_D3,
        .max_transfer_sz = DISP_WIDTH * 80 * sizeof(lv_color_t),
    };
    ESP_ERROR_CHECK(spi_bus_initialize(SPI2_HOST, &bus_cfg, SPI_DMA_CH_AUTO));

    /* 2. Init LCD panel IO */
    esp_lcd_panel_io_handle_t io_handle;
    esp_lcd_panel_io_spi_config_t io_cfg = {
        .cs_gpio_num       = DISP_CS,
        .dc_gpio_num       = -1,   /* CO5300 tidak pakai DC pin (QSPI command mode) */
        .spi_clock_hz      = DISP_PCLK_MHZ * 1000 * 1000,
        .lcd_cmd_bits      = 32,
        .lcd_param_bits    = 8,
        .flags.quad_mode   = true,
    };
    ESP_ERROR_CHECK(esp_lcd_new_panel_io_spi((esp_lcd_spi_bus_handle_t)SPI2_HOST,
                                              &io_cfg, &io_handle));

    /* 3. Init CO5300 panel */
    esp_lcd_panel_dev_config_t panel_cfg = {
        .reset_gpio_num = DISP_RESET,
        .color_space    = ESP_LCD_COLOR_SPACE_RGB,
        .bits_per_pixel = 16,
    };
    ESP_ERROR_CHECK(esp_lcd_new_panel_co5300(io_handle, &panel_cfg, &panel_handle));
    ESP_ERROR_CHECK(esp_lcd_panel_reset(panel_handle));
    ESP_ERROR_CHECK(esp_lcd_panel_init(panel_handle));
    ESP_ERROR_CHECK(esp_lcd_panel_disp_on_off(panel_handle, true));

    /* 4. Alokasi LVGL draw buffer (double buffer untuk smooth rendering) */
    buf1 = heap_caps_malloc(DISP_WIDTH * 40 * sizeof(lv_color_t), MALLOC_CAP_DMA);
    lv_color_t *buf2 = heap_caps_malloc(DISP_WIDTH * 40 * sizeof(lv_color_t), MALLOC_CAP_DMA);
    lv_disp_draw_buf_init(&disp_buf, buf1, buf2, DISP_WIDTH * 40);

    /* 5. Register LVGL display driver */
    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res   = DISP_WIDTH;
    disp_drv.ver_res   = DISP_HEIGHT;
    disp_drv.flush_cb  = lvgl_flush_cb;
    disp_drv.draw_buf  = &disp_buf;
    lv_disp_drv_register(&disp_drv);
}
```

---

### Generated `touch_driver.c` untuk CST9217 (I2C)

```c
/*
 * touch_driver.c
 * Generated by WatchForge
 * Driver: CST9217 Capacitive Touch via I2C
 * Library: waveshare/esp_lcd_touch_cst9217 ^1.0.3
 */

#include "touch_driver.h"
#include "esp_lcd_touch_cst9217.h"
#include "driver/i2c.h"
#include "lvgl.h"

#define TOUCH_I2C_PORT  I2C_NUM_0
#define TOUCH_SDA       6
#define TOUCH_SCL       7
#define TOUCH_INT       21
#define TOUCH_RST       -1
#define TOUCH_I2C_FREQ  400000

static esp_lcd_touch_handle_t touch_handle = NULL;

/* LVGL touch read callback */
static void lvgl_touch_read_cb(lv_indev_drv_t *drv, lv_indev_data_t *data) {
    uint16_t touch_x, touch_y, touch_strength;
    uint8_t touch_cnt = 0;

    esp_lcd_touch_read_data(touch_handle);
    bool touched = esp_lcd_touch_get_coordinates(touch_handle,
                       &touch_x, &touch_y, &touch_strength, &touch_cnt, 1);

    if (touched && touch_cnt > 0) {
        data->point.x = touch_x;
        data->point.y = touch_y;
        data->state   = LV_INDEV_STATE_PRESSED;
    } else {
        data->state   = LV_INDEV_STATE_RELEASED;
    }
}

void touch_driver_init(void) {
    /* 1. Init I2C bus */
    i2c_config_t i2c_conf = {
        .mode             = I2C_MODE_MASTER,
        .sda_io_num       = TOUCH_SDA,
        .scl_io_num       = TOUCH_SCL,
        .sda_pullup_en    = GPIO_PULLUP_ENABLE,
        .scl_pullup_en    = GPIO_PULLUP_ENABLE,
        .master.clk_speed = TOUCH_I2C_FREQ,
    };
    ESP_ERROR_CHECK(i2c_param_config(TOUCH_I2C_PORT, &i2c_conf));
    ESP_ERROR_CHECK(i2c_driver_install(TOUCH_I2C_PORT, I2C_MODE_MASTER, 0, 0, 0));

    /* 2. Init CST9217 touch panel */
    esp_lcd_panel_io_handle_t tp_io_handle;
    esp_lcd_panel_io_i2c_config_t tp_io_cfg = {
        .dev_addr         = ESP_LCD_TOUCH_IO_I2C_CST9217_ADDRESS,
        .control_phase_bytes = 1,
        .lcd_cmd_bits     = 16,
        .lcd_param_bits   = 8,
    };
    ESP_ERROR_CHECK(esp_lcd_new_panel_io_i2c(
        (esp_lcd_i2c_bus_handle_t)TOUCH_I2C_PORT, &tp_io_cfg, &tp_io_handle));

    esp_lcd_touch_config_t tp_cfg = {
        .x_max      = 194,
        .y_max      = 368,
        .rst_gpio_num = TOUCH_RST,
        .int_gpio_num = TOUCH_INT,
        .flags.swap_xy  = 0,
        .flags.mirror_x = 0,
        .flags.mirror_y = 0,
    };
    ESP_ERROR_CHECK(esp_lcd_touch_new_i2c_cst9217(tp_io_handle, &tp_cfg, &touch_handle));

    /* 3. Register LVGL input device */
    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type    = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = lvgl_touch_read_cb;
    lv_indev_drv_register(&indev_drv);
}
```

---

### Generated `idf_component.yml`

File ini hanya di-generate jika driver yang dipilih membutuhkan IDF component dari registry (`idf_component` tidak null di `drivers.json`).

```yaml
## idf_component.yml
## Generated by WatchForge
## Tambahkan file ini ke folder komponen utama project lo

dependencies:
  idf: ">=5.1.0"

  ## Display Driver
  kodediy/esp_lcd_co5300:
    version: "^1.0.2"
    ## AMOLED QSPI driver untuk IC CO5300

  ## Touch Driver
  waveshare/esp_lcd_touch_cst9217:
    version: "^1.0.3"
    ## Capacitive touch driver untuk IC CST9217 via I2C

  ## LVGL (jika belum ada di project)
  lvgl/lvgl:
    version: "~8.3.0"
    rules:
      - if: "idf_version >= 5.0"
```

---

### Generated `main/main.c`

```c
/*
 * main.c
 * Generated by WatchForge — Entry Point
 */

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "lvgl.h"
#include "display_driver.h"
#include "touch_driver.h"
#include "ui.h"

#define LVGL_TICK_PERIOD_MS 2

static void lvgl_tick_task(void *arg) {
    while (1) {
        lv_tick_inc(LVGL_TICK_PERIOD_MS);
        vTaskDelay(pdMS_TO_TICKS(LVGL_TICK_PERIOD_MS));
    }
}

static void lvgl_main_task(void *arg) {
    while (1) {
        lv_timer_handler();
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

void app_main(void) {
    /* 1. Init LVGL */
    lv_init();

    /* 2. Init hardware drivers */
    display_driver_init();
    touch_driver_init();

    /* 3. Init UI (generated by WatchForge) */
    ui_init();

    /* 4. Start LVGL tasks */
    xTaskCreate(lvgl_tick_task, "lvgl_tick", 2048, NULL, configMAX_PRIORITIES - 1, NULL);
    xTaskCreate(lvgl_main_task, "lvgl_main", 8192, NULL, configMAX_PRIORITIES - 2, NULL);
}
```

---

### Codegen Flow (Updated dengan Driver Layer & Framework Target)

```
Zustand Project State + useDeviceStore.driverConfig + targetFramework (from Export Page)
        │
        ▼
  validator.js → check: driver dipilih? GPIO valid? tidak ada konflik pin? memori aman?
        │
        ▼
  codegen/index.js
    ├── screenGenerator.js        → ui.c / ui.h (tetap sama)
    ├── widgetGenerator.js        → (bagian dari ui.c)
    ├── animGenerator.js          → (bagian dari ui.c)
    ├── navigationGenerator.js    → (bagian dari ui.c)
    ├── fontGenerator.js          → (bagian dari ui.c)
    │
    │   /* RENDER DINAMIS SESUAI TARGET FRAMEWORK */
    ├── displayDriverGenerator.js → drivers/display_driver.c (IDF) atau .cpp (Arduino) + .h
    ├── touchDriverGenerator.js   → drivers/touch_driver.c (IDF) atau .cpp (Arduino) + .h
    ├── mainGenerator.js          → main/main.c (IDF) atau sketch.ino (Arduino)
    ├── platformioIniGenerator.js  → platformio.ini (konfigurasi target env)
    └── componentYmlGenerator.js  → idf_component.yml (hanya jika target = ESP-IDF)
        │
        ▼
  Handlebars templates render semua file sesuai framework
        │
        ▼
  JSZip → bundle → download (.zip)
```

---

### Folder Structure Tambahan (Engine)

```
src/engine/
├── codegen/
│   ├── index.js
│   ├── screenGenerator.js
│   ├── widgetGenerator.js
│   ├── animGenerator.js
│   ├── navigationGenerator.js
│   ├── fontGenerator.js
│   ├── displayDriverGenerator.js
│   ├── touchDriverGenerator.js
│   ├── mainGenerator.js
│   ├── platformioIniGenerator.js   ← NEW
│   └── componentYmlGenerator.js
│
└── templates/
    ├── ui_screen.c.hbs
    ├── ui_init.h.hbs
    ├── lv_conf.h.hbs
    ├── platformio.ini.hbs          ← NEW: template file konfigurasi PlatformIO
    ├── main.c.hbs                  ← Untuk target ESP-IDF
    ├── sketch.ino.hbs              ← NEW: Untuk target Arduino
    ├── idf_component.yml.hbs
    ├── display/
    │   ├── display_co5300_qspi.c.hbs
    │   ├── display_gc9a01_spi.c.hbs
    │   ├── display_st7789_spi.c.hbs
    │   └── display_ili9341_spi.c.hbs
    └── touch/
        ├── touch_cst9217_i2c.c.hbs
        ├── touch_ft5x06_i2c.c.hbs
        ├── touch_xpt2046_spi.c.hbs
        └── touch_none.c.hbs
```

---

### Agent Rule Tambahan untuk Driver Engine (`01-engine.mdc` update)

Tambahkan ke rules file `01-engine.mdc`:

```markdown
## Driver Generator Rules

- Setiap display driver HARUS generate: init function, flush_cb, LVGL disp_drv register
- Setiap touch driver HARUS generate: init function, read_cb, LVGL indev_drv register
- GPIO define HARUS pakai `#define` dengan nama descriptive — bukan hardcode langsung
- `idf_component.yml` hanya di-generate jika minimal 1 driver punya `idf_component != null`
- `main.c` template harus selalu include: lv_init(), display_driver_init(), touch_driver_init(), ui_init()
- Jangan assume urutan inisialisasi — selalu: LVGL init → display → touch → UI → tasks
- Buffer size draw: default = `width * 40 pixel rows`, bisa override di Settings
- Untuk QSPI/parallel interface: flag DMA wajib aktif (`SPI_DMA_CH_AUTO`)
- Pin conflict checker: validasi tidak ada 2 peripheral yang pakai GPIO yang sama

## Cara Tambah Driver Baru
1. Tambah entry di `data/drivers.json`
2. Buat template `.c.hbs` di folder `templates/display/` atau `templates/touch/`
3. Template wajib punya section: GPIO defines, init function, lvgl callback registration
4. Tidak perlu modifikasi `codegen/index.js` — dia auto-pickup dari drivers.json
```

---

### Validasi Pin Conflict

Sebelum export, `validator.js` harus check konflik GPIO. Contoh warning yang dimunculkan:

```
✗ ERROR: GPIO 11 dipakai oleh 2 peripheral:
  - Display CS  (CO5300 QSPI)
  - Touch INT   (CST9217)
  → Ganti salah satu di Settings → GPIO Pin Configuration

⚠ WARNING: GPIO 6 (Touch SDA) dekat dengan GPIO 5 (Display RESET)
  → Pastikan routing PCB tidak crosstalk di frekuensi I2C 400kHz

✓ OK: Semua GPIO unique
✓ OK: idf_component.yml akan di-generate (2 external components)
✓ OK: ESP-IDF version requirement >= 5.1.0 terpenuhi
```

---

*Dokumen ini adalah living document — update setiap akhir phase dengan temuan dan perubahan desain.*

**Version:** 1.1.0
**Last Updated:** 2025
**Author:** WatchForge Project

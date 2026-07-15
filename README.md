# 🛠️ WatchForge — Smartwatch UI Visual Builder

WatchForge is a premium, visual smartwatch builder for compiling embedded layout screens and events into valid C/C++ source code targeting the **LVGL v8** graphics library.

Designed specifically for target ESP32 boards (such as the **ESP32-S3-DevKitC-1 N16R8**), it generates complete PlatformIO project workspaces with native hardware HAL drivers for high-end smartwatch displays (e.g. **CO5300 AMOLED QSPI** with offset adjustments) and touch interfaces (**CST9217/CST816S**).

---

## 🚀 Key Features

* **Visual Canvas Stage:** Centered interactive stage with drag-drop boundaries, grid alignments, and Transformer bounding boxes.
* **Smartwatch Compound Widgets:** Rich smartwatch status bars (with dynamic battery and wifi signals), clocks, and date stamps.
* **Interactive virtual Keyboard Binds:** Real-time keyboard typing simulation directly linking alphanumeric virtual keypresses to active TextAreas on the canvas.
* **Visual Navigation Map:** Complete ReactFlow screen routing diagram dynamically mapping screen transitions (dashed animated routes) from button onTap events.
* **LVGL C-Codegen Compiler:** Modular converters outputting correct v8 C/H functions for layouts, colors, coordinates, animations, and fonts.
* **AMOLED & Touch HAL Drivers:** Built-in templates for CO5300 AMOLED QSPI (applying the mandatory $X=22$ offset) and CST9217 I2C touch (address `0x5A` at 100 kHz, configuring `disable_control_phase = 1`).
* **Interactive Code Previewer:** Tabbed source file preview workspace to check C definitions, config files, and build manifests before downloading.
* **Hardware Safety Inspector Gate:** Real-time audits checking for duplicate GPIO overlaps and calculating estimated SRAM usage against a safe 120 KB threshold.

---

## 📂 Project Structure

```
├── .github/workflows/deploy.yml # GitHub Pages Deployment Workflow
├── src/
│   ├── components/
│   │   ├── WidgetCanvas/       # Konva stage and drop zones
│   │   ├── WidgetRenderer/     # Modular presentation widgets (Text, Button, Status Bar, etc.)
│   │   ├── FlowControls/       # Custom ReactFlow nodes & bezier edges
│   │   └── RightPanel.jsx      # Properties editor & Board Inspector dashboard
│   ├── store/
│   │   ├── useWidgetStore.js   # Canvas widgets coordinates and states
│   │   ├── useProjectStore.js  # Screens and history undo/redo limits
│   │   ├── useDeviceStore.js   # Hardware display & touch properties
│   │   └── useFlowStore.js     # ReactFlow edges and transitions
│   ├── engine/
│   │   ├── codegen/            # C compiler modules (screens, drivers, boot loops)
│   │   └── validator.js        # Pin conflict checks & SRAM calculator
│   ├── hooks/
│   │   └── useExport.js        # Client-side project ZIP packer (JSZip)
│   └── pages/                  # Route views (Editor, Flow Map, Export Panel)
└── vite.config.js              # Vite bundler properties (configured for Pages)
```

---

## 💻 Local Setup & Development

### 1. Installation
Clone your repository and run the setup scripts:
```bash
npm install
```

### 2. Launch Local Dev Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 3. Build & Compile Verification
Verify production compiler assets:
```bash
npm run build
```

---

## 🌐 Deploy to GitHub Pages (Step-by-Step)

Follow these steps to push WatchForge to GitHub and publish it using the pre-configured GitHub Actions workflow:

### Step 1: Initialize Git Repository
Run the following commands in your local project terminal:
```bash
git init
git add .
git commit -m "feat: complete watchforge smartwatch platform builder"
```

### Step 2: Create a Repository on GitHub
1. Go to [github.com](https://github.com/) and create a new **public** repository (e.g., named `watchforge`).
2. Do **NOT** initialize it with a README, `.gitignore`, or license.

### Step 3: Link Remote Origin & Push
Copy the remote repository URL and execute:
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

### Step 4: Configure GitHub Pages Settings
1. Go to your repository page on GitHub.
2. Navigate to **Settings** -> **Pages** (in the left sidebar).
3. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
4. That's it! GitHub Actions will automatically start building the project (you can watch the progress under the **Actions** tab) and publish the app online within a minute!

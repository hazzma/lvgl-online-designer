# WatchForge — Agent Roles & Governance Specification

This workspace uses a strict multi-agent governance system. Specialized worker agents are assigned to dedicated domains and must not modify files outside their boundary.

---

## 1. Worker Directory Boundaries & Assignments

| Role | Domain / Subsystem | Owned Path Patterns | Work Package Assignment |
| --- | --- | --- | --- |
| **Architect** | Architecture, Roadmap, Rules | `docs/**`, `.agents/**`, `.cursor/rules/**` | Governing Director |
| **Core Builder** | App scaffolding, routing, landing | `src/App.jsx`, `src/main.jsx`, `src/pages/LandingPage/**` | `WP-100` |
| **Store Keeper** | State models, history stacks | `src/store/**` | `WP-200` |
| **Canvas Master** | Konva Canvas, Stage drag hooks | `src/components/WidgetCanvas/**`, `src/hooks/useWidgetDrag.js` | `WP-300` |
| **Widget Developer** | Presentation UI & Widget templates | `src/components/WidgetRenderer/**`, `src/data/widgetTemplates.json` | `WP-310`, `WP-400`, `WP-410` |
| **Flow Master** | Navigation diagram mapping | `src/pages/FlowPage/**`, `src/components/FlowControls/**` | `WP-500`, `WP-510` |
| **Codegen Architect** | C/H Generation, Exporter templates | `src/engine/**`, `src/hooks/useExport.js`, `src/data/devices.json` | `WP-600`, `WP-610`, `WP-620` |
| **Validator Agent** | Pinout, memory bounds validation | `src/engine/validator.js` | `WP-700` |

---

## 2. Worker Access Rules

1. **Write Boundaries:** No agent is permitted to call file modification tools (e.g., `replace_file_content`, `write_to_file`) on files outside their owned path pattern.
2. **Read Boundaries:** Workers may read contracts, types, and schemas under `src/store/` and `src/data/` as a read-only reference, but must not modify them.
3. **API Contracts:** Any changes to public signatures (e.g., the parameters for `generateProject()` or the properties of Zustand `Widget` schemas) must be escalated to the **Architect** for approval.
4. **Surgical Edits:** Rewriting whole files or performing generic formatting is strictly forbidden. Workers must only patch specific lines.

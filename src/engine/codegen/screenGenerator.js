import { generateWidgets } from './widgetGenerator.js';

// Helper to convert hex colors to 0xRRGGBB format
function convertColor(hex) {
  if (!hex || hex === 'transparent') return '0x000000';
  return '0x' + hex.replace('#', '').toUpperCase();
}

export function generateScreens(screens, widgets) {
  let declarations = '';
  let definitions = '';
  let eventCallbacks = '';

  screens.forEach((screen) => {
    const varName = `ui_${screen.id.replace(/-/g, '_')}`;
    declarations += `extern lv_obj_t *${varName};\n`;
    declarations += `void ${varName}_screen_init(void);\n`;

    definitions += `lv_obj_t *${varName} = NULL;\n`;

    // Retrieve child widgets for this screen
    const screenWidgets = widgets[screen.id] || [];
    const pages = screen.pages || [{ id: 'page-1', name: 'Main Page', gridX: 0, gridY: 0 }];
    const hasMultiplePages = pages.length > 1;

    // Retrieve declarations & callbacks for all widgets globally
    const widgetCodes = generateWidgets(screen.id, screenWidgets, screens);
    definitions += widgetCodes.declarations;
    eventCallbacks += widgetCodes.eventCallbacks;

    // Generate initializer block
    definitions += `\nvoid ${varName}_screen_init(void) {\n`;
    definitions += `    ${varName} = lv_obj_create(NULL);\n`;
    definitions += `    lv_obj_clear_flag(${varName}, LV_OBJ_FLAG_SCROLLABLE);\n`;
    
    // Background Color
    definitions += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(screen.bgColor)}), LV_PART_MAIN);\n`;
    definitions += `    lv_obj_set_style_bg_opa(${varName}, LV_OPA_COVER, LV_PART_MAIN);\n\n`;

    // Background Image (Wallpaper)
    if (screen.bgImage && screen.bgImage.trim() !== '') {
      const imgVar = screen.bgImage.trim();
      definitions += `    LV_IMG_DECLARE(${imgVar});\n`;
      definitions += `    lv_obj_set_style_bg_img_src(${varName}, &${imgVar}, LV_PART_MAIN);\n\n`;
    }
    
    if (hasMultiplePages) {
      const tileviewVar = `${varName}_tileview`;
      definitions += `    lv_obj_t *${tileviewVar} = lv_tileview_create(${varName});\n`;
      definitions += `    lv_obj_set_size(${tileviewVar}, LV_PCT(100), LV_PCT(100));\n`;
      definitions += `    lv_obj_set_style_bg_opa(${tileviewVar}, LV_OPA_TRANSP, LV_PART_MAIN);\n\n`;

      const minX = Math.min(...pages.map((p) => p.gridX || 0));
      const minY = Math.min(...pages.map((p) => p.gridY || 0));

      pages.forEach((page) => {
        const col = (page.gridX || 0) - minX;
        const row = (page.gridY || 0) - minY;
        const tileVar = `${varName}_tile_${col}_${row}`;
        
        definitions += `    // Page: ${page.name} (${page.gridX}, ${page.gridY})\n`;
        definitions += `    lv_obj_t *${tileVar} = lv_tileview_add_tile(${tileviewVar}, ${col}, ${row}, LV_DIR_LEFT | LV_DIR_RIGHT | LV_DIR_UP | LV_DIR_DOWN);\n`;
        definitions += `    lv_obj_t *parent = ${tileVar};\n`;

        // Retrieve widgets belonging to this page only
        const pageWidgets = screenWidgets.filter((w) => w.pageId === page.id && w.type !== 'notification_bar' && !w.persistent);
        const pageWidgetCodes = generateWidgets(screen.id, pageWidgets, screens);
        definitions += pageWidgetCodes.instantiations;
      });

      // Overlay status bar or persistent elements directly on the screen (above the tileview)
      const overlayWidgets = screenWidgets.filter((w) => w.pageId === 'persistent' || w.type === 'notification_bar' || w.persistent);
      if (overlayWidgets.length > 0) {
        definitions += `    // Persistent / Overlay widgets\n`;
        definitions += `    lv_obj_t *parent = ${varName};\n`;
        const overlayWidgetCodes = generateWidgets(screen.id, overlayWidgets, screens);
        definitions += overlayWidgetCodes.instantiations;
      }
    } else {
      definitions += `    lv_obj_t *parent = ${varName};\n`;
      definitions += widgetCodes.instantiations;
    }

    definitions += `}\n\n`;
  });

  return {
    declarations,
    definitions,
    eventCallbacks,
  };
}

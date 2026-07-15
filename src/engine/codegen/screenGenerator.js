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
    const widgetCodes = generateWidgets(screen.id, screenWidgets, screens);

    // Append child variable declarations
    definitions += widgetCodes.declarations;
    eventCallbacks += widgetCodes.eventCallbacks;

    // Generate initializer block
    definitions += `\nvoid ${varName}_screen_init(void) {\n`;
    definitions += `    ${varName} = lv_obj_create(NULL);\n`;
    definitions += `    lv_obj_clear_flag(${varName}, LV_OBJ_FLAG_SCROLLABLE);\n`;
    definitions += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(screen.bgColor)}), LV_PART_MAIN);\n`;
    
    // Set screen dimensions based on target device profile (if available, e.g. 410x502 resolution)
    definitions += `    lv_obj_set_style_bg_opa(${varName}, LV_OPA_COVER, LV_PART_MAIN);\n\n`;
    
    definitions += `    lv_obj_t *parent = ${varName};\n`;
    definitions += widgetCodes.instantiations;
    definitions += `}\n\n`;
  });

  return {
    declarations,
    definitions,
    eventCallbacks,
  };
}

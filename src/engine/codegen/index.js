import { generateFonts } from './fontGenerator.js';
import { generateAnimations } from './animGenerator.js';
import { generateScreens } from './screenGenerator.js';
import { generateDisplayDriver } from './displayDriverGenerator.js';
import { generateTouchDriver } from './touchDriverGenerator.js';
import { generatePlatformioIni } from './platformioIniGenerator.js';
import { generateMain } from './mainGenerator.js';

// Standard static lv_conf.h config for target smartwatch boards
const LV_CONF_H_CONTENT = `
#ifndef LV_CONF_H
#define LV_CONF_H

#define LV_COLOR_DEPTH 16
#define LV_COLOR_16_SWAP 1
#define LV_MEM_CUSTOM 0
#define LV_MEM_SIZE (128U * 1024U) // Custom allocation SRAM limit

/* Font parameters */
#define LV_FONT_MONTSERRAT_12 1
#define LV_FONT_MONTSERRAT_14 1
#define LV_FONT_MONTSERRAT_16 1
#define LV_FONT_MONTSERRAT_28 1

#define LV_TICK_CUSTOM     1
#define LV_TICK_CUSTOM_SYS_TIME_EXPR (esp_timer_get_time() / 1000)

#endif // LV_CONF_H
`.trim();

export function generateProject(projectName, screens, widgets, edges, device) {
  const warnings = [];

  // 1. Gather Font definitions
  const fonts = generateFonts(widgets);

  // 2. Gather Animations helpers
  const anims = generateAnimations(edges);

  // 3. Compile Screens & Child Widgets code
  const screenCodes = generateScreens(screens, widgets);

  // 4. Compile display & touch hardware drivers
  const displayDrv = generateDisplayDriver(device);
  const touchDrv = generateTouchDriver(device);

  // 5. Compile boot main entry loops & platformio target config
  const mainCode = generateMain(device);
  const pioConfig = generatePlatformioIni(device);

  // Find root/initial screen
  const rootScreen = screens.find((s) => s.isRoot) || screens[0];
  const rootVarName = rootScreen ? `ui_${rootScreen.id.replace(/-/g, '_')}` : '';

  // Assemble ui.h header content
  const uiHContent = `
#ifndef UI_H
#define UI_H

#ifdef __cplusplus
extern "C" {
#endif

#include "lvgl.h"

// Custom Font definitions
${fonts.declarations}

// Screen definitions
${screenCodes.declarations}

void ui_init(void);

#ifdef __cplusplus
}
#endif

#endif // UI_H
  `.trim();

  // Assemble ui.c implementation content
  const uiCContent = `
#include "ui.h"

// Font mappings
${fonts.mappings}

// Globals
${screenCodes.definitions}

// Transition animation helpers
${anims.helpers}

// Event callbacks
${screenCodes.eventCallbacks}

// Main initializer
void ui_init(void) {
    // Initialize first screen
    if (${rootVarName} == NULL) {
        ${rootVarName}_screen_init();
    }
    lv_disp_load_scr(${rootVarName});
}
  `.trim();

  const isArduino = device.framework === 'Arduino';
  const mainFilename = isArduino ? 'src/main.cpp' : 'src/main.c';

  return {
    files: {
      'platformio.ini': pioConfig,
      'include/lv_conf.h': LV_CONF_H_CONTENT,
      [mainFilename]: mainCode,
      'src/display_driver.h': displayDrv.hContent,
      'src/display_driver.c': displayDrv.cContent,
      'src/touch_driver.h': touchDrv.hContent,
      'src/touch_driver.c': touchDrv.cContent,
      'src/ui/ui.h': uiHContent,
      'src/ui/ui.c': uiCContent,
    },
    warnings,
  };
}

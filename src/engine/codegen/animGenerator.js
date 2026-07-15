/**
 * Generates screen transition anim mapping macros for LVGL v8.
 */
const ANIM_MAP = {
  slide_left: 'LV_SCR_LOAD_ANIM_MOVE_LEFT',
  slide_right: 'LV_SCR_LOAD_ANIM_MOVE_RIGHT',
  slide_up: 'LV_SCR_LOAD_ANIM_MOVE_UP',
  slide_down: 'LV_SCR_LOAD_ANIM_MOVE_DOWN',
  fade: 'LV_SCR_LOAD_ANIM_FADE_ON',
  none: 'LV_SCR_LOAD_ANIM_NONE',
};

export function getAnimConstant(animName) {
  return ANIM_MAP[animName] || 'LV_SCR_LOAD_ANIM_NONE';
}

export function generateAnimations(edges) {
  // Anim helper definitions in C
  const helpers = `
void _ui_screen_change(lv_obj_t ** target, lv_scr_load_anim_t fademode, int spd, int delay, void (*target_init)(void)) {
    if(*target == NULL) {
        target_init();
    }
    lv_scr_load_anim(*target, fademode, spd, delay, false);
}
  `.trim();

  return {
    helpers,
  };
}

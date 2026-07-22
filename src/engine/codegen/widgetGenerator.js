import { getAnimConstant } from './animGenerator.js';

// Helper to convert hex colors to 0xRRGGBB format
function convertColor(hex) {
  if (!hex || hex === 'transparent') return '0x000000';
  return '0x' + hex.replace('#', '').toUpperCase();
}

export function generateWidgets(screenId, widgetsList, screens) {
  let declarations = '';
  let instantiations = '';
  let eventCallbacks = '';

  widgetsList.forEach((w) => {
    const varName = `ui_${w.id.replace(/-/g, '_')}`;
    declarations += `lv_obj_t *${varName};\n`;

    // 1. Instantiate widget bases
    switch (w.type) {
      case 'text':
        instantiations += `    ${varName} = lv_label_create(parent);\n`;
        instantiations += `    lv_label_set_text(${varName}, "${w.props.text || 'Text Label'}");\n`;
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.color)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_text_align(${varName}, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN);\n`;
        if (w.props.fontSize) {
          instantiations += `    lv_obj_set_style_text_font(${varName}, &lv_font_montserrat_${Math.min(48, Math.max(8, w.props.fontSize))}, LV_PART_MAIN);\n`;
        }
        break;

      case 'rect':
        instantiations += `    ${varName} = lv_obj_create(parent);\n`;
        instantiations += `    lv_obj_clear_flag(${varName}, LV_OBJ_FLAG_SCROLLABLE);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.bgColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_border_color(${varName}, lv_color_hex(${convertColor(w.props.borderColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_border_width(${varName}, ${w.props.borderSize !== undefined ? w.props.borderSize : 1}, LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_radius(${varName}, ${w.props.borderRadius || 0}, LV_PART_MAIN);\n`;
        break;

      case 'button':
        instantiations += `    ${varName} = lv_btn_create(parent);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.bgColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_radius(${varName}, ${w.props.borderRadius !== undefined ? w.props.borderRadius : 4}, LV_PART_MAIN);\n`;
        
        // Add nested label for button text
        const btnLabelName = `${varName}_label`;
        instantiations += `    lv_obj_t *${btnLabelName} = lv_label_create(${varName});\n`;
        instantiations += `    lv_label_set_text(${btnLabelName}, "${w.props.label || 'Button'}");\n`;
        instantiations += `    lv_obj_set_style_text_color(${btnLabelName}, lv_color_hex(${convertColor(w.props.labelColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_center(${btnLabelName});\n`;
        break;

      case 'clock':
        instantiations += `    ${varName} = lv_label_create(parent);\n`;
        instantiations += `    lv_label_set_text(${varName}, "10:09");\n`;
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.hourColor || w.props.color)}), LV_PART_MAIN);\n`;
        break;

      // Split clock sub-widgets — each generates an independent lv_label
      case 'clock_hour':
        instantiations += `    ${varName} = lv_label_create(parent);\n`;
        instantiations += `    lv_label_set_text(${varName}, "${w.props.text || '10'}");\n`;
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.color)}), LV_PART_MAIN);\n`;
        if (w.props.fontSize) {
          instantiations += `    lv_obj_set_style_text_font(${varName}, &lv_font_montserrat_${Math.min(48, Math.max(8, w.props.fontSize))}, LV_PART_MAIN);\n`;
        }
        break;

      case 'clock_minute':
        instantiations += `    ${varName} = lv_label_create(parent);\n`;
        instantiations += `    lv_label_set_text(${varName}, "${w.props.text || '09'}");\n`;
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.color)}), LV_PART_MAIN);\n`;
        if (w.props.fontSize) {
          instantiations += `    lv_obj_set_style_text_font(${varName}, &lv_font_montserrat_${Math.min(48, Math.max(8, w.props.fontSize))}, LV_PART_MAIN);\n`;
        }
        break;

      case 'clock_separator':
        instantiations += `    ${varName} = lv_label_create(parent);\n`;
        instantiations += `    lv_label_set_text(${varName}, "${w.props.text || ':'}");\n`;
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.color)}), LV_PART_MAIN);\n`;
        if (w.props.fontSize) {
          instantiations += `    lv_obj_set_style_text_font(${varName}, &lv_font_montserrat_${Math.min(48, Math.max(8, w.props.fontSize))}, LV_PART_MAIN);\n`;
        }
        break;

      case 'date':
        instantiations += `    ${varName} = lv_label_create(parent);\n`;
        instantiations += `    lv_label_set_text(${varName}, "Wednesday, 15 Jul");\n`;
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.color)}), LV_PART_MAIN);\n`;
        break;

      case 'notification_bar':
        instantiations += `    ${varName} = lv_obj_create(parent);\n`;
        instantiations += `    lv_obj_clear_flag(${varName}, LV_OBJ_FLAG_SCROLLABLE);\n`;
        
        // ── Apply Opacity ──
        if (w.props.opacity !== undefined) {
          const opaVal = Math.round(w.props.opacity * 255);
          instantiations += `    lv_obj_set_style_opa(${varName}, ${opaVal}, LV_PART_MAIN);\n`;
        }

        // ── Apply Style Presets ──
        const barStyle = w.props.barStyle || 'classic';
        if (barStyle === 'glassmorphism') {
          instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(0xffffff), LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_bg_opa(${varName}, 30, LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_border_color(${varName}, lv_color_hex(0xffffff), LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_border_width(${varName}, 1, LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_radius(${varName}, 4, LV_PART_MAIN);\n`;
        } else if (barStyle === 'neumorphism') {
          instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.bgColor)}), LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_radius(${varName}, 3, LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_shadow_width(${varName}, 8, LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_shadow_color(${varName}, lv_color_hex(0x000000), LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_shadow_opa(${varName}, 100, LV_PART_MAIN);\n`;
        } else if (barStyle === 'neo-brutalism') {
          instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.bgColor)}) || lv_color_hex(0xfacc15), LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_border_color(${varName}, lv_color_hex(0x000000), LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_border_width(${varName}, 2, LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_radius(${varName}, 0, LV_PART_MAIN);\n`;
        } else {
          // Classic solid
          instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.bgColor)}), LV_PART_MAIN);\n`;
          instantiations += `    lv_obj_set_style_border_width(${varName}, 0, LV_PART_MAIN);\n`;
        }
        break;

      case 'status_clock':
        instantiations += `    ${varName} = lv_label_create(parent);\n`;
        instantiations += `    lv_label_set_text(${varName}, "${w.props.text || '10:09'}");\n`;
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.color)}), LV_PART_MAIN);\n`;
        if (w.props.fontSize) {
          instantiations += `    lv_obj_set_style_text_font(${varName}, &lv_font_montserrat_${Math.min(48, Math.max(8, w.props.fontSize))}, LV_PART_MAIN);\n`;
        }
        break;

      case 'status_wifi':
        instantiations += `    ${varName} = lv_obj_create(parent);\n`;
        instantiations += `    lv_obj_clear_flag(${varName}, LV_OBJ_FLAG_SCROLLABLE);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.color)}), LV_PART_MAIN);\n`;
        instantiations += `    // Style: ${w.props.wifiStyle || 'classic'}\n`;
        break;

      case 'status_battery':
        instantiations += `    ${varName} = lv_obj_create(parent);\n`;
        instantiations += `    lv_obj_clear_flag(${varName}, LV_OBJ_FLAG_SCROLLABLE);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.baseColor || '#10b981')}), LV_PART_MAIN);\n`;
        instantiations += `    // Battery level: ${w.props.batteryLevel ?? 80}%, charging: ${w.props.isCharging ? 'yes' : 'no'}\n`;
        break;

      case 'textarea':
        instantiations += `    ${varName} = lv_textarea_create(parent);\n`;
        instantiations += `    lv_textarea_set_placeholder_text(${varName}, "${w.props.placeholder || 'Enter text...'}");\n`;
        instantiations += `    if (strlen("${w.props.text || ''}") > 0) lv_textarea_set_text(${varName}, "${w.props.text}");\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.bgColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.color)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_radius(${varName}, ${w.props.borderRadius !== undefined ? w.props.borderRadius : 6}, LV_PART_MAIN);\n`;
        break;

      case 'keyboard':
        instantiations += `    ${varName} = lv_keyboard_create(parent);\n`;
        // Hide keyboard initially unless focused
        instantiations += `    lv_obj_add_flag(${varName}, LV_OBJ_FLAG_HIDDEN);\n`;
        break;

      case 'image':
        // Image widget — in embedded firmware, we reference an extern LV_IMG_DECLARE
        instantiations += `    ${varName} = lv_img_create(parent);\n`;
        instantiations += `    // TODO: Set image source from asset converter\n`;
        instantiations += `    // lv_img_set_src(${varName}, &img_asset);\n`;
        break;

      // ── NEW LVGL Widget Types ──

      case 'slider':
        instantiations += `    ${varName} = lv_slider_create(parent);\n`;
        instantiations += `    lv_slider_set_range(${varName}, ${w.props.min ?? 0}, ${w.props.max ?? 100});\n`;
        instantiations += `    lv_slider_set_value(${varName}, ${w.props.value ?? 50}, LV_ANIM_OFF);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.trackColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.activeColor)}), LV_PART_INDICATOR);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.knobColor)}), LV_PART_KNOB);\n`;
        break;

      case 'switch':
        instantiations += `    ${varName} = lv_switch_create(parent);\n`;
        if (w.props.checked) {
          instantiations += `    lv_obj_add_state(${varName}, LV_STATE_CHECKED);\n`;
        }
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.inactiveColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.activeColor)}), LV_PART_INDICATOR | LV_STATE_CHECKED);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.knobColor)}), LV_PART_KNOB);\n`;
        break;

      case 'arc':
        instantiations += `    ${varName} = lv_arc_create(parent);\n`;
        instantiations += `    lv_arc_set_range(${varName}, ${w.props.min ?? 0}, ${w.props.max ?? 100});\n`;
        instantiations += `    lv_arc_set_value(${varName}, ${w.props.value ?? 65});\n`;
        instantiations += `    lv_arc_set_bg_angles(${varName}, ${w.props.startAngle ?? 135}, ${w.props.endAngle ?? 405});\n`;
        instantiations += `    lv_obj_set_style_arc_color(${varName}, lv_color_hex(${convertColor(w.props.bgArcColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_arc_color(${varName}, lv_color_hex(${convertColor(w.props.arcColor)}), LV_PART_INDICATOR);\n`;
        instantiations += `    lv_obj_set_style_arc_width(${varName}, ${w.props.thickness ?? 8}, LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_arc_width(${varName}, ${w.props.thickness ?? 8}, LV_PART_INDICATOR);\n`;
        break;

      case 'bar':
        instantiations += `    ${varName} = lv_bar_create(parent);\n`;
        instantiations += `    lv_bar_set_range(${varName}, ${w.props.min ?? 0}, ${w.props.max ?? 100});\n`;
        instantiations += `    lv_bar_set_value(${varName}, ${w.props.value ?? 60}, LV_ANIM_OFF);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.bgColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.barColor)}), LV_PART_INDICATOR);\n`;
        instantiations += `    lv_obj_set_style_radius(${varName}, ${w.props.borderRadius ?? 4}, LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_radius(${varName}, ${w.props.borderRadius ?? 4}, LV_PART_INDICATOR);\n`;
        break;

      case 'checkbox':
        instantiations += `    ${varName} = lv_checkbox_create(parent);\n`;
        instantiations += `    lv_checkbox_set_text(${varName}, "${w.props.label || 'Option'}");\n`;
        if (w.props.checked) {
          instantiations += `    lv_obj_add_state(${varName}, LV_STATE_CHECKED);\n`;
        }
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.labelColor)}), LV_PART_MAIN);\n`;
        break;

      case 'dropdown':
        instantiations += `    ${varName} = lv_dropdown_create(parent);\n`;
        if (Array.isArray(w.props.options)) {
          instantiations += `    lv_dropdown_set_options(${varName}, "${w.props.options.join('\\n')}");\n`;
        }
        instantiations += `    lv_dropdown_set_selected(${varName}, ${w.props.selectedIndex ?? 0});\n`;
        instantiations += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${convertColor(w.props.bgColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_text_color(${varName}, lv_color_hex(${convertColor(w.props.textColor)}), LV_PART_MAIN);\n`;
        break;

      case 'spinner':
        instantiations += `    ${varName} = lv_spinner_create(parent, 1000, 60);\n`;
        instantiations += `    lv_obj_set_style_arc_color(${varName}, lv_color_hex(${convertColor(w.props.bgColor)}), LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_arc_color(${varName}, lv_color_hex(${convertColor(w.props.spinnerColor)}), LV_PART_INDICATOR);\n`;
        instantiations += `    lv_obj_set_style_arc_width(${varName}, ${w.props.thickness ?? 4}, LV_PART_MAIN);\n`;
        instantiations += `    lv_obj_set_style_arc_width(${varName}, ${w.props.thickness ?? 4}, LV_PART_INDICATOR);\n`;
        break;

      default:
        instantiations += `    ${varName} = lv_obj_create(parent);\n`;
    }

    // 2. Set generic dimensions and positioning (common to all)
    instantiations += `    lv_obj_set_width(${varName}, ${w.width});\n`;
    instantiations += `    lv_obj_set_height(${varName}, ${w.height});\n`;
    instantiations += `    lv_obj_set_pos(${varName}, ${w.x}, ${w.y});\n`;

    // 3. Set custom interactive events (onTap transitions)
    if (w.onTap && w.onTap.action === 'navigate_screen' && w.onTap.targetScreenId) {
      const targetScreen = screens.find((s) => s.id === w.onTap.targetScreenId);
      if (targetScreen) {
        const targetVarName = `ui_${targetScreen.id.replace(/-/g, '_')}`;
        const eventCbName = `ui_event_${w.id.replace(/-/g, '_')}`;

        instantiations += `    lv_obj_add_event_cb(${varName}, ${eventCbName}, LV_EVENT_CLICKED, NULL);\n`;

        eventCallbacks += `void ${eventCbName}(lv_event_t * e) {\n`;
        eventCallbacks += `    lv_event_code_t event_code = lv_event_get_code(e);\n`;
        eventCallbacks += `    if (event_code == LV_EVENT_CLICKED) {\n`;
        eventCallbacks += `        _ui_screen_change(&${targetVarName}, ${getAnimConstant(w.onTap.animation)}, ${w.onTap.duration || 300}, 0, &${targetVarName}_screen_init);\n`;
        eventCallbacks += `    }\n`;
        eventCallbacks += `}\n\n`;
      }
    }

    // 4. Focus binders for textareas on the screen
    if (w.type === 'textarea') {
      const keyboardWidget = widgetsList.find((other) => other.type === 'keyboard');
      if (keyboardWidget) {
        const kbVarName = `ui_${keyboardWidget.id.replace(/-/g, '_')}`;
        const focusCbName = `ui_event_focus_${w.id.replace(/-/g, '_')}`;

        instantiations += `    lv_obj_add_event_cb(${varName}, ${focusCbName}, LV_EVENT_ALL, NULL);\n`;

        eventCallbacks += `void ${focusCbName}(lv_event_t * e) {\n`;
        eventCallbacks += `    lv_event_code_t event_code = lv_event_get_code(e);\n`;
        eventCallbacks += `    lv_obj_t * target = lv_event_get_target(e);\n`;
        eventCallbacks += `    if (event_code == LV_EVENT_FOCUSED) {\n`;
        eventCallbacks += `        lv_keyboard_set_textarea(${kbVarName}, target);\n`;
        eventCallbacks += `        lv_obj_clear_flag(${kbVarName}, LV_OBJ_FLAG_HIDDEN);\n`;
        eventCallbacks += `    }\n`;
        eventCallbacks += `    if (event_code == LV_EVENT_DEFOCUSED) {\n`;
        eventCallbacks += `        lv_obj_add_flag(${kbVarName}, LV_OBJ_FLAG_HIDDEN);\n`;
        eventCallbacks += `    }\n`;
        eventCallbacks += `}\n\n`;
      }
    }
  });

  return {
    declarations,
    instantiations,
    eventCallbacks,
  };
}

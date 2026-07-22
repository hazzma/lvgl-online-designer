/**
 * Generates custom and standard font declarations for LVGL v8.
 */
export function generateFonts(widgets) {
  const fonts = new Set();
  
  // Extract all unique fonts used across widgets
  Object.values(widgets).forEach((screenWidgets) => {
    screenWidgets.forEach((w) => {
      if (w.props) {
        if (w.props.fontSize) {
          fonts.add(w.props.fontSize);
        }
        if (w.props.hourFontSize) {
          fonts.add(w.props.hourFontSize);
        }
        if (w.props.minuteFontSize) {
          fonts.add(w.props.minuteFontSize);
        }
        if (w.props.secFontSize) {
          fonts.add(w.props.secFontSize);
        }
        if (w.props.dialNumberFontSize) {
          fonts.add(w.props.dialNumberFontSize);
        }
      }
    });
  });

  // Always include a default fallback font if empty
  if (fonts.size === 0) {
    fonts.add(16);
  }

  // Generate declarations (header declarations and source pointers)
  let declarations = '';
  let mappings = '';

  fonts.forEach((size) => {
    declarations += `LV_FONT_DECLARE(ui_font_montserrat_${size});\n`;
    mappings += `// Pointers mapping to Montserrat built-in fonts:\n`;
    mappings += `#define ui_font_montserrat_${size} lv_font_montserrat_${size}\n`;
  });

  return {
    declarations,
    mappings,
    usedFonts: Array.from(fonts)
  };
}

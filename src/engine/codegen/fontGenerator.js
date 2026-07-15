/**
 * Generates custom and standard font declarations for LVGL v8.
 */
export function generateFonts(widgets) {
  const fonts = new Set();
  
  // Extract all unique fonts used across widgets
  Object.values(widgets).forEach((screenWidgets) => {
    screenWidgets.forEach((w) => {
      if (w.props && w.props.fontSize) {
        // We support Montserrat sizes, mapped dynamically
        fonts.add(`montserrat_${w.props.fontSize}`);
      }
    });
  });

  // Always include a default fallback font if empty
  if (fonts.size === 0) {
    fonts.add('montserrat_16');
  }

  // Generate declarations (header declarations and source pointers)
  let declarations = '';
  let mappings = '';

  fonts.forEach((font) => {
    declarations += `LV_FONT_DECLARE(ui_font_${font});\n`;
    mappings += `// Pointers mapping to Montserrat built-in fonts:\n`;
    mappings += `#define ui_font_${font} lv_font_${font}\n`;
  });

  return {
    declarations,
    mappings,
    usedFonts: Array.from(fonts)
  };
}

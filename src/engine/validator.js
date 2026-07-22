/**
 * Validator engine for WatchForge.
 * Checks for hardware pin conflicts and estimates SRAM footprint for smartwatch designs.
 */

// Memory footprint constants in bytes for standard LVGL v8 widget allocations
const MEMORY_FOOTPRINTS = {
  screen: 8192,         // 8 KB base screen structure
  text: 2048,           // 2 KB text label
  rect: 3072,           // 3 KB container / shape
  button: 4096,         // 4 KB button group
  clock: 4096,          // 4 KB compound clock
  clock_hour: 2048,     // 2 KB split clock hour label
  clock_minute: 2048,   // 2 KB split clock minute label
  clock_separator: 1024, // 1 KB split clock separator label
  date: 4096,           // 4 KB compound calendar date
  notification_bar: 6144, // 6 KB top status bar
  textarea: 8192,       // 8 KB text area input buffer
  keyboard: 12288,      // 12 KB virtual keyboard grid
  image: 4096,          // 4 KB image container (actual image in flash/PSRAM)
  slider: 3072,         // 3 KB slider widget
  switch: 2048,         // 2 KB switch toggle
  arc: 4096,            // 4 KB arc/gauge
  bar: 2048,            // 2 KB progress bar
  checkbox: 2048,       // 2 KB checkbox
  dropdown: 4096,       // 4 KB dropdown list
  spinner: 3072,        // 3 KB spinner animation
};

export function validateProject(screens, widgets, device) {
  const errors = [];
  const warnings = [];

  // --- 1. GPIO Pin Conflict Checks ---
  const pinsInUse = {};

  const addPin = (pin, purpose) => {
    if (pin === undefined || pin === null || pin === -1) return;
    if (pinsInUse[pin]) {
      errors.push(`GPIO Pin Conflict: GPIO ${pin} is assigned to both "${purpose}" and "${pinsInUse[pin]}".`);
    } else {
      pinsInUse[pin] = purpose;
    }
  };

  // Extract display pins
  if (device.sdaPin !== undefined) addPin(device.sdaPin, 'Touch I2C SDA');
  if (device.sclPin !== undefined) addPin(device.sclPin, 'Touch I2C SCL');

  // Hardcoded target device display pins for ESP32-S3 DevKitC (QSPI LCD interface standard pins)
  const displayPins = {
    CS: 9,
    SCK: 12,
    D0: 11,
    D1: 13,
    D2: 14,
    D3: 15,
  };

  Object.entries(displayPins).forEach(([name, pin]) => {
    addPin(pin, `Display QSPI ${name}`);
  });

  // --- 2. SRAM Footprint Allocation Budget ---
  let sramBytes = 0;

  // Base LVGL core overhead
  sramBytes += 16384; // 16 KB library base structures

  // Flush buffer size estimation: Width * 40 lines * 2 bytes/pixel (16-bit color depth)
  const dispWidth = device.width || 410;
  const flushBufSize = dispWidth * 40 * 2;
  sramBytes += flushBufSize;

  // Add screen bases
  screens.forEach(() => {
    sramBytes += MEMORY_FOOTPRINTS.screen;
  });

  // Add all widget instances
  Object.values(widgets).forEach((widgetList) => {
    widgetList.forEach((w) => {
      const footprint = MEMORY_FOOTPRINTS[w.type] || 2048;
      sramBytes += footprint;
    });
  });

  const sramUsageKb = parseFloat((sramBytes / 1024).toFixed(2));
  const sramLimitKb = 120; // 120 KB safety threshold

  if (sramUsageKb > sramLimitKb) {
    errors.push(`SRAM Budget Exceeded: Estimated memory is ${sramUsageKb} KB, which exceeds the safe threshold of ${sramLimitKb} KB.`);
  } else if (sramUsageKb > sramLimitKb * 0.8) {
    warnings.push(`High Memory Warning: SRAM allocation is at ${sramUsageKb} KB (over 80% of limit).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sramUsageKb,
  };
}

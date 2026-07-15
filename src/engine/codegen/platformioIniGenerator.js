import Handlebars from 'handlebars';

const TEMPLATE = `
[platformio]
default_envs = {{framework}}-{{board}}

[env:{{framework}}-{{board}}]
platform = espressif32
board = esp32-s3-devkitc-1
framework = {{framework}}
board_build.arduino.memory_type = qio_opi
board_build.flash_mode = qio
board_build.psram_type = opi
board_build.partitions = default_16MB.csv
build_flags =
    -DBOARD_HAS_PSRAM
    -DARDUINO_USB_MODE=1
    -DARDUINO_USB_CDC_ON_BOOT=1
    -DLV_CONF_INCLUDE_SIMPLE
    -I include
    -I src
lib_deps =
    lvgl/lvgl@8.3.11
`.trim();

export function generatePlatformioIni(device) {
  const context = {
    framework: device.framework === 'ESP-IDF' ? 'espidf' : 'arduino',
    board: 'esp32s3',
  };

  return Handlebars.compile(TEMPLATE)(context);
}

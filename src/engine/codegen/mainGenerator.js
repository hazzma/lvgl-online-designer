import Handlebars from 'handlebars';

const ESP_IDF_TEMPLATE = `
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_timer.h"
#include "esp_log.h"
#include "lvgl.h"
#include "display_driver.h"
#include "touch_driver.h"
#include "ui/ui.h"

static const char *TAG = "Main";

static void lv_tick_task(void *arg) {
    lv_tick_inc(2);
}

void app_main(void) {
    ESP_LOGI(TAG, "Starting WatchForge Smartwatch UI Boot Loop...");
    
    // Initialize LVGL core library
    lv_init();
    
    // Initialize display and touch panel drivers
    display_driver_init();
    touch_driver_init();
    
    // Setup 2ms tick timer
    const esp_timer_create_args_t tick_timer_args = {
        .callback = &lv_tick_task,
        .name = "lv_tick"
    };
    esp_timer_handle_t tick_timer;
    esp_timer_create(&tick_timer_args, &tick_timer);
    esp_timer_start_periodic(tick_timer, 2000);

    // Load screens and run initial views
    ui_init();

    ESP_LOGI(TAG, "WatchForge Smartwatch UI Boot Complete!");
    
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(5));
        lv_timer_handler();
    }
}
`.trim();

const ARDUINO_TEMPLATE = `
#include <Arduino.h>
#include <lvgl.h>
#include "display_driver.h"
#include "touch_driver.h"
#include "ui/ui.h"

void setup() {
    Serial.begin(115200);
    Serial.println("Starting WatchForge Smartwatch UI via Arduino...");

    lv_init();
    display_driver_init();
    touch_driver_init();

    ui_init();
    Serial.println("UI Initialized!");
}

void loop() {
    lv_timer_handler();
    delay(5);
}
`.trim();

export function generateMain(device) {
  const isArduino = device.framework === 'Arduino';
  const templateStr = isArduino ? ARDUINO_TEMPLATE : ESP_IDF_TEMPLATE;

  return Handlebars.compile(templateStr)({});
}

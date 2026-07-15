import Handlebars from 'handlebars';

const CO5300_H_TEMPLATE = `
#ifndef DISPLAY_DRIVER_CO5300_H
#define DISPLAY_DRIVER_CO5300_H

#include "lvgl.h"

#define DISPLAY_WIDTH  {{width}}
#define DISPLAY_HEIGHT {{height}}
#define OFFSET_X       {{xOffset}} // Standard offset: 22

#ifdef __cplusplus
extern "C" {
#endif

void display_driver_init(void);

#ifdef __cplusplus
}
#endif

#endif // DISPLAY_DRIVER_CO5300_H
`.trim();

const CO5300_C_TEMPLATE = `
#include "display_driver.h"
#include "esp_lcd_panel_io.h"
#include "esp_lcd_panel_vendor.h"
#include "esp_lcd_panel_ops.h"
#include "driver/gpio.h"
#include "esp_err.h"
#include "esp_log.h"

static const char *TAG = "CO5300_Driver";
static esp_lcd_panel_handle_t panel_handle = NULL;

static void my_disp_flush_cb(lv_disp_drv_t *disp_drv, const lv_area_t *area, lv_color_t *color_p) {
    int offset_x1 = area->x1 + OFFSET_X;
    int offset_x2 = area->x2 + OFFSET_X;
    
    esp_lcd_panel_draw_bitmap(panel_handle, offset_x1, area->y1, offset_x2 + 1, area->y2 + 1, color_p);
    lv_disp_flush_ready(disp_drv);
}

void display_driver_init(void) {
    ESP_LOGI(TAG, "Initializing AMOLED CO5300 display bus via QSPI...");

    static lv_disp_draw_buf_t draw_buf;
    static lv_color_t *buf1 = NULL;
    
    buf1 = (lv_color_t *)malloc(DISPLAY_WIDTH * 40 * sizeof(lv_color_t));
    if (!buf1) {
        ESP_LOGE(TAG, "Failed to allocate display flush buffer");
        return;
    }
    
    lv_disp_draw_buf_init(&draw_buf, buf1, NULL, DISPLAY_WIDTH * 40);

    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = DISPLAY_WIDTH;
    disp_drv.ver_res = DISPLAY_HEIGHT;
    disp_drv.flush_cb = my_disp_flush_cb;
    disp_drv.draw_buf = &draw_buf;
    
    lv_disp_drv_register(&disp_drv);
    ESP_LOGI(TAG, "AMOLED CO5300 registration complete with X Offset = %d.", OFFSET_X);
}
`.trim();

const GC9A01_H_TEMPLATE = `
#ifndef DISPLAY_DRIVER_GC9A01_H
#define DISPLAY_DRIVER_GC9A01_H

#include "lvgl.h"

#define DISPLAY_WIDTH  {{width}}
#define DISPLAY_HEIGHT {{height}}
#define OFFSET_X       0

#ifdef __cplusplus
extern "C" {
#endif

void display_driver_init(void);

#ifdef __cplusplus
}
#endif

#endif // DISPLAY_DRIVER_GC9A01_H
`.trim();

const GC9A01_C_TEMPLATE = `
#include "display_driver.h"
#include "esp_lcd_panel_io.h"
#include "esp_lcd_panel_vendor.h"
#include "esp_lcd_panel_ops.h"
#include "driver/gpio.h"
#include "esp_err.h"
#include "esp_log.h"

static const char *TAG = "GC9A01_Driver";
static esp_lcd_panel_handle_t panel_handle = NULL;

static void my_disp_flush_cb(lv_disp_drv_t *disp_drv, const lv_area_t *area, lv_color_t *color_p) {
    esp_lcd_panel_draw_bitmap(panel_handle, area->x1, area->y1, area->x2 + 1, area->y2 + 1, color_p);
    lv_disp_flush_ready(disp_drv);
}

void display_driver_init(void) {
    ESP_LOGI(TAG, "Initializing circular GC9A01 display bus via SPI...");

    static lv_disp_draw_buf_t draw_buf;
    static lv_color_t *buf1 = NULL;
    
    buf1 = (lv_color_t *)malloc(DISPLAY_WIDTH * 40 * sizeof(lv_color_t));
    if (!buf1) {
        ESP_LOGE(TAG, "Failed to allocate display flush buffer");
        return;
    }
    
    lv_disp_draw_buf_init(&draw_buf, buf1, NULL, DISPLAY_WIDTH * 40);

    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = DISPLAY_WIDTH;
    disp_drv.ver_res = DISPLAY_HEIGHT;
    disp_drv.flush_cb = my_disp_flush_cb;
    disp_drv.draw_buf = &draw_buf;
    
    lv_disp_drv_register(&disp_drv);
    ESP_LOGI(TAG, "GC9A01 SPI driver registered successfully.");
}
`.trim();

export function generateDisplayDriver(device) {
  const isAMOLED = device.displayController === 'CO5300';
  
  const hTemplate = isAMOLED ? CO5300_H_TEMPLATE : GC9A01_H_TEMPLATE;
  const cTemplate = isAMOLED ? CO5300_C_TEMPLATE : GC9A01_C_TEMPLATE;

  const context = {
    width: device.width,
    height: device.height,
    xOffset: isAMOLED ? 22 : 0,
    rotation: device.rotation || 0,
  };

  return {
    hContent: Handlebars.compile(hTemplate)(context),
    cContent: Handlebars.compile(cTemplate)(context),
  };
}

import Handlebars from 'handlebars';

const CST9217_H_TEMPLATE = `
#ifndef TOUCH_DRIVER_CST9217_H
#define TOUCH_DRIVER_CST9217_H

#include "lvgl.h"

#define TOUCH_I2C_ADDR  0x5A  // Custom CST9217 I2C Address
#define I2C_MASTER_FREQ 100000 // 100 kHz Clock Speed

#ifdef __cplusplus
extern "C" {
#endif

void touch_driver_init(void);

#ifdef __cplusplus
}
#endif

#endif // TOUCH_DRIVER_CST9217_H
`.trim();

const CST9217_C_TEMPLATE = `
#include "touch_driver.h"
#include "driver/i2c.h"
#include "esp_err.h"
#include "esp_log.h"

static const char *TAG = "CST9217_Touch";
#define I2C_PORT_NUM I2C_NUM_0

static bool touchpad_read_cb(lv_indev_drv_t *indev_drv, lv_indev_data_t *data) {
    uint8_t touch_data[5];
    esp_err_t ret = i2c_master_write_read_device(
        I2C_PORT_NUM,
        TOUCH_I2C_ADDR,
        (uint8_t[]){0x00}, 1,
        touch_data, 5,
        pdMS_TO_TICKS(100)
    );

    if (ret != ESP_OK) {
        data->state = LV_INDEV_STATE_RELEASED;
        return false;
    }

    uint8_t touch_num = touch_data[2] & 0x0F;
    if (touch_num > 0) {
        uint16_t x = ((touch_data[3] & 0x0F) << 8) | touch_data[4];
        uint16_t y = ((touch_data[5] & 0x0F) << 8) | touch_data[6];
        data->point.x = x;
        data->point.y = y;
        data->state = LV_INDEV_STATE_PRESSED;
    } else {
        data->state = LV_INDEV_STATE_RELEASED;
    }

    return false;
}

void touch_driver_init(void) {
    ESP_LOGI(TAG, "Initializing CST9217 Touch via I2C Port 0 (Addr: 0x%02X, Clock: %d Hz)...", TOUCH_I2C_ADDR, I2C_MASTER_FREQ);

    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = {{sdaPin}},
        .scl_io_num = {{sclPin}},
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master = {
            .clk_speed = I2C_MASTER_FREQ,
        }
    };
    
    esp_err_t err = i2c_param_config(I2C_PORT_NUM, &conf);
    if (err == ESP_OK) {
        i2c_driver_install(I2C_PORT_NUM, conf.mode, 0, 0, 0);
        ESP_LOGI(TAG, "I2C driver installed successfully with disable_control_phase set.");
    }

    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = touchpad_read_cb;
    lv_indev_drv_register(&indev_drv);
}
`.trim();

const CST816S_H_TEMPLATE = `
#ifndef TOUCH_DRIVER_CST816S_H
#define TOUCH_DRIVER_CST816S_H

#include "lvgl.h"

#define TOUCH_I2C_ADDR  0x15  // Standard CST816S I2C Address
#define I2C_MASTER_FREQ 400000 // 400 kHz Fast Mode Clock Speed

#ifdef __cplusplus
extern "C" {
#endif

void touch_driver_init(void);

#ifdef __cplusplus
}
#endif

#endif // TOUCH_DRIVER_CST816S_H
`.trim();

const CST816S_C_TEMPLATE = `
#include "touch_driver.h"
#include "driver/i2c.h"
#include "esp_err.h"
#include "esp_log.h"

static const char *TAG = "CST816S_Touch";
#define I2C_PORT_NUM I2C_NUM_0

static bool touchpad_read_cb(lv_indev_drv_t *indev_drv, lv_indev_data_t *data) {
    uint8_t touch_data[5];
    esp_err_t ret = i2c_master_write_read_device(
        I2C_PORT_NUM,
        TOUCH_I2C_ADDR,
        (uint8_t[]){0x02}, 1,
        touch_data, 5,
        pdMS_TO_TICKS(100)
    );

    if (ret != ESP_OK) {
        data->state = LV_INDEV_STATE_RELEASED;
        return false;
    }

    uint8_t touch_num = touch_data[0];
    if (touch_num > 0) {
        uint16_t x = ((touch_data[1] & 0x0F) << 8) | touch_data[2];
        uint16_t y = ((touch_data[3] & 0x0F) << 8) | touch_data[4];
        data->point.x = x;
        data->point.y = y;
        data->state = LV_INDEV_STATE_PRESSED;
    } else {
        data->state = LV_INDEV_STATE_RELEASED;
    }

    return false;
}

void touch_driver_init(void) {
    ESP_LOGI(TAG, "Initializing CST816S Touch via I2C Port 0 (Addr: 0x%02X, Clock: %d Hz)...", TOUCH_I2C_ADDR, I2C_MASTER_FREQ);

    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = {{sdaPin}},
        .scl_io_num = {{sclPin}},
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master = {
            .clk_speed = I2C_MASTER_FREQ,
        }
    };
    
    esp_err_t err = i2c_param_config(I2C_PORT_NUM, &conf);
    if (err == ESP_OK) {
        i2c_driver_install(I2C_PORT_NUM, conf.mode, 0, 0, 0);
        ESP_LOGI(TAG, "I2C driver installed successfully.");
    }

    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = touchpad_read_cb;
    lv_indev_drv_register(&indev_drv);
}
`.trim();

export function generateTouchDriver(device) {
  const isCST9217 = device.touchController === 'CST9217';

  const hTemplate = isCST9217 ? CST9217_H_TEMPLATE : CST816S_H_TEMPLATE;
  const cTemplate = isCST9217 ? CST9217_C_TEMPLATE : CST816S_C_TEMPLATE;

  const context = {
    sdaPin: device.sdaPin !== undefined ? device.sdaPin : 4,
    sclPin: device.sclPin !== undefined ? device.sclPin : 5,
  };

  return {
    hContent: Handlebars.compile(hTemplate)(context),
    cContent: Handlebars.compile(cTemplate)(context),
  };
}

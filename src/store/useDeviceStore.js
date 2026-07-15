import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const DEFAULT_DEVICE = {
  id: 'esp32s3-devkit',
  name: 'ESP32-S3 DevKit',
  chip: 'ESP32-S3',
  display_controller: 'CO5300',
  interface: 'QSPI',
  width: 410,
  height: 502,
  shape: 'rect',
  cornerRadius: 0,
  color_depth: 16,
  swap_rgb: true,
};

const DEFAULT_PINS = {
  SCLK: 12,
  D0: 11,
  D1: 13,
  D2: 14,
  D3: 9,
  CS: 10,
  RST: 3,
  DC: -1,
  SDA: 47,
  SCL: 48,
  INT: 4,
};

export const useDeviceStore = create(
  immer((set) => ({
    // State
    selectedDevice: DEFAULT_DEVICE,
    targetFramework: 'arduino', // Default selection (can be toggled on Export Page)
    displayRotation: 1,         // Default: 90° (Landscape)
    bufferStrategy: 'sram_partial', // Default: SRAM (Partial) for safety
    bufferLines: 40,            // Default: 40 lines (slice rendering)
    displayDriverId: 'co5300_qspi',
    touchDriverId: 'cst9217_i2c',
    driverConfig: {
      pins: DEFAULT_PINS,
      pclk_mhz: 20,
      i2c_freq_hz: 100000,
    },

    // Actions
    selectDevice: (device) =>
      set((state) => {
        state.selectedDevice = device;
      }),

    setTargetFramework: (framework) =>
      set((state) => {
        state.targetFramework = framework;
      }),

    setDisplayRotation: (rotation) =>
      set((state) => {
        state.displayRotation = rotation;
      }),

    setBufferStrategy: (strategy) =>
      set((state) => {
        state.bufferStrategy = strategy;
        // Adjust buffer line recommendations dynamically
        if (strategy === 'psram_full') {
          state.bufferLines = state.selectedDevice.height;
        } else {
          state.bufferLines = 40; // Default partial slice size
        }
      }),

    setBufferLines: (lines) =>
      set((state) => {
        state.bufferLines = lines;
      }),

    updatePin: (functionName, gpio) =>
      set((state) => {
        state.driverConfig.pins[functionName] = gpio;
      }),

    updatePins: (pinsMap) =>
      set((state) => {
        state.driverConfig.pins = { ...state.driverConfig.pins, ...pinsMap };
      }),

    updateDriverConfig: (config) =>
      set((state) => {
        state.driverConfig = { ...state.driverConfig, ...config };
      }),
  }))
);

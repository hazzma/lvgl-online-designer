import React from 'react';
import { Group, Rect, Text } from 'react-konva';

export default function StatusBatteryWidget({ properties, width, height }) {
  const {
    color = '#ffffff',
    batteryLevel = 80,
    isCharging = false,
    showPercentage = false,
    baseColor = '#10b981',
    lowBatteryThreshold = 20,
    lowBatteryColor = '#ef4444',
    chargingColor = '#10b981',
  } = properties;

  const midY = height / 2;

  // Determine active fill color
  const getFillColor = () => {
    if (isCharging) return chargingColor;
    if (batteryLevel <= lowBatteryThreshold) return lowBatteryColor;
    return baseColor;
  };

  const activeColor = getFillColor();

  return (
    <Group width={width} height={height}>
      {/* 1. Optional Percentage Text */}
      {showPercentage && (
        <Text
          text={`${batteryLevel}%`}
          fontSize={10}
          fill={color}
          x={0}
          y={0}
          width={width - 26}
          height={height}
          align="right"
          verticalAlign="middle"
          fontStyle="bold"
        />
      )}

      {/* 2. Battery Icon Group */}
      <Group x={width - 24} y={midY - 6}>
        {/* Outline */}
        <Rect
          width={20}
          height={12}
          stroke={color}
          strokeWidth={1}
          cornerRadius={2}
        />
        {/* Fill */}
        <Rect
          x={2}
          y={2}
          width={16 * (batteryLevel / 100)}
          height={8}
          fill={activeColor}
          cornerRadius={1}
        />
        {/* Tip */}
        <Rect
          x={20}
          y={4}
          width={2}
          height={4}
          fill={color}
          cornerRadius={1}
        />

        {/* 3. Charging indicator overlay (lightning bolt text) */}
        {isCharging && (
          <Text
            text="⚡"
            fontSize={9}
            fill="#eab308" // Yellow lightning bolt
            x={4}
            y={0}
            width={12}
            height={12}
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
          />
        )}
      </Group>
    </Group>
  );
}

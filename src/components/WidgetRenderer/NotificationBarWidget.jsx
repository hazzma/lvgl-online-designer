import React from 'react';
import { Group, Rect, Text } from 'react-konva';

export default function NotificationBarWidget({ properties, width, height }) {
  const batteryLevel = properties.batteryLevel !== undefined ? properties.batteryLevel : 80;
  const isCharging = properties.isCharging || false;
  const showWifi = properties.showWifi !== undefined ? properties.showWifi : true;
  const color = properties.color || '#ffffff';
  
  // Custom styles
  const barStyle = properties.barStyle || 'classic';
  const barOpacity = properties.opacity !== undefined ? properties.opacity : 1;

  // Calculate battery fill color based on level
  const getBatteryColor = (level) => {
    if (isCharging) return '#10b981'; // Green while charging
    if (level <= 20) return '#ef4444'; // Red for low battery
    if (level <= 50) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const midY = height / 2;

  // Determine rendering attributes based on style presets
  let bgFill = properties.bgColor || '#0f172a';
  let strokeColor = 'transparent';
  let strokeW = 0;
  let shadowOpts = {};
  let borderRad = 0;

  if (barStyle === 'glassmorphism') {
    bgFill = 'rgba(255, 255, 255, 0.12)';
    strokeColor = 'rgba(255, 255, 255, 0.18)';
    strokeW = 1;
    borderRad = 4;
  } else if (barStyle === 'neumorphism') {
    bgFill = properties.bgColor || '#1e293b';
    shadowOpts = {
      shadowColor: '#000000',
      shadowBlur: 5,
      shadowOffset: { x: 0, y: 2 },
      shadowOpacity: 0.4,
    };
    borderRad = 3;
  } else if (barStyle === 'neo-brutalism') {
    bgFill = properties.bgColor || '#facc15'; // Default neo-brutalism bright yellow
    strokeColor = '#000000';
    strokeW = 2;
    borderRad = 0;
  }

  return (
    <Group width={width} height={height} opacity={barOpacity}>
      {/* 1. Background Fill with style presets */}
      <Rect
        width={width}
        height={height}
        fill={bgFill}
        stroke={strokeColor}
        strokeWidth={strokeW}
        cornerRadius={borderRad}
        {...shadowOpts}
      />

      {/* For neumorphism, add a subtle top highlight bevel line */}
      {barStyle === 'neumorphism' && (
        <Rect
          x={1}
          y={1}
          width={width - 2}
          height={1}
          fill="rgba(255, 255, 255, 0.1)"
        />
      )}

      {/* 2. Sub-elements: Only render if NOT split */}
      {!properties.isSplit && (
        <>
          {/* Clock Timestamp (Left Aligned) */}
          <Text
            text="10:09"
            fontSize={11}
            fill={color}
            x={10}
            y={0}
            height={height}
            verticalAlign="middle"
            fontStyle="bold"
          />

          {/* Battery Icon (Right Aligned) */}
          <Group x={width - 32} y={midY - 6}>
            {/* Outline */}
            <Rect
              width={22}
              height={12}
              stroke={color}
              strokeWidth={1}
              cornerRadius={2}
            />
            {/* Fill */}
            <Rect
              x={2}
              y={2}
              width={18 * (batteryLevel / 100)}
              height={8}
              fill={getBatteryColor(batteryLevel)}
              cornerRadius={1}
            />
            {/* Tip */}
            <Rect
              x={22}
              y={4}
              width={2}
              height={4}
              fill={color}
              cornerRadius={1}
            />
          </Group>

          {/* WiFi Icon (Drawn next to battery) */}
          {showWifi && (
            <Group x={width - 50} y={midY - 5}>
              {/* Signal Bar 1 */}
              <Rect
                x={0}
                y={8}
                width={2}
                height={2}
                fill={color}
                opacity={0.9}
              />
              {/* Signal Bar 2 */}
              <Rect
                x={3}
                y={5}
                width={2}
                height={5}
                fill={color}
                opacity={0.9}
              />
              {/* Signal Bar 3 */}
              <Rect
                x={6}
                y={2}
                width={2}
                height={8}
                fill={color}
                opacity={0.9}
              />
              {/* Signal Bar 4 */}
              <Rect
                x={9}
                y={0}
                width={2}
                height={10}
                fill={color}
                opacity={0.9}
              />
            </Group>
          )}

          {/* Notification Indicator (Centered Dot) */}
          <Rect
            x={width / 2 - 3}
            y={midY - 3}
            width={6}
            height={6}
            fill="#3b82f6"
            cornerRadius={3}
          />
        </>
      )}
    </Group>
  );
}

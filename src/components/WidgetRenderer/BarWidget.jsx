import React from 'react';
import { Group, Rect } from 'react-konva';

export default function BarWidget({ properties, width, height }) {
  const {
    value = 60,
    min = 0,
    max = 100,
    barColor = '#3b82f6',
    bgColor = '#1e293b',
    borderRadius = 4,
  } = properties;

  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const fillW = width * fraction;

  return (
    <Group>
      {/* Background */}
      <Rect
        width={width} height={height}
        fill={bgColor}
        cornerRadius={borderRadius}
      />
      {/* Fill */}
      <Rect
        width={fillW} height={height}
        fill={barColor}
        cornerRadius={borderRadius}
      />
    </Group>
  );
}

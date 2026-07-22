import React from 'react';
import { Group, Arc, Circle } from 'react-konva';

export default function SpinnerWidget({ properties, width, height }) {
  const {
    spinnerColor = '#3b82f6',
    bgColor = '#1e293b',
    thickness = 4,
  } = properties;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - thickness / 2 - 2;

  return (
    <Group>
      {/* Background ring */}
      <Arc
        x={cx} y={cy}
        innerRadius={radius - thickness / 2}
        outerRadius={radius + thickness / 2}
        angle={360}
        rotation={0}
        fill={bgColor}
      />
      {/* Active spinner arc — static preview at 90° */}
      <Arc
        x={cx} y={cy}
        innerRadius={radius - thickness / 2}
        outerRadius={radius + thickness / 2}
        angle={90}
        rotation={-45}
        fill={spinnerColor}
      />
      {/* Center dot */}
      <Circle
        x={cx} y={cy}
        radius={2}
        fill={spinnerColor}
      />
    </Group>
  );
}

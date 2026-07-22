import React from 'react';
import { Group, Rect, Text } from 'react-konva';

export default function CheckboxWidget({ properties, width, height }) {
  const {
    checked = false,
    label = 'Option',
    checkColor = '#3b82f6',
    labelColor = '#ffffff',
    fontSize = 13,
  } = properties;

  const boxSize = Math.min(height - 4, 18);
  const boxY = (height - boxSize) / 2;
  const gap = 8;

  return (
    <Group>
      {/* Checkbox square */}
      <Rect
        x={0} y={boxY}
        width={boxSize} height={boxSize}
        fill={checked ? checkColor : 'transparent'}
        stroke={checked ? checkColor : '#64748b'}
        strokeWidth={2}
        cornerRadius={3}
      />
      {/* Checkmark */}
      {checked && (
        <Text
          text="✓"
          fontSize={boxSize - 4}
          fill="#ffffff"
          fontStyle="bold"
          x={0} y={boxY}
          width={boxSize} height={boxSize}
          align="center"
          verticalAlign="middle"
        />
      )}
      {/* Label */}
      <Text
        text={label}
        fontSize={fontSize}
        fill={labelColor}
        x={boxSize + gap} y={0}
        width={width - boxSize - gap}
        height={height}
        verticalAlign="middle"
      />
    </Group>
  );
}

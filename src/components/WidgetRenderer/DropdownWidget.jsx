import React from 'react';
import { Group, Rect, Text } from 'react-konva';

export default function DropdownWidget({ properties, width, height }) {
  const {
    options = ['Option 1', 'Option 2', 'Option 3'],
    selectedIndex = 0,
    bgColor = '#1e293b',
    textColor = '#e2e8f0',
    arrowColor = '#94a3b8',
    borderColor = '#334155',
    fontSize = 12,
    borderRadius = 4,
  } = properties;

  const selectedText = (Array.isArray(options) ? options[selectedIndex] : 'Select...') || 'Select...';
  const arrowSize = 10;
  const pad = 10;

  return (
    <Group>
      {/* Background */}
      <Rect
        width={width} height={height}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={1}
        cornerRadius={borderRadius}
      />
      {/* Selected text */}
      <Text
        text={selectedText}
        fontSize={fontSize}
        fill={textColor}
        x={pad} y={0}
        width={width - pad * 2 - arrowSize - 4}
        height={height}
        verticalAlign="middle"
      />
      {/* Down arrow */}
      <Text
        text="▼"
        fontSize={arrowSize}
        fill={arrowColor}
        x={width - pad - arrowSize} y={0}
        width={arrowSize + pad}
        height={height}
        verticalAlign="middle"
        align="right"
      />
    </Group>
  );
}

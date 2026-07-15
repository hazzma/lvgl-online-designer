import React from 'react';
import { Group, Rect, Text } from 'react-konva';

export default function ButtonWidget({ properties, width, height }) {
  return (
    <Group>
      <Rect
        width={width}
        height={height}
        fill={properties.bgColor || '#2563eb'}
        cornerRadius={properties.borderRadius !== undefined ? properties.borderRadius : 4}
      />
      <Text
        text={properties.label || 'Button'}
        fontSize={properties.fontSize || 14}
        fill={properties.labelColor || '#ffffff'}
        width={width}
        height={height}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
}

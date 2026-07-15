import React from 'react';
import { Rect } from 'react-konva';

export default function RectWidget({ properties, width, height }) {
  return (
    <Rect
      width={width}
      height={height}
      fill={properties.bgColor || '#1e293b'}
      stroke={properties.borderColor || '#3b82f6'}
      strokeWidth={properties.borderSize !== undefined ? properties.borderSize : 1}
      cornerRadius={properties.borderRadius || 0}
    />
  );
}

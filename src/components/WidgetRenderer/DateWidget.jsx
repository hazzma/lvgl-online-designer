import React from 'react';
import { Text } from 'react-konva';

export default function DateWidget({ properties, width, height }) {
  const dateFormat = properties.dateFormat || 'Day, DD Mon';
  
  const getMockDate = (format) => {
    switch (format) {
      case 'YYYY-MM-DD': return '2026-07-15';
      case 'DD/MM/YYYY': return '15/07/2026';
      case 'Day, DD Mon': return 'Wednesday, 15 Jul';
      case 'Mon DD': return 'Jul 15';
      default: return 'Wednesday, 15 Jul';
    }
  };

  return (
    <Text
      text={getMockDate(dateFormat)}
      fontSize={properties.fontSize || 14}
      fill={properties.color || '#94a3b8'}
      width={width}
      height={height}
      align="center"
      verticalAlign="middle"
      fontStyle={properties.fontStyle || 'normal'}
    />
  );
}

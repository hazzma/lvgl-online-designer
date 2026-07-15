import React from 'react';
import { Text } from 'react-konva';

export default function TextWidget({ properties, width, height }) {
  return (
    <Text
      text={properties.text || 'Text Label'}
      fontSize={properties.fontSize || 16}
      fill={properties.color || '#ffffff'}
      width={width}
      height={height}
      align={properties.align || 'center'}
      verticalAlign={properties.verticalAlign || 'middle'}
    />
  );
}

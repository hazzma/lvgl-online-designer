import React from 'react';
import { Text } from 'react-konva';

export default function ClockSeparatorWidget({ properties, width, height }) {
  const {
    fontSize = 36,
    color = '#94a3b8',
    fontStyle = 'bold',
    text = ':',
  } = properties;

  return (
    <Text
      text={text}
      fontSize={fontSize}
      fill={color}
      fontStyle={fontStyle}
      width={width}
      height={height}
      align="center"
      verticalAlign="middle"
    />
  );
}

import React from 'react';
import { Text } from 'react-konva';

export default function ClockMinuteWidget({ properties, width, height }) {
  const {
    fontSize = 36,
    color = '#3b82f6',
    fontStyle = 'bold',
    text = '09',
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

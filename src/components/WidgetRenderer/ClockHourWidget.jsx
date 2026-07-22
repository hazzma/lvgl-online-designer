import React from 'react';
import { Text } from 'react-konva';

export default function ClockHourWidget({ properties, width, height }) {
  const {
    fontSize = 36,
    color = '#ffffff',
    fontStyle = 'bold',
    text = '10',
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

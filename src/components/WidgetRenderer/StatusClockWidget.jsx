import React from 'react';
import { Text } from 'react-konva';

export default function StatusClockWidget({ properties, width, height }) {
  const {
    text = '10:09',
    fontSize = 11,
    color = '#ffffff',
    fontStyle = 'bold',
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

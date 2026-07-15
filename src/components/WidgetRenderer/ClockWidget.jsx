import React from 'react';
import { Group, Text } from 'react-konva';

export default function ClockWidget({ properties, width, height }) {
  const fontSize = properties.fontSize || 28;
  const hours = '10';
  const minutes = '09';
  const seconds = '30';
  const showSeconds = properties.showSeconds || false;

  const hourColor = properties.hourColor || properties.color || '#ffffff';
  const minuteColor = properties.minuteColor || properties.color || '#ffffff';
  const secColor = properties.secColor || '#ef4444';
  const separatorColor = properties.color || '#94a3b8';

  // Calculate text dimensions based on font size to align sub-elements
  const charWidth = fontSize * 0.65;
  const separatorWidth = fontSize * 0.3;

  return (
    <Group width={width} height={height}>
      {/* Hours */}
      <Text
        text={hours}
        fontSize={fontSize}
        fill={hourColor}
        x={0}
        y={0}
        width={charWidth * 2}
        height={height}
        align="right"
        verticalAlign="middle"
        fontStyle="bold"
      />

      {/* Separator */}
      <Text
        text=":"
        fontSize={fontSize}
        fill={separatorColor}
        x={charWidth * 2}
        y={-2} // slightly align colon vertically
        width={separatorWidth}
        height={height}
        align="center"
        verticalAlign="middle"
        fontStyle="bold"
      />

      {/* Minutes */}
      <Text
        text={minutes}
        fontSize={fontSize}
        fill={minuteColor}
        x={charWidth * 2 + separatorWidth}
        y={0}
        width={charWidth * 2}
        height={height}
        align="left"
        verticalAlign="middle"
        fontStyle="bold"
      />

      {/* Optional Seconds */}
      {showSeconds && (
        <Group x={charWidth * 4 + separatorWidth + 4}>
          <Text
            text=":"
            fontSize={fontSize * 0.7}
            fill={separatorColor}
            x={0}
            y={0}
            width={separatorWidth}
            height={height}
            align="center"
            verticalAlign="middle"
          />
          <Text
            text={seconds}
            fontSize={fontSize * 0.7}
            fill={secColor}
            x={separatorWidth}
            y={fontSize * 0.15} // shift seconds down slightly
            width={charWidth * 1.5}
            height={height}
            align="left"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  );
}

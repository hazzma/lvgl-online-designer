import React from 'react';
import { Group, Rect, Circle } from 'react-konva';

export default function SwitchWidget({ properties, width, height }) {
  const {
    checked = false,
    activeColor = '#22c55e',
    inactiveColor = '#475569',
    knobColor = '#ffffff',
  } = properties;

  const trackH = Math.max(16, height * 0.7);
  const trackW = Math.max(32, width);
  const trackY = (height - trackH) / 2;
  const trackR = trackH / 2;
  const knobR = trackH / 2 - 3;
  const knobX = checked ? trackW - trackR : trackR;
  const knobY = trackY + trackH / 2;

  return (
    <Group>
      <Rect
        x={0} y={trackY}
        width={trackW} height={trackH}
        fill={checked ? activeColor : inactiveColor}
        cornerRadius={trackR}
      />
      <Circle
        x={knobX} y={knobY}
        radius={knobR}
        fill={knobColor}
        shadowColor="black"
        shadowBlur={3}
        shadowOpacity={0.25}
      />
    </Group>
  );
}

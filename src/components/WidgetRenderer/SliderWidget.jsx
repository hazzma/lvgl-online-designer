import React from 'react';
import { Group, Rect, Circle } from 'react-konva';

export default function SliderWidget({ properties, width, height }) {
  const {
    value = 50,
    min = 0,
    max = 100,
    trackColor = '#334155',
    activeColor = '#3b82f6',
    knobColor = '#ffffff',
  } = properties;

  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const trackH = Math.max(4, height * 0.3);
  const trackY = (height - trackH) / 2;
  const knobRadius = Math.min(height / 2 - 1, 10);
  const trackPad = knobRadius;
  const trackW = width - trackPad * 2;
  const fillW = trackW * fraction;
  const knobX = trackPad + fillW;

  return (
    <Group>
      {/* Background track */}
      <Rect
        x={trackPad} y={trackY}
        width={trackW} height={trackH}
        fill={trackColor}
        cornerRadius={trackH / 2}
      />
      {/* Active track */}
      <Rect
        x={trackPad} y={trackY}
        width={fillW} height={trackH}
        fill={activeColor}
        cornerRadius={trackH / 2}
      />
      {/* Knob */}
      <Circle
        x={knobX} y={height / 2}
        radius={knobRadius}
        fill={knobColor}
        stroke={activeColor}
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.3}
      />
    </Group>
  );
}

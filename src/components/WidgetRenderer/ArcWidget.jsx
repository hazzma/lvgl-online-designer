import React from 'react';
import { Group, Arc, Text } from 'react-konva';

export default function ArcWidget({ properties, width, height }) {
  const {
    value = 65,
    min = 0,
    max = 100,
    startAngle = 135,
    endAngle = 405,
    arcColor = '#3b82f6',
    bgArcColor = '#1e293b',
    thickness = 8,
    showValue = true,
    valueColor = '#ffffff',
    valueFontSize = 16,
    unit = '%',
  } = properties;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - thickness / 2 - 2;
  const totalAngle = endAngle - startAngle;
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const activeAngle = totalAngle * fraction;

  // Konva Arc uses degrees and draws clockwise from the specified angle
  const bgRotation = startAngle;
  const bgAngle = totalAngle;
  const fgRotation = startAngle;
  const fgAngle = activeAngle;

  return (
    <Group>
      {/* Background arc */}
      <Arc
        x={cx} y={cy}
        innerRadius={radius - thickness / 2}
        outerRadius={radius + thickness / 2}
        angle={bgAngle}
        rotation={bgRotation}
        fill={bgArcColor}
      />
      {/* Active arc */}
      <Arc
        x={cx} y={cy}
        innerRadius={radius - thickness / 2}
        outerRadius={radius + thickness / 2}
        angle={fgAngle}
        rotation={fgRotation}
        fill={arcColor}
      />
      {/* Value text */}
      {showValue && (
        <Text
          text={`${value}${unit}`}
          fontSize={valueFontSize}
          fill={valueColor}
          fontStyle="bold"
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
        />
      )}
    </Group>
  );
}

import React from 'react';
import { Group, Rect, Arc, Circle } from 'react-konva';

export default function StatusWifiWidget({ properties, width, height }) {
  const {
    color = '#ffffff',
    wifiStyle = 'classic', // 'classic' | 'modern'
  } = properties;

  const midY = height / 2;

  return (
    <Group width={width} height={height}>
      {wifiStyle === 'classic' ? (
        <Group x={width / 2 - 6} y={midY - 5}>
          {/* Signal Bar 1 */}
          <Rect x={0} y={8} width={2} height={2} fill={color} opacity={0.9} />
          {/* Signal Bar 2 */}
          <Rect x={3} y={5} width={2} height={5} fill={color} opacity={0.9} />
          {/* Signal Bar 3 */}
          <Rect x={6} y={2} width={2} height={8} fill={color} opacity={0.9} />
          {/* Signal Bar 4 */}
          <Rect x={9} y={0} width={2} height={10} fill={color} opacity={0.9} />
        </Group>
      ) : (
        // Modern wifi logo (layered umbrella arcs)
        <Group x={width / 2} y={midY + 5}>
          {/* Center bottom dot */}
          <Circle x={0} y={0} radius={1.5} fill={color} />
          {/* Arc 1 */}
          <Arc
            x={0} y={0}
            innerRadius={4}
            outerRadius={5.5}
            angle={90}
            rotation={-135}
            fill={color}
          />
          {/* Arc 2 */}
          <Arc
            x={0} y={0}
            innerRadius={8}
            outerRadius={9.5}
            angle={90}
            rotation={-135}
            fill={color}
          />
          {/* Arc 3 */}
          <Arc
            x={0} y={0}
            innerRadius={12}
            outerRadius={13.5}
            angle={90}
            rotation={-135}
            fill={color}
          />
        </Group>
      )}
    </Group>
  );
}

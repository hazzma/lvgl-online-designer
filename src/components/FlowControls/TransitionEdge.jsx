import React from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

const TRIGGER_COLORS = {
  button_press: '#3b82f6',   // blue
  swipe_left:   '#8b5cf6',   // purple
  swipe_right:  '#8b5cf6',
  swipe_up:     '#8b5cf6',
  swipe_down:   '#8b5cf6',
  timeout:      '#f59e0b',   // amber
};

const TRIGGER_ICONS = {
  button_press: '👆',
  swipe_left:   '←',
  swipe_right:  '→',
  swipe_up:     '↑',
  swipe_down:   '↓',
  timeout:      '⏱',
};

export default function TransitionEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  markerEnd,
  data,
  selected,
  // ReactFlow passes edge-level fields as props too
  trigger,
  animation,
  duration,
  label,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const edgeTrigger = trigger || 'button_press';
  const edgeAnim = animation || 'slide_left';
  const edgeDuration = duration || 300;
  const color = TRIGGER_COLORS[edgeTrigger] || '#3b82f6';
  const icon = TRIGGER_ICONS[edgeTrigger] || '→';

  return (
    <>
      {/* Bezier path */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: '6 3',
          filter: selected ? `drop-shadow(0 0 4px ${color}88)` : 'none',
          transition: 'stroke-width 0.15s, filter 0.15s',
        }}
      />

      {/* Floating label using EdgeLabelRenderer for crisp HTML */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
          }}
          className="nodrag nopan"
        >
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg border"
            style={{
              backgroundColor: `${color}18`,
              borderColor: `${color}50`,
              color,
              backdropFilter: 'blur(4px)',
            }}
          >
            <span>{icon}</span>
            <span className="capitalize">{edgeAnim.replace('_', ' ')}</span>
            <span className="opacity-60 font-normal">{edgeDuration}ms</span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

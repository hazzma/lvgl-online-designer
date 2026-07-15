import React from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';

export default function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Visual Bezier connection line */}
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      
      {/* Label overlay (foreignObject allows rendering HTML elements cleanly inside SVG) */}
      {label && (
        <foreignObject
          width={70}
          height={20}
          x={labelX - 35}
          y={labelY - 10}
          className="overflow-visible"
        >
          <div className="bg-slate-900 border border-slate-800 text-[9px] text-emerald-400 font-mono text-center rounded px-1.5 py-0.5 shadow-lg flex items-center justify-center whitespace-nowrap">
            {label}
          </div>
        </foreignObject>
      )}
    </>
  );
}

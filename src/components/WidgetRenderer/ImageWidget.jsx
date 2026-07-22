import React, { useEffect, useState } from 'react';
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva';

export default function ImageWidget({ properties, width, height }) {
  const {
    src = '',
    opacity = 1,
    fit = 'contain', // 'contain' | 'cover' | 'fill'
    borderRadius = 0,
  } = properties;

  const [htmlImage, setHtmlImage] = useState(null);

  useEffect(() => {
    if (!src) {
      setHtmlImage(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setHtmlImage(img);
    img.onerror = () => setHtmlImage(null);
    img.src = src;
  }, [src]);

  // If no image loaded, show placeholder
  if (!htmlImage) {
    return (
      <Group>
        <Rect
          width={width}
          height={height}
          fill="#1e293b"
          stroke="#334155"
          strokeWidth={1}
          cornerRadius={borderRadius}
          dash={[4, 4]}
        />
        <Text
          text="🖼 Drop Image"
          fontSize={11}
          fill="#64748b"
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
          fontStyle="bold"
        />
      </Group>
    );
  }

  return (
    <Group
      clipFunc={borderRadius > 0 ? (ctx) => {
        ctx.beginPath();
        ctx.moveTo(borderRadius, 0);
        ctx.lineTo(width - borderRadius, 0);
        ctx.quadraticCurveTo(width, 0, width, borderRadius);
        ctx.lineTo(width, height - borderRadius);
        ctx.quadraticCurveTo(width, height, width - borderRadius, height);
        ctx.lineTo(borderRadius, height);
        ctx.quadraticCurveTo(0, height, 0, height - borderRadius);
        ctx.lineTo(0, borderRadius);
        ctx.quadraticCurveTo(0, 0, borderRadius, 0);
        ctx.closePath();
      } : undefined}
    >
      <KonvaImage
        image={htmlImage}
        width={width}
        height={height}
        opacity={opacity}
      />
    </Group>
  );
}

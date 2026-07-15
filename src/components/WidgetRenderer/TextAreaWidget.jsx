import React from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import { useWidgetStore } from '../../store/useWidgetStore.js';

export default function TextAreaWidget({ properties, width, height, isSelected, widgetId }) {
  const { focusedWidgetId, setFocusedWidget } = useWidgetStore();
  const isFocused = focusedWidgetId === widgetId;

  const textVal = properties.text || '';
  const placeholder = properties.placeholder || 'Enter text...';
  const fontSize = properties.fontSize || 14;
  const color = properties.color || '#ffffff';
  
  // Calculate text layout offset
  const textX = 8;
  const charWidth = fontSize * 0.6;
  const cursorX = textX + (textVal.length * charWidth);

  const handleFocusClick = (e) => {
    // Set active focus state to this TextArea
    setFocusedWidget(widgetId);
  };

  return (
    <Group width={width} height={height} onClick={handleFocusClick} onTap={handleFocusClick}>
      {/* Background outline */}
      <Rect
        width={width}
        height={height}
        fill={properties.bgColor || '#0f172a'}
        stroke={isFocused ? '#10b981' : (isSelected ? '#3b82f6' : '#334155')} // Green if focused, blue if selected
        strokeWidth={isFocused || isSelected ? 2 : 1}
        cornerRadius={properties.borderRadius !== undefined ? properties.borderRadius : 6}
      />

      {/* Input text / placeholder */}
      {textVal.length === 0 ? (
        <Text
          text={placeholder}
          fontSize={fontSize}
          fill="#475569" // Muted placeholder color
          x={textX}
          y={0}
          width={width - 16}
          height={height}
          verticalAlign="middle"
          fontStyle="italic"
        />
      ) : (
        <Text
          text={textVal}
          fontSize={fontSize}
          fill={color}
          x={textX}
          y={0}
          width={width - 16}
          height={height}
          verticalAlign="middle"
        />
      )}

      {/* Simulated Typing Cursor */}
      {isFocused && (
        <Line
          points={[cursorX, height / 2 - fontSize / 2, cursorX, height / 2 + fontSize / 2]}
          stroke="#10b981"
          strokeWidth={1.5}
        />
      )}
    </Group>
  );
}

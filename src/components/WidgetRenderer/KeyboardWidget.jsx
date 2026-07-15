import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { useWidgetStore } from '../../store/useWidgetStore.js';
import { useProjectStore } from '../../store/useProjectStore.js';

const LAYOUTS = {
  QWERTY: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
    ['Space', 'Clear'],
  ],
  PIN: [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['Clear', '0', '⌫'],
  ],
};

export default function KeyboardWidget({ properties, width, height }) {
  const { widgets, focusedWidgetId, updateWidgetProps } = useWidgetStore();
  const { activeScreenId, pushHistory } = useProjectStore();

  const layoutName = properties.layout || 'QWERTY';
  const rows = LAYOUTS[layoutName] || LAYOUTS.QWERTY;

  const handleKeyPress = (key) => {
    if (!focusedWidgetId || !activeScreenId) return;

    // Find the focused textarea widget
    const activeWidgets = widgets[activeScreenId] || [];
    const focusedWidget = activeWidgets.find((w) => w.id === focusedWidgetId);
    if (!focusedWidget || focusedWidget.type !== 'textarea') return;

    let currentText = focusedWidget.props.text || '';
    let newText = currentText;

    if (key === '⌫') {
      newText = currentText.slice(0, -1);
    } else if (key === 'Clear') {
      newText = '';
    } else if (key === 'Space') {
      newText = currentText + ' ';
    } else {
      newText = currentText + key;
    }

    updateWidgetProps(activeScreenId, focusedWidgetId, { text: newText });
    pushHistory(); // push to history so typing acts as an undoable action
  };

  const totalRows = rows.length;
  const rowHeight = height / totalRows;

  return (
    <Group width={width} height={height}>
      {/* Keyboard Background */}
      <Rect
        width={width}
        height={height}
        fill="#0f172a"
        stroke="#1e293b"
        strokeWidth={1}
        cornerRadius={8}
      />

      {rows.map((row, rowIndex) => {
        const keysInRow = row.length;
        const y = rowIndex * rowHeight;
        
        return (
          <Group key={rowIndex} y={y}>
            {row.map((key, keyIndex) => {
              // Calculate dynamic key width
              const keyWidth = width / keysInRow;
              const x = keyIndex * keyWidth;

              // Render key button
              return (
                <Group
                  key={keyIndex}
                  x={x}
                  onClick={() => handleKeyPress(key)}
                  onTap={() => handleKeyPress(key)}
                >
                  <Rect
                    x={2}
                    y={2}
                    width={keyWidth - 4}
                    height={rowHeight - 4}
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth={0.5}
                    cornerRadius={4}
                  />
                  <Text
                    text={key}
                    fontSize={layoutName === 'PIN' ? 18 : 12}
                    fill="#ffffff"
                    x={2}
                    y={2}
                    width={keyWidth - 4}
                    height={rowHeight - 4}
                    align="center"
                    verticalAlign="middle"
                    fontStyle="bold"
                  />
                </Group>
              );
            })}
          </Group>
        );
      })}
    </Group>
  );
}

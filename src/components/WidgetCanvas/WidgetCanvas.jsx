import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Transformer } from 'react-konva';
import { useWidgetStore } from '../../store/useWidgetStore.js';
import { useProjectStore } from '../../store/useProjectStore.js';
import { useDeviceStore } from '../../store/useDeviceStore.js';
import TextWidget from '../WidgetRenderer/TextWidget';
import RectWidget from '../WidgetRenderer/RectWidget';
import ButtonWidget from '../WidgetRenderer/ButtonWidget';
import ClockWidget from '../WidgetRenderer/ClockWidget';
import DateWidget from '../WidgetRenderer/DateWidget';
import NotificationBarWidget from '../WidgetRenderer/NotificationBarWidget';
import TextAreaWidget from '../WidgetRenderer/TextAreaWidget';
import KeyboardWidget from '../WidgetRenderer/KeyboardWidget';

function getDefaultProps(type) {
  switch (type) {
    case 'text':
      return { text: 'Text Label', fontSize: 16, color: '#ffffff' };
    case 'rect':
      return { bgColor: '#1e293b', borderSize: 1, borderColor: '#3b82f6' };
    case 'button':
      return { label: 'Click Me', bgColor: '#2563eb', labelColor: '#ffffff', borderRadius: 4 };
    case 'image':
      return { src: '', opacity: 1 };
    case 'textarea':
      return { text: '', placeholder: 'Enter text...', fontSize: 14 };
    case 'clock':
      return { format: 'HH:MM:SS', color: '#10b981', fontSize: 28 };
    case 'date':
      return { format: 'DD/MM/YYYY', color: '#94a3b8', fontSize: 14 };
    case 'keyboard':
      return { layout: 'QWERTY', theme: 'dark' };
    case 'notification_bar':
      return { batteryLevel: 80, isCharging: false, showWifi: true, color: '#ffffff', bgColor: '#0f172a' };
    default:
      return {};
  }
}

export default function WidgetCanvas() {
  const stageRef = useRef(null);
  const trRef = useRef(null);

  const { widgets, selectedWidgetId, selectWidget, addWidget, updateWidgetPosition } = useWidgetStore();
  const { activeScreenId, pushHistory } = useProjectStore();
  const { selectedDevice } = useDeviceStore();

  const activeWidgets = widgets[activeScreenId] || [];

  // Update Transformer nodes when selection changes
  useEffect(() => {
    if (trRef.current && stageRef.current) {
      if (!selectedWidgetId) {
        trRef.current.nodes([]);
        return;
      }
      const stage = stageRef.current;
      const selectedNode = stage.findOne('#' + selectedWidgetId);
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
      } else {
        trRef.current.nodes([]);
      }
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedWidgetId, activeWidgets]);

  // Handle stage clicks to deselect
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      selectWidget(null);
    }
  };

  // ✅ BUG-2 FIX: Use getBoundingClientRect to compute accurate drop position
  // relative to the Konva Stage canvas element, not the raw viewport.
  const handleDrop = (e) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData('application/reactflow');
    if (!widgetType || !activeScreenId) return;

    const stage = stageRef.current;
    const stageBox = stage.container().getBoundingClientRect();

    const pointerPosition = {
      x: e.clientX - stageBox.left,
      y: e.clientY - stageBox.top,
    };

    // Default sizing based on widget type
    let width = 120;
    let height = 45;
    if (widgetType === 'keyboard') {
      width = selectedDevice.width - 20;
      height = 150;
    } else if (widgetType === 'rect') {
      width = 100;
      height = 100;
    } else if (widgetType === 'notification_bar') {
      width = selectedDevice.width;
      height = 24;
    }

    // Determine drop position (centered on pointer, status bar snaps to top)
    let x = Math.max(0, Math.min(selectedDevice.width - width, pointerPosition.x - width / 2));
    let y = Math.max(0, Math.min(selectedDevice.height - height, pointerPosition.y - height / 2));
    if (widgetType === 'notification_bar') {
      x = 0;
      y = 0;
    }

    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      screenId: activeScreenId,
      pageId: 'page-1',
      x: Math.round(x),
      y: Math.round(y),
      width,
      height,
      zIndex: activeWidgets.length,
      locked: false,
      visible: true,
      persistent: false,
      props: getDefaultProps(widgetType),
      onTap: {
        action: 'none',
        targetScreenId: null,
        targetPageIndex: null,
        overlayScreenId: null,
        customEventName: null,
        animation: 'slide_left',
        duration: 300,
      },
    };

    addWidget(newWidget);
    pushHistory();
    selectWidget(newWidget.id);
  };

  // Drag operations on widget nodes
  const handleDragEnd = (e, widgetId) => {
    const x = Math.round(e.target.x());
    const y = Math.round(e.target.y());
    
    updateWidgetPosition(activeScreenId, widgetId, x, y);
    pushHistory();
  };

  // ✅ BUG-1 FIX: Read original widget.width/height from store, multiply by scale.
  // Group nodes in Konva do not have an intrinsic width(), so we cannot use
  // node.width() * scaleX directly — it returns 0. Instead we find the widget in
  // the store (before scale is applied) and compute the new intended size.
  const handleTransformEnd = (e, widgetId) => {
    const node = e.target;
    const x = Math.round(node.x());
    const y = Math.round(node.y());

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Find the committed (pre-transform) widget dimensions from store
    const widgetData = activeWidgets.find((w) => w.id === widgetId);
    if (!widgetData) return;

    const width = Math.max(20, Math.round(widgetData.width * scaleX));
    const height = Math.max(20, Math.round(widgetData.height * scaleY));

    // Reset scale back to 1 on the visual node so it renders at the new size
    node.scaleX(1);
    node.scaleY(1);

    updateWidgetPosition(activeScreenId, widgetId, x, y, width, height);
    pushHistory();
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="relative bg-black rounded-lg border border-slate-800 shadow-2xl overflow-hidden"
      style={{
        width: selectedDevice.width,
        height: selectedDevice.height,
      }}
    >
      <Stage
        ref={stageRef}
        width={selectedDevice.width}
        height={selectedDevice.height}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
      >
        <Layer>
          {activeWidgets.map((w) => {
            if (!w.visible) return null;

            const isSelected = w.id === selectedWidgetId;

            // Render different visual shapes depending on widget type
            const renderShape = () => {
              if (w.type === 'text') {
                return <TextWidget properties={w.props} width={w.width} height={w.height} />;
              }

              if (w.type === 'button') {
                return <ButtonWidget properties={w.props} width={w.width} height={w.height} />;
              }

              if (w.type === 'rect') {
                return <RectWidget properties={w.props} width={w.width} height={w.height} />;
              }

              if (w.type === 'clock') {
                return <ClockWidget properties={w.props} width={w.width} height={w.height} />;
              }

              if (w.type === 'date') {
                return <DateWidget properties={w.props} width={w.width} height={w.height} />;
              }

              if (w.type === 'notification_bar') {
                return <NotificationBarWidget properties={w.props} width={w.width} height={w.height} />;
              }

              if (w.type === 'textarea') {
                return <TextAreaWidget properties={w.props} width={w.width} height={w.height} isSelected={isSelected} widgetId={w.id} />;
              }

              if (w.type === 'keyboard') {
                return <KeyboardWidget properties={w.props} width={w.width} height={w.height} />;
              }

              // Fallback placeholder rendering for complex compound widgets
              return (
                <Group>
                  <Rect
                    width={w.width}
                    height={w.height}
                    fill="#1f2937"
                    stroke={isSelected ? '#3b82f6' : '#475569'}
                    strokeWidth={1}
                    cornerRadius={4}
                  />
                  <Text
                    text={`${w.type.toUpperCase()}`}
                    fontSize={11}
                    fill="#94a3b8"
                    width={w.width}
                    height={w.height}
                    align="center"
                    verticalAlign="middle"
                    fontStyle="bold"
                  />
                </Group>
              );
            };

            return (
              <Group
                key={w.id}
                id={w.id}
                x={w.x}
                y={w.y}
                draggable={!w.locked}
                onClick={() => selectWidget(w.id)}
                onTap={() => selectWidget(w.id)}
                onDragEnd={(e) => handleDragEnd(e, w.id)}
                onTransformEnd={(e) => handleTransformEnd(e, w.id)}
              >
                {renderShape()}
              </Group>
            );
          })}

          {/* Bounding box selection transformer */}
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Enforce minimal sizing constraints
              if (newBox.width < 20 || newBox.height < 20) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}

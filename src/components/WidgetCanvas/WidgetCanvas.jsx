import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Transformer, Line } from 'react-konva';
import { useWidgetStore } from '../../store/useWidgetStore.js';
import { useProjectStore } from '../../store/useProjectStore.js';
import { useDeviceStore } from '../../store/useDeviceStore.js';
import { getDefaultProps, getDefaultSize } from '../../utils/widgetDefaults.js';
import AlignmentToolbar from '../AlignmentToolbar.jsx';
import TextWidget from '../WidgetRenderer/TextWidget';
import RectWidget from '../WidgetRenderer/RectWidget';
import ButtonWidget from '../WidgetRenderer/ButtonWidget';
import ClockWidget from '../WidgetRenderer/ClockWidget';
import ClockHourWidget from '../WidgetRenderer/ClockHourWidget';
import ClockMinuteWidget from '../WidgetRenderer/ClockMinuteWidget';
import ClockSeparatorWidget from '../WidgetRenderer/ClockSeparatorWidget';
import DateWidget from '../WidgetRenderer/DateWidget';
import NotificationBarWidget from '../WidgetRenderer/NotificationBarWidget';
import TextAreaWidget from '../WidgetRenderer/TextAreaWidget';
import KeyboardWidget from '../WidgetRenderer/KeyboardWidget';
import ImageWidget from '../WidgetRenderer/ImageWidget';
import SliderWidget from '../WidgetRenderer/SliderWidget';
import SwitchWidget from '../WidgetRenderer/SwitchWidget';
import ArcWidget from '../WidgetRenderer/ArcWidget';
import BarWidget from '../WidgetRenderer/BarWidget';
import CheckboxWidget from '../WidgetRenderer/CheckboxWidget';
import DropdownWidget from '../WidgetRenderer/DropdownWidget';
import SpinnerWidget from '../WidgetRenderer/SpinnerWidget';
import StatusClockWidget from '../WidgetRenderer/StatusClockWidget';
import StatusWifiWidget from '../WidgetRenderer/StatusWifiWidget';
import StatusBatteryWidget from '../WidgetRenderer/StatusBatteryWidget';

export default function WidgetCanvas() {
  const stageRef = useRef(null);
  const trRef = useRef(null);

  const { widgets, selectedWidgetId, selectedWidgetIds, selectWidget, toggleMultiSelect, clearMultiSelect, addWidget, updateWidgetPosition, updateWidgetProps } = useWidgetStore();
  const { activeScreenId, pushHistory, activePageId, screens, addPageToDirection, setActivePageId, updatePageTransition, gridEnabled, toggleGrid, magnetEnabled, toggleMagnet } = useProjectStore();
  const { selectedDevice } = useDeviceStore();

  const [activeTransitionDirection, setActiveTransitionDirection] = useState(null); // null | 'left' | 'right' | 'top' | 'bottom'
  const [selectedAnimation, setSelectedAnimation] = useState('scroll_left');
  const [guideLines, setGuideLines] = useState([]);
  const guideLinesRef = useRef([]);

  const activeWidgets = widgets[activeScreenId] || [];
  const currentScreen = screens.find((s) => s.id === activeScreenId);
  const currentPages = currentScreen?.pages || [];
  const currentPage = currentPages.find((p) => p.id === activePageId) || currentPages[0] || { id: 'page-1', name: 'Main Page', gridX: 0, gridY: 0 };

  const gridX = currentPage.gridX || 0;
  const gridY = currentPage.gridY || 0;

  const leftPage = currentPages.find((p) => (p.gridX || 0) === gridX - 1 && (p.gridY || 0) === gridY);
  const rightPage = currentPages.find((p) => (p.gridX || 0) === gridX + 1 && (p.gridY || 0) === gridY);
  const topPage = currentPages.find((p) => (p.gridX || 0) === gridX && (p.gridY || 0) === gridY - 1);
  const bottomPage = currentPages.find((p) => (p.gridX || 0) === gridX && (p.gridY || 0) === gridY + 1);

  // Update Transformer nodes when selection changes
  useEffect(() => {
    if (trRef.current && stageRef.current) {
      if (!selectedWidgetIds || selectedWidgetIds.length === 0) {
        if (selectedWidgetId) {
          const selectedNode = stageRef.current.findOne('#' + selectedWidgetId);
          trRef.current.nodes(selectedNode ? [selectedNode] : []);
        } else {
          trRef.current.nodes([]);
        }
      } else {
        const stage = stageRef.current;
        const nodes = selectedWidgetIds.map(id => stage.findOne('#' + id)).filter(Boolean);
        // Include single selectedWidgetId if it's not in the array somehow
        if (selectedWidgetId && !selectedWidgetIds.includes(selectedWidgetId)) {
          const single = stage.findOne('#' + selectedWidgetId);
          if (single) nodes.push(single);
        }
        trRef.current.nodes(nodes);
      }
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedWidgetId, selectedWidgetIds, activeWidgets]);

  // Handle stage clicks to deselect
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      selectWidget(null);
      clearMultiSelect();
    }
  };

  const handleWidgetClick = (e, widgetId) => {
    e.cancelBubble = true;
    if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
      toggleMultiSelect(widgetId);
    } else {
      selectWidget(widgetId);
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
    const { width, height } = getDefaultSize(widgetType, selectedDevice.width);

    // Determine drop position (centered on pointer, status bar snaps to top)
    let x = Math.max(0, Math.min(selectedDevice.width - width, pointerPosition.x - width / 2));
    let y = Math.max(0, Math.min(selectedDevice.height - height, pointerPosition.y - height / 2));
    if (widgetType === 'notification_bar') {
      x = 0;
      y = 0;
    }

    const newWidget = {
      id: `widget-${Date.now()}`,
      name: `${widgetType}_${activeWidgets.length + 1}`,
      type: widgetType,
      screenId: activeScreenId,
      pageId: activePageId || 'page-1',
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
  const handleDragStart = (e, widgetId) => {
    const isMultiSelected = selectedWidgetIds.includes(widgetId) || (selectedWidgetId === widgetId && selectedWidgetIds.length > 0);
    const idsToDrag = isMultiSelected ? [...new Set([...selectedWidgetIds, selectedWidgetId].filter(Boolean))] : [widgetId];
    
    idsToDrag.forEach((id) => {
      const node = stageRef.current?.findOne('#' + id);
      if (node) {
        node.setAttr('startX', node.x());
        node.setAttr('startY', node.y());
      }
    });
  };

  // ── Smart Alignment Guides (Canva-style) ─────────────────────────────────
  // Always calculates alignment. Shows guide lines always. Snaps only if magnetEnabled.
  // overrideW/overrideH: use during resize when store hasn't been updated yet.
  const calcAlignmentGuides = (draggedId, posX, posY, overrideW, overrideH) => {
    const widgetData = activeWidgets.find((w) => w.id === draggedId);
    if (!widgetData) return { guides: [], snapX: posX, snapY: posY };

    const ww = overrideW !== undefined ? overrideW : widgetData.width;
    const wh = overrideH !== undefined ? overrideH : widgetData.height;
    const snapTol = 5;

    // Dragged widget edges
    const dragLeft    = posX;
    const dragCenterX = posX + ww / 2;
    const dragRight   = posX + ww;
    const dragTop     = posY;
    const dragCenterY = posY + wh / 2;
    const dragBottom  = posY + wh;

    // Collect target snap lines from canvas edges/center + other widgets
    const vTargets = [
      { pos: 0, label: 'canvas-left' },
      { pos: selectedDevice.width / 2, label: 'canvas-center' },
      { pos: selectedDevice.width, label: 'canvas-right' },
    ];
    const hTargets = [
      { pos: 0, label: 'canvas-top' },
      { pos: selectedDevice.height / 2, label: 'canvas-center' },
      { pos: selectedDevice.height, label: 'canvas-bottom' },
    ];

    const pageWidgets = activeWidgets.filter((w) =>
      w.id !== draggedId && w.visible &&
      (w.pageId === activePageId || w.type === 'notification_bar' || w.persistent || !w.pageId)
    );

    pageWidgets.forEach((other) => {
      vTargets.push(
        { pos: other.x, label: `${other.id}-left` },
        { pos: other.x + other.width / 2, label: `${other.id}-cx` },
        { pos: other.x + other.width, label: `${other.id}-right` },
      );
      hTargets.push(
        { pos: other.y, label: `${other.id}-top` },
        { pos: other.y + other.height / 2, label: `${other.id}-cy` },
        { pos: other.y + other.height, label: `${other.id}-bottom` },
      );
    });

    // ── Find closest X snap ─────────────────────────────────────────────────
    const dragXEdges = [
      { offset: 0,      val: dragLeft },
      { offset: ww / 2, val: dragCenterX },
      { offset: ww,     val: dragRight },
    ];

    let bestSnapX = null;
    let bestDiffX = snapTol + 1;
    const matchedVGuides = [];

    for (const edge of dragXEdges) {
      for (const target of vTargets) {
        const diff = Math.abs(edge.val - target.pos);
        if (diff < snapTol && diff < bestDiffX) {
          bestDiffX = diff;
          bestSnapX = target.pos - edge.offset;
          matchedVGuides.length = 0;
          matchedVGuides.push(target.pos);
        } else if (diff < snapTol && Math.abs(diff - bestDiffX) < 0.5) {
          matchedVGuides.push(target.pos);
        }
      }
    }

    // ── Find closest Y snap ─────────────────────────────────────────────────
    const dragYEdges = [
      { offset: 0,      val: dragTop },
      { offset: wh / 2, val: dragCenterY },
      { offset: wh,     val: dragBottom },
    ];

    let bestSnapY = null;
    let bestDiffY = snapTol + 1;
    const matchedHGuides = [];

    for (const edge of dragYEdges) {
      for (const target of hTargets) {
        const diff = Math.abs(edge.val - target.pos);
        if (diff < snapTol && diff < bestDiffY) {
          bestDiffY = diff;
          bestSnapY = target.pos - edge.offset;
          matchedHGuides.length = 0;
          matchedHGuides.push(target.pos);
        } else if (diff < snapTol && Math.abs(diff - bestDiffY) < 0.5) {
          matchedHGuides.push(target.pos);
        }
      }
    }

    const guides = [];
    matchedVGuides.forEach((pos) => guides.push({ type: 'vertical', pos }));
    matchedHGuides.forEach((pos) => guides.push({ type: 'horizontal', pos }));

    // ── Size-Matching Guides ────────────────────────────────────────────────
    // Show a guide when the dragged widget's width or height matches another's.
    const sizeTol = 3;
    pageWidgets.forEach((other) => {
      // Width match
      if (Math.abs(ww - other.width) < sizeTol) {
        // Draw vertical dash at right edge of dragged and right edge of other
        guides.push({ type: 'size-w', dragX: posX, dragW: ww, otherX: other.x, otherW: other.width, y: Math.min(posY, other.y) - 6 });
      }
      // Height match
      if (Math.abs(wh - other.height) < sizeTol) {
        guides.push({ type: 'size-h', dragY: posY, dragH: wh, otherY: other.y, otherH: other.height, x: Math.min(posX, other.x) - 6 });
      }
    });

    // ── Equal Spacing (Distribute) Guides ────────────────────────────────────
    const gapTol = 5;

    // Horizontal equal-spacing check
    for (let i = 0; i < pageWidgets.length; i++) {
      const a = pageWidgets[i];
      for (let j = 0; j < pageWidgets.length; j++) {
        if (i === j) continue;
        const b = pageWidgets[j];
        const gapAfterA = dragLeft - (a.x + a.width);
        const gapAB = b.x - (a.x + a.width);
        if (Math.abs(gapAfterA - gapAB) < gapTol && gapAfterA > 0 && gapAB > 0) {
          guides.push({ type: 'gap-h', x1: a.x + a.width, x2: dragLeft, y: a.y + a.height / 2 });
          guides.push({ type: 'gap-h', x1: a.x + a.width, x2: b.x, y: b.y + b.height / 2 });
        }
        const gapBeforeA = a.x - dragRight;
        const gapBA = a.x - (b.x + b.width);
        if (Math.abs(gapBeforeA - gapBA) < gapTol && gapBeforeA > 0 && gapBA > 0) {
          guides.push({ type: 'gap-h', x1: dragRight, x2: a.x, y: a.y + a.height / 2 });
          guides.push({ type: 'gap-h', x1: b.x + b.width, x2: a.x, y: b.y + b.height / 2 });
        }
      }
    }

    // Vertical equal-spacing check
    for (let i = 0; i < pageWidgets.length; i++) {
      const a = pageWidgets[i];
      for (let j = 0; j < pageWidgets.length; j++) {
        if (i === j) continue;
        const b = pageWidgets[j];
        const gapAfterA = dragTop - (a.y + a.height);
        const gapAB = b.y - (a.y + a.height);
        if (Math.abs(gapAfterA - gapAB) < gapTol && gapAfterA > 0 && gapAB > 0) {
          guides.push({ type: 'gap-v', y1: a.y + a.height, y2: dragTop, x: a.x + a.width / 2 });
          guides.push({ type: 'gap-v', y1: a.y + a.height, y2: b.y, x: b.x + b.width / 2 });
        }
        const gapBeforeA = a.y - dragBottom;
        const gapBA = a.y - (b.y + b.height);
        if (Math.abs(gapBeforeA - gapBA) < gapTol && gapBeforeA > 0 && gapBA > 0) {
          guides.push({ type: 'gap-v', y1: dragBottom, y2: a.y, x: a.x + a.width / 2 });
          guides.push({ type: 'gap-v', y1: b.y + b.height, y2: a.y, x: b.x + b.width / 2 });
        }
      }
    }

    return {
      guides,
      snapX: bestSnapX !== null ? bestSnapX : posX,
      snapY: bestSnapY !== null ? bestSnapY : posY,
    };
  };

  const handleDragMove = (e, widgetId) => {
    const node = e.target;
    const isMultiSelected = selectedWidgetIds.includes(widgetId) || (selectedWidgetId === widgetId && selectedWidgetIds.length > 0);
    
    if (isMultiSelected) {
      const idsToDrag = [...new Set([...selectedWidgetIds, selectedWidgetId].filter(Boolean))];
      if (idsToDrag.length > 1) {
        const dx = node.x() - (node.attrs.startX || 0);
        const dy = node.y() - (node.attrs.startY || 0);

        idsToDrag.forEach((id) => {
          if (id !== widgetId) {
            const otherNode = stageRef.current?.findOne('#' + id);
            if (otherNode && otherNode.attrs.startX !== undefined) {
              otherNode.x(otherNode.attrs.startX + dx);
              otherNode.y(otherNode.attrs.startY + dy);
            }
          }
        });
      }
    }

    // ── Always calculate alignment guides ──
    const { guides, snapX, snapY } = calcAlignmentGuides(widgetId, node.x(), node.y());

    // Apply snap if magnet is enabled
    if (magnetEnabled && (snapX !== node.x() || snapY !== node.y())) {
      node.x(snapX);
      node.y(snapY);

      // Also move multi-selected siblings
      if (isMultiSelected) {
        const idsToDrag = [...new Set([...selectedWidgetIds, selectedWidgetId].filter(Boolean))];
        if (idsToDrag.length > 1) {
          const dx = snapX - (node.attrs.startX || 0);
          const dy = snapY - (node.attrs.startY || 0);
          idsToDrag.forEach((id) => {
            if (id !== widgetId) {
              const otherNode = stageRef.current?.findOne('#' + id);
              if (otherNode && otherNode.attrs.startX !== undefined) {
                otherNode.x(otherNode.attrs.startX + dx);
                otherNode.y(otherNode.attrs.startY + dy);
              }
            }
          });
        }
      }
    }

    // Always update visual guides
    const currentStr = JSON.stringify(guideLinesRef.current);
    const newStr = JSON.stringify(guides);
    if (currentStr !== newStr) {
      guideLinesRef.current = guides;
      setGuideLines(guides);
    }
  };

  const handleDragEnd = (e, widgetId) => {
    const isMultiSelected = selectedWidgetIds.includes(widgetId) || (selectedWidgetId === widgetId && selectedWidgetIds.length > 0);
    const idsToDrag = isMultiSelected ? [...new Set([...selectedWidgetIds, selectedWidgetId].filter(Boolean))] : [widgetId];
    
    if (idsToDrag.length > 1) {
      const node = e.target;
      const dx = Math.round(node.x()) - (node.attrs.startX || 0);
      const dy = Math.round(node.y()) - (node.attrs.startY || 0);

      idsToDrag.forEach((id) => {
        const w = activeWidgets.find(aw => aw.id === id);
        if (w) {
          updateWidgetPosition(activeScreenId, id, Math.round(w.x + dx), Math.round(w.y + dy));
        }
      });
    } else {
      const x = Math.round(e.target.x());
      const y = Math.round(e.target.y());
      updateWidgetPosition(activeScreenId, widgetId, x, y);
    }
    
    // Clear guides on drop
    if (guideLinesRef.current.length > 0) {
      guideLinesRef.current = [];
      setGuideLines([]);
    }

    pushHistory();
  };

  const dragBoundFunc = (pos) => {
    let { x, y } = pos;
    if (gridEnabled) {
      x = Math.round(x / 10) * 10;
      y = Math.round(y / 10) * 10;
    }
    return { x, y };
  };

  // ── Live Transform (resize) guides ──────────────────────────────────────
  const handleTransform = (e, widgetId) => {
    const node = e.target;
    const widgetData = activeWidgets.find((w) => w.id === widgetId);
    if (!widgetData) return;

    // Compute live dimensions during resize
    const liveW = Math.max(20, Math.round(widgetData.width * node.scaleX()));
    const liveH = Math.max(20, Math.round(widgetData.height * node.scaleY()));
    const liveX = Math.round(node.x());
    const liveY = Math.round(node.y());

    // Calculate guides with overridden dimensions
    const { guides } = calcAlignmentGuides(widgetId, liveX, liveY, liveW, liveH);

    const currentStr = JSON.stringify(guideLinesRef.current);
    const newStr = JSON.stringify(guides);
    if (currentStr !== newStr) {
      guideLinesRef.current = guides;
      setGuideLines(guides);
    }
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

    // Commit position/dimension changes
    updateWidgetPosition(activeScreenId, widgetId, x, y, width, height);

    // Dynamically scale font size props based on scaleY height transform
    if (
      widgetData.type === 'text' ||
      widgetData.type === 'clock_hour' ||
      widgetData.type === 'clock_minute' ||
      widgetData.type === 'clock_separator' ||
      widgetData.type === 'date'
    ) {
      const currentFontSize = widgetData.props?.fontSize || (widgetData.type === 'clock_separator' ? 36 : (widgetData.type === 'text' ? 16 : 36));
      const newFontSize = Math.max(6, Math.round(currentFontSize * scaleY));
      updateWidgetProps(activeScreenId, widgetId, { fontSize: newFontSize });
    } else if (widgetData.type === 'clock') {
      const isDigital = (widgetData.props?.clockMode || 'digital') === 'digital';
      if (isDigital) {
        const hourFontSize = widgetData.props?.hourFontSize || 36;
        const minuteFontSize = widgetData.props?.minuteFontSize || 36;
        const secFontSize = widgetData.props?.secFontSize || 20;

        updateWidgetProps(activeScreenId, widgetId, {
          hourFontSize: Math.max(6, Math.round(hourFontSize * scaleY)),
          minuteFontSize: Math.max(6, Math.round(minuteFontSize * scaleY)),
          secFontSize: Math.max(6, Math.round(secFontSize * scaleY)),
        });
      } else {
        const dialNumberFontSize = widgetData.props?.dialNumberFontSize || 11;
        updateWidgetProps(activeScreenId, widgetId, {
          dialNumberFontSize: Math.max(6, Math.round(dialNumberFontSize * scaleY)),
        });
      }
    }

    // Clear guides on transform end
    if (guideLinesRef.current.length > 0) {
      guideLinesRef.current = [];
      setGuideLines([]);
    }

    pushHistory();
  };

  const handleOpenTransitionSettings = (direction) => {
    setActiveTransitionDirection(direction);
    const currentAnim = currentPage?.transitions?.[direction] || 'scroll_left';
    setSelectedAnimation(currentAnim);
  };

  const handleSaveTransition = () => {
    if (activeTransitionDirection) {
      updatePageTransition(activeScreenId, currentPage.id, activeTransitionDirection, selectedAnimation);
      
      let neighborPage = null;
      let reverseDir = 'left';
      if (activeTransitionDirection === 'left') {
        neighborPage = leftPage;
        reverseDir = 'right';
      } else if (activeTransitionDirection === 'right') {
        neighborPage = rightPage;
        reverseDir = 'left';
      } else if (activeTransitionDirection === 'top') {
        neighborPage = topPage;
        reverseDir = 'bottom';
      } else if (activeTransitionDirection === 'bottom') {
        neighborPage = bottomPage;
        reverseDir = 'top';
      }
      
      let reverseAnim = 'scroll_right';
      if (selectedAnimation === 'scroll_left') reverseAnim = 'scroll_right';
      else if (selectedAnimation === 'scroll_right') reverseAnim = 'scroll_left';
      else if (selectedAnimation === 'scroll_up') reverseAnim = 'scroll_down';
      else if (selectedAnimation === 'scroll_down') reverseAnim = 'scroll_up';
      else if (selectedAnimation === 'fade') reverseAnim = 'fade';
      else if (selectedAnimation === 'none') reverseAnim = 'none';

      if (neighborPage) {
        updatePageTransition(activeScreenId, neighborPage.id, reverseDir, reverseAnim);
      }
      
      setActiveTransitionDirection(null);
    }
  };

  const isRound = selectedDevice.shape === 'circle';

  const renderShape = (w, isSelected = false) => {
    switch (w.type) {
      case 'text':
        return <TextWidget properties={w.props} width={w.width} height={w.height} />;
      case 'button':
        return <ButtonWidget properties={w.props} width={w.width} height={w.height} />;
      case 'rect':
        return <RectWidget properties={w.props} width={w.width} height={w.height} />;
      case 'clock':
        return <ClockWidget properties={w.props} width={w.width} height={w.height} />;
      case 'clock_hour':
        return <ClockHourWidget properties={w.props} width={w.width} height={w.height} />;
      case 'clock_minute':
        return <ClockMinuteWidget properties={w.props} width={w.width} height={w.height} />;
      case 'clock_separator':
        return <ClockSeparatorWidget properties={w.props} width={w.width} height={w.height} />;
      case 'date':
        return <DateWidget properties={w.props} width={w.width} height={w.height} />;
      case 'notification_bar':
        return <NotificationBarWidget properties={w.props} width={w.width} height={w.height} />;
      case 'textarea':
        return <TextAreaWidget properties={w.props} width={w.width} height={w.height} isSelected={isSelected} widgetId={w.id} />;
      case 'keyboard':
        return <KeyboardWidget properties={w.props} width={w.width} height={w.height} />;
      case 'image':
        return <ImageWidget properties={w.props} width={w.width} height={w.height} />;
      case 'slider':
        return <SliderWidget properties={w.props} width={w.width} height={w.height} />;
      case 'switch':
        return <SwitchWidget properties={w.props} width={w.width} height={w.height} />;
      case 'arc':
        return <ArcWidget properties={w.props} width={w.width} height={w.height} />;
      case 'bar':
        return <BarWidget properties={w.props} width={w.width} height={w.height} />;
      case 'checkbox':
        return <CheckboxWidget properties={w.props} width={w.width} height={w.height} />;
      case 'dropdown':
        return <DropdownWidget properties={w.props} width={w.width} height={w.height} />;
      case 'status_clock':
        return <StatusClockWidget properties={w.props} width={w.width} height={w.height} />;
      case 'status_wifi':
        return <StatusWifiWidget properties={w.props} width={w.width} height={w.height} />;
      case 'status_battery':
        return <StatusBatteryWidget properties={w.props} width={w.width} height={w.height} />;
      default:
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
    }
  };

  const MiniCanvas = ({ page, axis }) => {
    if (!page) return <span className="text-[9px] text-slate-700 font-bold font-mono">Empty Slot</span>;
    
    const maxContainerWidth = axis === 'x' ? 100 : 130; 
    const maxContainerHeight = axis === 'x' ? 130 : 40; 
    
    // Scale factor to fit inside container
    const scale = Math.min(
      maxContainerWidth / selectedDevice.width,
      maxContainerHeight / selectedDevice.height
    ) * (axis === 'x' ? 0.9 : 0.8);
    
    const miniWidth = selectedDevice.width * scale;
    const miniHeight = selectedDevice.height * scale;
    
    const pageWidgets = widgets[activeScreenId]?.filter(
      (w) => w.pageId === page.id || w.type === 'notification_bar' || w.persistent || (!w.pageId && w.type !== 'notification_bar')
    ) || [];

    return (
      <div 
        className="bg-black relative overflow-hidden flex-shrink-0 flex items-center justify-center pointer-events-none shadow-inner"
        style={{
          width: miniWidth,
          height: miniHeight,
          borderRadius: isRound ? '50%' : `${(selectedDevice.cornerRadius || 12) * scale}px`
        }}
      >
        <Stage width={miniWidth} height={miniHeight} scaleX={scale} scaleY={scale}>
          <Layer>
            {pageWidgets.map((w) => {
              if (!w.visible) return null;
              return (
                <Group key={w.id} id={w.id} x={w.x} y={w.y}>
                  {renderShape(w, false)}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-10 relative select-none p-4">
      {/* ──── LEFT NEIGHBOR SLOT ──── */}
      <div className="flex items-center gap-3">
        {/* Left page outline */}
        <div
          onClick={() => leftPage && setActivePageId(leftPage.id)}
          className={`w-28 h-36 border flex flex-col items-center justify-center transition-all relative ${
            leftPage
              ? 'border-slate-800 bg-slate-900/10 hover:bg-slate-900/30 hover:border-blue-500/40 cursor-pointer shadow-lg'
              : 'border-dashed border-slate-900 bg-transparent opacity-10'
          } ${isRound ? 'rounded-full' : 'rounded-xl'}`}
          title={leftPage ? `Slide to Left page` : ''}
        >
          <MiniCanvas page={leftPage} axis="x" />
          {leftPage && (
            <span className="absolute bottom-2 text-[8px] font-mono font-bold text-slate-500">({gridX - 1}, {gridY})</span>
          )}
        </div>

        {/* Gap Controls (plus / settings) */}
        <div className="flex flex-col gap-2 items-center">
          {!leftPage ? (
            <button
              onClick={() => addPageToDirection(activeScreenId, currentPage.id, 'left')}
              className="w-7 h-7 rounded-full bg-slate-900 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white flex items-center justify-center transition-all text-xs font-bold shadow-md cursor-pointer"
              title="Add Page to Left"
            >
              ➕
            </button>
          ) : (
            <button
              onClick={() => handleOpenTransitionSettings('left')}
              className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all shadow-md cursor-pointer"
              title="Swipe Animation settings"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* ──── CENTER VIEWPORT (TOP + CANVAS + BOTTOM) ──── */}
      <div className="flex flex-col items-center gap-6">
        {/* Top page slot */}
        <div className="flex flex-col items-center gap-2.5">
          <div
            onClick={() => topPage && setActivePageId(topPage.id)}
            className={`w-36 h-12 border flex items-center justify-center transition-all relative ${
              topPage
                ? 'border-slate-800 bg-slate-900/10 hover:bg-slate-900/30 hover:border-blue-500/40 cursor-pointer shadow-md'
                : 'border-dashed border-slate-900 bg-transparent opacity-10'
            } ${isRound ? 'rounded-full' : 'rounded-lg'}`}
            title={topPage ? `Slide to Top page` : ''}
          >
            <MiniCanvas page={topPage} axis="y" />
            {topPage && (
              <span className="absolute right-2 text-[8px] font-mono font-bold text-slate-500">({gridX}, {gridY - 1})</span>
            )}
          </div>

          {!topPage ? (
            <button
              onClick={() => addPageToDirection(activeScreenId, currentPage.id, 'top')}
              className="w-6 h-6 rounded-full bg-slate-900 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 text-[10px] text-slate-300 hover:text-white flex items-center justify-center transition-all font-bold shadow-md cursor-pointer"
              title="Add Page to Top"
            >
              ➕
            </button>
          ) : (
            <button
              onClick={() => handleOpenTransitionSettings('top')}
              className="w-6 h-6 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all shadow-md cursor-pointer"
              title="Swipe Animation settings"
            >
              ⚙️
            </button>
          )}
        </div>

        {/* ACTIVE STAGE CANVAS FRAME */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="relative bg-black border border-slate-850 shadow-2xl overflow-hidden"
          style={{
            width: selectedDevice.width,
            height: selectedDevice.height,
            borderRadius: isRound ? '50%' : `${selectedDevice.cornerRadius || 12}px`
          }}
        >
          <Stage
            ref={stageRef}
            width={selectedDevice.width}
            height={selectedDevice.height}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            {/* ── BACKGROUND LAYER ── */}
            <Layer listening={false}>
              <Rect
                x={0}
                y={0}
                width={selectedDevice.width}
                height={selectedDevice.height}
                fill={currentScreen?.bgColor || '#000000'}
              />
            </Layer>

            {/* ── VISUAL GRID LAYER ── */}
            {gridEnabled && (
              <Layer listening={false}>
                {Array.from({ length: Math.ceil(selectedDevice.width / 10) }).map((_, i) => (
                  <Line key={`v${i}`} points={[i * 10, 0, i * 10, selectedDevice.height]} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                ))}
                {Array.from({ length: Math.ceil(selectedDevice.height / 10) }).map((_, i) => (
                  <Line key={`h${i}`} points={[0, i * 10, selectedDevice.width, i * 10]} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                ))}
              </Layer>
            )}

            {/* ── WIDGETS LAYER ── */}
            <Layer>
              {activeWidgets
                .filter((w) => w.pageId === activePageId || w.type === 'notification_bar' || w.persistent || !w.pageId)
                .map((w) => {
                if (!w.visible) return null;

                const isSelected = w.id === selectedWidgetId || (selectedWidgetIds && selectedWidgetIds.includes(w.id));

                return (
                  <Group
                    key={w.id}
                    id={w.id}
                    x={w.x}
                    y={w.y}
                    draggable={!w.locked}
                    onClick={(e) => handleWidgetClick(e, w.id)}
                    onTap={(e) => handleWidgetClick(e, w.id)}
                    onDragStart={(e) => handleDragStart(e, w.id)}
                    onDragMove={(e) => handleDragMove(e, w.id)}
                    onDragEnd={(e) => handleDragEnd(e, w.id)}
                    onTransform={(e) => handleTransform(e, w.id)}
                    onTransformEnd={(e) => handleTransformEnd(e, w.id)}
                    dragBoundFunc={(pos, e) => dragBoundFunc(pos, e)}
                  >
                    {renderShape(w, isSelected)}
                  </Group>
                );
              })}
              {(selectedWidgetId || (selectedWidgetIds && selectedWidgetIds.length > 0)) && (
                <Transformer
                  ref={trRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 10 || newBox.height < 10) return oldBox;
                    return newBox;
                  }}
                  padding={5}
                  anchorSize={8}
                  anchorCornerRadius={4}
                  anchorStroke="#3b82f6"
                  anchorFill="#1e293b"
                  anchorStrokeWidth={2}
                  borderStroke="#3b82f6"
                  borderStrokeWidth={2}
                  borderDash={[4, 4]}
                  keepRatio={false}
                  rotateEnabled={true}
                />
              )}
            </Layer>

            {/* ── ALIGNMENT GUIDES LAYER (always visible during drag) ── */}
            {guideLines.length > 0 && (
              <Layer listening={false}>
                {guideLines.map((g, i) => {
                  if (g.type === 'vertical') {
                    return (
                      <Line
                        key={i}
                        points={[g.pos, 0, g.pos, selectedDevice.height]}
                        stroke="#ec4899"
                        strokeWidth={1.5}
                        dash={[4, 4]}
                      />
                    );
                  }
                  if (g.type === 'horizontal') {
                    return (
                      <Line
                        key={i}
                        points={[0, g.pos, selectedDevice.width, g.pos]}
                        stroke="#ec4899"
                        strokeWidth={1.5}
                        dash={[4, 4]}
                      />
                    );
                  }
                  if (g.type === 'gap-h') {
                    // Horizontal equal-spacing guide — orange line between two X positions
                    const midY = g.y || selectedDevice.height / 2;
                    return (
                      <React.Fragment key={i}>
                        <Line
                          points={[g.x1, midY, g.x2, midY]}
                          stroke="#f97316"
                          strokeWidth={1.5}
                        />
                        {/* Left tick */}
                        <Line points={[g.x1, midY - 4, g.x1, midY + 4]} stroke="#f97316" strokeWidth={1.5} />
                        {/* Right tick */}
                        <Line points={[g.x2, midY - 4, g.x2, midY + 4]} stroke="#f97316" strokeWidth={1.5} />
                      </React.Fragment>
                    );
                  }
                  if (g.type === 'gap-v') {
                    // Vertical equal-spacing guide — orange line between two Y positions
                    const midX = g.x || selectedDevice.width / 2;
                    return (
                      <React.Fragment key={i}>
                        <Line
                          points={[midX, g.y1, midX, g.y2]}
                          stroke="#f97316"
                          strokeWidth={1.5}
                        />
                        {/* Top tick */}
                        <Line points={[midX - 4, g.y1, midX + 4, g.y1]} stroke="#f97316" strokeWidth={1.5} />
                        {/* Bottom tick */}
                        <Line points={[midX - 4, g.y2, midX + 4, g.y2]} stroke="#f97316" strokeWidth={1.5} />
                      </React.Fragment>
                    );
                  }
                  if (g.type === 'size-w') {
                    // Width-match guide — cyan brackets showing equal widths
                    const cy = g.y;
                    return (
                      <React.Fragment key={i}>
                        {/* Dragged widget width bracket */}
                        <Line points={[g.dragX, cy, g.dragX + g.dragW, cy]} stroke="#22d3ee" strokeWidth={1.5} />
                        <Line points={[g.dragX, cy - 4, g.dragX, cy + 4]} stroke="#22d3ee" strokeWidth={1.5} />
                        <Line points={[g.dragX + g.dragW, cy - 4, g.dragX + g.dragW, cy + 4]} stroke="#22d3ee" strokeWidth={1.5} />
                        {/* Other widget width bracket */}
                        <Line points={[g.otherX, cy, g.otherX + g.otherW, cy]} stroke="#22d3ee" strokeWidth={1.5} />
                        <Line points={[g.otherX, cy - 4, g.otherX, cy + 4]} stroke="#22d3ee" strokeWidth={1.5} />
                        <Line points={[g.otherX + g.otherW, cy - 4, g.otherX + g.otherW, cy + 4]} stroke="#22d3ee" strokeWidth={1.5} />
                      </React.Fragment>
                    );
                  }
                  if (g.type === 'size-h') {
                    // Height-match guide — cyan brackets showing equal heights
                    const cx = g.x;
                    return (
                      <React.Fragment key={i}>
                        {/* Dragged widget height bracket */}
                        <Line points={[cx, g.dragY, cx, g.dragY + g.dragH]} stroke="#22d3ee" strokeWidth={1.5} />
                        <Line points={[cx - 4, g.dragY, cx + 4, g.dragY]} stroke="#22d3ee" strokeWidth={1.5} />
                        <Line points={[cx - 4, g.dragY + g.dragH, cx + 4, g.dragY + g.dragH]} stroke="#22d3ee" strokeWidth={1.5} />
                        {/* Other widget height bracket */}
                        <Line points={[cx, g.otherY, cx, g.otherY + g.otherH]} stroke="#22d3ee" strokeWidth={1.5} />
                        <Line points={[cx - 4, g.otherY, cx + 4, g.otherY]} stroke="#22d3ee" strokeWidth={1.5} />
                        <Line points={[cx - 4, g.otherY + g.otherH, cx + 4, g.otherY + g.otherH]} stroke="#22d3ee" strokeWidth={1.5} />
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
              </Layer>
            )}
          </Stage>
        </div>

        {/* Bottom page slot */}
        <div className="flex flex-col items-center gap-2.5">
          {!bottomPage ? (
            <button
              onClick={() => addPageToDirection(activeScreenId, currentPage.id, 'bottom')}
              className="w-6 h-6 rounded-full bg-slate-900 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 text-[10px] text-slate-300 hover:text-white flex items-center justify-center transition-all font-bold shadow-md cursor-pointer"
              title="Add Page to Bottom"
            >
              ➕
            </button>
          ) : (
            <button
              onClick={() => handleOpenTransitionSettings('bottom')}
              className="w-6 h-6 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all shadow-md cursor-pointer"
              title="Swipe Animation settings"
            >
              ⚙️
            </button>
          )}

          <div
            onClick={() => bottomPage && setActivePageId(bottomPage.id)}
            className={`w-36 h-12 border flex items-center justify-center transition-all relative ${
              bottomPage
                ? 'border-slate-800 bg-slate-900/10 hover:bg-slate-900/30 hover:border-blue-500/40 cursor-pointer shadow-md'
                : 'border-dashed border-slate-900 bg-transparent opacity-10'
            } ${isRound ? 'rounded-full' : 'rounded-lg'}`}
            title={bottomPage ? `Slide to Bottom page` : ''}
          >
            <MiniCanvas page={bottomPage} axis="y" />
            {bottomPage && (
              <span className="absolute right-2 text-[8px] font-mono font-bold text-slate-500">({gridX}, {gridY + 1})</span>
            )}
          </div>
        </div>
      </div>

      {/* ──── RIGHT NEIGHBOR SLOT ──── */}
      <div className="flex items-center gap-3">
        {/* Gap Controls (plus / settings) */}
        <div className="flex flex-col gap-2 items-center">
          {!rightPage ? (
            <button
              onClick={() => addPageToDirection(activeScreenId, currentPage.id, 'right')}
              className="w-7 h-7 rounded-full bg-slate-900 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white flex items-center justify-center transition-all text-xs font-bold shadow-md cursor-pointer"
              title="Add Page to Right"
            >
              ➕
            </button>
          ) : (
            <button
              onClick={() => handleOpenTransitionSettings('right')}
              className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all shadow-md cursor-pointer"
              title="Swipe Animation settings"
            >
              ⚙️
            </button>
          )}
        </div>

        {/* Right page outline */}
        <div
          onClick={() => rightPage && setActivePageId(rightPage.id)}
          className={`w-28 h-36 border flex flex-col items-center justify-center transition-all relative ${
            rightPage
              ? 'border-slate-800 bg-slate-900/10 hover:bg-slate-900/30 hover:border-blue-500/40 cursor-pointer shadow-lg'
              : 'border-dashed border-slate-900 bg-transparent opacity-10'
          } ${isRound ? 'rounded-full' : 'rounded-xl'}`}
          title={rightPage ? `Slide to Right page` : ''}
        >
          <MiniCanvas page={rightPage} axis="x" />
          {rightPage && (
            <span className="absolute bottom-2 text-[8px] font-mono font-bold text-slate-500">({gridX + 1}, {gridY})</span>
          )}
        </div>
      </div>

      {/* ── Alignment Toolbar (floats above canvas when 2+ widgets selected) ── */}
      <div className="absolute -top-14 left-0 right-0 flex justify-center pointer-events-none">
        <AlignmentToolbar />
      </div>

      {/* Floating coordinates tag & Snapping Toggles */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={toggleGrid}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-md flex items-center gap-1.5 border ${
              gridEnabled 
                ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/30' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>▦</span> Grid
          </button>
          <button
            onClick={toggleMagnet}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-md flex items-center gap-1.5 border ${
              magnetEnabled 
                ? 'bg-purple-600 border-purple-500 text-white shadow-purple-900/30' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>🧲</span> Magnet
          </button>
        </div>
        <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-slate-400 select-none shadow-md pointer-events-auto">
          Coordinate: ({gridX}, {gridY})
        </div>
      </div>

      {/* ──── SWIPE TRANSITION SETTINGS MODAL ──── */}
      {activeTransitionDirection && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setActiveTransitionDirection(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition"
            >
              ✕
            </button>
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Swipe Transition Settings</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Configure the gesture swipe animation between this page and the <strong>{activeTransitionDirection.toUpperCase()}</strong> page.
            </p>

            <div className="space-y-3">
              <div>
                <PropLabel>Transition Effect</PropLabel>
                <select
                  value={selectedAnimation}
                  onChange={(e) => setSelectedAnimation(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="scroll_left">Scroll Left</option>
                  <option value="scroll_right">Scroll Right</option>
                  <option value="scroll_up">Scroll Up</option>
                  <option value="scroll_down">Scroll Down</option>
                  <option value="fade">Fade Overlay</option>
                  <option value="none">Instant Switch (None)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-850">
              <button
                onClick={() => setActiveTransitionDirection(null)}
                className="px-3.5 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-850 transition rounded text-xs text-slate-400 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTransition}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded transition shadow-md shadow-blue-500/10"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

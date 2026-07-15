import React from 'react';
import { Group, Circle, Line, Text } from 'react-konva';

// ── Digital Mode ──────────────────────────────────────────────────────────────
function DigitalClock({ properties, width, height }) {
  const {
    hourFontSize = 36,
    hourColor = '#ffffff',
    hourFontStyle = 'bold',
    minuteFontSize = 36,
    minuteColor = '#3b82f6',
    minuteFontStyle = 'bold',
    separatorChar = ':',
    separatorColor = '#94a3b8',
    // ✅ BUG FIX: Normalize to strict boolean. `!= false` pattern fails on re-enable
    // because React-Konva does not re-create removed nodes cleanly.
    // We now use `visible={bool}` on every Text node unconditionally.
    separatorVisible,
    showSeconds = false,
    secFontSize = 20,
    secColor = '#ef4444',
    secFontStyle = 'bold',
  } = properties;

  // Normalize: treat undefined/null/true → true, false → false
  const isSepVisible = separatorVisible !== false;

  const hours = '10';
  const minutes = '09';
  const seconds = '30';

  const hwChar = hourFontSize * 0.62;
  const mwChar = minuteFontSize * 0.62;
  const swChar = (secFontSize || 20) * 0.62;

  // ✅ Always allocate full separator width so layout stays stable when toggling.
  // The separator Text is always in the Konva tree — only `visible` changes.
  const sepWidth = hourFontSize * 0.32;

  const totalW =
    hwChar * 2 +
    sepWidth +
    mwChar * 2 +
    (showSeconds ? 4 + sepWidth + swChar * 2 : 0);
  const offsetX = Math.max(0, (width - totalW) / 2);

  let cursor = offsetX;
  const hourX = cursor;
  cursor += hwChar * 2;
  const sepX = cursor;
  cursor += sepWidth;
  const minX = cursor;
  cursor += mwChar * 2;
  const sep2X = cursor;
  cursor += showSeconds ? 4 + sepWidth : 0;
  const secX = cursor;

  return (
    <Group width={width} height={height}>
      {/* Hours — always rendered, never removed from Konva tree */}
      <Text
        text={hours}
        fontSize={hourFontSize}
        fill={hourColor}
        x={hourX}
        y={0}
        width={hwChar * 2}
        height={height}
        align="center"
        verticalAlign="middle"
        fontStyle={hourFontStyle}
        visible={true}
      />

      {/* Separator HH:MM — ✅ use visible prop, never conditionally remove node */}
      <Text
        key="sep-hhmm"
        text={separatorChar}
        fontSize={hourFontSize}
        fill={separatorColor}
        x={sepX}
        y={-2}
        width={sepWidth}
        height={height}
        align="center"
        verticalAlign="middle"
        fontStyle="bold"
        visible={isSepVisible}
      />

      {/* Minutes */}
      <Text
        text={minutes}
        fontSize={minuteFontSize}
        fill={minuteColor}
        x={minX}
        y={0}
        width={mwChar * 2}
        height={height}
        align="center"
        verticalAlign="middle"
        fontStyle={minuteFontStyle}
        visible={true}
      />

      {/* Seconds group — kept stable with visible prop */}
      {showSeconds && (
        <Group x={sep2X} y={height * 0.15}>
          <Text
            key="sep-mmss"
            text={separatorChar}
            fontSize={secFontSize}
            fill={separatorColor}
            x={0}
            y={0}
            width={sepWidth}
            height={height * 0.7}
            align="center"
            verticalAlign="middle"
            visible={isSepVisible}
          />
          <Text
            text={seconds}
            fontSize={secFontSize}
            fill={secColor}
            x={isSepVisible ? sepWidth + 4 : 0}
            y={0}
            width={swChar * 2}
            height={height * 0.7}
            align="center"
            verticalAlign="middle"
            fontStyle={secFontStyle}
          />
        </Group>
      )}
    </Group>
  );
}

// ── Analog Mode ───────────────────────────────────────────────────────────────
function AnalogClock({ properties, width, height }) {
  const {
    dialColor = '#1e293b',
    dialBorderColor = '#475569',
    handHourColor = '#ffffff',
    handMinuteColor = '#3b82f6',
    handSecondColor = '#ef4444',
    showTickMarks = true,
    showAnalogSeconds = true,
  } = properties;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 4;

  // Fixed preview time: 10:09:30
  const hoursAngle = (10 % 12) * 30 + 9 * 0.5;
  const minutesAngle = 9 * 6;
  const secondsAngle = 30 * 6;

  const toRad = (deg) => (deg - 90) * (Math.PI / 180);
  const handPoint = (angle, len) => ({
    x: cx + len * Math.cos(toRad(angle)),
    y: cy + len * Math.sin(toRad(angle)),
  });

  const hourHand = handPoint(hoursAngle, radius * 0.5);
  const minuteHand = handPoint(minutesAngle, radius * 0.72);
  const secondHand = handPoint(secondsAngle, radius * 0.82);

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30;
    const isMajor = i % 3 === 0;
    const inner = isMajor ? radius * 0.80 : radius * 0.88;
    const outer = radius * 0.95;
    return { start: handPoint(angle, inner), end: handPoint(angle, outer), isMajor };
  });

  return (
    <Group width={width} height={height}>
      <Circle x={cx} y={cy} radius={radius} fill={dialColor} stroke={dialBorderColor} strokeWidth={2} />
      {showTickMarks && ticks.map((t, i) => (
        <Line key={i} points={[t.start.x, t.start.y, t.end.x, t.end.y]} stroke={dialBorderColor} strokeWidth={t.isMajor ? 2 : 1} lineCap="round" />
      ))}
      <Line points={[cx, cy, hourHand.x, hourHand.y]} stroke={handHourColor} strokeWidth={4} lineCap="round" />
      <Line points={[cx, cy, minuteHand.x, minuteHand.y]} stroke={handMinuteColor} strokeWidth={3} lineCap="round" />
      <Line points={[cx, cy, secondHand.x, secondHand.y]} stroke={handSecondColor} strokeWidth={1.5} lineCap="round" visible={showAnalogSeconds} />
      <Circle x={cx} y={cy} radius={4} fill={handHourColor} />
      <Circle x={cx} y={cy} radius={2} fill={dialColor} />
    </Group>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ClockWidget({ properties, width, height }) {
  const mode = properties.clockMode || 'digital';
  if (mode === 'analog') {
    return <AnalogClock properties={properties} width={width} height={height} />;
  }
  return <DigitalClock properties={properties} width={width} height={height} />;
}

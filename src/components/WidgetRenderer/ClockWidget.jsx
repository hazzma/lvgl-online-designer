import React from 'react';
import { Group, Circle, Line, Rect, Text, Arc } from 'react-konva';

// ── Digital Mode ─────────────────────────────────────────────────────────────
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
    separatorVisible = true,
    showSeconds = false,
    secFontSize = 20,
    secColor = '#ef4444',
    secFontStyle = 'bold',
  } = properties;

  const hours = '10';
  const minutes = '09';
  const seconds = '30';

  // Approximate char widths
  const hwChar = hourFontSize * 0.62;
  const mwChar = minuteFontSize * 0.62;
  const swChar = (secFontSize || 20) * 0.62;
  const sepWidth = separatorVisible ? (hourFontSize * 0.32) : 0;

  const totalW = hwChar * 2 + sepWidth + mwChar * 2 + (showSeconds ? 4 + sepWidth + swChar * 2 : 0);
  const offsetX = Math.max(0, (width - totalW) / 2);

  let cursor = offsetX;

  const hourX = cursor;
  cursor += hwChar * 2;
  const sepX = cursor;
  cursor += sepWidth;
  const minX = cursor;
  cursor += mwChar * 2;
  const sep2X = cursor;
  cursor += showSeconds ? (4 + sepWidth) : 0;
  const secX = cursor;

  return (
    <Group width={width} height={height}>
      {/* Hours */}
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
      />

      {/* Separator HH:MM */}
      {separatorVisible && (
        <Text
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
        />
      )}

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
      />

      {/* Seconds */}
      {showSeconds && (
        <Group x={sep2X} y={height * 0.15}>
          {separatorVisible && (
            <Text
              text={separatorChar}
              fontSize={secFontSize}
              fill={separatorColor}
              x={0}
              y={0}
              width={sepWidth}
              height={height * 0.7}
              align="center"
              verticalAlign="middle"
            />
          )}
          <Text
            text={seconds}
            fontSize={secFontSize}
            fill={secColor}
            x={sepWidth + 4}
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
  const hoursAngle = (10 % 12) * 30 + 9 * 0.5;   // degrees
  const minutesAngle = 9 * 6;                        // degrees
  const secondsAngle = 30 * 6;                       // degrees

  const toRad = (deg) => (deg - 90) * (Math.PI / 180);

  const handPoint = (angle, length) => ({
    x: cx + length * Math.cos(toRad(angle)),
    y: cy + length * Math.sin(toRad(angle)),
  });

  const hourHand = handPoint(hoursAngle, radius * 0.5);
  const minuteHand = handPoint(minutesAngle, radius * 0.72);
  const secondHand = handPoint(secondsAngle, radius * 0.82);

  // 12 tick marks
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30;
    const isMajor = i % 3 === 0;
    const inner = isMajor ? radius * 0.80 : radius * 0.88;
    const outer = radius * 0.95;
    const start = handPoint(angle, inner);
    const end = handPoint(angle, outer);
    return { start, end, isMajor };
  });

  return (
    <Group width={width} height={height}>
      {/* Dial background */}
      <Circle
        x={cx}
        y={cy}
        radius={radius}
        fill={dialColor}
        stroke={dialBorderColor}
        strokeWidth={2}
      />

      {/* Tick marks */}
      {showTickMarks && ticks.map((t, i) => (
        <Line
          key={i}
          points={[t.start.x, t.start.y, t.end.x, t.end.y]}
          stroke={dialBorderColor}
          strokeWidth={t.isMajor ? 2 : 1}
          lineCap="round"
        />
      ))}

      {/* Hour hand */}
      <Line
        points={[cx, cy, hourHand.x, hourHand.y]}
        stroke={handHourColor}
        strokeWidth={4}
        lineCap="round"
      />

      {/* Minute hand */}
      <Line
        points={[cx, cy, minuteHand.x, minuteHand.y]}
        stroke={handMinuteColor}
        strokeWidth={3}
        lineCap="round"
      />

      {/* Second hand */}
      {showAnalogSeconds && (
        <Line
          points={[cx, cy, secondHand.x, secondHand.y]}
          stroke={handSecondColor}
          strokeWidth={1.5}
          lineCap="round"
        />
      )}

      {/* Center dot */}
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

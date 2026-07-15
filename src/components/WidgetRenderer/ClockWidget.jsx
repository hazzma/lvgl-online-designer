import React, { useEffect, useState } from 'react';
import { Group, Circle, Line, Text, Image as KonvaImage } from 'react-konva';

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
    separatorVisible,
    showSeconds = false,
    secFontSize = 20,
    secColor = '#ef4444',
    secFontStyle = 'bold',
  } = properties;

  const isSepVisible = separatorVisible !== false;

  const hours = '10';
  const minutes = '09';
  const seconds = '30';

  const hwChar = hourFontSize * 0.62;
  const mwChar = minuteFontSize * 0.62;
  const swChar = (secFontSize || 20) * 0.62;
  const sepWidth = hourFontSize * 0.32; // always allocate; toggle via visible prop

  const totalW =
    hwChar * 2 + sepWidth + mwChar * 2 +
    (showSeconds ? 4 + sepWidth + swChar * 2 : 0);
  const offsetX = Math.max(0, (width - totalW) / 2);

  let cursor = offsetX;
  const hourX = cursor; cursor += hwChar * 2;
  const sepX = cursor;  cursor += sepWidth;
  const minX = cursor;  cursor += mwChar * 2;
  const sep2X = cursor; cursor += showSeconds ? 4 + sepWidth : 0;
  const secX = cursor;

  return (
    <Group width={width} height={height}>
      <Text text={hours} fontSize={hourFontSize} fill={hourColor} x={hourX} y={0}
        width={hwChar * 2} height={height} align="center" verticalAlign="middle"
        fontStyle={hourFontStyle} visible={true} />

      {/* ✅ Always in Konva tree — only visible prop changes */}
      <Text key="sep-hhmm" text={separatorChar} fontSize={hourFontSize} fill={separatorColor}
        x={sepX} y={-2} width={sepWidth} height={height}
        align="center" verticalAlign="middle" fontStyle="bold" visible={isSepVisible} />

      <Text text={minutes} fontSize={minuteFontSize} fill={minuteColor} x={minX} y={0}
        width={mwChar * 2} height={height} align="center" verticalAlign="middle"
        fontStyle={minuteFontStyle} visible={true} />

      {showSeconds && (
        <Group x={sep2X} y={height * 0.15}>
          <Text key="sep-mmss" text={separatorChar} fontSize={secFontSize} fill={separatorColor}
            x={0} y={0} width={sepWidth} height={height * 0.7}
            align="center" verticalAlign="middle" visible={isSepVisible} />
          <Text text={seconds} fontSize={secFontSize} fill={secColor}
            x={isSepVisible ? sepWidth + 4 : 0} y={0} width={swChar * 2} height={height * 0.7}
            align="center" verticalAlign="middle" fontStyle={secFontStyle} />
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
    // ── NEW: dial numbers ──────────────────────────────────────────────────────
    showDialNumbers = false,
    dialNumberColor = '#94a3b8',
    dialNumberFontSize = 11,
    // ── NEW: custom dial background image ─────────────────────────────────────
    dialImageUrl = null,
  } = properties;

  // Load the custom background PNG/JPG as an HTMLImageElement for Konva
  const [dialHtmlImage, setDialHtmlImage] = useState(null);

  useEffect(() => {
    if (!dialImageUrl) {
      setDialHtmlImage(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setDialHtmlImage(img);
    img.onerror = () => setDialHtmlImage(null);
    img.src = dialImageUrl;
  }, [dialImageUrl]);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 4;

  // Preview time: 10:09:30
  const hoursAngle   = (10 % 12) * 30 + 9 * 0.5;
  const minutesAngle = 9 * 6;
  const secondsAngle = 30 * 6;

  const toRad = (deg) => (deg - 90) * (Math.PI / 180);
  const handPoint = (angle, len) => ({
    x: cx + len * Math.cos(toRad(angle)),
    y: cy + len * Math.sin(toRad(angle)),
  });

  const hourHand   = handPoint(hoursAngle,   radius * 0.5);
  const minuteHand = handPoint(minutesAngle, radius * 0.72);
  const secondHand = handPoint(secondsAngle, radius * 0.82);

  // 12 tick marks
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30;
    const isMajor = i % 3 === 0;
    return {
      start: handPoint(angle, isMajor ? radius * 0.80 : radius * 0.88),
      end:   handPoint(angle, radius * 0.95),
      isMajor,
    };
  });

  // 12 dial numbers (1–12), placed at 68% radius
  // Number n is at angle n*30 (0° = 12 o'clock, 30° = 1 o'clock, ...)
  const dialNumbers = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    const angle = num * 30;
    const pos = handPoint(angle, radius * 0.68);
    return { num, x: pos.x, y: pos.y };
  });

  const numFontPx = dialNumberFontSize || 11;

  return (
    <Group width={width} height={height}>
      {/* ── Background dial ─────────────────────────────────────────────── */}
      {dialHtmlImage ? (
        // Custom image clipped to a circle
        <Group
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2, false);
            ctx.closePath();
          }}
        >
          <KonvaImage
            image={dialHtmlImage}
            x={cx - radius}
            y={cy - radius}
            width={radius * 2}
            height={radius * 2}
          />
        </Group>
      ) : (
        // Default solid color dial
        <Circle
          x={cx} y={cy} radius={radius}
          fill={dialColor} stroke={dialBorderColor} strokeWidth={2}
        />
      )}

      {/* Border ring on top of custom image */}
      {dialHtmlImage && (
        <Circle
          x={cx} y={cy} radius={radius}
          fill="transparent" stroke={dialBorderColor} strokeWidth={2}
        />
      )}

      {/* ── Tick marks ──────────────────────────────────────────────────── */}
      {showTickMarks && ticks.map((t, i) => (
        <Line
          key={`tick-${i}`}
          points={[t.start.x, t.start.y, t.end.x, t.end.y]}
          stroke={dialBorderColor}
          strokeWidth={t.isMajor ? 2 : 1}
          lineCap="round"
        />
      ))}

      {/* ── Dial numbers 1–12 (NEW) ──────────────────────────────────────── */}
      {showDialNumbers && dialNumbers.map(({ num, x, y }) => (
        <Text
          key={`num-${num}`}
          text={String(num)}
          fontSize={numFontPx}
          fill={dialNumberColor}
          x={x - numFontPx}
          y={y - numFontPx / 2}
          width={numFontPx * 2}
          height={numFontPx}
          align="center"
          verticalAlign="middle"
          fontStyle="bold"
        />
      ))}

      {/* ── Hands ───────────────────────────────────────────────────────── */}
      <Line points={[cx, cy, hourHand.x,   hourHand.y]}   stroke={handHourColor}   strokeWidth={4} lineCap="round" />
      <Line points={[cx, cy, minuteHand.x, minuteHand.y]} stroke={handMinuteColor} strokeWidth={3} lineCap="round" />
      <Line
        points={[cx, cy, secondHand.x, secondHand.y]}
        stroke={handSecondColor} strokeWidth={1.5} lineCap="round"
        visible={showAnalogSeconds}
      />

      {/* ── Center pivot dot ────────────────────────────────────────────── */}
      <Circle x={cx} y={cy} radius={4} fill={handHourColor} />
      <Circle x={cx} y={cy} radius={2} fill={dialHtmlImage ? '#00000088' : dialColor} />
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

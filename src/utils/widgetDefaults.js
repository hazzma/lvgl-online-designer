export function getDefaultProps(type) {
  switch (type) {
    case 'text':
      return { text: 'Text Label', fontSize: 16, color: '#ffffff' };
    case 'rect':
      return { bgColor: '#1e293b', borderSize: 1, borderColor: '#3b82f6' };
    case 'button':
      return { label: 'Click Me', bgColor: '#2563eb', labelColor: '#ffffff', borderRadius: 4 };
    case 'image':
      return { src: '', opacity: 1, fit: 'contain', borderRadius: 0 };
    case 'textarea':
      return { text: '', placeholder: 'Enter text...', fontSize: 14 };
    case 'clock':
      return {
        clockMode: 'digital',
        hourFontSize: 36,
        hourColor: '#ffffff',
        hourFontStyle: 'bold',
        minuteFontSize: 36,
        minuteColor: '#3b82f6',
        minuteFontStyle: 'bold',
        separatorChar: ':',
        separatorColor: '#94a3b8',
        separatorVisible: true,
        showSeconds: false,
        secFontSize: 20,
        secColor: '#ef4444',
        secFontStyle: 'bold',
        dialColor: '#1e293b',
        dialBorderColor: '#475569',
        handHourColor: '#ffffff',
        handMinuteColor: '#3b82f6',
        handSecondColor: '#ef4444',
        showTickMarks: true,
        showAnalogSeconds: true,
        showDialNumbers: false,
        dialNumberColor: '#94a3b8',
        dialNumberFontSize: 11,
        dialImageUrl: null,
        handHourImageUrl: null,
        handHourWidth: 12,
        handHourHeight: 0,
        handHourPivotX: 0.5,
        handHourPivotY: 0.85,
        handMinuteImageUrl: null,
        handMinuteWidth: 8,
        handMinuteHeight: 0,
        handMinutePivotX: 0.5,
        handMinutePivotY: 0.85,
        handSecondImageUrl: null,
        handSecondWidth: 4,
        handSecondHeight: 0,
        handSecondPivotX: 0.5,
        handSecondPivotY: 0.85,
      };
    case 'clock_hour':
      return { text: '10', fontSize: 36, color: '#ffffff', fontStyle: 'bold' };
    case 'clock_minute':
      return { text: '09', fontSize: 36, color: '#3b82f6', fontStyle: 'bold' };
    case 'clock_separator':
      return { text: ':', fontSize: 36, color: '#94a3b8', fontStyle: 'bold' };
    case 'date':
      return { format: 'DD/MM/YYYY', color: '#94a3b8', fontSize: 14 };
    case 'status_clock':
      return { text: '10:09', fontSize: 11, color: '#ffffff', fontStyle: 'bold', positionMode: 'left' };
    case 'status_wifi':
      return { color: '#ffffff', wifiStyle: 'classic', showWifi: true, positionMode: 'right' };
    case 'status_battery':
      return { color: '#ffffff', batteryLevel: 80, isCharging: false, showPercentage: false, baseColor: '#10b981', lowBatteryThreshold: 20, lowBatteryColor: '#ef4444', chargingColor: '#10b981', positionMode: 'right' };
    case 'keyboard':
      return { layout: 'QWERTY', theme: 'dark' };
    case 'notification_bar':
      return { batteryLevel: 80, isCharging: false, showWifi: true, color: '#ffffff', bgColor: '#0f172a', barStyle: 'classic', opacity: 1 };
    case 'slider':
      return { value: 50, min: 0, max: 100, trackColor: '#334155', activeColor: '#3b82f6', knobColor: '#ffffff' };
    case 'switch':
      return { checked: false, activeColor: '#22c55e', inactiveColor: '#475569', knobColor: '#ffffff' };
    case 'arc':
      return { value: 65, min: 0, max: 100, startAngle: 135, endAngle: 405, arcColor: '#3b82f6', bgArcColor: '#1e293b', thickness: 8, showValue: true, valueColor: '#ffffff', valueFontSize: 16, unit: '%' };
    case 'bar':
      return { value: 60, min: 0, max: 100, barColor: '#3b82f6', bgColor: '#1e293b', borderRadius: 4 };
    case 'checkbox':
      return { checked: false, label: 'Option', checkColor: '#3b82f6', labelColor: '#ffffff', fontSize: 13 };
    case 'dropdown':
      return { options: ['Option 1', 'Option 2', 'Option 3'], selectedIndex: 0, bgColor: '#1e293b', textColor: '#e2e8f0', arrowColor: '#94a3b8', borderColor: '#334155', fontSize: 12, borderRadius: 4 };
    case 'spinner':
      return { spinnerColor: '#3b82f6', bgColor: '#1e293b', thickness: 4 };
    default:
      return {};
  }
}

export function getDefaultSize(type, deviceWidth) {
  switch (type) {
    case 'keyboard':
      return { width: deviceWidth - 20, height: 150 };
    case 'rect':
      return { width: 100, height: 100 };
    case 'notification_bar':
      return { width: deviceWidth, height: 24 };
    case 'slider':
      return { width: 160, height: 30 };
    case 'switch':
      return { width: 50, height: 26 };
    case 'arc':
      return { width: 120, height: 120 };
    case 'bar':
      return { width: 160, height: 16 };
    case 'checkbox':
      return { width: 120, height: 24 };
    case 'dropdown':
      return { width: 140, height: 36 };
    case 'spinner':
      return { width: 50, height: 50 };
    case 'clock_hour':
      return { width: 60, height: 50 };
    case 'clock_minute':
      return { width: 60, height: 50 };
    case 'clock_separator':
      return { width: 20, height: 50 };
    case 'status_clock':
      return { width: 50, height: 24 };
    case 'status_wifi':
      return { width: 14, height: 24 };
    case 'status_battery':
      return { width: 50, height: 24 };
    case 'image':
      return { width: 100, height: 100 };
    default:
      return { width: 120, height: 45 };
  }
}

// Mirrors com.riskmonitor.dto.risk.RiskStruct.RiskPeriod
export const TIME_INTERVAL_UNITS = Object.freeze([
  { value: 'SECOND', label: 'Second' },
  { value: 'MINUTE', label: 'Minute' },
  { value: 'HOUR', label: 'Hour' },
  { value: 'DAY', label: 'Day' },
  { value: 'MONTH', label: 'Month' },
  { value: 'QUARTER', label: 'Quarter' },
  { value: 'YEAR', label: 'Year' },
]);

export const TIME_INTERVAL_UNIT_VALUES = Object.freeze(
  TIME_INTERVAL_UNITS.map((u) => u.value),
);

// UI-only — maps to (hasUpperBounds, hasLowerBounds) booleans on submit
export const RISK_DIRECTIONS = Object.freeze([
  { value: 'HIGHER', label: 'Higher value = higher risk' },
  { value: 'LOWER', label: 'Lower value = higher risk' },
  { value: 'BOTH', label: 'Both directions (bidirectional)' },
]);

export const RISK_DIRECTION_VALUES = Object.freeze(
  RISK_DIRECTIONS.map((d) => d.value),
);

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function formatUnitLabel(value, count) {
  const unit = TIME_INTERVAL_UNITS.find((u) => u.value === value);
  const label = unit ? unit.label.toLowerCase() : String(value || '').toLowerCase();
  return Number(count) === 1 ? label : `${label}s`;
}

export function formatFrequency(risk) {
  if (!risk?.timeIntervalValue || !risk?.timeIntervalUnit) return '-';
  return `Every ${risk.timeIntervalValue} ${formatUnitLabel(
    risk.timeIntervalUnit,
    risk.timeIntervalValue,
  )}`;
}

export function formatDirection(risk) {
  const hasUpper = hasValue(risk?.upperMidThreshold) && hasValue(risk?.upperMaxThreshold);
  const hasLower = hasValue(risk?.lowerMidThreshold) && hasValue(risk?.lowerMinThreshold);

  if (hasUpper && hasLower) return 'Both higher and lower values can indicate risk';
  if (hasUpper) return 'Higher value means higher risk';
  if (hasLower) return 'Lower value means higher risk';
  return '-';
}

export function formatThresholds(risk) {
  if (!risk) return '-';

  const parts = [];
  if (hasValue(risk.upperMidThreshold) && hasValue(risk.upperMaxThreshold)) {
    parts.push(
      `Upper: medium >= ${risk.upperMidThreshold}, high >= ${risk.upperMaxThreshold}`,
    );
  }
  if (hasValue(risk.lowerMidThreshold) && hasValue(risk.lowerMinThreshold)) {
    parts.push(
      `Lower: medium <= ${risk.lowerMidThreshold}, high <= ${risk.lowerMinThreshold}`,
    );
  }

  return parts.length > 0 ? parts.join('; ') : '-';
}

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

function unitOf(arg) {
  return typeof arg === 'string' ? arg : arg?.timeIntervalUnit;
}

export function needsSeconds(riskOrUnit) {
  return unitOf(riskOrUnit) === 'SECOND';
}

export function formatRiskDateTime(value, riskOrUnit) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: needsSeconds(riskOrUnit) ? 'medium' : 'short',
  }).format(date);
}

export function toInputDateTime(value, riskOrUnit) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const base =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return needsSeconds(riskOrUnit) ? `${base}:${pad(date.getSeconds())}` : base;
}

export function dateInputProps(riskOrUnit) {
  return needsSeconds(riskOrUnit) ? { step: 1 } : undefined;
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

export const RISK_LEVELS = Object.freeze({
  LOW: { label: 'Low', color: '#2e7d32' },
  MEDIUM: { label: 'Medium', color: '#ed6c02' },
  HIGH: { label: 'High', color: '#d32f2f' },
});

export function classifyRiskLevel(risk, value) {
  const num = Number(value);
  if (!risk || !Number.isFinite(num)) return 'LOW';

  const order = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  let level = 'LOW';
  const promote = (next) => {
    if (order[next] > order[level]) level = next;
  };

  if (hasValue(risk.upperMaxThreshold) && num >= Number(risk.upperMaxThreshold)) {
    promote('HIGH');
  } else if (hasValue(risk.upperMidThreshold) && num >= Number(risk.upperMidThreshold)) {
    promote('MEDIUM');
  }

  if (hasValue(risk.lowerMinThreshold) && num <= Number(risk.lowerMinThreshold)) {
    promote('HIGH');
  } else if (hasValue(risk.lowerMidThreshold) && num <= Number(risk.lowerMidThreshold)) {
    promote('MEDIUM');
  }

  return level;
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

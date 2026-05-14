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

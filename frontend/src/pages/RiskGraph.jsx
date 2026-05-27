import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getRisk } from '../api/risksApi';
import { listAllRiskValues } from '../api/riskValuesApi';
import {
  RISK_LEVELS,
  classifyRiskLevel,
  dateInputProps,
  formatRiskDateTime,
  needsSeconds,
} from '../constants/risk';
import { ROUTES } from '../routes';

function formatTick(time, withSeconds) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  }).format(new Date(time));
}

function hasNum(v) {
  return v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
}

function niceScale(min, max, targetTicks = 8) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return { domain: ['auto', 'auto'], ticks: undefined };
  }
  const roughStep = (max - min) / targetTicks;
  const exp = Math.floor(Math.log10(roughStep));
  const f = roughStep / Math.pow(10, exp);
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  const step = nf * Math.pow(10, exp);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return { domain: [niceMin, niceMax], ticks };
}

function buildThresholds(risk) {
  if (!risk) return [];
  const items = [
    ['upperMaxThreshold', 'HIGH'],
    ['upperMidThreshold', 'MEDIUM'],
    ['lowerMidThreshold', 'MEDIUM'],
    ['lowerMinThreshold', 'HIGH'],
  ];
  return items
    .filter(([key]) => hasNum(risk[key]))
    .map(([key, level]) => ({ y: Number(risk[key]), level }));
}

function ColoredDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  return (
    <circle cx={cx} cy={cy} r={7} fill={RISK_LEVELS[payload.level].color} stroke="#fff" strokeWidth={2} />
  );
}

function ValuePill({ x, y, value }) {
  if (x == null || y == null) return null;
  const text = String(value);
  const w = text.length * 7 + 12;
  const h = 18;
  return (
    <g>
      <rect x={x - w / 2} y={y - h - 10} width={w} height={h} rx={4} fill="#fff" stroke="#bdbdbd" />
      <text x={x} y={y - 10 - h / 2} textAnchor="middle" dominantBaseline="middle"
            fontSize={12} fontWeight={600} fill="#212121">
        {text}
      </text>
    </g>
  );
}

function ChartTooltip({ active, payload, risk }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const level = RISK_LEVELS[point.level];
  return (
    <Paper sx={{ p: 1.5, minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">
        {formatRiskDateTime(point.time, risk)}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {point.value}{risk?.measurementUnit ? ` ${risk.measurementUnit}` : ''}
      </Typography>
      <Typography variant="caption" sx={{ color: level.color, fontWeight: 600 }}>
        {level.label} risk
      </Typography>
    </Paper>
  );
}

function downloadSvgAsPng(container, filename) {
  const svg = container?.querySelector('svg');
  if (!svg) return;

  const { width, height } = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);

  const source = new XMLSerializer().serializeToString(clone);
  const svgUrl = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));

  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(svgUrl);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  };
  img.src = svgUrl;
}

export default function RiskGraph() {
  const { riskId } = useParams();
  const [risk, setRisk] = useState(null);
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const chartRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    Promise.all([getRisk(riskId), listAllRiskValues(riskId)])
      .then(([riskData, valueData]) => {
        if (!active) return;
        setRisk(riskData);
        setValues(valueData);
      })
      .catch((err) => {
        if (active) setLoadError(err.message || 'Failed to load risk graph.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [riskId]);

  const chartData = useMemo(() => {
    if (!risk) return [];
    const fromTime = fromDate ? new Date(fromDate).getTime() : null;
    const toTime = toDate ? new Date(toDate).getTime() : null;
    return values
      .map((entry) => ({
        time: new Date(entry.recordedAt).getTime(),
        value: Number(entry.value),
        level: classifyRiskLevel(risk, entry.value),
      }))
      .filter((p) => {
        if (Number.isNaN(p.time)) return false;
        if (fromTime !== null && p.time < fromTime) return false;
        if (toTime !== null && p.time > toTime) return false;
        return true;
      })
      .sort((a, b) => a.time - b.time);
  }, [risk, values, fromDate, toDate]);

  const thresholds = useMemo(() => buildThresholds(risk), [risk]);

  const yScale = useMemo(() => {
    if (chartData.length === 0) return { domain: ['auto', 'auto'], ticks: undefined };
    const numeric = [...chartData.map((p) => p.value), ...thresholds.map((t) => t.y)];
    return niceScale(Math.min(...numeric), Math.max(...numeric));
  }, [chartData, thresholds]);

  const handleDownload = () => {
    const safeName = (risk?.name || 'risk-graph').replace(/[^a-z0-9-_]+/gi, '-');
    downloadSvgAsPng(chartRef.current, `${safeName}.png`);
  };

  return (
    <Box>
      <Button component={RouterLink} to={ROUTES.RISKS} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to risks
      </Button>

      {loading && (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Paper>
      )}

      {!loading && loadError && <Alert severity="error">{loadError}</Alert>}

      {!loading && !loadError && risk && (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h1" gutterBottom>{risk.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {risk.category || 'Uncategorized'}
              </Typography>
            </Box>
            <Chip label={`Unit: ${risk.measurementUnit}`} />
          </Stack>

          <Paper sx={{ p: { xs: 2, md: 4 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mb: 3 }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <TextField
                label="From" type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={dateInputProps(risk)}
                fullWidth
              />
              <TextField
                label="To" type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={dateInputProps(risk)}
                fullWidth
              />
              <Button
                onClick={handleDownload}
                disabled={chartData.length === 0}
              >
                Download
              </Button>
              <Button onClick={() => { setFromDate(''); setToDate(''); }}>
                Clear
              </Button>
            </Stack>

            {chartData.length === 0 ? (
              <Alert severity="info">No logged values in the selected date range.</Alert>
            ) : (
              <Box ref={chartRef} sx={{ width: '100%', height: 460 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 32, right: 64, bottom: 16, left: 24 }}>
                    <XAxis
                      dataKey="time" type="number" scale="time"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(t) => formatTick(t, needsSeconds(risk))}
                      tick={{ fontSize: 12 }} tickMargin={8}
                    />
                    <YAxis
                      domain={yScale.domain}
                      ticks={yScale.ticks}
                      width={80}
                      tick={{ fontSize: 12 }} tickMargin={8}
                      label={{
                        value: risk.measurementUnit, angle: -90, position: 'insideLeft', offset: 0,
                        style: { textAnchor: 'middle', fontSize: 15, fontWeight: 700, fill: '#424242' },
                      }}
                    />
                    <Tooltip content={<ChartTooltip risk={risk} />}
                             cursor={{ stroke: '#bdbdbd', strokeDasharray: '3 3' }} />
                    {thresholds.map((t) => (
                      <ReferenceLine
                        key={`${t.level}-${t.y}`}
                        y={t.y}
                        stroke={RISK_LEVELS[t.level].color}
                        strokeWidth={1}
                        strokeDasharray="6 4"
                        label={{
                          value: t.y, position: 'right',
                          fill: RISK_LEVELS[t.level].color, fontSize: 12, fontWeight: 700,
                        }}
                      />
                    ))}
                    <Line
                      dataKey="value"
                      stroke="none"
                      dot={<ColoredDot />}
                      activeDot={false}
                      isAnimationActive={false}
                    >
                      <LabelList dataKey="value" content={<ValuePill />} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            <Stack direction="row" spacing={2.5} sx={{ mt: 3, flexWrap: 'wrap' }}>
              {Object.entries(RISK_LEVELS).map(([key, level]) => (
                <Stack key={key} direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: level.color }} />
                  <Typography variant="caption" color="text.secondary">{level.label} risk</Typography>
                </Stack>
              ))}
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Showing {chartData.length} of {values.length} logged values.
            </Typography>
          </Paper>
        </>
      )}
    </Box>
  );
}

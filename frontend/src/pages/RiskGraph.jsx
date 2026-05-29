/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MuiTooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

import { uploadReport } from '../api/reportsApi';
import { getRisk, listRisks } from '../api/risksApi';
import { listAllRiskValues } from '../api/riskValuesApi';
import {
  RISK_LEVELS,
  classifyRiskLevel,
  formatRiskDateTime,
  needsSeconds,
} from '../constants/risk';
import { useLocale } from '../context/LocaleContext.jsx';
import { useNotification } from '../context/NotificationContext';
import { useTeam } from '../context/TeamContext';
import { ROUTES } from '../routes';
import { tokens } from '../theme/tokens';

const PICKER_VIEWS_WITH_SECONDS = ['year', 'month', 'day', 'hours', 'minutes', 'seconds'];
const PICKER_VIEWS = ['year', 'month', 'day', 'hours', 'minutes'];

// checked toggles show an X inside the box instead of a tick
const X_MARK = (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CheckBoxOutlineBlankIcon fontSize="small" />
    <CloseIcon sx={{ position: 'absolute', inset: 0, m: 'auto', fontSize: 14 }} />
  </Box>
);

function pickerToInputString(d, withSeconds) {
  if (!d) return '';
  return withSeconds ? d.format('YYYY-MM-DDTHH:mm:ss') : d.format('YYYY-MM-DDTHH:mm');
}

function formatTick(time, withSeconds, locale) {
  return new Intl.DateTimeFormat(locale, {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: locale === 'en',
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
  let niceMin = Math.floor(min / step) * step;
  let niceMax = Math.ceil(max / step) * step;
  // headroom when data sits exactly on a bound, else edge dots/labels get clipped
  if (min === niceMin) niceMin -= step;
  if (max === niceMax) niceMax += step;
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

// sanity bounds so a fat-fingered y-axis value can't blow up the chart
const Y_HARD_MIN = -1e9;
const Y_HARD_MAX = 1e9;

function clampY(v) {
  return Math.max(Y_HARD_MIN, Math.min(Y_HARD_MAX, v));
}

// contiguous horizontal regions across [min,max], split at the risk's thresholds,
// each tagged by classifying the region midpoint (works for upper-only / lower-only / both)
function buildBands(risk, domain) {
  if (!risk || !Array.isArray(domain) || !Number.isFinite(domain[0]) || !Number.isFinite(domain[1])) {
    return [];
  }
  const [min, max] = domain;
  const cuts = buildThresholds(risk).map((t) => t.y).filter((y) => y > min && y < max);
  const bounds = Array.from(new Set([min, ...cuts, max])).sort((a, b) => a - b);
  const bands = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    bands.push({ y1: bounds[i], y2: bounds[i + 1], level: classifyRiskLevel(risk, (bounds[i] + bounds[i + 1]) / 2) });
  }
  return bands;
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// vertical gradient stops (top = domain max) blending green->yellow->red across the risk
// zones, so the area fill under the line is tinted by how high the value sits
function riskGradientStops(risk, domain) {
  const bands = buildBands(risk, domain);
  if (bands.length === 0) return [];
  const [min, max] = domain;
  const span = max - min || 1;
  const offsetOf = (y) => clamp01((max - y) / span); // 0 = top (max), 1 = bottom (min)
  const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  const feather = 0.15; // how much of the axis a cross-line blend spreads over
  // each zone holds its colour; the blend sits on the calmer side of each line, so green
  // stays below the medium line and red stays above the high line
  const stops = [
    { offset: 1, color: RISK_LEVELS[bands[0].level].color },
    { offset: 0, color: RISK_LEVELS[bands[bands.length - 1].level].color },
  ];
  for (let i = 0; i < bands.length - 1; i += 1) {
    const lo = bands[i];
    const hi = bands[i + 1];
    if (lo.level === hi.level) continue;
    const o = offsetOf(lo.y2);
    const cLo = RISK_LEVELS[lo.level].color;
    const cHi = RISK_LEVELS[hi.level].color;
    if (Math.abs(rank[lo.level] - 1) <= Math.abs(rank[hi.level] - 1)) {
      // lower zone is the calmer one: hold it to the line, ramp up just above
      stops.push({ offset: o, color: cLo });
      stops.push({ offset: clamp01(o - feather), color: cHi });
    } else {
      // upper zone is calmer: hold the lower colour below, ramp up to the line
      stops.push({ offset: clamp01(o + feather), color: cLo });
      stops.push({ offset: o, color: cHi });
    }
  }
  return stops.sort((a, b) => a.offset - b.offset);
}

function buildRiskCsv(rows) {
  // recorded-at in local time (not UTC) so the exported CSV reads in the viewer's zone
  const fmt = (t) => {
    const d = new Date(t);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  const body = rows.map((p) => `"${fmt(p.time)}","${p.value}",${p.level}`).join('\n');
  return `Recorded At,Value,Level\n${body}\n`;
}

function ColoredDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  return (
    <circle cx={cx} cy={cy} r={8.5} fill={RISK_LEVELS[payload.level].color} stroke="#fff" strokeWidth={2.5} />
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

function ChartTooltip({ active, payload, risk, locale }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const level = RISK_LEVELS[point.level];
  return (
    <Paper sx={{ p: 1.5, minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">
        {formatRiskDateTime(point.time, risk, locale)}
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

// rasterizes the chart's SVG to a PNG blob (used for both download and saving to Reports)
function chartToPngBlob(container) {
  return new Promise((resolve, reject) => {
    const svg = container?.querySelector('svg');
    if (!svg) {
      reject(new Error('No chart to export'));
      return;
    }

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
        if (blob) resolve(blob);
        else reject(new Error('Failed to render chart'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to render chart'));
    };
    img.src = svgUrl;
  });
}

export default function RiskGraph() {
  const { locale } = useLocale();
  const { activeTeam } = useTeam();
  const { showNotification } = useNotification();
  const { riskId: routeRiskId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRiskId, setSelectedRiskId] = useState(routeRiskId || searchParams.get('riskId') || '');
  const [risks, setRisks] = useState([]);
  const [risksLoading, setRisksLoading] = useState(false);
  const [risksError, setRisksError] = useState(null);
  const [risk, setRisk] = useState(null);
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(Boolean(routeRiskId || searchParams.get('riskId')));
  const [loadError, setLoadError] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [savingChart, setSavingChart] = useState(false);
  const [showLine, setShowLine] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showArea, setShowArea] = useState(true);
  const [showThresholds, setShowThresholds] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showXLabel, setShowXLabel] = useState(true);
  const [showYLabel, setShowYLabel] = useState(true);
  const [yMin, setYMin] = useState('');
  const [yMax, setYMax] = useState('');
  const [yStep, setYStep] = useState('');
  const [saveAnchor, setSaveAnchor] = useState(null);
  const chartRef = useRef(null);
  const yPrefilledFor = useRef(null);
  const activeTeamId = activeTeam?.id || '';
  const selectedRisk = useMemo(
    () => risks.find((item) => item.id === selectedRiskId) || null,
    [risks, selectedRiskId],
  );

  const loadRiskList = useCallback(async () => {
    if (!activeTeamId) {
      setRisks([]);
      setRisksLoading(false);
      setRisksError(null);
      return;
    }

    setRisksLoading(true);
    setRisksError(null);
    setRisks([]);

    try {
      const data = await listRisks(activeTeamId);
      setRisks(data);
    } catch (err) {
      setRisksError(err.message || 'Failed to load risks.');
    } finally {
      setRisksLoading(false);
    }
  }, [activeTeamId]);

  useEffect(() => {
    loadRiskList();
  }, [loadRiskList]);

  useEffect(() => {
    if (risksLoading || risksError || !selectedRiskId || !activeTeamId) return;
    if (!risks.some((item) => item.id === selectedRiskId)) {
      setSelectedRiskId('');
      setRisk(null);
      setValues([]);
      setLoadError(null);
      setLoading(false);
      setSearchParams({}, { replace: true });
    }
  }, [activeTeamId, risks, risksError, risksLoading, selectedRiskId, setSearchParams]);

  useEffect(() => {
    if (!selectedRisk) {
      setRisk(null);
      setValues([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    Promise.all([getRisk(selectedRisk.id), listAllRiskValues(selectedRisk.id)])
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
  }, [selectedRisk]);

  const handleRiskChange = (event) => {
    const nextRiskId = event.target.value;
    setSelectedRiskId(nextRiskId);
    setRisk(null);
    setValues([]);
    setFromDate('');
    setToDate('');
    setLoadError(null);
    setLoading(Boolean(nextRiskId));
    setSearchParams(nextRiskId ? { riskId: nextRiskId } : {}, { replace: true });
  };

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

  // prefill the y-range inputs with the chart's auto min/max, once per risk (user can then edit)
  useEffect(() => {
    const [lo, hi] = yScale.domain;
    if (Number.isFinite(lo) && Number.isFinite(hi) && yPrefilledFor.current !== risk?.id) {
      setYMin(String(lo));
      setYMax(String(hi));
      yPrefilledFor.current = risk?.id;
    }
  }, [risk, yScale]);

  // user-set y-range (clamped) overrides the auto scale when both ends are valid
  const customY = useMemo(() => {
    const lo = clampY(parseFloat(yMin));
    const hi = clampY(parseFloat(yMax));
    return Number.isFinite(lo) && Number.isFinite(hi) && lo < hi ? [lo, hi] : null;
  }, [yMin, yMax]);

  const yDomain = customY || yScale.domain;
  const areaStops = useMemo(() => riskGradientStops(risk, yDomain), [risk, yDomain]);

  // y-axis tick spacing: explicit step keeps min and max, else fall back to the auto ticks
  const yTicks = useMemo(() => {
    const [lo, hi] = yDomain;
    const step = parseFloat(yStep);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || !Number.isFinite(step) || step <= 0) {
      return customY ? undefined : yScale.ticks;
    }
    if ((hi - lo) / step > 1000) return undefined; // guard against a tiny step exploding the axis
    const ticks = [];
    for (let v = lo; v <= hi + step / 1e6; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
    if (ticks[ticks.length - 1] !== hi) ticks.push(hi); // always keep the max
    return ticks;
  }, [yDomain, yStep, customY, yScale.ticks]);

  const safeChartName = () => (risk?.name || 'risk-graph').replace(/[^a-z0-9-_]+/gi, '-');
  // local-time stamp (matches the backend report naming) for saved chart files
  const localStamp = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  };

  const handleSave = async (kind) => {
    setSaveAnchor(null);
    setSavingChart(true);
    try {
      let blob;
      if (kind === 'csv') {
        blob = new Blob([buildRiskCsv(chartData)], { type: 'text/csv' });
      } else {
        blob = await chartToPngBlob(chartRef.current);
      }
      await uploadReport(activeTeamId, blob, `${safeChartName()}-${localStamp()}.${kind}`, kind);
      showNotification(`Saved ${kind.toUpperCase()} to Downloads, get it there.`, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to save.', 'error');
    } finally {
      setSavingChart(false);
    }
  };

  return (
    <Box>
      {routeRiskId && (
        <Button component={RouterLink} to={ROUTES.RISKS} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          Back to risks
        </Button>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h1" gutterBottom>Risk Graphs</Typography>
          <Typography variant="body2" color="text.secondary">
            Pick a risk and see its graph.
          </Typography>
        </Box>
      </Stack>

      <Paper sx={{ p: 2.5, mb: 3 }}>
        {!activeTeam && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select a team before viewing risk graphs.
          </Alert>
        )}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <FormControl fullWidth disabled={!activeTeam || risksLoading}>
            <InputLabel id="risk-graphs-risk-label">Risk</InputLabel>
            <Select
              labelId="risk-graphs-risk-label"
              label="Risk"
              value={selectedRiskId}
              onChange={handleRiskChange}
            >
              <MenuItem value="">
                <em>Select a risk</em>
              </MenuItem>
              {selectedRiskId && !risks.some((item) => item.id === selectedRiskId) && (
                <MenuItem value={selectedRiskId} disabled>
                  Loading selected risk...
                </MenuItem>
              )}
              {risks.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} ({item.measurementUnit})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <MuiTooltip title="Refresh risks">
            <span>
              <IconButton onClick={loadRiskList} disabled={!activeTeam || risksLoading} size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </MuiTooltip>
        </Stack>
        {activeTeam && risksLoading && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Loading risks...</Typography>
          </Stack>
        )}
        {activeTeam && !risksLoading && risksError && (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            action={(
              <Button color="inherit" size="small" onClick={loadRiskList}>
                Retry
              </Button>
            )}
          >
            {risksError}
          </Alert>
        )}
      </Paper>

      {activeTeam && !selectedRiskId && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>Select a risk to view its graph</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a risk from the selector above to load its measurement graph.
          </Typography>
        </Paper>
      )}

      {activeTeam && selectedRisk && loading && (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Paper>
      )}

      {activeTeam && selectedRisk && !loading && loadError && <Alert severity="error">{loadError}</Alert>}

      {activeTeam && selectedRisk && !loading && !loadError && risk && (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h2" gutterBottom>{risk.name}</Typography>
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
              <DateTimePicker
                label="From"
                value={fromDate ? dayjs(fromDate) : null}
                onChange={(d) => setFromDate(pickerToInputString(d, needsSeconds(risk)))}
                views={needsSeconds(risk) ? PICKER_VIEWS_WITH_SECONDS : PICKER_VIEWS}
                sx={{ flex: 1 }}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DateTimePicker
                label="To"
                value={toDate ? dayjs(toDate) : null}
                onChange={(d) => setToDate(pickerToInputString(d, needsSeconds(risk)))}
                views={needsSeconds(risk) ? PICKER_VIEWS_WITH_SECONDS : PICKER_VIEWS}
                sx={{ flex: 1 }}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <Button
                onClick={() => { setFromDate(''); setToDate(''); }}
                disabled={!fromDate && !toDate}
              >
                Clear dates
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={2}
              sx={{ mb: 3 }}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <FormControlLabel
                control={<Checkbox size="small" checkedIcon={X_MARK} checked={showLine} onChange={(e) => setShowLine(e.target.checked)} />}
                label="Line"
              />
              <FormControlLabel
                control={<Checkbox size="small" checkedIcon={X_MARK} checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} />}
                label="Points"
              />
              <FormControlLabel
                control={<Checkbox size="small" checkedIcon={X_MARK} checked={showArea} onChange={(e) => setShowArea(e.target.checked)} />}
                label="Area"
              />
              <FormControlLabel
                control={<Checkbox size="small" checkedIcon={X_MARK} checked={showThresholds} onChange={(e) => setShowThresholds(e.target.checked)} />}
                label="Thresholds"
              />
              <FormControlLabel
                control={<Checkbox size="small" checkedIcon={X_MARK} checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />}
                label="Grid"
              />
              <TextField
                label="Y min" type="number" size="small"
                value={yMin} onChange={(e) => setYMin(e.target.value)}
                sx={{ width: 100 }}
              />
              <TextField
                label="Y max" type="number" size="small"
                value={yMax} onChange={(e) => setYMax(e.target.value)}
                sx={{ width: 100 }}
              />
              <TextField
                label="Y step" type="number" size="small"
                placeholder="Default"
                InputLabelProps={{ shrink: true }}
                value={yStep} onChange={(e) => setYStep(e.target.value)}
                sx={{ width: 100 }}
              />
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="outlined"
                onClick={(e) => setSaveAnchor(e.currentTarget)}
                disabled={chartData.length === 0 || savingChart}
              >
                {savingChart ? 'Saving...' : 'Save for download as...'}
              </Button>
              <Menu anchorEl={saveAnchor} open={Boolean(saveAnchor)} onClose={() => setSaveAnchor(null)}>
                <MenuItem onClick={() => handleSave('csv')}>Save as CSV</MenuItem>
                <MenuItem onClick={() => handleSave('png')}>Save as PNG</MenuItem>
              </Menu>
            </Stack>

            {chartData.length === 0 ? (
              <Alert severity="info">No logged values in the selected date range.</Alert>
            ) : (
              <Box ref={chartRef} sx={{ width: '100%', height: 460 }}>
                <ResponsiveContainer>
                  <ComposedChart data={chartData} margin={{ top: 32, right: 64, bottom: 16, left: 24 }}>
                    <defs>
                      <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                        {areaStops.map((s, i) => (
                          <stop key={i} offset={`${(s.offset * 100).toFixed(1)}%`} stopColor={s.color} stopOpacity={0.35} />
                        ))}
                      </linearGradient>
                    </defs>
                    {showGrid && (
                      <CartesianGrid strokeDasharray="3 3" stroke={tokens.neutral.border} />
                    )}
                    <XAxis
                      dataKey="time" type="number" scale="time"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(t) => formatTick(t, needsSeconds(risk), locale)}
                      tick={{ fontSize: 12 }} tickMargin={8}
                      height={showXLabel ? 52 : 30}
                      label={showXLabel ? {
                        value: 'Time', position: 'insideBottom', offset: 0,
                        style: { textAnchor: 'middle', fontSize: 15, fontWeight: 700, fill: '#424242' },
                      } : undefined}
                    />
                    <YAxis
                      domain={yDomain}
                      ticks={yTicks}
                      allowDataOverflow={Boolean(customY) || Boolean(yTicks)}
                      width={80}
                      tick={{ fontSize: 12 }} tickMargin={8}
                      label={showYLabel ? {
                        value: risk.measurementUnit, angle: -90, position: 'insideLeft', offset: 0,
                        style: { textAnchor: 'middle', fontSize: 15, fontWeight: 700, fill: '#424242' },
                      } : undefined}
                    />
                    {showArea && areaStops.length > 0 && (
                      <Area
                        dataKey="value"
                        stroke="none"
                        fill="url(#riskFill)"
                        fillOpacity={1}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                      />
                    )}
                    <Tooltip content={<ChartTooltip risk={risk} locale={locale} />}
                             cursor={{ stroke: '#bdbdbd', strokeDasharray: '3 3' }} />
                    {showThresholds && thresholds.map((t) => (
                      <ReferenceLine
                        key={`${t.level}-${t.y}`}
                        y={t.y}
                        stroke={RISK_LEVELS[t.level].color}
                        strokeWidth={1.75}
                        strokeOpacity={0.4}
                        strokeDasharray="6 6"
                        label={{
                          value: t.y, position: 'right',
                          fill: RISK_LEVELS[t.level].color, fillOpacity: 0.7, fontSize: 12, fontWeight: 700,
                        }}
                      />
                    ))}
                    <Line
                      dataKey="value"
                      stroke={showLine ? tokens.text.secondary : 'none'}
                      strokeWidth={2.5}
                      dot={showPoints ? <ColoredDot /> : false}
                      activeDot={false}
                      isAnimationActive={false}
                    >
                      {showPoints && <LabelList dataKey="value" content={<ValuePill />} />}
                    </Line>
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap' }} alignItems="center">
              <FormControlLabel
                control={<Checkbox size="small" checkedIcon={X_MARK} checked={showXLabel} onChange={(e) => setShowXLabel(e.target.checked)} />}
                label="X axis label"
              />
              <FormControlLabel
                control={<Checkbox size="small" checkedIcon={X_MARK} checked={showYLabel} onChange={(e) => setShowYLabel(e.target.checked)} />}
                label="Y axis label"
              />
            </Stack>

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

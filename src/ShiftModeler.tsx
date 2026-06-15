import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

// --- Global Utility: High-Res SVG to PNG Exporter ---
const downloadSvgAsPng = (svgRef, filename) => {
  const svgElement = svgRef.current;
  if (!svgElement) return;

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(
      '<svg ',
      '<svg xmlns="http://www.w3.org/2000/svg" '
    );
  }

  const scale = 4; // 4K resolution scaling
  const vb = svgElement.getAttribute('viewBox').split(' ').map(Number);
  const width = vb[2] * scale;
  const height = vb[3] * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  const svgBlob = new Blob([svgString], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  img.src = url;
};

// --- Shared Icons ---
const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

// ============================================================================
// MAIN APP: Shift Coverage Modeler
// ============================================================================
const App = () => {
  const navigate = useNavigate();
  const svgRef = useRef(null);

  const [shifts, setShifts] = useState([
    { id: 1, name: 'Early Shift', start: 7, end: 15.5 },
    { id: 2, name: 'Morning Shift', start: 8, end: 16.5 },
    { id: 3, name: 'Core Shift A', start: 9, end: 17.5 },
    { id: 4, name: 'Core Shift B', start: 9.5, end: 18 },
    { id: 5, name: 'Late Shift', start: 15, end: 22 },
  ]);
  const [coreHours, setCoreHours] = useState({ start: 9, end: 17.5 });

  const scaleX = (time) => ((time - 6) / 17) * 1000;

  const formatTime = (time) => {
    const hrs = Math.floor(time);
    const mins = (time % 1) * 60;
    return `${hrs.toString().padStart(2, '0')}:${mins === 0 ? '00' : mins}`;
  };

  const handleAddShift = () => {
    const newId = shifts.length ? Math.max(...shifts.map((s) => s.id)) + 1 : 1;
    setShifts([
      ...shifts,
      { id: newId, name: `Shift ${newId}`, start: 9, end: 17 },
    ]);
  };

  const handleRemoveShift = (id) => {
    setShifts(shifts.filter((s) => s.id !== id));
  };

  const handleUpdateShift = (id, field, value) => {
    setShifts(shifts.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleClearAll = () => setShifts([]);

  const { maxOverlap, coreCovered, capacitySteps, chartMaxY, peakZones } =
    useMemo(() => {
      let max = 0;
      const steps = [];
      let isCoreCovered = true;
      const peaks = [];

      for (let t = 6; t <= 23; t += 0.5) {
        const count = shifts.filter((s) => s.start <= t && s.end > t).length;
        if (count > max) max = count;
        steps.push({ time: t, count });

        if (t >= coreHours.start && t < coreHours.end) {
          if (count === 0) isCoreCovered = false;
        }
      }

      const visualSteps = [];
      let currentCount = steps.length ? steps[0].count : 0;
      let currentStart = 6;

      steps.forEach((step, idx) => {
        if (step.count !== currentCount) {
          visualSteps.push({
            x1: currentStart,
            x2: step.time,
            y: currentCount,
          });
          currentStart = step.time;
          currentCount = step.count;
        }
        if (idx === steps.length - 1) {
          visualSteps.push({ x1: currentStart, x2: 23, y: currentCount });
        }
      });

      let inPeak = false;
      let peakStart = null;
      steps.forEach((step) => {
        if (step.count === max && max > 0 && !inPeak) {
          inPeak = true;
          peakStart = step.time;
        } else if (step.count !== max && inPeak) {
          inPeak = false;
          peaks.push({ x1: peakStart, x2: step.time });
        }
      });
      if (inPeak) peaks.push({ x1: peakStart, x2: 23 });

      const chartMax = Math.max(max, 5);
      return {
        maxOverlap: max,
        coreCovered: isCoreCovered,
        capacitySteps: visualSteps,
        chartMaxY: chartMax,
        peakZones: peaks,
      };
    }, [shifts, coreHours]);

  const shiftRowHeight = 60;
  const yPosGridStart = 100;
  const yPosShifts = 130;
  const yPosCapacity =
    yPosShifts + Math.max(shifts.length, 1) * shiftRowHeight + 40;
  const maxHeight = 120;
  const svgHeight = yPosCapacity + maxHeight + 80;

  const generateCapacityPath = () => {
    if (!capacitySteps.length) return '';
    let d = `M ${scaleX(6)} ${maxHeight}`;
    capacitySteps.forEach((step) => {
      const yStr = maxHeight - step.y * (maxHeight / chartMaxY);
      d += ` L ${scaleX(step.x1)} ${yStr} L ${scaleX(step.x2)} ${yStr}`;
    });
    d += ` L ${scaleX(23)} ${maxHeight} Z`;
    return d;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-gray-800">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col md:min-h-screen shadow-sm flex-shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ff8300, #ff4700)' }}
            >
              sm
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900 truncate">
              shiftmodeler
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Back to Toolbox"
            aria-label="Back to Toolbox"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Output
            </h3>
            <button
              onClick={() => downloadSvgAsPng(svgRef, 'Shift_Coverage_4K.png')}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm hover:bg-gray-800 transition-all"
            >
              <DownloadIcon /> Export 4K PNG
            </button>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              About
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Prove 24/7 coverage and handover overlap to your clients.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto p-8">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* Vis Canvas */}
        <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden p-10 mb-8">
          <svg
            ref={svgRef}
            viewBox={`-50 -30 1100 ${svgHeight}`}
            className="w-full h-auto"
            style={{ backgroundColor: 'white' }}
          >
            <rect
              x="-50"
              y="-30"
              width="1100"
              height={svgHeight}
              fill="#ffffff"
            />
            <defs>
              <linearGradient
                id="shiftGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#ff9a33" />
                <stop offset="100%" stopColor="#ff7000" />
              </linearGradient>
              <linearGradient
                id="capacityGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ff8300" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ff8300" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient
                id="peakHighlight"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ff8300" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ff8300" stopOpacity="0.0" />
              </linearGradient>
              <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="4"
                  floodColor="#ff8300"
                  floodOpacity="0.3"
                />
              </filter>
            </defs>

            {/* Top Badges */}
            <g transform="translate(150, 0)">
              <g transform="translate(0, 0)">
                <rect
                  x="0"
                  y="0"
                  width="280"
                  height="48"
                  rx="24"
                  fill={coreCovered ? '#fff7ed' : '#fef2f2'}
                  stroke={coreCovered ? '#fed7aa' : '#fecaca'}
                  strokeWidth="2"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="6"
                  fill={coreCovered ? '#f97316' : '#ef4444'}
                />
                <text
                  x="40"
                  y="30"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                    fontWeight: '700',
                  }}
                  fill={coreCovered ? '#9a3412' : '#991b1b'}
                >
                  {coreCovered
                    ? `100% Core Hours Covered`
                    : `Core Hours NOT Covered`}
                </text>
              </g>

              <g transform="translate(300, 0)">
                <rect
                  x="0"
                  y="0"
                  width="290"
                  height="48"
                  rx="24"
                  fill="#1f2937"
                />
                <text
                  x="30"
                  y="30"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                    fontWeight: '700',
                  }}
                  fill="#fb923c"
                >
                  Max Overlap:
                </text>
                <text
                  x="145"
                  y="30"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                    fontWeight: '700',
                  }}
                  fill="#ffffff"
                >
                  {maxOverlap} Active Shifts
                </text>
              </g>
            </g>

            {/* Grid Lines */}
            <g
              className="grid-lines"
              transform={`translate(0, ${yPosGridStart})`}
            >
              {[
                6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
                23,
              ].map((hour) => (
                <g key={hour}>
                  <line
                    x1={scaleX(hour)}
                    y1="0"
                    x2={scaleX(hour)}
                    y2={yPosCapacity + maxHeight - yPosGridStart}
                    stroke={hour % 2 === 0 ? '#e5e7eb' : '#f3f4f6'}
                    strokeWidth={hour % 2 === 0 ? '2' : '1'}
                    strokeDasharray={hour % 2 === 0 ? 'none' : '4 4'}
                  />
                  <text
                    x={scaleX(hour)}
                    y="-20"
                    textAnchor="middle"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '16px',
                      fontWeight: hour % 2 === 0 ? '700' : '500',
                    }}
                    fill={hour % 2 === 0 ? '#374151' : '#9ca3af'}
                  >
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </text>
                </g>
              ))}
            </g>

            <line
              x1={scaleX(coreHours.start)}
              y1={yPosGridStart}
              x2={scaleX(coreHours.start)}
              y2={yPosCapacity + maxHeight}
              stroke="#9ca3af"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.4"
            />
            <line
              x1={scaleX(coreHours.end)}
              y1={yPosGridStart}
              x2={scaleX(coreHours.end)}
              y2={yPosCapacity + maxHeight}
              stroke="#9ca3af"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.4"
            />

            {/* Peak Highlights */}
            <g transform={`translate(0, ${yPosGridStart})`}>
              {peakZones.map((peak, idx) => (
                <g key={`peak-${idx}`}>
                  <rect
                    x={scaleX(peak.x1)}
                    y="0"
                    width={scaleX(peak.x2) - scaleX(peak.x1)}
                    height={yPosCapacity + maxHeight - yPosGridStart}
                    fill="url(#peakHighlight)"
                  />
                  <line
                    x1={scaleX(peak.x1)}
                    y1="0"
                    x2={scaleX(peak.x1)}
                    y2={yPosCapacity + maxHeight - yPosGridStart}
                    stroke="#ff8300"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                  <line
                    x1={scaleX(peak.x2)}
                    y1="0"
                    x2={scaleX(peak.x2)}
                    y2={yPosCapacity + maxHeight - yPosGridStart}
                    stroke="#ff8300"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                </g>
              ))}
            </g>

            {/* Shifts Bars */}
            <g transform={`translate(0, ${yPosShifts})`}>
              {shifts.map((shift, i) => {
                const yPos = i * shiftRowHeight;
                const width = scaleX(shift.end) - scaleX(shift.start);
                return (
                  <g
                    key={shift.id}
                    transform={`translate(${scaleX(shift.start)}, ${yPos})`}
                  >
                    <rect
                      x="0"
                      y="0"
                      width={width}
                      height="44"
                      rx="22"
                      fill="#f9fafb"
                      stroke="#f3f4f6"
                      strokeWidth="1"
                    />
                    <rect
                      x="0"
                      y="0"
                      width={width}
                      height="44"
                      rx="22"
                      fill="url(#shiftGradient)"
                      filter="url(#shadow)"
                    />
                    <text
                      x="24"
                      y="28"
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '16px',
                        fontWeight: '700',
                      }}
                      fill="#ffffff"
                    >
                      {shift.name} ({formatTime(shift.start)} –{' '}
                      {formatTime(shift.end)})
                    </text>
                    <circle
                      cx="12"
                      cy="22"
                      r="4"
                      fill="#ffffff"
                      opacity="0.5"
                    />
                    <circle
                      cx={width - 12}
                      cy="22"
                      r="4"
                      fill="#ffffff"
                      opacity="0.5"
                    />
                  </g>
                );
              })}
            </g>

            {/* Capacity Chart */}
            <g transform={`translate(0, ${yPosCapacity})`}>
              <text
                x="0"
                y="-20"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
                fill="#6b7280"
              >
                Active Shifts (Capacity)
              </text>
              <path d={generateCapacityPath()} fill="url(#capacityGradient)" />
              <path
                d={generateCapacityPath().replace(/ L [^L]+ Z$/, '')}
                fill="none"
                stroke="#ff8300"
                strokeWidth="4"
                strokeLinejoin="round"
              />

              {capacitySteps.map((pt, i) => {
                if (pt.y === 0) return null;
                const midX = pt.x1 + (pt.x2 - pt.x1) / 2;
                const stepY = maxHeight - pt.y * (maxHeight / chartMaxY);
                if (scaleX(pt.x2) - scaleX(pt.x1) < 20) return null;
                return (
                  <text
                    key={`cap-${i}`}
                    x={scaleX(midX)}
                    y={stepY - 12}
                    textAnchor="middle"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '22px',
                      fontWeight: '800',
                    }}
                    fill="#ea580c"
                  >
                    {pt.y}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>

        {}
        {/* Configuration Panel */}
        <div className="w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Shift Configuration Panel
            </h3>
            <div className="flex gap-4">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleAddShift}
                className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <PlusIcon /> Add Shift
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6 flex flex-col md:flex-row gap-6 items-center">
            <div className="font-bold text-gray-700 w-48">
              Core Business Hours:
            </div>
            <div className="flex gap-4 items-center flex-1">
              <input
                type="number"
                step="0.5"
                min="6"
                max="23"
                value={coreHours.start}
                onChange={(e) =>
                  setCoreHours({
                    ...coreHours,
                    start: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-24 p-2 border rounded-lg"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                step="0.5"
                min="6"
                max="23"
                value={coreHours.end}
                onChange={(e) =>
                  setCoreHours({
                    ...coreHours,
                    end: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-24 p-2 border rounded-lg"
              />
              <span className="text-xs text-gray-500 ml-4">
                (Use 24h format decimal, e.g. 17.5 = 17:30)
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
              >
                <input
                  type="text"
                  value={shift.name}
                  onChange={(e) =>
                    handleUpdateShift(shift.id, 'name', e.target.value)
                  }
                  className="flex-1 p-2 border rounded-lg font-semibold text-gray-700"
                  placeholder="Shift Name"
                />
                <input
                  type="number"
                  step="0.5"
                  min="6"
                  max="23"
                  value={shift.start}
                  onChange={(e) =>
                    handleUpdateShift(
                      shift.id,
                      'start',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-24 p-2 border rounded-lg text-center"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="number"
                  step="0.5"
                  min="6"
                  max="23"
                  value={shift.end}
                  onChange={(e) =>
                    handleUpdateShift(
                      shift.id,
                      'end',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-24 p-2 border rounded-lg text-center"
                />
                <button
                  onClick={() => handleRemoveShift(shift.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
            {shifts.length === 0 && (
              <div className="text-center py-8 text-gray-400 font-semibold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No shifts defined. Add a shift to begin.
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default App;

import { useId } from "react";
import { formatMoney } from "../utils/format";

export default function LineChart({
  data = [],
  height = 240,
  color = "#0f766e",
  valueFormatter = formatMoney,
}) {
  const reactId = useId();
  const gradientId = `chart-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const points = data
    .filter((point) => point && point.value !== null && point.value !== undefined)
    .map((point) => ({
      ...point,
      numericValue: Number(point.value) || 0,
    }));

  if (points.length < 2) {
    return (
      <div className="is-chart-empty">
        <i className="fa-solid fa-chart-line" />
        <p className="mb-0 mt-2">
          Se necesitan al menos dos datos históricos para dibujar la gráfica.
        </p>
      </div>
    );
  }

  const width = 720;
  const viewHeight = 260;
  const padX = 12;
  const padTop = 18;
  const padBottom = 34;
  const values = points.map((point) => point.numericValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.max(Math.abs(max), 1);
  const chartHeight = viewHeight - padTop - padBottom;
  const step = (width - padX * 2) / (points.length - 1);

  const coordinates = points.map((point, index) => {
    const x = padX + index * step;
    const y = padTop + chartHeight - ((point.numericValue - min) / range) * chartHeight;
    return { x, y, ...point };
  });

  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padX},${padTop + chartHeight} ${line} ${width - padX},${padTop + chartHeight}`;
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  return (
    <div className="is-chart">
      <svg
        viewBox={`0 0 ${width} ${viewHeight}`}
        role="img"
        aria-label="Gráfico de evolución del valor"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = padTop + chartHeight * fraction;
          return (
            <line
              key={fraction}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="rgba(15, 23, 42, 0.08)"
              strokeDasharray="4 5"
            />
          );
        })}

        <polygon points={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <circle cx={last.x} cy={last.y} r="4.5" fill={color} />
        <circle
          cx={last.x}
          cy={last.y}
          r="9"
          fill={color}
          fillOpacity="0.16"
        />

        <text
          x={padX}
          y={viewHeight - 10}
          fill="#64748b"
          fontSize="12"
        >
          {points[0].date}
        </text>
        <text
          x={width - padX}
          y={viewHeight - 10}
          fill="#64748b"
          fontSize="12"
          textAnchor="end"
        >
          {points[points.length - 1].date}
        </text>
        <text
          x={width - padX}
          y={padTop - 2}
          fill="#334155"
          fontSize="12"
          fontWeight="700"
          textAnchor="end"
        >
          {valueFormatter(last.numericValue)}
        </text>
        <text x={padX} y={padTop - 2} fill="#94a3b8" fontSize="11">
          {valueFormatter(min)} — {valueFormatter(max)}
        </text>
      </svg>
      <div className="is-chart-caption">
        <span>
          <i className="fa-solid fa-circle text-primary is-dot" />
          {first.date} → {last.date}
        </span>
        <span className="fw-semibold">{valueFormatter(last.numericValue)}</span>
      </div>
    </div>
  );
}

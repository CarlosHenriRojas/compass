import { formatMetricValue, type MetricUnit } from "@/features/metrics/format";

type MetricPoint = {
  value: number;
  observedAt: string;
};

const width = 720;
const height = 230;
const paddingX = 38;
const paddingY = 26;

function shortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function MetricTrendChart({
  name,
  points,
  target,
  unit,
}: {
  name: string;
  points: MetricPoint[];
  target: number | null;
  unit?: MetricUnit | null;
}) {
  if (points.length < 2) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-border bg-background-elevated/25 px-5 text-center text-sm text-muted-foreground">
        Registre pelo menos duas medições para visualizar a evolução.
      </div>
    );
  }

  const values = [
    ...points.map((point) => point.value),
    ...(target == null ? [] : [target]),
  ];
  let minimum = Math.min(...values);
  let maximum = Math.max(...values);
  if (minimum === maximum) {
    const margin = Math.abs(minimum || 1) * 0.1;
    minimum -= margin;
    maximum += margin;
  } else {
    const margin = (maximum - minimum) * 0.12;
    minimum -= margin;
    maximum += margin;
  }

  const x = (index: number) =>
    paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
  const y = (value: number) =>
    height - paddingY - ((value - minimum) / (maximum - minimum)) * (height - paddingY * 2);
  const polyline = points
    .map((point, index) => `${x(index)},${y(point.value)}`)
    .join(" ");
  const targetY = target == null ? null : y(target);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background-elevated/30 p-3 sm:p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`Evolução da métrica ${name} entre ${shortDate(points[0].observedAt)} e ${shortDate(points.at(-1)!.observedAt)}`}
      >
        <defs>
          <linearGradient id={`metric-fill-${name.replace(/[^a-z0-9]/gi, "-")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--compass-purple-light)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--compass-purple-light)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const lineY = paddingY + (line / 3) * (height - paddingY * 2);
          return (
            <line
              key={line}
              x1={paddingX}
              x2={width - paddingX}
              y1={lineY}
              y2={lineY}
              stroke="var(--border)"
              strokeDasharray="4 7"
              strokeWidth="1"
            />
          );
        })}
        {targetY != null ? (
          <>
            <line
              x1={paddingX}
              x2={width - paddingX}
              y1={targetY}
              y2={targetY}
              stroke="var(--status-attention)"
              strokeDasharray="7 6"
              strokeWidth="1.5"
            />
            <text
              x={width - paddingX}
              y={Math.max(13, targetY - 7)}
              textAnchor="end"
              fill="var(--status-attention)"
              fontSize="11"
              fontWeight="600"
            >
              Meta {formatMetricValue(target, unit)}
            </text>
          </>
        ) : null}
        <polygon
          points={`${paddingX},${height - paddingY} ${polyline} ${width - paddingX},${height - paddingY}`}
          fill={`url(#metric-fill-${name.replace(/[^a-z0-9]/gi, "-")})`}
        />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--compass-purple-light)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <g key={`${point.observedAt}-${index}`}>
            <circle
              cx={x(index)}
              cy={y(point.value)}
              r={index === points.length - 1 ? 5 : 3.5}
              fill="var(--background)"
              stroke="var(--compass-purple-light)"
              strokeWidth="2.5"
            />
            {(index === 0 || index === points.length - 1) ? (
              <text
                x={x(index)}
                y={height - 5}
                textAnchor={index === 0 ? "start" : "end"}
                fill="var(--text-muted)"
                fontSize="11"
              >
                {shortDate(point.observedAt)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>Mínimo: <strong className="font-medium text-text-secondary">{formatMetricValue(Math.min(...points.map((point) => point.value)), unit)}</strong></span>
        <span>Máximo: <strong className="font-medium text-text-secondary">{formatMetricValue(Math.max(...points.map((point) => point.value)), unit)}</strong></span>
      </div>
    </div>
  );
}

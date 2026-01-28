import React, { FC, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import styles from './AnalyticsChart.module.css';

// --- TYPE DEFINITIONS ---

/**
 * Represents a single data point for the time-series chart.
 * The keys are dynamic, but 'timestamp' is expected.
 */
interface ChartDataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  [key: string]: number | string;
}

/**
 * Props for the AnalyticsChart component.
 */
export interface AnalyticsChartProps {
  /**
   * The array of data points to plot on the chart.
   */
  data: ChartDataPoint[];
  /**
   * The key in the data object that holds the value to be plotted.
   */
  dataKey: string;
  /**
   * A title for the chart, displayed in a <figcaption>.
   */
  title: string;
  /**
   * The primary color for the chart's gradient and line.
   * @default '#8884d8'
   */
  chartColor?: string;
  /**
   * An optional CSS class to apply to the root container.
   */
  className?: string;
}

// --- SUB-COMPONENTS ---

/**
 * A custom, styled tooltip component to match the premium UI.
 * It applies the glassmorphism effect and provides clear data presentation.
 */
const CustomTooltip: FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formattedLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(label));

    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{formattedLabel}</p>
        <p className={styles.tooltipValue}>
          {`${payload[0].name}: `}
          <strong>{payload[0].value?.toLocaleString()}</strong>
        </p>
      </div>
    );
  }

  return null;
};

// --- MAIN COMPONENT ---

/**
 * AnalyticsChart is a production-quality wrapper for the Recharts library,
 * designed to display time-series data with a premium, project-specific aesthetic.
 * It features a glassmorphism container, smooth gradients, and a custom interactive tooltip.
 *
 * @remarks
 * This component requires `recharts` to be installed in the project.
 * `npm install recharts` or `yarn add recharts`
 */
export const AnalyticsChart: FC<AnalyticsChartProps> = ({
  data,
  dataKey,
  title,
  chartColor = '#8884d8',
  className,
}) => {
  const chartId = useMemo(() => `chart-gradient-${Math.random().toString(36).substring(7)}`, []);

  const hasData = data && data.length > 0;

  const containerClasses = `${styles.container} ${className || ''}`;

  return (
    <figure
      className={containerClasses}
      role="figure"
      aria-label={`Analytics chart titled: ${title}`}
    >
      <figcaption className={styles.title}>{title}</figcaption>
      <div className={styles.chartWrapper}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 0,
                bottom: 5,
              }}
              aria-label={`Area chart showing ${dataKey} over time`}
            >
              <defs>
                <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridColor} />
              <XAxis
                dataKey="timestamp"
                stroke={styles.axisColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(timestamp) =>
                  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
                    new Date(timestamp)
                  )
                }
              />
              <YAxis
                stroke={styles.axisColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  typeof value === 'number' ? `${(value / 1000).toFixed(0)}k` : ''
                }
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={chartColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${chartId})`}
                name={dataKey.charAt(0).toUpperCase() + dataKey.slice(1)} // Capitalize for tooltip
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.emptyState}>
            <p>No data available to display.</p>
          </div>
        )}
      </div>
    </figure>
  );
};
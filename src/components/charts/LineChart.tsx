import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from 'chart.js';
import styles from './LineChart.module.css';

// Register the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * @interface LineChartProps
 * @description Props for the LineChart component.
 * @property {ChartData<'line'>} data - The data object for the chart, conforming to the Chart.js 'line' chart data structure.
 * @property {ChartOptions<'line'>} [options] - Optional Chart.js options to override the component's defaults.
 * @property {string} [title] - An optional title to display above the chart.
 * @property {string} [subtitle] - An optional subtitle for additional context.
 * @property {string} [className] - An optional CSS class to apply to the component's root element.
 */
export interface LineChartProps {
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * @name LineChart
 * @description A styled and configured wrapper for the react-chartjs-2 Line chart,
 * designed for a premium, modern UI.
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  options,
  title,
  subtitle,
  className,
}) => {
  const chartTitleId = useMemo(() => `line-chart-title-${Math.random().toString(36).substr(2, 9)}`, []);

  const defaultOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#94a3b8', // slate-400
          font: {
            family: 'inherit',
            size: 12,
          },
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      // Disable the default Chart.js title plugin as we have a custom header
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900 with opacity
        titleColor: '#f8fafc', // slate-50
        bodyColor: '#cbd5e1', // slate-300
        titleFont: {
          family: 'inherit',
          weight: 'bold',
        },
        bodyFont: {
          family: 'inherit',
        },
        cornerRadius: 8,
        padding: 12,
        caretSize: 0,
        boxPadding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false, // Hide vertical grid lines for a cleaner look
        },
        ticks: {
          color: '#64748b', // slate-500
          font: {
            family: 'inherit',
            size: 12,
          },
        },
      },
      y: {
        border: {
          display: false,
        },
        grid: {
          color: 'rgba(100, 116, 139, 0.15)', // slate-500 with opacity
          drawTicks: false,
        },
        ticks: {
          color: '#64748b', // slate-500
          font: {
            family: 'inherit',
            size: 12,
          },
          padding: 16,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      line: {
        tension: 0.4, // Creates smooth, bezier curves
      },
      point: {
        radius: 0, // Hide points by default
        hoverRadius: 6,
        hitRadius: 20,
      },
    },
  }), []);

  // Deep merge is preferred in a real-world scenario, but for simplicity,
  // we'll do a structured merge that preserves our nested plugin and scale defaults.
  const mergedOptions = useMemo(() => ({
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options?.plugins,
    },
    scales: {
      ...defaultOptions.scales,
      ...options?.scales,
    },
  }), [defaultOptions, options]);

  const wrapperClasses = [styles.wrapper, className].filter(Boolean).join(' ');

  return (
    <section className={wrapperClasses} aria-labelledby={title ? chartTitleId : undefined}>
      {(title || subtitle) && (
        <header className={styles.header}>
          {title && <h2 id={chartTitleId} className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
      )}
      <div className={styles.chartContainer}>
        <Line options={mergedOptions} data={data} />
      </div>
    </section>
  );
};
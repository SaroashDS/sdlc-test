import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './BarChart.module.css';

// --- Registering Chart.js components ---
// This is a necessary step to make the chart components available for use.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- Type Definitions ---

/**
 * @interface BarChartProps
 * @description Defines the props for the BarChart component.
 * @property {ChartData<'bar'>} data - The data object for the chart, conforming to the Chart.js 'bar' type.
 * @property {string} title - A title to be displayed above the chart.
 * @property {string} ariaLabel - A descriptive label for screen readers.
 * @property {ChartOptions<'bar'>} [options] - Optional Chart.js options to override the component's defaults.
 * @property {string} [className] - Optional CSS class to apply to the container for custom styling.
 */
export interface BarChartProps {
  data: ChartData<'bar'>;
  title: string;
  ariaLabel: string;
  options?: ChartOptions<'bar'>;
  className?: string;
}

/**
 * @component BarChart
 * @description An architected, production-quality wrapper for the react-chartjs-2 Bar chart.
 * It provides a premium, glassmorphic UI and sensible defaults for immediate use.
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  options,
  title,
  ariaLabel,
  className,
}) => {
  const titleId = `barchart-title-${React.useId()}`;

  // --- Default Chart Options ---
  // Memoizing options prevents re-rendering on every parent component update.
  const defaultOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
        },
      },
      // We disable the default Chart.js title plugin to use our own custom title element.
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 16,
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          size: 14,
          family: "'Inter', sans-serif",
        },
        cornerRadius: 4,
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.15)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      x: {
        grid: {
          display: false, // Hide vertical grid lines for a cleaner look
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
    },
    // Disabling animations on resize can improve performance.
    animation: {
      duration: 1000,
    },
  }), []);

  // Deep merge would be better for production, but this is a solid approach for most cases.
  const mergedOptions = useMemo(() => ({ ...defaultOptions, ...options }), [defaultOptions, options]);

  return (
    <section
      className={`${styles.chartContainer} ${className || ''}`}
      aria-labelledby={titleId}
      role="figure"
    >
      <header className={styles.chartHeader}>
        <h2 id={titleId} className={styles.chartTitle}>
          {title}
        </h2>
      </header>
      <div className={styles.chartWrapper}>
        <Bar
          options={mergedOptions}
          data={data}
          aria-label={ariaLabel}
          role="img"
        />
      </div>
    </section>
  );
};
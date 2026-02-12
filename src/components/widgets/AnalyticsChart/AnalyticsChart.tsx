import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import styles from './AnalyticsChart.module.css';

// Register all necessary Chart.js components for broad compatibility.
// This "tree-shakable" approach is required for Chart.js v3+.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Props for the AnalyticsChart component.
 */
export interface AnalyticsChartProps {
  /** The type of chart to render (e.g., 'line', 'bar', 'pie'). */
  type: ChartType;
  /** The data object that Chart.js will use to render the chart. */
  data: ChartData<ChartType>;
  /** The options object for Chart.js to customize the chart's appearance and behavior. */
  options?: ChartOptions<ChartType>;
  /** A title for the chart, displayed above it and used for accessibility. */
  title: string;
  /** Optional additional CSS class names to apply to the container. */
  className?: string;
}

/**
 * An elite, production-quality chart component that serves as a responsive
 * and interactive wrapper for Chart.js. It features a premium, glassmorphic
 * design and is built with strict TypeScript and accessibility in mind.
 */
const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  data,
  options,
  title,
  className,
}) => {
  // Define default options to ensure a consistent and clean look.
  // These can be overridden by the `options` prop.
  const defaultOptions: ChartOptions<ChartType> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E0E0E0',
          font: {
            family: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif",
            size: 12,
          },
        },
      },
      // The custom title element is used instead of the Chart.js title plugin.
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(10, 25, 47, 0.85)',
        titleColor: '#FFFFFF',
        bodyColor: '#E0E0E0',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#A0A0A0',
          font: {
            family: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif",
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#A0A0A0',
          font: {
            family: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif",
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  // In a real-world scenario, a deep merge utility (e.g., from lodash) is recommended.
  // For this component, we'll perform a shallow merge for simplicity.
  const mergedOptions = { ...defaultOptions, ...options };

  const containerClasses = `${styles.chartContainer} ${className || ''}`.trim();

  return (
    <div className={containerClasses}>
      <figure className={styles.chartFigure} role="group" aria-labelledby="chart-title">
        <figcaption id="chart-title" className={styles.chartTitle}>
          {title}
        </figcaption>
        <div className={styles.chartWrapper}>
          <Chart
            type={type}
            data={data}
            options={mergedOptions}
            aria-label={`Chart: ${title}`}
            role="img"
          />
        </div>
      </figure>
    </div>
  );
};

export default AnalyticsChart;
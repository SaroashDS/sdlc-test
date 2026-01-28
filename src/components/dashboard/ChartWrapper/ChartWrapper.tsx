import React, { useRef, useEffect, useMemo } from 'react';
import {
  Chart,
  registerables,
  type ChartType,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import styles from './ChartWrapper.module.css';

// --- TYPE DEFINITIONS ---

// A generic, clean data structure for the component's public API
export interface GenericChartSeries {
  name: string;
  values: number[];
}

export interface GenericChartData {
  labels: string[];
  series: GenericChartSeries[];
}

export interface ChartWrapperProps {
  /** The type of chart to render (e.g., 'bar', 'line', 'pie'). */
  type: ChartType;
  /** The title of the chart, displayed above it. */
  title: string;
  /** The data to be visualized, in a generic format. */
  data: GenericChartData | null;
  /** Optional custom Chart.js options to merge with theme defaults. */
  options?: ChartOptions;
  /** When true, a loading indicator is shown. */
  isLoading?: boolean;
  /** If an error occurs, its message is displayed. */
  error?: string | null;
}

// --- THEME GENERATION HOOK ---

/**
 * A hook to generate theme-aware Chart.js options from CSS Custom Properties.
 * This allows the chart's appearance to be controlled entirely by CSS.
 */
const useChartTheme = (): ChartOptions => {
  // In a real app, you might get these from a theme context.
  // For this component, we read them directly when the hook runs.
  return useMemo(() => {
    const bodyStyles = getComputedStyle(document.body);
    const textColor = bodyStyles.getPropertyValue('--text-color-primary') || '#1a202c';
    const secondaryTextColor = bodyStyles.getPropertyValue('--text-color-secondary') || '#718096';
    const gridColor = bodyStyles.getPropertyValue('--grid-line-color') || 'rgba(0, 0, 0, 0.1)';
    const tooltipBg = bodyStyles.getPropertyValue('--tooltip-bg-color') || 'rgba(0, 0, 0, 0.8)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: {
              family: 'inherit',
            },
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          titleFont: { family: 'inherit' },
          bodyFont: { family: 'inherit' },
          cornerRadius: 8,
          padding: 12,
        },
      },
      scales: {
        x: {
          ticks: { color: secondaryTextColor, font: { family: 'inherit' } },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: secondaryTextColor, font: { family: 'inherit' } },
          grid: { color: gridColor },
        },
      },
    };
  }, []); // Re-calculates only if the component remounts, assuming CSS vars are stable.
};

// --- DATA MAPPING UTILITY ---

/**
 * Memoized function to map our generic data prop to the Chart.js data format.
 * @param data The generic data from props.
 * @returns Chart.js compatible data object.
 */
const useMappedChartData = (data: GenericChartData | null): ChartData => {
  return useMemo(() => {
    if (!data || !data.labels || !data.series) {
      return { labels: [], datasets: [] };
    }

    // Define a palette of colors using CSS variables for theming
    const palette = [
      '--chart-color-1',
      '--chart-color-2',
      '--chart-color-3',
      '--chart-color-4',
      '--chart-color-5',
    ].map(v => getComputedStyle(document.body).getPropertyValue(v).trim() || '#000000');

    return {
      labels: data.labels,
      datasets: data.series.map((s, index) => ({
        label: s.name,
        data: s.values,
        backgroundColor: palette[index % palette.length] + '80', // Add alpha for fill
        borderColor: palette[index % palette.length],
        borderWidth: 2,
        tension: 0.4, // For smooth line charts
        fill: true,
      })),
    };
  }, [data]);
};

// --- MAIN COMPONENT ---

// Register all Chart.js components. For production, you can tree-shake
// by importing and registering only the controllers, elements, scales, and plugins you need.
Chart.register(...registerables);

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  type,
  title,
  data,
  options = {},
  isLoading = false,
  error = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const themeOptions = useChartTheme();
  const chartData = useMappedChartData(data);

  // Deep merge custom options into theme options
  const finalOptions = useMemo(() => ({ ...themeOptions, ...options }), [themeOptions, options]);

  // Effect for Chart.js instance lifecycle management
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy previous instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Create a new chart instance
    chartInstanceRef.current = new Chart(ctx, {
      type,
      data: chartData,
      options: finalOptions,
    });

    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [type, chartData, finalOptions]);

  // Effect for responsive resizing using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const hasData = data && data.series.length > 0 && data.labels.length > 0;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.overlay}>
          <div className={styles.spinner} role="status" aria-label="Loading chart data"></div>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.overlay}>
          <div className={styles.messageContainer} role="alert">
            <span className={styles.errorIcon}>!</span>
            <p>{error}</p>
          </div>
        </div>
      );
    }
    if (!hasData) {
      return (
        <div className={styles.overlay}>
          <div className={styles.messageContainer}>
            <p>No data available</p>
          </div>
        </div>
      );
    }
    return null; // No overlay needed if there is data
  };

  return (
    <figure className={styles.wrapper} aria-labelledby="chart-title">
      <figcaption id="chart-title" className={styles.header}>
        {title}
      </figcaption>
      <div className={styles.chartContainer} ref={containerRef}>
        {renderContent()}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Chart: ${title}`}
          style={{ visibility: isLoading || error || !hasData ? 'hidden' : 'visible' }}
        ></canvas>
      </div>
    </figure>
  );
};
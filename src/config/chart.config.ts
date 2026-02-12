/**
 * @file src/config/chart.config.ts
 * @description Centralized default options and plugins for Chart.js.
 * This file provides a reusable configuration for creating charts
 * across the application, ensuring a consistent look and feel.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  Plugin,
  TooltipItem,
  ChartType,
} from 'chart.js';

// --- Register necessary components ---
// This is a crucial step for tree-shaking to work correctly.
// By registering components, we tell Chart.js which elements, scales, and plugins
// are available for use. This should be done once in your application.
try {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
} catch (error) {
  // This block can help diagnose issues if Chart.js fails to register components,
  // though it's unlikely to fail in a standard environment.
  console.error('Failed to register Chart.js components:', error);
}

// --- Constants for Styling ---
// Using constants makes it easy to update the theme of all charts from one place.
const FONT_FAMILY = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
const GRID_COLOR = 'rgba(200, 200, 200, 0.2)';
const FONT_COLOR = '#4A4A4A';
const TOOLTIP_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.8)';

/**
 * A custom Chart.js plugin to draw a subtle background color on the chart area.
 * This is an example of how to extend Chart.js functionality.
 */
export const chartAreaBackgroundColorPlugin: Plugin = {
  id: 'chartAreaBackgroundColor',
  beforeDraw: (chart) => {
    const { ctx, chartArea } = chart;
    // The chartArea can be undefined during the initial render cycles.
    if (!chartArea) {
      return;
    }
    ctx.save();
    ctx.fillStyle = 'rgba(248, 249, 250, 0.5)'; // A very light grey
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    ctx.restore();
  },
};

/**
 * Default options for all charts. These can be deeply merged with
 * chart-specific options when creating a new chart instance.
 */
export const defaultChartOptions: ChartOptions = {
  // Ensures the chart resizes with its container.
  responsive: true,
  // It's often better to let the container's CSS control the aspect ratio.
  maintainAspectRatio: false,

  // Defines interaction behavior on hover.
  interaction: {
    // 'index' mode finds all items at the same index on the x-axis.
    mode: 'index',
    // `false` means the hover event is triggered even if the mouse is not directly over an element.
    intersect: false,
  },

  // Global plugin configurations.
  plugins: {
    // Configuration for the chart legend.
    legend: {
      position: 'top' as const,
      labels: {
        font: {
          family: FONT_FAMILY,
        },
        color: FONT_COLOR,
        boxWidth: 20,
        padding: 20,
      },
    },
    // Configuration for the chart title.
    title: {
      display: true,
      text: 'Default Chart Title',
      font: {
        size: 18,
        family: FONT_FAMILY,
        weight: 'bold',
      },
      color: FONT_COLOR,
      padding: {
        top: 10,
        bottom: 20,
      },
    },
    // Configuration for tooltips that appear on hover.
    tooltip: {
      enabled: true,
      backgroundColor: TOOLTIP_BACKGROUND_COLOR,
      titleFont: {
        size: 14,
        family: FONT_FAMILY,
      },
      bodyFont: {
        size: 12,
        family: FONT_FAMILY,
      },
      padding: 10,
      cornerRadius: 4,
      callbacks: {
        // Custom formatter for the tooltip label.
        label: (context: TooltipItem<ChartType>) => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            // Example: Format as a locale-specific number.
            // For currency or other specific formats, adjust the options.
            label += new Intl.NumberFormat('en-US').format(context.parsed.y);
          }
          return label;
        },
      },
    },
  },

  // Configuration for chart scales (axes).
  scales: {
    // X-axis configuration.
    x: {
      grid: {
        // Hides the vertical grid lines for a cleaner look.
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: FONT_COLOR,
        font: {
          family: FONT_FAMILY,
        },
      },
      title: {
        display: false, // Often redundant, can be enabled per chart
        text: 'X-Axis',
        color: FONT_COLOR,
        font: {
          size: 14,
          weight: 'bold',
          family: FONT_FAMILY,
        },
      },
    },
    // Y-axis configuration.
    y: {
      grid: {
        color: GRID_COLOR,
        drawBorder: false,
      },
      ticks: {
        color: FONT_COLOR,
        font: {
          family: FONT_FAMILY,
        },
        // Example callback to format ticks as abbreviated numbers (e.g., 1k, 1M).
        callback: (value) => {
          if (typeof value === 'number') {
            if (Math.abs(value) >= 1_000_000) {
              return `${value / 1_000_000}M`;
            }
            if (Math.abs(value) >= 1_000) {
              return `${value / 1_000}K`;
            }
            return value;
          }
          return value;
        },
      },
      title: {
        display: false, // Often redundant, can be enabled per chart
        text: 'Y-Axis',
        color: FONT_COLOR,
        font: {
          size: 14,
          weight: 'bold',
          family: FONT_FAMILY,
        },
      },
    },
  },
};
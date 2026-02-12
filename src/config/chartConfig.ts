/**
 * @file src/config/chartConfig.ts
 * @type {FileType.CONFIG}
 * @description Global Chart.js options for colors, fonts, tooltips, and responsiveness.
 * This configuration ensures a consistent and professional look and feel for all charts
 * across the application.
 */

import { ChartOptions, TooltipItem, ChartType } from 'chart.js';

// Using a type-safe approach to prevent configuration errors at compile time.

/**
 * Defines the color palette used for charts.
 * Exporting this allows for consistent color usage outside of the default chart options.
 */
export const chartColors = {
  primary: 'rgba(75, 192, 192, 1)',
  primaryTransparent: 'rgba(75, 192, 192, 0.2)',
  secondary: 'rgba(255, 99, 132, 1)',
  secondaryTransparent: 'rgba(255, 99, 132, 0.2)',
  tertiary: 'rgba(54, 162, 235, 1)',
  tertiaryTransparent: 'rgba(54, 162, 235, 0.2)',
  warning: 'rgba(255, 206, 86, 1)',
  warningTransparent: 'rgba(255, 206, 86, 0.2)',
  text: '#4A4A4A',
  grid: 'rgba(0, 0, 0, 0.1)',
  tooltipBg: 'rgba(0, 0, 0, 0.85)',
  white: '#FFFFFF',
};

/**
 * Defines the font styles used for charts.
 * Exporting this allows for consistent font usage in custom chart elements.
 */
export const chartFonts = {
  family: "'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
  size: 12,
  color: chartColors.text,
};

/**
 * Global Chart.js options.
 * These options are intended to be merged with specific chart configurations.
 * Using a generic `ChartType` allows these options to be applied to any chart type.
 */
export const globalChartOptions: ChartOptions<ChartType> = {
  // Ensures charts resize with their container.
  responsive: true,
  // Allows the chart to have a different aspect ratio than the default.
  maintainAspectRatio: false,

  // Default interaction settings for tooltips and hover events.
  interaction: {
    mode: 'index',
    intersect: false,
  },

  // Plugin-specific configurations.
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: chartFonts.family,
          size: chartFonts.size,
        },
        color: chartFonts.color,
        boxWidth: 20,
        padding: 20,
      },
    },
    title: {
      // Titles are disabled by default and should be enabled on a per-chart basis.
      display: false,
      text: 'Default Chart Title',
      font: {
        family: chartFonts.family,
        size: 18,
        weight: '600',
      },
      color: chartFonts.color,
      padding: {
        top: 10,
        bottom: 20,
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: chartColors.tooltipBg,
      titleFont: {
        family: chartFonts.family,
        size: 14,
        weight: 'bold',
      },
      bodyFont: {
        family: chartFonts.family,
        size: chartFonts.size,
      },
      padding: 12,
      cornerRadius: 4,
      displayColors: true,
      callbacks: {
        // Custom callback to format the tooltip label for better readability.
        label: (context: TooltipItem<ChartType>): string => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            // Format numbers with commas for thousands separators.
            label += new Intl.NumberFormat('en-US').format(context.parsed.y);
          }
          return label;
        },
      },
    },
  },

  // Default configurations for chart scales (axes).
  scales: {
    x: {
      grid: {
        // Hide vertical grid lines for a cleaner look.
        display: false,
        color: chartColors.grid,
      },
      ticks: {
        color: chartFonts.color,
        font: {
          family: chartFonts.family,
          size: chartFonts.size,
        },
      },
    },
    y: {
      grid: {
        color: chartColors.grid,
        drawBorder: false,
      },
      ticks: {
        color: chartFonts.color,
        font: {
          family: chartFonts.family,
          size: chartFonts.size,
        },
        // Example callback to format large numbers on the y-axis.
        callback: (value) => {
          if (typeof value === 'number' && value >= 1000) {
            return `${value / 1000}k`;
          }
          return value;
        },
      },
    },
  },

  // Default styling for different chart elements.
  elements: {
    bar: {
      backgroundColor: chartColors.primaryTransparent,
      borderColor: chartColors.primary,
      borderWidth: 1.5,
      borderRadius: 4,
    },
    line: {
      borderColor: chartColors.primary,
      tension: 0.4, // Creates smooth, curved lines.
      fill: false,
      borderWidth: 2,
    },
    point: {
      radius: 3,
      backgroundColor: chartColors.primary,
      hoverRadius: 5,
      hoverBorderWidth: 2,
    },
  },
};
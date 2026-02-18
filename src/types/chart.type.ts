/**
 * @file Chart data types
 */

/**
 * Represents a single data point in a chart.
 */
export interface ChartDataPoint {
  /**
   * The label for the data point (e.g., a date or category).
   */
  label: string;
  /**
   * The numerical value of the data point.
   */
  value: number;
  /**
   * Optional color associated with the data point.
   */
  color?: string;
  /**
   * Optional metadata associated with the data point.
   */
  metadata?: Record<string, any>;
}

/**
 * Represents a dataset within a chart.  A chart can have multiple datasets.
 */
export interface ChartDataset {
  /**
   * The label for the dataset (e.g., "Sales" or "Expenses").
   */
  label: string;
  /**
   * An array of data points for this dataset.
   */
  data: ChartDataPoint[];
  /**
   * Optional color to use for the dataset (e.g., for lines or bars).
   */
  color?: string;
  /**
   * Optional type of chart to use for this dataset.  If not specified, the chart will use the default chart type.
   */
  type?: ChartType;
  /**
   * Optional properties specific to the chart type.
   */
  chartOptions?: Record<string, any>;
}

/**
 * Represents the overall chart data structure.
 */
export interface ChartData {
  /**
   * An array of datasets to display in the chart.
   */
  datasets: ChartDataset[];
  /**
   * Optional labels for the x-axis (if not provided in the data points).
   */
  labels?: string[];
}

/**
 * Represents the configuration options for a chart.
 */
export interface ChartOptions {
  /**
   * The title of the chart.
   */
  title?: string;
  /**
   * Options for the x-axis.
   */
  xAxis?: AxisOptions;
  /**
   * Options for the y-axis.
   */
  yAxis?: AxisOptions;
  /**
   * Options for the legend.
   */
  legend?: LegendOptions;
  /**
   * General chart options.
   */
  chartArea?: ChartAreaOptions;
  /**
   * Tooltip options.
   */
  tooltip?: TooltipOptions;
  /**
   * Whether the chart is responsive.
   */
  responsive?: boolean;
  /**
   * Aspect ratio of the chart.
   */
  aspectRatio?: number;
  /**
   * Maintain aspect ratio.
   */
  maintainAspectRatio?: boolean;
  /**
   * Custom plugins.
   */
  plugins?: any[];
}

/**
 * Represents options for a chart axis.
 */
export interface AxisOptions {
  /**
   * The title of the axis.
   */
  title?: string;
  /**
   * Whether to display the axis.
   */
  display?: boolean;
  /**
   * The scale type for the axis (e.g., "linear", "logarithmic", "category").
   */
  type?: 'linear' | 'logarithmic' | 'category' | 'time';
  /**
   * The position of the axis (e.g., "bottom", "left").
   */
  position?: 'bottom' | 'left' | 'top' | 'right';
  /**
   * Minimum value for the axis.
   */
  min?: number;
  /**
   * Maximum value for the axis.
   */
  max?: number;
  /**
   * Step size for the axis.
   */
  stepSize?: number;
  /**
   * Ticks options.
   */
  ticks?: AxisTickOptions;
}

/**
 * Represents options for axis ticks.
 */
export interface AxisTickOptions {
  /**
   * Whether to display the ticks.
   */
  display?: boolean;
  /**
   * Callback function to format the tick labels.
   */
  callback?: (value: number | string, index: number, values: (number | string)[]) => string;
  /**
   * Auto skip ticks.
   */
  autoSkip?: boolean;
  /**
   * Max ticks limit.
   */
  maxTicksLimit?: number;
}

/**
 * Represents options for the chart legend.
 */
export interface LegendOptions {
  /**
   * Whether to display the legend.
   */
  display?: boolean;
  /**
   * The position of the legend (e.g., "top", "bottom", "left", "right").
   */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Whether to reverse the order of the legend items.
   */
  reverse?: boolean;
}

/**
 * Represents options for the chart area.
 */
export interface ChartAreaOptions {
  /**
   * Background color of the chart area.
   */
  backgroundColor?: string;
}

/**
 * Represents options for tooltips.
 */
export interface TooltipOptions {
  /**
   * Whether to display tooltips.
   */
  display?: boolean;
  /**
   * Mode of interaction.
   */
  mode?: 'point' | 'nearest' | 'index' | 'dataset' | 'x' | 'y';
  /**
   * Callback function to format the tooltip title.
   */
  titleCallback?: (tooltipItem: any[]) => string | string[];
  /**
   * Callback function to format the tooltip label.
   */
  labelCallback?: (tooltipItem: any) => string;
}

/**
 * Represents the type of chart to display.
 */
export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'scatter'
  | 'bubble'
  | 'polarArea';

/**
 * Represents a complete chart configuration, including data and options.
 */
export interface ChartConfiguration {
  /**
   * The data to display in the chart.
   */
  data: ChartData;
  /**
   * The options to configure the chart.
   */
  options?: ChartOptions;
  /**
   * The type of chart to display.
   */
  type?: ChartType;
}

/**
 * Represents the possible values for the position of a chart element.
 */
export type ChartPosition = 'top' | 'bottom' | 'left' | 'right' | 'chartArea';

/**
 * Represents the possible values for the border style of a chart element.
 */
export type ChartBorderStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Represents a function that can be used to generate a color.
 */
export type ColorGenerator = (index: number) => string;

/**
 * Represents a function that can be used to format a value.
 */
export type ValueFormatter = (value: number | string) => string;

/**
 * Represents a function that can be used to generate a label.
 */
export type LabelGenerator = (index: number) => string;

/**
 * Represents a function that can be used to generate a tooltip.
 */
export type TooltipGenerator = (item: ChartDataPoint) => string;

/**
 * Represents a function that can be used to generate a legend label.
 */
export type LegendLabelGenerator = (dataset: ChartDataset) => string;

/**
 * Represents a function that can be used to generate a legend item.
 */
export type LegendItemGenerator = (dataset: ChartDataset, index: number) => JSX.Element;

/**
 * Represents a function that can be used to generate a chart element.
 */
export type ChartElementGenerator = (data: ChartData, options: ChartOptions) => JSX.Element;

/**
 * Represents a function that can be used to update a chart.
 */
export type ChartUpdater = (chart: any, data: ChartData, options: ChartOptions) => void;

/**
 * Represents a function that can be used to destroy a chart.
 */
export type ChartDestroyer = (chart: any) => void;
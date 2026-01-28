/**
 * Represents a generic name for a metric.
 */
export type MetricName = string;

/**
 * Represents the numerical value of a metric.
 */
export type MetricValue = number;

/**
 * Represents a collection of key-value pairs used to add dimensions to a metric.
 * Keys and values are typically strings.
 */
export type MetricLabels = Readonly<Record<string, string>>;

/**
 * Represents a timestamp, typically in Unix epoch milliseconds.
 */
export type Timestamp = number;

/**
 * Base interface for all metric types, providing common properties.
 */
export interface BaseMetric {
  /**
   * The unique name of the metric.
   */
  name: MetricName;
  /**
   * Optional labels (key-value pairs) that provide additional dimensions to the metric.
   */
  labels?: MetricLabels;
  /**
   * Optional timestamp when the metric was recorded, in Unix epoch milliseconds.
   */
  timestamp?: Timestamp;
}

/**
 * Represents a Gauge metric.
 * A gauge is a metric that represents a single numerical value that can arbitrarily go up and down.
 * Examples: current temperature, current number of concurrent requests.
 */
export interface GaugeMetric extends BaseMetric {
  /**
   * The current value of the gauge.
   */
  value: MetricValue;
}

/**
 * Represents a Counter metric.
 * A counter is a cumulative metric that represents a single monotonically increasing cumulative counter.
 * Examples: number of requests served, total errors.
 */
export interface CounterMetric extends BaseMetric {
  /**
   * The current cumulative value of the counter.
   */
  value: MetricValue;
}

/**
 * Represents a Histogram metric.
 * A histogram samples observations (e.g., request durations or response sizes) and counts them in configurable buckets.
 * It also provides a sum of all observed values.
 */
export interface HistogramMetric extends BaseMetric {
  /**
   * The total number of observations.
   */
  count: number;
  /**
   * The sum of all observed values.
   */
  sum: number;
  /**
   * A map of cumulative counts for observation buckets.
   * Keys are string representations of the upper bounds of the buckets (e.g., "0.1", "1", "10").
   * Values are the cumulative count of observations less than or equal to the bucket's upper bound.
   * The special key `+Inf` or `Infinity` can represent the count of all observations.
   */
  buckets: Readonly<Record<string, number>>;
}

/**
 * Represents a Summary metric.
 * A summary samples observations (e.g., request durations or response sizes) and calculates configurable quantiles
 * over a sliding time window.
 */
export interface SummaryMetric extends BaseMetric {
  /**
   * The total number of observations.
   */
  count: number;
  /**
   * The sum of all observed values.
   */
  sum: number;
  /**
   * A map of observed quantiles.
   * Keys are string representations of the quantile (e.g., "0.5" for the 50th percentile, "0.99" for the 99th percentile).
   * Values are the estimated values at those quantiles.
   */
  quantiles: Readonly<Record<string, number>>;
}

/**
 * A union type representing any of the defined metric types.
 */
export type Metric = GaugeMetric | CounterMetric | HistogramMetric | SummaryMetric;

/**
 * Represents a collection or array of metrics.
 */
export type MetricCollection = Metric[];
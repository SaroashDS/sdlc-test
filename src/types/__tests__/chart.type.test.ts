/**
 * @jest-environment jsdom
 */

import {
  ChartDataPoint,
  ChartDataset,
  ChartData,
  ChartOptions,
  AxisOptions,
  AxisTickOptions,
  LegendOptions,
  ChartAreaOptions,
  TooltipOptions,
  ChartType,
  ChartConfiguration,
  ChartPosition,
  ChartBorderStyle,
  ColorGenerator,
  ValueFormatter,
  LabelGenerator,
  TooltipGenerator,
  LegendLabelGenerator,
  LegendItemGenerator,
  ChartElementGenerator,
  ChartUpdater,
  ChartDestroyer,
} from './chart.type';

describe('Chart Data Types', () => {
  it('should define ChartDataPoint interface', () => {
    const dataPoint: ChartDataPoint = {
      label: 'Test Label',
      value: 10,
      color: 'red',
      metadata: { key: 'value' },
    };
    expect(dataPoint.label).toBe('Test Label');
    expect(dataPoint.value).toBe(10);
    expect(dataPoint.color).toBe('red');
    expect(dataPoint.metadata).toEqual({ key: 'value' });
  });

  it('should define ChartDataset interface', () => {
    const dataset: ChartDataset = {
      label: 'Test Dataset',
      data: [{ label: 'Data Point', value: 5 }],
      color: 'blue',
      type: 'line',
      chartOptions: { option1: 'value1' },
    };
    expect(dataset.label).toBe('Test Dataset');
    expect(dataset.data).toEqual([{ label: 'Data Point', value: 5 }]);
    expect(dataset.color).toBe('blue');
    expect(dataset.type).toBe('line');
    expect(dataset.chartOptions).toEqual({ option1: 'value1' });
  });

  it('should define ChartData interface', () => {
    const chartData: ChartData = {
      datasets: [{ label: 'Dataset 1', data: [{ label: 'Point 1', value: 1 }] }],
      labels: ['Label 1', 'Label 2'],
    };
    expect(chartData.datasets).toEqual([
      { label: 'Dataset 1', data: [{ label: 'Point 1', value: 1 }] },
    ]);
    expect(chartData.labels).toEqual(['Label 1', 'Label 2']);
  });

  it('should define ChartOptions interface', () => {
    const chartOptions: ChartOptions = {
      title: 'Test Chart',
      xAxis: { title: 'X Axis' },
      yAxis: { title: 'Y Axis' },
      legend: { display: true },
      chartArea: { backgroundColor: 'lightgray' },
      tooltip: { display: true },
      responsive: true,
      aspectRatio: 1.5,
      maintainAspectRatio: true,
      plugins: [],
    };
    expect(chartOptions.title).toBe('Test Chart');
    expect(chartOptions.xAxis).toEqual({ title: 'X Axis' });
    expect(chartOptions.yAxis).toEqual({ title: 'Y Axis' });
    expect(chartOptions.legend).toEqual({ display: true });
    expect(chartOptions.chartArea).toEqual({ backgroundColor: 'lightgray' });
    expect(chartOptions.tooltip).toEqual({ display: true });
    expect(chartOptions.responsive).toBe(true);
    expect(chartOptions.aspectRatio).toBe(1.5);
    expect(chartOptions.maintainAspectRatio).toBe(true);
    expect(chartOptions.plugins).toEqual([]);
  });

  it('should define AxisOptions interface', () => {
    const axisOptions: AxisOptions = {
      title: 'Test Axis',
      display: true,
      type: 'linear',
      position: 'bottom',
      min: 0,
      max: 100,
      stepSize: 10,
      ticks: { display: true },
    };
    expect(axisOptions.title).toBe('Test Axis');
    expect(axisOptions.display).toBe(true);
    expect(axisOptions.type).toBe('linear');
    expect(axisOptions.position).toBe('bottom');
    expect(axisOptions.min).toBe(0);
    expect(axisOptions.max).toBe(100);
    expect(axisOptions.stepSize).toBe(10);
    expect(axisOptions.ticks).toEqual({ display: true });
  });

  it('should define AxisTickOptions interface', () => {
    const tickOptions: AxisTickOptions = {
      display: true,
      callback: (value) => `Formatted: ${value}`,
      autoSkip: true,
      maxTicksLimit: 5,
    };
    expect(tickOptions.display).toBe(true);
    expect(tickOptions.callback!(5, 0, [])).toBe('Formatted: 5');
    expect(tickOptions.autoSkip).toBe(true);
    expect(tickOptions.maxTicksLimit).toBe(5);
  });

  it('should define LegendOptions interface', () => {
    const legendOptions: LegendOptions = {
      display: true,
      position: 'top',
      reverse: true,
    };
    expect(legendOptions.display).toBe(true);
    expect(legendOptions.position).toBe('top');
    expect(legendOptions.reverse).toBe(true);
  });

  it('should define ChartAreaOptions interface', () => {
    const chartAreaOptions: ChartAreaOptions = {
      backgroundColor: 'lightgreen',
    };
    expect(chartAreaOptions.backgroundColor).toBe('lightgreen');
  });

  it('should define TooltipOptions interface', () => {
    const tooltipOptions: TooltipOptions = {
      display: true,
      mode: 'nearest',
      titleCallback: () => 'Tooltip Title',
      labelCallback: () => 'Tooltip Label',
    };
    expect(tooltipOptions.display).toBe(true);
    expect(tooltipOptions.mode).toBe('nearest');
    expect(tooltipOptions.titleCallback!([])).toBe('Tooltip Title');
    expect(tooltipOptions.labelCallback!({})).toBe('Tooltip Label');
  });

  it('should define ChartType type', () => {
    const chartTypeLine: ChartType = 'line';
    const chartTypeBar: ChartType = 'bar';
    const chartTypePie: ChartType = 'pie';
    const chartTypeDoughnut: ChartType = 'doughnut';
    const chartTypeRadar: ChartType = 'radar';
    const chartTypeScatter: ChartType = 'scatter';
    const chartTypeBubble: ChartType = 'bubble';
    const chartTypePolarArea: ChartType = 'polarArea';

    expect(chartTypeLine).toBe('line');
    expect(chartTypeBar).toBe('bar');
    expect(chartTypePie).toBe('pie');
    expect(chartTypeDoughnut).toBe('doughnut');
    expect(chartTypeRadar).toBe('radar');
    expect(chartTypeScatter).toBe('scatter');
    expect(chartTypeBubble).toBe('bubble');
    expect(chartTypePolarArea).toBe('polarArea');
  });

  it('should define ChartConfiguration interface', () => {
    const chartConfiguration: ChartConfiguration = {
      data: { datasets: [{ label: 'Data', data: [{ label: 'Point', value: 1 }] }] },
      options: { title: 'Config Chart' },
      type: 'bar',
    };
    expect(chartConfiguration.data).toEqual({
      datasets: [{ label: 'Data', data: [{ label: 'Point', value: 1 }] }],
    });
    expect(chartConfiguration.options).toEqual({ title: 'Config Chart' });
    expect(chartConfiguration.type).toBe('bar');
  });

  it('should define ChartPosition type', () => {
    const positionTop: ChartPosition = 'top';
    const positionBottom: ChartPosition = 'bottom';
    const positionLeft: ChartPosition = 'left';
    const positionRight: ChartPosition = 'right';
    const positionChartArea: ChartPosition = 'chartArea';

    expect(positionTop).toBe('top');
    expect(positionBottom).toBe('bottom');
    expect(positionLeft).toBe('left');
    expect(positionRight).toBe('right');
    expect(positionChartArea).toBe('chartArea');
  });

  it('should define ChartBorderStyle type', () => {
    const borderStyleSolid: ChartBorderStyle = 'solid';
    const borderStyleDashed: ChartBorderStyle = 'dashed';
    const borderStyleDotted: ChartBorderStyle = 'dotted';

    expect(borderStyleSolid).toBe('solid');
    expect(borderStyleDashed).toBe('dashed');
    expect(borderStyleDotted).toBe('dotted');
  });

  it('should define ColorGenerator type', () => {
    const colorGenerator: ColorGenerator = (index: number) => `Color ${index}`;
    expect(colorGenerator(1)).toBe('Color 1');
  });

  it('should define ValueFormatter type', () => {
    const valueFormatter: ValueFormatter = (value: number | string) => `Value: ${value}`;
    expect(valueFormatter(10)).toBe('Value: 10');
  });

  it('should define LabelGenerator type', () => {
    const labelGenerator: LabelGenerator = (index: number) => `Label ${index}`;
    expect(labelGenerator(2)).toBe('Label 2');
  });

  it('should define TooltipGenerator type', () => {
    const tooltipGenerator: TooltipGenerator = (item: ChartDataPoint) => `Tooltip for ${item.label}`;
    const dataPoint: ChartDataPoint = { label: 'Test', value: 1 };
    expect(tooltipGenerator(dataPoint)).toBe('Tooltip for Test');
  });

  it('should define LegendLabelGenerator type', () => {
    const legendLabelGenerator: LegendLabelGenerator = (dataset: ChartDataset) => `Legend for ${dataset.label}`;
    const dataset: ChartDataset = { label: 'Test Dataset', data: [] };
    expect(legendLabelGenerator(dataset)).toBe('Legend for Test Dataset');
  });

  it('should define LegendItemGenerator type', () => {
    const legendItemGenerator: LegendItemGenerator = (dataset: ChartDataset, index: number) => {
      return `<div key=${index}>Legend Item ${dataset.label}</div>` as any;
    };
    const dataset: ChartDataset = { label: 'Test Dataset', data: [] };
    expect(legendItemGenerator(dataset, 0)).toBe('<div key=0>Legend Item Test Dataset</div>');
  });

  it('should define ChartElementGenerator type', () => {
    const chartElementGenerator: ChartElementGenerator = (data: ChartData, options: ChartOptions) => {
      return `<canvas id="testChart"></canvas>` as any;
    };
    const data: ChartData = { datasets: [] };
    const options: ChartOptions = {};
    expect(chartElementGenerator(data, options)).toBe('<canvas id="testChart"></canvas>');
  });

  it('should define ChartUpdater type', () => {
    const chartUpdater: ChartUpdater = (chart: any, data: ChartData, options: ChartOptions) => {
      chart.data = data;
      chart.options = options;
    };
    const chart = { data: null, options: null };
    const data: ChartData = { datasets: [] };
    const options: ChartOptions = {};
    chartUpdater(chart, data, options);
    expect(chart.data).toBe(data);
    expect(chart.options).toBe(options);
  });

  it('should define ChartDestroyer type', () => {
    const chartDestroyer: ChartDestroyer = (chart: any) => {
      chart.destroy();
    };
    const chart = { destroy: jest.fn() };
    chartDestroyer(chart);
    expect(chart.destroy).toHaveBeenCalled();
  });
});
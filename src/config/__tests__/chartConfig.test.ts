/**
 * @file src/config/chartConfig.test.ts
 * @description Jest tests for the global Chart.js configuration module.
 */

import { ChartOptions, TooltipItem, ChartType } from 'chart.js';
import {
  chartColors,
  chartFonts,
  globalChartOptions,
} from './chartConfig';

describe('chartConfig', () => {
  describe('chartColors', () => {
    it('should be defined', () => {
      expect(chartColors).toBeDefined();
    });

    it('should contain all expected color properties', () => {
      const expectedKeys = [
        'primary',
        'primaryTransparent',
        'secondary',
        'secondaryTransparent',
        'tertiary',
        'tertiaryTransparent',
        'warning',
        'warningTransparent',
        'text',
        'grid',
        'tooltipBg',
        'white',
      ];
      expect(Object.keys(chartColors)).toEqual(expect.arrayContaining(expectedKeys));
    });

    it('should have valid rgba or hex color values', () => {
      Object.values(chartColors).forEach(color => {
        expect(color).toMatch(/^rgba?\((\d{1,3},\s*){2,3}\d{1,3}(,\s*\d?\.?\d+)?\)|#([0-9a-fA-F]{3}){1,2}$/);
      });
    });

    it('should match the expected snapshot', () => {
      expect(chartColors).toMatchSnapshot();
    });
  });

  describe('chartFonts', () => {
    it('should be defined', () => {
      expect(chartFonts).toBeDefined();
    });

    it('should contain all expected font properties', () => {
      expect(chartFonts).toHaveProperty('family');
      expect(chartFonts).toHaveProperty('size');
      expect(chartFonts).toHaveProperty('color');
    });

    it('should use the text color from chartColors', () => {
      expect(chartFonts.color).toBe(chartColors.text);
    });

    it('should have a valid font size', () => {
      expect(typeof chartFonts.size).toBe('number');
      expect(chartFonts.size).toBeGreaterThan(0);
    });

    it('should match the expected snapshot', () => {
      expect(chartFonts).toMatchSnapshot();
    });
  });

  describe('globalChartOptions', () => {
    it('should be defined', () => {
      expect(globalChartOptions).toBeDefined();
    });

    it('should have responsive and maintainAspectRatio configured correctly', () => {
      expect(globalChartOptions.responsive).toBe(true);
      expect(globalChartOptions.maintainAspectRatio).toBe(false);
    });

    it('should have interaction mode set to "index"', () => {
      expect(globalChartOptions.interaction?.mode).toBe('index');
      expect(globalChartOptions.interaction?.intersect).toBe(false);
    });

    it('should match the expected snapshot to prevent unintended changes', () => {
      // We need to serialize the functions for the snapshot to be consistent
      const serializableOptions = JSON.parse(JSON.stringify(globalChartOptions, (key, value) => {
        if (typeof value === 'function') {
          return `Function: ${value.toString()}`;
        }
        return value;
      }));
      expect(serializableOptions).toMatchSnapshot();
    });

    describe('Plugins Configuration', () => {
      it('should have legend options configured', () => {
        expect(globalChartOptions.plugins?.legend).toBeDefined();
        expect(globalChartOptions.plugins?.legend?.position).toBe('top');
        expect(globalChartOptions.plugins?.legend?.labels?.color).toBe(chartFonts.color);
      });

      it('should have title disabled by default', () => {
        expect(globalChartOptions.plugins?.title).toBeDefined();
        expect(globalChartOptions.plugins?.title?.display).toBe(false);
        expect(globalChartOptions.plugins?.title?.text).toBe('Default Chart Title');
      });

      it('should have tooltip options configured', () => {
        expect(globalChartOptions.plugins?.tooltip).toBeDefined();
        expect(globalChartOptions.plugins?.tooltip?.enabled).toBe(true);
        expect(globalChartOptions.plugins?.tooltip?.backgroundColor).toBe(chartColors.tooltipBg);
      });
    });

    describe('Scales Configuration', () => {
      it('should have x-axis configured to hide grid lines', () => {
        expect(globalChartOptions.scales?.x).toBeDefined();
        expect(globalChartOptions.scales?.x?.grid?.display).toBe(false);
        expect(globalChartOptions.scales?.x?.ticks?.color).toBe(chartFonts.color);
      });

      it('should have y-axis configured with visible grid lines', () => {
        expect(globalChartOptions.scales?.y).toBeDefined();
        expect(globalChartOptions.scales?.y?.grid?.color).toBe(chartColors.grid);
        expect(globalChartOptions.scales?.y?.ticks?.color).toBe(chartFonts.color);
      });
    });

    describe('Elements Configuration', () => {
      it('should have default styles for bar elements', () => {
        expect(globalChartOptions.elements?.bar).toBeDefined();
        expect(globalChartOptions.elements?.bar?.backgroundColor).toBe(chartColors.primaryTransparent);
        expect(globalChartOptions.elements?.bar?.borderColor).toBe(chartColors.primary);
      });

      it('should have default styles for line elements', () => {
        expect(globalChartOptions.elements?.line).toBeDefined();
        expect(globalChartOptions.elements?.line?.tension).toBe(0.4);
        expect(globalChartOptions.elements?.line?.borderColor).toBe(chartColors.primary);
      });

      it('should have default styles for point elements', () => {
        expect(globalChartOptions.elements?.point).toBeDefined();
        expect(globalChartOptions.elements?.point?.radius).toBe(3);
        expect(globalChartOptions.elements?.point?.backgroundColor).toBe(chartColors.primary);
      });
    });

    describe('Tooltip Label Callback', () => {
      const labelCallback = globalChartOptions.plugins?.tooltip?.callbacks?.label;

      it('should be a function', () => {
        expect(typeof labelCallback).toBe('function');
      });

      it('should format the label correctly with a dataset label and a value', () => {
        const mockContext: TooltipItem<ChartType> = {
          dataset: { label: 'Sales', data: [] },
          parsed: { y: 12345, x: 0 },
          dataIndex: 0,
          datasetIndex: 0,
          formattedValue: '12,345',
          label: 'January',
          raw: 12345,
        };
        // @ts-ignore - The callback is defined, this is a safe cast
        const result = labelCallback(mockContext);
        expect(result).toBe('Sales: 12,345');
      });

      it('should format the label correctly without a dataset label', () => {
        const mockContext: TooltipItem<ChartType> = {
          dataset: { data: [] }, // No label
          parsed: { y: 500, x: 0 },
          dataIndex: 0,
          datasetIndex: 0,
          formattedValue: '500',
          label: 'February',
          raw: 500,
        };
        // @ts-ignore
        const result = labelCallback(mockContext);
        expect(result).toBe('500');
      });

      it('should handle a null y-value gracefully', () => {
        const mockContext: TooltipItem<ChartType> = {
          dataset: { label: 'Revenue', data: [] },
          parsed: { y: null, x: 0 },
          dataIndex: 0,
          datasetIndex: 0,
          formattedValue: '',
          label: 'March',
          raw: null,
        };
        // @ts-ignore
        const result = labelCallback(mockContext);
        expect(result).toBe('Revenue: ');
      });

      it('should handle a y-value of 0', () => {
        const mockContext: TooltipItem<ChartType> = {
          dataset: { label: 'Profit', data: [] },
          parsed: { y: 0, x: 0 },
          dataIndex: 0,
          datasetIndex: 0,
          formattedValue: '0',
          label: 'April',
          raw: 0,
        };
        // @ts-ignore
        const result = labelCallback(mockContext);
        expect(result).toBe('Profit: 0');
      });
    });

    describe('Y-Axis Ticks Callback', () => {
      // @ts-ignore - Accessing a potentially undefined callback for testing
      const ticksCallback = globalChartOptions.scales?.y?.ticks?.callback;

      it('should be a function', () => {
        expect(typeof ticksCallback).toBe('function');
      });

      it('should return the original value for numbers less than 1000', () => {
        // @ts-ignore
        expect(ticksCallback(999, 0, [])).toBe(999);
        // @ts-ignore
        expect(ticksCallback(0, 0, [])).toBe(0);
        // @ts-ignore
        expect(ticksCallback(-500, 0, [])).toBe(-500);
      });

      it('should format numbers equal to 1000 as "1k"', () => {
        // @ts-ignore
        expect(ticksCallback(1000, 0, [])).toBe('1k');
      });

      it('should format numbers greater than 1000 with a "k" suffix', () => {
        // @ts-ignore
        expect(ticksCallback(5000, 0, [])).toBe('5k');
        // @ts-ignore
        expect(ticksCallback(1500000, 0, [])).toBe('1500k');
      });

      it('should return the original value if it is not a number', () => {
        // @ts-ignore
        expect(ticksCallback('test', 0, [])).toBe('test');
        // @ts-ignore
        expect(ticksCallback(null, 0, [])).toBe(null);
        // @ts-ignore
        expect(ticksCallback(undefined, 0, [])).toBe(undefined);
      });
    });
  });
});
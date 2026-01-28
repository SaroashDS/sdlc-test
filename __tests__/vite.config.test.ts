import { UserConfig } from 'vite';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteConfigFunction from './vite.config';

// Mock external dependencies
jest.mock('vite', () => ({
  // defineConfig is an identity function, so we mock it to return its input
  // This allows us to test the function passed to it.
  defineConfig: (config: UserConfig | (() => UserConfig)) => config,
  // We mock loadEnv to control the environment variables for our tests
  loadEnv: jest.fn(),
}));

jest.mock('@vitejs/plugin-react', () => ({
  // Mock the default export of the react plugin
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('path', () => ({
  // Mock path.resolve to return a consistent, predictable value
  ...jest.requireActual('path'), // Keep other path functions if needed
  resolve: jest.fn(),
}));

// Type-cast the mocked functions for better TypeScript support in tests
const mockedLoadEnv = loadEnv as jest.Mock;
const mockedReact = react as jest.Mock;
const mockedPathResolve = path.resolve as jest.Mock;

describe('Vite Configuration', () => {
  // Helper to invoke the configuration function with specific command and mode
  const getConfig = (command: 'serve' | 'build', mode: string): UserConfig => {
    if (typeof viteConfigFunction !== 'function') {
      throw new Error('vite.config.ts must export a function.');
    }
    return viteConfigFunction({ command, mode });
  };

  beforeEach(() => {
    // Reset all mocks before each test to ensure test isolation
    jest.clearAllMocks();

    // Provide default mock implementations for dependencies
    mockedLoadEnv.mockReturnValue({
      APP_NAME: 'Test App From Env',
    });
    mockedReact.mockReturnValue({ name: 'mocked-react-plugin' });
    mockedPathResolve.mockReturnValue('/mocked/project/src');
  });

  it('should call loadEnv with the correct mode and an empty prefix', () => {
    getConfig('serve', 'development');
    expect(mockedLoadEnv).toHaveBeenCalledWith('development', process.cwd(), '');

    getConfig('build', 'production');
    expect(mockedLoadEnv).toHaveBeenCalledWith('production', process.cwd(), '');
  });

  it('should include the react plugin', () => {
    const config = getConfig('serve', 'development');
    expect(mockedReact).toHaveBeenCalledTimes(1);
    expect(config.plugins).toEqual(expect.arrayContaining([
      { name: 'mocked-react-plugin' },
    ]));
  });

  describe('define option', () => {
    it('should define process.env.APP_NAME from loaded environment variables', () => {
      const config = getConfig('serve', 'development');
      expect(config.define).toBeDefined();
      expect(config.define['process.env.APP_NAME']).toBe(JSON.stringify('Test App From Env'));
    });

    it('should use a default APP_NAME if not present in environment variables', () => {
      // Override the default mock for this specific test case
      mockedLoadEnv.mockReturnValue({});
      const config = getConfig('serve', 'development');
      expect(config.define).toBeDefined();
      expect(config.define['process.env.APP_NAME']).toBe(JSON.stringify('My Awesome App'));
    });
  });

  describe('resolve option', () => {
    it('should configure the resolve alias for "@" to the src directory', () => {
      const config = getConfig('serve', 'development');
      expect(mockedPathResolve).toHaveBeenCalledWith(expect.any(String), './src');
      expect(config.resolve.alias).toEqual({
        '@': '/mocked/project/src',
      });
    });
  });

  describe('server option', () => {
    it('should configure the development server correctly', () => {
      const config = getConfig('serve', 'development');
      expect(config.server).toEqual({
        port: 3000,
        open: true,
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
          },
        },
      });
    });
  });

  describe('build option', () => {
    let buildConfig;

    beforeEach(() => {
      const config = getConfig('build', 'production');
      buildConfig = config.build;
    });

    it('should set the output directory to "dist"', () => {
      expect(buildConfig.outDir).toBe('dist');
    });

    it('should enable source maps', () => {
      expect(buildConfig.sourcemap).toBe(true);
    });

    it('should set the chunk size warning limit', () => {
      expect(buildConfig.chunkSizeWarningLimit).toBe(1000);
    });

    describe('rollupOptions.output', () => {
      it('should configure asset, chunk, and entry file names', () => {
        const outputOptions = buildConfig.rollupOptions.output;
        expect(outputOptions.assetFileNames).toBe('assets/[name]-[hash][extname]');
        expect(outputOptions.chunkFileNames).toBe('assets/[name]-[hash].js');
        expect(outputOptions.entryFileNames).toBe('assets/[name]-[hash].js');
      });

      describe('manualChunks function', () => {
        let manualChunksFn;

        beforeEach(() => {
          manualChunksFn = buildConfig.rollupOptions.output.manualChunks;
        });

        it('should return "vendor" for modules inside node_modules', () => {
          const id = '/path/to/project/node_modules/react/index.js';
          expect(manualChunksFn(id)).toBe('vendor');
        });

        it('should return undefined for local application source files', () => {
          const id = '/path/to/project/src/components/MyComponent.tsx';
          expect(manualChunksFn(id)).toBeUndefined();
        });

        it('should return undefined for files outside node_modules', () => {
          const id = '/path/to/some/other/library/index.js';
          expect(manualChunksFn(id)).toBeUndefined();
        });
      });
    });
  });

  describe('preview option', () => {
    it('should configure the preview server correctly', () => {
      const config = getConfig('serve', 'development'); // Preview config is part of base config
      expect(config.preview).toEqual({
        port: 4173,
        open: true,
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
        },
      });
    });
  });

  describe('command-specific configuration', () => {
    it('should return the base configuration when command is "serve"', () => {
      const serveConfig = getConfig('serve', 'development');
      // In the current implementation, there are no overrides, so we just check for presence of key sections
      expect(serveConfig.server).toBeDefined();
      expect(serveConfig.build).toBeDefined();
      expect(serveConfig.preview).toBeDefined();
    });

    it('should return the base configuration when command is "build"', () => {
      const buildConfig = getConfig('build', 'production');
      // The provided source code does not apply any build-specific overrides, so it should match the base config
      expect(buildConfig.build.sourcemap).toBe(true); // Verifies no override is applied
      expect(buildConfig.server).toBeDefined();
    });
  });
});
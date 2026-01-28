import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import {
  AppProps,
  RootElement,
  ReactComponent,
  ServerRenderResult,
  HydrationOptions,
  HydrateAppResult,
  HydrationError,
  HydrateAppFunction,
  ServerRenderFunction,
  AppEntry,
} from './main';

describe('Type Definitions', () => {
  it('should define AppProps interface', () => {
    const props: AppProps = {
      initialData: { key: 'value' },
    };
    expect(typeof props).toBe('object');
  });

  it('should define RootElement type', () => {
    const element: RootElement = document.createElement('div');
    expect(element).toBeInstanceOf(HTMLElement);
  });

  it('should define ReactComponent type', () => {
    const component: ReactComponent = render(React.createElement('div'));
    expect(typeof component).toBe('object');
  });

  it('should define ServerRenderResult interface', () => {
    const result: ServerRenderResult = {
      html: '<p>Hello</p>',
      state: { key: 'value' },
    };
    expect(typeof result).toBe('object');
    expect(result.html).toBeDefined();
    expect(result.state).toBeDefined();
  });

  it('should define HydrationOptions interface', () => {
    const options: HydrationOptions = {
      strictMode: true,
    };
    expect(typeof options).toBe('object');
    expect(options.strictMode).toBeDefined();
  });

  it('should define HydrateAppResult type', () => {
    const result: HydrateAppResult = undefined;
    expect(result).toBeUndefined();
  });

  it('should define HydrationError type', () => {
    const error: HydrationError = new Error('Hydration failed');
    expect(error).toBeInstanceOf(Error);
  });

  it('should define HydrateAppFunction type', () => {
    const hydrateApp: HydrateAppFunction = (
      element: ReactComponent,
      container: RootElement,
      options?: HydrationOptions
    ): HydrateAppResult => {
      return undefined;
    };
    expect(typeof hydrateApp).toBe('function');
  });

  it('should define ServerRenderFunction type', () => {
    const serverRender: ServerRenderFunction = async (
      props?: AppProps
    ): Promise<ServerRenderResult> => {
      return { html: '', state: {} };
    };
    expect(typeof serverRender).toBe('function');
  });

  it('should define AppEntry type', () => {
    const App = (props: AppProps) => React.createElement('div');
    const hydrateApp: HydrateAppFunction = (
      element: ReactComponent,
      container: RootElement,
      options?: HydrationOptions
    ): HydrateAppResult => {
      return undefined;
    };
    const serverRender: ServerRenderFunction = async (
      props?: AppProps
    ): Promise<ServerRenderResult> => {
      return { html: '', state: {} };
    };
    const appEntry: AppEntry = {
      App,
      hydrateApp,
      serverRender,
    };
    expect(typeof appEntry).toBe('object');
    expect(typeof appEntry.App).toBe('function');
    expect(typeof appEntry.hydrateApp).toBe('function');
    expect(typeof appEntry.serverRender).toBe('function');
  });
});
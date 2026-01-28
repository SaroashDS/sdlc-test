/**
 * @file src/types/declarations.d.ts
 * @description Global TypeScript type declarations for the project.
 * This file is used to provide type definitions for modules that TypeScript
 * doesn't understand by default, such as CSS Modules and static assets.
 * It can also be used for augmenting existing global types.
 *
 * NOTE: This file should not contain any `import` or `export` statements
 * at the top level, as that would turn it into a module and break its
 * global scope.
 */

// --- CSS Modules ---

/**
 * Provides type definitions for CSS Modules (`.module.css`).
 * When a CSS Module is imported, TypeScript will recognize it as an object
 * where keys are class names and values are the generated, unique strings.
 *
 * @example
 * import styles from './MyComponent.module.css';
 * const containerClass = styles.container; // `containerClass` is a string
 */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/**
 * Provides type definitions for SCSS Modules (`.module.scss`).
 * Works identically to `.module.css` declarations.
 */
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/**
 * Provides type definitions for SASS Modules (`.module.sass`).
 * Works identically to `.module.css` declarations.
 */
declare module '*.module.sass' {
  const classes: { readonly [key:string]: string };
  export default classes;
}


// --- Static Assets ---

/**
 * Provides type definitions for SVG files.
 * This allows importing SVGs both as a URL and as a React component,
 * a common pattern with tools like SVGR.
 *
 * @example
 * // Import as a URL/path
 * import logoUrl from './logo.svg';
 * <img src={logoUrl} alt="Logo" />
 *
 * // Import as a React component
 * import { ReactComponent as LogoComponent } from './logo.svg';
 * <LogoComponent />
 */
declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

  const src: string;
  export default src;
}

/**
 * Provides type definitions for common image formats.
 * When an image is imported, TypeScript will recognize it as a module
 * whose default export is a string (the image's URL or path).
 */
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}


// --- Global Namespace Augmentation ---

/**
 * Augments the global `Window` interface.
 * This allows adding custom properties to the `window` object in a type-safe way.
 *
 * @example
 * window.__MY_APP_CONFIG__ = { apiEndpoint: '/api' };
 */
interface Window {
  // Example: Add a custom property for a global configuration object
  // __MY_APP_CONFIG__: {
  //   readonly apiEndpoint: string;
  //   readonly featureFlags: Record<string, boolean>;
  // };
}

/**
 * Augments the `NodeJS.ProcessEnv` interface.
 * This provides type safety and autocompletion for environment variables
 * accessed via `process.env`. This is especially useful in frameworks
 * like Next.js, Vite, or Create React App.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The runtime environment.
     */
    readonly NODE_ENV: 'development' | 'production' | 'test';

    /**
     * Example of a custom environment variable for a public API URL.
     * In Vite, these must be prefixed with `VITE_`.
     */
    readonly VITE_API_BASE_URL: string;

    // Add other environment variables your project uses here.
    // readonly VITE_ANOTHER_VAR: string;
  }
}
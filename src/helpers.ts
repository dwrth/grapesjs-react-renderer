/**
 * Helper utilities for creating GrapesJS React component configurations
 */

import React from 'react';
import { type TraitDefinition, type ProviderComponent, type ProviderConfig, type ProviderProps } from './index';

/**
 * Helper to safely parse JSON traits
 */
export function parseJsonTrait<T = unknown>(value: string | unknown): T | unknown {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch (e) {
      console.warn('Failed to parse JSON trait:', value);
      return value;
    }
  }
  return value;
}

/**
 * Helper to create a prop mapper that wraps all traits into a single prop
 * Useful for components that expect { uiComponent: {...} } or { config: {...} }
 */
export function createWrapperMapper<T extends Record<string, unknown>>(
  wrapperKey: string,
  defaults: Partial<T> = {}
) {
  return (attrs: Record<string, unknown>): Record<string, T> => {
    const wrapped: Record<string, unknown> = {};
    Object.keys(defaults).forEach((key) => {
      const value = defaults[key as keyof T];
      if (value !== undefined) {
        wrapped[key] = value;
      }
    });
    Object.keys(attrs).forEach((key) => {
      const value = attrs[key];
      if (value !== undefined && value !== null) {
        wrapped[key] = value;
      }
    });
    const result: Record<string, T> = {};
    // Construct T from wrapped object properties
    const typedWrapped = Object.assign({}, defaults, wrapped) as T;
    result[wrapperKey] = typedWrapped;
    return result;
  };
}

/**
 * Helper to merge default props with attributes
 */
export function mergeDefaults<T extends Record<string, unknown>>(
  defaults: Partial<T>,
  attrs: Partial<T>
): Partial<T> {
  const result: Partial<T> = { ...defaults };
  Object.keys(attrs).forEach((key) => {
    const value = attrs[key as keyof T];
    if (value !== undefined && value !== '') {
      result[key as keyof T] = value;
    }
  });
  return result;
}

/**
 * Common trait definitions that can be reused
 * These are generic traits that work for most components
 */
export const commonTraits = {
  title: { type: 'text' as const, name: 'title', label: 'Title' },
  subtitle: { type: 'text' as const, name: 'subtitle', label: 'Subtitle' },
  description: { type: 'textarea' as const, name: 'description', label: 'Description' },
  textColor: { type: 'color' as const, name: 'textColor', label: 'Text Color', defaultValue: '#000000' },
  backgroundColor: { type: 'color' as const, name: 'backgroundColor', label: 'Background Color', defaultValue: '#ffffff' },
  visible: { type: 'checkbox' as const, name: 'visible', label: 'Visible', defaultValue: true },
  disabled: { type: 'checkbox' as const, name: 'disabled', label: 'Disabled', defaultValue: false },
};

/**
 * Provider helper functions
 */

/**
 * Helper to create a provider config from a component and props
 */
export function createProvider<P extends ProviderProps = ProviderProps>(
  component: ProviderComponent<P>,
  props?: Omit<P, 'children'>
): ProviderConfig<P> {
  return { component, props };
}

/**
 * Helper for Redux Provider
 * 
 * @example
 * ```tsx
 * import { Provider } from 'react-redux';
 * import { createReduxProvider } from 'grapesjs-react-renderer/helpers';
 * 
 * const reduxProvider = createReduxProvider(store);
 * const plugin = createReactComponentsPlugin({
 *   components: { MyComponent },
 *   Provider: reduxProvider.component,
 *   providerProps: reduxProvider.props,
 * });
 * ```
 */
export function createReduxProvider<S = unknown>(
  store: S
): ProviderConfig<{ children: React.ReactNode; store: S }> {
  // Dynamically import react-redux to avoid requiring it as a dependency
  // This function requires react-redux to be available at runtime
  // Use a type-safe wrapper that checks for react-redux availability
  const getReactRedux = (): { Provider: ProviderComponent<{ children: React.ReactNode; store: S }> } => {
    // Use Function constructor to avoid require type issues
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const requireFunc = new Function('moduleName', 'return require(moduleName)');
    try {
      return requireFunc('react-redux');
    } catch {
      throw new Error(
        'react-redux is not installed. Install it to use createReduxProvider: npm install react-redux'
      );
    }
  };
  
  const reactRedux = getReactRedux();
  const Provider = reactRedux.Provider;
  if (!Provider) {
    throw new Error('react-redux Provider not found');
  }
  return { component: Provider, props: { store } };
}

/**
 * Helper for multiple nested providers
 * Creates a provider stack that nests providers from outer to inner
 * 
 * @example
 * ```tsx
 * import { createProviderStack } from 'grapesjs-react-renderer/helpers';
 * 
 * const providers = createProviderStack([
 *   [ReduxProvider, { store }],
 *   [ThemeProvider, { theme }],
 *   [ContextProvider, { value }],
 * ]);
 * 
 * const plugin = createReactComponentsPlugin({
 *   components: { MyComponent },
 *   providers,
 * });
 * ```
 */
export function createProviderStack<P extends ProviderProps = ProviderProps>(
  providers: Array<[ProviderComponent<P>, Omit<P, 'children'>?]>
): ProviderConfig<P>[] {
  return providers.map(([component, props]) => createProvider(component, props));
}

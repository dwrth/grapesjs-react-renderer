/**
 * Factory functions for creating common component configuration patterns
 */

import React from 'react';
import { type ComponentConfig, type TraitDefinition } from './index';
import { createWrapperMapper, parseJsonTrait, commonTraits } from './helpers';

/**
 * Creates a component config for components that follow a wrapper pattern
 * (components that expect { [wrapperKey]: {...} } like { uiComponent: {...} } or { config: {...} })
 * 
 * @param component - React component that expects props wrapped in a single key
 * @param wrapperKey - Key name for wrapping props (e.g., 'uiComponent', 'config', 'props')
 * @param traits - Trait definitions for the component
 * @param wrapperDefaults - Default values for the wrapped object (merged with trait values)
 * @param defaultProps - Default props for the component itself (outside the wrapper)
 * 
 * @example
 * ```tsx
 * // Component expects { uiComponent: { title: string, description: string } }
 * const config = createWrapperComponentConfig(
 *   MyComponent,
 *   'uiComponent',
 *   [
 *     { type: 'text', name: 'title', label: 'Title' },
 *     { type: 'textarea', name: 'description', label: 'Description' },
 *   ],
 *   { componentType: 'custom' } // Defaults for uiComponent
 * );
 * ```
 */
export function createWrapperComponentConfig<P extends Record<string, unknown> = Record<string, unknown>>(
  component: React.ComponentType<Record<string, P>>,
  wrapperKey: string,
  traits: TraitDefinition[] = [],
  wrapperDefaults: Partial<P> = {},
  defaultProps: Partial<Record<string, P>> = {}
): ComponentConfig<Record<string, P>> {
  const mapPropsFn = createWrapperMapper<P>(wrapperKey, wrapperDefaults);
  return {
    component,
    traits,
    defaultProps,
    mapProps: (attrs: import('./index').ComponentAttributes): Record<string, P> => {
      const result = mapPropsFn(attrs);
      const wrapperValue = result[wrapperKey];
      if (wrapperValue) {
        const record: Record<string, P> = {};
        record[wrapperKey] = wrapperValue;
        return record;
      }
      return result;
    },
  };
}

/**
 * Creates a component config for components that follow the UiComponent pattern
 * (components that expect { uiComponent: {...} })
 * 
 * @deprecated Use createWrapperComponentConfig instead for more flexibility
 * This is kept for backward compatibility
 */
export function createUiComponentConfig<P extends Record<string, unknown> = Record<string, unknown>>(
  component: React.ComponentType<{ uiComponent: P }>,
  customTraits: TraitDefinition[] = [],
  uiComponentDefaults: Partial<P> = {}
): ComponentConfig<{ uiComponent: P }> {
  const baseTraits: TraitDefinition[] = [
    commonTraits.title,
    commonTraits.description,
    ...customTraits,
  ];

  const mapPropsFn = createWrapperMapper<P>('uiComponent', uiComponentDefaults);
  return {
    component,
    traits: baseTraits,
    mapProps: (attrs: import('./index').ComponentAttributes): { uiComponent: P } => {
      const result = mapPropsFn(attrs);
      const uiComponent = result['uiComponent'];
      if (uiComponent) {
        return { uiComponent };
      }
      const empty: Partial<P> = {};
      return { uiComponent: empty as P };
    },
  };
}

/**
 * Creates a simple component config (no wrapper, direct props)
 */
export function createSimpleComponentConfig<P extends Record<string, unknown> = Record<string, unknown>>(
  component: React.ComponentType<P>,
  traits: TraitDefinition[],
  defaultProps: Partial<P> = {}
): ComponentConfig<P> {
  return {
    component,
    traits,
    defaultProps,
  };
}

/**
 * Creates a component config with JSON data handling
 */
export function createJsonComponentConfig<P extends Record<string, unknown> = Record<string, unknown>>(
  component: React.ComponentType<P>,
  traits: TraitDefinition[],
  jsonFields: readonly string[],
  defaultProps: Partial<P> = {},
  mapProps?: (attrs: Record<string, unknown>) => P
): ComponentConfig<P> {
  return {
    component,
    traits,
    defaultProps,
    mapProps: (attrs: import('./index').ComponentAttributes): P => {
      // Parse JSON fields
      const parsed: Record<string, unknown> = {};
      Object.keys(attrs).forEach((key) => {
        const value = attrs[key];
        if (jsonFields.includes(key) && typeof value === 'string') {
          parsed[key] = parseJsonTrait(value);
        } else if (value !== undefined && value !== null) {
          parsed[key] = value;
        }
      });

      // Apply custom mapper if provided
      if (mapProps) {
        return mapProps(parsed);
      }
      const result: Partial<P> = {};
      Object.keys(parsed).forEach((key) => {
        const value = parsed[key];
        if (value !== undefined) {
          (result as Record<string, unknown>)[key] = value;
        }
      });
      return result as P;
    },
  };
}

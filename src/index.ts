import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Editor } from 'grapesjs';

// Extended view interface for React components
interface ReactComponentView {
  el: HTMLElement;
  model: {
    getAttributes(): Record<string, unknown>;
  };
  listenTo: (target: unknown, event: string, callback: () => void) => void;
  render: () => unknown;
  _root?: Root;
}

// Type guard to check if an object has the required view properties
function hasViewProperties(obj: unknown): obj is {
  el: HTMLElement;
  model: { getAttributes(): Record<string, unknown> };
  listenTo: (target: unknown, event: string, callback: () => void) => void;
  _root?: Root;
} {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const hasEl = 'el' in obj;
  const hasModel = 'model' in obj;
  const hasListenTo = 'listenTo' in obj;
  
  if (!hasEl || !hasModel || !hasListenTo) {
    return false;
  }
  
  const el = (obj as { el?: unknown }).el;
  const model = (obj as { model?: unknown }).model;
  const listenTo = (obj as { listenTo?: unknown }).listenTo;
  
  if (typeof el !== 'object' || el === null) {
    return false;
  }
  if (typeof model !== 'object' || model === null) {
    return false;
  }
  if (typeof listenTo !== 'function') {
    return false;
  }
  
  const hasGetAttributes = 'getAttributes' in model;
  if (!hasGetAttributes) {
    return false;
  }
  const getAttributes = (model as { getAttributes?: unknown }).getAttributes;
  if (typeof getAttributes !== 'function') {
    return false;
  }
  
  return true;
}

// Type for component props - can be extended by users
export type ComponentProps = Record<string, unknown>;

// Generic type for React component with props
export type ReactComponent<P extends ComponentProps = ComponentProps> = React.ComponentType<P>;

// Map of component names to React components
export type ReactComponentMap = Record<string, ReactComponent>;

export type TraitDefinition =
  | { type: 'text'; name: string; label: string; defaultValue?: string }
  | { type: 'number'; name: string; label: string; defaultValue?: number; min?: number; max?: number; step?: number }
  | { type: 'select'; name: string; label: string; options: Array<{ id: string; name: string }>; defaultValue?: string }
  | { type: 'checkbox'; name: string; label: string; defaultValue?: boolean }
  | { type: 'color'; name: string; label: string; defaultValue?: string }
  | { type: 'textarea'; name: string; label: string; defaultValue?: string }
  | { type: 'json'; name: string; label: string; defaultValue?: string };

// Type for component attributes from GrapesJS
export type ComponentAttributes = Record<string, string | number | boolean | undefined | null>;


export interface ComponentConfig<P extends ComponentProps = ComponentProps> {
  component: ReactComponent<P>;
  traits?: TraitDefinition[];
  defaultProps?: Partial<P>;
  /**
   * Custom prop mapper function to transform GrapesJS attributes into component props
   * Useful for wrapping props (e.g., { uiComponent: {...} }) or complex transformations
   * 
   * @param attrs - Attributes from GrapesJS component model
   * @returns Props object that matches the component's expected props type
   */
  mapProps?: (attrs: ComponentAttributes) => P;
}

// Type for provider props - must include children
export type ProviderProps = {
  children: React.ReactNode;
} & Record<string, unknown>;

export type ProviderComponent<P extends ProviderProps = ProviderProps> = React.ComponentType<P>;

export interface ProviderConfig<P extends ProviderProps = ProviderProps> {
  component: ProviderComponent<P>;
  props?: Omit<P, 'children'>;
}

export interface ReactComponentsPluginOptions {
  components: ReactComponentMap | Record<string, ComponentConfig>;
  defaultComponent?: string;
  
  /**
   * Single provider component with props
   * Use this for a single provider like Redux Provider
   */
  Provider?: ProviderComponent;
  providerProps?: Record<string, unknown>;

  /**
   * Multiple providers in order (nested from outer to inner)
   * Useful for complex provider trees like: Redux > Theme > Context > etc.
   * Providers are nested from first (outermost) to last (innermost)
   */
  providers?: ProviderConfig[];

  /**
   * Custom wrapper function for maximum flexibility
   * Receives the component element and component name, should return wrapped element
   */
  wrapComponent?: (element: React.ReactElement, componentName: string) => React.ReactElement;
}

/**
 * Creates a provider wrapper function based on the options
 */
function createProviderWrapper(options: ReactComponentsPluginOptions) {
  const { Provider, providerProps, providers, wrapComponent } = options;

  // If custom wrapper provided, use it
  if (wrapComponent) {
    return (element: React.ReactElement, componentName: string) => wrapComponent(element, componentName);
  }

  // If multiple providers provided, nest them (outer to inner)
  if (providers && providers.length > 0) {
    return (element: React.ReactElement) => {
      return providers.reduceRight((acc, providerConfig) => {
        const props = providerConfig.props ? { ...providerConfig.props, children: acc } : { children: acc };
        return React.createElement(providerConfig.component, props);
      }, element);
    };
  }

  // If single provider provided, wrap with it
  if (Provider) {
    return (element: React.ReactElement) => {
      const props = providerProps ? { ...providerProps, children: element } : { children: element };
      return React.createElement(Provider, props);
    };
  }

  // No providers, return as-is
  return (element: React.ReactElement) => element;
}

const createReactComponentsPlugin = (options: ReactComponentsPluginOptions) => {
  const { components, defaultComponent } = options;
  const fallbackName = defaultComponent || Object.keys(components)[0];
  
  // Create provider wrapper function
  const wrapWithProviders = createProviderWrapper(options);

  // Normalize components: convert simple map to ComponentConfig format
  const normalizedComponents: Record<string, ComponentConfig> = {};
  Object.keys(components).forEach((name) => {
    const comp = components[name];
    if (typeof comp === 'function' || React.isValidElement(comp)) {
      // Simple component - use default traits
      const component: ReactComponent = typeof comp === 'function' ? comp : () => comp;
      normalizedComponents[name] = {
        component,
        traits: [
          { type: 'text', name: 'title', label: 'Title' },
          { type: 'text', name: 'subtitle', label: 'Subtitle' },
          { type: 'text', name: 'description', label: 'Description' },
        ],
      };
    } else {
      // Already a ComponentConfig
      normalizedComponents[name] = comp;
    }
  });

  return (editor: Editor) => {
    const domc = editor.DomComponents;
    const bm = editor.BlockManager;

    // Build dynamic traits list: component selector + all component-specific traits
    const baseTraits: TraitDefinition[] = [
      {
        type: 'select',
        name: 'component',
        label: 'Component',
        options: Object.keys(normalizedComponents).map((name) => ({
          id: name,
          name,
        })),
      },
    ];

    // Add all traits from all components (GrapesJS will show relevant ones)
    Object.values(normalizedComponents).forEach((config) => {
      config.traits?.forEach((trait) => {
        if (!baseTraits.find((t) => t.name === trait.name)) {
          baseTraits.push(trait);
        }
      });
    });

    // Store traits map for JSON parsing
    const traitsMap = new Map<string, TraitDefinition>();
    baseTraits.forEach((trait) => {
      if (trait.name) {
        traitsMap.set(trait.name, trait);
      }
    });

    domc.addType('react-comp', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: false,
          attributes: {
            'data-gjs-type': 'react-comp',
            component: fallbackName,
          },
          traits: baseTraits,
        },
      },
      view: {
        init() {
          if (!hasViewProperties(this)) {
            return;
          }
          this.listenTo(this.model, 'change:attributes', this.render);
        },
        render() {
          if (!hasViewProperties(this)) {
            return this;
          }
          const view = this;
          const el = view.el;
          const attrsRaw = view.model.getAttributes();
          
          // Convert to ComponentAttributes format
          const attrs: ComponentAttributes = {};
          Object.keys(attrsRaw).forEach((key) => {
            const value = attrsRaw[key];
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === undefined || value === null) {
              attrs[key] = value;
            }
          });
          
          const componentName = (typeof attrs.component === 'string' ? attrs.component : undefined) || fallbackName;
          const config = normalizedComponents[componentName];

          if (!config) {
            return view;
          }

          const Comp = config.component;

          // Build props from attributes, excluding internal GrapesJS attributes
          const rawProps: Record<string, unknown> = {};
          
          // Add default props
          if (config.defaultProps) {
            Object.keys(config.defaultProps).forEach((key) => {
              const value = config.defaultProps?.[key];
              if (value !== undefined) {
                rawProps[key] = value;
              }
            });
          }

          // Pass all attributes as props (except internal ones)
          Object.keys(attrs).forEach((key) => {
            const value = attrs[key];
            if (
              key !== 'component' &&
              key !== 'data-gjs-type' &&
              value !== undefined &&
              value !== null &&
              value !== ''
            ) {
              // Check if this is a JSON trait and parse it
              const trait = traitsMap.get(key);
              if (trait && trait.type === 'json' && typeof value === 'string') {
                try {
                  rawProps[key] = JSON.parse(value);
                } catch (e) {
                  console.warn(`Failed to parse JSON trait ${key}:`, value);
                  rawProps[key] = value;
                }
              } else {
                rawProps[key] = value;
              }
            }
          });

          // Apply custom prop mapper if provided, otherwise use raw props
          const finalProps: ComponentProps = config.mapProps 
            ? config.mapProps(attrs) 
            : rawProps;

          // Create the component element
          const element = React.createElement(Comp, finalProps);

          // Wrap with providers if configured
          const wrappedElement = wrapWithProviders(element, componentName);

          if (!view._root) {
            view._root = createRoot(view.el);
          }
          view._root.render(wrappedElement);
          return this;
        },
        removed() {
          if (!hasViewProperties(this)) {
            return;
          }
          const view = this;
          if (view._root) {
            view._root.unmount();
            view._root = undefined;
          }
        },
      },
    });

    // React-based blocks for each component
    Object.keys(normalizedComponents).forEach((name) => {
      const config = normalizedComponents[name];
      const defaultAttrs: string[] = [`component="${name}"`];

      // Add default props as attributes if provided
      if (config.defaultProps) {
        Object.entries(config.defaultProps).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const stringValue = typeof value === 'string' ? value : String(value);
            defaultAttrs.push(`${key}="${stringValue}"`);
          }
        });
      }

      // Or use trait defaults
      config.traits?.forEach((trait) => {
        if ('defaultValue' in trait && trait.defaultValue !== undefined) {
          const exists = defaultAttrs.some((attr) => attr.startsWith(`${trait.name}=`));
          if (!exists) {
            const defaultValue = trait.defaultValue;
            const stringValue = typeof defaultValue === 'string' ? defaultValue : String(defaultValue);
            defaultAttrs.push(`${trait.name}="${stringValue}"`);
          }
        }
      });

      bm.add(`react-${name.toLowerCase()}`, {
        label: `${name} (React)`,
        category: 'React',
        content: `
          <div data-gjs-type="react-comp" ${defaultAttrs.join(' ')}>
          </div>
        `,
      });
    });

    // Set initial React-based content after editor is ready
    editor.onReady(() => {
      editor.setComponents(`
        <div data-gjs-type="react-comp"
             component="${fallbackName}"
             title="Build visually with React components"
             subtitle="Rendered by your React component">
        </div>
      `);
    });
  };
};

export default createReactComponentsPlugin;

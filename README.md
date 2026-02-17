# grapesjs-react-renderer

A powerful GrapesJS plugin that enables you to use React components directly in the GrapesJS canvas with full prop support, trait management, complex data handling, and provider support.

## Features

- 🎨 **React Components in Canvas**: Render real React components inside GrapesJS
- 🔧 **Full Prop Support**: Map GrapesJS traits to React component props with type safety
- 📦 **Complex Data**: Handle JSON, arrays, and nested objects
- 🏭 **Factory Functions**: Pre-built configs for common patterns
- 🎯 **Type Safe**: Full TypeScript support with generics - no `any` types
- 🔄 **Prop Mapping**: Transform props with custom mappers
- 📝 **Multiple Trait Types**: Text, number, select, checkbox, color, textarea, JSON
- 🎭 **Provider Support**: Wrap components with Redux, Context API, or any provider tree
- 🔒 **Type Safety**: Generic types for components, props, and providers

## Installation

### From npm

```bash
npm install grapesjs-react-renderer
# or
yarn add grapesjs-react-renderer
# or
pnpm add grapesjs-react-renderer
```

### From GitHub

```bash
npm install github:your-username/grapesjs-react-renderer
# or
yarn add github:your-username/grapesjs-react-renderer
# or
pnpm add github:your-username/grapesjs-react-renderer
```

The package will automatically build on installation thanks to the `prepare` script.

## Quick Start

```tsx
import grapesjs from 'grapesjs';
import createReactComponentsPlugin from 'grapesjs-react-renderer';
import MyComponent from './components/MyComponent';

const editor = grapesjs.init({
  container: '#gjs',
  plugins: [
    createReactComponentsPlugin({
      components: {
        MyComponent,
      },
    }),
  ],
});
```

## Usage Patterns

### Simple Components (Direct Props)

```tsx
import { createSimpleComponentConfig } from 'grapesjs-react-renderer/factories';
import Button from './components/Button';

interface ButtonProps {
  label: string;
  href: string;
}

const buttonConfig = createSimpleComponentConfig<ButtonProps>(
  Button,
  [
    { type: 'text', name: 'label', label: 'Button Label' },
    { type: 'text', name: 'href', label: 'Link URL' },
  ],
  { label: 'Click me', href: '#' }
);

const plugin = createReactComponentsPlugin({
  components: {
    Button: buttonConfig,
  },
});
```

### Wrapper Component Pattern (Generic)

For components that expect props wrapped in a single key (e.g., `{ uiComponent: {...} }`, `{ config: {...} }`):

```tsx
import { createWrapperComponentConfig } from 'grapesjs-react-renderer/factories';
import AgendaComponent from './components/Agenda';

interface UiComponentData {
  groupBy: 'none' | 'day' | 'hour';
  entryList: Array<{ title: string; timestamp: string }>;
}

const agendaConfig = createWrapperComponentConfig<UiComponentData>(
  AgendaComponent,
  'uiComponent', // Wrapper key name
  [
    { 
      type: 'select', 
      name: 'groupBy', 
      label: 'Group By', 
      options: [
        { id: 'none', name: 'None' },
        { id: 'day', name: 'Day' },
        { id: 'hour', name: 'Hour' },
      ] 
    },
    { type: 'json', name: 'entryList', label: 'Entries (JSON)' },
  ],
  { groupBy: 'none', entryList: [] } // Defaults for the wrapped object
);
```

You can use any wrapper key name:
- `'uiComponent'` for `{ uiComponent: {...} }`
- `'config'` for `{ config: {...} }`
- `'props'` for `{ props: {...} }`
- Or any other key name your component expects

### Custom Mapping with Type Safety

```tsx
import { type ComponentConfig, type ComponentAttributes } from 'grapesjs-react-renderer';

interface ComplexComponentProps {
  config: {
    title: string;
    data: Record<string, unknown>;
  };
}

const complexConfig: ComponentConfig<ComplexComponentProps> = {
  component: ComplexComponent,
  traits: [
    { type: 'text', name: 'title', label: 'Title' },
    { type: 'json', name: 'data', label: 'Data (JSON)' },
  ],
  mapProps: (attrs: ComponentAttributes): ComplexComponentProps => ({
    config: {
      title: String(attrs.title ?? ''),
      data: typeof attrs.data === 'string' 
        ? JSON.parse(attrs.data) 
        : (attrs.data as Record<string, unknown>),
    },
  }),
};
```

## Trait Types

- `text` - Text input
- `number` - Number input (with min/max/step)
- `select` - Dropdown select
- `checkbox` - Boolean checkbox
- `color` - Color picker
- `textarea` - Multi-line text
- `json` - JSON data (automatically parsed)

## Provider Support

Wrap your components with React providers (Redux, Context API, Theme, etc.):

### Single Provider (Redux)

```tsx
import { Provider } from 'react-redux';
import { store } from './store';

const plugin = createReactComponentsPlugin({
  components: { MyComponent },
  Provider,
  providerProps: { store },
});
```

### Multiple Providers (Nested)

```tsx
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { PostHogProvider } from 'posthog-js/react';

const plugin = createReactComponentsPlugin({
  components: { MyComponent },
  providers: [
    { component: ReduxProvider, props: { store } },
    { component: ThemeProvider, props: { theme } },
    { component: PostHogProvider, props: { client: posthog } },
  ],
});
```

### Custom Provider Tree

Use your entire app's provider tree:

```tsx
import { AppProvider } from '@/app/[locale]/provider';

const plugin = createReactComponentsPlugin({
  components: { MyComponent },
  Provider: AppProvider, // Your entire provider tree
});
```

### Custom Wrapper Function

For maximum flexibility:

```tsx
const plugin = createReactComponentsPlugin({
  components: { MyComponent },
  wrapComponent: (element, componentName) => {
    return (
      <AppProvider>
        <SomeOtherProvider>
          {element}
        </SomeOtherProvider>
      </AppProvider>
    );
  },
});
```

### Provider Helper Functions

```tsx
import { createReduxProvider, createProviderStack } from 'grapesjs-react-renderer/helpers';

// Redux helper
const reduxProvider = createReduxProvider(store);

// Provider stack helper
const providers = createProviderStack([
  [ReduxProvider, { store }],
  [ThemeProvider, { theme }],
]);
```

## API Reference

### `createReactComponentsPlugin(options)`

Main plugin factory function.

**Options:**
```tsx
interface ReactComponentsPluginOptions {
  components: ReactComponentMap | Record<string, ComponentConfig>;
  defaultComponent?: string;
  
  // Single provider
  Provider?: ProviderComponent;
  providerProps?: Record<string, unknown>;
  
  // Multiple providers (nested outer to inner)
  providers?: ProviderConfig[];
  
  // Custom wrapper function
  wrapComponent?: (element: React.ReactElement, componentName: string) => React.ReactElement;
}
```

### Factory Functions

#### `createSimpleComponentConfig<P>(component, traits, defaultProps)`

Factory for simple components with direct props.

```tsx
function createSimpleComponentConfig<P extends Record<string, unknown> = Record<string, unknown>>(
  component: React.ComponentType<P>,
  traits: TraitDefinition[],
  defaultProps?: Partial<P>
): ComponentConfig<P>
```

#### `createWrapperComponentConfig<P>(component, wrapperKey, traits, wrapperDefaults, defaultProps)`

Factory for components that expect props wrapped in a single key. Generic and flexible - works with any wrapper key name.

```tsx
function createWrapperComponentConfig<P extends Record<string, unknown> = Record<string, unknown>>(
  component: React.ComponentType<Record<string, P>>,
  wrapperKey: string,
  traits?: TraitDefinition[],
  wrapperDefaults?: Partial<P>,
  defaultProps?: Record<string, unknown>
): ComponentConfig<Record<string, P>>
```

**Example:**
```tsx
// Component expects { uiComponent: { title: string } }
createWrapperComponentConfig(MyComponent, 'uiComponent', traits, { title: 'Default' });

// Component expects { config: { theme: string } }
createWrapperComponentConfig(MyComponent, 'config', traits, { theme: 'light' });
```

#### `createUiComponentConfig<P>(component, customTraits, uiComponentDefaults)` ⚠️ Deprecated

Factory for components following the UiComponent pattern. **Deprecated** - use `createWrapperComponentConfig` instead for more flexibility.

```tsx
function createUiComponentConfig<P extends Record<string, unknown> = Record<string, unknown>>(
  component: React.ComponentType<{ uiComponent: P }>,
  customTraits?: TraitDefinition[],
  uiComponentDefaults?: Partial<P>
): ComponentConfig<{ uiComponent: P }>
```

#### `createJsonComponentConfig<P>(component, traits, jsonFields, defaultProps, mapProps)`

Factory for components needing JSON parsing.

```tsx
function createJsonComponentConfig<P extends Record<string, unknown> = Record<string, unknown>>(
  component: React.ComponentType<P>,
  traits: TraitDefinition[],
  jsonFields: readonly string[],
  defaultProps?: Partial<P>,
  mapProps?: (attrs: Record<string, unknown>) => P
): ComponentConfig<P>
```

### Helper Functions

```tsx
import { 
  parseJsonTrait,
  createWrapperMapper,
  mergeDefaults,
  commonTraits,
  createProvider,
  createReduxProvider,
  createProviderStack
} from 'grapesjs-react-renderer/helpers';
```

**Available helpers:**
- `parseJsonTrait<T>(value)` - Safely parse JSON trait values
- `createWrapperMapper(wrapperKey, defaults)` - Create a mapper that wraps props into a single key
- `mergeDefaults(defaults, attrs)` - Merge default props with attributes
- `commonTraits` - Reusable generic trait definitions:
  - `commonTraits.title` - Text input for title
  - `commonTraits.subtitle` - Text input for subtitle
  - `commonTraits.description` - Textarea for description
  - `commonTraits.textColor` - Color picker for text color
  - `commonTraits.backgroundColor` - Color picker for background color
  - `commonTraits.visible` - Checkbox for visibility
  - `commonTraits.disabled` - Checkbox for disabled state
- `createProvider(component, props)` - Create a provider config
- `createReduxProvider(store)` - Create Redux provider config (requires react-redux)
- `createProviderStack(providers)` - Create nested provider stack

## TypeScript

Full TypeScript support with generics and type inference. All types are exported:

```tsx
import type { 
  ComponentConfig,
  ComponentProps,
  ComponentAttributes,
  ReactComponent,
  ReactComponentMap,
  ProviderComponent,
  ProviderConfig,
  ProviderProps,
  TraitDefinition,
  ReactComponentsPluginOptions
} from 'grapesjs-react-renderer';
```

### Type-Safe Component Config

```tsx
interface MyComponentProps {
  title: string;
  count: number;
  enabled: boolean;
}

const config: ComponentConfig<MyComponentProps> = {
  component: MyComponent,
  defaultProps: {
    title: 'Default',
    count: 0,
    enabled: true,
  },
  mapProps: (attrs) => ({
    title: String(attrs.title ?? ''),
    count: Number(attrs.count ?? 0),
    enabled: Boolean(attrs.enabled ?? false),
  }),
};
```

### Generic Factory Functions

```tsx
interface ButtonProps {
  label: string;
  href: string;
}

const buttonConfig = createSimpleComponentConfig<ButtonProps>(
  Button,
  [
    { type: 'text', name: 'label', label: 'Label' },
    { type: 'text', name: 'href', label: 'URL' },
  ],
  { label: 'Click me', href: '#' }
);
```

## Examples

See the [examples directory](./examples/) for complete examples including:
- Simple components with type safety
- Complex nested data with JSON traits
- Custom prop mapping
- UI Component pattern
- Provider support (Redux, multiple providers, custom trees)

## Important Notes

1. **Provider Order**: When using `providers` array, providers are nested from first (outermost) to last (innermost)
2. **Iframe Context**: Providers are rendered inside the GrapesJS canvas iframe, so they're isolated from the main app
3. **Store Sharing**: If you need the same store across multiple iframes, consider using a global store or window-based access
4. **Type Safety**: All functions use generics for type inference - specify prop types for full type safety
5. **JSON Traits**: Automatically parsed from strings to objects/arrays

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

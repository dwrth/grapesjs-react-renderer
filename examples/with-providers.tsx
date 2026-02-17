/**
 * Example: Using React Components Plugin with Providers
 * 
 * This shows how to wrap components with Redux, Context API, or custom provider trees
 */

import grapesjs from 'grapesjs';
import createReactComponentsPlugin from 'grapesjs-react-renderer';
import { createReduxProvider, createProviderStack } from 'grapesjs-react-renderer/helpers';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { store } from './store';
import { theme } from './theme';
import MyComponent from './components/MyComponent';

// Example 1: Single Provider (Redux)
const pluginWithRedux = createReactComponentsPlugin({
  components: { MyComponent },
  Provider: ReduxProvider,
  providerProps: { store },
});

// Example 2: Multiple Providers (Nested)
const pluginWithMultipleProviders = createReactComponentsPlugin({
  components: { MyComponent },
  providers: [
    { component: ReduxProvider, props: { store } },
    { component: ThemeProvider, props: { theme } },
  ],
});

// Example 3: Using Helper Functions
const reduxProvider = createReduxProvider(store);
const pluginWithHelper = createReactComponentsPlugin({
  components: { MyComponent },
  Provider: reduxProvider.component,
  providerProps: reduxProvider.props,
});

// Example 4: Provider Stack Helper
const providers = createProviderStack([
  [ReduxProvider, { store }],
  [ThemeProvider, { theme }],
]);

const pluginWithStack = createReactComponentsPlugin({
  components: { MyComponent },
  providers,
});

// Example 5: Custom Provider Tree (like AppProvider)
import { AppProvider } from '@/app/[locale]/provider';

const pluginWithAppProvider = createReactComponentsPlugin({
  components: { MyComponent },
  Provider: AppProvider, // Your entire provider tree
});

// Example 6: Custom Wrapper Function
const pluginWithCustomWrapper = createReactComponentsPlugin({
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

// Initialize editor
const editor = grapesjs.init({
  container: '#gjs',
  plugins: [pluginWithRedux], // Use any of the above plugins
});

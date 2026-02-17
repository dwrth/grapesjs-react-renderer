/**
 * Basic usage example
 */

import grapesjs from 'grapesjs';
import createReactComponentsPlugin from 'grapesjs-react-renderer';
import { createSimpleComponentConfig } from 'grapesjs-react-renderer/factories';
import Button from './components/Button';
import Hero from './components/Hero';

// Simple component config
const buttonConfig = createSimpleComponentConfig(
  Button,
  [
    { type: 'text', name: 'label', label: 'Button Label', defaultValue: 'Click me' },
    { type: 'text', name: 'href', label: 'Link URL', defaultValue: '#' },
  ],
  { label: 'Get Started', href: '#start' }
);

// Initialize editor
const editor = grapesjs.init({
  container: '#gjs',
  plugins: [
    createReactComponentsPlugin({
      components: {
        Hero, // Simple component (uses defaults)
        Button: buttonConfig, // Configured component
      },
      defaultComponent: 'Hero',
    }),
  ],
});
